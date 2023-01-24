---
sidebar_label: 'Quick start'
---

# Apify API client for JavaScript
`apify-client` is the official library to access [Apify API](https://docs.apify.com/api/v2) from your
JavaScript applications. It runs both in Node.js and browser and provides useful features like
automatic retries and convenience functions that improve the experience of using the Apify API.

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
