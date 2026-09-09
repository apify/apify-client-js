import http from 'node:http';
import os from 'node:os';
import { resolve } from 'node:path';

import { build } from 'esbuild';
import { describe, expect, test } from 'vitest';

import { runtime as nodeRuntime } from '../src/runtime/node.js';
import { runtime as webRuntime } from '../src/runtime/web.js';

describe('Node.js runtime', () => {
    test('describes the platform for the User-Agent header', () => {
        expect(nodeRuntime.isNode).toBe(true);
        expect(nodeRuntime.platform).toBe(`${os.platform()}; Node/${process.version}`);
    });

    test('compresses with brotli', async () => {
        const data = new TextEncoder().encode('x'.repeat(2048));
        const compressed = await nodeRuntime.compress(data);
        expect(compressed?.encoding).toBe('br');
        expect(compressed!.data.byteLength).toBeLessThan(data.byteLength);
    });

    test('creates one keep-alive agent for both http and https', async () => {
        const agents = await nodeRuntime.createHttpAgents({ timeoutMillis: 1000 });
        // `options` is where an agent keeps its constructor options; the Node.js types leave it undeclared.
        const agent = agents!.httpAgent as http.Agent & { options: http.AgentOptions };
        expect(agent).toBeInstanceOf(http.Agent);
        expect(agents!.httpsAgent).toBe(agent);
        expect(agent.options).toMatchObject({ keepAlive: true, timeout: 1000 });
        agent.destroy();
    });
});

describe('Web API runtime', () => {
    test('offers no platform, compression or agents', async () => {
        expect(webRuntime.isNode).toBe(false);
        expect(webRuntime.platform).toBeUndefined();
        await expect(webRuntime.compress(new Uint8Array(4096))).resolves.toBeUndefined();
        await expect(webRuntime.createHttpAgents({ timeoutMillis: 1000 })).resolves.toBeUndefined();
    });
});

/**
 * Unlike the tests above, these run against the built `dist`, since the `imports` field of `package.json` maps
 * `#runtime` to files in it.
 */
describe('#runtime resolution', () => {
    const root = resolve(import.meta.dirname, '..');

    /**
     * Bundles the built package the way a bundler for the given target would and returns the modules it pulled
     * in. Dependencies stay external, and with them the Node.js built-ins that `@apify/log` and
     * `@apify/utilities` still import.
     */
    async function bundleClient(options: { platform: 'browser' | 'node'; conditions?: string[] }) {
        const { metafile } = await build({
            absWorkingDir: root,
            entryPoints: ['dist/index.js'],
            bundle: true,
            write: false,
            metafile: true,
            format: 'esm',
            platform: options.platform,
            conditions: options.conditions,
            packages: 'external',
            // A consumer's bundler never sees this repository's `tsconfig.json`, whose `paths` map `#runtime`
            // to the Node.js source for type-checking.
            tsconfigRaw: {},
            logLevel: 'silent',
        });
        return metafile.inputs;
    }

    const targets: { target: string; platform: 'browser' | 'node'; conditions?: string[]; expected: string }[] = [
        { target: 'a browser', platform: 'browser', expected: 'web' },
        {
            target: 'Cloudflare Workers',
            platform: 'browser',
            conditions: ['workerd', 'worker', 'browser'],
            expected: 'web',
        },
        { target: 'Node.js', platform: 'node', expected: 'node' },
    ];

    test.each(targets)('a bundler targeting $target gets the $expected implementation', async (options) => {
        const inputs = await bundleClient(options);
        const implementations = Object.keys(inputs).filter((path) => /^dist\/runtime\/(node|web)\.js$/.test(path));
        expect(implementations).toEqual([`dist/runtime/${options.expected}.js`]);
    });

    test('the Web API build imports no Node.js built-in', async () => {
        const inputs = await bundleClient({ platform: 'browser' });
        const builtins = Object.entries(inputs).flatMap(([path, input]) =>
            input.imports.filter((i) => i.path.startsWith('node:')).map((i) => `${path} -> ${i.path}`),
        );
        expect(builtins).toEqual([]);
    });
});
