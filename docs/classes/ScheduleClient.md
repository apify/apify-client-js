# Class: ScheduleClient

**`hideconstructor`**

## Hierarchy

- `ResourceClient`

  ↳ **`ScheduleClient`**

## Table of contents

### Constructors

- [constructor](ScheduleClient.md#constructor)

### Properties

- [apifyClient](ScheduleClient.md#apifyclient)
- [baseUrl](ScheduleClient.md#baseurl)
- [httpClient](ScheduleClient.md#httpclient)
- [id](ScheduleClient.md#id)
- [params](ScheduleClient.md#params)
- [resourcePath](ScheduleClient.md#resourcepath)
- [safeId](ScheduleClient.md#safeid)
- [url](ScheduleClient.md#url)

### Methods

- [\_delete](ScheduleClient.md#_delete)
- [\_get](ScheduleClient.md#_get)
- [\_params](ScheduleClient.md#_params)
- [\_subResourceOptions](ScheduleClient.md#_subresourceoptions)
- [\_toSafeId](ScheduleClient.md#_tosafeid)
- [\_update](ScheduleClient.md#_update)
- [\_url](ScheduleClient.md#_url)
- [\_waitForFinish](ScheduleClient.md#_waitforfinish)
- [delete](ScheduleClient.md#delete)
- [get](ScheduleClient.md#get)
- [getLog](ScheduleClient.md#getlog)
- [update](ScheduleClient.md#update)

## Constructors

### <a id="constructor" name="constructor"></a> constructor

• **new ScheduleClient**(`options`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `ApiClientSubResourceOptions` |

#### Overrides

ResourceClient.constructor

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

### <a id="_delete" name="_delete"></a> \_delete

▸ `Protected` **_delete**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Inherited from

ResourceClient.\_delete

___

### <a id="_get" name="_get"></a> \_get

▸ `Protected` **_get**<`T`, `R`\>(`options?`): `Promise`<`undefined` \| `R`\>

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

`Promise`<`undefined` \| `R`\>

#### Inherited from

ResourceClient.\_get

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

ResourceClient.\_params

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

ResourceClient.\_subResourceOptions

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

ResourceClient.\_toSafeId

___

### <a id="_update" name="_update"></a> \_update

▸ `Protected` **_update**<`T`, `R`\>(`newFields`): `Promise`<`R`\>

#### Type parameters

| Name |
| :------ |
| `T` |
| `R` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `newFields` | `T` |

#### Returns

`Promise`<`R`\>

#### Inherited from

ResourceClient.\_update

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

ResourceClient.\_url

___

### <a id="_waitforfinish" name="_waitforfinish"></a> \_waitForFinish

▸ `Protected` **_waitForFinish**<`R`\>(`options?`): `Promise`<`R`\>

This function is used in Build and Run endpoints so it's kept
here to stay DRY.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `R` | extends `Object` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `WaitForFinishOptions` |

#### Returns

`Promise`<`R`\>

#### Inherited from

ResourceClient.\_waitForFinish

___

### <a id="delete" name="delete"></a> delete

▸ **delete**(): `Promise`<`void`\>

https://docs.apify.com/api/v2#/reference/schedules/schedule-object/delete-schedule

#### Returns

`Promise`<`void`\>

___

### <a id="get" name="get"></a> get

▸ **get**(): `Promise`<`undefined` \| [`Schedule`](../interfaces/Schedule.md)\>

https://docs.apify.com/api/v2#/reference/schedules/schedule-object/get-schedule

#### Returns

`Promise`<`undefined` \| [`Schedule`](../interfaces/Schedule.md)\>

___

### <a id="getlog" name="getlog"></a> getLog

▸ **getLog**(): `Promise`<`undefined` \| `string`\>

https://docs.apify.com/api/v2#/reference/schedules/schedule-log/get-schedule-log

#### Returns

`Promise`<`undefined` \| `string`\>

___

### <a id="update" name="update"></a> update

▸ **update**(`newFields`): `Promise`<[`Schedule`](../interfaces/Schedule.md)\>

https://docs.apify.com/api/v2#/reference/schedules/schedule-object/update-schedule

#### Parameters

| Name | Type |
| :------ | :------ |
| `newFields` | `Partial`<`Pick`<[`Schedule`](../interfaces/Schedule.md), ``"name"`` \| ``"description"`` \| ``"cronExpression"`` \| ``"timezone"`` \| ``"isEnabled"`` \| ``"isExclusive"`` \| ``"actions"``\>\> |

#### Returns

`Promise`<[`Schedule`](../interfaces/Schedule.md)\>
