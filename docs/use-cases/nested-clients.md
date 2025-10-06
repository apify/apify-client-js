---
sidebar_label: 'Nested clients'
title: 'Nested clients'
---

Sometimes clients return other clients. That's to simplify working with nested collections, such as runs of a given Actor.

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

const actorClient = client.actor('username/actor-name');
const runsClient = actorClient.runs();
// Lists the last 10 runs of your Actor.
const { items } = await runsClient.list({
    limit: 10,
    desc: true,
});

// Select the last run of your Actor that finished
// with a SUCCEEDED status.
const lastSucceededRunClient = actorClient.lastRun({ status: 'SUCCEEDED' });
// Fetches items from the run's dataset.
const { items } = await lastSucceededRunClient.dataset().listItems();
```

The quick access to `dataset` and other storage directly from the run client can be used with the [`lastRun()`](/reference/class/ActorClient#lastRun) method.

## Features

Based on the endpoint, the client automatically extracts the relevant data and returns it in the expected format. Date strings are automatically converted to `Date` objects. For exceptions, the client throws an [`ApifyApiError`](/reference/class/ApifyApiError), which wraps the plain JSON errors returned by API and enriches them with other contexts for easier debugging.

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

try {
    const { items } = await client.dataset('non-existing-dataset-id').listItems();
} catch (error) {
    // The error is an instance of ApifyApiError
    const { message, type, statusCode, clientMethod, path } = error;
    // Log error for easier debugging
    console.log({ message, statusCode, clientMethod, type });
}
```
