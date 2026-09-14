import { readFile } from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import { resolve } from 'node:path';
import type * as Zlib from 'node:zlib';
import { gunzipSync } from 'node:zlib';

import { build } from 'esbuild';
import { describe, expect, test, vi } from 'vitest';

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

    test('falls back to gzip where `node:zlib` does not implement brotli', async () => {
        vi.resetModules();
        vi.doMock('node:zlib', async () => {
            const zlib = await vi.importActual<typeof Zlib>('node:zlib');
            return { ...zlib, brotliCompress: undefined };
        });

        try {
            const { runtime } = await import('../src/runtime/node.js');
            const data = new TextEncoder().encode('x'.repeat(2048));
            const compressed = await runtime.compress(data);
            expect(compressed?.encoding).toBe('gzip');
            expect(gunzipSync(compressed!.data)).toEqual(Buffer.from(data));
        } finally {
            vi.doUnmock('node:zlib');
            vi.resetModules();
        }
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
     * Bundles the ES module build for the given target and returns the modules it pulled in. The entry point is
     * `dist/index.js` rather than the package name, because the `browser` condition of the `exports` field
     * resolves to the pre-built bundle instead. Dependencies stay external, so the inputs cover the client's
     * own code alone.
     */
    async function bundleClient(options: { platform: 'browser' | 'neutral' | 'node'; conditions?: string[] }) {
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

    const targets: {
        target: string;
        platform: 'browser' | 'neutral' | 'node';
        conditions?: string[];
        expected: string;
    }[] = [
        { target: 'a browser', platform: 'browser', expected: 'web' },
        {
            target: 'Cloudflare Workers',
            platform: 'browser',
            conditions: ['workerd', 'worker', 'browser'],
            expected: 'web',
        },
        // The target the documentation points at for reaching the ES module build, since it sets no conditions.
        { target: 'a neutral runtime', platform: 'neutral', expected: 'web' },
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

    test('the pre-built browser bundle got the Web API implementation', async () => {
        const bundle = await readFile(resolve(root, 'dist/bundle.js'), 'utf8');
        // A property access no other module makes, and one a minifier keeps. rsbuild resolves `#runtime` through
        // an alias, so a resolution regression there would otherwise only show up as a bundle size jump.
        expect(bundle).not.toContain('BROTLI_PARAM_QUALITY');
    });
});
