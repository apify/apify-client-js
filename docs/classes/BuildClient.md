# Class: BuildClient

## Hierarchy

- `ResourceClient`

  ↳ **`BuildClient`**

## Table of contents

### Properties

- [apifyClient](BuildClient.md#apifyclient)
- [baseUrl](BuildClient.md#baseurl)
- [httpClient](BuildClient.md#httpclient)
- [id](BuildClient.md#id)
- [params](BuildClient.md#params)
- [resourcePath](BuildClient.md#resourcepath)
- [safeId](BuildClient.md#safeid)
- [url](BuildClient.md#url)

### Methods

- [abort](BuildClient.md#abort)
- [get](BuildClient.md#get)
- [waitForFinish](BuildClient.md#waitforfinish)

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

### <a id="abort" name="abort"></a> abort

▸ **abort**(): `Promise`<[`Build`](../interfaces/Build.md)\>

https://docs.apify.com/api/v2#/reference/actor-builds/abort-build/abort-build

#### Returns

`Promise`<[`Build`](../interfaces/Build.md)\>

___

### <a id="get" name="get"></a> get

▸ **get**(`options?`): `Promise`<`undefined` \| [`Build`](../interfaces/Build.md)\>

https://docs.apify.com/api/v2#/reference/actor-builds/build-object/get-build

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`BuildClientGetOptions`](../interfaces/BuildClientGetOptions.md) |

#### Returns

`Promise`<`undefined` \| [`Build`](../interfaces/Build.md)\>

___

### <a id="waitforfinish" name="waitforfinish"></a> waitForFinish

▸ **waitForFinish**(`options?`): `Promise`<[`Build`](../interfaces/Build.md)\>

Returns a promise that resolves with the finished Build object when the provided actor build finishes
or with the unfinished Build object when the `waitSecs` timeout lapses. The promise is NOT rejected
based on run status. You can inspect the `status` property of the Build object to find out its status.

The difference between this function and the `waitForFinish` parameter of the `get` method
is the fact that this function can wait indefinitely. Its use is preferable to the
`waitForFinish` parameter alone, which it uses internally.

This is useful when you need to immediately start a run after a build finishes.

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`BuildClientWaitForFinishOptions`](../interfaces/BuildClientWaitForFinishOptions.md) |

#### Returns

`Promise`<[`Build`](../interfaces/Build.md)\>
