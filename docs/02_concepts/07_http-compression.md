---
id: http-compression
title: HTTP compression
sidebar_label: HTTP compression
description: 'Configure how the Apify API client for JavaScript compresses request bodies: brotli by default, gzip, or a custom compressor.'
---

import ApiLink from '@theme/ApiLink';

The client compresses request bodies before sending them to the API. Compression reduces the amount of data transferred over the network, which makes requests faster and saves bandwidth, especially for large payloads such as Actor inputs, dataset items, or key-value store records.

## How it works

The client compresses request bodies with the compressor configured via the `compression` option of the <ApiLink to="class/ApifyClient">`ApifyClient`</ApiLink> constructor, brotli by default. The API accepts both brotli and gzip and decompresses the body transparently. A body is compressed only when it's large enough to benefit, its content type isn't already compressed, and the request carries no `Content-Encoding` of its own. For details, see [Minimum body size](#minimum-body-size), [Already-compressed payloads](#already-compressed-payloads), and [Pre-compressed bodies](#pre-compressed-bodies).

Compression runs on Node.js only. In a browser, the client sends every body as it is, and the `compression` option has no effect.

## Minimum body size

The client sends bodies smaller than 1024 bytes without compression and without the `Content-Encoding` header. A body of this size fits in one network packet, so compression doesn't remove a network round trip and only costs CPU time. For very small bodies, the compression format adds bytes and can make the body larger.

## Already-compressed payloads

Some payloads carry their own compression, so compressing them again costs CPU and memory while making the request slightly larger. The client skips compression when the request's `Content-Type` is one of these:

- any `image/*`, `audio/*`, or `video/*` type
- archives such as `application/zip`, `application/gzip`, or `application/x-7z-compressed`
- office documents and packages built on ZIP, such as `.docx`, `.xlsx`, `.epub`, or `.apk`
- web fonts (`font/woff`, `font/woff2`)

Two kinds of media type are compressed anyway: raw formats such as `image/bmp`, `image/tiff`, and `audio/wav`, and subtypes with a structured syntax suffix such as `image/svg+xml`. Set an accurate `contentType` when uploading media to a key-value store:

```js
import { readFile } from 'node:fs/promises';

const screenshot = await readFile('screenshot.png');

// The explicit content type lets the client skip compressing the PNG.
await client.keyValueStore('my-store-id').setRecord({
    key: 'screenshot.png',
    value: screenshot,
    contentType: 'image/png',
});
```

Without an explicit content type, a `Buffer` is sent as `application/octet-stream`, which the client can't tell apart from uncompressed binary data and therefore still compresses. A stream is sent as it is, whatever its content type.

## Pre-compressed bodies

A payload can reach the client already encoded, for example a gzipped file read from disk. Set the `Content-Encoding` header to name the encoding the payload carries. The client then sends the body as it is and forwards the header, so nothing gets compressed twice. The resource clients don't expose the header, so send such a request through `client.httpClient.call()`:

```js
import { readFile } from 'node:fs/promises';

// A file that is gzipped on disk already.
const report = await readFile('report.json.gz');

// The explicit content encoding stops the client from compressing the bytes again.
await client.httpClient.call({
    url: `${client.baseUrl}/key-value-stores/my-store-id/records/report.json`,
    method: 'PUT',
    data: report,
    headers: { 'content-type': 'application/json', 'content-encoding': 'gzip' },
    timeoutSecs: 'long',
});
```

The header is forwarded verbatim, so it also covers encodings the client ships no compressor for, such as `deflate`. The API accepts `gzip`, `br`, `deflate`, and `identity`. Passing `identity` turns compression off for a single request without changing how the client is configured.

The client can't verify that the bytes match the header, so set `Content-Encoding` only when the payload really is encoded that way. Key-value store records are stored exactly as you upload them, which makes the header part of the stored record rather than a transport detail.

## Configuration

To choose the compression algorithm, pass `compression` to the client constructor:

```js
import { ApifyClient } from 'apify-client';

// Default: brotli
const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Gzip
const gzipClient = new ApifyClient({ token: 'MY-APIFY-TOKEN', compression: 'gzip' });
```

Both algorithms come from `node:zlib`, so neither needs an extra dependency. If the runtime's `node:zlib` doesn't implement brotli, which can happen with a Node.js compatibility shim or a bundler polyfill, the request fails with the error from the runtime. The client doesn't fall back to gzip on its own, so pass `compression: 'gzip'` on such a runtime.

## Compression quality and custom compressors

To set the compression quality, pass an <ApiLink to="class/HttpCompressor">`HttpCompressor`</ApiLink> instance instead of a name:

```js
import { ApifyClient, BrotliHttpCompressor, GzipHttpCompressor } from 'apify-client';

// Brotli at maximum quality
const client = new ApifyClient({
    token: 'MY-APIFY-TOKEN',
    compression: new BrotliHttpCompressor({ quality: 11 }),
});

// Gzip at the fastest level
const fastClient = new ApifyClient({
    token: 'MY-APIFY-TOKEN',
    compression: new GzipHttpCompressor({ quality: 1 }),
});
```

You can also implement a custom compressor by extending <ApiLink to="class/HttpCompressor">`HttpCompressor`</ApiLink>. The client calls it only for bodies that reach the [minimum body size](#minimum-body-size) and aren't [already compressed](#already-compressed-payloads) or [pre-compressed by the caller](#pre-compressed-bodies):

```js
import { ApifyClient, HttpCompressor } from 'apify-client';

class IdentityCompressor extends HttpCompressor {
    /** Value sent in the `Content-Encoding` header. */
    contentEncoding = 'identity';

    /** Returns the body as it is, so nothing gets compressed. */
    async compress(data) {
        return data;
    }
}

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN', compression: new IdentityCompressor() });
```

## Comparison

|                               | Brotli                                  | Gzip                                  |
|-------------------------------|-----------------------------------------|---------------------------------------|
| **Compression ratio**         | Typically better than gzip              | Good                                  |
| **CPU cost**                  | Moderate, depends on quality            | Low                                   |
| **`Content-Encoding` header** | `br`                                    | `gzip`                                |
| **Quality range**             | `0` to `11`                             | `1` to `9`                            |
| **Default quality**           | `6`                                     | `6`                                   |
| **Enable via config**         | `compression: 'brotli'` (default)       | `compression: 'gzip'`                 |
| **Best for**                  | Large payloads where bandwidth matters  | Low CPU cost, runtimes without brotli |
