import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { Readable } from 'node:stream';

import { ApifyClient } from 'apify-client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, onTestFinished, test, vi } from 'vitest';

import log from '@apify/log';

import type * as utils from '../src/utils.js';

const { sleeps } = vi.hoisted(() => ({ sleeps: [] as number[] }));

// The cooldown sleeps resolve at once and move the fake clock forward by their length. The server answers with bodies
// shaped for the retry mechanics, so `parseResponse` skips the API's schemas.
vi.mock('../src/utils', async (importOriginal) => {
    const actual = await importOriginal<typeof utils>();
    return {
        ...actual,
        parseResponse: (response: { data: unknown }) => actual.pluckData(response.data as never),
        sleep: vi.fn(async (millis: number, signal?: AbortSignal) => {
            sleeps.push(millis);
            vi.setSystemTime(Date.now() + millis);
            signal?.dispatchEvent(new Event('cooldown'));
        }),
    };
});

type Starter = (client: ApifyClient, options: Record<string, unknown>) => Promise<unknown>;

const STARTERS: { name: string; start: Starter; startPath: string }[] = [
    {
        name: 'ActorClient.start()',
        start: async (c, options) => c.actor('actor-id').start(undefined, options),
        startPath: 'POST /v2/actors/actor-id/runs',
    },
    {
        name: 'ActorClient.call()',
        start: async (c, options) => c.actor('actor-id').call(undefined, { log: null, ...options }),
        startPath: 'POST /v2/actors/actor-id/runs',
    },
    {
        name: 'TaskClient.start()',
        start: async (c, options) => c.task('task-id').start(undefined, options),
        startPath: 'POST /v2/actor-tasks/task-id/runs',
    },
    {
        name: 'TaskClient.call()',
        start: async (c, options) => c.task('task-id').call(undefined, options),
        startPath: 'POST /v2/actor-tasks/task-id/runs',
    },
];

describe('waitForResources option', () => {
    let server: http.Server;
    let client: ApifyClient;
    /** Paths of the start requests the server received, oldest first. */
    let starts: string[];
    /** Error types to reject the upcoming start requests with, one per request. */
    let rejections: string[];

    beforeAll(async () => {
        server = http.createServer((req, res) => {
            const path = new URL(req.url!, 'http://x').pathname;
            req.resume();
            req.on('end', () => {
                res.setHeader('content-type', 'application/json');
                if (req.method === 'POST') {
                    starts.push(`POST ${path}`);
                    const type = rejections.shift();
                    if (type) {
                        res.statusCode = type === 'invalid-input' ? 400 : 402;
                        res.end(JSON.stringify({ error: { type, message: `Rejected: ${type}` } }));
                        return;
                    }
                    res.statusCode = 201;
                }
                res.end(
                    JSON.stringify({ data: { id: 'run-id', status: req.method === 'POST' ? 'READY' : 'SUCCEEDED' } }),
                );
            });
        });
        await new Promise<void>((resolve) => {
            server.listen(0, resolve);
        });
    });

    afterAll(async () => {
        server.closeAllConnections();
        await new Promise((resolve) => {
            server.close(resolve);
        });
    });

    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'] });
        starts = [];
        rejections = [];
        sleeps.length = 0;
        client = new ApifyClient({ baseUrl: `http://localhost:${(server.address() as AddressInfo).port}` });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe.each(STARTERS)('$name', ({ start, startPath }) => {
        test.each(['actor-memory-limit-exceeded', 'concurrent-runs-limit-exceeded'])(
            'retries a start rejected with %s every 10 seconds until it succeeds',
            async (type) => {
                rejections = [type, type];

                await expect(start(client, { waitForResources: true })).resolves.toMatchObject({ id: 'run-id' });
                expect(starts).toEqual([startPath, startPath, startPath]);
                expect(sleeps).toEqual([10_000, 10_000]);
            },
        );

        test('throws the first rejection without the option', async () => {
            rejections = ['actor-memory-limit-exceeded'];

            await expect(start(client, {})).rejects.toMatchObject({ type: 'actor-memory-limit-exceeded' });
            expect(starts).toEqual([startPath]);
        });
    });

    test('throws the first rejection when the option is false', async () => {
        rejections = ['concurrent-runs-limit-exceeded'];

        await expect(client.actor('actor-id').start(undefined, { waitForResources: false })).rejects.toMatchObject({
            type: 'concurrent-runs-limit-exceeded',
        });
        expect(starts).toHaveLength(1);
    });

    test('throws any other error right away', async () => {
        rejections = ['invalid-input'];

        await expect(client.actor('actor-id').start(undefined, { waitForResources: true })).rejects.toMatchObject({
            type: 'invalid-input',
        });
        expect(starts).toHaveLength(1);
        expect(sleeps).toEqual([]);
    });

    test('a number of seconds bounds the retrying and throws the last rejection', async () => {
        rejections = Array(10).fill('actor-memory-limit-exceeded');
        const info = vi.spyOn(log, 'info').mockImplementation(() => {});
        onTestFinished(() => info.mockRestore());

        await expect(client.actor('actor-id').start(undefined, { waitForResources: 25 })).rejects.toMatchObject({
            type: 'actor-memory-limit-exceeded',
        });
        // Attempts at 0, 10, 20 and 25 seconds, the last cooldown cut short by the bound.
        expect(starts).toHaveLength(4);
        expect(sleeps).toEqual([10_000, 10_000, 5_000]);
        expect(info.mock.calls.map(([message]) => message)).toEqual([
            'Not enough resources to start the run (actor-memory-limit-exceeded), retrying in 10s.',
            'Not enough resources to start the run (actor-memory-limit-exceeded), retrying in 10s.',
            'Not enough resources to start the run (actor-memory-limit-exceeded), retrying in 5s.',
        ]);
    });

    test('zero seconds makes a single attempt', async () => {
        rejections = ['actor-memory-limit-exceeded'];

        await expect(client.actor('actor-id').start(undefined, { waitForResources: 0 })).rejects.toMatchObject({
            type: 'actor-memory-limit-exceeded',
        });
        expect(starts).toHaveLength(1);
    });

    test('a signal that aborts during the cooldown rejects with its reason', async () => {
        rejections = Array(10).fill('actor-memory-limit-exceeded');
        const controller = new AbortController();
        controller.signal.addEventListener('cooldown', () => controller.abort(new Error('shutting down')));

        await expect(
            client.actor('actor-id').start(undefined, { waitForResources: true, signal: controller.signal }),
        ).rejects.toThrow('shutting down');
        expect(starts).toHaveLength(1);
    });

    test('never retries the start of a Readable input', async () => {
        rejections = ['actor-memory-limit-exceeded'];

        await expect(
            client.actor('actor-id').start(Readable.from(['{"foo":"bar"}']), {
                contentType: 'application/json',
                waitForResources: true,
            }),
        ).rejects.toMatchObject({ type: 'actor-memory-limit-exceeded' });
        expect(starts).toHaveLength(1);
        expect(sleeps).toEqual([]);
    });

    test('rejects a negative number of seconds', async () => {
        await expect(client.actor('actor-id').start(undefined, { waitForResources: -1 })).rejects.toThrow(
            /waitForResources/,
        );
        expect(starts).toEqual([]);
    });
});
