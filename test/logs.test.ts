import type { AddressInfo } from 'node:net';
import { Readable } from 'node:stream';

import { Log } from '@apify/log';

import { ApifyClient } from 'apify-client';
import type { Page } from 'puppeteer';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

import type { LogClient } from '../src/resource_clients/log.js';
import { StreamedLog } from '../src/resource_clients/log.js';

import { DEFAULT_OPTIONS, asBrowserResult, Browser, validateRequest } from './_helper.js';
import { mockServer } from './mock_server/server.js';

describe('Log methods', () => {
    let baseUrl: string;
    const browser = new Browser();

    beforeAll(async () => {
        const server = await mockServer.start();
        await browser.start();
        baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
    });

    afterAll(async () => {
        await Promise.all([mockServer.close(), browser.cleanUpBrowser()]);
    });

    let client: ApifyClient;
    let page: Page;
    beforeEach(async () => {
        page = await browser.getInjectedPage(baseUrl, DEFAULT_OPTIONS);
        client = new ApifyClient({
            baseUrl,
            maxRetries: 0,
            ...DEFAULT_OPTIONS,
        });
    });
    afterEach(async () => {
        client = null as unknown as ApifyClient;
        page.close().catch(() => {});
    });

    describe('log(buildOrRunId)', () => {
        test('get() works', async () => {
            const logId = 'some-id';

            const res = await client.log(logId).get();
            expect(res).toBe('get-log');
            validateRequest({ query: {}, params: { logId } });

            const browserRes = await page.evaluate((id) => client.log(id).get(), logId);
            expect(browserRes).toEqual(asBrowserResult(res));
            validateRequest({ query: {}, params: { logId } });
        });

        test('get() returns undefined on 404 status code (RECORD_NOT_FOUND)', async () => {
            const logId = '404';

            const res = await client.log(logId).get();
            expect(res).toBeUndefined();
            validateRequest({ query: {}, params: { logId } });

            const browserRes = await page.evaluate((id) => client.log(id).get(), logId);
            expect(browserRes).toBeUndefined();
        });

        test('stream() works', async () => {
            const logId = 'some-id';

            const res = await client.log(logId).stream();
            const chunks = [];

            if (!res) {
                throw new Error('Expected stream to be defined');
            }

            for await (const chunk of res) {
                chunks.push(chunk);
            }
            const id = Buffer.concat(chunks).toString();
            expect(id).toBe('get-log');
            validateRequest({ query: { stream: true }, params: { logId } });
        });

        test('stream() returns undefined on 404 status code', async () => {
            const logId = '404';

            const res = await client.log(logId).stream();
            expect(res).toBeUndefined();
            validateRequest({ query: { stream: true }, params: { logId } });
        });
    });
});

test('StreamedLog redirects the whole log when stop() lands while an empty log stream is being reopened', async () => {
    const lines = [0, 1, 2].map((i) => `2025-01-01T00:00:0${i}.000Z line ${i}\n`);
    const { promise: reopenedStreamGate, resolve: openReopenedStream } = Promise.withResolvers<void>();
    const stream = vi
        .fn()
        .mockResolvedValueOnce(Readable.from([]))
        .mockImplementationOnce(async () => {
            await reopenedStreamGate;
            return Readable.from(lines.map((line) => Buffer.from(line)));
        });
    const logClient = { stream, get: vi.fn().mockResolvedValue(lines.join('')) } as unknown as LogClient;
    const toLog = new Log();
    const info = vi.spyOn(toLog, 'info').mockImplementation(() => {});

    const streamedLog = new StreamedLog({ toLog, logClient });
    streamedLog.start();
    await vi.waitFor(() => expect(stream).toHaveBeenCalledTimes(2), { timeout: 5_000 });
    const stopping = streamedLog.stop();
    openReopenedStream();
    await stopping;

    expect(info.mock.calls).toEqual(lines.map((line) => [line.trim()]));
});

test('StreamedLog neither reopens nor reads a log that does not exist', async () => {
    const stream = vi.fn().mockResolvedValue(undefined);
    const get = vi.fn();
    const logClient = { stream, get } as unknown as LogClient;

    const streamedLog = new StreamedLog({ toLog: new Log(), logClient });
    streamedLog.start();
    await streamedLog.stop();

    expect(stream).toHaveBeenCalledTimes(1);
    expect(get).not.toHaveBeenCalled();
});
