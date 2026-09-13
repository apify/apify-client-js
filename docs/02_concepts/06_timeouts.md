---
id: timeouts
title: Timeouts
sidebar_label: Timeouts
description: 'Configure the tiered timeouts that bound how long API requests made by the Apify API client for JavaScript can take.'
---

import ApiLink from '@theme/ApiLink';

The client gives every API request a timeout from one of three tiers, each with a default duration suited to the kind of request it covers. Methods that poll for a job to finish run without one:

| Tier | Default | Purpose |
| --- | --- | --- |
| `short` | 5 seconds | Metadata reads and writes (`get()`, `update()`, `delete()`) |
| `medium` | 30 seconds | Listing, batch and trigger operations (`list()`, `start()`, `batchAddRequests()`) |
| `long` | 360 seconds | Downloads, uploads and streaming (`listItems()`, `setRecord()`, `log().get()`) |
| `noTimeout` | none | Polling that waits for a job to finish (`call()`, `waitForFinish()`) |

Every client method is assigned the tier that matches the expected duration of its request. The reference of each method names its tier. You don't need to change the tiers unless you work with unusually large payloads or a slow network.

The client never aborts a request that runs without a timeout, so a connection that stalls is not retried either. <ApiLink to="class/ActorClient#call">`ActorClient.call()`</ApiLink> and <ApiLink to="class/RunClient#waitForFinish">`RunClient.waitForFinish()`</ApiLink> poll until the job ends; an explicit `timeoutSecs` bounds the requests they send, and has to leave room for the minute the API may hold each poll.

Methods such as <ApiLink to="class/ActorClient#start">`ActorClient.start()`</ApiLink> and <ApiLink to="class/RunClient#get">`RunClient.get()`</ApiLink> take a `waitForFinish` parameter, which asks the API to hold the response until the job finishes, for up to a minute. Such a request gets the requested wait on top of its tier, so the client doesn't abort it while the API is still holding it.

## Configuring the tiers

Set the duration of each tier on the <ApiLink to="class/ApifyClient">`ApifyClient`</ApiLink> constructor. The `timeoutMaxSecs` option caps the timeout of any single request attempt. It bounds the growth of the timeout across retries, and it caps tier and per-call timeouts alike, so raise it whenever you need a request timeout longer than the default 360 seconds. A tier configured above the cap is capped too, and the client logs a warning to make the cut-off visible.

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
    token: 'MY-APIFY-TOKEN',
    timeoutShortSecs: 10,
    timeoutMediumSecs: 60,
    timeoutLongSecs: 600,
    timeoutMaxSecs: 600,
});
```

A single request queue client can be held to a shorter budget with `client.requestQueue(id, { timeoutSecs })`, which caps the default tier of every request that client sends. A per-call `timeoutSecs` is not capped by it.

## Per-call overrides

Every method that sends a request accepts a `timeoutSecs` option, which replaces the tier of the method for that call. Pass a number of seconds for an exact duration, a tier name to switch tiers, or `'noTimeout'` to let the request run for as long as it takes. For the type, see <ApiLink to="interface/TimeoutOptions">`TimeoutOptions`</ApiLink>.

```js
const datasetClient = client.dataset('my-dataset-id');

// An exact timeout for this call.
const { items } = await datasetClient.listItems({ timeoutSecs: 120 });

// Another tier.
const dataset = await datasetClient.get({ timeoutSecs: 'long' });

// No timeout at all.
await datasetClient.pushItems(items, { timeoutSecs: 'noTimeout' });
```

A number above `timeoutMaxSecs` is capped at it, and the client logs a warning. To let such a call use its full timeout, raise `timeoutMaxSecs` in the client constructor.

Methods that start an Actor run keep the API's run timeout apart from the request timeout. The `runTimeoutSecs` option of `start()`, `call()` and `resurrect()` bounds how long the run may execute on the platform, while `timeoutSecs` bounds the request that starts it.

## Interaction with retries

Timeouts work together with [retries](./02_error-handling.md#retries-with-exponential-backoff). A request that times out counts as a failed attempt and is retried, up to `maxRetries` times. The timeout applies to each attempt on its own, and doubles with every retry up to `timeoutMaxSecs`, so a request that timed out at 5 seconds gets 10 seconds on the second attempt and 20 on the third.
