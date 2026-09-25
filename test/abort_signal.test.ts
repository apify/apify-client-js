import http from 'node:http';
import type { AddressInfo } from 'node:net';

import { ApifyClient } from 'apify-client';
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

import type * as utils from '../src/utils.js';

// The server answers with bodies shaped for the polling mechanics, not for the API's schemas.
vi.mock('../src/utils', async (importOriginal) => {
    const actual = await importOriginal<typeof utils>();
    return {
        ...actual,
        parseResponse: (response: { data: unknown }) => actual.pluckData(response.data as never),
    };
});

type Handler = (req: http.IncomingMessage, res: http.ServerResponse) => void;

/** Answers a job lookup with a job that is still running, so the polling methods keep polling. */
const runningJob: Handler = (_req, res) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ data: { id: 'job-id', status: 'RUNNING' } }));
};

describe('AbortSignal in resource-client methods', () => {
    let server: http.Server;
    let client: ApifyClient;
    /** Paths of the requests the server received, oldest first. */
    let received: string[];
    let handler: Handler;

    beforeAll(async () => {
        server = http.createServer((req, res) => {
            received.push(`${req.method} ${new URL(req.url!, 'http://x').pathname}`);
            req.resume();
            req.on('end', () => handler(req, res));
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
        received = [];
        handler = runningJob;
        client = new ApifyClient({
            baseUrl: `http://localhost:${(server.address() as AddressInfo).port}`,
            minDelayBetweenRetriesMillis: 1,
        });
    });

    /** Aborts `controller` once the server has received `count` requests, leaving the last one unanswered. */
    const abortAfterRequests = (controller: AbortController, count: number) => {
        handler = (req, res) => {
            if (received.length < count) {
                runningJob(req, res);
                return;
            }
            controller.abort(new Error('shutting down'));
        };
    };

    test.each([
        {
            name: 'RunClient',
            waitForFinish: (c: ApifyClient, signal: AbortSignal) => c.run('job-id').waitForFinish({ signal }),
        },
        {
            name: 'BuildClient',
            waitForFinish: (c: ApifyClient, signal: AbortSignal) => c.build('job-id').waitForFinish({ signal }),
        },
    ])('waitForFinish() of $name stops polling and rejects with the reason', async ({ waitForFinish }) => {
        const controller = new AbortController();
        abortAfterRequests(controller, 3);

        await expect(waitForFinish(client, controller.signal)).rejects.toThrow('shutting down');
        expect(received).toHaveLength(3);
    });

    test.each([
        {
            name: 'ActorClient',
            call: (c: ApifyClient, signal: AbortSignal) => c.actor('actor-id').call(undefined, { log: null, signal }),
            startPath: 'POST /v2/actors/actor-id/runs',
        },
        {
            name: 'TaskClient',
            call: (c: ApifyClient, signal: AbortSignal) => c.task('task-id').call(undefined, { signal }),
            startPath: 'POST /v2/actor-tasks/task-id/runs',
        },
    ])('call() of $name stops polling the run and rejects with the reason', async ({ call, startPath }) => {
        const controller = new AbortController();
        abortAfterRequests(controller, 3);

        await expect(call(client, controller.signal)).rejects.toThrow('shutting down');
        expect(received).toEqual([startPath, 'GET /v2/actor-runs/job-id', 'GET /v2/actor-runs/job-id']);
    });

    test('a signal that already aborted sends nothing', async () => {
        const controller = new AbortController();
        controller.abort(new Error('shutting down'));

        await expect(client.dataset('dataset-id').get({ signal: controller.signal })).rejects.toThrow('shutting down');
        expect(received).toEqual([]);
    });

    test('batchAddRequests() rejects with the reason instead of reporting the requests as unprocessed', async () => {
        const controller = new AbortController();
        abortAfterRequests(controller, 1);

        const call = client
            .requestQueue('queue-id')
            .batchAddRequests([{ url: 'http://example.com', uniqueKey: 'x' }], { signal: controller.signal });

        await expect(call).rejects.toThrow('shutting down');
        expect(received).toEqual(['POST /v2/request-queues/queue-id/requests/batch']);
    });
});
