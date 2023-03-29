---
sidebar_label: 'Usage concepts'
---

# Usage concepts

The `ApifyClient` interface follows a generic pattern that is applicable to all of its components. By calling individual methods of `ApifyClient`, specific clients which target individual API resources are created. There are two types of those clients. A client for management of a single resource and a client for a collection of resources.

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

> The ID of the resource can be either the `id` of the said resource, or a combination of your `username/resource-name`.

This is really all you need to remember, because all resource clients follow the pattern you see above.

## Nested clients

Sometimes clients return other clients. That's to simplify working with nested collections, such as runs of a given actor.

```js
const actorClient = apifyClient.actor('john-doe/hello-world');
const runsClient = actorClient.runs();
// Lists the last 10 runs of the john-doe/hello-world actor.
const { items } = await runsClient.list({
    limit: 10,
    desc: true
})

// Selects the last run of the john-doe/hello-world actor that finished
// with a SUCCEEDED status.
const lastSucceededRunClient = actorClient.lastRun({ status: 'SUCCEEDED' });
// Fetches items from the run's dataset.
const { items } = await lastSucceededRunClient.dataset()
    .listItems();
```

> The quick access to `dataset` and other storages directly from the run client can now only be used with the `lastRun()` method, but the feature will be available to all runs in the future.

## Pagination

Most methods named `list` or `listSomething` return a [`Promise<PaginatedList>`](/reference/interface/PaginatedList). There are some exceptions though, like `listKeys` or `listHead` which paginate differently. The results you're looking for are always stored under `items` and you can use the `limit` property to get only a subset of results. Other props are also available, depending on the method.
