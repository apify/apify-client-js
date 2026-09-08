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

## Telling API errors apart

The client throws the <ApiLink to="class/ApifyApiError">`ApifyApiError`</ApiLink> subclass that matches the HTTP status code of the response, so a `catch` block can branch on `instanceof` instead of comparing status codes:

| Status | Subclass |
| --- | --- |
| 400 | <ApiLink to="class/InvalidRequestError">`InvalidRequestError`</ApiLink> |
| 401 | <ApiLink to="class/UnauthorizedError">`UnauthorizedError`</ApiLink> |
| 403 | <ApiLink to="class/ForbiddenError">`ForbiddenError`</ApiLink> |
| 404 | <ApiLink to="class/NotFoundError">`NotFoundError`</ApiLink> |
| 409 | <ApiLink to="class/ConflictError">`ConflictError`</ApiLink> |
| 429 | <ApiLink to="class/RateLimitError">`RateLimitError`</ApiLink> |
| 5xx | <ApiLink to="class/ServerError">`ServerError`</ApiLink> |

Any other status code throws a plain `ApifyApiError`. Every subclass extends `ApifyApiError`, so `instanceof ApifyApiError` still matches all of them.

```js
import { ApifyClient, NotFoundError, RateLimitError } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

try {
    await client.actor('my-actor').call({ url: 'https://example.com' });
} catch (error) {
    if (error instanceof NotFoundError) {
        // The Actor doesn't exist, or the token can't see it.
    } else if (error instanceof RateLimitError) {
        // The retries are exhausted, so back off and try again later.
    } else {
        throw error;
    }
}
```

Errors with the same status code differ in `type`, the machine-readable identifier the API returns. The field is typed with the known values, so your editor autocompletes them:

```js
import { ApifyApiError, ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

try {
    await client.actor('my-actor').call({ url: 'https://example.com' }, { memory: 32768 });
} catch (error) {
    if (error instanceof ApifyApiError && error.type === 'actor-memory-limit-exceeded') {
        // The account has no memory left for another run, so wait and start it later.
    } else {
        throw error;
    }
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

## Invalid responses

After a request succeeds, the client validates the response against a [zod](https://zod.dev) schema generated from the [Apify OpenAPI specification](https://docs.apify.com/api/v2) before returning it. A response that doesn't match what the specification describes throws a <ApiLink to="class/ResponseValidationError">`ResponseValidationError`</ApiLink>. Its `message` names the request and every offending field, and `issues` and `cause` carry the structured detail, the same way `ArgumentValidationError` does.

Fields the specification doesn't describe and enum values it doesn't list pass through, so the client keeps working when the API grows. What the check catches is the API and its specification disagreeing: a missing required field, a different type, or a value outside the documented range. Such a mismatch would otherwise surface later as an `undefined` where the types promise a value. If you run into one, please [report it](https://github.com/apify/apify-client-js/issues).

```js
import { ApifyClient, ResponseValidationError } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

try {
    await client.actor('my-actor').get();
} catch (error) {
    if (error instanceof ResponseValidationError) {
        // Response from GET https://api.apify.com/v2/acts/my-actor does not match the API schema:
        // Invalid input: expected string, received null at `name`
        // The API returned something its OpenAPI specification does not describe. Please report this at https://github.com/apify/apify-client-js/issues.
        console.log(error.message);
        console.log(error.issues);
    }
}
```

Bodies the specification leaves to you aren't validated: dataset items, key-value store records and logs are returned as they are.

## Retries with exponential backoff

The client automatically retries requests that fail due to network errors, Apify API internal errors (HTTP 500+), or rate limit errors (HTTP 429). By default, the client retries up to 8 times with exponential backoff starting at 500ms.

To configure retry behavior, set the `maxRetries` and `minDelayBetweenRetriesMillis` options in the `ApifyClient` constructor:

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
    token: 'MY-APIFY-TOKEN',
    maxRetries: 8,
    minDelayBetweenRetriesMillis: 500, // 0.5s
});
```

A request that times out is retried the same way, with a longer timeout on each attempt. For how the timeouts are set, see [Timeouts](./06_timeouts.md).
