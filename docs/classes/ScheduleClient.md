# Class: ScheduleClient

## Hierarchy

- `ResourceClient`

  ↳ **`ScheduleClient`**

## Table of contents

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

- [delete](ScheduleClient.md#delete)
- [get](ScheduleClient.md#get)
- [getLog](ScheduleClient.md#getlog)
- [update](ScheduleClient.md#update)

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
