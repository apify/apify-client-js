# Class: BuildCollectionClient

## Hierarchy

- `ResourceCollectionClient`

  ↳ **`BuildCollectionClient`**

## Table of contents

### Properties

- [apifyClient](BuildCollectionClient.md#apifyclient)
- [baseUrl](BuildCollectionClient.md#baseurl)
- [httpClient](BuildCollectionClient.md#httpclient)
- [id](BuildCollectionClient.md#id)
- [params](BuildCollectionClient.md#params)
- [resourcePath](BuildCollectionClient.md#resourcepath)
- [safeId](BuildCollectionClient.md#safeid)
- [url](BuildCollectionClient.md#url)

### Methods

- [list](BuildCollectionClient.md#list)

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

▸ **list**(`options?`): `Promise`<[`BuildCollectionClientListResult`](../modules.md#buildcollectionclientlistresult)\>

https://docs.apify.com/api/v2#/reference/actors/build-collection/get-list-of-builds

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`BuildCollectionClientListOptions`](../interfaces/BuildCollectionClientListOptions.md) |

#### Returns

`Promise`<[`BuildCollectionClientListResult`](../modules.md#buildcollectionclientlistresult)\>
