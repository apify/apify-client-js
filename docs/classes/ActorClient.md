# Class: ActorClient

## Hierarchy

- `ResourceClient`

  ↳ **`ActorClient`**

## Table of contents

### Properties

- [apifyClient](ActorClient.md#apifyclient)
- [baseUrl](ActorClient.md#baseurl)
- [httpClient](ActorClient.md#httpclient)
- [id](ActorClient.md#id)
- [params](ActorClient.md#params)
- [resourcePath](ActorClient.md#resourcepath)
- [safeId](ActorClient.md#safeid)
- [url](ActorClient.md#url)

### Methods

- [build](ActorClient.md#build)
- [builds](ActorClient.md#builds)
- [call](ActorClient.md#call)
- [delete](ActorClient.md#delete)
- [get](ActorClient.md#get)
- [lastRun](ActorClient.md#lastrun)
- [runs](ActorClient.md#runs)
- [start](ActorClient.md#start)
- [update](ActorClient.md#update)
- [version](ActorClient.md#version)
- [versions](ActorClient.md#versions)
- [webhooks](ActorClient.md#webhooks)

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

### <a id="build" name="build"></a> build

▸ **build**(`versionNumber`, `options?`): `Promise`<[`Build`](../interfaces/Build.md)\>

https://docs.apify.com/api/v2#/reference/actors/build-collection/build-actor

#### Parameters

| Name | Type |
| :------ | :------ |
| `versionNumber` | `string` |
| `options` | [`ActorBuildOptions`](../interfaces/ActorBuildOptions.md) |

#### Returns

`Promise`<[`Build`](../interfaces/Build.md)\>

___

### <a id="builds" name="builds"></a> builds

▸ **builds**(): [`BuildCollectionClient`](BuildCollectionClient.md)

https://docs.apify.com/api/v2#/reference/actors/build-collection

#### Returns

[`BuildCollectionClient`](BuildCollectionClient.md)

___

### <a id="call" name="call"></a> call

▸ **call**(`input?`, `options?`): `Promise`<[`ActorRun`](../interfaces/ActorRun.md)\>

Starts an actor and waits for it to finish before returning the Run object.
It waits indefinitely, unless the `waitSecs` option is provided.
https://docs.apify.com/api/v2#/reference/actors/run-collection/run-actor

#### Parameters

| Name | Type |
| :------ | :------ |
| `input?` | `unknown` |
| `options` | [`ActorStartOptions`](../interfaces/ActorStartOptions.md) |

#### Returns

`Promise`<[`ActorRun`](../interfaces/ActorRun.md)\>

___

### <a id="delete" name="delete"></a> delete

▸ **delete**(): `Promise`<`void`\>

https://docs.apify.com/api/v2#/reference/actors/actor-object/delete-actor

#### Returns

`Promise`<`void`\>

___

### <a id="get" name="get"></a> get

▸ **get**(): `Promise`<`undefined` \| [`Actor`](../interfaces/Actor.md)\>

https://docs.apify.com/api/v2#/reference/actors/actor-object/get-actor

#### Returns

`Promise`<`undefined` \| [`Actor`](../interfaces/Actor.md)\>

___

### <a id="lastrun" name="lastrun"></a> lastRun

▸ **lastRun**(`options?`): [`RunClient`](RunClient.md)

https://docs.apify.com/api/v2#/reference/actors/last-run-object-and-its-storages

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`ActorLastRunOptions`](../interfaces/ActorLastRunOptions.md) |

#### Returns

[`RunClient`](RunClient.md)

___

### <a id="runs" name="runs"></a> runs

▸ **runs**(): [`RunCollectionClient`](RunCollectionClient.md)

https://docs.apify.com/api/v2#/reference/actors/run-collection

#### Returns

[`RunCollectionClient`](RunCollectionClient.md)

___

### <a id="start" name="start"></a> start

▸ **start**(`input?`, `options?`): `Promise`<[`ActorRun`](../interfaces/ActorRun.md)\>

Starts an actor and immediately returns the Run object.
https://docs.apify.com/api/v2#/reference/actors/run-collection/run-actor

#### Parameters

| Name | Type |
| :------ | :------ |
| `input?` | `unknown` |
| `options` | [`ActorStartOptions`](../interfaces/ActorStartOptions.md) |

#### Returns

`Promise`<[`ActorRun`](../interfaces/ActorRun.md)\>

___

### <a id="update" name="update"></a> update

▸ **update**(`newFields`): `Promise`<[`Actor`](../interfaces/Actor.md)\>

https://docs.apify.com/api/v2#/reference/actors/actor-object/update-actor

#### Parameters

| Name | Type |
| :------ | :------ |
| `newFields` | [`ActorUpdateOptions`](../modules.md#actorupdateoptions) |

#### Returns

`Promise`<[`Actor`](../interfaces/Actor.md)\>

___

### <a id="version" name="version"></a> version

▸ **version**(`versionNumber`): `ActorVersionClient`

https://docs.apify.com/api/v2#/reference/actors/version-object

#### Parameters

| Name | Type |
| :------ | :------ |
| `versionNumber` | `string` |

#### Returns

`ActorVersionClient`

___

### <a id="versions" name="versions"></a> versions

▸ **versions**(): `ActorVersionCollectionClient`

https://docs.apify.com/api/v2#/reference/actors/version-collection

#### Returns

`ActorVersionCollectionClient`

___

### <a id="webhooks" name="webhooks"></a> webhooks

▸ **webhooks**(): [`WebhookCollectionClient`](WebhookCollectionClient.md)

https://docs.apify.com/api/v2#/reference/actors/webhook-collection

#### Returns

[`WebhookCollectionClient`](WebhookCollectionClient.md)
