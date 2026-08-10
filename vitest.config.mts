import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
    resolve: {
        alias: {
            'apify-client': resolve(__dirname, 'src'),
        },
    },
    test: {
        projects: [
            {
                resolve: {
                    alias: {
                        'apify-client': resolve(__dirname, 'src'),
                    },
                },
                test: {
                    name: 'unit',
                    include: ['test/**/*.test.{js,ts}'],
                    exclude: ['test/integration/**'],
                    globals: true,
                    environment: 'node',
                    testTimeout: 20_000,
                },
            },
            {
                resolve: {
                    alias: {
                        'apify-client': resolve(__dirname, 'src'),
                    },
                },
                test: {
                    name: 'integration',
                    include: ['test/integration/**/*.test.ts'],
                    globals: true,
                    environment: 'node',
                    // Actor runs and builds dominate the runtime of this tier.
                    testTimeout: 300_000,
                    hookTimeout: 300_000,
                    globalSetup: ['test/integration/_global_setup.ts'],
                    // Cap concurrency so the suite does not rate-limit itself against the live API.
                    maxWorkers: 8,
                    // No automatic retries - flakiness is handled by polling helpers, not by rerunning.
                    retry: 0,
                },
            },
        ],
    },
});
