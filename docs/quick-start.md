---
sidebar_label: 'Quick Start'
title: 'Quick Start'
---

Learn how to start Actors and retrieve their results using the Apify Client.

---

## Step 1: Start an Actor

One of the most common use cases is starting [Actors](https://docs.apify.com/platform/actors) (serverless programs running in the [Apify cloud](https://docs.apify.com/platform)) and getting results from their [datasets](https://docs.apify.com/platform/storage/dataset) (storage) after they finish the job (usually scraping, automation processes or data processing).

To start an Actor, use the [ActorClient](/reference/class/ActorClient) (`client.actor()`) and pass the Actor's ID (e.g. `john-doe/my-cool-actor`) to define which Actor you want to run.

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Starts an Actor and waits for it to finish
const { defaultDatasetId } = await client.actor('john-doe/my-cool-actor').call();

// Lists items from the Actor's dataset
const { items } = await client.dataset(defaultDatasetId).listItems();
```

:::info Actor ID

The Actor's ID is a combination of the username and the Actor owner's username. You can run both your own Actors and [Actors from Apify Store](https://docs.apify.com/platform/actors/running/actors-in-store).

:::

### Passing input to the Actor

To define the Actor's input, you can pass an object to the [`call()`](/reference/class/ActorClient#call) method. The input object can be any JSON object that the Actor expects (respects the Actor's [input schema](https://docs.apify.com/platform/actors/development/actor-definition/input-schema)). The input object is used to pass configuration to the Actor, such as URLs to scrape, search terms, or any other data.

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Runs an Actor with an input and waits for it to finish.
const { defaultDatasetId } = await client.actor('username/actor-name').call({
    some: 'input',
});
```

## Step 2: Get results from the dataset

To get the results from the dataset, you can use the [DatasetClient](/reference/class/DatasetClient) (`client.dataset()`) and [`listItems()`](/reference/class/DatasetClient#listItems) method. You need to pass the dataset ID to define which dataset you want to access. You can get the dataset ID from the Actor's run object (represented by `defaultDatasetId`).

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Lists items from the Actor's dataset.
const { items } = await client.dataset('dataset-id').listItems();
```

:::info Dataset access

Running an Actor might take time, depending on the Actor's complexity and the amount of data it processes. If you want only to get data and have an immediate response you should access the existing dataset of the finished [Actor run](https://docs.apify.com/platform/actors/running/runs-and-builds#runs).

:::

## Next steps

- Check out the various [use cases](/api/client/js/docs/next/use-cases/passing-input)