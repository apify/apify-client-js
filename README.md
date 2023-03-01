# Apify API client for JavaScript
`apify-client` is the official library to access [Apify API](https://docs.apify.com/api/v2) from your
JavaScript applications. It runs both in Node.js and browser and provides useful features like
automatic retries and convenience functions that improve the experience of using the Apify API.

<!-- toc -->

- [Quick Start](#quick-start)
- [Features](#features)
  * [Automatic parsing and error handling](#automatic-parsing-and-error-handling)
  * [Retries with exponential backoff](#retries-with-exponential-backoff)
  * [Convenience functions and options](#convenience-functions-and-options)
- [Usage concepts](#usage-concepts)
  * [Nested clients](#nested-clients)
  * [Pagination](#pagination)
- [API Reference](#api-reference)

<!-- tocstop -->

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

## Features
Besides greatly simplifying the process of querying the Apify API, the client provides other useful features.

### Automatic parsing and error handling
Based on the endpoint, the client automatically extracts the relevant data and returns it in the
expected format. Date strings are automatically converted to `Date` objects. For exceptions,
we throw an `ApifyApiError`, which wraps the plain JSON errors returned by API and enriches
them with other context for easier debugging.

### Retries with exponential backoff
Network communication sometimes fails, that's a given. The client will automatically retry requests that
failed due to a network error, an internal error of the Apify API (HTTP 500+) or rate limit error (HTTP 429).
By default, it will retry up to 8 times. First retry will be attempted after ~500ms, second after ~1000ms
and so on. You can configure those parameters using the `maxRetries` and `minDelayBetweenRetriesMillis`
options of the `ApifyClient` constructor.

### Convenience functions and options
Some actions can't be performed by the API itself, such as indefinite waiting for an actor run to finish
(because of network timeouts). The client provides convenient `call()` and `waitForFinish()` functions that do that.
Key-value store records can be retrieved as objects, buffers or streams via the respective options, dataset items
can be fetched as individual objects or serialized data and we plan to add better stream support and async iterators.

## Usage concepts
The `ApifyClient` interface follows a generic pattern that is applicable to all of its components.
By calling individual methods of `ApifyClient`, specific clients which target individual API
resources are created. There are two types of those clients. A client for management of a single
resource and a client for a collection of resources.

```js
const { ApifyClient } = require('apify-client');
const apifyClient = new ApifyClient({ token: 'my-token' });

// Collection clients do not require a parameter.
const actorCollectionClient = apifyClient.actors();
// Creates an actor with the name: my-actor.
const myActor = await actorCollectionClient.create({ name: 'my-actor' });
// Lists all of your actors.
const { items } = await actorCollectionClient.list();
```

```js
// Collection clients do not require a parameter.
const datasetCollectionClient = apifyClient.datasets();
// Gets (or creates, if it doesn't exist) a dataset with the name of my-dataset.
const myDataset = await datasetCollectionClient.getOrCreate('my-dataset');
```

```js
// Resource clients accept an ID of the resource.
const actorClient = apifyClient.actor('john-doe/my-actor');
// Fetches the john-doe/my-actor object from the API.
const myActor = await actorClient.get();
// Starts the run of john-doe/my-actor and returns the Run object.
const myActorRun = await actorClient.start();
```

```js
// Resource clients accept an ID of the resource.
const datasetClient = apifyClient.dataset('john-doe/my-dataset');
// Appends items to the end of john-doe/my-dataset.
await datasetClient.pushItems([{ foo: 1 }, { bar: 2 }]);
```

> The ID of the resource can be either the `id` of the said resource,
> or a combination of your `username/resource-name`.

This is really all you need to remember, because all resource clients
follow the pattern you see above.

### Nested clients
Sometimes clients return other clients. That's to simplify working with
nested collections, such as runs of a given actor.

```js
const actorClient = apifyClient.actor('john-doe/hello-world');
const runsClient = actorClient.runs();
// Lists the last 10 runs of the john-doe/hello-world actor.
const { items } = await runsClient.list({ limit: 10, desc: true })

// Selects the last run of the john-doe/hello-world actor that finished
// with a SUCCEEDED status.
const lastSucceededRunClient = actorClient.lastRun({ status: 'SUCCEEDED' });
// Fetches items from the run's dataset.
const { items } = await lastSucceededRunClient.dataset().listItems();
```

> The quick access to `dataset` and other storages directly from the run
> client can now only be used with the `lastRun()` method, but the feature
> will be available to all runs in the future.

### Pagination
Most methods named `list` or `listSomething` return a [<code>Promise.&lt;PaginationList&gt;</code>](/api/interface/PaginatedList).
There are some exceptions though, like `listKeys` or `listHead` which paginate differently.
The results you're looking for are always stored under `items` and you can use the `limit`
property to get only a subset of results. Other props are also available, depending on the method.

## API Reference
All public classes, methods and their parameters can be inspected in the [API reference](/api).
