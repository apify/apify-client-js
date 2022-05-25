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
