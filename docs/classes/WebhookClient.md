# Class: WebhookClient

**`hideconstructor`**

## Hierarchy

- `ResourceClient`

  ↳ **`WebhookClient`**

## Table of contents

### Constructors

- [constructor](WebhookClient.md#constructor)

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

- [\_delete](WebhookClient.md#_delete)
- [\_get](WebhookClient.md#_get)
- [\_params](WebhookClient.md#_params)
- [\_subResourceOptions](WebhookClient.md#_subresourceoptions)
- [\_toSafeId](WebhookClient.md#_tosafeid)
- [\_update](WebhookClient.md#_update)
- [\_url](WebhookClient.md#_url)
- [\_waitForFinish](WebhookClient.md#_waitforfinish)
- [delete](WebhookClient.md#delete)
- [dispatches](WebhookClient.md#dispatches)
- [get](WebhookClient.md#get)
- [test](WebhookClient.md#test)
- [update](WebhookClient.md#update)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new WebhookClient**(`options`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `ApiClientSubResourceOptions` |

#### Overrides

ResourceClient.constructor

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
