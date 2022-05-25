# Class: RequestQueueCollectionClient

## Hierarchy

- `ResourceCollectionClient`

  ↳ **`RequestQueueCollectionClient`**

## Table of contents

### Properties

- [apifyClient](RequestQueueCollectionClient.md#apifyclient)
- [baseUrl](RequestQueueCollectionClient.md#baseurl)
- [httpClient](RequestQueueCollectionClient.md#httpclient)
- [id](RequestQueueCollectionClient.md#id)
- [params](RequestQueueCollectionClient.md#params)
- [resourcePath](RequestQueueCollectionClient.md#resourcepath)
- [safeId](RequestQueueCollectionClient.md#safeid)
- [url](RequestQueueCollectionClient.md#url)

### Methods

- [getOrCreate](RequestQueueCollectionClient.md#getorcreate)
- [list](RequestQueueCollectionClient.md#list)

## Properties

### <a id="apifyclient" name="apifyclient"></a> apifyClient

• **apifyClient**: [`ApifyClient`](ApifyClient.md)

#### Inherited from

ResourceCollectionClient.apifyClient

___

### <a id="baseurl" name="baseurl"></a> baseUrl

• **baseUrl**: `string`

#### Inherited from

ResourceCollectionClient.baseUrl

___

### <a id="httpclient" name="httpclient"></a> httpClient

• **httpClient**: `HttpClient`

#### Inherited from

ResourceCollectionClient.httpClient

___

### <a id="id" name="id"></a> id

• `Optional` **id**: `string`

#### Inherited from

ResourceCollectionClient.id

___

### <a id="params" name="params"></a> params

• `Optional` **params**: `Record`<`string`, `unknown`\>

#### Inherited from

ResourceCollectionClient.params

___

### <a id="resourcepath" name="resourcepath"></a> resourcePath

• **resourcePath**: `string`

#### Inherited from

ResourceCollectionClient.resourcePath

___

### <a id="safeid" name="safeid"></a> safeId

• `Optional` **safeId**: `string`

#### Inherited from

ResourceCollectionClient.safeId

___

### <a id="url" name="url"></a> url

• **url**: `string`

#### Inherited from

ResourceCollectionClient.url

## Methods

### <a id="getorcreate" name="getorcreate"></a> getOrCreate

▸ **getOrCreate**(`name?`): `Promise`<[`RequestQueue`](../interfaces/RequestQueue.md)\>

https://docs.apify.com/api/v2#/reference/request-queues/queue-collection/create-request-queue

#### Parameters

| Name | Type |
| :------ | :------ |
| `name?` | `string` |

#### Returns

`Promise`<[`RequestQueue`](../interfaces/RequestQueue.md)\>

___

### <a id="list" name="list"></a> list

▸ **list**(`options?`): `Promise`<[`RequestQueueCollectionListResult`](../modules.md#requestqueuecollectionlistresult)\>

https://docs.apify.com/api/v2#/reference/request-queues/queue-collection/get-list-of-request-queues

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`RequestQueueCollectionListOptions`](../interfaces/RequestQueueCollectionListOptions.md) |

#### Returns

`Promise`<[`RequestQueueCollectionListResult`](../modules.md#requestqueuecollectionlistresult)\>
