# Class: TaskClient

## Hierarchy

- `ResourceClient`

  ↳ **`TaskClient`**

## Table of contents

### Properties

- [apifyClient](TaskClient.md#apifyclient)
- [baseUrl](TaskClient.md#baseurl)
- [httpClient](TaskClient.md#httpclient)
- [id](TaskClient.md#id)
- [params](TaskClient.md#params)
- [resourcePath](TaskClient.md#resourcepath)
- [safeId](TaskClient.md#safeid)
- [url](TaskClient.md#url)

### Methods

- [call](TaskClient.md#call)
- [delete](TaskClient.md#delete)
- [get](TaskClient.md#get)
- [getInput](TaskClient.md#getinput)
- [lastRun](TaskClient.md#lastrun)
- [runs](TaskClient.md#runs)
- [start](TaskClient.md#start)
- [update](TaskClient.md#update)
- [updateInput](TaskClient.md#updateinput)
- [webhooks](TaskClient.md#webhooks)

## Properties

### <a id="apifyclient" name="apifyclient"></a> apifyClient

• **apifyClient**: [`ApifyClient`](ApifyClient.md)

#### Inherited from

ResourceClient.apifyClient

___

### <a id="baseurl" name="baseurl"></a> baseUrl

• **baseUrl**: `string`

#### Inherited from

ResourceClient.baseUrl

___

### <a id="httpclient" name="httpclient"></a> httpClient

• **httpClient**: `HttpClient`

#### Inherited from

ResourceClient.httpClient

___

### <a id="id" name="id"></a> id

• `Optional` **id**: `string`

#### Inherited from

ResourceClient.id

___

### <a id="params" name="params"></a> params

• `Optional` **params**: `Record`<`string`, `unknown`\>

#### Inherited from

ResourceClient.params

___

### <a id="resourcepath" name="resourcepath"></a> resourcePath

• **resourcePath**: `string`

#### Inherited from

ResourceClient.resourcePath

___

### <a id="safeid" name="safeid"></a> safeId

• `Optional` **safeId**: `string`

#### Inherited from

ResourceClient.safeId

___

### <a id="url" name="url"></a> url

• **url**: `string`

#### Inherited from

ResourceClient.url

## Methods

### <a id="call" name="call"></a> call

▸ **call**(`input?`, `options?`): `Promise`<[`ActorRun`](../interfaces/ActorRun.md)\>

Starts a task and waits for it to finish before returning the Run object.
It waits indefinitely, unless the `waitSecs` option is provided.
https://docs.apify.com/api/v2#/reference/actor-tasks/run-collection/run-task

#### Parameters

| Name | Type |
| :------ | :------ |
| `input?` | `Dictionary`<`unknown`\> |
| `options` | [`TaskStartOptions`](../modules.md#taskstartoptions) |

#### Returns

`Promise`<[`ActorRun`](../interfaces/ActorRun.md)\>

___

### <a id="delete" name="delete"></a> delete

▸ **delete**(): `Promise`<`void`\>

https://docs.apify.com/api/v2#/reference/actor-tasks/task-object/delete-task

#### Returns

`Promise`<`void`\>

___

### <a id="get" name="get"></a> get

▸ **get**(): `Promise`<`undefined` \| [`Task`](../interfaces/Task.md)\>

https://docs.apify.com/api/v2#/reference/actor-tasks/task-object/get-task

#### Returns

`Promise`<`undefined` \| [`Task`](../interfaces/Task.md)\>

___

### <a id="getinput" name="getinput"></a> getInput

▸ **getInput**(): `Promise`<`undefined` \| `Dictionary`<`unknown`\> \| `Dictionary`<`unknown`\>[]\>

https://docs.apify.com/api/v2#/reference/actor-tasks/task-input-object/get-task-input

#### Returns

`Promise`<`undefined` \| `Dictionary`<`unknown`\> \| `Dictionary`<`unknown`\>[]\>

___

### <a id="lastrun" name="lastrun"></a> lastRun

▸ **lastRun**(`options?`): [`RunClient`](RunClient.md)

https://docs.apify.com/api/v2#/reference/actor-tasks/last-run-object-and-its-storages

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`TaskLastRunOptions`](../interfaces/TaskLastRunOptions.md) |

#### Returns

[`RunClient`](RunClient.md)

___

### <a id="runs" name="runs"></a> runs

▸ **runs**(): [`RunCollectionClient`](RunCollectionClient.md)

https://docs.apify.com/api/v2#/reference/actor-tasks/run-collection

#### Returns

[`RunCollectionClient`](RunCollectionClient.md)

___

### <a id="start" name="start"></a> start

▸ **start**(`input?`, `options?`): `Promise`<[`ActorRun`](../interfaces/ActorRun.md)\>

Starts a task and immediately returns the Run object.
https://docs.apify.com/api/v2#/reference/actor-tasks/run-collection/run-task

#### Parameters

| Name | Type |
| :------ | :------ |
| `input?` | `Dictionary`<`unknown`\> |
| `options` | [`TaskStartOptions`](../modules.md#taskstartoptions) |

#### Returns

`Promise`<[`ActorRun`](../interfaces/ActorRun.md)\>

___

### <a id="update" name="update"></a> update

▸ **update**(`newFields`): `Promise`<[`Task`](../interfaces/Task.md)\>

https://docs.apify.com/api/v2#/reference/actor-tasks/task-object/update-task

#### Parameters

| Name | Type |
| :------ | :------ |
| `newFields` | `Partial`<`Pick`<[`Task`](../interfaces/Task.md), ``"name"`` \| ``"description"`` \| ``"options"`` \| ``"input"``\>\> |

#### Returns

`Promise`<[`Task`](../interfaces/Task.md)\>

___

### <a id="updateinput" name="updateinput"></a> updateInput

▸ **updateInput**(`newFields`): `Promise`<`Dictionary`<`unknown`\> \| `Dictionary`<`unknown`\>[]\>

https://docs.apify.com/api/v2#/reference/actor-tasks/task-input-object/update-task-input

#### Parameters

| Name | Type |
| :------ | :------ |
| `newFields` | `Dictionary`<`unknown`\> \| `Dictionary`<`unknown`\>[] |

#### Returns

`Promise`<`Dictionary`<`unknown`\> \| `Dictionary`<`unknown`\>[]\>

___

### <a id="webhooks" name="webhooks"></a> webhooks

▸ **webhooks**(): [`WebhookCollectionClient`](WebhookCollectionClient.md)

https://docs.apify.com/api/v2#/reference/actor-tasks/webhook-collection

#### Returns

[`WebhookCollectionClient`](WebhookCollectionClient.md)
