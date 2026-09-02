import type { AddressInfo } from 'node:net';

import { ApifyClient, ResponseValidationError } from 'apify-client';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import { z } from 'zod';

import { DEFAULT_OPTIONS } from './_helper.js';
import * as fixtures from './mock_server/fixtures.js';
import { mockServer } from './mock_server/server.js';

describe('ResponseValidationError', () => {
    const schema = z.looseObject({ id: z.string(), status: z.string() });

    test('message names the request and the offending field with the value it received', () => {
        const value = { id: 'abc', status: 42 };
        const error = new ResponseValidationError(schema.safeParse(value).error!, value, {
            method: 'get',
            url: 'https://api.apify.com/v2/actor-runs/abc',
        });

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('ResponseValidationError');
        expect(error.method).toBe('GET');
        expect(error.url).toBe('https://api.apify.com/v2/actor-runs/abc');
        expect(error.message).toBe(
            'Response from GET https://api.apify.com/v2/actor-runs/abc does not match the API schema:\n' +
                'Invalid input: expected string, received number at `status`, got `42`',
        );
    });

    test('exposes the structured issues and the original ZodError', () => {
        const value = {};
        const zodError = schema.safeParse(value).error!;
        const error = new ResponseValidationError(zodError, value, { method: 'GET', url: 'https://example.com' });

        expect(error.issues).toBe(zodError.issues);
        expect(error.cause).toBe(zodError);
        expect(error.issues.map((issue) => issue.path)).toEqual([['id'], ['status']]);
    });
});

describe('response validation in the client', () => {
    let client: ApifyClient;

    beforeAll(async () => {
        const server = await mockServer.start();
        client = new ApifyClient({
            baseUrl: `http://localhost:${(server.address() as AddressInfo).port}`,
            maxRetries: 0,
            ...DEFAULT_OPTIONS,
        });
    });

    afterEach(() => {
        mockServer.setResponse(null);
    });

    afterAll(async () => {
        await mockServer.close();
    });

    test('a response that matches the schema is returned with its dates parsed', async () => {
        const res = await client.run('some-run-id').get();

        expect(res?.id).toBe('get-run');
        expect(res?.startedAt).toBeInstanceOf(Date);
    });

    test('a response of the wrong shape throws ResponseValidationError', async () => {
        mockServer.setResponse({ body: { data: { ...fixtures.run, status: 42, stats: null } } });

        const call = client.run('some-run-id').get();

        await expect(call).rejects.toBeInstanceOf(ResponseValidationError);
        await expect(call).rejects.toThrow(
            /^Response from GET http:\/\/localhost:\d+\/v2\/actor-runs\/some-run-id does not match/,
        );
        await expect(call).rejects.toThrow('Invalid input: expected string, received number at `status`, got `42`');
        await expect(call).rejects.toThrow('at `stats`');
    });

    test('fields the specification does not describe pass through', async () => {
        mockServer.setResponse({ body: { data: { ...fixtures.run, brandNewField: { nested: true } } } });

        const res = await client.run('some-run-id').get();

        expect((res as unknown as Record<string, unknown>).brandNewField).toEqual({ nested: true });
    });

    test('an enum value the specification does not list is accepted', async () => {
        mockServer.setResponse({ body: { data: { ...fixtures.run, status: 'BRAND-NEW-STATUS' } } });

        const res = await client.run('some-run-id').get();

        expect(res?.status).toBe('BRAND-NEW-STATUS');
    });

    test('a widened field the specification narrows is accepted', async () => {
        mockServer.setResponse({ body: { data: { ...fixtures.run, generalAccess: null } } });

        const res = await client.run('some-run-id').get();

        expect(res?.generalAccess).toBeNull();
    });
});
