# Class: ScheduleCollectionClient

[index](../modules/index.md).ScheduleCollectionClient

## Hierarchy

- `ResourceCollectionClient`

  ↳ **`ScheduleCollectionClient`**

## Table of contents

### Properties

- [apifyClient](index.ScheduleCollectionClient.md#apifyclient)
- [baseUrl](index.ScheduleCollectionClient.md#baseurl)
- [httpClient](index.ScheduleCollectionClient.md#httpclient)
- [id](index.ScheduleCollectionClient.md#id)
- [params](index.ScheduleCollectionClient.md#params)
- [resourcePath](index.ScheduleCollectionClient.md#resourcepath)
- [safeId](index.ScheduleCollectionClient.md#safeid)
- [url](index.ScheduleCollectionClient.md#url)

### Methods

- [\_create](index.ScheduleCollectionClient.md#_create)
- [\_getOrCreate](index.ScheduleCollectionClient.md#_getorcreate)
- [\_list](index.ScheduleCollectionClient.md#_list)
- [\_params](index.ScheduleCollectionClient.md#_params)
- [\_subResourceOptions](index.ScheduleCollectionClient.md#_subresourceoptions)
- [\_toSafeId](index.ScheduleCollectionClient.md#_tosafeid)
- [\_url](index.ScheduleCollectionClient.md#_url)
- [create](index.ScheduleCollectionClient.md#create)
- [list](index.ScheduleCollectionClient.md#list)

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

▸ **create**(`schedule?`): `Promise`<[`Schedule`](../interfaces/index.Schedule.md)\>

https://docs.apify.com/api/v2#/reference/schedules/schedules-collection/create-schedule

#### Parameters

| Name | Type |
| :------ | :------ |
| `schedule?` | `Partial`<`Pick`<[`Schedule`](../interfaces/index.Schedule.md), ``"name"`` \| ``"description"`` \| ``"cronExpression"`` \| ``"timezone"`` \| ``"isEnabled"`` \| ``"isExclusive"`` \| ``"actions"``\>\> |

#### Returns

`Promise`<[`Schedule`](../interfaces/index.Schedule.md)\>

___

### <a id="list" name="list"></a> list

▸ **list**(`options?`): `Promise`<[`PaginatedList`](../interfaces/index.PaginatedList.md)<[`Schedule`](../interfaces/index.Schedule.md)\>\>

https://docs.apify.com/api/v2#/reference/schedules/schedules-collection/get-list-of-schedules

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`ScheduleCollectionListOptions`](../interfaces/index.ScheduleCollectionListOptions.md) |

#### Returns

`Promise`<[`PaginatedList`](../interfaces/index.PaginatedList.md)<[`Schedule`](../interfaces/index.Schedule.md)\>\>
