# Class: ActorCollectionClient

## Hierarchy

- `ResourceCollectionClient`

  ↳ **`ActorCollectionClient`**

## Table of contents

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

- [create](ActorCollectionClient.md#create)
- [list](ActorCollectionClient.md#list)

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
