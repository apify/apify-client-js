---
id: bundled-environments
title: Use in bundled environments
sidebar_label: Bundled environments
description: 'Use the Apify API client for JavaScript in browsers, Cloudflare Workers, and other edge runtimes.'
---

import ApiLink from '@theme/ApiLink';

:::warning Non-Node.js environments

This page applies only to non-Node.js environments (browsers, Cloudflare Workers, edge runtimes). If you're running on Node.js, you can skip it.

:::

## Browser bundle

The package ships a pre-built browser bundle at `dist/bundle.js`. A bundler that targets the browser picks it up through the `browser` condition of the package's `exports` field. If yours doesn't, import it directly:

```js
import { ApifyClient } from 'apify-client/browser';
```

The bundle includes polyfills for the Node.js built-ins the client's dependencies import, so it needs no polyfill configuration.

## Bundling the ES module build yourself

The client's own code runs on Web APIs. The parts that need Node.js built-ins, the keep-alive HTTP agents with proxy support and request body compression, live in a single module that the `#runtime` entry of the package's `imports` field selects at bundle time. The `node` condition gets the Node.js implementation, every other target gets the Web API one. A bundler targeting a browser, Cloudflare Workers, or another edge runtime therefore never sees `node:zlib`, `node:os`, `node:util`, or `proxy-agent`.

Reaching the ES module build takes a bundler that doesn't set the `browser` condition, which resolves `apify-client` to the pre-built bundle. esbuild's `neutral` platform sets no conditions, and webpack and Vite let you list them through `resolve.conditionNames` and `resolve.conditions`.

Two dependencies still import Node.js built-ins:

- `@apify/log` imports `node:events` and reads `process.env`.
- `@apify/utilities` imports `node:stream` and `node:crypto`, and uses `Buffer`.

Until [apify/apify-shared-js#537](https://github.com/apify/apify-shared-js/issues/537) removes them, bundling the ES module build for a non-Node.js target needs polyfills for `events`, `process`, `stream`, and `buffer`. The `node:crypto` import can resolve to an empty module, because only deprecated functions the client doesn't call use it. On Cloudflare Workers, the [`nodejs_compat`](https://developers.cloudflare.com/workers/runtime-apis/nodejs/) compatibility flag provides all of them.

## Features that need Node.js

These features rely on Node.js APIs and aren't available in the browser bundle or in the Web API runtime:

- Log streaming with <ApiLink to="class/LogClient#stream">`LogClient.stream()`</ApiLink> and <ApiLink to="class/RunClient#getStreamedLog">`RunClient.getStreamedLog()`</ApiLink>, and the `stream` option of <ApiLink to="class/KeyValueStoreClient#getRecord">`KeyValueStoreClient.getRecord()`</ApiLink>, which all return a Node.js `Readable` stream.
- Proxy support through the `HTTP_PROXY`, `HTTPS_PROXY`, and `NO_PROXY` environment variables.
- Request body compression.
- The `User-Agent` header, which browsers don't let a page set.
