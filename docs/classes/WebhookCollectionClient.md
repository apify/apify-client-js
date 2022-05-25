# Class: WebhookCollectionClient

## Hierarchy

- `ResourceCollectionClient`

  ↳ **`WebhookCollectionClient`**

## Table of contents

### Properties

- [apifyClient](WebhookCollectionClient.md#apifyclient)
- [baseUrl](WebhookCollectionClient.md#baseurl)
- [httpClient](WebhookCollectionClient.md#httpclient)
- [id](WebhookCollectionClient.md#id)
- [params](WebhookCollectionClient.md#params)
- [resourcePath](WebhookCollectionClient.md#resourcepath)
- [safeId](WebhookCollectionClient.md#safeid)
- [url](WebhookCollectionClient.md#url)

### Methods

- [create](WebhookCollectionClient.md#create)
- [list](WebhookCollectionClient.md#list)

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

### <a id="create" name="create"></a> create

▸ **create**(`webhook?`): `Promise`<[`Webhook`](../interfaces/Webhook.md)\>

https://docs.apify.com/api/v2#/reference/webhooks/webhook-collection/create-webhook

#### Parameters

| Name | Type |
| :------ | :------ |
| `webhook?` | [`WebhookUpdateData`](../modules.md#webhookupdatedata) |

#### Returns

`Promise`<[`Webhook`](../interfaces/Webhook.md)\>

___

### <a id="list" name="list"></a> list

▸ **list**(`options?`): `Promise`<[`PaginatedList`](../interfaces/PaginatedList.md)<`Omit`<[`Webhook`](../interfaces/Webhook.md), ``"payloadTemplate"``\>\>\>

https://docs.apify.com/api/v2#/reference/webhooks/webhook-collection/get-list-of-webhooks

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`WebhookCollectionListOptions`](../interfaces/WebhookCollectionListOptions.md) |

#### Returns

`Promise`<[`PaginatedList`](../interfaces/PaginatedList.md)<`Omit`<[`Webhook`](../interfaces/Webhook.md), ``"payloadTemplate"``\>\>\>
