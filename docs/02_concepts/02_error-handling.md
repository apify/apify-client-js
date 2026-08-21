---
id: error-handling
title: Error handling and retries
sidebar_label: Error handling and retries
description: 'Handle API errors and configure automatic retries with exponential backoff in the Apify API client for JavaScript.'
---

import ApiLink from '@theme/ApiLink';

Based on the endpoint, the client automatically extracts the relevant data and returns it in the expected format. Date strings are automatically converted to `Date` objects. For exceptions, the client throws an <ApiLink to="class/ApifyApiError">`ApifyApiError`</ApiLink>, which wraps the plain JSON errors returned by API and enriches them with other contexts for easier debugging.

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

## Invalid arguments

Before sending a request, the client validates the arguments you passed. When a value doesn't match the expected shape, the client throws an <ApiLink to="class/ArgumentValidationError">`ArgumentValidationError`</ApiLink> without reaching the API. Its `message` names the offending field and the value it received. For programmatic inspection, `issues` carries the structured [zod](https://zod.dev) issues and `cause` carries the original `ZodError`.

```js
import { ApifyClient, ArgumentValidationError } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

try {
    await client.dataset('my-dataset').listItems({ limit: 'ten' });
} catch (error) {
    if (error instanceof ArgumentValidationError) {
        // Invalid input: expected number, received string at `limit`, got `ten`
        console.log(error.message);
        // [{ code: 'invalid_type', expected: 'number', path: ['limit'], ... }]
        console.log(error.issues);
    }
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
