import { defineConfig } from '@rsbuild/core';
import { pluginNodePolyfill } from '@rsbuild/plugin-node-polyfill';

const MAX_BUNDLE_BYTES = 360 * 1024;

// eslint-disable-next-line import/no-default-export
export default defineConfig({
    source: {
        entry: {
            Apify: './src/index.ts',
        },
    },
    resolve: {
        alias: {
            // The `imports` field of `package.json` maps this to `dist`; bundle the source instead.
            '#runtime': './src/runtime/web.ts',
        },
        // `tsconfig.json` maps `#runtime` to the Node.js implementation for type-checking, and the default
        // strategy lets that mapping win over the alias.
        aliasStrategy: 'prefer-alias',
    },
    output: {
        distPath: { js: '.' },
        filename: { js: 'bundle.js' },
        // filename: { js: '[name].js' },
        target: 'web',
        cleanDistPath: false,
        sourceMap: true,
        minify: {
            jsOptions: {
                minimizerOptions: {
                    // Class names are load-bearing: `ApifyApiError` and `InvalidResponseBodyError` take
                    // their `name` from `constructor.name`, and `ResourceClient.waitForFinish()` parses
                    // the client name out of it.
                    compress: { keep_classnames: true },
                    mangle: { keep_classnames: true },
                },
            },
        },
    },
    tools: {
        htmlPlugin: false,
        rspack(config) {
            config.output = {
                ...config.output,
                module: true,
                library: { type: 'module' },
                asyncChunks: false,
            };
            config.experiments = {
                ...config.experiments,
                outputModule: true,
            };
            config.optimization = {
                ...config.optimization,
                splitChunks: false,
            };
            // A regression guard, not a target: the bundle sits at ~325 kB, so this only fails the
            // build on an unnoticed jump. A `zod` minor is the likeliest cause, since it is a runtime
            // dependency on a caret range - bumping this constant is the expected response. The
            // generated response schemas growing with the OpenAPI specification is the other.
            config.performance = {
                hints: 'error',
                maxAssetSize: MAX_BUNDLE_BYTES,
                maxEntrypointSize: MAX_BUNDLE_BYTES,
                // The source map is many times the size of the bundle and ships separately.
                assetFilter: (filename) => filename === 'bundle.js',
            };
            config.devtool = 'source-map';
        },
    },
    mode: 'production',
    // The client's own code needs no polyfills. These are for `@apify/log` (`node:events`, `process.env`)
    // and `@apify/utilities` (`node:stream`, `Buffer`), see https://github.com/apify/apify-shared-js/issues/537.
    // `@apify/utilities` also imports `node:crypto`, but only its deprecated synchronous functions use it,
    // so the import resolves to an empty module instead of a polyfill.
    plugins: [pluginNodePolyfill({ overrides: { crypto: false } })],
});
