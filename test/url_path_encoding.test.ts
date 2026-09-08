import http from 'node:http';
import type { AddressInfo } from 'node:net';

import { ApifyClient } from 'apify-client';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import type * as utils from '../src/utils.js';

// These tests drive the client with synthetic response bodies, so the schema check the resource clients run on
// every response is skipped: the bodies are shaped for the mechanics under test, not for the API's schemas.
vi.mock('../src/utils', async (importOriginal) => {
    const actual = await importOriginal<typeof utils>();
    return {
        ...actual,
        parseResponse: (response: { data: unknown }, _schema: unknown, shouldParseField = null) =>
            actual.parseDateFields(actual.pluckData(response.data as never), shouldParseField),
    };
});

describe('URL path encoding', () => {
    let server: http.Server;
    let client: ApifyClient;
    let lastPath: string | undefined;

    beforeAll(async () => {
        server = http.createServer((req, res) => {
            lastPath = req.url;
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ data: {} }));
        });
        await new Promise<void>((resolve) => server.listen(0, resolve));
        client = new ApifyClient({
            baseUrl: `http://localhost:${(server.address() as AddressInfo).port}`,
            token: 'token',
            maxRetries: 0,
        });
    });

    afterAll(async () => {
        await new Promise((resolve) => server.close(resolve));
    });

    it('encodes record keys instead of letting them restructure the path', async () => {
        await client.keyValueStore('STORE').getRecord('../../actor-runs/VICTIM/abort');
        expect(lastPath).toBe(
            '/v2/key-value-stores/STORE/records/..%2F..%2Factor-runs%2FVICTIM%2Fabort?attachment=true',
        );

        await client.keyValueStore('STORE').getRecord('foo?injected=1');
        expect(lastPath).toBe('/v2/key-value-stores/STORE/records/foo%3Finjected%3D1?attachment=true');

        await client.keyValueStore('STORE').getRecord('foo#frag');
        expect(lastPath).toBe('/v2/key-value-stores/STORE/records/foo%23frag?attachment=true');
    });

    it('encodes request ids', async () => {
        await client.requestQueue('QUEUE').getRequest('../../../datasets/V/items');
        expect(lastPath).toBe('/v2/request-queues/QUEUE/requests/..%2F..%2F..%2Fdatasets%2FV%2Fitems');
    });

    it('keeps literal path separators', async () => {
        await client.requestQueue('QUEUE').prolongRequestLock('abc', { lockSecs: 1 });
        expect(lastPath).toBe('/v2/request-queues/QUEUE/requests/abc/lock?lockSecs=1');
    });

    it('replaces every slash in a resource id', async () => {
        await client.actor('user/name/extra').get();
        expect(lastPath).toBe('/v2/actors/user~name~extra');
    });

    it('rejects dot segments and empty values', async () => {
        await expect(client.keyValueStore('STORE').getRecord('..')).rejects.toThrow(/must not contain dot segments/);
        await expect(client.requestQueue('QUEUE').getRequest('.')).rejects.toThrow(/must not contain dot segments/);
        expect(() => client.dataset('..')).toThrow(/must not contain dot segments/);
    });
});
