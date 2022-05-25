# Class: DatasetCollectionClient

## Hierarchy

- `ResourceCollectionClient`

  ↳ **`DatasetCollectionClient`**

## Table of contents

### Properties

- [apifyClient](DatasetCollectionClient.md#apifyclient)
- [baseUrl](DatasetCollectionClient.md#baseurl)
- [httpClient](DatasetCollectionClient.md#httpclient)
- [id](DatasetCollectionClient.md#id)
- [params](DatasetCollectionClient.md#params)
- [resourcePath](DatasetCollectionClient.md#resourcepath)
- [safeId](DatasetCollectionClient.md#safeid)
- [url](DatasetCollectionClient.md#url)

### Methods

- [getOrCreate](DatasetCollectionClient.md#getorcreate)
- [list](DatasetCollectionClient.md#list)

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

▸ **getOrCreate**(`name?`, `options?`): `Promise`<[`Dataset`](../interfaces/Dataset.md)\>

https://docs.apify.com/api/v2#/reference/datasets/dataset-collection/create-dataset

#### Parameters

| Name | Type |
| :------ | :------ |
| `name?` | `string` |
| `options?` | [`DatasetCollectionClientGetOrCreateOptions`](../interfaces/DatasetCollectionClientGetOrCreateOptions.md) |

#### Returns

`Promise`<[`Dataset`](../interfaces/Dataset.md)\>

___

### <a id="list" name="list"></a> list

▸ **list**(`options?`): `Promise`<[`DatasetCollectionClientListResult`](../modules.md#datasetcollectionclientlistresult)\>

https://docs.apify.com/api/v2#/reference/datasets/dataset-collection/get-list-of-datasets

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`DatasetCollectionClientListOptions`](../interfaces/DatasetCollectionClientListOptions.md) |

#### Returns

`Promise`<[`DatasetCollectionClientListResult`](../modules.md#datasetcollectionclientlistresult)\>
