import { defineConfig, rspack } from '@rsbuild/core';
import { pluginNodePolyfill } from '@rsbuild/plugin-node-polyfill';

import { version } from './package.json';

const MAX_BUNDLE_BYTES = 320 * 1024;

const nodeOnlyModules = /^proxy-agent$/;
const unusedInBrowserBuiltins = ['os', 'zlib', 'util'];
const builtinAliases = Object.fromEntries(
    unusedInBrowserBuiltins.flatMap((m) => [
        [m, false],
        [`node:${m}`, false],
    ]),
);

// eslint-disable-next-line import/no-default-export
export default defineConfig({
    source: {
        entry: {
            Apify: './src/index.ts',
        },
        define: {
            VERSION: JSON.stringify(version),
            BROWSER_BUILD: true,
        },
    },
    output: {
        distPath: { js: '.' },
        filename: { js: 'bundle.cjs' },
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
                library: {
                    type: 'umd', // or 'umd', 'commonjs', etc.
                    name: 'Apify',
                },
                globalObject: 'globalThis',
                asyncChunks: false,
            };
            config.optimization = {
                ...config.optimization,
                splitChunks: false,
            };
            // A regression guard, not a target: the bundle sits at ~288 kB, so this only fails the
            // build on an unnoticed jump. A `zod` minor is the likeliest cause, since it is a runtime
            // dependency on a caret range - bumping this constant is the expected response.
            config.performance = {
                hints: 'error',
                maxAssetSize: MAX_BUNDLE_BYTES,
                maxEntrypointSize: MAX_BUNDLE_BYTES,
                // The source map is many times the size of the bundle and ships separately.
                assetFilter: (filename) => filename === 'bundle.cjs',
            };
            config.plugins = [...(config.plugins ?? []), new rspack.IgnorePlugin({ resourceRegExp: nodeOnlyModules })];
            config.resolve = {
                ...config.resolve,
                alias: {
                    ...config.resolve?.alias,
                    ...builtinAliases,
                },
            };
            config.devtool = 'source-map';
        },
    },
    mode: 'production',
    // @apify/utilities dynamically imports `crypto` on missing `SubtleCrypto` (but browsers have it).
    plugins: [pluginNodePolyfill({ overrides: { crypto: false } })],
});
