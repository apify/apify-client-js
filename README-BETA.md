# API Reference
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
**Params**

- [baseUrl] <code>string</code> <code> = &quot;&#x27;https://api.apify.com&#x27;&quot;</code>
- [maxRetries] <code>number</code> <code> = 8</code>
- [minDelayBetweenRetriesMillis] <code>number</code> <code> = 500</code>
- [requestInterceptors] <code>Array<function()></code>
- [token] <code>string</code>


* * *

<a name="ApifyClient+actors"></a>

### `apifyClient.actors()` ⇒ [<code>ActorCollectionClient</code>](#ActorCollectionClient)
https://docs.apify.com/api/v2#/reference/actors/actor-collection


* * *

<a name="ApifyClient+actor"></a>

### `apifyClient.actor(id)` ⇒ [<code>ActorClient</code>](#ActorClient)
https://docs.apify.com/api/v2#/reference/actors/actor-object

**Params**

- id <code>string</code>


* * *

<a name="ApifyClient+build"></a>

### `apifyClient.build(id)` ⇒ [<code>BuildClient</code>](#BuildClient)
https://docs.apify.com/api/v2#/reference/actor-builds/build-object

**Params**

- id <code>string</code>


* * *

<a name="ApifyClient+datasets"></a>

### `apifyClient.datasets()` ⇒ [<code>DatasetCollectionClient</code>](#DatasetCollectionClient)
https://docs.apify.com/api/v2#/reference/datasets/dataset-collection


* * *

<a name="ApifyClient+dataset"></a>

### `apifyClient.dataset(id)` ⇒ [<code>DatasetClient</code>](#DatasetClient)
https://docs.apify.com/api/v2#/reference/datasets/dataset

**Params**

- id <code>string</code>


* * *

<a name="ApifyClient+keyValueStores"></a>

### `apifyClient.keyValueStores()` ⇒ [<code>KeyValueStoreCollectionClient</code>](#KeyValueStoreCollectionClient)
https://docs.apify.com/api/v2#/reference/key-value-stores/store-collection


* * *

<a name="ApifyClient+keyValueStore"></a>

### `apifyClient.keyValueStore(id)` ⇒ [<code>KeyValueStoreClient</code>](#KeyValueStoreClient)
https://docs.apify.com/api/v2#/reference/key-value-stores/store-object

**Params**

- id <code>string</code>


* * *

<a name="ApifyClient+log"></a>

### `apifyClient.log(buildOrRunId)` ⇒ [<code>LogClient</code>](#LogClient)
https://docs.apify.com/api/v2#/reference/logs

**Params**

- buildOrRunId <code>string</code>


* * *

<a name="ApifyClient+requestQueues"></a>

### `apifyClient.requestQueues()` ⇒ [<code>RequestQueueCollection</code>](#RequestQueueCollection)
https://docs.apify.com/api/v2#/reference/request-queues/queue-collection


* * *

<a name="ApifyClient+requestQueue"></a>

### `apifyClient.requestQueue(id, [options])` ⇒ [<code>RequestQueueClient</code>](#RequestQueueClient)
https://docs.apify.com/api/v2#/reference/request-queues/queue

**Params**

- id <code>string</code>
- [options] <code>object</code>
    - [.clientKey] <code>object</code>


* * *

<a name="ApifyClient+run"></a>

### `apifyClient.run(id)` ⇒ [<code>RunClient</code>](#RunClient)
https://docs.apify.com/api/v2#/reference/actor-runs/run-object

**Params**

- id <code>string</code>


* * *

<a name="ApifyClient+tasks"></a>

### `apifyClient.tasks()` ⇒ [<code>TaskCollectionClient</code>](#TaskCollectionClient)
https://docs.apify.com/api/v2#/reference/actor-tasks/task-collection


* * *

<a name="ApifyClient+task"></a>

### `apifyClient.task(id)` ⇒ [<code>TaskClient</code>](#TaskClient)
https://docs.apify.com/api/v2#/reference/actor-tasks/task-object

**Params**

- id <code>string</code>


* * *

<a name="ApifyClient+schedules"></a>

### `apifyClient.schedules()` ⇒ [<code>ScheduleCollectionClient</code>](#ScheduleCollectionClient)
https://docs.apify.com/api/v2#/reference/schedules/schedules-collection


* * *

<a name="ApifyClient+schedule"></a>

### `apifyClient.schedule(id)` ⇒ [<code>ScheduleClient</code>](#ScheduleClient)
https://docs.apify.com/api/v2#/reference/schedules/schedule-object

**Params**

- id <code>string</code>


* * *

<a name="ApifyClient+user"></a>

### `apifyClient.user(id)` ⇒ [<code>UserClient</code>](#UserClient)
https://docs.apify.com/api/v2#/reference/users

**Params**

- id <code>string</code>


* * *

<a name="ApifyClient+webhooks"></a>

### `apifyClient.webhooks()` ⇒ [<code>WebhookCollectionClient</code>](#WebhookCollectionClient)
https://docs.apify.com/api/v2#/reference/webhooks/webhook-collection


* * *

<a name="ApifyClient+webhook"></a>

### `apifyClient.webhook(id)` ⇒ [<code>WebhookClient</code>](#WebhookClient)
https://docs.apify.com/api/v2#/reference/webhooks/webhook-object

**Params**

- id <code>string</code>


* * *

<a name="ApifyClient+webhookDispatches"></a>

### `apifyClient.webhookDispatches()` ⇒ [<code>WebhookDispatchCollectionClient</code>](#WebhookDispatchCollectionClient)
https://docs.apify.com/api/v2#/reference/webhook-dispatches


* * *

<a name="ApifyClient+webhookDispatch"></a>

### `apifyClient.webhookDispatch(id)` ⇒ [<code>WebhookDispatchClient</code>](#WebhookDispatchClient)
https://docs.apify.com/api/v2#/reference/webhook-dispatches/webhook-dispatch-object

**Params**

- id <code>string</code>


* * *

<a name="ApifyApiError"></a>

## ApifyApiError
Apify API error

**Properties**

- message <code>string</code>  


* * *

<a name="ActorCollectionClient"></a>

## ActorCollectionClient

* [ActorCollectionClient](#ActorCollectionClient)
    * [`.list([options])`](#ActorCollectionClient+list) ⇒ [<code>Promise<PaginationList></code>](#PaginationList)
    * [`.create([actor])`](#ActorCollectionClient+create) ⇒ <code>Promise<Actor></code>


* * *

<a name="ActorCollectionClient+list"></a>

### `actorCollectionClient.list([options])` ⇒ [<code>Promise<PaginationList></code>](#PaginationList)
https://docs.apify.com/api/v2#/reference/actors/actor-collection/get-list-of-actors

**Params**

- [options] <code>object</code>
    - [.my] <code>boolean</code>
    - [.limit] <code>number</code>
    - [.offset] <code>number</code>
    - [.desc] <code>boolean</code>


* * *

<a name="ActorCollectionClient+create"></a>

### `actorCollectionClient.create([actor])` ⇒ <code>Promise<Actor></code>
https://docs.apify.com/api/v2#/reference/actors/actor-collection/create-actor

**Params**

- [actor] <code>object</code>


* * *

<a name="ActorVersionCollectionClient"></a>

## ActorVersionCollectionClient

* [ActorVersionCollectionClient](#ActorVersionCollectionClient)
    * [`.list([options])`](#ActorVersionCollectionClient+list) ⇒ [<code>Promise<PaginationList></code>](#PaginationList)
    * [`.create([actorVersion])`](#ActorVersionCollectionClient+create) ⇒ <code>Promise<object></code>


* * *

<a name="ActorVersionCollectionClient+list"></a>

### `actorVersionCollectionClient.list([options])` ⇒ [<code>Promise<PaginationList></code>](#PaginationList)
https://docs.apify.com/api/v2#/reference/actors/version-collection/get-list-of-versions

**Params**

- [options] <code>object</code>
    - [.limit] <code>number</code>
    - [.offset] <code>number</code>
    - [.desc] <code>boolean</code>


* * *

<a name="ActorVersionCollectionClient+create"></a>

### `actorVersionCollectionClient.create([actorVersion])` ⇒ <code>Promise<object></code>
https://docs.apify.com/api/v2#/reference/actors/version-collection/create-version

**Params**

- [actorVersion] <code>object</code>


* * *

<a name="ActorVersionClient"></a>

## ActorVersionClient

* [ActorVersionClient](#ActorVersionClient)
    * [`.get()`](#ActorVersionClient+get) ⇒ <code>Promise<ActorVersion></code>
    * [`.update(newFields)`](#ActorVersionClient+update) ⇒ <code>Promise<ActorVersion></code>
    * [`.delete()`](#ActorVersionClient+delete) ⇒ <code>Promise<void></code>


* * *

<a name="ActorVersionClient+get"></a>

### `actorVersionClient.get()` ⇒ <code>Promise<ActorVersion></code>
https://docs.apify.com/api/v2#/reference/actors/version-object/get-version


* * *

<a name="ActorVersionClient+update"></a>

### `actorVersionClient.update(newFields)` ⇒ <code>Promise<ActorVersion></code>
https://docs.apify.com/api/v2#/reference/actors/version-object/update-version

**Params**

- newFields <code>object</code>


* * *

<a name="ActorVersionClient+delete"></a>

### `actorVersionClient.delete()` ⇒ <code>Promise<void></code>
https://docs.apify.com/api/v2#/reference/actors/version-object/delete-version


* * *

<a name="ActorClient"></a>

## ActorClient
Actor Client


* [ActorClient](#ActorClient)
    * [`.get()`](#ActorClient+get) ⇒ <code>Promise<?Actor></code>
    * [`.update(newFields)`](#ActorClient+update) ⇒ <code>Promise<Actor></code>
    * [`.delete()`](#ActorClient+delete) ⇒ <code>Promise<void></code>
    * [`.start([input], [options])`](#ActorClient+start) ⇒ <code>Promise<Run></code>
    * [`.call([input], [options])`](#ActorClient+call) ⇒ <code>Promise<Run></code>
    * [`.build(versionNumber, [options])`](#ActorClient+build) ⇒ <code>Promise<Build></code>
    * [`.lastRun(options)`](#ActorClient+lastRun) ⇒ [<code>RunClient</code>](#RunClient)
    * [`.builds()`](#ActorClient+builds) ⇒ [<code>BuildCollectionClient</code>](#BuildCollectionClient)
    * [`.runs()`](#ActorClient+runs) ⇒ [<code>RunCollectionClient</code>](#RunCollectionClient)
    * [`.version(versionNumber)`](#ActorClient+version) ⇒ [<code>ActorVersionClient</code>](#ActorVersionClient)
    * [`.versions()`](#ActorClient+versions) ⇒ [<code>ActorVersionCollectionClient</code>](#ActorVersionCollectionClient)
    * [`.webhooks()`](#ActorClient+webhooks) ⇒ [<code>WebhookCollectionClient</code>](#WebhookCollectionClient)


* * *

<a name="ActorClient+get"></a>

### `actorClient.get()` ⇒ <code>Promise<?Actor></code>
https://docs.apify.com/api/v2#/reference/actors/actor-object/get-actor


* * *

<a name="ActorClient+update"></a>

### `actorClient.update(newFields)` ⇒ <code>Promise<Actor></code>
https://docs.apify.com/api/v2#/reference/actors/actor-object/update-actor

**Params**

- newFields <code>object</code>


* * *

<a name="ActorClient+delete"></a>

### `actorClient.delete()` ⇒ <code>Promise<void></code>
https://docs.apify.com/api/v2#/reference/actors/actor-object/delete-actor


* * *

<a name="ActorClient+start"></a>

### `actorClient.start([input], [options])` ⇒ <code>Promise<Run></code>
Starts an actor and immediately returns the Run object.
https://docs.apify.com/api/v2#/reference/actors/run-collection/run-actor

**Params**

- [input] <code>\*</code>
- [options] <code>object</code>
    - [.build] <code>string</code>
    - [.contentType] <code>string</code>
    - [.memory] <code>number</code>
    - [.timeout] <code>number</code>
    - [.webhooks] <code>Array<object></code>


* * *

<a name="ActorClient+call"></a>

### `actorClient.call([input], [options])` ⇒ <code>Promise<Run></code>
Starts an actor and waits for it to finish before returning the Run object.
It waits indefinitely, unless the `waitSecs` option is provided.
https://docs.apify.com/api/v2#/reference/actors/run-collection/run-actor

**Params**

- [input] <code>\*</code>
- [options] <code>object</code>
    - [.build] <code>string</code>
    - [.contentType] <code>string</code>
    - [.memory] <code>number</code>
    - [.timeout] <code>number</code>
    - [.waitSecs] <code>number</code>
    - [.webhooks] <code>Array<object></code>


* * *

<a name="ActorClient+build"></a>

### `actorClient.build(versionNumber, [options])` ⇒ <code>Promise<Build></code>
https://docs.apify.com/api/v2#/reference/actors/build-collection/build-actor

**Params**

- versionNumber <code>string</code>
- [options] <code>object</code>
    - [.betaPackages] <code>boolean</code>
    - [.tag] <code>string</code>
    - [.useCache] <code>boolean</code>


* * *

<a name="ActorClient+lastRun"></a>

### `actorClient.lastRun(options)` ⇒ [<code>RunClient</code>](#RunClient)
https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages

**Params**

- options <code>object</code>
    - .status <code>string</code>


* * *

<a name="ActorClient+builds"></a>

### `actorClient.builds()` ⇒ [<code>BuildCollectionClient</code>](#BuildCollectionClient)
https://docs.apify.com/api/v2#/reference/actors/build-collection


* * *

<a name="ActorClient+runs"></a>

### `actorClient.runs()` ⇒ [<code>RunCollectionClient</code>](#RunCollectionClient)
https://docs.apify.com/api/v2#/reference/actors/run-collection


* * *

<a name="ActorClient+version"></a>

### `actorClient.version(versionNumber)` ⇒ [<code>ActorVersionClient</code>](#ActorVersionClient)
https://docs.apify.com/api/v2#/reference/actors/version-object

**Params**

- versionNumber <code>string</code>


* * *

<a name="ActorClient+versions"></a>

### `actorClient.versions()` ⇒ [<code>ActorVersionCollectionClient</code>](#ActorVersionCollectionClient)
https://docs.apify.com/api/v2#/reference/actors/version-collection


* * *

<a name="ActorClient+webhooks"></a>

### `actorClient.webhooks()` ⇒ [<code>WebhookCollectionClient</code>](#WebhookCollectionClient)
https://docs.apify.com/api/v2#/reference/actors/webhook-collection


* * *

<a name="BuildCollectionClient"></a>

## BuildCollectionClient

* * *

<a name="BuildCollectionClient+list"></a>

### `buildCollectionClient.list([options])` ⇒ [<code>Promise<PaginationList></code>](#PaginationList)
https://docs.apify.com/api/v2#/reference/actors/build-collection/get-list-of-builds

**Params**

- [options] <code>object</code>
    - [.limit] <code>number</code>
    - [.offset] <code>number</code>
    - [.desc] <code>boolean</code>


* * *

<a name="BuildClient"></a>

## BuildClient

* [BuildClient](#BuildClient)
    * [`.get()`](#BuildClient+get) ⇒ <code>Promise<Actor></code>
    * [`.abort()`](#BuildClient+abort) ⇒ <code>Promise<Build></code>
    * [`.waitForFinish([options])`](#BuildClient+waitForFinish) ⇒ <code>Promise<Object></code>


* * *

<a name="BuildClient+get"></a>

### `buildClient.get()` ⇒ <code>Promise<Actor></code>
https://docs.apify.com/api/v2#/reference/actor-builds/build-object/get-build


* * *

<a name="BuildClient+abort"></a>

### `buildClient.abort()` ⇒ <code>Promise<Build></code>
https://docs.apify.com/api/v2#/reference/actor-builds/abort-build/abort-build


* * *

<a name="BuildClient+waitForFinish"></a>

### `buildClient.waitForFinish([options])` ⇒ <code>Promise<Object></code>
Returns a promise that resolves with the finished Build object when the provided actor build finishes
or with the unfinished Build object when the `waitSecs` timeout lapses. The promise is NOT rejected
based on run status. You can inspect the `status` property of the Build object to find out its status.

This is useful when you need to immediately start a run after a build finishes.

**Params**

- [options] <code>object</code>
    - [.waitSecs] <code>string</code> - Maximum time to wait for the build to finish, in seconds.
 If the limit is reached, the returned promise is resolved to a build object that will have
 status `READY` or `RUNNING`. If `waitSecs` omitted, the function waits indefinitely.


* * *

<a name="DatasetCollectionClient"></a>

## DatasetCollectionClient

* [DatasetCollectionClient](#DatasetCollectionClient)
    * [`.list([options])`](#DatasetCollectionClient+list) ⇒ [<code>Promise<PaginationList></code>](#PaginationList)
    * [`.getOrCreate([name])`](#DatasetCollectionClient+getOrCreate) ⇒ <code>Promise<object></code>


* * *

<a name="DatasetCollectionClient+list"></a>

### `datasetCollectionClient.list([options])` ⇒ [<code>Promise<PaginationList></code>](#PaginationList)
https://docs.apify.com/api/v2#/reference/datasets/dataset-collection/get-list-of-datasets

**Params**

- [options] <code>object</code>
    - [.unnamed] <code>boolean</code>
    - [.limit] <code>number</code>
    - [.offset] <code>number</code>
    - [.desc] <code>boolean</code>


* * *

<a name="DatasetCollectionClient+getOrCreate"></a>

### `datasetCollectionClient.getOrCreate([name])` ⇒ <code>Promise<object></code>
https://docs.apify.com/api/v2#/reference/datasets/dataset-collection/create-dataset

**Params**

- [name] <code>string</code>


* * *

<a name="DatasetClient"></a>

## DatasetClient

* [DatasetClient](#DatasetClient)
    * [`.get()`](#DatasetClient+get) ⇒ <code>Promise<Dataset></code>
    * [`.update(newFields)`](#DatasetClient+update) ⇒ <code>Promise<Dataset></code>
    * [`.delete()`](#DatasetClient+delete) ⇒ <code>Promise<void></code>
    * [`.listItems([options])`](#DatasetClient+listItems) ⇒ [<code>Promise<PaginationList></code>](#PaginationList)
    * [`.pushItems(items)`](#DatasetClient+pushItems) ⇒ <code>Promise<void></code>


* * *

<a name="DatasetClient+get"></a>

### `datasetClient.get()` ⇒ <code>Promise<Dataset></code>
https://docs.apify.com/api/v2#/reference/datasets/dataset/get-dataset


* * *

<a name="DatasetClient+update"></a>

### `datasetClient.update(newFields)` ⇒ <code>Promise<Dataset></code>
https://docs.apify.com/api/v2#/reference/datasets/dataset/update-dataset

**Params**

- newFields <code>object</code>


* * *

<a name="DatasetClient+delete"></a>

### `datasetClient.delete()` ⇒ <code>Promise<void></code>
https://docs.apify.com/api/v2#/reference/datasets/dataset/delete-dataset


* * *

<a name="DatasetClient+listItems"></a>

### `datasetClient.listItems([options])` ⇒ [<code>Promise<PaginationList></code>](#PaginationList)
https://docs.apify.com/api/v2#/reference/datasets/item-collection/get-items

**Params**

- [options] <code>object</code>
    - [.clean] <code>boolean</code>
    - [.desc] <code>boolean</code>
    - [.fields] <code>Array<string></code>
    - [.omit] <code>Array<string></code>
    - [.limit] <code>number</code>
    - [.offset] <code>number</code>
    - [.skipEmpty] <code>boolean</code>
    - [.skipHidden] <code>boolean</code>
    - [.unwind] <code>string</code>


* * *

<a name="DatasetClient+pushItems"></a>

### `datasetClient.pushItems(items)` ⇒ <code>Promise<void></code>
https://docs.apify.com/api/v2#/reference/datasets/item-collection/put-items

**Params**

- items <code>object</code> | <code>string</code> | <code>Array<(object\|string)></code>


* * *

<a name="KeyValueStoreCollectionClient"></a>

## KeyValueStoreCollectionClient

* [KeyValueStoreCollectionClient](#KeyValueStoreCollectionClient)
    * [`.list([options])`](#KeyValueStoreCollectionClient+list) ⇒ [<code>Promise<PaginationList></code>](#PaginationList)
    * [`.getOrCreate([name])`](#KeyValueStoreCollectionClient+getOrCreate) ⇒ <code>Promise<object></code>


* * *

<a name="KeyValueStoreCollectionClient+list"></a>

### `keyValueStoreCollectionClient.list([options])` ⇒ [<code>Promise<PaginationList></code>](#PaginationList)
https://docs.apify.com/api/v2#/reference/key-value-stores/store-collection/get-list-of-key-value-stores

**Params**

- [options] <code>object</code>
    - [.unnamed] <code>boolean</code>
    - [.limit] <code>number</code>
    - [.offset] <code>number</code>
    - [.desc] <code>boolean</code>


* * *

<a name="KeyValueStoreCollectionClient+getOrCreate"></a>

### `keyValueStoreCollectionClient.getOrCreate([name])` ⇒ <code>Promise<object></code>
https://docs.apify.com/api/v2#/reference/key-value-stores/store-collection/create-key-value-store

**Params**

- [name] <code>string</code>


* * *

<a name="KeyValueStoreClient"></a>

## KeyValueStoreClient

* [KeyValueStoreClient](#KeyValueStoreClient)
    * [`.get()`](#KeyValueStoreClient+get) ⇒ <code>Promise<KeyValueStore></code>
    * [`.update(newFields)`](#KeyValueStoreClient+update) ⇒ <code>Promise<KeyValueStore></code>
    * [`.delete()`](#KeyValueStoreClient+delete) ⇒ <code>Promise<void></code>
    * [`.listKeys([options])`](#KeyValueStoreClient+listKeys) ⇒ <code>Promise<object></code>
    * [`.getRecord(key, [options])`](#KeyValueStoreClient+getRecord) ⇒
    * [`.setRecord(record)`](#KeyValueStoreClient+setRecord) ⇒ <code>Promise<void></code>
    * [`.deleteRecord(key)`](#KeyValueStoreClient+deleteRecord) ⇒ <code>Promise<void></code>


* * *

<a name="KeyValueStoreClient+get"></a>

### `keyValueStoreClient.get()` ⇒ <code>Promise<KeyValueStore></code>
https://docs.apify.com/api/v2#/reference/key-value-stores/store-object/get-store


* * *

<a name="KeyValueStoreClient+update"></a>

### `keyValueStoreClient.update(newFields)` ⇒ <code>Promise<KeyValueStore></code>
https://docs.apify.com/api/v2#/reference/key-value-stores/store-object/update-store

**Params**

- newFields <code>object</code>


* * *

<a name="KeyValueStoreClient+delete"></a>

### `keyValueStoreClient.delete()` ⇒ <code>Promise<void></code>
https://docs.apify.com/api/v2#/reference/key-value-stores/store-object/delete-store


* * *

<a name="KeyValueStoreClient+listKeys"></a>

### `keyValueStoreClient.listKeys([options])` ⇒ <code>Promise<object></code>
https://docs.apify.com/api/v2#/reference/key-value-stores/key-collection/get-list-of-keys

**Params**

- [options] <code>object</code>
    - [.limit] <code>object</code>
    - [.exclusiveStartKey] <code>string</code>
    - [.desc] <code>boolean</code>


* * *

<a name="KeyValueStoreClient+getRecord"></a>

### `keyValueStoreClient.getRecord(key, [options])` ⇒
You can use the `buffer` option to get the value in a Buffer (Node.js)
or ArrayBuffer (browser) format. In Node.js (not in browser) you can also
use the `stream` option to get a Readable stream.
https://docs.apify.com/api/v2#/reference/key-value-stores/record/get-record

**Returns**: KeyValueStoreRecord  
**Params**

- key <code>string</code>
- [options] <code>object</code>
    - [.buffer] <code>boolean</code>
    - [.stream] <code>boolean</code>
    - [.disableRedirect] <code>boolean</code>


* * *

<a name="KeyValueStoreClient+setRecord"></a>

### `keyValueStoreClient.setRecord(record)` ⇒ <code>Promise<void></code>
https://docs.apify.com/api/v2#/reference/key-value-stores/record/put-record

**Params**

- record [<code>KeyValueStoreRecord</code>](#KeyValueStoreRecord)


* * *

<a name="KeyValueStoreClient+deleteRecord"></a>

### `keyValueStoreClient.deleteRecord(key)` ⇒ <code>Promise<void></code>
https://docs.apify.com/api/v2#/reference/key-value-stores/record/delete-record

**Params**

- key <code>string</code>


* * *

<a name="LogClient"></a>

## LogClient

* [LogClient](#LogClient)
    * [`.get()`](#LogClient+get) ⇒ <code>Promise<?string></code>
    * [`.stream()`](#LogClient+stream) ⇒ <code>Promise<?Readable></code>


* * *

<a name="LogClient+get"></a>

### `logClient.get()` ⇒ <code>Promise<?string></code>
https://docs.apify.com/api/v2#/reference/logs/log/get-log


* * *

<a name="LogClient+stream"></a>

### `logClient.stream()` ⇒ <code>Promise<?Readable></code>
Gets the log in a Readable stream format. Only works in Node.js.
https://docs.apify.com/api/v2#/reference/logs/log/get-log


* * *

<a name="RequestQueueCollection"></a>

## RequestQueueCollection

* [RequestQueueCollection](#RequestQueueCollection)
    * [`.list([options])`](#RequestQueueCollection+list) ⇒ [<code>Promise<PaginationList></code>](#PaginationList)
    * [`.getOrCreate([name])`](#RequestQueueCollection+getOrCreate) ⇒ <code>Promise<RequestQueue></code>


* * *

<a name="RequestQueueCollection+list"></a>

### `requestQueueCollection.list([options])` ⇒ [<code>Promise<PaginationList></code>](#PaginationList)
https://docs.apify.com/api/v2#/reference/request-queues/queue-collection/get-list-of-request-queues

**Params**

- [options] <code>object</code>
    - [.unnamed] <code>boolean</code>
    - [.limit] <code>number</code>
    - [.offset] <code>number</code>
    - [.desc] <code>boolean</code>


* * *

<a name="RequestQueueCollection+getOrCreate"></a>

### `requestQueueCollection.getOrCreate([name])` ⇒ <code>Promise<RequestQueue></code>
https://docs.apify.com/api/v2#/reference/request-queues/queue-collection/create-request-queue

**Params**

- [name] <code>string</code>


* * *

<a name="RequestQueueClient"></a>

## RequestQueueClient

* [RequestQueueClient](#RequestQueueClient)
    * [`.get()`](#RequestQueueClient+get) ⇒ <code>Promise<RequestQueue></code>
    * [`.update(newFields)`](#RequestQueueClient+update) ⇒ <code>Promise<RequestQueue></code>
    * [`.delete()`](#RequestQueueClient+delete) ⇒ <code>Promise<void></code>
    * [`.listHead([options])`](#RequestQueueClient+listHead) ⇒ <code>Promise<object></code>
    * [`.addRequest(request, [options])`](#RequestQueueClient+addRequest) ⇒ <code>Promise<object></code>
    * [`.getRequest(id)`](#RequestQueueClient+getRequest) ⇒ <code>Promise<?object></code>
    * [`.updateRequest(request, [options])`](#RequestQueueClient+updateRequest) ⇒ <code>Promise<\*></code>
    * [`.deleteRequest(id)`](#RequestQueueClient+deleteRequest) ⇒ <code>Promise<void></code>


* * *

<a name="RequestQueueClient+get"></a>

### `requestQueueClient.get()` ⇒ <code>Promise<RequestQueue></code>
https://docs.apify.com/api/v2#/reference/request-queues/queue/get-request-queue


* * *

<a name="RequestQueueClient+update"></a>

### `requestQueueClient.update(newFields)` ⇒ <code>Promise<RequestQueue></code>
https://docs.apify.com/api/v2#/reference/request-queues/queue/update-request-queue

**Params**

- newFields <code>object</code>


* * *

<a name="RequestQueueClient+delete"></a>

### `requestQueueClient.delete()` ⇒ <code>Promise<void></code>
https://docs.apify.com/api/v2#/reference/request-queues/queue/delete-request-queue


* * *

<a name="RequestQueueClient+listHead"></a>

### `requestQueueClient.listHead([options])` ⇒ <code>Promise<object></code>
https://docs.apify.com/api/v2#/reference/request-queues/queue-head/get-head

**Params**

- [options] <code>object</code>
    - [.limit] <code>number</code>


* * *

<a name="RequestQueueClient+addRequest"></a>

### `requestQueueClient.addRequest(request, [options])` ⇒ <code>Promise<object></code>
https://docs.apify.com/api/v2#/reference/request-queues/request-collection/add-request

**Params**

- request <code>object</code>
- [options] <code>object</code>
    - [.forefront] <code>boolean</code>


* * *

<a name="RequestQueueClient+getRequest"></a>

### `requestQueueClient.getRequest(id)` ⇒ <code>Promise<?object></code>
https://docs.apify.com/api/v2#/reference/request-queues/request/get-request

**Params**

- id <code>string</code>


* * *

<a name="RequestQueueClient+updateRequest"></a>

### `requestQueueClient.updateRequest(request, [options])` ⇒ <code>Promise<\*></code>
https://docs.apify.com/api/v2#/reference/request-queues/request/update-request

**Params**

- request <code>object</code>
- [options] <code>object</code>
    - [.forefront] <code>boolean</code>


* * *

<a name="RequestQueueClient+deleteRequest"></a>

### `requestQueueClient.deleteRequest(id)` ⇒ <code>Promise<void></code>
**Params**

- id <code>string</code>


* * *

<a name="RunCollectionClient"></a>

## RunCollectionClient

* * *

<a name="RunCollectionClient+list"></a>

### `runCollectionClient.list([options])` ⇒ [<code>Promise<PaginationList></code>](#PaginationList)
https://docs.apify.com/api/v2#/reference/actors/run-collection/get-list-of-runs

**Params**

- [options] <code>object</code>
    - [.limit] <code>number</code>
    - [.offset] <code>number</code>
    - [.desc] <code>boolean</code>
    - [.status] <code>boolean</code>


* * *

<a name="RunClient"></a>

## RunClient

* [RunClient](#RunClient)
    * [`.get()`](#RunClient+get) ⇒ <code>Promise<Run></code>
    * [`.abort()`](#RunClient+abort) ⇒ <code>Promise<Run></code>
    * [`.metamorph(targetActorId, [input], [options])`](#RunClient+metamorph) ⇒ <code>Promise<Run></code>
    * [`.resurrect()`](#RunClient+resurrect) ⇒ <code>Promise<Run></code>
    * [`.waitForFinish([options])`](#RunClient+waitForFinish) ⇒ <code>Promise<Run></code>
    * [`.dataset()`](#RunClient+dataset) ⇒ [<code>DatasetClient</code>](#DatasetClient)
    * [`.keyValueStore()`](#RunClient+keyValueStore) ⇒ [<code>KeyValueStoreClient</code>](#KeyValueStoreClient)
    * [`.requestQueue()`](#RunClient+requestQueue) ⇒ [<code>RequestQueueClient</code>](#RequestQueueClient)
    * [`.log()`](#RunClient+log) ⇒ [<code>LogClient</code>](#LogClient)


* * *

<a name="RunClient+get"></a>

### `runClient.get()` ⇒ <code>Promise<Run></code>
https://docs.apify.com/api/v2#/reference/actor-runs/run-object/get-run


* * *

<a name="RunClient+abort"></a>

### `runClient.abort()` ⇒ <code>Promise<Run></code>
https://docs.apify.com/api/v2#/reference/actor-runs/abort-run/abort-run


* * *

<a name="RunClient+metamorph"></a>

### `runClient.metamorph(targetActorId, [input], [options])` ⇒ <code>Promise<Run></code>
https://docs.apify.com/api/v2#/reference/actor-runs/metamorph-run/metamorph-run

**Params**

- targetActorId <code>string</code>
- [input] <code>\*</code>
- [options] <code>object</code>
    - [.contentType] <code>object</code>
    - [.build] <code>object</code>


* * *

<a name="RunClient+resurrect"></a>

### `runClient.resurrect()` ⇒ <code>Promise<Run></code>
https://docs.apify.com/api/v2#/reference/actor-runs/resurrect-run/resurrect-run


* * *

<a name="RunClient+waitForFinish"></a>

### `runClient.waitForFinish([options])` ⇒ <code>Promise<Run></code>
Returns a promise that resolves with the finished Run object when the provided actor run finishes
or with the unfinished Run object when the `waitSecs` timeout lapses. The promise is NOT rejected
based on run status. You can inspect the `status` property of the Run object to find out its status.

This is useful when you need to chain actor executions. Similar effect can be achieved
by using webhooks, so be sure to review which technique fits your use-case better.

**Params**

- [options] <code>object</code>
    - [.waitSecs] <code>number</code> - Maximum time to wait for the run to finish, in seconds.
 If the limit is reached, the returned promise is resolved to a run object that will have
 status `READY` or `RUNNING`. If `waitSecs` omitted, the function waits indefinitely.


* * *

<a name="RunClient+dataset"></a>

### `runClient.dataset()` ⇒ [<code>DatasetClient</code>](#DatasetClient)
Currently this works only through `actor.lastRun().dataset()`. It will become
available for all runs once API supports it.
https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages


* * *

<a name="RunClient+keyValueStore"></a>

### `runClient.keyValueStore()` ⇒ [<code>KeyValueStoreClient</code>](#KeyValueStoreClient)
Currently this works only through `actorClient.lastRun().dataset()`. It will become
available for all runs once API supports it.
https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages


* * *

<a name="RunClient+requestQueue"></a>

### `runClient.requestQueue()` ⇒ [<code>RequestQueueClient</code>](#RequestQueueClient)
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

<a name="ScheduleCollectionClient"></a>

## ScheduleCollectionClient

* [ScheduleCollectionClient](#ScheduleCollectionClient)
    * [`.list([options])`](#ScheduleCollectionClient+list) ⇒ [<code>Promise<PaginationList></code>](#PaginationList)
    * [`.create([schedule])`](#ScheduleCollectionClient+create) ⇒ <code>Promise<Schedule></code>


* * *

<a name="ScheduleCollectionClient+list"></a>

### `scheduleCollectionClient.list([options])` ⇒ [<code>Promise<PaginationList></code>](#PaginationList)
https://docs.apify.com/api/v2#/reference/schedules/schedules-collection/get-list-of-schedules

**Params**

- [options] <code>object</code>
    - [.limit] <code>number</code>
    - [.offset] <code>number</code>
    - [.desc] <code>boolean</code>


* * *

<a name="ScheduleCollectionClient+create"></a>

### `scheduleCollectionClient.create([schedule])` ⇒ <code>Promise<Schedule></code>
https://docs.apify.com/api/v2#/reference/schedules/schedules-collection/create-schedule

**Params**

- [schedule] <code>object</code>


* * *

<a name="ScheduleClient"></a>

## ScheduleClient

* [ScheduleClient](#ScheduleClient)
    * [`.get()`](#ScheduleClient+get) ⇒ <code>Promise<?Schedule></code>
    * [`.update(newFields)`](#ScheduleClient+update) ⇒ <code>Promise<Schedule></code>
    * [`.delete()`](#ScheduleClient+delete) ⇒ <code>Promise<void></code>
    * [`.getLog()`](#ScheduleClient+getLog) ⇒ <code>Promise<?string></code>


* * *

<a name="ScheduleClient+get"></a>

### `scheduleClient.get()` ⇒ <code>Promise<?Schedule></code>
https://docs.apify.com/api/v2#/reference/schedules/schedule-object/get-schedule


* * *

<a name="ScheduleClient+update"></a>

### `scheduleClient.update(newFields)` ⇒ <code>Promise<Schedule></code>
https://docs.apify.com/api/v2#/reference/schedules/schedule-object/update-schedule

**Params**

- newFields <code>object</code>


* * *

<a name="ScheduleClient+delete"></a>

### `scheduleClient.delete()` ⇒ <code>Promise<void></code>
https://docs.apify.com/api/v2#/reference/schedules/schedule-object/delete-schedule


* * *

<a name="ScheduleClient+getLog"></a>

### `scheduleClient.getLog()` ⇒ <code>Promise<?string></code>
https://docs.apify.com/api/v2#/reference/logs/log/get-log


* * *

<a name="TaskCollectionClient"></a>

## TaskCollectionClient

* [TaskCollectionClient](#TaskCollectionClient)
    * [`.list([options])`](#TaskCollectionClient+list) ⇒ [<code>Promise<PaginationList></code>](#PaginationList)
    * [`.create([task])`](#TaskCollectionClient+create) ⇒ <code>Promise<Task></code>


* * *

<a name="TaskCollectionClient+list"></a>

### `taskCollectionClient.list([options])` ⇒ [<code>Promise<PaginationList></code>](#PaginationList)
https://docs.apify.com/api/v2#/reference/actor-tasks/task-collection/get-list-of-tasks

**Params**

- [options] <code>object</code>
    - [.limit] <code>number</code>
    - [.offset] <code>number</code>
    - [.desc] <code>boolean</code>


* * *

<a name="TaskCollectionClient+create"></a>

### `taskCollectionClient.create([task])` ⇒ <code>Promise<Task></code>
https://docs.apify.com/api/v2#/reference/actor-tasks/task-collection/create-task

**Params**

- [task] <code>object</code>


* * *

<a name="TaskClient"></a>

## TaskClient

* [TaskClient](#TaskClient)
    * [`.get()`](#TaskClient+get) ⇒ <code>Promise<?Task></code>
    * [`.update(newFields)`](#TaskClient+update) ⇒ <code>Promise<Task></code>
    * [`.delete()`](#TaskClient+delete) ⇒ <code>Promise<void></code>
    * [`.start([input], [options])`](#TaskClient+start) ⇒ <code>Promise<Run></code>
    * [`.call([input], [options])`](#TaskClient+call) ⇒ <code>Promise<Run></code>
    * [`.getInput()`](#TaskClient+getInput) ⇒ <code>Promise<?object></code>
    * [`.updateInput()`](#TaskClient+updateInput) ⇒ <code>Promise<object></code>
    * [`.lastRun(options)`](#TaskClient+lastRun) ⇒ [<code>RunClient</code>](#RunClient)
    * [`.runs()`](#TaskClient+runs) ⇒ [<code>RunCollectionClient</code>](#RunCollectionClient)
    * [`.webhooks()`](#TaskClient+webhooks) ⇒ [<code>WebhookCollectionClient</code>](#WebhookCollectionClient)


* * *

<a name="TaskClient+get"></a>

### `taskClient.get()` ⇒ <code>Promise<?Task></code>
https://docs.apify.com/api/v2#/reference/actor-tasks/task-object/get-task


* * *

<a name="TaskClient+update"></a>

### `taskClient.update(newFields)` ⇒ <code>Promise<Task></code>
https://docs.apify.com/api/v2#/reference/actor-tasks/task-object/update-task

**Params**

- newFields <code>object</code>


* * *

<a name="TaskClient+delete"></a>

### `taskClient.delete()` ⇒ <code>Promise<void></code>
https://docs.apify.com/api/v2#/reference/actor-tasks/task-object/delete-task


* * *

<a name="TaskClient+start"></a>

### `taskClient.start([input], [options])` ⇒ <code>Promise<Run></code>
Starts a task and immediately returns the Run object.
https://docs.apify.com/api/v2#/reference/actor-tasks/run-collection/run-task

**Params**

- [input] <code>object</code>
- [options] <code>object</code>
    - [.build] <code>string</code>
    - [.memory] <code>number</code>
    - [.timeout] <code>number</code>
    - [.webhooks] <code>Array<object></code>


* * *

<a name="TaskClient+call"></a>

### `taskClient.call([input], [options])` ⇒ <code>Promise<Run></code>
Starts a task and waits for it to finish before returning the Run object.
It waits indefinitely, unless the `waitSecs` option is provided.
https://docs.apify.com/api/v2#/reference/actor-tasks/run-collection/run-task

**Params**

- [input] <code>object</code>
- [options] <code>object</code>
    - [.build] <code>string</code>
    - [.memory] <code>number</code>
    - [.timeout] <code>number</code>
    - [.waitSecs] <code>number</code>
    - [.webhooks] <code>Array<object></code>


* * *

<a name="TaskClient+getInput"></a>

### `taskClient.getInput()` ⇒ <code>Promise<?object></code>
https://docs.apify.com/api/v2#/reference/actor-tasks/task-input-object/get-task-input


* * *

<a name="TaskClient+updateInput"></a>

### `taskClient.updateInput()` ⇒ <code>Promise<object></code>
https://docs.apify.com/api/v2#/reference/actor-tasks/task-input-object/update-task-input


* * *

<a name="TaskClient+lastRun"></a>

### `taskClient.lastRun(options)` ⇒ [<code>RunClient</code>](#RunClient)
https://docs.apify.com/api/v2#/reference/actor-tasks/last-run-object-and-its-storages

**Params**

- options <code>object</code>
    - .status <code>string</code>


* * *

<a name="TaskClient+runs"></a>

### `taskClient.runs()` ⇒ [<code>RunCollectionClient</code>](#RunCollectionClient)
https://docs.apify.com/api/v2#/reference/actor-tasks/run-collection


* * *

<a name="TaskClient+webhooks"></a>

### `taskClient.webhooks()` ⇒ [<code>WebhookCollectionClient</code>](#WebhookCollectionClient)
https://docs.apify.com/api/v2#/reference/actor-tasks/webhook-collection


* * *

<a name="UserClient"></a>

## UserClient

* * *

<a name="UserClient+get"></a>

### `userClient.get()` ⇒ <code>Promise<?User></code>
Depending on whether ApifyClient was created with a token,
the method will either return public or private user data.
https://docs.apify.com/api/v2#/reference/users


* * *

<a name="WebhookCollectionClient"></a>

## WebhookCollectionClient

* [WebhookCollectionClient](#WebhookCollectionClient)
    * [`.list([options])`](#WebhookCollectionClient+list) ⇒ [<code>Promise<PaginationList></code>](#PaginationList)
    * [`.create([webhook])`](#WebhookCollectionClient+create) ⇒ <code>Promise<Webhook></code>


* * *

<a name="WebhookCollectionClient+list"></a>

### `webhookCollectionClient.list([options])` ⇒ [<code>Promise<PaginationList></code>](#PaginationList)
https://docs.apify.com/api/v2#/reference/webhooks/webhook-collection/get-list-of-webhooks

**Params**

- [options] <code>object</code>
    - [.limit] <code>number</code>
    - [.offset] <code>number</code>
    - [.desc] <code>boolean</code>


* * *

<a name="WebhookCollectionClient+create"></a>

### `webhookCollectionClient.create([webhook])` ⇒ <code>Promise<Webhook></code>
https://docs.apify.com/api/v2#/reference/webhooks/webhook-collection/create-webhook

**Params**

- [webhook] <code>object</code>


* * *

<a name="WebhookDispatchCollectionClient"></a>

## WebhookDispatchCollectionClient

* * *

<a name="WebhookDispatchCollectionClient+list"></a>

### `webhookDispatchCollectionClient.list([options])` ⇒ [<code>Promise<PaginationList></code>](#PaginationList)
https://docs.apify.com/api/v2#/reference/webhook-dispatches/webhook-dispatches-collection/get-list-of-webhook-dispatches

**Params**

- [options] <code>object</code>
    - [.limit] <code>number</code>
    - [.offset] <code>number</code>
    - [.desc] <code>boolean</code>


* * *

<a name="WebhookDispatchClient"></a>

## WebhookDispatchClient

* * *

<a name="WebhookDispatchClient+get"></a>

### `webhookDispatchClient.get()` ⇒ <code>Promise<?WebhookDispatch></code>
https://docs.apify.com/api/v2#/reference/webhook-dispatches/webhook-dispatch-object/get-webhook-dispatch


* * *

<a name="WebhookClient"></a>

## WebhookClient

* [WebhookClient](#WebhookClient)
    * [`.get()`](#WebhookClient+get) ⇒ <code>Promise<?Webhook></code>
    * [`.update(newFields)`](#WebhookClient+update) ⇒ <code>Promise<Webhook></code>
    * [`.delete()`](#WebhookClient+delete) ⇒ <code>Promise<void></code>
    * [`.dispatches()`](#WebhookClient+dispatches) ⇒ [<code>WebhookDispatchCollectionClient</code>](#WebhookDispatchCollectionClient)


* * *

<a name="WebhookClient+get"></a>

### `webhookClient.get()` ⇒ <code>Promise<?Webhook></code>
https://docs.apify.com/api/v2#/reference/webhooks/webhook-object/get-webhook


* * *

<a name="WebhookClient+update"></a>

### `webhookClient.update(newFields)` ⇒ <code>Promise<Webhook></code>
https://docs.apify.com/api/v2#/reference/webhooks/webhook-object/update-webhook

**Params**

- newFields <code>object</code>


* * *

<a name="WebhookClient+delete"></a>

### `webhookClient.delete()` ⇒ <code>Promise<void></code>
https://docs.apify.com/api/v2#/reference/webhooks/webhook-object/delete-webhook


* * *

<a name="WebhookClient+dispatches"></a>

### `webhookClient.dispatches()` ⇒ [<code>WebhookDispatchCollectionClient</code>](#WebhookDispatchCollectionClient)
https://docs.apify.com/api/v2#/reference/webhooks/dispatches-collection


* * *

<a name="PaginationList"></a>

## `PaginationList` : <code>object</code>
**Properties**

- items <code>Array<object></code> - List of returned objects  
- total <code>number</code> - Total number of objects  
- offset <code>number</code> - Number of objects that were skipped  
- count <code>number</code> - Number of returned objects  
- limit <code>number</code> - Requested limit  


* * *

<a name="KeyValueStoreRecord"></a>

## `KeyValueStoreRecord` : <code>object</code>
**Properties**

- key <code>string</code>  
- value <code>null</code> \| <code>string</code> \| <code>number</code> \| <code>object</code>  
- contentType <code>string</code>  


* * *

