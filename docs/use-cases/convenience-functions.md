---
sidebar_label: 'Convenience functions'
title: 'Convenience functions'
---

Some actions can't be performed by the API itself, such as indefinite waiting for an Actor run to finish (because of network timeouts). 

The client provides convenient `call()` and `waitForFinish()` functions that do that. If the limit is reached, the returned promise is resolved to a run object that will have status `READY` or `RUNNING` and it will not contain the Actor run output.

[Key-value store](https://docs.apify.com/platform/storage/key-value-store) records can be retrieved as objects, buffers, or streams via the respective options, dataset items can be fetched as individual objects or serialized data.

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Starts an Actor and waits for it to finish.
const finishedActorRun = await client.actor('username/actor-name').call();

// Starts an Actor and waits maximum 60s for the finish
const { status } = await client.actor('username/actor-name').start({
    waitForFinish: 60, // 1 minute
});
```
