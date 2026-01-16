---
sidebar_label: 'Installation'
title: 'Installation'
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Learn how to install Apify Client using NPM, Yarn, PNPM, or Bun.

---

## Prerequisites

Apify Client requires Node.js version 22 or higher. Node.js is available for download on the [official website](https://nodejs.org/). 

Check for your current node version by running:

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

## Usage concepts

The `ApifyClient` interface follows a generic pattern that applies to all of its components. By calling individual methods of `ApifyClient`, specific clients that target individual API resources are created. There are two types of those clients:

- [`actorClient`](/reference/class/ActorClient): a client for the management of a single resource
- [`actorCollectionClient`](/reference/class/ActorCollectionClient): a client for the collection of resources

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

The resource ID can be either the `id` of the said resource, or a combination of your `username/resource-name`.

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

## Next steps

- Check out the [quick start](quick-start.md) guide