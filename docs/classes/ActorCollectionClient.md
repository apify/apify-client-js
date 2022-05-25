# Class: ActorCollectionClient

**`hideconstructor`**

## Hierarchy

- `ResourceCollectionClient`

  ↳ **`ActorCollectionClient`**

## Table of contents

### Constructors

- [constructor](ActorCollectionClient.md#constructor)

### Properties

- [apifyClient](ActorCollectionClient.md#apifyclient)
- [baseUrl](ActorCollectionClient.md#baseurl)
- [httpClient](ActorCollectionClient.md#httpclient)
- [id](ActorCollectionClient.md#id)
- [params](ActorCollectionClient.md#params)
- [resourcePath](ActorCollectionClient.md#resourcepath)
- [safeId](ActorCollectionClient.md#safeid)
- [url](ActorCollectionClient.md#url)

### Methods

- [\_create](ActorCollectionClient.md#_create)
- [\_getOrCreate](ActorCollectionClient.md#_getorcreate)
- [\_list](ActorCollectionClient.md#_list)
- [\_params](ActorCollectionClient.md#_params)
- [\_subResourceOptions](ActorCollectionClient.md#_subresourceoptions)
- [\_toSafeId](ActorCollectionClient.md#_tosafeid)
- [\_url](ActorCollectionClient.md#_url)
- [create](ActorCollectionClient.md#create)
- [list](ActorCollectionClient.md#list)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new ActorCollectionClient**(`options`)

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

▸ **create**(`actor`): `Promise`<[`Actor`](../interfaces/Actor.md)\>

https://docs.apify.com/api/v2#/reference/actors/actor-collection/create-actor

#### Parameters

| Name | Type |
| :------ | :------ |
| `actor` | [`ActorCollectionCreateOptions`](../interfaces/ActorCollectionCreateOptions.md) |

#### Returns

`Promise`<[`Actor`](../interfaces/Actor.md)\>

___

### <a id="list" name="list"></a> list

▸ **list**(`options?`): `Promise`<[`ActorCollectionListResult`](../modules.md#actorcollectionlistresult)\>

https://docs.apify.com/api/v2#/reference/actors/actor-collection/get-list-of-actors

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`ActorCollectionListOptions`](../interfaces/ActorCollectionListOptions.md) |

#### Returns

`Promise`<[`ActorCollectionListResult`](../modules.md#actorcollectionlistresult)\>
