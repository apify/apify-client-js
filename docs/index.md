---
sidebar_label: 'Getting started'
title: 'Getting started'
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Apify API client for JavaScript

`apify-client` is the official library to access the [Apify REST API](https://docs.apify.com/api/v2) from your JavaScript/TypeScript applications. It runs both in Node.js and browser and provides useful features like automatic retries and convenience functions that improve the experience of using the Apify API. All requests and responses (including errors) are encoded in JSON format with UTF-8 encoding.

## Pre-requisites

`apify-client` requires Node.js version 16 or higher. Node.js is available for download on the [official website](https://nodejs.org/). Check for your current node version by running:

```bash
node -v
```

## Installation

You can install the client via [NPM](https://www.npmjs.com/) or use any other package manager of your choice.

<Tabs groupId="main">
<TabItem value="npm" label="NPM">

```bash
npm i apify-client
```

</TabItem>
<TabItem value="yarn" label="Yarn">

```bash
yarn add apify-client
```

</TabItem>
<TabItem value="pnpm" label="PNPM">

```bash
pnpm add apify-client
```

</TabItem>
<TabItem value="bun" label="Bun">

```bash
bun add apify-client
```

</TabItem>
</Tabs>

## Authentication and Initialization

To use the client, you need an [API token](https://docs.apify.com/platform/integrations/api#api-token). You can find your token under [Integrations](https://console.apify.com/account/integrations) tab in Apify Console. Copy the token and initialize the client by providing the token (`MY-APIFY-TOKEN`) as a parameter to the `ApifyClient` constructor.

```js
// import Apify client
import { ApifyClient } from 'apify-client';

// Client initialization with the API token
const client = new ApifyClient({
    token: 'MY-APIFY-TOKEN',
});
```

:::warning Secure access

The API token is used to authorize your requests to the Apify API. You can be charged for the usage of the underlying services, so do not share your API token with untrusted parties or expose it on the client side of your applications

:::

## Quick start

One of the most common use cases is starting [Actors](https://docs.apify.com/platform/actors) (serverless programs running in the [Apify cloud](https://docs.apify.com/platform)) and getting results from their [datasets](https://docs.apify.com/platform/storage/dataset) (storage) after they finish the job (usually scraping, automation processes or data processing).

```js
import { ApifyClient } from 'apify-client';

const apifyClient = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Starts an Actor and waits for it to finish
const { defaultDatasetId } = await client.actor('username/actor-name').call();

// Lists items from the Actor's dataset
const { items } = await client.dataset(defaultDatasetId).listItems();
```

### Running Actors

To start an Actor, you can use the [ActorClient](/reference/class/ActorClient) (`client.actor()`) and pass the Actor's ID (e.g. `john-doe/my-cool-actor`) to define which Actor you want to run. The Actor's ID is a combination of the username and the Actor owner’s username. You can run both your own Actors and [Actors from Apify Store](https://docs.apify.com/platform/actors/running/actors-in-store).

#### Passing input to the Actor

To define the Actor's input, you can pass an object to the [`call()`](/reference/class/ActorClient#call) method. The input object can be any JSON object that the Actor expects (respects the Actor's [input schema](https://docs.apify.com/platform/actors/development/actor-definition/input-schema)). The input object is used to pass configuration to the Actor, such as URLs to scrape, search terms, or any other data.

```js
import { ApifyClient } from 'apify-client';

const apifyClient = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Runs an Actor with an input and waits for it to finish.
const { defaultDatasetId } = await client.actor('username/actor-name').call({
    some: 'input',
});
```

### Getting results from the dataset

To get the results from the dataset, you can use the [DatasetClient](/reference/class/DatasetClient) (`client.dataset()`) and [`listItems()`](/reference/class/DatasetClient#listItems) method. You need to pass the dataset ID to define which dataset you want to access. You can get the dataset ID from the Actor's run object (represented by `defaultDatasetId`).

```js
import { ApifyClient } from 'apify-client';

const apifyClient = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Lists items from the Actor's dataset.
const { items } = await client.dataset('dataset-id').listItems();
```

:::note Dataset access

Running an Actor might take time, depending on the Actor's complexity and the amount of data it processes. If you want only to get data and have an immediate response you should access the existing dataset of the finished [Actor run](https://docs.apify.com/platform/actors/running/runs-and-builds#runs).

:::

## Usage concepts

The `ApifyClient` interface follows a generic pattern that applies to all of its components. By calling individual methods of `ApifyClient`, specific clients that target individual API resources are created. There are two types of those clients:

- [`actorClient`](/reference/class/ActorClient): a client for the management of a single resource
- [`actorCollectionClient`](/reference/class/ActorCollectionClient): a client for the collection of resources

```js
import { ApifyClient } from 'apify-client';

const apifyClient = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Collection clients do not require a parameter.
const actorCollectionClient = apifyClient.actors();
// Creates an actor with the name: my-actor.
const myActor = await actorCollectionClient.create({ name: 'my-actor-name' });
// List all your used Actors (both own and from Apify Store)
const { items } = await actorCollectionClient.list();
```

:::note Resource identification

The resource ID can be either the `id` of the said resource, or a combination of your `username/resource-name`.

:::

```js
import { ApifyClient } from 'apify-client';

const apifyClient = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Resource clients accept an ID of the resource.
const actorClient = apifyClient.actor('username/actor-name');
// Fetches the john-doe/my-actor object from the API.
const myActor = await actorClient.get();
// Starts the run of john-doe/my-actor and returns the Run object.
const myActorRun = await actorClient.start();
```

### Nested clients

Sometimes clients return other clients. That's to simplify working with nested collections, such as runs of a given Actor.

```js
import { ApifyClient } from 'apify-client';

const apifyClient = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

const actorClient = apifyClient.actor('username/actor-name');
const runsClient = actorClient.runs();
// Lists the last 10 runs of your Actor.
const { items } = await runsClient.list({
    limit: 10,
    desc: true
});

// Select the last run of your Actor that finished
// with a SUCCEEDED status.
const lastSucceededRunClient = actorClient.lastRun({ status: 'SUCCEEDED' });
// Fetches items from the run's dataset.
const { items } = await lastSucceededRunClient.dataset()
    .listItems();
```

The quick access to `dataset` and other storage directly from the run client can be used with the [`lastRun()`](/reference/class/ActorClient#lastRun) method.

## Features

Based on the endpoint, the client automatically extracts the relevant data and returns it in the expected format. Date strings are automatically converted to `Date` objects. For exceptions, the client throws an [`ApifyApiError`](/reference/class/ApifyApiError), which wraps the plain JSON errors returned by API and enriches them with other contexts for easier debugging.

```js
import { ApifyClient } from 'apify-client';

const apifyClient = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

try {
    const { items } = await client.dataset("non-existing-dataset-id").listItems();
} catch (error) {
    // The error is an instance of ApifyApiError
    const { message, type, statusCode, clientMethod, path } = error;
    // Log error for easier debugging 
    console.log({ message, statusCode, clientMethod, type });
}
```

### Retries with exponential backoff

Network communication sometimes fails. That's a given. The client will automatically retry requests that failed due to a network error, an internal error of the Apify API (HTTP 500+), or a rate limit error (HTTP 429). By default, it will retry up to 8 times. The first retry will be attempted after ~500ms, the second after ~1000ms, and so on. You can configure those parameters using the `maxRetries` and `minDelayBetweenRetriesMillis` options of the `ApifyClient` constructor.

```js
import { ApifyClient } from 'apify-client';

const apifyClient = new ApifyClient({ 
    token: 'MY-APIFY-TOKEN',
    maxRetries: 8,
    minDelayBetweenRetriesMillis: 500, // 0.5s
    timeoutSecs: 360 // 6 mins
});
```

### Convenience functions and options

Some actions can't be performed by the API itself, such as indefinite waiting for an Actor run to finish (because of network timeouts). The client provides convenient `call()` and `waitForFinish()` functions that do that. If the limit is reached, the returned promise is resolved to a run object that will have status `READY` or `RUNNING` and it will not contain the Actor run output.

[Key-value store](https://docs.apify.com/platform/storage/key-value-store) records can be retrieved as objects, buffers, or streams via the respective options, dataset items can be fetched as individual objects or serialized data.

```js
import { ApifyClient } from 'apify-client';

const apifyClient = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Starts an Actor and waits for it to finish.
const finishedActorRun = await client.actor('username/actor-name').call();

// Starts an Actor and waits maximum 60s for the finish 
const { status } = await client.actor('username/actor-name').start({
    waitForFinish: 60, // 1 minute
});
```

### Pagination

Most methods named `list` or `listSomething` return a [`Promise<PaginatedList>`](/reference/interface/PaginatedList). There are some exceptions though, like `listKeys` or `listHead` which paginate differently. The results you're looking for are always stored under `items` and you can use the `limit` property to get only a subset of results. Other props are also available, depending on the method.

```js
import { ApifyClient } from 'apify-client';

const apifyClient = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Resource clients accept an ID of the resource.
const datasetClient = apifyClient.dataset('dataset-id');

// Number of items per page
const limit = 1000;
// Initial offset
let offset = 0; 
// Array to store all items
let allItems = []; 

while (true) {
    const { items, total } = await datasetClient.listItems({ limit, offset });
    
    console.log(`Fetched ${items.length} items`);
    
    // Merge new items with other already loaded items
    allItems.push(...items);
  
    // If there are no more items to fetch, exit the loading
    if (offset + limit >= total) {
        break;
    }

    offset += limit;
}

console.log(`Overall fetched ${allItems.length} items`);
```
