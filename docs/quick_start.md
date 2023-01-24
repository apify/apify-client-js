---
sidebar_label: 'Quick Start'
---

# Quick Start
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
