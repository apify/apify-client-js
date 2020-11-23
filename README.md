# ApifyClient
`apify-client` is the official library to access [Apify API](https://docs.apify.com/api/v2) from your
JavaScript applications. It runs both in Node.js and browser and provides useful features like
automatic retries and convenience functions that improve the experience of using the Apify API.

## Quick Start
```js
const ApifyClient = require('apify-client');

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

### Convenience functions
Some actions can't be performed by the API itself, such as indefinite waiting for an acto run to finish
(because of network timeouts). The client provides convenient `call()` and `waitForFinish()` functions that do that.
Other functions, such as an `export()` function, that will allow direct download of dataset to a file,
or async iterators will be added soon.

## Usage concepts
The `ApifyClient` interface follows a generic pattern that is applicable to all of its components.
By calling individual methods of `ApifyClient`, specific clients which target individual API
resources are created. There are two types of those clients. A client for management of a single
resource and a client for a collection of resources.

```js
const ApifyClient = require('apify-client');
const apifyClient = new ApifyClient({ token: 'my-token' });

// Collection clients do not require a parameter.
const actorCollectionClient = apifyClient.actors();
// Creates an actor with the name: my-actor.
const myActor = await actorsClient.create({ name: 'my-actor' });
// Lists all of your actors.
const { items } = await actorsClient.list();
```
```js
// Collection clients do not require a parameter.
const datasetCollectionClient = apifyClient.datasets();
// Gets (or creates, if it doesn't exist) a dataset with the name of my-dataset.
const myDataset = await datasetClient.getOrCreate('my-dataset');
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
All methods named `list` or `listSomething` return a [<code>Promise.&lt;PaginationList&gt;</code>](#PaginationList).
The results you're looking for are always stored under `items` and you can use the `limit`
and `offset` properties to iterate over large collections of resources and data.

# API Reference
All public classes, methods and their parameters can be inspected in this API reference.

<a name="ApifyClient"></a>

## ApifyClient
ApifyClient is the official library to access [Apify API](https://docs.apify.com/api/v2) from your
JavaScript applications. It runs both in Node.js and browser.


* [ApifyClient](#ApifyClient)
    * [`new ApifyClient([baseUrl], [maxRetries], [minDelayBetweenRetriesMillis], [requestInterceptors], [token])`](#new_ApifyClient_new)
    * [`.actors()`](#ApifyClient+actors) ⇒ [<code>ActorCollectionClient</code>](#ActorCollectionClient)
    * [`.actor(id)`](#ApifyClient+actor) ⇒ [<code>ActorClient</code>](#ActorClient)
    * [`.build(id)`](#ApifyClient+build) ⇒ [<code>BuildClient</code>](#BuildClient)
    * [`.datasets()`](#ApifyClient+datasets) ⇒ [<code>DatasetCollectionClient</code>](#DatasetCollectionClient)
    * [`.dataset(id)`](#ApifyClient+dataset) ⇒ [<code>DatasetClient</code>](#DatasetClient)
    * [`.keyValueStores()`](#ApifyClient+keyValueStores) ⇒ [<code>KeyValueStoreCollectionClient</code>](#KeyValueStoreCollectionClient)
    * [`.keyValueStore(id)`](#ApifyClient+keyValueStore) ⇒ [<code>KeyValueStoreClient</code>](#KeyValueStoreClient)
    * [`.log(buildOrRunId)`](#ApifyClient+log) ⇒ [<code>LogClient</code>](#LogClient)
    * [`.requestQueues()`](#ApifyClient+requestQueues) ⇒ [<code>RequestQueueCollection</code>](#RequestQueueCollection)
    * [`.requestQueue(id, [options])`](#ApifyClient+requestQueue) ⇒ [<code>RequestQueueClient</code>](#RequestQueueClient)
    * [`.run(id)`](#ApifyClient+run) ⇒ [<code>RunClient</code>](#RunClient)
    * [`.tasks()`](#ApifyClient+tasks) ⇒ [<code>TaskCollectionClient</code>](#TaskCollectionClient)
    * [`.task(id)`](#ApifyClient+task) ⇒ [<code>TaskClient</code>](#TaskClient)
    * [`.schedules()`](#ApifyClient+schedules) ⇒ [<code>ScheduleCollectionClient</code>](#ScheduleCollectionClient)
    * [`.schedule(id)`](#ApifyClient+schedule) ⇒ [<code>ScheduleClient</code>](#ScheduleClient)
    * [`.user(id)`](#ApifyClient+user) ⇒ [<code>UserClient</code>](#UserClient)
    * [`.webhooks()`](#ApifyClient+webhooks) ⇒ [<code>WebhookCollectionClient</code>](#WebhookCollectionClient)
    * [`.webhook(id)`](#ApifyClient+webhook) ⇒ [<code>WebhookClient</code>](#WebhookClient)
    * [`.webhookDispatches()`](#ApifyClient+webhookDispatches) ⇒ [<code>WebhookDispatchCollectionClient</code>](#WebhookDispatchCollectionClient)
    * [`.webhookDispatch(id)`](#ApifyClient+webhookDispatch) ⇒ [<code>WebhookDispatchClient</code>](#WebhookDispatchClient)


* * *

<a name="new_ApifyClient_new"></a>

### `new ApifyClient([baseUrl], [maxRetries], [minDelayBetweenRetriesMillis], [requestInterceptors], [token])`

| Param | Type | Default |
| --- | --- | --- |
| [baseUrl] | <code>string</code> | <code>&quot;https://api.apify.com&quot;</code> | 
| [maxRetries] | <code>number</code> | <code>8</code> | 
| [minDelayBetweenRetriesMillis] | <code>number</code> | <code>500</code> | 
| [requestInterceptors] | <code>Array.&lt;function()&gt;</code> |  | 
| [token] | <code>string</code> |  | 


* * *

<a name="ApifyClient+actors"></a>

### `apifyClient.actors()` ⇒ [<code>ActorCollectionClient</code>](#ActorCollectionClient)
https://docs.apify.com/api/v2#/reference/actors/actor-collection


* * *

<a name="ApifyClient+actor"></a>

### `apifyClient.actor(id)` ⇒ [<code>ActorClient</code>](#ActorClient)
https://docs.apify.com/api/v2#/reference/actors/actor-object


| Param | Type |
| --- | --- |
| id | <code>string</code> | 


* * *

<a name="ApifyClient+build"></a>

### `apifyClient.build(id)` ⇒ [<code>BuildClient</code>](#BuildClient)
https://docs.apify.com/api/v2#/reference/actor-builds/build-object


| Param | Type |
| --- | --- |
| id | <code>string</code> | 


* * *

<a name="ApifyClient+datasets"></a>

### `apifyClient.datasets()` ⇒ [<code>DatasetCollectionClient</code>](#DatasetCollectionClient)
https://docs.apify.com/api/v2#/reference/datasets/dataset-collection


* * *

<a name="ApifyClient+dataset"></a>

### `apifyClient.dataset(id)` ⇒ [<code>DatasetClient</code>](#DatasetClient)
https://docs.apify.com/api/v2#/reference/datasets/dataset


| Param | Type |
| --- | --- |
| id | <code>string</code> | 


* * *

<a name="ApifyClient+keyValueStores"></a>

### `apifyClient.keyValueStores()` ⇒ [<code>KeyValueStoreCollectionClient</code>](#KeyValueStoreCollectionClient)
https://docs.apify.com/api/v2#/reference/key-value-stores/store-collection


* * *

<a name="ApifyClient+keyValueStore"></a>

### `apifyClient.keyValueStore(id)` ⇒ [<code>KeyValueStoreClient</code>](#KeyValueStoreClient)
https://docs.apify.com/api/v2#/reference/key-value-stores/store-object


| Param | Type |
| --- | --- |
| id | <code>string</code> | 


* * *

<a name="ApifyClient+log"></a>

### `apifyClient.log(buildOrRunId)` ⇒ [<code>LogClient</code>](#LogClient)
https://docs.apify.com/api/v2#/reference/logs


| Param | Type |
| --- | --- |
| buildOrRunId | <code>string</code> | 


* * *

<a name="ApifyClient+requestQueues"></a>

### `apifyClient.requestQueues()` ⇒ [<code>RequestQueueCollection</code>](#RequestQueueCollection)
https://docs.apify.com/api/v2#/reference/request-queues/queue-collection


* * *

<a name="ApifyClient+requestQueue"></a>

### `apifyClient.requestQueue(id, [options])` ⇒ [<code>RequestQueueClient</code>](#RequestQueueClient)
https://docs.apify.com/api/v2#/reference/request-queues/queue


| Param | Type |
| --- | --- |
| id | <code>string</code> | 
| [options] | <code>object</code> | 
| [options.clientKey] | <code>object</code> | 


* * *

<a name="ApifyClient+run"></a>

### `apifyClient.run(id)` ⇒ [<code>RunClient</code>](#RunClient)
https://docs.apify.com/api/v2#/reference/actor-runs/run-object


| Param | Type |
| --- | --- |
| id | <code>string</code> | 


* * *

<a name="ApifyClient+tasks"></a>

### `apifyClient.tasks()` ⇒ [<code>TaskCollectionClient</code>](#TaskCollectionClient)
https://docs.apify.com/api/v2#/reference/actor-tasks/task-collection


* * *

<a name="ApifyClient+task"></a>

### `apifyClient.task(id)` ⇒ [<code>TaskClient</code>](#TaskClient)
https://docs.apify.com/api/v2#/reference/actor-tasks/task-object


| Param | Type |
| --- | --- |
| id | <code>string</code> | 


* * *

<a name="ApifyClient+schedules"></a>

### `apifyClient.schedules()` ⇒ [<code>ScheduleCollectionClient</code>](#ScheduleCollectionClient)
https://docs.apify.com/api/v2#/reference/schedules/schedules-collection


* * *

<a name="ApifyClient+schedule"></a>

### `apifyClient.schedule(id)` ⇒ [<code>ScheduleClient</code>](#ScheduleClient)
https://docs.apify.com/api/v2#/reference/schedules/schedule-object


| Param | Type |
| --- | --- |
| id | <code>string</code> | 


* * *

<a name="ApifyClient+user"></a>

### `apifyClient.user(id)` ⇒ [<code>UserClient</code>](#UserClient)
https://docs.apify.com/api/v2#/reference/users


| Param | Type |
| --- | --- |
| id | <code>string</code> | 


* * *

<a name="ApifyClient+webhooks"></a>

### `apifyClient.webhooks()` ⇒ [<code>WebhookCollectionClient</code>](#WebhookCollectionClient)
https://docs.apify.com/api/v2#/reference/webhooks/webhook-collection


* * *

<a name="ApifyClient+webhook"></a>

### `apifyClient.webhook(id)` ⇒ [<code>WebhookClient</code>](#WebhookClient)
https://docs.apify.com/api/v2#/reference/webhooks/webhook-object


| Param | Type |
| --- | --- |
| id | <code>string</code> | 


* * *

<a name="ApifyClient+webhookDispatches"></a>

### `apifyClient.webhookDispatches()` ⇒ [<code>WebhookDispatchCollectionClient</code>](#WebhookDispatchCollectionClient)
https://docs.apify.com/api/v2#/reference/webhook-dispatches


* * *

<a name="ApifyClient+webhookDispatch"></a>

### `apifyClient.webhookDispatch(id)` ⇒ [<code>WebhookDispatchClient</code>](#WebhookDispatchClient)
https://docs.apify.com/api/v2#/reference/webhook-dispatches/webhook-dispatch-object


| Param | Type |
| --- | --- |
| id | <code>string</code> | 


* * *

<a name="ApifyApiError"></a>

## ApifyApiError
Apify API error

**Properties**

| Name | Type |
| --- | --- |
| message | <code>string</code> | 


* * *

<a name="ActorClient"></a>

## ActorClient

* [ActorClient](#ActorClient)
    * [`.build(versionNumber, [options])`](#ActorClient+build) ⇒ <code>Promise.&lt;Build&gt;</code>
    * [`.builds()`](#ActorClient+builds) ⇒ [<code>BuildCollectionClient</code>](#BuildCollectionClient)
    * [`.call([input], [options])`](#ActorClient+call) ⇒ <code>Promise.&lt;Run&gt;</code>
    * [`.delete()`](#ActorClient+delete) ⇒ <code>Promise.&lt;void&gt;</code>
    * [`.get()`](#ActorClient+get) ⇒ <code>Promise.&lt;?Actor&gt;</code>
    * [`.lastRun(options)`](#ActorClient+lastRun) ⇒ [<code>RunClient</code>](#RunClient)
    * [`.runs()`](#ActorClient+runs) ⇒ [<code>RunCollectionClient</code>](#RunCollectionClient)
    * [`.start([input], [options])`](#ActorClient+start) ⇒ <code>Promise.&lt;Run&gt;</code>
    * [`.update(newFields)`](#ActorClient+update) ⇒ <code>Promise.&lt;Actor&gt;</code>
    * [`.version(versionNumber)`](#ActorClient+version) ⇒ [<code>ActorVersionClient</code>](#ActorVersionClient)
    * [`.versions()`](#ActorClient+versions) ⇒ [<code>ActorVersionCollectionClient</code>](#ActorVersionCollectionClient)
    * [`.webhooks()`](#ActorClient+webhooks) ⇒ [<code>WebhookCollectionClient</code>](#WebhookCollectionClient)


* * *

<a name="ActorClient+build"></a>

### `actorClient.build(versionNumber, [options])` ⇒ <code>Promise.&lt;Build&gt;</code>
https://docs.apify.com/api/v2#/reference/actors/build-collection/build-actor


| Param | Type |
| --- | --- |
| versionNumber | <code>string</code> | 
| [options] | <code>object</code> | 
| [options.betaPackages] | <code>boolean</code> | 
| [options.tag] | <code>string</code> | 
| [options.useCache] | <code>boolean</code> | 


* * *

<a name="ActorClient+builds"></a>

### `actorClient.builds()` ⇒ [<code>BuildCollectionClient</code>](#BuildCollectionClient)
https://docs.apify.com/api/v2#/reference/actors/build-collection


* * *

<a name="ActorClient+call"></a>

### `actorClient.call([input], [options])` ⇒ <code>Promise.&lt;Run&gt;</code>
Starts an actor and waits for it to finish before returning the Run object.
It waits indefinitely, unless the `waitSecs` option is provided.
https://docs.apify.com/api/v2#/reference/actors/run-collection/run-actor


| Param | Type |
| --- | --- |
| [input] | <code>\*</code> | 
| [options] | <code>object</code> | 
| [options.build] | <code>string</code> | 
| [options.contentType] | <code>string</code> | 
| [options.memory] | <code>number</code> | 
| [options.timeout] | <code>number</code> | 
| [options.waitSecs] | <code>number</code> | 
| [options.webhooks] | <code>Array.&lt;object&gt;</code> | 


* * *

<a name="ActorClient+delete"></a>

### `actorClient.delete()` ⇒ <code>Promise.&lt;void&gt;</code>
https://docs.apify.com/api/v2#/reference/actors/actor-object/delete-actor


* * *

<a name="ActorClient+get"></a>

### `actorClient.get()` ⇒ <code>Promise.&lt;?Actor&gt;</code>
https://docs.apify.com/api/v2#/reference/actors/actor-object/get-actor


* * *

<a name="ActorClient+lastRun"></a>

### `actorClient.lastRun(options)` ⇒ [<code>RunClient</code>](#RunClient)
https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages


| Param | Type |
| --- | --- |
| options | <code>object</code> | 
| options.status | <code>string</code> | 


* * *

<a name="ActorClient+runs"></a>

### `actorClient.runs()` ⇒ [<code>RunCollectionClient</code>](#RunCollectionClient)
https://docs.apify.com/api/v2#/reference/actors/run-collection


* * *

<a name="ActorClient+start"></a>

### `actorClient.start([input], [options])` ⇒ <code>Promise.&lt;Run&gt;</code>
Starts an actor and immediately returns the Run object.
https://docs.apify.com/api/v2#/reference/actors/run-collection/run-actor


| Param | Type |
| --- | --- |
| [input] | <code>\*</code> | 
| [options] | <code>object</code> | 
| [options.build] | <code>string</code> | 
| [options.contentType] | <code>string</code> | 
| [options.memory] | <code>number</code> | 
| [options.timeout] | <code>number</code> | 
| [options.webhooks] | <code>Array.&lt;object&gt;</code> | 


* * *

<a name="ActorClient+update"></a>

### `actorClient.update(newFields)` ⇒ <code>Promise.&lt;Actor&gt;</code>
https://docs.apify.com/api/v2#/reference/actors/actor-object/update-actor


| Param | Type |
| --- | --- |
| newFields | <code>object</code> | 


* * *

<a name="ActorClient+version"></a>

### `actorClient.version(versionNumber)` ⇒ [<code>ActorVersionClient</code>](#ActorVersionClient)
https://docs.apify.com/api/v2#/reference/actors/version-object


| Param | Type |
| --- | --- |
| versionNumber | <code>string</code> | 


* * *

<a name="ActorClient+versions"></a>

### `actorClient.versions()` ⇒ [<code>ActorVersionCollectionClient</code>](#ActorVersionCollectionClient)
https://docs.apify.com/api/v2#/reference/actors/version-collection


* * *

<a name="ActorClient+webhooks"></a>

### `actorClient.webhooks()` ⇒ [<code>WebhookCollectionClient</code>](#WebhookCollectionClient)
https://docs.apify.com/api/v2#/reference/actors/webhook-collection


* * *

<a name="ActorCollectionClient"></a>

## ActorCollectionClient

* [ActorCollectionClient](#ActorCollectionClient)
    * [`.create([actor])`](#ActorCollectionClient+create) ⇒ <code>Promise.&lt;Actor&gt;</code>
    * [`.list([options])`](#ActorCollectionClient+list) ⇒ [<code>Promise.&lt;PaginationList&gt;</code>](#PaginationList)


* * *

<a name="ActorCollectionClient+create"></a>

### `actorCollectionClient.create([actor])` ⇒ <code>Promise.&lt;Actor&gt;</code>
https://docs.apify.com/api/v2#/reference/actors/actor-collection/create-actor


| Param | Type |
| --- | --- |
| [actor] | <code>object</code> | 


* * *

<a name="ActorCollectionClient+list"></a>

### `actorCollectionClient.list([options])` ⇒ [<code>Promise.&lt;PaginationList&gt;</code>](#PaginationList)
https://docs.apify.com/api/v2#/reference/actors/actor-collection/get-list-of-actors


| Param | Type |
| --- | --- |
| [options] | <code>object</code> | 
| [options.my] | <code>boolean</code> | 
| [options.limit] | <code>number</code> | 
| [options.offset] | <code>number</code> | 
| [options.desc] | <code>boolean</code> | 


* * *

<a name="ActorVersionClient"></a>

## ActorVersionClient

* [ActorVersionClient](#ActorVersionClient)
    * [`.delete()`](#ActorVersionClient+delete) ⇒ <code>Promise.&lt;void&gt;</code>
    * [`.get()`](#ActorVersionClient+get) ⇒ <code>Promise.&lt;ActorVersion&gt;</code>
    * [`.update(newFields)`](#ActorVersionClient+update) ⇒ <code>Promise.&lt;ActorVersion&gt;</code>


* * *

<a name="ActorVersionClient+delete"></a>

### `actorVersionClient.delete()` ⇒ <code>Promise.&lt;void&gt;</code>
https://docs.apify.com/api/v2#/reference/actors/version-object/delete-version


* * *

<a name="ActorVersionClient+get"></a>

### `actorVersionClient.get()` ⇒ <code>Promise.&lt;ActorVersion&gt;</code>
https://docs.apify.com/api/v2#/reference/actors/version-object/get-version


* * *

<a name="ActorVersionClient+update"></a>

### `actorVersionClient.update(newFields)` ⇒ <code>Promise.&lt;ActorVersion&gt;</code>
https://docs.apify.com/api/v2#/reference/actors/version-object/update-version


| Param | Type |
| --- | --- |
| newFields | <code>object</code> | 


* * *

<a name="ActorVersionCollectionClient"></a>

## ActorVersionCollectionClient

* [ActorVersionCollectionClient](#ActorVersionCollectionClient)
    * [`.create([actorVersion])`](#ActorVersionCollectionClient+create) ⇒ <code>Promise.&lt;object&gt;</code>
    * [`.list([options])`](#ActorVersionCollectionClient+list) ⇒ [<code>Promise.&lt;PaginationList&gt;</code>](#PaginationList)


* * *

<a name="ActorVersionCollectionClient+create"></a>

### `actorVersionCollectionClient.create([actorVersion])` ⇒ <code>Promise.&lt;object&gt;</code>
https://docs.apify.com/api/v2#/reference/actors/version-collection/create-version


| Param | Type |
| --- | --- |
| [actorVersion] | <code>object</code> | 


* * *

<a name="ActorVersionCollectionClient+list"></a>

### `actorVersionCollectionClient.list([options])` ⇒ [<code>Promise.&lt;PaginationList&gt;</code>](#PaginationList)
https://docs.apify.com/api/v2#/reference/actors/version-collection/get-list-of-versions


| Param | Type |
| --- | --- |
| [options] | <code>object</code> | 
| [options.limit] | <code>number</code> | 
| [options.offset] | <code>number</code> | 
| [options.desc] | <code>boolean</code> | 


* * *

<a name="BuildClient"></a>

## BuildClient

* [BuildClient](#BuildClient)
    * [`.abort()`](#BuildClient+abort) ⇒ <code>Promise.&lt;Build&gt;</code>
    * [`.get()`](#BuildClient+get) ⇒ <code>Promise.&lt;Actor&gt;</code>
    * [`.waitForFinish([options])`](#BuildClient+waitForFinish) ⇒ <code>Promise.&lt;Object&gt;</code>


* * *

<a name="BuildClient+abort"></a>

### `buildClient.abort()` ⇒ <code>Promise.&lt;Build&gt;</code>
https://docs.apify.com/api/v2#/reference/actor-builds/abort-build/abort-build


* * *

<a name="BuildClient+get"></a>

### `buildClient.get()` ⇒ <code>Promise.&lt;Actor&gt;</code>
https://docs.apify.com/api/v2#/reference/actor-builds/build-object/get-build


* * *

<a name="BuildClient+waitForFinish"></a>

### `buildClient.waitForFinish([options])` ⇒ <code>Promise.&lt;Object&gt;</code>
Returns a promise that resolves with the finished Build object when the provided actor build finishes
or with the unfinished Build object when the `waitSecs` timeout lapses. The promise is NOT rejected
based on run status. You can inspect the `status` property of the Build object to find out its status.

This is useful when you need to immediately start a run after a build finishes.


| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>object</code> |  |
| [options.waitSecs] | <code>string</code> | Maximum time to wait for the build to finish, in seconds.  If the limit is reached, the returned promise is resolved to a build object that will have  status `READY` or `RUNNING`. If `waitSecs` omitted, the function waits indefinitely. |


* * *

<a name="BuildCollectionClient"></a>

## BuildCollectionClient

* * *

<a name="BuildCollectionClient+list"></a>

### `buildCollectionClient.list([options])` ⇒ [<code>Promise.&lt;PaginationList&gt;</code>](#PaginationList)
https://docs.apify.com/api/v2#/reference/actors/build-collection/get-list-of-builds


| Param | Type |
| --- | --- |
| [options] | <code>object</code> | 
| [options.limit] | <code>number</code> | 
| [options.offset] | <code>number</code> | 
| [options.desc] | <code>boolean</code> | 


* * *

<a name="DatasetClient"></a>

## DatasetClient

* [DatasetClient](#DatasetClient)
    * [`.delete()`](#DatasetClient+delete) ⇒ <code>Promise.&lt;void&gt;</code>
    * [`.get()`](#DatasetClient+get) ⇒ <code>Promise.&lt;Dataset&gt;</code>
    * [`.listItems([options])`](#DatasetClient+listItems) ⇒ [<code>Promise.&lt;PaginationList&gt;</code>](#PaginationList)
    * [`.pushItems(items)`](#DatasetClient+pushItems) ⇒ <code>Promise.&lt;void&gt;</code>
    * [`.update(newFields)`](#DatasetClient+update) ⇒ <code>Promise.&lt;Dataset&gt;</code>


* * *

<a name="DatasetClient+delete"></a>

### `datasetClient.delete()` ⇒ <code>Promise.&lt;void&gt;</code>
https://docs.apify.com/api/v2#/reference/datasets/dataset/delete-dataset


* * *

<a name="DatasetClient+get"></a>

### `datasetClient.get()` ⇒ <code>Promise.&lt;Dataset&gt;</code>
https://docs.apify.com/api/v2#/reference/datasets/dataset/get-dataset


* * *

<a name="DatasetClient+listItems"></a>

### `datasetClient.listItems([options])` ⇒ [<code>Promise.&lt;PaginationList&gt;</code>](#PaginationList)
https://docs.apify.com/api/v2#/reference/datasets/item-collection/get-items


| Param | Type |
| --- | --- |
| [options] | <code>object</code> | 
| [options.clean] | <code>boolean</code> | 
| [options.desc] | <code>boolean</code> | 
| [options.fields] | <code>Array.&lt;string&gt;</code> | 
| [options.omit] | <code>Array.&lt;string&gt;</code> | 
| [options.limit] | <code>number</code> | 
| [options.offset] | <code>number</code> | 
| [options.skipEmpty] | <code>boolean</code> | 
| [options.skipHidden] | <code>boolean</code> | 
| [options.unwind] | <code>string</code> | 


* * *

<a name="DatasetClient+pushItems"></a>

### `datasetClient.pushItems(items)` ⇒ <code>Promise.&lt;void&gt;</code>
https://docs.apify.com/api/v2#/reference/datasets/item-collection/put-items


| Param | Type |
| --- | --- |
| items | <code>object</code> \| <code>string</code> \| <code>Array.&lt;(object\|string)&gt;</code> | 


* * *

<a name="DatasetClient+update"></a>

### `datasetClient.update(newFields)` ⇒ <code>Promise.&lt;Dataset&gt;</code>
https://docs.apify.com/api/v2#/reference/datasets/dataset/update-dataset


| Param | Type |
| --- | --- |
| newFields | <code>object</code> | 


* * *

<a name="DatasetCollectionClient"></a>

## DatasetCollectionClient

* [DatasetCollectionClient](#DatasetCollectionClient)
    * [`.getOrCreate([name])`](#DatasetCollectionClient+getOrCreate) ⇒ <code>Promise.&lt;object&gt;</code>
    * [`.list([options])`](#DatasetCollectionClient+list) ⇒ [<code>Promise.&lt;PaginationList&gt;</code>](#PaginationList)


* * *

<a name="DatasetCollectionClient+getOrCreate"></a>

### `datasetCollectionClient.getOrCreate([name])` ⇒ <code>Promise.&lt;object&gt;</code>
https://docs.apify.com/api/v2#/reference/datasets/dataset-collection/create-dataset


| Param | Type |
| --- | --- |
| [name] | <code>string</code> | 


* * *

<a name="DatasetCollectionClient+list"></a>

### `datasetCollectionClient.list([options])` ⇒ [<code>Promise.&lt;PaginationList&gt;</code>](#PaginationList)
https://docs.apify.com/api/v2#/reference/datasets/dataset-collection/get-list-of-datasets


| Param | Type |
| --- | --- |
| [options] | <code>object</code> | 
| [options.unnamed] | <code>boolean</code> | 
| [options.limit] | <code>number</code> | 
| [options.offset] | <code>number</code> | 
| [options.desc] | <code>boolean</code> | 


* * *

<a name="KeyValueStoreClient"></a>

## KeyValueStoreClient

* [KeyValueStoreClient](#KeyValueStoreClient)
    * [`.delete()`](#KeyValueStoreClient+delete) ⇒ <code>Promise.&lt;void&gt;</code>
    * [`.deleteRecord(key)`](#KeyValueStoreClient+deleteRecord) ⇒ <code>Promise.&lt;void&gt;</code>
    * [`.get()`](#KeyValueStoreClient+get) ⇒ <code>Promise.&lt;KeyValueStore&gt;</code>
    * [`.getRecord(key, [options])`](#KeyValueStoreClient+getRecord) ⇒
    * [`.listKeys([options])`](#KeyValueStoreClient+listKeys) ⇒ <code>Promise.&lt;object&gt;</code>
    * [`.setRecord(record)`](#KeyValueStoreClient+setRecord) ⇒ <code>Promise.&lt;void&gt;</code>
    * [`.update(newFields)`](#KeyValueStoreClient+update) ⇒ <code>Promise.&lt;KeyValueStore&gt;</code>


* * *

<a name="KeyValueStoreClient+delete"></a>

### `keyValueStoreClient.delete()` ⇒ <code>Promise.&lt;void&gt;</code>
https://docs.apify.com/api/v2#/reference/key-value-stores/store-object/delete-store


* * *

<a name="KeyValueStoreClient+deleteRecord"></a>

### `keyValueStoreClient.deleteRecord(key)` ⇒ <code>Promise.&lt;void&gt;</code>
https://docs.apify.com/api/v2#/reference/key-value-stores/record/delete-record


| Param | Type |
| --- | --- |
| key | <code>string</code> | 


* * *

<a name="KeyValueStoreClient+get"></a>

### `keyValueStoreClient.get()` ⇒ <code>Promise.&lt;KeyValueStore&gt;</code>
https://docs.apify.com/api/v2#/reference/key-value-stores/store-object/get-store


* * *

<a name="KeyValueStoreClient+getRecord"></a>

### `keyValueStoreClient.getRecord(key, [options])` ⇒
You can use the `buffer` option to get the value in a Buffer (Node.js)
or ArrayBuffer (browser) format. In Node.js (not in browser) you can also
use the `stream` option to get a Readable stream.
https://docs.apify.com/api/v2#/reference/key-value-stores/record/get-record

**Returns**: KeyValueStoreRecord  

| Param | Type |
| --- | --- |
| key | <code>string</code> | 
| [options] | <code>object</code> | 
| [options.buffer] | <code>boolean</code> | 
| [options.stream] | <code>boolean</code> | 
| [options.disableRedirect] | <code>boolean</code> | 


* * *

<a name="KeyValueStoreClient+listKeys"></a>

### `keyValueStoreClient.listKeys([options])` ⇒ <code>Promise.&lt;object&gt;</code>
https://docs.apify.com/api/v2#/reference/key-value-stores/key-collection/get-list-of-keys


| Param | Type |
| --- | --- |
| [options] | <code>object</code> | 
| [options.limit] | <code>object</code> | 
| [options.exclusiveStartKey] | <code>string</code> | 
| [options.desc] | <code>boolean</code> | 


* * *

<a name="KeyValueStoreClient+setRecord"></a>

### `keyValueStoreClient.setRecord(record)` ⇒ <code>Promise.&lt;void&gt;</code>
https://docs.apify.com/api/v2#/reference/key-value-stores/record/put-record


| Param | Type |
| --- | --- |
| record | [<code>KeyValueStoreRecord</code>](#KeyValueStoreRecord) | 


* * *

<a name="KeyValueStoreClient+update"></a>

### `keyValueStoreClient.update(newFields)` ⇒ <code>Promise.&lt;KeyValueStore&gt;</code>
https://docs.apify.com/api/v2#/reference/key-value-stores/store-object/update-store


| Param | Type |
| --- | --- |
| newFields | <code>object</code> | 


* * *

<a name="KeyValueStoreCollectionClient"></a>

## KeyValueStoreCollectionClient

* [KeyValueStoreCollectionClient](#KeyValueStoreCollectionClient)
    * [`.getOrCreate([name])`](#KeyValueStoreCollectionClient+getOrCreate) ⇒ <code>Promise.&lt;object&gt;</code>
    * [`.list([options])`](#KeyValueStoreCollectionClient+list) ⇒ [<code>Promise.&lt;PaginationList&gt;</code>](#PaginationList)


* * *

<a name="KeyValueStoreCollectionClient+getOrCreate"></a>

### `keyValueStoreCollectionClient.getOrCreate([name])` ⇒ <code>Promise.&lt;object&gt;</code>
https://docs.apify.com/api/v2#/reference/key-value-stores/store-collection/create-key-value-store


| Param | Type |
| --- | --- |
| [name] | <code>string</code> | 


* * *

<a name="KeyValueStoreCollectionClient+list"></a>

### `keyValueStoreCollectionClient.list([options])` ⇒ [<code>Promise.&lt;PaginationList&gt;</code>](#PaginationList)
https://docs.apify.com/api/v2#/reference/key-value-stores/store-collection/get-list-of-key-value-stores


| Param | Type |
| --- | --- |
| [options] | <code>object</code> | 
| [options.unnamed] | <code>boolean</code> | 
| [options.limit] | <code>number</code> | 
| [options.offset] | <code>number</code> | 
| [options.desc] | <code>boolean</code> | 


* * *

<a name="KeyValueStoreRecord"></a>

## `KeyValueStoreRecord` : <code>object</code>
**Properties**

| Name | Type |
| --- | --- |
| key | <code>string</code> | 
| value | <code>null</code> \| <code>string</code> \| <code>number</code> \| <code>object</code> | 
| [contentType] | <code>string</code> | 


* * *

<a name="LogClient"></a>

## LogClient

* [LogClient](#LogClient)
    * [`.get()`](#LogClient+get) ⇒ <code>Promise.&lt;?string&gt;</code>
    * [`.stream()`](#LogClient+stream) ⇒ <code>Promise.&lt;?Readable&gt;</code>


* * *

<a name="LogClient+get"></a>

### `logClient.get()` ⇒ <code>Promise.&lt;?string&gt;</code>
https://docs.apify.com/api/v2#/reference/logs/log/get-log


* * *

<a name="LogClient+stream"></a>

### `logClient.stream()` ⇒ <code>Promise.&lt;?Readable&gt;</code>
Gets the log in a Readable stream format. Only works in Node.js.
https://docs.apify.com/api/v2#/reference/logs/log/get-log


* * *

<a name="PaginationList"></a>

## `PaginationList` : <code>object</code>
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| items | <code>Array.&lt;object&gt;</code> | List of returned objects |
| total | <code>number</code> | Total number of objects |
| offset | <code>number</code> | Number of objects that were skipped |
| count | <code>number</code> | Number of returned objects |
| [limit] | <code>number</code> | Requested limit |


* * *

<a name="RequestQueueClient"></a>

## RequestQueueClient

* [RequestQueueClient](#RequestQueueClient)
    * [`.addRequest(request, [options])`](#RequestQueueClient+addRequest) ⇒ <code>Promise.&lt;object&gt;</code>
    * [`.delete()`](#RequestQueueClient+delete) ⇒ <code>Promise.&lt;void&gt;</code>
    * [`.deleteRequest(id)`](#RequestQueueClient+deleteRequest) ⇒ <code>Promise.&lt;void&gt;</code>
    * [`.get()`](#RequestQueueClient+get) ⇒ <code>Promise.&lt;RequestQueue&gt;</code>
    * [`.getRequest(id)`](#RequestQueueClient+getRequest) ⇒ <code>Promise.&lt;?object&gt;</code>
    * [`.listHead([options])`](#RequestQueueClient+listHead) ⇒ <code>Promise.&lt;object&gt;</code>
    * [`.update(newFields)`](#RequestQueueClient+update) ⇒ <code>Promise.&lt;RequestQueue&gt;</code>
    * [`.updateRequest(request, [options])`](#RequestQueueClient+updateRequest) ⇒ <code>Promise.&lt;\*&gt;</code>


* * *

<a name="RequestQueueClient+addRequest"></a>

### `requestQueueClient.addRequest(request, [options])` ⇒ <code>Promise.&lt;object&gt;</code>
https://docs.apify.com/api/v2#/reference/request-queues/request-collection/add-request


| Param | Type |
| --- | --- |
| request | <code>object</code> | 
| [options] | <code>object</code> | 
| [options.forefront] | <code>boolean</code> | 


* * *

<a name="RequestQueueClient+delete"></a>

### `requestQueueClient.delete()` ⇒ <code>Promise.&lt;void&gt;</code>
https://docs.apify.com/api/v2#/reference/request-queues/queue/delete-request-queue


* * *

<a name="RequestQueueClient+deleteRequest"></a>

### `requestQueueClient.deleteRequest(id)` ⇒ <code>Promise.&lt;void&gt;</code>

| Param | Type |
| --- | --- |
| id | <code>string</code> | 


* * *

<a name="RequestQueueClient+get"></a>

### `requestQueueClient.get()` ⇒ <code>Promise.&lt;RequestQueue&gt;</code>
https://docs.apify.com/api/v2#/reference/request-queues/queue/get-request-queue


* * *

<a name="RequestQueueClient+getRequest"></a>

### `requestQueueClient.getRequest(id)` ⇒ <code>Promise.&lt;?object&gt;</code>
https://docs.apify.com/api/v2#/reference/request-queues/request/get-request


| Param | Type |
| --- | --- |
| id | <code>string</code> | 


* * *

<a name="RequestQueueClient+listHead"></a>

### `requestQueueClient.listHead([options])` ⇒ <code>Promise.&lt;object&gt;</code>
https://docs.apify.com/api/v2#/reference/request-queues/queue-head/get-head


| Param | Type |
| --- | --- |
| [options] | <code>object</code> | 
| [options.limit] | <code>number</code> | 


* * *

<a name="RequestQueueClient+update"></a>

### `requestQueueClient.update(newFields)` ⇒ <code>Promise.&lt;RequestQueue&gt;</code>
https://docs.apify.com/api/v2#/reference/request-queues/queue/update-request-queue


| Param | Type |
| --- | --- |
| newFields | <code>object</code> | 


* * *

<a name="RequestQueueClient+updateRequest"></a>

### `requestQueueClient.updateRequest(request, [options])` ⇒ <code>Promise.&lt;\*&gt;</code>
https://docs.apify.com/api/v2#/reference/request-queues/request/update-request


| Param | Type |
| --- | --- |
| request | <code>object</code> | 
| [options] | <code>object</code> | 
| [options.forefront] | <code>boolean</code> | 


* * *

<a name="RequestQueueCollection"></a>

## RequestQueueCollection

* [RequestQueueCollection](#RequestQueueCollection)
    * [`.getOrCreate([name])`](#RequestQueueCollection+getOrCreate) ⇒ <code>Promise.&lt;RequestQueue&gt;</code>
    * [`.list([options])`](#RequestQueueCollection+list) ⇒ [<code>Promise.&lt;PaginationList&gt;</code>](#PaginationList)


* * *

<a name="RequestQueueCollection+getOrCreate"></a>

### `requestQueueCollection.getOrCreate([name])` ⇒ <code>Promise.&lt;RequestQueue&gt;</code>
https://docs.apify.com/api/v2#/reference/request-queues/queue-collection/create-request-queue


| Param | Type |
| --- | --- |
| [name] | <code>string</code> | 


* * *

<a name="RequestQueueCollection+list"></a>

### `requestQueueCollection.list([options])` ⇒ [<code>Promise.&lt;PaginationList&gt;</code>](#PaginationList)
https://docs.apify.com/api/v2#/reference/request-queues/queue-collection/get-list-of-request-queues


| Param | Type |
| --- | --- |
| [options] | <code>object</code> | 
| [options.unnamed] | <code>boolean</code> | 
| [options.limit] | <code>number</code> | 
| [options.offset] | <code>number</code> | 
| [options.desc] | <code>boolean</code> | 


* * *

<a name="RunClient"></a>

## RunClient

* [RunClient](#RunClient)
    * [`.abort()`](#RunClient+abort) ⇒ <code>Promise.&lt;Run&gt;</code>
    * [`.dataset()`](#RunClient+dataset) ⇒ [<code>DatasetClient</code>](#DatasetClient)
    * [`.get()`](#RunClient+get) ⇒ <code>Promise.&lt;Run&gt;</code>
    * [`.keyValueStore()`](#RunClient+keyValueStore) ⇒ [<code>KeyValueStoreClient</code>](#KeyValueStoreClient)
    * [`.log()`](#RunClient+log) ⇒ [<code>LogClient</code>](#LogClient)
    * [`.metamorph(targetActorId, [input], [options])`](#RunClient+metamorph) ⇒ <code>Promise.&lt;Run&gt;</code>
    * [`.requestQueue()`](#RunClient+requestQueue) ⇒ [<code>RequestQueueClient</code>](#RequestQueueClient)
    * [`.resurrect()`](#RunClient+resurrect) ⇒ <code>Promise.&lt;Run&gt;</code>
    * [`.waitForFinish([options])`](#RunClient+waitForFinish) ⇒ <code>Promise.&lt;Run&gt;</code>


* * *

<a name="RunClient+abort"></a>

### `runClient.abort()` ⇒ <code>Promise.&lt;Run&gt;</code>
https://docs.apify.com/api/v2#/reference/actor-runs/abort-run/abort-run


* * *

<a name="RunClient+dataset"></a>

### `runClient.dataset()` ⇒ [<code>DatasetClient</code>](#DatasetClient)
Currently this works only through `actor.lastRun().dataset()`. It will become
available for all runs once API supports it.
https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages


* * *

<a name="RunClient+get"></a>

### `runClient.get()` ⇒ <code>Promise.&lt;Run&gt;</code>
https://docs.apify.com/api/v2#/reference/actor-runs/run-object/get-run


* * *

<a name="RunClient+keyValueStore"></a>

### `runClient.keyValueStore()` ⇒ [<code>KeyValueStoreClient</code>](#KeyValueStoreClient)
Currently this works only through `actorClient.lastRun().dataset()`. It will become
available for all runs once API supports it.
https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages


* * *

<a name="RunClient+log"></a>

### `runClient.log()` ⇒ [<code>LogClient</code>](#LogClient)
Currently this works only through `actorClient.lastRun().dataset()`. It will become
available for all runs once API supports it.
https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages


* * *

<a name="RunClient+metamorph"></a>

### `runClient.metamorph(targetActorId, [input], [options])` ⇒ <code>Promise.&lt;Run&gt;</code>
https://docs.apify.com/api/v2#/reference/actor-runs/metamorph-run/metamorph-run


| Param | Type |
| --- | --- |
| targetActorId | <code>string</code> | 
| [input] | <code>\*</code> | 
| [options] | <code>object</code> | 
| [options.contentType] | <code>object</code> | 
| [options.build] | <code>object</code> | 


* * *

<a name="RunClient+requestQueue"></a>

### `runClient.requestQueue()` ⇒ [<code>RequestQueueClient</code>](#RequestQueueClient)
Currently this works only through `actorClient.lastRun().dataset()`. It will become
available for all runs once API supports it.
https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages


* * *

<a name="RunClient+resurrect"></a>

### `runClient.resurrect()` ⇒ <code>Promise.&lt;Run&gt;</code>
https://docs.apify.com/api/v2#/reference/actor-runs/resurrect-run/resurrect-run


* * *

<a name="RunClient+waitForFinish"></a>

### `runClient.waitForFinish([options])` ⇒ <code>Promise.&lt;Run&gt;</code>
Returns a promise that resolves with the finished Run object when the provided actor run finishes
or with the unfinished Run object when the `waitSecs` timeout lapses. The promise is NOT rejected
based on run status. You can inspect the `status` property of the Run object to find out its status.

This is useful when you need to chain actor executions. Similar effect can be achieved
by using webhooks, so be sure to review which technique fits your use-case better.


| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>object</code> |  |
| [options.waitSecs] | <code>number</code> | Maximum time to wait for the run to finish, in seconds.  If the limit is reached, the returned promise is resolved to a run object that will have  status `READY` or `RUNNING`. If `waitSecs` omitted, the function waits indefinitely. |


* * *

<a name="RunCollectionClient"></a>

## RunCollectionClient

* * *

<a name="RunCollectionClient+list"></a>

### `runCollectionClient.list([options])` ⇒ [<code>Promise.&lt;PaginationList&gt;</code>](#PaginationList)
https://docs.apify.com/api/v2#/reference/actors/run-collection/get-list-of-runs


| Param | Type |
| --- | --- |
| [options] | <code>object</code> | 
| [options.limit] | <code>number</code> | 
| [options.offset] | <code>number</code> | 
| [options.desc] | <code>boolean</code> | 
| [options.status] | <code>boolean</code> | 


* * *

<a name="ScheduleClient"></a>

## ScheduleClient

* [ScheduleClient](#ScheduleClient)
    * [`.delete()`](#ScheduleClient+delete) ⇒ <code>Promise.&lt;void&gt;</code>
    * [`.get()`](#ScheduleClient+get) ⇒ <code>Promise.&lt;?Schedule&gt;</code>
    * [`.getLog()`](#ScheduleClient+getLog) ⇒ <code>Promise.&lt;?string&gt;</code>
    * [`.update(newFields)`](#ScheduleClient+update) ⇒ <code>Promise.&lt;Schedule&gt;</code>


* * *

<a name="ScheduleClient+delete"></a>

### `scheduleClient.delete()` ⇒ <code>Promise.&lt;void&gt;</code>
https://docs.apify.com/api/v2#/reference/schedules/schedule-object/delete-schedule


* * *

<a name="ScheduleClient+get"></a>

### `scheduleClient.get()` ⇒ <code>Promise.&lt;?Schedule&gt;</code>
https://docs.apify.com/api/v2#/reference/schedules/schedule-object/get-schedule


* * *

<a name="ScheduleClient+getLog"></a>

### `scheduleClient.getLog()` ⇒ <code>Promise.&lt;?string&gt;</code>
https://docs.apify.com/api/v2#/reference/logs/log/get-log


* * *

<a name="ScheduleClient+update"></a>

### `scheduleClient.update(newFields)` ⇒ <code>Promise.&lt;Schedule&gt;</code>
https://docs.apify.com/api/v2#/reference/schedules/schedule-object/update-schedule


| Param | Type |
| --- | --- |
| newFields | <code>object</code> | 


* * *

<a name="ScheduleCollectionClient"></a>

## ScheduleCollectionClient

* [ScheduleCollectionClient](#ScheduleCollectionClient)
    * [`.create([schedule])`](#ScheduleCollectionClient+create) ⇒ <code>Promise.&lt;Schedule&gt;</code>
    * [`.list([options])`](#ScheduleCollectionClient+list) ⇒ [<code>Promise.&lt;PaginationList&gt;</code>](#PaginationList)


* * *

<a name="ScheduleCollectionClient+create"></a>

### `scheduleCollectionClient.create([schedule])` ⇒ <code>Promise.&lt;Schedule&gt;</code>
https://docs.apify.com/api/v2#/reference/schedules/schedules-collection/create-schedule


| Param | Type |
| --- | --- |
| [schedule] | <code>object</code> | 


* * *

<a name="ScheduleCollectionClient+list"></a>

### `scheduleCollectionClient.list([options])` ⇒ [<code>Promise.&lt;PaginationList&gt;</code>](#PaginationList)
https://docs.apify.com/api/v2#/reference/schedules/schedules-collection/get-list-of-schedules


| Param | Type |
| --- | --- |
| [options] | <code>object</code> | 
| [options.limit] | <code>number</code> | 
| [options.offset] | <code>number</code> | 
| [options.desc] | <code>boolean</code> | 


* * *

<a name="TaskClient"></a>

## TaskClient

* [TaskClient](#TaskClient)
    * [`.call([input], [options])`](#TaskClient+call) ⇒ <code>Promise.&lt;Run&gt;</code>
    * [`.delete()`](#TaskClient+delete) ⇒ <code>Promise.&lt;void&gt;</code>
    * [`.get()`](#TaskClient+get) ⇒ <code>Promise.&lt;?Task&gt;</code>
    * [`.getInput()`](#TaskClient+getInput) ⇒ <code>Promise.&lt;?object&gt;</code>
    * [`.lastRun(options)`](#TaskClient+lastRun) ⇒ [<code>RunClient</code>](#RunClient)
    * [`.runs()`](#TaskClient+runs) ⇒ [<code>RunCollectionClient</code>](#RunCollectionClient)
    * [`.start([input], [options])`](#TaskClient+start) ⇒ <code>Promise.&lt;Run&gt;</code>
    * [`.update(newFields)`](#TaskClient+update) ⇒ <code>Promise.&lt;Task&gt;</code>
    * [`.updateInput()`](#TaskClient+updateInput) ⇒ <code>Promise.&lt;object&gt;</code>
    * [`.webhooks()`](#TaskClient+webhooks) ⇒ [<code>WebhookCollectionClient</code>](#WebhookCollectionClient)


* * *

<a name="TaskClient+call"></a>

### `taskClient.call([input], [options])` ⇒ <code>Promise.&lt;Run&gt;</code>
Starts a task and waits for it to finish before returning the Run object.
It waits indefinitely, unless the `waitSecs` option is provided.
https://docs.apify.com/api/v2#/reference/actor-tasks/run-collection/run-task


| Param | Type |
| --- | --- |
| [input] | <code>object</code> | 
| [options] | <code>object</code> | 
| [options.build] | <code>string</code> | 
| [options.memory] | <code>number</code> | 
| [options.timeout] | <code>number</code> | 
| [options.waitSecs] | <code>number</code> | 
| [options.webhooks] | <code>Array.&lt;object&gt;</code> | 


* * *

<a name="TaskClient+delete"></a>

### `taskClient.delete()` ⇒ <code>Promise.&lt;void&gt;</code>
https://docs.apify.com/api/v2#/reference/actor-tasks/task-object/delete-task


* * *

<a name="TaskClient+get"></a>

### `taskClient.get()` ⇒ <code>Promise.&lt;?Task&gt;</code>
https://docs.apify.com/api/v2#/reference/actor-tasks/task-object/get-task


* * *

<a name="TaskClient+getInput"></a>

### `taskClient.getInput()` ⇒ <code>Promise.&lt;?object&gt;</code>
https://docs.apify.com/api/v2#/reference/actor-tasks/task-input-object/get-task-input


* * *

<a name="TaskClient+lastRun"></a>

### `taskClient.lastRun(options)` ⇒ [<code>RunClient</code>](#RunClient)
https://docs.apify.com/api/v2#/reference/actor-tasks/last-run-object-and-its-storages


| Param | Type |
| --- | --- |
| options | <code>object</code> | 
| options.status | <code>string</code> | 


* * *

<a name="TaskClient+runs"></a>

### `taskClient.runs()` ⇒ [<code>RunCollectionClient</code>](#RunCollectionClient)
https://docs.apify.com/api/v2#/reference/actor-tasks/run-collection


* * *

<a name="TaskClient+start"></a>

### `taskClient.start([input], [options])` ⇒ <code>Promise.&lt;Run&gt;</code>
Starts a task and immediately returns the Run object.
https://docs.apify.com/api/v2#/reference/actor-tasks/run-collection/run-task


| Param | Type |
| --- | --- |
| [input] | <code>object</code> | 
| [options] | <code>object</code> | 
| [options.build] | <code>string</code> | 
| [options.memory] | <code>number</code> | 
| [options.timeout] | <code>number</code> | 
| [options.webhooks] | <code>Array.&lt;object&gt;</code> | 


* * *

<a name="TaskClient+update"></a>

### `taskClient.update(newFields)` ⇒ <code>Promise.&lt;Task&gt;</code>
https://docs.apify.com/api/v2#/reference/actor-tasks/task-object/update-task


| Param | Type |
| --- | --- |
| newFields | <code>object</code> | 


* * *

<a name="TaskClient+updateInput"></a>

### `taskClient.updateInput()` ⇒ <code>Promise.&lt;object&gt;</code>
https://docs.apify.com/api/v2#/reference/actor-tasks/task-input-object/update-task-input


* * *

<a name="TaskClient+webhooks"></a>

### `taskClient.webhooks()` ⇒ [<code>WebhookCollectionClient</code>](#WebhookCollectionClient)
https://docs.apify.com/api/v2#/reference/actor-tasks/webhook-collection


* * *

<a name="TaskCollectionClient"></a>

## TaskCollectionClient

* [TaskCollectionClient](#TaskCollectionClient)
    * [`.create([task])`](#TaskCollectionClient+create) ⇒ <code>Promise.&lt;Task&gt;</code>
    * [`.list([options])`](#TaskCollectionClient+list) ⇒ [<code>Promise.&lt;PaginationList&gt;</code>](#PaginationList)


* * *

<a name="TaskCollectionClient+create"></a>

### `taskCollectionClient.create([task])` ⇒ <code>Promise.&lt;Task&gt;</code>
https://docs.apify.com/api/v2#/reference/actor-tasks/task-collection/create-task


| Param | Type |
| --- | --- |
| [task] | <code>object</code> | 


* * *

<a name="TaskCollectionClient+list"></a>

### `taskCollectionClient.list([options])` ⇒ [<code>Promise.&lt;PaginationList&gt;</code>](#PaginationList)
https://docs.apify.com/api/v2#/reference/actor-tasks/task-collection/get-list-of-tasks


| Param | Type |
| --- | --- |
| [options] | <code>object</code> | 
| [options.limit] | <code>number</code> | 
| [options.offset] | <code>number</code> | 
| [options.desc] | <code>boolean</code> | 


* * *

<a name="UserClient"></a>

## UserClient

* * *

<a name="UserClient+get"></a>

### `userClient.get()` ⇒ <code>Promise.&lt;?User&gt;</code>
Depending on whether ApifyClient was created with a token,
the method will either return public or private user data.
https://docs.apify.com/api/v2#/reference/users


* * *

<a name="WebhookClient"></a>

## WebhookClient

* [WebhookClient](#WebhookClient)
    * [`.delete()`](#WebhookClient+delete) ⇒ <code>Promise.&lt;void&gt;</code>
    * [`.dispatches()`](#WebhookClient+dispatches) ⇒ [<code>WebhookDispatchCollectionClient</code>](#WebhookDispatchCollectionClient)
    * [`.get()`](#WebhookClient+get) ⇒ <code>Promise.&lt;?Webhook&gt;</code>
    * [`.update(newFields)`](#WebhookClient+update) ⇒ <code>Promise.&lt;Webhook&gt;</code>


* * *

<a name="WebhookClient+delete"></a>

### `webhookClient.delete()` ⇒ <code>Promise.&lt;void&gt;</code>
https://docs.apify.com/api/v2#/reference/webhooks/webhook-object/delete-webhook


* * *

<a name="WebhookClient+dispatches"></a>

### `webhookClient.dispatches()` ⇒ [<code>WebhookDispatchCollectionClient</code>](#WebhookDispatchCollectionClient)
https://docs.apify.com/api/v2#/reference/webhooks/dispatches-collection


* * *

<a name="WebhookClient+get"></a>

### `webhookClient.get()` ⇒ <code>Promise.&lt;?Webhook&gt;</code>
https://docs.apify.com/api/v2#/reference/webhooks/webhook-object/get-webhook


* * *

<a name="WebhookClient+update"></a>

### `webhookClient.update(newFields)` ⇒ <code>Promise.&lt;Webhook&gt;</code>
https://docs.apify.com/api/v2#/reference/webhooks/webhook-object/update-webhook


| Param | Type |
| --- | --- |
| newFields | <code>object</code> | 


* * *

<a name="WebhookCollectionClient"></a>

## WebhookCollectionClient

* [WebhookCollectionClient](#WebhookCollectionClient)
    * [`.create([webhook])`](#WebhookCollectionClient+create) ⇒ <code>Promise.&lt;Webhook&gt;</code>
    * [`.list([options])`](#WebhookCollectionClient+list) ⇒ [<code>Promise.&lt;PaginationList&gt;</code>](#PaginationList)


* * *

<a name="WebhookCollectionClient+create"></a>

### `webhookCollectionClient.create([webhook])` ⇒ <code>Promise.&lt;Webhook&gt;</code>
https://docs.apify.com/api/v2#/reference/webhooks/webhook-collection/create-webhook


| Param | Type |
| --- | --- |
| [webhook] | <code>object</code> | 


* * *

<a name="WebhookCollectionClient+list"></a>

### `webhookCollectionClient.list([options])` ⇒ [<code>Promise.&lt;PaginationList&gt;</code>](#PaginationList)
https://docs.apify.com/api/v2#/reference/webhooks/webhook-collection/get-list-of-webhooks


| Param | Type |
| --- | --- |
| [options] | <code>object</code> | 
| [options.limit] | <code>number</code> | 
| [options.offset] | <code>number</code> | 
| [options.desc] | <code>boolean</code> | 


* * *

<a name="WebhookDispatchClient"></a>

## WebhookDispatchClient

* * *

<a name="WebhookDispatchClient+get"></a>

### `webhookDispatchClient.get()` ⇒ <code>Promise.&lt;?WebhookDispatch&gt;</code>
https://docs.apify.com/api/v2#/reference/webhook-dispatches/webhook-dispatch-object/get-webhook-dispatch


* * *

<a name="WebhookDispatchCollectionClient"></a>

## WebhookDispatchCollectionClient

* * *

<a name="WebhookDispatchCollectionClient+list"></a>

### `webhookDispatchCollectionClient.list([options])` ⇒ [<code>Promise.&lt;PaginationList&gt;</code>](#PaginationList)
https://docs.apify.com/api/v2#/reference/webhook-dispatches/webhook-dispatches-collection/get-list-of-webhook-dispatches


| Param | Type |
| --- | --- |
| [options] | <code>object</code> | 
| [options.limit] | <code>number</code> | 
| [options.offset] | <code>number</code> | 
| [options.desc] | <code>boolean</code> | 


* * *

