# Class: BuildCollectionClient

**`hideconstructor`**

## Hierarchy

- `ResourceCollectionClient`

  ↳ **`BuildCollectionClient`**

## Table of contents

### Constructors

- [constructor](BuildCollectionClient.md#constructor)

### Properties

- [apifyClient](BuildCollectionClient.md#apifyclient)
- [baseUrl](BuildCollectionClient.md#baseurl)
- [httpClient](BuildCollectionClient.md#httpclient)
- [id](BuildCollectionClient.md#id)
- [params](BuildCollectionClient.md#params)
- [resourcePath](BuildCollectionClient.md#resourcepath)
- [safeId](BuildCollectionClient.md#safeid)
- [url](BuildCollectionClient.md#url)

### Methods

- [\_create](BuildCollectionClient.md#_create)
- [\_getOrCreate](BuildCollectionClient.md#_getorcreate)
- [\_list](BuildCollectionClient.md#_list)
- [\_params](BuildCollectionClient.md#_params)
- [\_subResourceOptions](BuildCollectionClient.md#_subresourceoptions)
- [\_toSafeId](BuildCollectionClient.md#_tosafeid)
- [\_url](BuildCollectionClient.md#_url)
- [list](BuildCollectionClient.md#list)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new BuildCollectionClient**(`options`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `ApiClientOptions` |

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

### <a id="list" name="list"></a> list

▸ **list**(`options?`): `Promise`<[`BuildCollectionClientListResult`](../modules.md#buildcollectionclientlistresult)\>

https://docs.apify.com/api/v2#/reference/actors/build-collection/get-list-of-builds

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`BuildCollectionClientListOptions`](../interfaces/BuildCollectionClientListOptions.md) |

#### Returns

`Promise`<[`BuildCollectionClientListResult`](../modules.md#buildcollectionclientlistresult)\>
