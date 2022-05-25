# Class: WebhookClient

## Hierarchy

- `ResourceClient`

  ↳ **`WebhookClient`**

## Table of contents

### Properties

- [apifyClient](WebhookClient.md#apifyclient)
- [baseUrl](WebhookClient.md#baseurl)
- [httpClient](WebhookClient.md#httpclient)
- [id](WebhookClient.md#id)
- [params](WebhookClient.md#params)
- [resourcePath](WebhookClient.md#resourcepath)
- [safeId](WebhookClient.md#safeid)
- [url](WebhookClient.md#url)

### Methods

- [delete](WebhookClient.md#delete)
- [dispatches](WebhookClient.md#dispatches)
- [get](WebhookClient.md#get)
- [test](WebhookClient.md#test)
- [update](WebhookClient.md#update)

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

https://docs.apify.com/api/v2#/reference/webhooks/webhook-object/delete-webhook

#### Returns

`Promise`<`void`\>

___

### <a id="dispatches" name="dispatches"></a> dispatches

▸ **dispatches**(): [`WebhookDispatchCollectionClient`](WebhookDispatchCollectionClient.md)

https://docs.apify.com/api/v2#/reference/webhooks/dispatches-collection

#### Returns

[`WebhookDispatchCollectionClient`](WebhookDispatchCollectionClient.md)

___

### <a id="get" name="get"></a> get

▸ **get**(): `Promise`<`undefined` \| [`Webhook`](../interfaces/Webhook.md)\>

https://docs.apify.com/api/v2#/reference/webhooks/webhook-object/get-webhook

#### Returns

`Promise`<`undefined` \| [`Webhook`](../interfaces/Webhook.md)\>

___

### <a id="test" name="test"></a> test

▸ **test**(): `Promise`<`undefined` \| [`WebhookDispatch`](../interfaces/WebhookDispatch.md)\>

https://docs.apify.com/api/v2#/reference/webhooks/webhook-test/test-webhook

#### Returns

`Promise`<`undefined` \| [`WebhookDispatch`](../interfaces/WebhookDispatch.md)\>

___

### <a id="update" name="update"></a> update

▸ **update**(`newFields`): `Promise`<[`Webhook`](../interfaces/Webhook.md)\>

https://docs.apify.com/api/v2#/reference/webhooks/webhook-object/update-webhook

#### Parameters

| Name | Type |
| :------ | :------ |
| `newFields` | [`WebhookUpdateData`](../modules.md#webhookupdatedata) |

#### Returns

`Promise`<[`Webhook`](../interfaces/Webhook.md)\>
