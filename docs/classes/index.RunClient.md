# Class: RunClient

[index](../modules/index.md).RunClient

## Hierarchy

- `ResourceClient`

  ↳ **`RunClient`**

## Table of contents

### Properties

- [apifyClient](index.RunClient.md#apifyclient)
- [baseUrl](index.RunClient.md#baseurl)
- [httpClient](index.RunClient.md#httpclient)
- [id](index.RunClient.md#id)
- [params](index.RunClient.md#params)
- [resourcePath](index.RunClient.md#resourcepath)
- [safeId](index.RunClient.md#safeid)
- [url](index.RunClient.md#url)

### Methods

- [\_delete](index.RunClient.md#_delete)
- [\_get](index.RunClient.md#_get)
- [\_params](index.RunClient.md#_params)
- [\_subResourceOptions](index.RunClient.md#_subresourceoptions)
- [\_toSafeId](index.RunClient.md#_tosafeid)
- [\_update](index.RunClient.md#_update)
- [\_url](index.RunClient.md#_url)
- [\_waitForFinish](index.RunClient.md#_waitforfinish)
- [abort](index.RunClient.md#abort)
- [dataset](index.RunClient.md#dataset)
- [get](index.RunClient.md#get)
- [keyValueStore](index.RunClient.md#keyvaluestore)
- [log](index.RunClient.md#log)
- [metamorph](index.RunClient.md#metamorph)
- [requestQueue](index.RunClient.md#requestqueue)
- [resurrect](index.RunClient.md#resurrect)
- [waitForFinish](index.RunClient.md#waitforfinish)

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

### <a id="abort" name="abort"></a> abort

▸ **abort**(`options?`): `Promise`<[`ActorRun`](../interfaces/index.ActorRun.md)\>

https://docs.apify.com/api/v2#/reference/actor-runs/abort-run/abort-run

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`RunAbortOptions`](../interfaces/index.RunAbortOptions.md) |

#### Returns

`Promise`<[`ActorRun`](../interfaces/index.ActorRun.md)\>

___

### <a id="dataset" name="dataset"></a> dataset

▸ **dataset**(): [`DatasetClient`](index.DatasetClient.md)<`Record`<`string` \| `number`, `unknown`\>\>

https://docs.apify.com/api/v2#/reference/actor-runs/run-object-and-its-storages

This also works through `actorClient.lastRun().dataset()`.
https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages

#### Returns

[`DatasetClient`](index.DatasetClient.md)<`Record`<`string` \| `number`, `unknown`\>\>

___

### <a id="get" name="get"></a> get

▸ **get**(`options?`): `Promise`<`undefined` \| [`ActorRun`](../interfaces/index.ActorRun.md)\>

https://docs.apify.com/api/v2#/reference/actor-runs/run-object/get-run

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`RunGetOptions`](../interfaces/index.RunGetOptions.md) |

#### Returns

`Promise`<`undefined` \| [`ActorRun`](../interfaces/index.ActorRun.md)\>

___

### <a id="keyvaluestore" name="keyvaluestore"></a> keyValueStore

▸ **keyValueStore**(): [`KeyValueStoreClient`](index.KeyValueStoreClient.md)

https://docs.apify.com/api/v2#/reference/actor-runs/run-object-and-its-storages

This also works through `actorClient.lastRun().keyValueStore()`.
https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages

#### Returns

[`KeyValueStoreClient`](index.KeyValueStoreClient.md)

___

### <a id="log" name="log"></a> log

▸ **log**(): [`LogClient`](index.LogClient.md)

https://docs.apify.com/api/v2#/reference/actor-runs/run-object-and-its-storages

This also works through `actorClient.lastRun().log()`.
https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages

#### Returns

[`LogClient`](index.LogClient.md)

___

### <a id="metamorph" name="metamorph"></a> metamorph

▸ **metamorph**(`targetActorId`, `input`, `options?`): `Promise`<[`ActorRun`](../interfaces/index.ActorRun.md)\>

https://docs.apify.com/api/v2#/reference/actor-runs/metamorph-run/metamorph-run

#### Parameters

| Name | Type |
| :------ | :------ |
| `targetActorId` | `string` |
| `input` | `unknown` |
| `options` | [`RunMetamorphOptions`](../interfaces/index.RunMetamorphOptions.md) |

#### Returns

`Promise`<[`ActorRun`](../interfaces/index.ActorRun.md)\>

___

### <a id="requestqueue" name="requestqueue"></a> requestQueue

▸ **requestQueue**(): [`RequestQueueClient`](index.RequestQueueClient.md)

https://docs.apify.com/api/v2#/reference/actor-runs/run-object-and-its-storages

This also works through `actorClient.lastRun().requestQueue()`.
https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages

#### Returns

[`RequestQueueClient`](index.RequestQueueClient.md)

___

### <a id="resurrect" name="resurrect"></a> resurrect

▸ **resurrect**(`options?`): `Promise`<[`ActorRun`](../interfaces/index.ActorRun.md)\>

https://docs.apify.com/api/v2#/reference/actor-runs/resurrect-run/resurrect-run

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`RunResurrectOptions`](../interfaces/index.RunResurrectOptions.md) |

#### Returns

`Promise`<[`ActorRun`](../interfaces/index.ActorRun.md)\>

___

### <a id="waitforfinish" name="waitforfinish"></a> waitForFinish

▸ **waitForFinish**(`options?`): `Promise`<[`ActorRun`](../interfaces/index.ActorRun.md)\>

Returns a promise that resolves with the finished Run object when the provided actor run finishes
or with the unfinished Run object when the `waitSecs` timeout lapses. The promise is NOT rejected
based on run status. You can inspect the `status` property of the Run object to find out its status.

The difference between this function and the `waitForFinish` parameter of the `get` method
is the fact that this function can wait indefinitely. Its use is preferable to the
`waitForFinish` parameter alone, which it uses internally.

This is useful when you need to chain actor executions. Similar effect can be achieved
by using webhooks, so be sure to review which technique fits your use-case better.

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`RunWaitForFinishOptions`](../interfaces/index.RunWaitForFinishOptions.md) |

#### Returns

`Promise`<[`ActorRun`](../interfaces/index.ActorRun.md)\>
