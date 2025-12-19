import type { AddressInfo } from 'node:net';

import { ApifyClient } from 'apify-client';
import type { Page } from 'puppeteer';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest';

import { Browser, DEFAULT_OPTIONS, validateRequest } from './_helper';
import { mockServer } from './mock_server/server';

describe('Build methods', () => {
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
        // purge the client instance to avoid sharing state between tests
        client = null as any as ApifyClient;
        page.close().catch(() => {});
    });

    describe('builds()', () => {
        test('list() works', async () => {
            const query = {
                limit: 5,
                offset: 3,
                desc: true,
            };

            const res = await client.builds().list(query);
            validateRequest({ query, path: '/v2/actor-builds/' });

            const browserRes = await page.evaluate((opts) => client.builds().list(opts), query);
            expect(browserRes).toEqual(res);
            validateRequest({ query });
        });
    });

    describe('build()', () => {
        test('get() works', async () => {
            const buildId = 'some-build-id';

            const res = await client.build(buildId).get();
            expect(res?.id).toEqual('get-build');
            validateRequest({ query: {}, params: { buildId } });

            const browserRes = await page.evaluate((bId) => client.build(bId).get(), buildId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { buildId } });
        });

        test('get() returns undefined on 404 status code (RECORD_NOT_FOUND)', async () => {
            const buildId = '404';

            const res = await client.build(buildId).get();
            expect(res).toBeUndefined();
            validateRequest({ query: {}, params: { buildId } });

            const browserRes = await page.evaluate((bId) => client.build(bId).get(), buildId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { buildId } });
        });

        test('abort() works', async () => {
            const buildId = 'some-build-id';

            const res = await client.build(buildId).abort();
            expect(res.id).toEqual('abort-build');
            validateRequest({ query: {}, params: { buildId } });

            const browserRes = await page.evaluate((bId) => client.build(bId).abort(), buildId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { buildId } });
        });

        test('getOpenApiDefinition() works', async () => {
            const buildId = 'some-build-id';

            const res = await client.build(buildId).getOpenApiDefinition();
            validateRequest({
                query: {},
                params: { buildId },
                path: `/v2/actor-builds/${encodeURIComponent(buildId)}/openapi.json`,
            });

            const browserRes = await page.evaluate((bId) => client.build(bId).getOpenApiDefinition(), buildId);
            expect(browserRes).toEqual(res);
            validateRequest({ query: {}, params: { buildId } });
        });

        test('waitForFinish() works', async () => {
            const buildId = 'some-build-id';
            const waitSecs = 0.1;
            const data = { status: 'SUCCEEDED' };
            const body = { data };

            setTimeout(() => mockServer.setResponse({ body }), (waitSecs * 1000) / 2);
            const res = await client.build(buildId).waitForFinish({ waitSecs });
            expect(res).toEqual(data);
            validateRequest({ query: { waitForFinish: 0 }, params: { buildId } });

            const browserRes = await page.evaluate(
                (bId, ws) => client.build(bId).waitForFinish({ waitSecs: ws }),
                buildId,
                waitSecs,
            );
            expect(browserRes).toEqual(res);
            validateRequest({ query: { waitForFinish: 0 }, params: { buildId } });
        });

        test('log().get() works', async () => {
            const buildId = 'some-build-id';

            const resource = await client.build(buildId).log().get();
            expect(resource).toEqual('build-log');
            validateRequest({ query: {}, params: { buildId } });

            const browserRes = await page.evaluate((id) => client.build(id).log().get(), buildId);
            expect(browserRes).toEqual('build-log');
            validateRequest({ query: {}, params: { buildId } });
        });
    });
});
