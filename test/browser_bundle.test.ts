import type { Page } from 'puppeteer';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { Browser } from './_helper.js';

/**
 * Unlike every other test file, these run against the built `dist/bundle.js` - tree-shaken and
 * minified, so it can lose runtime behaviour the unbundled sources keep.
 */
describe('browser bundle', () => {
    const browser = new Browser();
    let page: Page;

    beforeAll(async () => {
        await browser.start();
        page = await browser.getInjectedPage();
    });

    afterAll(async () => {
        await browser.cleanUpBrowser();
    });

    test("validation messages keep zod's English locale", async () => {
        const message = await page.evaluate(async () => {
            try {
                await (window as any).client.actor('some-actor').start(undefined, { nonsense: 1 });
            } catch (err: any) {
                return err.message as string;
            }
            return 'no error was thrown';
        });

        // Zod registers its locale as a module-level side effect yet ships `"sideEffects": false`, so a
        // tree-shaking bundler drops it and degrades every message to a bare "Invalid input".
        expect(message).toContain('Unrecognized key');
        expect(message).toContain('nonsense');
    });

    test('class names survive minification', async () => {
        const names = await page.evaluate(() => {
            const { client } = window as any;
            return {
                run: client.run('some-run').constructor.name as string,
                build: client.build('some-build').constructor.name as string,
                apiError: (window as any).Apify.ApifyApiError.name as string,
            };
        });

        // `ApifyApiError` derives its `name` from `constructor.name`, and
        // `ResourceClient.waitForFinish()` parses the resource name out of it.
        expect(names.run).toBe('RunClient');
        expect(names.build).toBe('BuildClient');
        expect(names.apiError).toBe('ApifyApiError');
    });
});
