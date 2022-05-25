# Class: ApifyClient

[index](../modules/index.md).ApifyClient

ApifyClient is the official library to access [Apify API](https://docs.apify.com/api/v2) from your
JavaScript applications. It runs both in Node.js and browser.

## Table of contents

### Constructors

- [constructor](index.ApifyClient.md#constructor)

### Properties

- [baseUrl](index.ApifyClient.md#baseurl)
- [httpClient](index.ApifyClient.md#httpclient)
- [logger](index.ApifyClient.md#logger)
- [stats](index.ApifyClient.md#stats)
- [token](index.ApifyClient.md#token)

### Methods

- [\_options](index.ApifyClient.md#_options)
- [actor](index.ApifyClient.md#actor)
- [actors](index.ApifyClient.md#actors)
- [build](index.ApifyClient.md#build)
- [dataset](index.ApifyClient.md#dataset)
- [datasets](index.ApifyClient.md#datasets)
- [keyValueStore](index.ApifyClient.md#keyvaluestore)
- [keyValueStores](index.ApifyClient.md#keyvaluestores)
- [log](index.ApifyClient.md#log)
- [requestQueue](index.ApifyClient.md#requestqueue)
- [requestQueues](index.ApifyClient.md#requestqueues)
- [run](index.ApifyClient.md#run)
- [schedule](index.ApifyClient.md#schedule)
- [schedules](index.ApifyClient.md#schedules)
- [task](index.ApifyClient.md#task)
- [tasks](index.ApifyClient.md#tasks)
- [user](index.ApifyClient.md#user)
- [webhook](index.ApifyClient.md#webhook)
- [webhookDispatch](index.ApifyClient.md#webhookdispatch)
- [webhookDispatches](index.ApifyClient.md#webhookdispatches)
- [webhooks](index.ApifyClient.md#webhooks)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new ApifyClient**(`options?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`ApifyClientOptions`](../interfaces/index.ApifyClientOptions.md) |

## Properties

### <a id="baseurl" name="baseurl"></a> baseUrl

• **baseUrl**: `string`

___

### <a id="httpclient" name="httpclient"></a> httpClient

• **httpClient**: `HttpClient`

___

### <a id="logger" name="logger"></a> logger

• **logger**: `Log`

___

### <a id="stats" name="stats"></a> stats

• **stats**: `Statistics`

___

### <a id="token" name="token"></a> token

• `Optional` **token**: `string`

## Methods

### <a id="_options" name="_options"></a> \_options

▸ `Private` **_options**(): `Object`

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `apifyClient` | [`ApifyClient`](index.ApifyClient.md) |
| `baseUrl` | `string` |
| `httpClient` | `HttpClient` |

___

### <a id="actor" name="actor"></a> actor

▸ **actor**(`id`): [`ActorClient`](index.ActorClient.md)

https://docs.apify.com/api/v2#/reference/actors/actor-object

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

[`ActorClient`](index.ActorClient.md)

___

### <a id="actors" name="actors"></a> actors

▸ **actors**(): [`ActorCollectionClient`](index.ActorCollectionClient.md)

https://docs.apify.com/api/v2#/reference/actors/actor-collection

#### Returns

[`ActorCollectionClient`](index.ActorCollectionClient.md)

___

### <a id="build" name="build"></a> build

▸ **build**(`id`): [`BuildClient`](index.BuildClient.md)

https://docs.apify.com/api/v2#/reference/actor-builds/build-object

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

[`BuildClient`](index.BuildClient.md)

___

### <a id="dataset" name="dataset"></a> dataset

▸ **dataset**<`Data`\>(`id`): [`DatasetClient`](index.DatasetClient.md)<`Data`\>

https://docs.apify.com/api/v2#/reference/datasets/dataset

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Data` | extends `Record`<`string` \| `number`, `unknown`\> = `Record`<`string` \| `number`, `unknown`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

[`DatasetClient`](index.DatasetClient.md)<`Data`\>

___

### <a id="datasets" name="datasets"></a> datasets

▸ **datasets**(): [`DatasetCollectionClient`](index.DatasetCollectionClient.md)

https://docs.apify.com/api/v2#/reference/datasets/dataset-collection

#### Returns

[`DatasetCollectionClient`](index.DatasetCollectionClient.md)

___

### <a id="keyvaluestore" name="keyvaluestore"></a> keyValueStore

▸ **keyValueStore**(`id`): [`KeyValueStoreClient`](index.KeyValueStoreClient.md)

https://docs.apify.com/api/v2#/reference/key-value-stores/store-object

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

[`KeyValueStoreClient`](index.KeyValueStoreClient.md)

___

### <a id="keyvaluestores" name="keyvaluestores"></a> keyValueStores

▸ **keyValueStores**(): [`KeyValueStoreCollectionClient`](index.KeyValueStoreCollectionClient.md)

https://docs.apify.com/api/v2#/reference/key-value-stores/store-collection

#### Returns

[`KeyValueStoreCollectionClient`](index.KeyValueStoreCollectionClient.md)

___

### <a id="log" name="log"></a> log

▸ **log**(`buildOrRunId`): [`LogClient`](index.LogClient.md)

https://docs.apify.com/api/v2#/reference/logs

#### Parameters

| Name | Type |
| :------ | :------ |
| `buildOrRunId` | `string` |

#### Returns

[`LogClient`](index.LogClient.md)

___

### <a id="requestqueue" name="requestqueue"></a> requestQueue

▸ **requestQueue**(`id`, `options?`): [`RequestQueueClient`](index.RequestQueueClient.md)

https://docs.apify.com/api/v2#/reference/request-queues/queue

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |
| `options` | [`RequestQueueUserOptions`](../interfaces/index.RequestQueueUserOptions.md) |

#### Returns

[`RequestQueueClient`](index.RequestQueueClient.md)

___

### <a id="requestqueues" name="requestqueues"></a> requestQueues

▸ **requestQueues**(): [`RequestQueueCollectionClient`](index.RequestQueueCollectionClient.md)

https://docs.apify.com/api/v2#/reference/request-queues/queue-collection

#### Returns

[`RequestQueueCollectionClient`](index.RequestQueueCollectionClient.md)

___

### <a id="run" name="run"></a> run

▸ **run**(`id`): [`RunClient`](index.RunClient.md)

https://docs.apify.com/api/v2#/reference/actor-runs/run-object-and-its-storages

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

[`RunClient`](index.RunClient.md)

___

### <a id="schedule" name="schedule"></a> schedule

▸ **schedule**(`id`): [`ScheduleClient`](index.ScheduleClient.md)

https://docs.apify.com/api/v2#/reference/schedules/schedule-object

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

[`ScheduleClient`](index.ScheduleClient.md)

___

### <a id="schedules" name="schedules"></a> schedules

▸ **schedules**(): [`ScheduleCollectionClient`](index.ScheduleCollectionClient.md)

https://docs.apify.com/api/v2#/reference/schedules/schedules-collection

#### Returns

[`ScheduleCollectionClient`](index.ScheduleCollectionClient.md)

___

### <a id="task" name="task"></a> task

▸ **task**(`id`): [`TaskClient`](index.TaskClient.md)

https://docs.apify.com/api/v2#/reference/actor-tasks/task-object

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

[`TaskClient`](index.TaskClient.md)

___

### <a id="tasks" name="tasks"></a> tasks

▸ **tasks**(): [`TaskCollectionClient`](index.TaskCollectionClient.md)

https://docs.apify.com/api/v2#/reference/actor-tasks/task-collection

#### Returns

[`TaskCollectionClient`](index.TaskCollectionClient.md)

___

### <a id="user" name="user"></a> user

▸ **user**(`id?`): [`UserClient`](index.UserClient.md)

https://docs.apify.com/api/v2#/reference/users

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `id` | `string` | `ME_USER_NAME_PLACEHOLDER` |

#### Returns

[`UserClient`](index.UserClient.md)

___

### <a id="webhook" name="webhook"></a> webhook

▸ **webhook**(`id`): [`WebhookClient`](index.WebhookClient.md)

https://docs.apify.com/api/v2#/reference/webhooks/webhook-object

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

[`WebhookClient`](index.WebhookClient.md)

___

### <a id="webhookdispatch" name="webhookdispatch"></a> webhookDispatch

▸ **webhookDispatch**(`id`): [`WebhookDispatchClient`](index.WebhookDispatchClient.md)

https://docs.apify.com/api/v2#/reference/webhook-dispatches/webhook-dispatch-object

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

[`WebhookDispatchClient`](index.WebhookDispatchClient.md)

___

### <a id="webhookdispatches" name="webhookdispatches"></a> webhookDispatches

▸ **webhookDispatches**(): [`WebhookDispatchCollectionClient`](index.WebhookDispatchCollectionClient.md)

https://docs.apify.com/api/v2#/reference/webhook-dispatches

#### Returns

[`WebhookDispatchCollectionClient`](index.WebhookDispatchCollectionClient.md)

___

### <a id="webhooks" name="webhooks"></a> webhooks

▸ **webhooks**(): [`WebhookCollectionClient`](index.WebhookCollectionClient.md)

https://docs.apify.com/api/v2#/reference/webhooks/webhook-collection

#### Returns

[`WebhookCollectionClient`](index.WebhookCollectionClient.md)
