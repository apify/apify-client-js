# Class: RunClient

## Hierarchy

- `ResourceClient`

  ↳ **`RunClient`**

## Table of contents

### Properties

- [apifyClient](RunClient.md#apifyclient)
- [baseUrl](RunClient.md#baseurl)
- [httpClient](RunClient.md#httpclient)
- [id](RunClient.md#id)
- [params](RunClient.md#params)
- [resourcePath](RunClient.md#resourcepath)
- [safeId](RunClient.md#safeid)
- [url](RunClient.md#url)

### Methods

- [abort](RunClient.md#abort)
- [dataset](RunClient.md#dataset)
- [get](RunClient.md#get)
- [keyValueStore](RunClient.md#keyvaluestore)
- [log](RunClient.md#log)
- [metamorph](RunClient.md#metamorph)
- [requestQueue](RunClient.md#requestqueue)
- [resurrect](RunClient.md#resurrect)
- [waitForFinish](RunClient.md#waitforfinish)

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

### <a id="abort" name="abort"></a> abort

▸ **abort**(`options?`): `Promise`<[`ActorRun`](../interfaces/ActorRun.md)\>

https://docs.apify.com/api/v2#/reference/actor-runs/abort-run/abort-run

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`RunAbortOptions`](../interfaces/RunAbortOptions.md) |

#### Returns

`Promise`<[`ActorRun`](../interfaces/ActorRun.md)\>

___

### <a id="dataset" name="dataset"></a> dataset

▸ **dataset**(): [`DatasetClient`](DatasetClient.md)<`Record`<`string` \| `number`, `unknown`\>\>

https://docs.apify.com/api/v2#/reference/actor-runs/run-object-and-its-storages

This also works through `actorClient.lastRun().dataset()`.
https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages

#### Returns

[`DatasetClient`](DatasetClient.md)<`Record`<`string` \| `number`, `unknown`\>\>

___

### <a id="get" name="get"></a> get

▸ **get**(`options?`): `Promise`<`undefined` \| [`ActorRun`](../interfaces/ActorRun.md)\>

https://docs.apify.com/api/v2#/reference/actor-runs/run-object/get-run

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`RunGetOptions`](../interfaces/RunGetOptions.md) |

#### Returns

`Promise`<`undefined` \| [`ActorRun`](../interfaces/ActorRun.md)\>

___

### <a id="keyvaluestore" name="keyvaluestore"></a> keyValueStore

▸ **keyValueStore**(): [`KeyValueStoreClient`](KeyValueStoreClient.md)

https://docs.apify.com/api/v2#/reference/actor-runs/run-object-and-its-storages

This also works through `actorClient.lastRun().keyValueStore()`.
https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages

#### Returns

[`KeyValueStoreClient`](KeyValueStoreClient.md)

___

### <a id="log" name="log"></a> log

▸ **log**(): [`LogClient`](LogClient.md)

https://docs.apify.com/api/v2#/reference/actor-runs/run-object-and-its-storages

This also works through `actorClient.lastRun().log()`.
https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages

#### Returns

[`LogClient`](LogClient.md)

___

### <a id="metamorph" name="metamorph"></a> metamorph

▸ **metamorph**(`targetActorId`, `input`, `options?`): `Promise`<[`ActorRun`](../interfaces/ActorRun.md)\>

https://docs.apify.com/api/v2#/reference/actor-runs/metamorph-run/metamorph-run

#### Parameters

| Name | Type |
| :------ | :------ |
| `targetActorId` | `string` |
| `input` | `unknown` |
| `options` | [`RunMetamorphOptions`](../interfaces/RunMetamorphOptions.md) |

#### Returns

`Promise`<[`ActorRun`](../interfaces/ActorRun.md)\>

___

### <a id="requestqueue" name="requestqueue"></a> requestQueue

▸ **requestQueue**(): [`RequestQueueClient`](RequestQueueClient.md)

https://docs.apify.com/api/v2#/reference/actor-runs/run-object-and-its-storages

This also works through `actorClient.lastRun().requestQueue()`.
https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages

#### Returns

[`RequestQueueClient`](RequestQueueClient.md)

___

### <a id="resurrect" name="resurrect"></a> resurrect

▸ **resurrect**(`options?`): `Promise`<[`ActorRun`](../interfaces/ActorRun.md)\>

https://docs.apify.com/api/v2#/reference/actor-runs/resurrect-run/resurrect-run

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`RunResurrectOptions`](../interfaces/RunResurrectOptions.md) |

#### Returns

`Promise`<[`ActorRun`](../interfaces/ActorRun.md)\>

___

### <a id="waitforfinish" name="waitforfinish"></a> waitForFinish

▸ **waitForFinish**(`options?`): `Promise`<[`ActorRun`](../interfaces/ActorRun.md)\>

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
| `options` | [`RunWaitForFinishOptions`](../interfaces/RunWaitForFinishOptions.md) |

#### Returns

`Promise`<[`ActorRun`](../interfaces/ActorRun.md)\>
