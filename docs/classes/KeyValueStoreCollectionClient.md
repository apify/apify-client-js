# Class: KeyValueStoreCollectionClient

## Hierarchy

- `ResourceCollectionClient`

  ↳ **`KeyValueStoreCollectionClient`**

## Table of contents

### Properties

- [apifyClient](KeyValueStoreCollectionClient.md#apifyclient)
- [baseUrl](KeyValueStoreCollectionClient.md#baseurl)
- [httpClient](KeyValueStoreCollectionClient.md#httpclient)
- [id](KeyValueStoreCollectionClient.md#id)
- [params](KeyValueStoreCollectionClient.md#params)
- [resourcePath](KeyValueStoreCollectionClient.md#resourcepath)
- [safeId](KeyValueStoreCollectionClient.md#safeid)
- [url](KeyValueStoreCollectionClient.md#url)

### Methods

- [getOrCreate](KeyValueStoreCollectionClient.md#getorcreate)
- [list](KeyValueStoreCollectionClient.md#list)

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

▸ **getOrCreate**(`name?`, `options?`): `Promise`<[`KeyValueStore`](../interfaces/KeyValueStore.md)\>

https://docs.apify.com/api/v2#/reference/key-value-stores/store-collection/create-key-value-store

#### Parameters

| Name | Type |
| :------ | :------ |
| `name?` | `string` |
| `options?` | [`KeyValueStoreCollectionClientGetOrCreateOptions`](../interfaces/KeyValueStoreCollectionClientGetOrCreateOptions.md) |

#### Returns

`Promise`<[`KeyValueStore`](../interfaces/KeyValueStore.md)\>

___

### <a id="list" name="list"></a> list

▸ **list**(`options?`): `Promise`<[`PaginatedList`](../interfaces/PaginatedList.md)<[`KeyValueStoreCollectionListResult`](../modules.md#keyvaluestorecollectionlistresult)\>\>

https://docs.apify.com/api/v2#/reference/key-value-stores/store-collection/get-list-of-key-value-stores

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`KeyValueStoreCollectionClientListOptions`](../interfaces/KeyValueStoreCollectionClientListOptions.md) |

#### Returns

`Promise`<[`PaginatedList`](../interfaces/PaginatedList.md)<[`KeyValueStoreCollectionListResult`](../modules.md#keyvaluestorecollectionlistresult)\>\>
