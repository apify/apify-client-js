# Class: ScheduleCollectionClient

## Hierarchy

- `ResourceCollectionClient`

  ↳ **`ScheduleCollectionClient`**

## Table of contents

### Properties

- [apifyClient](ScheduleCollectionClient.md#apifyclient)
- [baseUrl](ScheduleCollectionClient.md#baseurl)
- [httpClient](ScheduleCollectionClient.md#httpclient)
- [id](ScheduleCollectionClient.md#id)
- [params](ScheduleCollectionClient.md#params)
- [resourcePath](ScheduleCollectionClient.md#resourcepath)
- [safeId](ScheduleCollectionClient.md#safeid)
- [url](ScheduleCollectionClient.md#url)

### Methods

- [create](ScheduleCollectionClient.md#create)
- [list](ScheduleCollectionClient.md#list)

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

▸ **create**(`schedule?`): `Promise`<[`Schedule`](../interfaces/Schedule.md)\>

https://docs.apify.com/api/v2#/reference/schedules/schedules-collection/create-schedule

#### Parameters

| Name | Type |
| :------ | :------ |
| `schedule?` | `Partial`<`Pick`<[`Schedule`](../interfaces/Schedule.md), ``"name"`` \| ``"description"`` \| ``"cronExpression"`` \| ``"timezone"`` \| ``"isEnabled"`` \| ``"isExclusive"`` \| ``"actions"``\>\> |

#### Returns

`Promise`<[`Schedule`](../interfaces/Schedule.md)\>

___

### <a id="list" name="list"></a> list

▸ **list**(`options?`): `Promise`<[`PaginatedList`](../interfaces/PaginatedList.md)<[`Schedule`](../interfaces/Schedule.md)\>\>

https://docs.apify.com/api/v2#/reference/schedules/schedules-collection/get-list-of-schedules

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`ScheduleCollectionListOptions`](../interfaces/ScheduleCollectionListOptions.md) |

#### Returns

`Promise`<[`PaginatedList`](../interfaces/PaginatedList.md)<[`Schedule`](../interfaces/Schedule.md)\>\>
