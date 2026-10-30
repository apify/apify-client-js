import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Readable } from 'node:stream';

import log, { Log } from '@apify/log';

import { ApifyClient } from 'apify-client';
import type { Page } from 'puppeteer';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, expectTypeOf, test, vi } from 'vitest';

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

        test('get({ buffer: true }) returns the log as raw bytes', async () => {
            const logId = 'some-id';

            const res = await client.log(logId).get({ buffer: true });
            expectTypeOf(res).toEqualTypeOf<Buffer | undefined>();
            expectTypeOf(() => client.log(logId).get()).returns.resolves.toEqualTypeOf<string | undefined>();
            expect(res).toBeInstanceOf(Buffer);
            expect(res!.toString()).toBe('get-log');
            validateRequest({ query: {}, params: { logId } });

            const browserRes = await page.evaluate(async (id) => {
                const buffer = await client.log(id).get({ buffer: true });
                return { isArrayBuffer: buffer instanceof ArrayBuffer, text: new TextDecoder().decode(buffer) };
            }, logId);
            expect(browserRes).toEqual({ isArrayBuffer: true, text: 'get-log' });
            validateRequest({ query: {}, params: { logId } });
        });

        test('get({ buffer: true }) passes the raw option to the API', async () => {
            const logId = 'some-id';

            await client.log(logId).get({ buffer: true, raw: true });
            validateRequest({ query: { raw: true }, params: { logId } });
        });

        test('get({ buffer: true }) returns undefined on 404 status code (RECORD_NOT_FOUND)', async () => {
            const logId = '404';

            const res = await client.log(logId).get({ buffer: true });
            expect(res).toBeUndefined();
            validateRequest({ query: {}, params: { logId } });

            const browserRes = await page.evaluate((id) => client.log(id).get({ buffer: true }), logId);
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

test('StreamedLog doubles the pause between empty log streams up to its cap', async () => {
    vi.useFakeTimers();
    try {
        const streamTimes: number[] = [];
        const stream = vi.fn().mockImplementation(async () => {
            streamTimes.push(Date.now());
            const chunks = streamTimes.length <= 6 ? [] : [Buffer.from('2025-01-01T00:00:00.000Z line\n')];
            return Readable.from(chunks);
        });
        const logClient = { stream, get: vi.fn() } as unknown as LogClient;
        const toLog = new Log();
        vi.spyOn(toLog, 'info').mockImplementation(() => {});

        const streamedLog = new StreamedLog({ toLog, logClient });
        streamedLog.start();
        await vi.advanceTimersByTimeAsync(17_500);
        await streamedLog.stop();

        const pauses = streamTimes.slice(1).map((time, i) => time - streamTimes[i]);
        expect(pauses).toEqual([500, 1_000, 2_000, 4_000, 5_000, 5_000]);
    } finally {
        vi.useRealTimers();
    }
});

test('StreamedLog reads the whole log when the stop grace period ends while a log stream is connecting', async () => {
    const lines = [0, 1, 2].map((i) => `2025-01-01T00:00:0${i}.000Z line ${i}\n`);
    const stream = vi.fn().mockImplementation(
        async ({ signal }: { signal: AbortSignal }) =>
            new Promise((_, reject) => {
                signal.addEventListener('abort', () => reject(signal.reason), { once: true });
            }),
    );
    const logClient = { stream, get: vi.fn().mockResolvedValue(lines.join('')) } as unknown as LogClient;
    const toLog = new Log();
    const info = vi.spyOn(toLog, 'info').mockImplementation(() => {});

    const streamedLog = new StreamedLog({ toLog, logClient });
    streamedLog.start();
    await vi.waitFor(() => expect(stream).toHaveBeenCalled());
    await streamedLog.stop();

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

test('StreamedLog reports a failing one-shot log read and still stops', async () => {
    const stream = vi.fn().mockImplementation(async () => Readable.from([]));
    const get = vi.fn().mockRejectedValue(new Error('Simulated log read failure'));
    const logClient = { stream, get } as unknown as LogClient;
    const warning = vi.spyOn(log, 'warning').mockImplementation(() => {});

    try {
        const streamedLog = new StreamedLog({ toLog: new Log(), logClient });
        streamedLog.start();
        await vi.waitFor(() => expect(stream).toHaveBeenCalled());
        await streamedLog.stop();

        expect(get).toHaveBeenCalledTimes(1);
        expect(warning).toHaveBeenCalledWith('Log redirection stopped due to error', expect.any(Error));
    } finally {
        warning.mockRestore();
    }
});

test('StreamedLog keeps redirecting a log that stays quiet for longer than the long timeout tier', async () => {
    const lines = [0, 1].map((i) => `2025-01-01T00:00:0${i}.000Z line ${i}\n`);
    const server = createServer((_req, res) => {
        res.writeHead(200, { 'content-type': 'text/plain' });
        res.write(lines[0]);
        setTimeout(() => res.end(lines[1]), 2_000);
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const client = new ApifyClient({
        baseUrl: `http://localhost:${(server.address() as AddressInfo).port}`,
        maxRetries: 0,
        timeoutLongSecs: 1,
        timeoutMaxSecs: 1,
        ...DEFAULT_OPTIONS,
    });
    const toLog = new Log();
    const info = vi.spyOn(toLog, 'info').mockImplementation(() => {});
    const warning = vi.spyOn(log, 'warning').mockImplementation(() => {});

    try {
        const streamedLog = new StreamedLog({ toLog, logClient: client.run('run-id').log() });
        streamedLog.start();
        await vi.waitFor(() => expect(info).toHaveBeenCalledTimes(2), { timeout: 5_000 });
        await streamedLog.stop();

        expect(info.mock.calls).toEqual(lines.map((line) => [line.trim()]));
        expect(warning).not.toHaveBeenCalled();
    } finally {
        warning.mockRestore();
        await new Promise<void>((resolve) => server.close(() => resolve()));
    }
});
