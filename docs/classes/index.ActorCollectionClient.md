# Class: ActorCollectionClient

[index](../modules/index.md).ActorCollectionClient

## Hierarchy

- `ResourceCollectionClient`

  ↳ **`ActorCollectionClient`**

## Table of contents

### Properties

- [apifyClient](index.ActorCollectionClient.md#apifyclient)
- [baseUrl](index.ActorCollectionClient.md#baseurl)
- [httpClient](index.ActorCollectionClient.md#httpclient)
- [id](index.ActorCollectionClient.md#id)
- [params](index.ActorCollectionClient.md#params)
- [resourcePath](index.ActorCollectionClient.md#resourcepath)
- [safeId](index.ActorCollectionClient.md#safeid)
- [url](index.ActorCollectionClient.md#url)

### Methods

- [\_create](index.ActorCollectionClient.md#_create)
- [\_getOrCreate](index.ActorCollectionClient.md#_getorcreate)
- [\_list](index.ActorCollectionClient.md#_list)
- [\_params](index.ActorCollectionClient.md#_params)
- [\_subResourceOptions](index.ActorCollectionClient.md#_subresourceoptions)
- [\_toSafeId](index.ActorCollectionClient.md#_tosafeid)
- [\_url](index.ActorCollectionClient.md#_url)
- [create](index.ActorCollectionClient.md#create)
- [list](index.ActorCollectionClient.md#list)

## Properties

### <a id="apifyclient" name="apifyclient"></a> apifyClient

• **apifyClient**: [`ApifyClient`](index.ApifyClient.md)

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

▸ **create**(`actor`): `Promise`<[`Actor`](../interfaces/index.Actor.md)\>

https://docs.apify.com/api/v2#/reference/actors/actor-collection/create-actor

#### Parameters

| Name | Type |
| :------ | :------ |
| `actor` | [`ActorCollectionCreateOptions`](../interfaces/index.ActorCollectionCreateOptions.md) |

#### Returns

`Promise`<[`Actor`](../interfaces/index.Actor.md)\>

___

### <a id="list" name="list"></a> list

▸ **list**(`options?`): `Promise`<[`ActorCollectionListResult`](../modules/index.md#actorcollectionlistresult)\>

https://docs.apify.com/api/v2#/reference/actors/actor-collection/get-list-of-actors

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`ActorCollectionListOptions`](../interfaces/index.ActorCollectionListOptions.md) |

#### Returns

`Promise`<[`ActorCollectionListResult`](../modules/index.md#actorcollectionlistresult)\>
