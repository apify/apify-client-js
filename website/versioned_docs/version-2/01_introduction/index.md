---
id: introduction
title: Overview
sidebar_label: Overview
slug: /
description: 'The official JavaScript library to access the Apify API, with automatic retries, TypeScript support, and cross-platform compatibility.'
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

The Apify API client is the official library to access the [Apify REST API](https://docs.apify.com/api/v2) from your JavaScript/TypeScript applications. It runs both in Node.js and browser and provides useful features like automatic retries and convenience functions that improve the experience of using the Apify API.

The client simplifies interaction with the Apify platform by providing:

- Intuitive methods for working with [Actors](https://docs.apify.com/platform/actors), [datasets](https://docs.apify.com/platform/storage/dataset), [key-value stores](https://docs.apify.com/platform/storage/key-value-store), and other Apify resources
- Intelligent parsing of API responses and rich error messages for debugging
- Built-in [exponential backoff](../02_concepts/02_error-handling.md#retries-with-exponential-backoff) for failed requests
- Full TypeScript support with comprehensive type definitions
- Cross-platform compatibility in [Node.js](https://nodejs.org/) v16+ and modern browsers

All requests and responses (including errors) are encoded in JSON format with UTF-8 encoding.

## Pre-requisites

`apify-client` requires Node.js version 16 or higher. Node.js is available for download on the [official website](https://nodejs.org/). Check for your current Node.js version by running:

```bash
node -v
```

## Installation

You can install the client via [NPM](https://www.npmjs.com/) or any other package manager of your choice.

<Tabs groupId="main">
<TabItem value="npm" label="NPM">

```bash
npm i apify-client
```

</TabItem>
<TabItem value="yarn" label="Yarn">

```bash
yarn add apify-client
```

</TabItem>
<TabItem value="pnpm" label="PNPM">

```bash
pnpm add apify-client
```

</TabItem>
<TabItem value="bun" label="Bun">

```bash
bun add apify-client
```

</TabItem>
</Tabs>

## Quick example

Here's an example showing how to run an Actor and retrieve its results:

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

> You can find your API token in the [Integrations section](https://console.apify.com/account/integrations) of Apify Console. See the [Quick start guide](./quick-start.md) for more details on authentication.
