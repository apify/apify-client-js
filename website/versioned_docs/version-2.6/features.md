---
sidebar_label: 'Features'
---

# Features
Besides greatly simplifying the process of querying the Apify API, the client provides other useful features.

## Automatic parsing and error handling
Based on the endpoint, the client automatically extracts the relevant data and returns it in the
expected format. Date strings are automatically converted to `Date` objects. For exceptions,
we throw an `ApifyApiError`, which wraps the plain JSON errors returned by API and enriches
them with other context for easier debugging.

## Retries with exponential backoff
Network communication sometimes fails, that's a given. The client will automatically retry requests that
failed due to a network error, an internal error of the Apify API (HTTP 500+) or rate limit error (HTTP 429).
By default, it will retry up to 8 times. First retry will be attempted after ~500ms, second after ~1000ms
and so on. You can configure those parameters using the `maxRetries` and `minDelayBetweenRetriesMillis`
options of the `ApifyClient` constructor.

## Convenience functions and options
Some actions can't be performed by the API itself, such as indefinite waiting for an actor run to finish
(because of network timeouts). The client provides convenient `call()` and `waitForFinish()` functions that do that.
Key-value store records can be retrieved as objects, buffers or streams via the respective options, dataset items
can be fetched as individual objects or serialized data and we plan to add better stream support and async iterators.
