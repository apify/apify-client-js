// Checks that the built client works in Cloudflare Workers: bundles `worker.mjs` the way a Workers project would,
// runs it in `workerd` through Miniflare and compares what it reports with what the server saw.
import assert from 'node:assert/strict';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';
import { Miniflare } from 'miniflare';

import { sha256, startServer } from './server.mjs';

// No `node` condition, so `#runtime` resolves to the Web API implementation.
const bundle = await build({
    entryPoints: [fileURLToPath(new URL('./worker.mjs', import.meta.url))],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'neutral',
    mainFields: ['module', 'main'],
    conditions: ['workerd', 'worker'],
    // The dependencies import Node.js built-ins, which Workers provide under the `nodejs_compat` flag.
    external: ['node:*'],
    // The `paths` of this repository's `tsconfig.json` map `#runtime` to the Node.js source.
    tsconfigRaw: {},
});

const { baseUrl, payload, close } = await startServer();
const miniflare = new Miniflare({
    modules: true,
    script: bundle.outputFiles[0].text,
    compatibilityDate: '2026-07-01',
    compatibilityFlags: ['nodejs_compat'],
});

let results;
try {
    const response = await miniflare.dispatchFetch(`http://worker/?baseUrl=${encodeURIComponent(baseUrl)}`);
    results = await response.json();
} finally {
    await miniflare.dispose();
    close();
}

const expected = {
    'gets and parses JSON': 'abc',
    'sends the token': 'Bearer smoke-token',
    'retries a server error': 3,
    'throws an API error': 'record-not-found',
    'uploads bytes': results['text sha256'],
    'uploads a web stream': results['text sha256'],
    'uploads the web stream of a download': sha256(payload),
    'downloads a stream': sha256(payload),
};

console.log('Smoke test of apify-client in Cloudflare Workers (workerd)');
let failed = 0;
for (const [name, value] of Object.entries(expected)) {
    try {
        assert.equal(results[name], value);
        console.log(`  ok    ${name}`);
    } catch (error) {
        failed++;
        console.log(`  FAIL  ${name}\n${error.message}`);
    }
}

console.log(failed ? `${failed} of ${Object.keys(expected).length} checks failed` : 'All checks passed');
process.exit(failed ? 1 : 0);
