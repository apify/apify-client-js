# Class: DatasetClient<Data\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `Data` | extends `Record`<`string` \| `number`, `unknown`\> = `Record`<`string` \| `number`, `unknown`\> |

## Hierarchy

- `ResourceClient`

  ↳ **`DatasetClient`**

## Table of contents

### Properties

- [apifyClient](DatasetClient.md#apifyclient)
- [baseUrl](DatasetClient.md#baseurl)
- [httpClient](DatasetClient.md#httpclient)
- [id](DatasetClient.md#id)
- [params](DatasetClient.md#params)
- [resourcePath](DatasetClient.md#resourcepath)
- [safeId](DatasetClient.md#safeid)
- [url](DatasetClient.md#url)

### Methods

- [\_createPaginationList](DatasetClient.md#_createpaginationlist)
- [\_delete](DatasetClient.md#_delete)
- [\_get](DatasetClient.md#_get)
- [\_params](DatasetClient.md#_params)
- [\_subResourceOptions](DatasetClient.md#_subresourceoptions)
- [\_toSafeId](DatasetClient.md#_tosafeid)
- [\_update](DatasetClient.md#_update)
- [\_url](DatasetClient.md#_url)
- [\_waitForFinish](DatasetClient.md#_waitforfinish)
- [delete](DatasetClient.md#delete)
- [downloadItems](DatasetClient.md#downloaditems)
- [get](DatasetClient.md#get)
- [listItems](DatasetClient.md#listitems)
- [pushItems](DatasetClient.md#pushitems)
- [update](DatasetClient.md#update)

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

### <a id="_createpaginationlist" name="_createpaginationlist"></a> \_createPaginationList

▸ `Private` **_createPaginationList**(`response`, `userProvidedDesc`): [`PaginatedList`](../interfaces/PaginatedList.md)<`Data`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `response` | `ApifyResponse`<`any`\> |
| `userProvidedDesc` | `boolean` |

#### Returns

[`PaginatedList`](../interfaces/PaginatedList.md)<`Data`\>

___

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

https://docs.apify.com/api/v2#/reference/datasets/dataset/delete-dataset

#### Returns

`Promise`<`void`\>

___

### <a id="downloaditems" name="downloaditems"></a> downloadItems

▸ **downloadItems**(`format`, `options?`): `Promise`<`Buffer`\>

Unlike `listItems` which returns a {@link PaginationList} with an array of individual
dataset items, `downloadItems` returns the items serialized to the provided format.
https://docs.apify.com/api/v2#/reference/datasets/item-collection/get-items

#### Parameters

| Name | Type |
| :------ | :------ |
| `format` | [`DownloadItemsFormat`](../enums/DownloadItemsFormat.md) |
| `options` | [`DatasetClientDownloadItemsOptions`](../interfaces/DatasetClientDownloadItemsOptions.md) |

#### Returns

`Promise`<`Buffer`\>

___

### <a id="get" name="get"></a> get

▸ **get**(): `Promise`<`undefined` \| [`Dataset`](../interfaces/Dataset.md)\>

https://docs.apify.com/api/v2#/reference/datasets/dataset/get-dataset

#### Returns

`Promise`<`undefined` \| [`Dataset`](../interfaces/Dataset.md)\>

___

### <a id="listitems" name="listitems"></a> listItems

▸ **listItems**(`options?`): `Promise`<[`PaginatedList`](../interfaces/PaginatedList.md)<`Data`\>\>

https://docs.apify.com/api/v2#/reference/datasets/item-collection/get-items

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`DatasetClientListItemOptions`](../interfaces/DatasetClientListItemOptions.md) |

#### Returns

`Promise`<[`PaginatedList`](../interfaces/PaginatedList.md)<`Data`\>\>

___

### <a id="pushitems" name="pushitems"></a> pushItems

▸ **pushItems**(`items`): `Promise`<`void`\>

https://docs.apify.com/api/v2#/reference/datasets/item-collection/put-items

#### Parameters

| Name | Type |
| :------ | :------ |
| `items` | `string` \| `string`[] \| `Data` \| `Data`[] |

#### Returns

`Promise`<`void`\>

___

### <a id="update" name="update"></a> update

▸ **update**(`newFields`): `Promise`<[`Dataset`](../interfaces/Dataset.md)\>

https://docs.apify.com/api/v2#/reference/datasets/dataset/update-dataset

#### Parameters

| Name | Type |
| :------ | :------ |
| `newFields` | [`DatasetClientUpdateOptions`](../interfaces/DatasetClientUpdateOptions.md) |

#### Returns

`Promise`<[`Dataset`](../interfaces/Dataset.md)\>
