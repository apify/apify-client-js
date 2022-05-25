# Class: UserClient

## Hierarchy

- `ResourceClient`

  ↳ **`UserClient`**

## Table of contents

### Properties

- [apifyClient](UserClient.md#apifyclient)
- [baseUrl](UserClient.md#baseurl)
- [httpClient](UserClient.md#httpclient)
- [id](UserClient.md#id)
- [params](UserClient.md#params)
- [resourcePath](UserClient.md#resourcepath)
- [safeId](UserClient.md#safeid)
- [url](UserClient.md#url)

### Methods

- [get](UserClient.md#get)

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

▸ **get**(): `Promise`<[`User`](../interfaces/User.md)\>

Depending on whether ApifyClient was created with a token,
the method will either return public or private user data.
https://docs.apify.com/api/v2#/reference/users

#### Returns

`Promise`<[`User`](../interfaces/User.md)\>
