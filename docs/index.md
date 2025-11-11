---
sidebar_label: 'Introduction'
title: 'Apify API client for JavaScript'
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

`apify-client` is the official library to access the [Apify REST API](https://docs.apify.com/api/v2) from your JavaScript/TypeScript applications. It runs both in Node.js and browser and provides useful features like automatic retries and convenience functions that improve the experience of using the Apify API.

The client simplifies interaction with the Apify Platform by providing:

- Intuitive methods for working with [Actors](https://docs.apify.com/platform/actors), [datasets](https://docs.apify.com/platform/storage/dataset), [key-value stores](https://docs.apify.com/platform/storage/key-value-store), and other Apify resources
- Intelligent parsing of API responses and rich error messages for debugging
- Built-in [exponential backoff](./getting-started#retries-with-exponential-backoff) for failed requests
- Full TypeScript support with comprehensive type definitions
- Cross-platform compatibility in [Node.js](https://nodejs.org/) (v16+) and modern browsers

All requests and responses (including errors) are encoded in JSON format with UTF-8 encoding.

> For installation instructions, see the [Getting Started Guide](./getting-started.md).

## Quick Example

Here's a simple example showing how to run an Actor and retrieve its results:

```javascript
import { ApifyClient } from 'apify-client';

// Initialize the client with your API token
const client = new ApifyClient({
    token: 'YOUR-APIFY-TOKEN',
});

// Start an Actor and wait for it to finish
const run = await client.actor('apify/web-scraper').call({
    startUrls: [{ url: 'https://example.com' }],
    maxCrawlPages: 10,
});

// Get results from the Actor's dataset
const { items } = await client.dataset(run.defaultDatasetId).listItems();
console.log(items);
```

## Next Steps

- [Getting Started Guide](./getting-started.md) - Detailed setup and usage instructions
- [API Reference](../reference) - Complete API documentation
- [Examples](./examples) - Code examples for common use cases
