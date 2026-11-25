import http from 'node:http';
import type { AddressInfo } from 'node:net';

import { ApifyClient } from 'apify-client';
import { AxiosHttpClient } from 'apify-client/axios';
import { AxiosError } from 'axios';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';

import { runtime } from '../src/runtime/node.js';
import { mockServer } from './mock_server/server.js';

describe('AxiosHttpClient', () => {
    let baseUrl: string;

    beforeAll(async () => {
        const server = await mockServer.start();
        baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
    });

    afterAll(async () => {
        await mockServer.close();
    });

    /** A resource id the mock server reads as "answer after this many milliseconds". */
    const delayedResourceId = (delayMillis: number) => Buffer.from(JSON.stringify({ delayMillis })).toString('hex');

    const clientWith = (httpClient: AxiosHttpClient) =>
        ApifyClient.withCustomHttpClient({ baseUrl, token: 'test_token', httpClient });

    test('sends the requests of an ApifyClient', async () => {
        const httpClient = new AxiosHttpClient();

        const user = await clientWith(httpClient).user('me').get();

        expect(user?.id).toBe('get-user');
        expect(mockServer.getLastRequest()?.headers.authorization).toBe('Bearer test_token');
        await httpClient.close();
    });

    test('streams a response as a web stream, and cancelling it releases the connection', async () => {
        const httpClient = new AxiosHttpClient();
        const request = { url: `${baseUrl}/v2/users/me`, method: 'GET', responseType: 'stream' } as const;

        const read = await httpClient.call<ReadableStream<Uint8Array>>(request);
        expect(read.data).toBeInstanceOf(ReadableStream);
        expect((await new Response(read.data).json()).data.id).toBe('get-user');

        const cancelled = await httpClient.call<ReadableStream<Uint8Array>>(request);
        await cancelled.data.cancel();
        // A cancelled stream destroys its socket instead of handing it back to the pool.
        await vi.waitFor(() => expect(Object.keys(httpClient.httpAgent!.sockets)).toEqual([]));
        await httpClient.close();
    });

    test('uploads a web stream body', async () => {
        const httpClient = new AxiosHttpClient();

        await clientWith(httpClient)
            .keyValueStore('some-id')
            .setRecord({ key: 'some-key', value: new Response('streamed').body!, contentType: 'text/plain' });

        expect(mockServer.getLastRequest()?.body).toBe('streamed');
        await httpClient.close();
    });

    test('sendRequest() outside Node.js sends a web stream body through fetch', async () => {
        runtime.isNode = false;
        try {
            const response = await new AxiosHttpClient().sendRequest({
                method: 'PUT',
                url: `${baseUrl}/v2/key-value-stores/some-id/records/some-key`,
                headers: { 'content-type': 'text/plain' },
                body: new Response('streamed').body!,
                stream: false,
                followRedirects: true,
            });

            expect(response.status).toBe(200);
            expect(mockServer.getLastRequest()?.body).toBe('streamed');
        } finally {
            runtime.isNode = true;
        }
    });

    test('requests time out after the duration configured for their tier', async () => {
        const httpClient = new AxiosHttpClient({ timeoutShortSecs: 1, maxRetries: 0 });

        // `get()` sits in the short tier, which the client above shortens to one second.
        await expect(clientWith(httpClient).actor(delayedResourceId(3000)).get()).rejects.toThrow(
            'timeout of 1000ms exceeded',
        );
        await httpClient.close();
    });

    test('runs the request interceptors passed to the client', async () => {
        const httpClient = new AxiosHttpClient({
            requestInterceptors: [
                (config) => {
                    config.headers.set('X-Intercepted', 'yes');
                    return config;
                },
            ],
        });
        const user = await clientWith(httpClient).user('me').get();

        expect(user?.id).toBe('get-user');
        const request = mockServer.getLastRequest();
        expect(request?.headers['x-intercepted']).toBe('yes');
        expect(request?.headers.authorization).toBe('Bearer test_token');
        await httpClient.close();
    });

    test('sendRequest() without redirects outside Node.js leaves the User-Agent header to the runtime', async () => {
        runtime.isNode = false;
        try {
            await new AxiosHttpClient().sendRequest({
                method: 'GET',
                url: `${baseUrl}/v2/users/me`,
                headers: {},
                stream: false,
                followRedirects: false,
            });
        } finally {
            runtime.isNode = true;
        }

        expect(mockServer.getLastRequest()?.headers['user-agent']).not.toMatch(/^axios\//);
    });

    test('sendRequest() streams a response outside Node.js as a web stream', async () => {
        runtime.isNode = false;
        try {
            const response = await new AxiosHttpClient().sendRequest({
                method: 'GET',
                url: `${baseUrl}/v2/users/me`,
                headers: {},
                stream: true,
                followRedirects: true,
            });

            expect(response.body).toBeInstanceOf(ReadableStream);
            const user = await new Response(response.body as ReadableStream).json();
            expect(user.data.id).toBe('get-user');
        } finally {
            runtime.isNode = true;
        }
    });

    test('sendRequest() outside Node.js streams a response without a body as an empty web stream', async () => {
        const server = http.createServer((_req, res) => res.writeHead(204).end());
        await new Promise<void>((resolve) => server.listen(0, resolve));

        runtime.isNode = false;
        try {
            const response = await new AxiosHttpClient().sendRequest({
                method: 'GET',
                url: `http://localhost:${(server.address() as AddressInfo).port}`,
                headers: {},
                stream: true,
                followRedirects: true,
            });

            expect(response.body).toBeInstanceOf(ReadableStream);
            expect(await new Response(response.body as ReadableStream).text()).toBe('');
        } finally {
            runtime.isNode = true;
            server.close();
        }
    });

    test('sendRequest() outside Node.js times a streamed response only until its headers', async () => {
        const chunks = ['a', 'b', 'c', 'd', 'e'];
        // The headers and the first chunk go out at once, the rest takes longer than the timeout.
        const server = http.createServer((req, res) => {
            if (req.url === '/silent') return;
            res.writeHead(200, { 'content-type': 'text/plain' });
            let sent = 0;
            res.write(chunks[sent++]);
            const timer = setInterval(() => {
                if (sent < chunks.length) return res.write(chunks[sent++]);
                clearInterval(timer);
                return res.end();
            }, 150);
            res.on('close', () => clearInterval(timer));
        });
        await new Promise<void>((resolve) => server.listen(0, resolve));
        const url = `http://localhost:${(server.address() as AddressInfo).port}`;
        const httpClient = new AxiosHttpClient();
        const request = {
            method: 'GET',
            headers: {},
            stream: true,
            followRedirects: true,
            timeoutMillis: 300,
        } as const;

        runtime.isNode = false;
        try {
            const response = await httpClient.sendRequest({ ...request, url });
            expect(await new Response(response.body as ReadableStream).text()).toBe(chunks.join(''));

            const error = await httpClient.sendRequest({ ...request, url: `${url}/silent` }).catch((err) => err);
            expect(error.message).toBe('timeout of 300ms exceeded');
            expect(httpClient.isTimeoutError(error)).toBe(true);
            expect(httpClient.isRetryableTransportError(error)).toBe(true);
        } finally {
            runtime.isNode = true;
            server.closeAllConnections();
            server.close();
        }
    });

    test('close() destroys the keep-alive agents', async () => {
        const httpClient = new AxiosHttpClient();
        await clientWith(httpClient).user('me').get();
        const destroyed = [httpClient.httpAgent!, httpClient.httpsAgent!].map((agent) => vi.spyOn(agent, 'destroy'));

        await httpClient.close();

        for (const destroy of destroyed) expect(destroy).toHaveBeenCalled();
    });

    test('sends the requests through an agent passed in the options, and leaves it open on close()', async () => {
        const httpAgent = new http.Agent({ keepAlive: true });
        const createConnection = vi.spyOn(httpAgent, 'createConnection');
        const destroy = vi.spyOn(httpAgent, 'destroy');
        const httpClient = new AxiosHttpClient({ httpAgent });

        await clientWith(httpClient).user('me').get();
        await httpClient.close();

        expect(httpClient.httpAgent).toBe(httpAgent);
        expect(createConnection).toHaveBeenCalled();
        expect(destroy).not.toHaveBeenCalled();
        httpAgent.destroy();
    });

    test('close() before any request has nothing to destroy', async () => {
        await expect(new AxiosHttpClient().close()).resolves.toBeUndefined();
    });

    test.each([
        { name: 'an aborted request', error: new AxiosError('timeout', AxiosError.ECONNABORTED), expected: true },
        { name: 'a clarified timeout', error: new AxiosError('timeout', AxiosError.ETIMEDOUT), expected: true },
        { name: 'a TimeoutError', error: Object.assign(new Error('late'), { name: 'TimeoutError' }), expected: true },
        { name: 'a network error', error: new AxiosError('reset', AxiosError.ERR_NETWORK), expected: false },
        { name: 'a plain error', error: new Error('boom'), expected: false },
    ])('isTimeoutError() classifies $name', ({ error, expected }) => {
        expect(new AxiosHttpClient().isTimeoutError(error)).toBe(expected);
    });

    test('isRetryableTransportError() retries axios errors raised while a request was in flight', () => {
        const httpClient = new AxiosHttpClient();
        const config = { headers: {} } as any;
        const inFlight = new AxiosError('reset', AxiosError.ERR_NETWORK, config, {});
        const beforeRequest = new AxiosError('bad url', AxiosError.ERR_BAD_OPTION, config);

        expect(httpClient.isRetryableTransportError(inFlight)).toBe(true);
        expect(httpClient.isRetryableTransportError(beforeRequest)).toBe(false);
        expect(httpClient.isRetryableTransportError(new Error('boom'))).toBe(false);
    });
});
