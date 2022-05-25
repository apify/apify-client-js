# Class: ApifyClient

ApifyClient is the official library to access [Apify API](https://docs.apify.com/api/v2) from your
JavaScript applications. It runs both in Node.js and browser.

## Table of contents

### Constructors

- [constructor](ApifyClient.md#constructor)

### Properties

- [baseUrl](ApifyClient.md#baseurl)
- [httpClient](ApifyClient.md#httpclient)
- [logger](ApifyClient.md#logger)
- [stats](ApifyClient.md#stats)
- [token](ApifyClient.md#token)

### Methods

- [actor](ApifyClient.md#actor)
- [actors](ApifyClient.md#actors)
- [build](ApifyClient.md#build)
- [dataset](ApifyClient.md#dataset)
- [datasets](ApifyClient.md#datasets)
- [keyValueStore](ApifyClient.md#keyvaluestore)
- [keyValueStores](ApifyClient.md#keyvaluestores)
- [log](ApifyClient.md#log)
- [requestQueue](ApifyClient.md#requestqueue)
- [requestQueues](ApifyClient.md#requestqueues)
- [run](ApifyClient.md#run)
- [schedule](ApifyClient.md#schedule)
- [schedules](ApifyClient.md#schedules)
- [task](ApifyClient.md#task)
- [tasks](ApifyClient.md#tasks)
- [user](ApifyClient.md#user)
- [webhook](ApifyClient.md#webhook)
- [webhookDispatch](ApifyClient.md#webhookdispatch)
- [webhookDispatches](ApifyClient.md#webhookdispatches)
- [webhooks](ApifyClient.md#webhooks)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new ApifyClient**(`options?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`ApifyClientOptions`](../interfaces/ApifyClientOptions.md) |

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

### <a id="actor" name="actor"></a> actor

▸ **actor**(`id`): [`ActorClient`](ActorClient.md)

https://docs.apify.com/api/v2#/reference/actors/actor-object

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

[`ActorClient`](ActorClient.md)

___

### <a id="actors" name="actors"></a> actors

▸ **actors**(): [`ActorCollectionClient`](ActorCollectionClient.md)

https://docs.apify.com/api/v2#/reference/actors/actor-collection

#### Returns

[`ActorCollectionClient`](ActorCollectionClient.md)

___

### <a id="build" name="build"></a> build

▸ **build**(`id`): [`BuildClient`](BuildClient.md)

https://docs.apify.com/api/v2#/reference/actor-builds/build-object

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

[`BuildClient`](BuildClient.md)

___

### <a id="dataset" name="dataset"></a> dataset

▸ **dataset**<`Data`\>(`id`): [`DatasetClient`](DatasetClient.md)<`Data`\>

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

[`DatasetClient`](DatasetClient.md)<`Data`\>

___

### <a id="datasets" name="datasets"></a> datasets

▸ **datasets**(): [`DatasetCollectionClient`](DatasetCollectionClient.md)

https://docs.apify.com/api/v2#/reference/datasets/dataset-collection

#### Returns

[`DatasetCollectionClient`](DatasetCollectionClient.md)

___

### <a id="keyvaluestore" name="keyvaluestore"></a> keyValueStore

▸ **keyValueStore**(`id`): [`KeyValueStoreClient`](KeyValueStoreClient.md)

https://docs.apify.com/api/v2#/reference/key-value-stores/store-object

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

[`KeyValueStoreClient`](KeyValueStoreClient.md)

___

### <a id="keyvaluestores" name="keyvaluestores"></a> keyValueStores

▸ **keyValueStores**(): [`KeyValueStoreCollectionClient`](KeyValueStoreCollectionClient.md)

https://docs.apify.com/api/v2#/reference/key-value-stores/store-collection

#### Returns

[`KeyValueStoreCollectionClient`](KeyValueStoreCollectionClient.md)

___

### <a id="log" name="log"></a> log

▸ **log**(`buildOrRunId`): [`LogClient`](LogClient.md)

https://docs.apify.com/api/v2#/reference/logs

#### Parameters

| Name | Type |
| :------ | :------ |
| `buildOrRunId` | `string` |

#### Returns

[`LogClient`](LogClient.md)

___

### <a id="requestqueue" name="requestqueue"></a> requestQueue

▸ **requestQueue**(`id`, `options?`): [`RequestQueueClient`](RequestQueueClient.md)

https://docs.apify.com/api/v2#/reference/request-queues/queue

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |
| `options` | [`RequestQueueUserOptions`](../interfaces/RequestQueueUserOptions.md) |

#### Returns

[`RequestQueueClient`](RequestQueueClient.md)

___

### <a id="requestqueues" name="requestqueues"></a> requestQueues

▸ **requestQueues**(): [`RequestQueueCollectionClient`](RequestQueueCollectionClient.md)

https://docs.apify.com/api/v2#/reference/request-queues/queue-collection

#### Returns

[`RequestQueueCollectionClient`](RequestQueueCollectionClient.md)

___

### <a id="run" name="run"></a> run

▸ **run**(`id`): [`RunClient`](RunClient.md)

https://docs.apify.com/api/v2#/reference/actor-runs/run-object-and-its-storages

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

[`RunClient`](RunClient.md)

___

### <a id="schedule" name="schedule"></a> schedule

▸ **schedule**(`id`): [`ScheduleClient`](ScheduleClient.md)

https://docs.apify.com/api/v2#/reference/schedules/schedule-object

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

[`ScheduleClient`](ScheduleClient.md)

___

### <a id="schedules" name="schedules"></a> schedules

▸ **schedules**(): [`ScheduleCollectionClient`](ScheduleCollectionClient.md)

https://docs.apify.com/api/v2#/reference/schedules/schedules-collection

#### Returns

[`ScheduleCollectionClient`](ScheduleCollectionClient.md)

___

### <a id="task" name="task"></a> task

▸ **task**(`id`): [`TaskClient`](TaskClient.md)

https://docs.apify.com/api/v2#/reference/actor-tasks/task-object

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

[`TaskClient`](TaskClient.md)

___

### <a id="tasks" name="tasks"></a> tasks

▸ **tasks**(): [`TaskCollectionClient`](TaskCollectionClient.md)

https://docs.apify.com/api/v2#/reference/actor-tasks/task-collection

#### Returns

[`TaskCollectionClient`](TaskCollectionClient.md)

___

### <a id="user" name="user"></a> user

▸ **user**(`id?`): [`UserClient`](UserClient.md)

https://docs.apify.com/api/v2#/reference/users

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `id` | `string` | `ME_USER_NAME_PLACEHOLDER` |

#### Returns

[`UserClient`](UserClient.md)

___

### <a id="webhook" name="webhook"></a> webhook

▸ **webhook**(`id`): [`WebhookClient`](WebhookClient.md)

https://docs.apify.com/api/v2#/reference/webhooks/webhook-object

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

[`WebhookClient`](WebhookClient.md)

___

### <a id="webhookdispatch" name="webhookdispatch"></a> webhookDispatch

▸ **webhookDispatch**(`id`): [`WebhookDispatchClient`](WebhookDispatchClient.md)

https://docs.apify.com/api/v2#/reference/webhook-dispatches/webhook-dispatch-object

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

[`WebhookDispatchClient`](WebhookDispatchClient.md)

___

### <a id="webhookdispatches" name="webhookdispatches"></a> webhookDispatches

▸ **webhookDispatches**(): [`WebhookDispatchCollectionClient`](WebhookDispatchCollectionClient.md)

https://docs.apify.com/api/v2#/reference/webhook-dispatches

#### Returns

[`WebhookDispatchCollectionClient`](WebhookDispatchCollectionClient.md)

___

### <a id="webhooks" name="webhooks"></a> webhooks

▸ **webhooks**(): [`WebhookCollectionClient`](WebhookCollectionClient.md)

https://docs.apify.com/api/v2#/reference/webhooks/webhook-collection

#### Returns

[`WebhookCollectionClient`](WebhookCollectionClient.md)
