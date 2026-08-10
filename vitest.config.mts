import { resolve } from 'node:path';

import { configDefaults, defineConfig } from 'vitest/config';

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
                extends: true,
                test: {
                    name: 'unit',
                    include: ['test/**/*.test.{js,ts}'],
                    exclude: [...configDefaults.exclude, 'test/integration/**'],
                    globals: true,
                    environment: 'node',
                    testTimeout: 20_000,
                },
            },
            {
                extends: true,
                test: {
                    name: 'integration',
                    include: ['test/integration/**/*.test.ts'],
                    globals: true,
                    environment: 'node',
                    // Actor runs and builds dominate the runtime of this tier.
                    testTimeout: 300_000,
                    hookTimeout: 300_000,
                    // Fixed worker count, so the concurrency the suite puts on the live API does not
                    // scale with the core count of whatever machine runs it.
                    maxWorkers: 8,
                    // No automatic retries - flakiness is handled by polling helpers, not by rerunning.
                    retry: 0,
                },
            },
        ],
    },
});
