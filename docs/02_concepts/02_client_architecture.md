---
sidebar_label: 'Client Architecture'
title: 'Client Architecture'
description: 'Understand the hierarchical structure of Apify Client, including collection clients, resource clients, and nested client patterns.'
---

## Overview

The Apify Client follows a hierarchical pattern where the main `ApifyClient` instance creates specialized clients for different API resources. This architecture mirrors the structure of the Apify API itself, making it intuitive to navigate between resources.

## Client Hierarchy

```
ApifyClient
├── Collection Clients (manage multiple resources)
│   ├── actors()          → ActorCollectionClient
│   ├── datasets()        → DatasetCollectionClient
│   ├── keyValueStores()  → KeyValueStoreCollectionClient
│   └── ...
└── Resource Clients (manage single resource)
    ├── actor(id)         → ActorClient
    ├── dataset(id)       → DatasetClient
    ├── keyValueStore(id) → KeyValueStoreClient
    └── ...
```

## Two Types of Clients

### Collection Clients

Collection clients manage operations on multiple resources. They don't require any parameters and provide methods like `list()`, `create()`, and `getOrCreate()`.

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Collection client - no ID required
const actorCollectionClient = client.actors();

// List all actors
const { items } = await actorCollectionClient.list();

// Create a new actor
const newActor = await actorCollectionClient.create({
    name: 'my-actor-name'
});
```

**Common collection client methods:**
- `list()` - List resources with pagination
- `create()` - Create a new resource
- `getOrCreate()` - Get existing or create new resource

### Resource Clients

Resource clients manage operations on a single, specific resource. They require a resource ID and provide methods like `get()`, `update()`, and `delete()`.

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Resource client - requires ID
const actorClient = client.actor('username/actor-name');

// Get actor details
const actor = await actorClient.get();

// Start the actor
const run = await actorClient.start();

// Update actor settings
await actorClient.update({
    name: 'new-name'
});
```

**Common resource client methods:**
- `get()` - Fetch resource details
- `update()` - Modify resource
- `delete()` - Remove resource
- Resource-specific methods (e.g., `start()` for actors)

## Resource Identification

Resources can be identified in two ways:

1. **By ID**: The unique identifier of the resource
   ```js
   client.actor('dSCLg0C3YEZ83HzYX')
   ```

2. **By username/name**: A combination of owner's username and resource name
   ```js
   client.actor('john-doe/my-actor')
   ```

:::note Resource Identification

The resource ID can be either the `id` of the said resource, or a combination of your `username/resource-name`.

:::

## Nested Clients

Clients can return other clients to simplify working with nested resources. This is particularly useful for accessing related resources like runs of an actor or datasets of a run.

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Get an actor client
const actorClient = client.actor('username/actor-name');

// Get the runs collection client for this actor
const runsClient = actorClient.runs();

// List recent runs
const { items } = await runsClient.list({ limit: 10 });

// Access specific run
const runClient = actorClient.run('run-id');

// Access the run's dataset directly
const runDataset = runClient.dataset();
const { items: datasetItems } = await runDataset.listItems();
```

### Nested Client Pattern

The nested client pattern allows for intuitive traversal of related resources:

```
ActorClient
└── runs()              → ActorRunCollectionClient
    └── run(id)         → ActorRunClient
        ├── dataset()   → DatasetClient
        ├── keyValueStore() → KeyValueStoreClient
        └── log()       → LogClient
```

## When to Use Each Pattern

### Use Collection Clients When:
- Listing multiple resources
- Creating new resources
- Searching or filtering resources
- You don't know the specific resource ID

### Use Resource Clients When:
- Working with a specific resource
- Starting an actor
- Fetching data from a specific dataset
- Updating or deleting a resource

### Use Nested Clients When:
- Accessing related resources (e.g., actor's runs)
- Following resource relationships
- Working with run-specific data (datasets, logs)
- Simplifying access to deeply nested resources

## Client Method Chaining

The client architecture allows for elegant method chaining:

```js
// Chain through nested resources
const items = await client
    .actor('username/actor-name')
    .lastRun({ status: 'SUCCEEDED' })
    .dataset()
    .listItems();
```

This pattern is more readable than:

```js
// Without chaining
const actorClient = client.actor('username/actor-name');
const runClient = actorClient.lastRun({ status: 'SUCCEEDED' });
const datasetClient = runClient.dataset();
const { items } = await datasetClient.listItems();
```

## Type Safety

All clients are fully typed when using TypeScript, providing autocomplete and type checking:

```typescript
import { ApifyClient } from 'apify-client';
import type { ActorClient, ActorCollectionClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// TypeScript knows the return types
const actorCollection: ActorCollectionClient = client.actors();
const actorResource: ActorClient = client.actor('my-actor');
```

## Next Steps

- Learn about [nested clients](06_nested_clients.md) in detail
- See [authentication](01_authentication.md) for setting up the main client
- Explore [pagination](05_pagination.md) when working with collection clients
