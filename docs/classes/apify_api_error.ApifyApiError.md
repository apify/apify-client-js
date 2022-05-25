# Class: ApifyApiError

[apify_api_error](../modules/apify_api_error.md).ApifyApiError

An `ApifyApiError` is thrown for successful HTTP requests that reach the API,
but the API responds with an error response. Typically, those are rate limit
errors and internal errors, which are automatically retried, or validation
errors, which are thrown immediately, because a correction by the user is
needed.

## Hierarchy

- `Error`

  ↳ **`ApifyApiError`**

## Table of contents

### Properties

- [attempt](apify_api_error.ApifyApiError.md#attempt)
- [cause](apify_api_error.ApifyApiError.md#cause)
- [clientMethod](apify_api_error.ApifyApiError.md#clientmethod)
- [httpMethod](apify_api_error.ApifyApiError.md#httpmethod)
- [message](apify_api_error.ApifyApiError.md#message)
- [name](apify_api_error.ApifyApiError.md#name)
- [originalStack](apify_api_error.ApifyApiError.md#originalstack)
- [path](apify_api_error.ApifyApiError.md#path)
- [stack](apify_api_error.ApifyApiError.md#stack)
- [statusCode](apify_api_error.ApifyApiError.md#statuscode)
- [type](apify_api_error.ApifyApiError.md#type)
- [prepareStackTrace](apify_api_error.ApifyApiError.md#preparestacktrace)
- [stackTraceLimit](apify_api_error.ApifyApiError.md#stacktracelimit)

### Methods

- [\_createApiStack](apify_api_error.ApifyApiError.md#_createapistack)
- [\_extractClientAndMethodFromStack](apify_api_error.ApifyApiError.md#_extractclientandmethodfromstack)
- [\_safelyParsePathFromResponse](apify_api_error.ApifyApiError.md#_safelyparsepathfromresponse)
- [captureStackTrace](apify_api_error.ApifyApiError.md#capturestacktrace)

## Properties

### <a id="attempt" name="attempt"></a> attempt

• **attempt**: `number`

Number of the API call attempt.

___

### <a id="cause" name="cause"></a> cause

• `Optional` **cause**: `Error`

#### Inherited from

Error.cause

___

### <a id="clientmethod" name="clientmethod"></a> clientMethod

• **clientMethod**: `string`

The invoked resource client and the method. Known issue: Sometimes it displays
as `unknown` because it can't be parsed from a stack trace.

___

### <a id="httpmethod" name="httpmethod"></a> httpMethod

• `Optional` **httpMethod**: `string`

HTTP method of the API call.

___

### <a id="message" name="message"></a> message

• **message**: `string`

#### Inherited from

Error.message

___

### <a id="name" name="name"></a> name

• **name**: `string`

#### Overrides

Error.name

___

### <a id="originalstack" name="originalstack"></a> originalStack

• **originalStack**: `string`

Original stack trace of the exception. It is replaced
by a more informative stack with API call information.

___

### <a id="path" name="path"></a> path

• `Optional` **path**: `string`

Full path of the API endpoint (URL excluding origin).

___

### <a id="stack" name="stack"></a> stack

• `Optional` **stack**: `string`

#### Inherited from

Error.stack

___

### <a id="statuscode" name="statuscode"></a> statusCode

• **statusCode**: `number`

HTTP status code of the error.

___

### <a id="type" name="type"></a> type

• `Optional` **type**: `string`

The type of the error, as returned by the API.

___

### <a id="preparestacktrace" name="preparestacktrace"></a> prepareStackTrace

▪ `Static` `Optional` **prepareStackTrace**: (`err`: `Error`, `stackTraces`: `CallSite`[]) => `any`

#### Type declaration

▸ (`err`, `stackTraces`): `any`

Optional override for formatting stack traces

**`see`** https://v8.dev/docs/stack-trace-api#customizing-stack-traces

##### Parameters

| Name | Type |
| :------ | :------ |
| `err` | `Error` |
| `stackTraces` | `CallSite`[] |

##### Returns

`any`

#### Inherited from

Error.prepareStackTrace

___

### <a id="stacktracelimit" name="stacktracelimit"></a> stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

Error.stackTraceLimit

## Methods

### <a id="_createapistack" name="_createapistack"></a> \_createApiStack

▸ `Private` **_createApiStack**(): `string`

Creates a better looking and more informative stack that will be printed
out when API errors are thrown.

Example:

ApifyApiError: Actor task was not found
  clientMethod: TaskClient.start
  statusCode: 404
  type: record-not-found
  attempt: 1
  httpMethod: post
  path: /v2/actor-tasks/user~my-task/runs

#### Returns

`string`

___

### <a id="_extractclientandmethodfromstack" name="_extractclientandmethodfromstack"></a> \_extractClientAndMethodFromStack

▸ `Private` **_extractClientAndMethodFromStack**(): `string`

#### Returns

`string`

___

### <a id="_safelyparsepathfromresponse" name="_safelyparsepathfromresponse"></a> \_safelyParsePathFromResponse

▸ `Private` **_safelyParsePathFromResponse**(`response`): `undefined` \| `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `response` | `AxiosResponse`<`any`\> |

#### Returns

`undefined` \| `string`

___

### <a id="capturestacktrace" name="capturestacktrace"></a> captureStackTrace

▸ `Static` **captureStackTrace**(`targetObject`, `constructorOpt?`): `void`

Create .stack property on a target object

#### Parameters

| Name | Type |
| :------ | :------ |
| `targetObject` | `object` |
| `constructorOpt?` | `Function` |

#### Returns

`void`

#### Inherited from

Error.captureStackTrace
