# Class: RunCollectionClient

## Hierarchy

- `ResourceCollectionClient`

  ↳ **`RunCollectionClient`**

## Table of contents

### Properties

- [apifyClient](RunCollectionClient.md#apifyclient)
- [baseUrl](RunCollectionClient.md#baseurl)
- [httpClient](RunCollectionClient.md#httpclient)
- [id](RunCollectionClient.md#id)
- [params](RunCollectionClient.md#params)
- [resourcePath](RunCollectionClient.md#resourcepath)
- [safeId](RunCollectionClient.md#safeid)
- [url](RunCollectionClient.md#url)

### Methods

- [\_create](RunCollectionClient.md#_create)
- [\_getOrCreate](RunCollectionClient.md#_getorcreate)
- [\_list](RunCollectionClient.md#_list)
- [\_params](RunCollectionClient.md#_params)
- [\_subResourceOptions](RunCollectionClient.md#_subresourceoptions)
- [\_toSafeId](RunCollectionClient.md#_tosafeid)
- [\_url](RunCollectionClient.md#_url)
- [list](RunCollectionClient.md#list)

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

### <a id="list" name="list"></a> list

▸ **list**(`options?`): `Promise`<[`PaginatedList`](../interfaces/PaginatedList.md)<[`ActorRun`](../interfaces/ActorRun.md)\>\>

https://docs.apify.com/api/v2#/reference/actors/run-collection/get-list-of-runs

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`RunCollectionListOptions`](../interfaces/RunCollectionListOptions.md) |

#### Returns

`Promise`<[`PaginatedList`](../interfaces/PaginatedList.md)<[`ActorRun`](../interfaces/ActorRun.md)\>\>
