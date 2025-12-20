import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        testTimeout: 20_000,
        include: ['test/**/*.test.{js,ts}'],
    },
    resolve: {
        alias: {
            'apify-client': resolve(__dirname, 'src'),
        },
    },
});
