---
sidebar_label: 'Quick start'
title: 'Quick start'
---

# Apify API client for JavaScript

`apify-client` is the official library to access [Apify API](https://docs.apify.com/api/v2) from your
JavaScript applications. It runs both in Node.js and browser and provides useful features like
automatic retries and convenience functions that improve the experience of using the Apify API.

You can install the client via the [npm package](https://www.npmjs.com/package/apify-client). To do that, simply run `npm i apify-client`.

## Quick Start

```js
const { ApifyClient } = require('apify-client');

const client = new ApifyClient({
    token: 'MY-APIFY-TOKEN',
});

// Starts an actor and waits for it to finish.
const { defaultDatasetId } = await client.actor('john-doe/my-cool-actor').call();
// Fetches results from the actor's dataset.
const { items } = await client.dataset(defaultDatasetId).listItems();
```
