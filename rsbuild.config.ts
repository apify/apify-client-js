import { defineConfig, rspack } from '@rsbuild/core';
import { pluginNodePolyfill } from '@rsbuild/plugin-node-polyfill';

import { version } from './package.json';

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
        filename: { js: 'bundle.js' },
        // filename: { js: '[name].js' },
        target: 'web',
        cleanDistPath: false,
        sourceMap: true,
        minify: {
            jsOptions: {
                minimizerOptions: {
                    mangle: false,
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
                providedExports: false,
                usedExports: false,
                splitChunks: false,
                minimize: false,
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
