---
id: usage-patterns
title: Usage patterns
sidebar_label: Usage patterns
description: 'Learn the resource client and collection client patterns used by the Apify API client for JavaScript.'
---

The `ApifyClient` interface follows a generic pattern that applies to all of its components. By calling individual methods of `ApifyClient`, specific clients that target individual API resources are created. There are two types of those clients:

- [`ActorClient`](/reference/class/ActorClient): a client for the management of a single resource
- [`ActorCollectionClient`](/reference/class/ActorCollectionClient): a client for the collection of resources

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Collection clients do not require a parameter.
const actorCollectionClient = client.actors();
// Creates an actor with the name: my-actor.
const myActor = await actorCollectionClient.create({ name: 'my-actor-name' });
// List all your used Actors (both own and from Apify Store)
const { items } = await actorCollectionClient.list();
```

:::note Resource identification

The resource ID can be either the `id` of the said resource, or a combination of your `username/resource-name`.

:::

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Resource clients accept an ID of the resource.
const actorClient = client.actor('username/actor-name');
// Fetches the john-doe/my-actor object from the API.
const myActor = await actorClient.get();
// Starts the run of john-doe/my-actor and returns the Run object.
const myActorRun = await actorClient.start();
```

## Nested clients

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

The quick access to `dataset` and other storage directly from the run client can be used with the [`lastRun()`](/reference/class/ActorClient#lastRun) method.
