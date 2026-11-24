import { readFile } from 'node:fs/promises';
import http from 'node:http';
import https from 'node:https';
import os from 'node:os';
import { resolve } from 'node:path';
import { Readable } from 'node:stream';
import type * as Zlib from 'node:zlib';
import { brotliDecompressSync, gunzipSync } from 'node:zlib';

import { build } from 'esbuild';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { runtime as nodeRuntime } from '../src/runtime/node.js';
import { runtime as webRuntime } from '../src/runtime/web.js';

describe('Node.js runtime', () => {
    test('describes the platform for the User-Agent header', () => {
        expect(nodeRuntime.isNode).toBe(true);
        expect(nodeRuntime.platform).toBe(`${os.platform()}; Node/${process.version}`);
    });

    test('compresses with brotli', async () => {
        const data = new TextEncoder().encode('x'.repeat(2048));
        const compressed = await nodeRuntime.compress(data, { algorithm: 'br', quality: 6 });
        expect(brotliDecompressSync(compressed)).toEqual(Buffer.from(data));
        expect(compressed.byteLength).toBeLessThan(data.byteLength);
    });

    test('compresses with gzip', async () => {
        const data = new TextEncoder().encode('x'.repeat(2048));
        const compressed = await nodeRuntime.compress(data, { algorithm: 'gzip', quality: 6 });
        expect(gunzipSync(compressed)).toEqual(Buffer.from(data));
        expect(compressed.byteLength).toBeLessThan(data.byteLength);
    });

    test('rejects where `node:zlib` does not implement the algorithm', async () => {
        vi.resetModules();
        vi.doMock('node:zlib', async () => {
            const zlib = await vi.importActual<typeof Zlib>('node:zlib');
            return { ...zlib, brotliCompress: undefined };
        });

        try {
            const { runtime } = await import('../src/runtime/node.js');
            const data = new TextEncoder().encode('x'.repeat(2048));
            await expect(runtime.compress(data, { algorithm: 'br', quality: 6 })).rejects.toThrow(TypeError);
        } finally {
            vi.doUnmock('node:zlib');
            vi.resetModules();
        }
    });

    test('creates a keep-alive agent for each of http and https', async () => {
        const agents = await nodeRuntime.createHttpAgents({ timeoutMillis: 1000 });
        // `options` is where an agent keeps its constructor options; the Node.js types leave it undeclared.
        const agent = agents!.httpAgent as http.Agent & { options: http.AgentOptions };
        expect(agent).toBeInstanceOf(http.Agent);
        expect(agents!.httpsAgent).toBeInstanceOf(https.Agent);
        expect(agent.options).toMatchObject({ keepAlive: true, timeout: 1000 });
        agent.destroy();
        agents!.httpsAgent.destroy();
    });

    test('wraps the body of a fetch response in a Readable', async () => {
        const body = nodeRuntime.readableFromWeb(new Response('streamed').body);
        expect(body).toBeInstanceOf(Readable);
        expect(Buffer.concat(await body.toArray()).toString()).toBe('streamed');
        expect(await nodeRuntime.readableFromWeb(null).toArray()).toEqual([]);
    });

    describe('unusedProxyHint()', () => {
        beforeEach(() => {
            for (const name of ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'NODE_USE_ENV_PROXY']) {
                vi.stubEnv(name, '');
            }
            vi.stubEnv('NODE_OPTIONS', '');
        });
        afterEach(() => {
            vi.unstubAllEnvs();
        });

        test('is empty without a proxy in the environment', () => {
            expect(nodeRuntime.unusedProxyHint()).toBeUndefined();
        });

        test('names the variable and the switch that makes Node.js read it', () => {
            vi.stubEnv('http_proxy', 'http://proxy.example.com:3128');
            const hint = nodeRuntime.unusedProxyHint();
            expect(hint).toMatch('the proxy set in http_proxy was not used');
            expect(hint).toMatch('NODE_USE_ENV_PROXY=1 or --use-env-proxy');
        });

        test.each([
            { name: 'NODE_USE_ENV_PROXY=1', env: { NODE_USE_ENV_PROXY: '1' } },
            { name: '--use-env-proxy in NODE_OPTIONS', env: { NODE_OPTIONS: '--no-warnings --use-env-proxy' } },
        ])('is empty with $name', ({ env }) => {
            vi.stubEnv('HTTPS_PROXY', 'http://proxy.example.com:3128');
            for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
            expect(nodeRuntime.unusedProxyHint()).toBeUndefined();
        });

        test('asks for an upgrade where Node.js cannot route fetch() through a proxy', () => {
            vi.stubEnv('HTTPS_PROXY', 'http://proxy.example.com:3128');
            const versions = vi
                .spyOn(process, 'versions', 'get')
                .mockReturnValue({ ...process.versions, node: '22.15.0' });
            try {
                expect(nodeRuntime.unusedProxyHint()).toMatch('Node.js 22.15.0 cannot route fetch() through it');
            } finally {
                versions.mockRestore();
            }
        });
    });

    test('opens a Blob body as a fresh Readable over its bytes every time', async () => {
        const blob = new Blob(['blob bytes']);
        const onSourceError = vi.fn();

        const first = nodeRuntime.openBlobBody(blob, onSourceError) as Readable;
        const second = nodeRuntime.openBlobBody(blob, onSourceError) as Readable;

        expect(first).toBeInstanceOf(Readable);
        expect(second).not.toBe(first);
        expect(Buffer.concat(await first.toArray()).toString()).toBe('blob bytes');
        expect(Buffer.concat(await second.toArray()).toString()).toBe('blob bytes');
        expect(onSourceError).not.toHaveBeenCalled();
    });

    test('reports an error the Blob raises while it is read', async () => {
        const sourceError = new Error('file changed on disk');
        class FailingBlob extends Blob {
            override stream() {
                return new ReadableStream<Uint8Array<ArrayBuffer>>({
                    pull: (controller) => controller.error(sourceError),
                });
            }
        }
        const onSourceError = vi.fn();

        const body = nodeRuntime.openBlobBody(new FailingBlob(['x']), onSourceError) as Readable;

        await expect(body.toArray()).rejects.toBe(sourceError);
        expect(onSourceError).toHaveBeenCalledExactlyOnceWith(sourceError);
    });

    test('does not report the error a transport destroys the Blob body with', async () => {
        const onSourceError = vi.fn();
        const body = nodeRuntime.openBlobBody(new Blob(['x'.repeat(1_000_000)]), onSourceError) as Readable;
        body.on('error', () => {});

        await new Promise<void>((resolve) => {
            body.once('data', () => {
                body.pause();
                body.destroy(new Error('socket hang up'));
                body.once('close', resolve);
            });
        });

        expect(onSourceError).not.toHaveBeenCalled();
    });
});

describe('Web API runtime', () => {
    test('offers no platform, compression or agents', async () => {
        expect(webRuntime.isNode).toBe(false);
        expect(webRuntime.platform).toBeUndefined();
        await expect(webRuntime.compress(new Uint8Array(4096), { algorithm: 'br', quality: 6 })).rejects.toThrow(
            'only available in Node.js',
        );
        await expect(webRuntime.createHttpAgents({ timeoutMillis: 1000 })).resolves.toBeUndefined();
    });

    test('hands a Blob body over as it is', () => {
        const blob = new Blob(['blob bytes']);
        expect(webRuntime.openBlobBody(blob, vi.fn())).toBe(blob);
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
