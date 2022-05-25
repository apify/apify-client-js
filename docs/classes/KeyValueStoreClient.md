# Class: KeyValueStoreClient

## Hierarchy

- `ResourceClient`

  ↳ **`KeyValueStoreClient`**

## Table of contents

### Properties

- [apifyClient](KeyValueStoreClient.md#apifyclient)
- [baseUrl](KeyValueStoreClient.md#baseurl)
- [httpClient](KeyValueStoreClient.md#httpclient)
- [id](KeyValueStoreClient.md#id)
- [params](KeyValueStoreClient.md#params)
- [resourcePath](KeyValueStoreClient.md#resourcepath)
- [safeId](KeyValueStoreClient.md#safeid)
- [url](KeyValueStoreClient.md#url)

### Methods

- [delete](KeyValueStoreClient.md#delete)
- [deleteRecord](KeyValueStoreClient.md#deleterecord)
- [get](KeyValueStoreClient.md#get)
- [getRecord](KeyValueStoreClient.md#getrecord)
- [listKeys](KeyValueStoreClient.md#listkeys)
- [setRecord](KeyValueStoreClient.md#setrecord)
- [update](KeyValueStoreClient.md#update)

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

▸ **get**(): `Promise`<`undefined` \| [`KeyValueStore`](../interfaces/KeyValueStore.md)\>

https://docs.apify.com/api/v2#/reference/key-value-stores/store-object/get-store

#### Returns

`Promise`<`undefined` \| [`KeyValueStore`](../interfaces/KeyValueStore.md)\>

___

### <a id="getrecord" name="getrecord"></a> getRecord

▸ **getRecord**(`key`): `Promise`<`undefined` \| [`KeyValueStoreRecord`](../interfaces/KeyValueStoreRecord.md)<`JsonValue`\>\>

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

`Promise`<`undefined` \| [`KeyValueStoreRecord`](../interfaces/KeyValueStoreRecord.md)<`JsonValue`\>\>

▸ **getRecord**<`Options`\>(`key`, `options`): `Promise`<`undefined` \| [`KeyValueStoreRecord`](../interfaces/KeyValueStoreRecord.md)<[`ReturnTypeFromOptions`](../modules.md#returntypefromoptions)<`Options`\>\>\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Options` | extends [`KeyValueClientGetRecordOptions`](../interfaces/KeyValueClientGetRecordOptions.md) = [`KeyValueClientGetRecordOptions`](../interfaces/KeyValueClientGetRecordOptions.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `options` | `Options` |

#### Returns

`Promise`<`undefined` \| [`KeyValueStoreRecord`](../interfaces/KeyValueStoreRecord.md)<[`ReturnTypeFromOptions`](../modules.md#returntypefromoptions)<`Options`\>\>\>

___

### <a id="listkeys" name="listkeys"></a> listKeys

▸ **listKeys**(`options?`): `Promise`<[`KeyValueClientListKeysResult`](../interfaces/KeyValueClientListKeysResult.md)\>

https://docs.apify.com/api/v2#/reference/key-value-stores/key-collection/get-list-of-keys

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`KeyValueClientListKeysOptions`](../interfaces/KeyValueClientListKeysOptions.md) |

#### Returns

`Promise`<[`KeyValueClientListKeysResult`](../interfaces/KeyValueClientListKeysResult.md)\>

___

### <a id="setrecord" name="setrecord"></a> setRecord

▸ **setRecord**(`record`): `Promise`<`void`\>

https://docs.apify.com/api/v2#/reference/key-value-stores/record/put-record

#### Parameters

| Name | Type |
| :------ | :------ |
| `record` | [`KeyValueStoreRecord`](../interfaces/KeyValueStoreRecord.md)<`JsonValue`\> |

#### Returns

`Promise`<`void`\>

___

### <a id="update" name="update"></a> update

▸ **update**(`newFields`): `Promise`<[`KeyValueStore`](../interfaces/KeyValueStore.md)\>

https://docs.apify.com/api/v2#/reference/key-value-stores/store-object/update-store

#### Parameters

| Name | Type |
| :------ | :------ |
| `newFields` | [`KeyValueClientUpdateOptions`](../interfaces/KeyValueClientUpdateOptions.md) |

#### Returns

`Promise`<[`KeyValueStore`](../interfaces/KeyValueStore.md)\>
