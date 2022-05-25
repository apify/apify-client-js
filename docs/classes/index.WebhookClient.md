# Class: WebhookClient

[index](../modules/index.md).WebhookClient

## Hierarchy

- `ResourceClient`

  ↳ **`WebhookClient`**

## Table of contents

### Properties

- [apifyClient](index.WebhookClient.md#apifyclient)
- [baseUrl](index.WebhookClient.md#baseurl)
- [httpClient](index.WebhookClient.md#httpclient)
- [id](index.WebhookClient.md#id)
- [params](index.WebhookClient.md#params)
- [resourcePath](index.WebhookClient.md#resourcepath)
- [safeId](index.WebhookClient.md#safeid)
- [url](index.WebhookClient.md#url)

### Methods

- [\_delete](index.WebhookClient.md#_delete)
- [\_get](index.WebhookClient.md#_get)
- [\_params](index.WebhookClient.md#_params)
- [\_subResourceOptions](index.WebhookClient.md#_subresourceoptions)
- [\_toSafeId](index.WebhookClient.md#_tosafeid)
- [\_update](index.WebhookClient.md#_update)
- [\_url](index.WebhookClient.md#_url)
- [\_waitForFinish](index.WebhookClient.md#_waitforfinish)
- [delete](index.WebhookClient.md#delete)
- [dispatches](index.WebhookClient.md#dispatches)
- [get](index.WebhookClient.md#get)
- [test](index.WebhookClient.md#test)
- [update](index.WebhookClient.md#update)

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

https://docs.apify.com/api/v2#/reference/webhooks/webhook-object/delete-webhook

#### Returns

`Promise`<`void`\>

___

### <a id="dispatches" name="dispatches"></a> dispatches

▸ **dispatches**(): [`WebhookDispatchCollectionClient`](index.WebhookDispatchCollectionClient.md)

https://docs.apify.com/api/v2#/reference/webhooks/dispatches-collection

#### Returns

[`WebhookDispatchCollectionClient`](index.WebhookDispatchCollectionClient.md)

___

### <a id="get" name="get"></a> get

▸ **get**(): `Promise`<`undefined` \| [`Webhook`](../interfaces/index.Webhook.md)\>

https://docs.apify.com/api/v2#/reference/webhooks/webhook-object/get-webhook

#### Returns

`Promise`<`undefined` \| [`Webhook`](../interfaces/index.Webhook.md)\>

___

### <a id="test" name="test"></a> test

▸ **test**(): `Promise`<`undefined` \| [`WebhookDispatch`](../interfaces/index.WebhookDispatch.md)\>

https://docs.apify.com/api/v2#/reference/webhooks/webhook-test/test-webhook

#### Returns

`Promise`<`undefined` \| [`WebhookDispatch`](../interfaces/index.WebhookDispatch.md)\>

___

### <a id="update" name="update"></a> update

▸ **update**(`newFields`): `Promise`<[`Webhook`](../interfaces/index.Webhook.md)\>

https://docs.apify.com/api/v2#/reference/webhooks/webhook-object/update-webhook

#### Parameters

| Name | Type |
| :------ | :------ |
| `newFields` | [`WebhookUpdateData`](../modules/index.md#webhookupdatedata) |

#### Returns

`Promise`<[`Webhook`](../interfaces/index.Webhook.md)\>
