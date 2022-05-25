# Class: RequestQueueClient

## Hierarchy

- `ResourceClient`

  ↳ **`RequestQueueClient`**

## Table of contents

### Properties

- [apifyClient](RequestQueueClient.md#apifyclient)
- [baseUrl](RequestQueueClient.md#baseurl)
- [httpClient](RequestQueueClient.md#httpclient)
- [id](RequestQueueClient.md#id)
- [params](RequestQueueClient.md#params)
- [resourcePath](RequestQueueClient.md#resourcepath)
- [safeId](RequestQueueClient.md#safeid)
- [url](RequestQueueClient.md#url)

### Methods

- [addRequest](RequestQueueClient.md#addrequest)
- [delete](RequestQueueClient.md#delete)
- [deleteRequest](RequestQueueClient.md#deleterequest)
- [get](RequestQueueClient.md#get)
- [getRequest](RequestQueueClient.md#getrequest)
- [listHead](RequestQueueClient.md#listhead)
- [update](RequestQueueClient.md#update)
- [updateRequest](RequestQueueClient.md#updaterequest)

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

### <a id="addrequest" name="addrequest"></a> addRequest

▸ **addRequest**(`request`, `options?`): `Promise`<[`RequestQueueClientAddRequestResult`](../interfaces/RequestQueueClientAddRequestResult.md)\>

https://docs.apify.com/api/v2#/reference/request-queues/request-collection/add-request

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | `Omit`<[`RequestQueueClientRequestSchema`](../interfaces/RequestQueueClientRequestSchema.md), ``"id"``\> |
| `options` | [`RequestQueueClientAddRequestOptions`](../interfaces/RequestQueueClientAddRequestOptions.md) |

#### Returns

`Promise`<[`RequestQueueClientAddRequestResult`](../interfaces/RequestQueueClientAddRequestResult.md)\>

___

### <a id="delete" name="delete"></a> delete

▸ **delete**(): `Promise`<`void`\>

https://docs.apify.com/api/v2#/reference/request-queues/queue/delete-request-queue

#### Returns

`Promise`<`void`\>

___

### <a id="deleterequest" name="deleterequest"></a> deleteRequest

▸ **deleteRequest**(`id`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

`Promise`<`void`\>

___

### <a id="get" name="get"></a> get

▸ **get**(): `Promise`<`undefined` \| [`RequestQueue`](../interfaces/RequestQueue.md)\>

https://docs.apify.com/api/v2#/reference/request-queues/queue/get-request-queue

#### Returns

`Promise`<`undefined` \| [`RequestQueue`](../interfaces/RequestQueue.md)\>

___

### <a id="getrequest" name="getrequest"></a> getRequest

▸ **getRequest**(`id`): `Promise`<`undefined` \| [`RequestQueueClientGetRequestResult`](../modules.md#requestqueueclientgetrequestresult)\>

https://docs.apify.com/api/v2#/reference/request-queues/request/get-request

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

`Promise`<`undefined` \| [`RequestQueueClientGetRequestResult`](../modules.md#requestqueueclientgetrequestresult)\>

___

### <a id="listhead" name="listhead"></a> listHead

▸ **listHead**(`options?`): `Promise`<[`RequestQueueClientListHeadResult`](../interfaces/RequestQueueClientListHeadResult.md)\>

https://docs.apify.com/api/v2#/reference/request-queues/queue-head/get-head

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`RequestQueueClientListHeadOptions`](../interfaces/RequestQueueClientListHeadOptions.md) |

#### Returns

`Promise`<[`RequestQueueClientListHeadResult`](../interfaces/RequestQueueClientListHeadResult.md)\>

___

### <a id="update" name="update"></a> update

▸ **update**(`newFields`): `Promise`<[`RequestQueue`](../interfaces/RequestQueue.md)\>

https://docs.apify.com/api/v2#/reference/request-queues/queue/update-request-queue

#### Parameters

| Name | Type |
| :------ | :------ |
| `newFields` | [`RequestQueueClientUpdateOptions`](../interfaces/RequestQueueClientUpdateOptions.md) |

#### Returns

`Promise`<[`RequestQueue`](../interfaces/RequestQueue.md)\>

___

### <a id="updaterequest" name="updaterequest"></a> updateRequest

▸ **updateRequest**(`request`, `options?`): `Promise`<[`RequestQueueClientAddRequestResult`](../interfaces/RequestQueueClientAddRequestResult.md)\>

https://docs.apify.com/api/v2#/reference/request-queues/request/update-request

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`RequestQueueClientRequestSchema`](../interfaces/RequestQueueClientRequestSchema.md) |
| `options` | [`RequestQueueClientAddRequestOptions`](../interfaces/RequestQueueClientAddRequestOptions.md) |

#### Returns

`Promise`<[`RequestQueueClientAddRequestResult`](../interfaces/RequestQueueClientAddRequestResult.md)\>
