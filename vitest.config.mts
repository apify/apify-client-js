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
                    // `.mts` is here for tests that import the maintainer scripts in `scripts/`, which are ESM.
                    include: ['test/**/*.test.{js,ts,mts}'],
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
                    // A distinct group is required alongside `maxWorkers`: Vitest refuses to run two
                    // projects that share a group order but resolve to different worker counts.
                    sequence: { groupOrder: 1 },
                    // No automatic retries - flakiness is handled by polling helpers, not by rerunning.
                    retry: 0,
                },
            },
        ],
    },
});
