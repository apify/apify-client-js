---
id: bundled-environments
title: Use in bundled environments
sidebar_label: Bundled environments
description: 'Use the Apify API client for JavaScript in browsers, Cloudflare Workers, and other edge runtimes.'
---

:::warning Advanced

This applies only to non-Node.js environments (browsers, Cloudflare Workers, edge runtimes). If you're running on Node.js, you can skip this section.

:::

The package ships a pre-built browser bundle that is automatically resolved when your bundler targets a browser environment. If it isn't picked up automatically, you can import it directly:

```js
import { ApifyClient } from 'apify-client/browser';
```

For Cloudflare Workers or other edge runtimes that don't provide Node built-ins, you may need to enable Node compatibility in your runtime config (e.g. `node_compat = true`.

Note that some Node-specific features (streaming APIs, proxy) are not available in the browser bundle.
