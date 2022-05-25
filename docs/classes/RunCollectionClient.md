# Class: RunCollectionClient

## Hierarchy

- `ResourceCollectionClient`

  ↳ **`RunCollectionClient`**

## Table of contents

### Properties

- [apifyClient](RunCollectionClient.md#apifyclient)
- [baseUrl](RunCollectionClient.md#baseurl)
- [httpClient](RunCollectionClient.md#httpclient)
- [id](RunCollectionClient.md#id)
- [params](RunCollectionClient.md#params)
- [resourcePath](RunCollectionClient.md#resourcepath)
- [safeId](RunCollectionClient.md#safeid)
- [url](RunCollectionClient.md#url)

### Methods

- [list](RunCollectionClient.md#list)

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

### <a id="list" name="list"></a> list

▸ **list**(`options?`): `Promise`<[`PaginatedList`](../interfaces/PaginatedList.md)<[`ActorRun`](../interfaces/ActorRun.md)\>\>

https://docs.apify.com/api/v2#/reference/actors/run-collection/get-list-of-runs

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`RunCollectionListOptions`](../interfaces/RunCollectionListOptions.md) |

#### Returns

`Promise`<[`PaginatedList`](../interfaces/PaginatedList.md)<[`ActorRun`](../interfaces/ActorRun.md)\>\>
