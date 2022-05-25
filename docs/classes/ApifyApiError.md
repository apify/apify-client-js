# Class: ApifyApiError

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

- [attempt](ApifyApiError.md#attempt)
- [cause](ApifyApiError.md#cause)
- [clientMethod](ApifyApiError.md#clientmethod)
- [httpMethod](ApifyApiError.md#httpmethod)
- [message](ApifyApiError.md#message)
- [name](ApifyApiError.md#name)
- [originalStack](ApifyApiError.md#originalstack)
- [path](ApifyApiError.md#path)
- [stack](ApifyApiError.md#stack)
- [statusCode](ApifyApiError.md#statuscode)
- [type](ApifyApiError.md#type)
- [prepareStackTrace](ApifyApiError.md#preparestacktrace)
- [stackTraceLimit](ApifyApiError.md#stacktracelimit)

### Methods

- [captureStackTrace](ApifyApiError.md#capturestacktrace)

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
