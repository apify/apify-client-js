// Checks that the basics of the built client work in the runtime that runs this file: Node.js, Bun or Deno.
// The unit tests only run in Node.js, and each runtime ships a `fetch` of its own.
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import { Readable } from 'node:stream';

import { ApifyApiError, ApifyClient } from '../../dist/index.js';
import { sha256, startServer } from './server.mjs';

const runtimeName = globalThis.Bun
    ? `Bun ${globalThis.Bun.version}`
    : globalThis.Deno
      ? `Deno ${globalThis.Deno.version.deno}`
      : `Node.js ${process.versions.node}`;

const { baseUrl, hits, payload: PAYLOAD, close } = await startServer();

const client = new ApifyClient({ token: 'smoke-token', maxRetries: 3, minDelayBetweenRetriesMillis: 10 });
const { httpClient } = client;
// The retries below are intended, so their warnings would only be noise.
httpClient.logger.warning = () => {};
httpClient.logger.warningOnce = () => {};

/** Runs `fn` and returns its result along with the number of requests it took. */
const counted = async (fn) => {
    const before = httpClient.stats.requests;
    const outcome = await fn().then(
        (value) => ({ value }),
        (error) => ({ error }),
    );
    return { ...outcome, requests: httpClient.stats.requests - before };
};
const call = async (config) => httpClient.call({ method: 'GET', ...config });

const checks = {
    'gets and parses JSON': async () => {
        const { data } = await call({ url: `${baseUrl}/ok` });
        assert.equal(data.data.id, 'abc');
    },
    'sends the token and the user agent': async () => {
        const { data } = await call({ method: 'POST', url: `${baseUrl}/echo`, data: { a: 1 } });
        assert.equal(data.authorization, 'Bearer smoke-token');
        assert.match(data.userAgent, /^ApifyClient\//);
    },
    'retries a server error': async () => {
        const { error, requests } = await counted(async () => call({ url: `${baseUrl}/flaky` }));
        assert.equal(error, undefined);
        assert.equal(requests, 3);
    },
    'throws an API error without retrying it': async () => {
        const { error, requests } = await counted(async () => call({ url: `${baseUrl}/not-found` }));
        assert.ok(error instanceof ApifyApiError, `got ${error}`);
        assert.equal(error.statusCode, 404);
        assert.equal(error.type, 'record-not-found');
        assert.equal(requests, 1);
    },
    'retries a refused connection until the retries run out': async () => {
        const { error, requests } = await counted(async () => call({ url: 'http://127.0.0.1:1/' }));
        assert.ok(error instanceof Error, `got ${error}`);
        assert.equal(requests, 4);
    },
    'retries a dropped connection': async () => {
        const { error } = await counted(async () => call({ url: `${baseUrl}/reset` }));
        assert.equal(error, undefined);
        // Bun and Deno may already retry it inside `fetch`, so the request count is not asserted.
        assert.ok(hits['/reset'] >= 2);
    },
    'retries a timeout': async () => {
        const { error, requests } = await counted(async () => call({ url: `${baseUrl}/stall`, timeoutSecs: 0.3 }));
        assert.equal(error, undefined);
        assert.equal(requests, 2);
    },
    'does not retry an invalid URL': async () => {
        const { error, requests } = await counted(async () => call({ url: 'http://exa mple.com/' }));
        assert.ok(error instanceof TypeError, `got ${error}`);
        assert.equal(requests, 1);
    },
    'rejects with the reason of an abort': async () => {
        hits['/stall'] = 0;
        const controller = new AbortController();
        setTimeout(() => controller.abort(new Error('stop')), 50);
        const { error, requests } = await counted(async () =>
            call({ url: `${baseUrl}/stall`, timeoutSecs: 5, signal: controller.signal }),
        );
        assert.equal(error?.message, 'stop');
        assert.equal(requests, 1);
    },
    'compresses a JSON body': async () => {
        const body = { items: Array.from({ length: 2000 }, (_, index) => ({ index, text: 'lorem ipsum' })) };
        const { data } = await call({ method: 'POST', url: `${baseUrl}/echo`, data: body });
        assert.equal(data.encoding, 'br');
        assert.equal(data.sha256, sha256(JSON.stringify(body)));
    },
    'uploads a buffer': async () => {
        const { data } = await call({
            method: 'PUT',
            url: `${baseUrl}/echo`,
            data: PAYLOAD,
            headers: { 'content-type': 'application/octet-stream' },
        });
        assert.equal(data.sha256, sha256(PAYLOAD));
    },
    'uploads a stream': async () => {
        // Small buffers come from the shared pool of Node.js, which a runtime must not read past.
        const parts = Array.from({ length: 2000 }, (_, index) => Buffer.from(`line ${index}\n`));
        const { data } = await call({
            method: 'PUT',
            url: `${baseUrl}/echo`,
            data: Readable.from(parts),
            headers: { 'content-type': 'text/plain' },
        });
        assert.equal(data.sha256, sha256(Buffer.concat(parts)));
    },
    'uploads a stream of strings': async () => {
        const { data } = await call({
            method: 'PUT',
            url: `${baseUrl}/echo`,
            data: Readable.from(['žluťoučký ', 'kůň']),
            headers: { 'content-type': 'text/plain' },
        });
        assert.equal(data.sha256, sha256('žluťoučký kůň'));
    },
    'uploads a web stream': async () => {
        const parts = Array.from({ length: 2000 }, (_, index) => Buffer.from(`line ${index}\n`));
        const { data } = await call({
            method: 'PUT',
            url: `${baseUrl}/echo`,
            data: new Blob(parts).stream(),
            headers: { 'content-type': 'text/plain' },
        });
        assert.equal(data.sha256, sha256(Buffer.concat(parts)));
    },
    'uploads the web stream of a download': async () => {
        const download = await call({ url: `${baseUrl}/download`, responseType: 'stream' });
        const { data } = await call({
            method: 'PUT',
            url: `${baseUrl}/echo`,
            data: download.data,
            headers: { 'content-type': 'application/octet-stream' },
        });
        assert.equal(data.sha256, sha256(PAYLOAD));
    },
    'does not retry a web stream upload': async () => {
        hits['/flaky'] = 0;
        const { error, requests } = await counted(async () =>
            call({ method: 'PUT', url: `${baseUrl}/flaky`, data: new Blob(['streamed']).stream() }),
        );
        assert.ok(error instanceof ApifyApiError, `got ${error}`);
        assert.equal(requests, 1);
    },
    'downloads a buffer': async () => {
        const { data } = await call({ url: `${baseUrl}/download`, responseType: 'buffer' });
        assert.ok(Buffer.isBuffer(data));
        assert.equal(sha256(data), sha256(PAYLOAD));
    },
    'downloads a stream': async () => {
        const { data } = await call({ url: `${baseUrl}/download`, responseType: 'stream' });
        assert.ok(data instanceof ReadableStream);
        assert.equal(sha256(Buffer.from(await new Response(data).arrayBuffer())), sha256(PAYLOAD));
    },
};

console.log(`Smoke test of apify-client in ${runtimeName}`);
let failed = 0;
for (const [name, check] of Object.entries(checks)) {
    try {
        await check();
        console.log(`  ok    ${name}`);
    } catch (error) {
        failed++;
        console.log(`  FAIL  ${name}\n${error?.stack ?? error}`);
    }
}

close();
console.log(failed ? `${failed} of ${Object.keys(checks).length} checks failed` : 'All checks passed');
process.exit(failed ? 1 : 0);
