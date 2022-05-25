# Class: KeyValueStoreClient

[index](../modules/index.md).KeyValueStoreClient

## Hierarchy

- `ResourceClient`

  ↳ **`KeyValueStoreClient`**

## Table of contents

### Properties

- [apifyClient](index.KeyValueStoreClient.md#apifyclient)
- [baseUrl](index.KeyValueStoreClient.md#baseurl)
- [httpClient](index.KeyValueStoreClient.md#httpclient)
- [id](index.KeyValueStoreClient.md#id)
- [params](index.KeyValueStoreClient.md#params)
- [resourcePath](index.KeyValueStoreClient.md#resourcepath)
- [safeId](index.KeyValueStoreClient.md#safeid)
- [url](index.KeyValueStoreClient.md#url)

### Methods

- [\_delete](index.KeyValueStoreClient.md#_delete)
- [\_get](index.KeyValueStoreClient.md#_get)
- [\_params](index.KeyValueStoreClient.md#_params)
- [\_subResourceOptions](index.KeyValueStoreClient.md#_subresourceoptions)
- [\_toSafeId](index.KeyValueStoreClient.md#_tosafeid)
- [\_update](index.KeyValueStoreClient.md#_update)
- [\_url](index.KeyValueStoreClient.md#_url)
- [\_waitForFinish](index.KeyValueStoreClient.md#_waitforfinish)
- [delete](index.KeyValueStoreClient.md#delete)
- [deleteRecord](index.KeyValueStoreClient.md#deleterecord)
- [get](index.KeyValueStoreClient.md#get)
- [getRecord](index.KeyValueStoreClient.md#getrecord)
- [listKeys](index.KeyValueStoreClient.md#listkeys)
- [setRecord](index.KeyValueStoreClient.md#setrecord)
- [update](index.KeyValueStoreClient.md#update)

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

### <a id="delete" name="delete"></a> delete

▸ **delete**(): `Promise`<`void`\>

https://docs.apify.com/api/v2#/reference/key-value-stores/store-object/delete-store

#### Returns

`Promise`<`void`\>

___

### <a id="deleterecord" name="deleterecord"></a> deleteRecord

▸ **deleteRecord**(`key`): `Promise`<`void`\>

https://docs.apify.com/api/v2#/reference/key-value-stores/record/delete-record

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`Promise`<`void`\>

___

### <a id="get" name="get"></a> get

▸ **get**(): `Promise`<`undefined` \| [`KeyValueStore`](../interfaces/index.KeyValueStore.md)\>

https://docs.apify.com/api/v2#/reference/key-value-stores/store-object/get-store

#### Returns

`Promise`<`undefined` \| [`KeyValueStore`](../interfaces/index.KeyValueStore.md)\>

___

### <a id="getrecord" name="getrecord"></a> getRecord

▸ **getRecord**(`key`): `Promise`<`undefined` \| [`KeyValueStoreRecord`](../interfaces/index.KeyValueStoreRecord.md)<`JsonValue`\>\>

You can use the `buffer` option to get the value in a Buffer (Node.js)
or ArrayBuffer (browser) format. In Node.js (not in browser) you can also
use the `stream` option to get a Readable stream.

When the record does not exist, the function resolves to `undefined`. It does
NOT resolve to a `KeyValueStore` record with an `undefined` value.
https://docs.apify.com/api/v2#/reference/key-value-stores/record/get-record

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`Promise`<`undefined` \| [`KeyValueStoreRecord`](../interfaces/index.KeyValueStoreRecord.md)<`JsonValue`\>\>

▸ **getRecord**<`Options`\>(`key`, `options`): `Promise`<`undefined` \| [`KeyValueStoreRecord`](../interfaces/index.KeyValueStoreRecord.md)<[`ReturnTypeFromOptions`](../modules/index.md#returntypefromoptions)<`Options`\>\>\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Options` | extends [`KeyValueClientGetRecordOptions`](../interfaces/index.KeyValueClientGetRecordOptions.md) = [`KeyValueClientGetRecordOptions`](../interfaces/index.KeyValueClientGetRecordOptions.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `options` | `Options` |

#### Returns

`Promise`<`undefined` \| [`KeyValueStoreRecord`](../interfaces/index.KeyValueStoreRecord.md)<[`ReturnTypeFromOptions`](../modules/index.md#returntypefromoptions)<`Options`\>\>\>

___

### <a id="listkeys" name="listkeys"></a> listKeys

▸ **listKeys**(`options?`): `Promise`<[`KeyValueClientListKeysResult`](../interfaces/index.KeyValueClientListKeysResult.md)\>

https://docs.apify.com/api/v2#/reference/key-value-stores/key-collection/get-list-of-keys

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`KeyValueClientListKeysOptions`](../interfaces/index.KeyValueClientListKeysOptions.md) |

#### Returns

`Promise`<[`KeyValueClientListKeysResult`](../interfaces/index.KeyValueClientListKeysResult.md)\>

___

### <a id="setrecord" name="setrecord"></a> setRecord

▸ **setRecord**(`record`): `Promise`<`void`\>

https://docs.apify.com/api/v2#/reference/key-value-stores/record/put-record

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | [`KeyValueStoreRecord`](../interfaces/index.KeyValueStoreRecord.md)<`JsonValue`\> |

#### Returns

`Promise`<`void`\>

___

### <a id="update" name="update"></a> update

▸ **update**(`newFields`): `Promise`<[`KeyValueStore`](../interfaces/index.KeyValueStore.md)\>

https://docs.apify.com/api/v2#/reference/key-value-stores/store-object/update-store

#### Parameters

| Name | Type |
| :------ | :------ |
| `newFields` | [`KeyValueClientUpdateOptions`](../interfaces/index.KeyValueClientUpdateOptions.md) |

#### Returns

`Promise`<[`KeyValueStore`](../interfaces/index.KeyValueStore.md)\>
