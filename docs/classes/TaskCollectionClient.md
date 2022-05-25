# Class: TaskCollectionClient

**`hideconstructor`**

## Hierarchy

- `ResourceCollectionClient`

  ↳ **`TaskCollectionClient`**

## Table of contents

### Constructors

- [constructor](TaskCollectionClient.md#constructor)

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

- [\_create](TaskCollectionClient.md#_create)
- [\_getOrCreate](TaskCollectionClient.md#_getorcreate)
- [\_list](TaskCollectionClient.md#_list)
- [\_params](TaskCollectionClient.md#_params)
- [\_subResourceOptions](TaskCollectionClient.md#_subresourceoptions)
- [\_toSafeId](TaskCollectionClient.md#_tosafeid)
- [\_url](TaskCollectionClient.md#_url)
- [create](TaskCollectionClient.md#create)
- [list](TaskCollectionClient.md#list)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new TaskCollectionClient**(`options`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `ApiClientSubResourceOptions` |

#### Overrides

ResourceCollectionClient.constructor

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

### <a id="_create" name="_create"></a> \_create

▸ `Protected` **_create**<`D`, `R`\>(`resource`): `Promise`<`R`\>

#### Type parameters

| Name |
| :------ |
| `D` |
| `R` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `resource` | `D` |

#### Returns

`Promise`<`R`\>

#### Inherited from

ResourceCollectionClient.\_create

___

### <a id="_getorcreate" name="_getorcreate"></a> \_getOrCreate

▸ `Protected` **_getOrCreate**<`D`, `R`\>(`name?`, `resource?`): `Promise`<`R`\>

#### Type parameters

| Name |
| :------ |
| `D` |
| `R` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `name?` | `string` |
| `resource?` | `D` |

#### Returns

`Promise`<`R`\>

#### Inherited from

ResourceCollectionClient.\_getOrCreate

___

### <a id="_list" name="_list"></a> \_list

▸ `Private` **_list**<`T`, `R`\>(`options?`): `Promise`<`R`\>

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

`Promise`<`R`\>

#### Inherited from

ResourceCollectionClient.\_list

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

ResourceCollectionClient.\_params

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

ResourceCollectionClient.\_subResourceOptions

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

ResourceCollectionClient.\_toSafeId

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

ResourceCollectionClient.\_url

___

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
