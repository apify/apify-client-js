import http from 'node:http';
import type { AddressInfo } from 'node:net';

import { ApifyClient } from 'apify-client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

import type * as utils from '../src/utils.js';

// The server answers with bodies shaped for the polling mechanics, not for the API's schemas.
vi.mock('../src/utils', async (importOriginal) => {
    const actual = await importOriginal<typeof utils>();
    return {
        ...actual,
        parseResponse: (response: { data: unknown }) => actual.pluckData(response.data as never),
    };
});

/** What the server answers each job lookup with: a 404, or a job in the given status. */
type Answer = 404 | 'RUNNING' | 'SUCCEEDED';

describe('waitForFinish() on a job that returns 404', () => {
    let server: http.Server;
    let client: ApifyClient;
    let received: number;
    /** Answers for the upcoming lookups, oldest first. The last one repeats once the rest are used up. */
    let answers: Answer[];
    /** Milliseconds added to `Date.now()`. Every 404 advances it by a second, so the grace window passes quickly. */
    let clockOffsetMillis: number;

    beforeAll(async () => {
        server = http.createServer((req, res) => {
            const answer = answers.length > 1 ? answers.shift()! : answers[0];
            received += 1;
            req.resume();
            req.on('end', () => {
                res.setHeader('content-type', 'application/json');
                if (answer === 404) {
                    clockOffsetMillis += 1000;
                    res.statusCode = 404;
                    res.end(JSON.stringify({ error: { type: 'record-not-found', message: 'not found' } }));
                } else {
                    res.end(JSON.stringify({ data: { id: 'job-id', status: answer } }));
                }
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
        received = 0;
        clockOffsetMillis = 0;
        const realNow = Date.now.bind(Date);
        vi.spyOn(Date, 'now').mockImplementation(() => realNow() + clockOffsetMillis);
        client = new ApifyClient({ baseUrl: `http://localhost:${(server.address() as AddressInfo).port}` });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test.each([
        { name: 'run', waitForFinish: (c: ApifyClient) => c.run('job-id').waitForFinish() },
        { name: 'build', waitForFinish: (c: ApifyClient) => c.build('job-id').waitForFinish() },
    ])('of a $name throws once the grace window for a missing job passes', async ({ name, waitForFinish }) => {
        answers = [404];

        await expect(waitForFinish(client)).rejects.toThrow(`Waiting for ${name} to finish failed`);
        expect(received).toBeLessThanOrEqual(5);
    });

    test('a successful lookup resets the grace window for a missing job', async () => {
        answers = [404, 404, 404, 'RUNNING', 404, 404, 404, 'SUCCEEDED'];

        await expect(client.run('job-id').waitForFinish()).resolves.toMatchObject({ status: 'SUCCEEDED' });
        expect(received).toBe(8);
    });
});
