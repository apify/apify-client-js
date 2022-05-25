# Class: RequestQueueClient

**`hideconstructor`**

## Hierarchy

- `ResourceClient`

  ↳ **`RequestQueueClient`**

## Table of contents

### Constructors

- [constructor](RequestQueueClient.md#constructor)

### Properties

- [apifyClient](RequestQueueClient.md#apifyclient)
- [baseUrl](RequestQueueClient.md#baseurl)
- [clientKey](RequestQueueClient.md#clientkey)
- [httpClient](RequestQueueClient.md#httpclient)
- [id](RequestQueueClient.md#id)
- [params](RequestQueueClient.md#params)
- [resourcePath](RequestQueueClient.md#resourcepath)
- [safeId](RequestQueueClient.md#safeid)
- [timeoutMillis](RequestQueueClient.md#timeoutmillis)
- [url](RequestQueueClient.md#url)

### Methods

- [\_batchAddRequests](RequestQueueClient.md#_batchaddrequests)
- [\_batchAddRequestsWithRetries](RequestQueueClient.md#_batchaddrequestswithretries)
- [\_delete](RequestQueueClient.md#_delete)
- [\_get](RequestQueueClient.md#_get)
- [\_params](RequestQueueClient.md#_params)
- [\_subResourceOptions](RequestQueueClient.md#_subresourceoptions)
- [\_toSafeId](RequestQueueClient.md#_tosafeid)
- [\_update](RequestQueueClient.md#_update)
- [\_url](RequestQueueClient.md#_url)
- [\_waitForFinish](RequestQueueClient.md#_waitforfinish)
- [addRequest](RequestQueueClient.md#addrequest)
- [batchAddRequests](RequestQueueClient.md#batchaddrequests)
- [batchDeleteRequests](RequestQueueClient.md#batchdeleterequests)
- [delete](RequestQueueClient.md#delete)
- [deleteRequest](RequestQueueClient.md#deleterequest)
- [deleteRequestLock](RequestQueueClient.md#deleterequestlock)
- [get](RequestQueueClient.md#get)
- [getRequest](RequestQueueClient.md#getrequest)
- [listAndLockHead](RequestQueueClient.md#listandlockhead)
- [listHead](RequestQueueClient.md#listhead)
- [prolongRequestLock](RequestQueueClient.md#prolongrequestlock)
- [update](RequestQueueClient.md#update)
- [updateRequest](RequestQueueClient.md#updaterequest)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new RequestQueueClient**(`options`, `userOptions?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `ApiClientSubResourceOptions` |
| `userOptions` | [`RequestQueueUserOptions`](../interfaces/RequestQueueUserOptions.md) |

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

▸ `Private` **_batchAddRequests**(`requests`, `options?`): `Promise`<[`RequestQueueClientBatchRequestsOperationResult`](../interfaces/RequestQueueClientBatchRequestsOperationResult.md)\>

Writes requests to request queue in batch.
THIS METHOD IS EXPERIMENTAL AND NOT INTENDED FOR PRODUCTION USE.

**`experimental`**

#### Parameters

| Name | Type |
| :------ | :------ |
| `requests` | `Omit`<[`RequestQueueClientRequestSchema`](../interfaces/RequestQueueClientRequestSchema.md), ``"id"``\>[] |
| `options` | [`RequestQueueClientAddRequestOptions`](../interfaces/RequestQueueClientAddRequestOptions.md) |

#### Returns

`Promise`<[`RequestQueueClientBatchRequestsOperationResult`](../interfaces/RequestQueueClientBatchRequestsOperationResult.md)\>

___

### <a id="_batchaddrequestswithretries" name="_batchaddrequestswithretries"></a> \_batchAddRequestsWithRetries

▸ `Protected` **_batchAddRequestsWithRetries**(`requests`, `options?`): `Promise`<[`RequestQueueClientBatchRequestsOperationResult`](../interfaces/RequestQueueClientBatchRequestsOperationResult.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `requests` | `Omit`<[`RequestQueueClientRequestSchema`](../interfaces/RequestQueueClientRequestSchema.md), ``"id"``\>[] |
| `options` | [`RequestQueueClientBatchAddRequestWithRetriesOptions`](../interfaces/RequestQueueClientBatchAddRequestWithRetriesOptions.md) |

#### Returns

`Promise`<[`RequestQueueClientBatchRequestsOperationResult`](../interfaces/RequestQueueClientBatchRequestsOperationResult.md)\>

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

### <a id="batchaddrequests" name="batchaddrequests"></a> batchAddRequests

▸ `Private` **batchAddRequests**(`requests`, `options?`): `Promise`<[`RequestQueueClientBatchRequestsOperationResult`](../interfaces/RequestQueueClientBatchRequestsOperationResult.md)\>

Writes multiple requests to request queue concurrently in batch with retries.
THIS METHOD IS EXPERIMENTAL AND NOT INTENDED FOR PRODUCTION USE.

**`experimental`**

#### Parameters

| Name | Type |
| :------ | :------ |
| `requests` | `Omit`<[`RequestQueueClientRequestSchema`](../interfaces/RequestQueueClientRequestSchema.md), ``"id"``\>[] |
| `options` | [`RequestQueueClientBatchAddRequestWithRetriesOptions`](../interfaces/RequestQueueClientBatchAddRequestWithRetriesOptions.md) |

#### Returns

`Promise`<[`RequestQueueClientBatchRequestsOperationResult`](../interfaces/RequestQueueClientBatchRequestsOperationResult.md)\>

___

### <a id="batchdeleterequests" name="batchdeleterequests"></a> batchDeleteRequests

▸ `Private` **batchDeleteRequests**(`requests`): `Promise`<[`RequestQueueClientBatchRequestsOperationResult`](../interfaces/RequestQueueClientBatchRequestsOperationResult.md)\>

Deletes requests from request queue in batch.
THIS METHOD IS EXPERIMENTAL AND NOT INTENDED FOR PRODUCTION USE.
TODO: Make retryable and parallelize

**`experimental`**

#### Parameters

| Name | Type |
| :------ | :------ |
| `requests` | [`RequestQueueClientRequestToDelete`](../modules.md#requestqueueclientrequesttodelete)[] |

#### Returns

`Promise`<[`RequestQueueClientBatchRequestsOperationResult`](../interfaces/RequestQueueClientBatchRequestsOperationResult.md)\>

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
| `options` | [`RequestQueueClientDeleteRequestLockOptions`](../interfaces/RequestQueueClientDeleteRequestLockOptions.md) |

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

### <a id="listandlockhead" name="listandlockhead"></a> listAndLockHead

▸ `Private` **listAndLockHead**(`options`): `Promise`<[`RequestQueueClientListAndLockHeadResult`](../interfaces/RequestQueueClientListAndLockHeadResult.md)\>

Get requests from queue head and lock them.
THIS METHOD IS EXPERIMENTAL AND NOT INTENDED FOR PRODUCTION USE.

**`experimental`**

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`RequestQueueClientListAndLockHeadOptions`](../interfaces/RequestQueueClientListAndLockHeadOptions.md) |

#### Returns

`Promise`<[`RequestQueueClientListAndLockHeadResult`](../interfaces/RequestQueueClientListAndLockHeadResult.md)\>

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

### <a id="prolongrequestlock" name="prolongrequestlock"></a> prolongRequestLock

▸ `Private` **prolongRequestLock**(`id`, `options`): `Promise`<[`RequestQueueClientProlongRequestLockResult`](../interfaces/RequestQueueClientProlongRequestLockResult.md)\>

THIS METHOD IS EXPERIMENTAL AND NOT INTENDED FOR PRODUCTION USE.

**`experimental`**

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` |
| `options` | [`RequestQueueClientProlongRequestLockOptions`](../interfaces/RequestQueueClientProlongRequestLockOptions.md) |

#### Returns

`Promise`<[`RequestQueueClientProlongRequestLockResult`](../interfaces/RequestQueueClientProlongRequestLockResult.md)\>

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
