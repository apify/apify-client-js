# Class: TaskClient

[index](../modules/index.md).TaskClient

## Hierarchy

- `ResourceClient`

  ↳ **`TaskClient`**

## Table of contents

### Properties

- [apifyClient](index.TaskClient.md#apifyclient)
- [baseUrl](index.TaskClient.md#baseurl)
- [httpClient](index.TaskClient.md#httpclient)
- [id](index.TaskClient.md#id)
- [params](index.TaskClient.md#params)
- [resourcePath](index.TaskClient.md#resourcepath)
- [safeId](index.TaskClient.md#safeid)
- [url](index.TaskClient.md#url)

### Methods

- [\_delete](index.TaskClient.md#_delete)
- [\_get](index.TaskClient.md#_get)
- [\_params](index.TaskClient.md#_params)
- [\_subResourceOptions](index.TaskClient.md#_subresourceoptions)
- [\_toSafeId](index.TaskClient.md#_tosafeid)
- [\_update](index.TaskClient.md#_update)
- [\_url](index.TaskClient.md#_url)
- [\_waitForFinish](index.TaskClient.md#_waitforfinish)
- [call](index.TaskClient.md#call)
- [delete](index.TaskClient.md#delete)
- [get](index.TaskClient.md#get)
- [getInput](index.TaskClient.md#getinput)
- [lastRun](index.TaskClient.md#lastrun)
- [runs](index.TaskClient.md#runs)
- [start](index.TaskClient.md#start)
- [update](index.TaskClient.md#update)
- [updateInput](index.TaskClient.md#updateinput)
- [webhooks](index.TaskClient.md#webhooks)

## Properties

### <a id="apifyclient" name="apifyclient"></a> apifyClient

• **apifyClient**: [`ApifyClient`](index.ApifyClient.md)

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

### <a id="_delete" name="_delete"></a> \_delete

▸ `Protected` **_delete**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Inherited from

ResourceClient.\_delete

___

### <a id="_get" name="_get"></a> \_get

▸ `Protected` **_get**<`T`, `R`\>(`options?`): `Promise`<`undefined` \| `R`\>

#### Type parameters

| Name |
| :------ |
| `T` |
| `R` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `T` |

#### Returns

`Promise`<`undefined` \| `R`\>

#### Inherited from

ResourceClient.\_get

___

### <a id="_params" name="_params"></a> \_params

▸ `Protected` **_params**<`T`\>(`endpointParams?`): `Record`<`string`, `unknown`\>

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `endpointParams?` | `T` |

#### Returns

`Record`<`string`, `unknown`\>

#### Inherited from

ResourceClient.\_params

___

### <a id="_subresourceoptions" name="_subresourceoptions"></a> \_subResourceOptions

▸ `Protected` **_subResourceOptions**<`T`\>(`moreOptions?`): `BaseOptions` & `T`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `moreOptions?` | `T` |

#### Returns

`BaseOptions` & `T`

#### Inherited from

ResourceClient.\_subResourceOptions

___

### <a id="_tosafeid" name="_tosafeid"></a> \_toSafeId

▸ `Protected` **_toSafeId**(`id`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

`string`

#### Inherited from

ResourceClient.\_toSafeId

___

### <a id="_update" name="_update"></a> \_update

▸ `Protected` **_update**<`T`, `R`\>(`newFields`): `Promise`<`R`\>

#### Type parameters

| Name |
| :------ |
| `T` |
| `R` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `newFields` | `T` |

#### Returns

`Promise`<`R`\>

#### Inherited from

ResourceClient.\_update

___

### <a id="_url" name="_url"></a> \_url

▸ `Protected` **_url**(`path?`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path?` | `string` |

#### Returns

`string`

#### Inherited from

ResourceClient.\_url

___

### <a id="_waitforfinish" name="_waitforfinish"></a> \_waitForFinish

▸ `Protected` **_waitForFinish**<`R`\>(`options?`): `Promise`<`R`\>

This function is used in Build and Run endpoints so it's kept
here to stay DRY.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `R` | extends `Object` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `WaitForFinishOptions` |

#### Returns

`Promise`<`R`\>

#### Inherited from

ResourceClient.\_waitForFinish

___

### <a id="call" name="call"></a> call

▸ **call**(`input?`, `options?`): `Promise`<[`ActorRun`](../interfaces/index.ActorRun.md)\>

Starts a task and waits for it to finish before returning the Run object.
It waits indefinitely, unless the `waitSecs` option is provided.
https://docs.apify.com/api/v2#/reference/actor-tasks/run-collection/run-task

#### Parameters

| Name | Type |
| :------ | :------ |
| `input?` | `Dictionary`<`unknown`\> |
| `options` | [`TaskStartOptions`](../modules/index.md#taskstartoptions) |

#### Returns

`Promise`<[`ActorRun`](../interfaces/index.ActorRun.md)\>

___

### <a id="delete" name="delete"></a> delete

▸ **delete**(): `Promise`<`void`\>

https://docs.apify.com/api/v2#/reference/actor-tasks/task-object/delete-task

#### Returns

`Promise`<`void`\>

___

### <a id="get" name="get"></a> get

▸ **get**(): `Promise`<`undefined` \| [`Task`](../interfaces/index.Task.md)\>

https://docs.apify.com/api/v2#/reference/actor-tasks/task-object/get-task

#### Returns

`Promise`<`undefined` \| [`Task`](../interfaces/index.Task.md)\>

___

### <a id="getinput" name="getinput"></a> getInput

▸ **getInput**(): `Promise`<`undefined` \| `Dictionary`<`unknown`\> \| `Dictionary`<`unknown`\>[]\>

https://docs.apify.com/api/v2#/reference/actor-tasks/task-input-object/get-task-input

#### Returns

`Promise`<`undefined` \| `Dictionary`<`unknown`\> \| `Dictionary`<`unknown`\>[]\>

___

### <a id="lastrun" name="lastrun"></a> lastRun

▸ **lastRun**(`options?`): [`RunClient`](index.RunClient.md)

https://docs.apify.com/api/v2#/reference/actor-tasks/last-run-object-and-its-storages

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`TaskLastRunOptions`](../interfaces/index.TaskLastRunOptions.md) |

#### Returns

[`RunClient`](index.RunClient.md)

___

### <a id="runs" name="runs"></a> runs

▸ **runs**(): [`RunCollectionClient`](index.RunCollectionClient.md)

https://docs.apify.com/api/v2#/reference/actor-tasks/run-collection

#### Returns

[`RunCollectionClient`](index.RunCollectionClient.md)

___

### <a id="start" name="start"></a> start

▸ **start**(`input?`, `options?`): `Promise`<[`ActorRun`](../interfaces/index.ActorRun.md)\>

Starts a task and immediately returns the Run object.
https://docs.apify.com/api/v2#/reference/actor-tasks/run-collection/run-task

#### Parameters

| Name | Type |
| :------ | :------ |
| `input?` | `Dictionary`<`unknown`\> |
| `options` | [`TaskStartOptions`](../modules/index.md#taskstartoptions) |

#### Returns

`Promise`<[`ActorRun`](../interfaces/index.ActorRun.md)\>

___

### <a id="update" name="update"></a> update

▸ **update**(`newFields`): `Promise`<[`Task`](../interfaces/index.Task.md)\>

https://docs.apify.com/api/v2#/reference/actor-tasks/task-object/update-task

#### Parameters

| Name | Type |
| :------ | :------ |
| `newFields` | `Partial`<`Pick`<[`Task`](../interfaces/index.Task.md), ``"name"`` \| ``"description"`` \| ``"options"`` \| ``"input"``\>\> |

#### Returns

`Promise`<[`Task`](../interfaces/index.Task.md)\>

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

▸ **webhooks**(): [`WebhookCollectionClient`](index.WebhookCollectionClient.md)

https://docs.apify.com/api/v2#/reference/actor-tasks/webhook-collection

#### Returns

[`WebhookCollectionClient`](index.WebhookCollectionClient.md)
