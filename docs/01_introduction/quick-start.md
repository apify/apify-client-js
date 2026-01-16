---
sidebar_label: 'Quick Start'
title: 'Quick Start'
description: 'Get started with the Apify client for JavaScript by running your first Actor and retrieving results.'
---

Learn how to start Actors and retrieve their results using the Apify Client.

---

## Step 1: Authentication and initialization

To use the client, you need an [API token](/platform/integrations/api#api-token). You can find your token under the [Integrations](https://console.apify.com/account/integrations) tab in Apify Console. Copy the token and initialize the client by providing it as a parameter to the `ApifyClient` constructor.

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
    token: 'MY-APIFY-TOKEN',
});
```

:::warning Secure access

The API token is used to authorize your requests to the Apify API. You can be charged for the usage of the underlying services, so do not share your API token with untrusted parties or expose it on the client side of your applications.

:::

## Step 2: Running your first Actor

To start an Actor, you need its ID (e.g., `john-doe/my-cool-actor`) and an API token. The Actor's ID is a combination of the Actor name and the Actor owner's username. Use the [`ActorClient`](/reference/class/ActorClient) to run the Actor and wait for it to complete. You can run both your own Actors and [Actors from Apify Store](https://docs.apify.com/platform/actors/running/actors-in-store).

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
    token: 'MY-APIFY-TOKEN',
});

// Starts an Actor and waits for it to finish
const { defaultDatasetId } = await client.actor('john-doe/my-cool-actor').call();
```

### Passing input to the Actor

Actors often require input, such as URLs to scrape, search terms, or other configuration data. You can pass input as a JSON object when starting the Actor using the [`ActorClient.call`](/reference/class/ActorClient#call) method. Actors respect the input schema defined in the Actor's [input schema](https://docs.apify.com/platform/actors/development/actor-definition/input-schema).

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
    token: 'MY-APIFY-TOKEN',
});

// Runs an Actor with input and waits for it to finish
const { defaultDatasetId } = await client.actor('john-doe/my-cool-actor').call({
    startUrls: [{ url: 'https://example.com' }],
    maxDepth: 3,
});
```

## Step 3: Getting results from the dataset

To get the results from the dataset, you can use the [`DatasetClient`](/reference/class/DatasetClient) ([`ApifyClient.dataset`](/reference/class/ApifyClient#dataset)) and [`DatasetClient.listItems`](/reference/class/DatasetClient#listItems) method. You need to pass the dataset ID to define which dataset you want to access. You can get the dataset ID from the Actor's run object (represented by `defaultDatasetId`).

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
    token: 'MY-APIFY-TOKEN',
});

// Starts an Actor and waits for it to finish
const { defaultDatasetId } = await client.actor('john-doe/my-cool-actor').call();

// Lists items from the Actor's dataset
const { items } = await client.dataset(defaultDatasetId).listItems();

// Process the results
items.forEach((item) => {
    console.log(item);
});
```

:::note Dataset access

Running an Actor might take time, depending on the Actor's complexity and the amount of data it processes. If you want only to get data and have an immediate response, you should access the existing dataset of the finished [Actor run](https://docs.apify.com/platform/actors/running/runs-and-builds#runs).

:::