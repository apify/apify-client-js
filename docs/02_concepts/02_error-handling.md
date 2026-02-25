---
id: error-handling
title: Error handling and retries
sidebar_label: Error handling and retries
description: 'Handle API errors and configure automatic retries with exponential backoff in the Apify API client for JavaScript.'
---

Based on the endpoint, the client automatically extracts the relevant data and returns it in the expected format. Date strings are automatically converted to `Date` objects. For exceptions, the client throws an [`ApifyApiError`](/reference/class/ApifyApiError), which wraps the plain JSON errors returned by API and enriches them with other contexts for easier debugging.

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

## Retries with exponential backoff

The client automatically retries requests that fail due to network errors, Apify API internal errors (HTTP 500+), or rate limit errors (HTTP 429). By default, the client retries up to 8 times with exponential backoff starting at 500ms.

To configure retry behavior, set the `maxRetries` and `minDelayBetweenRetriesMillis` options in the `ApifyClient` constructor:

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
    token: 'MY-APIFY-TOKEN',
    maxRetries: 8,
    minDelayBetweenRetriesMillis: 500, // 0.5s
    timeoutSecs: 360, // 6 mins
});
```
