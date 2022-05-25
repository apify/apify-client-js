# Class: LogClient

## Hierarchy

- `ResourceClient`

  ↳ **`LogClient`**

## Table of contents

### Properties

- [apifyClient](LogClient.md#apifyclient)
- [baseUrl](LogClient.md#baseurl)
- [httpClient](LogClient.md#httpclient)
- [id](LogClient.md#id)
- [params](LogClient.md#params)
- [resourcePath](LogClient.md#resourcepath)
- [safeId](LogClient.md#safeid)
- [url](LogClient.md#url)

### Methods

- [get](LogClient.md#get)
- [stream](LogClient.md#stream)

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

### <a id="get" name="get"></a> get

▸ **get**(): `Promise`<`undefined` \| `string`\>

https://docs.apify.com/api/v2#/reference/logs/log/get-log

#### Returns

`Promise`<`undefined` \| `string`\>

___

### <a id="stream" name="stream"></a> stream

▸ **stream**(): `Promise`<`undefined` \| `ReadableStream`<`any`\>\>

Gets the log in a Readable stream format. Only works in Node.js.
https://docs.apify.com/api/v2#/reference/logs/log/get-log

#### Returns

`Promise`<`undefined` \| `ReadableStream`<`any`\>\>
