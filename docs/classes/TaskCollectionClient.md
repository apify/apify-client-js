# Class: TaskCollectionClient

## Hierarchy

- `ResourceCollectionClient`

  ↳ **`TaskCollectionClient`**

## Table of contents

### Properties

- [apifyClient](TaskCollectionClient.md#apifyclient)
- [baseUrl](TaskCollectionClient.md#baseurl)
- [httpClient](TaskCollectionClient.md#httpclient)
- [id](TaskCollectionClient.md#id)
- [params](TaskCollectionClient.md#params)
- [resourcePath](TaskCollectionClient.md#resourcepath)
- [safeId](TaskCollectionClient.md#safeid)
- [url](TaskCollectionClient.md#url)

### Methods

- [create](TaskCollectionClient.md#create)
- [list](TaskCollectionClient.md#list)

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

▸ **create**(`task`): `Promise`<[`Task`](../interfaces/Task.md)\>

https://docs.apify.com/api/v2#/reference/actor-tasks/task-collection/create-task

#### Parameters

| Name | Type |
| :------ | :------ |
| `task` | [`TaskCreateData`](../interfaces/TaskCreateData.md) |

#### Returns

`Promise`<[`Task`](../interfaces/Task.md)\>

___

### <a id="list" name="list"></a> list

▸ **list**(`options?`): `Promise`<[`PaginatedList`](../interfaces/PaginatedList.md)<[`TaskList`](../modules.md#tasklist)\>\>

https://docs.apify.com/api/v2#/reference/actor-tasks/task-collection/get-list-of-tasks

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`TaskCollectionListOptions`](../interfaces/TaskCollectionListOptions.md) |

#### Returns

`Promise`<[`PaginatedList`](../interfaces/PaginatedList.md)<[`TaskList`](../modules.md#tasklist)\>\>
