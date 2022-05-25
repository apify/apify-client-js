# Class: WebhookDispatchCollectionClient

## Hierarchy

- `ResourceCollectionClient`

  ↳ **`WebhookDispatchCollectionClient`**

## Table of contents

### Properties

- [apifyClient](WebhookDispatchCollectionClient.md#apifyclient)
- [baseUrl](WebhookDispatchCollectionClient.md#baseurl)
- [httpClient](WebhookDispatchCollectionClient.md#httpclient)
- [id](WebhookDispatchCollectionClient.md#id)
- [params](WebhookDispatchCollectionClient.md#params)
- [resourcePath](WebhookDispatchCollectionClient.md#resourcepath)
- [safeId](WebhookDispatchCollectionClient.md#safeid)
- [url](WebhookDispatchCollectionClient.md#url)

### Methods

- [list](WebhookDispatchCollectionClient.md#list)

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

▸ **list**(`options?`): `Promise`<[`PaginatedList`](../interfaces/PaginatedList.md)<[`WebhookDispatch`](../interfaces/WebhookDispatch.md)\>\>

https://docs.apify.com/api/v2#/reference/webhook-dispatches/webhook-dispatches-collection/get-list-of-webhook-dispatches

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`WebhookDispatchCollectionListOptions`](../interfaces/WebhookDispatchCollectionListOptions.md) |

#### Returns

`Promise`<[`PaginatedList`](../interfaces/PaginatedList.md)<[`WebhookDispatch`](../interfaces/WebhookDispatch.md)\>\>
