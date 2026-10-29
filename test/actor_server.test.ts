import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { gunzipSync, gzipSync } from 'node:zlib';

import {
    ApifyClient,
    ApifyClientError,
    ArgumentValidationError,
    GzipHttpCompressor,
    NotFoundError,
} from 'apify-client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

import * as fixtures from './mock_server/fixtures.js';

const ACTOR_ID = 'test-actor-id';
const ACTOR_PATH = `/v2/actors/${ACTOR_ID}`;
const SERVER_PREFIX = '/server';
const OPENAPI_SPEC = { openapi: '3.0.0', info: { title: 'Test server', version: '1.0.0' }, paths: {} };
const TAGGED_BUILDS = {
    latest: { buildId: 'latest-build-id', buildNumber: '0.0.2' },
    beta: { buildId: 'beta-build-id', buildNumber: '0.0.3' },
};

interface ReceivedRequest {
    method: string;
    path: string;
    query: Record<string, string>;
    headers: http.IncomingHttpHeaders;
    body: Buffer;
}

describe('ActorServerClient', () => {
    let server: http.Server;
    let baseUrl: string;
    let client: ApifyClient;
    /** Requests the test server received, oldest first. */
    let received: ReceivedRequest[];
    /** The Actor the API returns, or 404 for an Actor that does not exist. */
    let actor: Record<string, unknown> | 404;
    /** Build numbers of the Actor's builds, keyed by build ID, as the builds list returns them. */
    let builds: Record<string, string>;
    /** The `actorDefinition` of every build the API returns. */
    let actorDefinition: Record<string, unknown> | null;
    /** Statuses the server answers `/flaky` with, one per request, before it answers 200. */
    let flakyStatuses: number[];

    const serverUrl = () => `${baseUrl}${SERVER_PREFIX}`;
    const serverRequests = () => received.filter((request) => request.path.startsWith(`${SERVER_PREFIX}/`));
    const actorGets = () => received.filter((request) => request.path === ACTOR_PATH);

    const serverActor = (fields: Record<string, unknown> = {}) => ({
        ...fixtures.actor,
        id: ACTOR_ID,
        actorStandby: { isEnabled: true },
        taggedBuilds: TAGGED_BUILDS,
        standbyUrl: serverUrl(),
        ...fields,
    });

    beforeAll(async () => {
        server = http.createServer((req, res) => {
            const chunks: Buffer[] = [];
            req.on('data', (chunk: Buffer) => chunks.push(chunk));
            req.on('end', () => {
                const url = new URL(req.url!, 'http://localhost');
                const body = Buffer.concat(chunks);
                received.push({
                    method: req.method!,
                    path: url.pathname,
                    query: Object.fromEntries(url.searchParams),
                    headers: req.headers,
                    body,
                });
                const json = (status: number, payload: unknown) => {
                    res.writeHead(status, { 'content-type': 'application/json' });
                    res.end(JSON.stringify(payload));
                };

                if (url.pathname === ACTOR_PATH) {
                    if (actor === 404)
                        json(404, { error: { type: 'record-not-found', message: 'Actor was not found' } });
                    else json(200, { data: actor });
                } else if (url.pathname === `${ACTOR_PATH}/builds`) {
                    const items = Object.entries(builds).map(([id, buildNumber]) => ({
                        ...fixtures.buildList.items[0],
                        id,
                        buildNumber,
                    }));
                    const offset = Number(url.searchParams.get('offset') ?? 0);
                    const page = items.slice(offset);
                    json(200, {
                        data: { ...fixtures.buildList, total: items.length, offset, count: page.length, items: page },
                    });
                } else if (url.pathname.startsWith('/v2/actor-builds/')) {
                    const id = url.pathname.split('/').pop();
                    json(200, { data: { ...fixtures.build, id, actorDefinition } });
                } else if (url.pathname === `${SERVER_PREFIX}/flaky` && flakyStatuses.length > 0) {
                    json(flakyStatuses.shift()!, { error: 'flaky' });
                } else if (url.pathname === `${SERVER_PREFIX}/missing`) {
                    res.writeHead(404, { 'content-type': 'text/plain' });
                    res.end('Not here');
                } else {
                    json(200, { ok: true });
                }
            });
        });
        await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
        baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    });

    afterAll(async () => {
        server.closeAllConnections();
        await new Promise<void>((done) => server.close(() => done()));
    });

    beforeEach(() => {
        received = [];
        actor = serverActor();
        builds = {};
        actorDefinition = { webServerSchema: OPENAPI_SPEC };
        flakyStatuses = [];
        client = new ApifyClient({ baseUrl, token: 'test-token', maxRetries: 0 });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('request() sends the request to the server URL with the method, path, query, body and token', async () => {
        const response = await client
            .actor(ACTOR_ID)
            .server()
            .request('/search', { method: 'POST', params: { q: 'apify' }, data: { limit: 5 } });

        expect(response.status).toBe(200);
        expect(response.data).toEqual({ ok: true });
        const [request] = serverRequests();
        expect(serverRequests()).toHaveLength(1);
        expect(request.method).toBe('POST');
        expect(request.path).toBe(`${SERVER_PREFIX}/search`);
        expect(request.query).toEqual({ q: 'apify' });
        expect(JSON.parse(request.body.toString())).toEqual({ limit: 5 });
        expect(request.headers['x-apify-authorization']).toBe('Bearer test-token');
        expect(request.headers.authorization).toBeUndefined();
    });

    test('request() sends an Authorization header passed by the caller as it is', async () => {
        await client
            .actor(ACTOR_ID)
            .server()
            .request('/', { headers: { Authorization: 'Bearer actor-token' } });

        const [request] = serverRequests();
        expect(request.headers.authorization).toBe('Bearer actor-token');
        expect(request.headers['x-apify-authorization']).toBe('Bearer test-token');
    });

    test('request() reuses the server URL fetched by the first call on the same Actor client', async () => {
        const actorClient = client.actor(ACTOR_ID);

        await actorClient.server().request();
        await actorClient.server().request();

        expect(actorGets()).toHaveLength(1);
        expect(serverRequests().map((request) => request.path)).toEqual([`${SERVER_PREFIX}/`, `${SERVER_PREFIX}/`]);
    });

    test('getUrl() returns the standbyUrl of the Actor and fetches it only once', async () => {
        const actorClient = client.actor(ACTOR_ID);

        await expect(actorClient.server().getUrl()).resolves.toBe(serverUrl());
        await expect(actorClient.server().getUrl()).resolves.toBe(serverUrl());

        expect(actorGets()).toHaveLength(1);
    });

    test.each([
        { name: 'getUrl()', call: (c: ApifyClient) => c.actor(ACTOR_ID).server().getUrl() },
        { name: 'getOpenApiSpec()', call: (c: ApifyClient) => c.actor(ACTOR_ID).server().getOpenApiSpec() },
        { name: 'request()', call: (c: ApifyClient) => c.actor(ACTOR_ID).server().request() },
    ])('$name throws for an Actor that is not a Server Actor', async ({ call }) => {
        actor = serverActor({ standbyUrl: null });

        await expect(call(client)).rejects.toThrow(ApifyClientError);
        await expect(call(client)).rejects.toThrow('is not a Server Actor');
        expect(serverRequests()).toHaveLength(0);
    });

    test.each([
        { name: 'a protocol-relative URL', path: '//evil.example/steal' },
        { name: 'userinfo', path: '@evil.example/steal' },
        { name: 'an absolute URL', path: 'https://evil.example/steal' },
    ])('request() sends a path that looks like $name to the server, as a path on it', async ({ path }) => {
        const response = await client.actor(ACTOR_ID).server().request(path);

        expect(response.status).toBe(200);
        expect(serverRequests()).toHaveLength(1);
    });

    test('request() sends a body large enough to compress uncompressed', async () => {
        const payload = { items: Array.from({ length: 100 }, () => 'x'.repeat(100)) };

        await client.actor(ACTOR_ID).server().request('/items', { method: 'POST', data: payload });

        const [request] = serverRequests();
        expect(request.headers['content-encoding']).toBeUndefined();
        expect(JSON.parse(request.body.toString())).toEqual(payload);
    });

    test.each([
        { name: 'an algorithm name', compression: 'gzip' as const },
        { name: 'a compressor', compression: new GzipHttpCompressor({ quality: 1 }) },
    ])('request() compresses the body when compression is $name', async ({ compression }) => {
        const payload = { items: Array.from({ length: 100 }, () => 'x'.repeat(100)) };

        await client.actor(ACTOR_ID).server().request('/items', { method: 'POST', data: payload, compression });

        const [request] = serverRequests();
        expect(request.headers['content-encoding']).toBe('gzip');
        expect(JSON.parse(gunzipSync(request.body).toString())).toEqual(payload);
    });

    test('request() rejects an unknown compression algorithm without sending a request', async () => {
        const request = client
            .actor(ACTOR_ID)
            .server()
            .request('/items', { method: 'POST', data: 'x', compression: 'zip' as 'gzip' });

        await expect(request).rejects.toThrow(ArgumentValidationError);
        expect(received).toHaveLength(0);
    });

    test('request() sends a Content-Encoding header passed by the caller with the body untouched', async () => {
        const body = gzipSync(Buffer.alloc(2000, 'x'));

        await client
            .actor(ACTOR_ID)
            .server()
            .request('/items', { method: 'POST', headers: { 'content-encoding': 'gzip' }, data: body });

        const [request] = serverRequests();
        expect(request.headers['content-encoding']).toBe('gzip');
        expect(request.body).toEqual(body);
    });

    test('request() throws NotFoundError for an Actor that does not exist', async () => {
        actor = 404;

        await expect(client.actor(ACTOR_ID).server().request()).rejects.toThrow(NotFoundError);
    });

    test('request() returns an error response of the server as it is', async () => {
        const response = await client.actor(ACTOR_ID).server().request('/missing');

        expect(response.status).toBe(404);
        expect(response.data).toBe('Not here');
    });

    test.each([
        { name: 'a rate limit', status: 429 },
        { name: 'Service Unavailable', status: 503 },
    ])('request() retries $name', async ({ status }) => {
        flakyStatuses = [status, status];
        client = new ApifyClient({ baseUrl, token: 'test-token', maxRetries: 2, minDelayBetweenRetriesMillis: 1 });

        const response = await client.actor(ACTOR_ID).server().request('/flaky');

        expect(response.status).toBe(200);
        expect(serverRequests()).toHaveLength(3);
    });

    test('request() returns the last retried response once the retries run out', async () => {
        flakyStatuses = [503, 503, 503];
        client = new ApifyClient({ baseUrl, token: 'test-token', maxRetries: 1, minDelayBetweenRetriesMillis: 1 });

        const response = await client.actor(ACTOR_ID).server().request('/flaky');

        expect(response.status).toBe(503);
        expect(serverRequests()).toHaveLength(2);
    });

    test('request() returns a server error other than 503 without retrying it', async () => {
        flakyStatuses = [500];
        client = new ApifyClient({ baseUrl, token: 'test-token', maxRetries: 2, minDelayBetweenRetriesMillis: 1 });

        const response = await client
            .actor(ACTOR_ID)
            .server()
            .request('/flaky', { method: 'POST', data: { a: 1 } });

        expect(response.status).toBe(500);
        expect(serverRequests()).toHaveLength(1);
    });

    test.each([
        { name: 'no build set uses latest', build: undefined, buildId: 'latest-build-id' },
        { name: 'a build tag', build: 'beta', buildId: 'beta-build-id' },
    ])('getOpenApiSpec() returns the web server schema of the tagged build: $name', async ({ build, buildId }) => {
        actor = serverActor({ actorStandby: { isEnabled: true, build } });

        await expect(client.actor(ACTOR_ID).server().getOpenApiSpec()).resolves.toEqual(OPENAPI_SPEC);
        expect(received.at(-1)?.path).toBe(`/v2/actor-builds/${buildId}`);
    });

    test('getOpenApiSpec() looks a build number up in the builds of the Actor', async () => {
        actor = serverActor({ actorStandby: { isEnabled: true, build: '0.0.1' } });
        builds = { 'latest-build-id': '0.0.2', 'old-build-id': '0.0.1' };

        await expect(client.actor(ACTOR_ID).server().getOpenApiSpec()).resolves.toEqual(OPENAPI_SPEC);
        expect(received.at(-1)?.path).toBe('/v2/actor-builds/old-build-id');
    });

    test.each([
        { name: 'no web server schema', definition: { name: 'test-actor' } },
        { name: 'no Actor definition', definition: null },
    ])('getOpenApiSpec() returns undefined for a build with $name', async ({ definition }) => {
        actorDefinition = definition;

        await expect(client.actor(ACTOR_ID).server().getOpenApiSpec()).resolves.toBeUndefined();
    });

    test('getOpenApiSpec() throws for a build that is neither a tag nor a listed build number', async () => {
        actor = serverActor({ actorStandby: { isEnabled: true, build: '9.9.9' } });
        builds = { 'latest-build-id': '0.0.2' };

        await expect(client.actor(ACTOR_ID).server().getOpenApiSpec()).rejects.toThrow(
            'Build 9.9.9 of Actor test-actor-id does not exist.',
        );
    });

    test('standby() logs a deprecation warning and returns the server client', async () => {
        const deprecated = vi.spyOn(client.httpClient.logger, 'deprecated');
        const actorClient = client.actor(ACTOR_ID);

        const standbyClient = actorClient.standby();

        expect(deprecated).toHaveBeenCalledWith(expect.stringContaining('`standby()` is deprecated'));
        expect(standbyClient).toBe(actorClient.server());
        await expect(standbyClient.request('/search')).resolves.toMatchObject({ data: { ok: true } });
    });
});
