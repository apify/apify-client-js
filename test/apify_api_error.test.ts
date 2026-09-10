import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

import type { Dictionary } from 'apify-client';
import {
    ApifyApiError,
    ApifyClient,
    ConflictError,
    ForbiddenError,
    InvalidRequestError,
    NotFoundError,
    RateLimitError,
    ServerError,
    UnauthorizedError,
} from 'apify-client';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { Browser, DEFAULT_OPTIONS } from './_helper.js';
import { mockServer } from './mock_server/server.js';

describe('ApifyApiError', () => {
    let baseUrl: string;
    const browser = new Browser();

    beforeAll(async () => {
        await browser.start();
        const server = await mockServer.start();
        baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
    });

    afterAll(async () => {
        await Promise.all([mockServer.close(), browser.cleanUpBrowser()]);
    });

    test('should carry all the information', async () => {
        const client = new ApifyClient();
        const actorCollectionClient = client.actors();
        const method = 'list';
        try {
            await actorCollectionClient[method]();
            throw new Error('wrong error');
        } catch (err: any) {
            if (!(err instanceof ApifyApiError)) throw err;

            expect(err).toBeInstanceOf(UnauthorizedError);
            expect(err.name).toEqual('UnauthorizedError');
            // This does not work in v10 and lower, but we want to be able to run tests for v10,
            // because some people might still use it. They will just see clientMethod: undefined.
            if (!process.version.startsWith('v10')) {
                expect(err.clientMethod).toBe(`${actorCollectionClient.constructor.name}.${method}`);
            }
            expect(err.type).toEqual('token-not-provided');
            expect(err.message).toEqual('Authentication token was not provided');
            expect(err.statusCode).toEqual(401);
            expect(err.path).toMatch(`/v2/${actorCollectionClient.resourcePath}`);
            expect(err.httpMethod).toEqual('get');
            expect(err.attempt).toEqual(1);
        }
    });

    test('should carry all the information in browser', async () => {
        const page = await browser.getInjectedPage();
        const method = 'list';
        const error = await page.evaluate(async (m) => {
            const client = new (window as any).Apify.ApifyClient();
            const actorCollectionClient = client.actors();
            try {
                await actorCollectionClient[m]();
                throw new Error('wrong error');
            } catch (err: any) {
                const serializableErr: Dictionary<any> = {};
                Object.getOwnPropertyNames(err).forEach((prop) => {
                    serializableErr[prop] = err[prop];
                });
                serializableErr.resourcePath = actorCollectionClient.resourcePath;
                return serializableErr as Dictionary<any>;
            }
        }, method);

        expect(error.name).toEqual('UnauthorizedError');
        expect(error.clientMethod).toBe(`ActorCollectionClient.${method}`);
        expect(error.type).toEqual('token-not-provided');
        expect(error.message).toEqual('Authentication token was not provided');
        expect(error.statusCode).toEqual(401);
        expect(error.path).toMatch(`/v2/${error.resourcePath}`);
        expect(error.httpMethod).toEqual('get');
        expect(error.attempt).toEqual(1);
    });

    test('should carry the API error of a failed streaming request', async () => {
        const client = new ApifyClient({ baseUrl, maxRetries: 0, ...DEFAULT_OPTIONS });

        // A chained `run.log()` rethrows the 404, so the error itself is observable. Streams are Node-only, so
        // there is no browser leg here.
        const call = client.run('404').log().stream();
        await expect(call).rejects.toThrow(NotFoundError);
        await expect(call).rejects.toMatchObject({
            name: 'NotFoundError',
            statusCode: 404,
            type: 'record-not-found',
            message: 'Record with this name was not found',
            httpMethod: 'get',
            path: '/v2/actor-runs/404/log',
        });
    });

    test('should not invent a message for a failed streaming request with an empty body', async () => {
        const client = new ApifyClient({ baseUrl, maxRetries: 0, ...DEFAULT_OPTIONS });

        await expect(client.run('500').log().stream()).rejects.toMatchObject({
            name: 'ServerError',
            statusCode: 500,
            message: '',
        });
    });

    test('should keep the status code of a streaming request whose error body breaks mid-read', async () => {
        // The connection drops after the headers, so the body read rejects. Without that rejection being
        // swallowed, the 500 would surface as a network error instead.
        const server = createServer((_req, res) => {
            res.writeHead(500, { 'content-type': 'application/json' });
            res.write('{"error":', () => res.socket?.destroy());
        });
        await new Promise<void>((resolve) => server.listen(0, resolve));
        const client = new ApifyClient({
            baseUrl: `http://localhost:${(server.address() as AddressInfo).port}`,
            maxRetries: 0,
            ...DEFAULT_OPTIONS,
        });

        try {
            await expect(client.run('500').log().stream()).rejects.toMatchObject({
                name: 'ServerError',
                statusCode: 500,
            });
        } finally {
            server.closeAllConnections();
            await new Promise((resolve) => server.close(resolve));
        }
    });

    test('should carry additional error data if provided', async () => {
        const datasetId = '400'; // check add_routes.js to see details of this mock
        const data = JSON.stringify([{ someData: 'someValue' }, { someData: 'someValue' }]);
        const clientConfig = {
            baseUrl,
            maxRetries: 0,
            ...DEFAULT_OPTIONS,
        };

        // Works in node
        try {
            const client = new ApifyClient(clientConfig);
            await client.dataset(datasetId).pushItems(data);
            throw new Error('wrong error');
        } catch (err) {
            if (!(err instanceof ApifyApiError)) throw err;

            expect(err).toBeInstanceOf(InvalidRequestError);
            expect(err.name).toEqual('InvalidRequestError');
            expect(err.type).toEqual('schema-validation-error');
            expect(err.data).toEqual({
                invalidItems: {
                    0: [`should have required property 'name'`],
                },
            });
        }

        // Works in browser
        const page = await browser.getInjectedPage();
        const error = await page.evaluate(
            async (cConfig, dId, d) => {
                const client = new (window as any).Apify.ApifyClient(cConfig);
                const datasetClient = client.dataset(dId);
                try {
                    await datasetClient.pushItems(d);
                    throw new Error('wrong error');
                } catch (err: any) {
                    const serializableErr: Dictionary<any> = {};
                    Object.getOwnPropertyNames(err).forEach((prop) => {
                        serializableErr[prop] = err[prop];
                    });
                    serializableErr.resourcePath = datasetClient.resourcePath;
                    return serializableErr;
                }
            },
            clientConfig,
            datasetId,
            data,
        );
        expect(error.name).toEqual('InvalidRequestError');
        expect(error.type).toEqual('schema-validation-error');
        expect(error.data).toEqual({
            invalidItems: {
                0: [`should have required property 'name'`],
            },
        });
    });

    describe('subclass by HTTP status', () => {
        const response = (status: number, data: unknown = { error: { type: 'some-type', message: 'Some message' } }) =>
            ({ status, data, config: { method: 'get', url: 'http://localhost/v2/acts' } }) as any;

        test.each([
            { status: 400, name: 'InvalidRequestError', ErrorClass: InvalidRequestError },
            { status: 401, name: 'UnauthorizedError', ErrorClass: UnauthorizedError },
            { status: 403, name: 'ForbiddenError', ErrorClass: ForbiddenError },
            { status: 404, name: 'NotFoundError', ErrorClass: NotFoundError },
            { status: 409, name: 'ConflictError', ErrorClass: ConflictError },
            { status: 429, name: 'RateLimitError', ErrorClass: RateLimitError },
            { status: 500, name: 'ServerError', ErrorClass: ServerError },
            { status: 503, name: 'ServerError', ErrorClass: ServerError },
        ])('status $status creates $name', ({ status, name, ErrorClass }) => {
            const error = ApifyApiError.fromResponse(response(status), 1);

            expect(error).toBeInstanceOf(ErrorClass);
            expect(error).toBeInstanceOf(ApifyApiError);
            expect(error.name).toBe(name);
            expect(error.stack).toMatch(new RegExp(`^${name}: Some message\n`));
            expect(error.statusCode).toBe(status);
            expect(error.type).toBe('some-type');
            expect(error.message).toBe('Some message');
            expect(error.path).toBe('/v2/acts');
        });

        test('an unmapped status stays a plain ApifyApiError', () => {
            const error = ApifyApiError.fromResponse(response(418), 1);

            expect(error.constructor).toBe(ApifyApiError);
            expect(error.name).toBe('ApifyApiError');
            expect(error.statusCode).toBe(418);
        });

        test('an unparsable body still picks the subclass', () => {
            const error = ApifyApiError.fromResponse(response(404, Buffer.from('<not json>')), 1);

            expect(error).toBeInstanceOf(NotFoundError);
            expect(error.type).toBeUndefined();
            expect(error.message).toBe('Unexpected error: "<not json>"');
        });
    });
});
