# Class: RequestQueueClient

[index](../modules/index.md).RequestQueueClient

## Hierarchy

- `ResourceClient`

  ↳ **`RequestQueueClient`**

## Table of contents

### Properties

- [apifyClient](index.RequestQueueClient.md#apifyclient)
- [baseUrl](index.RequestQueueClient.md#baseurl)
- [clientKey](index.RequestQueueClient.md#clientkey)
- [httpClient](index.RequestQueueClient.md#httpclient)
- [id](index.RequestQueueClient.md#id)
- [params](index.RequestQueueClient.md#params)
- [resourcePath](index.RequestQueueClient.md#resourcepath)
- [safeId](index.RequestQueueClient.md#safeid)
- [timeoutMillis](index.RequestQueueClient.md#timeoutmillis)
- [url](index.RequestQueueClient.md#url)

### Methods

- [\_batchAddRequests](index.RequestQueueClient.md#_batchaddrequests)
- [\_batchAddRequestsWithRetries](index.RequestQueueClient.md#_batchaddrequestswithretries)
- [\_delete](index.RequestQueueClient.md#_delete)
- [\_get](index.RequestQueueClient.md#_get)
- [\_params](index.RequestQueueClient.md#_params)
- [\_subResourceOptions](index.RequestQueueClient.md#_subresourceoptions)
- [\_toSafeId](index.RequestQueueClient.md#_tosafeid)
- [\_update](index.RequestQueueClient.md#_update)
- [\_url](index.RequestQueueClient.md#_url)
- [\_waitForFinish](index.RequestQueueClient.md#_waitforfinish)
- [addRequest](index.RequestQueueClient.md#addrequest)
- [batchAddRequests](index.RequestQueueClient.md#batchaddrequests)
- [batchDeleteRequests](index.RequestQueueClient.md#batchdeleterequests)
- [delete](index.RequestQueueClient.md#delete)
- [deleteRequest](index.RequestQueueClient.md#deleterequest)
- [deleteRequestLock](index.RequestQueueClient.md#deleterequestlock)
- [get](index.RequestQueueClient.md#get)
- [getRequest](index.RequestQueueClient.md#getrequest)
- [listAndLockHead](index.RequestQueueClient.md#listandlockhead)
- [listHead](index.RequestQueueClient.md#listhead)
- [prolongRequestLock](index.RequestQueueClient.md#prolongrequestlock)
- [update](index.RequestQueueClient.md#update)
- [updateRequest](index.RequestQueueClient.md#updaterequest)

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

### <a id="clientkey" name="clientkey"></a> clientKey

• `Private` `Optional` **clientKey**: `string`

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

### <a id="timeoutmillis" name="timeoutmillis"></a> timeoutMillis

• `Private` `Optional` **timeoutMillis**: `number`

___

### <a id="url" name="url"></a> url

• **url**: `string`

#### Inherited from

ResourceClient.url

## Methods

### <a id="_batchaddrequests" name="_batchaddrequests"></a> \_batchAddRequests

▸ `Private` **_batchAddRequests**(`requests`, `options?`): `Promise`<[`RequestQueueClientBatchRequestsOperationResult`](../interfaces/index.RequestQueueClientBatchRequestsOperationResult.md)\>

Writes requests to request queue in batch.
THIS METHOD IS EXPERIMENTAL AND NOT INTENDED FOR PRODUCTION USE.

**`experimental`**

#### Parameters

| Name | Type |
| :------ | :------ |
| `requests` | `Omit`<[`RequestQueueClientRequestSchema`](../interfaces/index.RequestQueueClientRequestSchema.md), ``"id"``\>[] |
| `options` | [`RequestQueueClientAddRequestOptions`](../interfaces/index.RequestQueueClientAddRequestOptions.md) |

#### Returns

`Promise`<[`RequestQueueClientBatchRequestsOperationResult`](../interfaces/index.RequestQueueClientBatchRequestsOperationResult.md)\>

___

### <a id="_batchaddrequestswithretries" name="_batchaddrequestswithretries"></a> \_batchAddRequestsWithRetries

▸ `Protected` **_batchAddRequestsWithRetries**(`requests`, `options?`): `Promise`<[`RequestQueueClientBatchRequestsOperationResult`](../interfaces/index.RequestQueueClientBatchRequestsOperationResult.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `requests` | `Omit`<[`RequestQueueClientRequestSchema`](../interfaces/index.RequestQueueClientRequestSchema.md), ``"id"``\>[] |
| `options` | [`RequestQueueClientBatchAddRequestWithRetriesOptions`](../interfaces/index.RequestQueueClientBatchAddRequestWithRetriesOptions.md) |

#### Returns

`Promise`<[`RequestQueueClientBatchRequestsOperationResult`](../interfaces/index.RequestQueueClientBatchRequestsOperationResult.md)\>

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

### <a id="addrequest" name="addrequest"></a> addRequest

▸ **addRequest**(`request`, `options?`): `Promise`<[`RequestQueueClientAddRequestResult`](../interfaces/index.RequestQueueClientAddRequestResult.md)\>

https://docs.apify.com/api/v2#/reference/request-queues/request-collection/add-request

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | `Omit`<[`RequestQueueClientRequestSchema`](../interfaces/index.RequestQueueClientRequestSchema.md), ``"id"``\> |
| `options` | [`RequestQueueClientAddRequestOptions`](../interfaces/index.RequestQueueClientAddRequestOptions.md) |

#### Returns

`Promise`<[`RequestQueueClientAddRequestResult`](../interfaces/index.RequestQueueClientAddRequestResult.md)\>

___

### <a id="batchaddrequests" name="batchaddrequests"></a> batchAddRequests

▸ `Private` **batchAddRequests**(`requests`, `options?`): `Promise`<[`RequestQueueClientBatchRequestsOperationResult`](../interfaces/index.RequestQueueClientBatchRequestsOperationResult.md)\>

Writes multiple requests to request queue concurrently in batch with retries.
THIS METHOD IS EXPERIMENTAL AND NOT INTENDED FOR PRODUCTION USE.

**`experimental`**

#### Parameters

| Name | Type |
| :------ | :------ |
| `requests` | `Omit`<[`RequestQueueClientRequestSchema`](../interfaces/index.RequestQueueClientRequestSchema.md), ``"id"``\>[] |
| `options` | [`RequestQueueClientBatchAddRequestWithRetriesOptions`](../interfaces/index.RequestQueueClientBatchAddRequestWithRetriesOptions.md) |

#### Returns

`Promise`<[`RequestQueueClientBatchRequestsOperationResult`](../interfaces/index.RequestQueueClientBatchRequestsOperationResult.md)\>

___

### <a id="batchdeleterequests" name="batchdeleterequests"></a> batchDeleteRequests

▸ `Private` **batchDeleteRequests**(`requests`): `Promise`<[`RequestQueueClientBatchRequestsOperationResult`](../interfaces/index.RequestQueueClientBatchRequestsOperationResult.md)\>

Deletes requests from request queue in batch.
THIS METHOD IS EXPERIMENTAL AND NOT INTENDED FOR PRODUCTION USE.
TODO: Make retryable and parallelize

**`experimental`**

#### Parameters

| Name | Type |
| :------ | :------ |
| `requests` | [`RequestQueueClientRequestToDelete`](../modules/index.md#requestqueueclientrequesttodelete)[] |

#### Returns

`Promise`<[`RequestQueueClientBatchRequestsOperationResult`](../interfaces/index.RequestQueueClientBatchRequestsOperationResult.md)\>

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

### <a id="deleterequestlock" name="deleterequestlock"></a> deleteRequestLock

▸ `Private` **deleteRequestLock**(`id`, `options?`): `Promise`<`void`\>

THIS METHOD IS EXPERIMENTAL AND NOT INTENDED FOR PRODUCTION USE.

**`experimental`**

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |
| `options` | [`RequestQueueClientDeleteRequestLockOptions`](../interfaces/index.RequestQueueClientDeleteRequestLockOptions.md) |

#### Returns

`Promise`<`void`\>

___

### <a id="get" name="get"></a> get

▸ **get**(): `Promise`<`undefined` \| [`RequestQueue`](../interfaces/index.RequestQueue.md)\>

https://docs.apify.com/api/v2#/reference/request-queues/queue/get-request-queue

#### Returns

`Promise`<`undefined` \| [`RequestQueue`](../interfaces/index.RequestQueue.md)\>

___

### <a id="getrequest" name="getrequest"></a> getRequest

▸ **getRequest**(`id`): `Promise`<`undefined` \| [`RequestQueueClientGetRequestResult`](../modules/index.md#requestqueueclientgetrequestresult)\>

https://docs.apify.com/api/v2#/reference/request-queues/request/get-request

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |

#### Returns

`Promise`<`undefined` \| [`RequestQueueClientGetRequestResult`](../modules/index.md#requestqueueclientgetrequestresult)\>

___

### <a id="listandlockhead" name="listandlockhead"></a> listAndLockHead

▸ `Private` **listAndLockHead**(`options`): `Promise`<[`RequestQueueClientListAndLockHeadResult`](../interfaces/index.RequestQueueClientListAndLockHeadResult.md)\>

Get requests from queue head and lock them.
THIS METHOD IS EXPERIMENTAL AND NOT INTENDED FOR PRODUCTION USE.

**`experimental`**

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`RequestQueueClientListAndLockHeadOptions`](../interfaces/index.RequestQueueClientListAndLockHeadOptions.md) |

#### Returns

`Promise`<[`RequestQueueClientListAndLockHeadResult`](../interfaces/index.RequestQueueClientListAndLockHeadResult.md)\>

___

### <a id="listhead" name="listhead"></a> listHead

▸ **listHead**(`options?`): `Promise`<[`RequestQueueClientListHeadResult`](../interfaces/index.RequestQueueClientListHeadResult.md)\>

https://docs.apify.com/api/v2#/reference/request-queues/queue-head/get-head

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`RequestQueueClientListHeadOptions`](../interfaces/index.RequestQueueClientListHeadOptions.md) |

#### Returns

`Promise`<[`RequestQueueClientListHeadResult`](../interfaces/index.RequestQueueClientListHeadResult.md)\>

___

### <a id="prolongrequestlock" name="prolongrequestlock"></a> prolongRequestLock

▸ `Private` **prolongRequestLock**(`id`, `options`): `Promise`<[`RequestQueueClientProlongRequestLockResult`](../interfaces/index.RequestQueueClientProlongRequestLockResult.md)\>

THIS METHOD IS EXPERIMENTAL AND NOT INTENDED FOR PRODUCTION USE.

**`experimental`**

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |
| `options` | [`RequestQueueClientProlongRequestLockOptions`](../interfaces/index.RequestQueueClientProlongRequestLockOptions.md) |

#### Returns

`Promise`<[`RequestQueueClientProlongRequestLockResult`](../interfaces/index.RequestQueueClientProlongRequestLockResult.md)\>

___

### <a id="update" name="update"></a> update

▸ **update**(`newFields`): `Promise`<[`RequestQueue`](../interfaces/index.RequestQueue.md)\>

https://docs.apify.com/api/v2#/reference/request-queues/queue/update-request-queue

#### Parameters

| Name | Type |
| :------ | :------ |
| `newFields` | [`RequestQueueClientUpdateOptions`](../interfaces/index.RequestQueueClientUpdateOptions.md) |

#### Returns

`Promise`<[`RequestQueue`](../interfaces/index.RequestQueue.md)\>

___

### <a id="updaterequest" name="updaterequest"></a> updateRequest

▸ **updateRequest**(`request`, `options?`): `Promise`<[`RequestQueueClientAddRequestResult`](../interfaces/index.RequestQueueClientAddRequestResult.md)\>

https://docs.apify.com/api/v2#/reference/request-queues/request/update-request

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`RequestQueueClientRequestSchema`](../interfaces/index.RequestQueueClientRequestSchema.md) |
| `options` | [`RequestQueueClientAddRequestOptions`](../interfaces/index.RequestQueueClientAddRequestOptions.md) |

#### Returns

`Promise`<[`RequestQueueClientAddRequestResult`](../interfaces/index.RequestQueueClientAddRequestResult.md)\>
