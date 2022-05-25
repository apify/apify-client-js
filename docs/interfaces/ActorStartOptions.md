# Interface: ActorStartOptions

## Table of contents

### Properties

- [build](ActorStartOptions.md#build)
- [contentType](ActorStartOptions.md#contenttype)
- [memory](ActorStartOptions.md#memory)
- [timeout](ActorStartOptions.md#timeout)
- [waitForFinish](ActorStartOptions.md#waitforfinish)
- [webhooks](ActorStartOptions.md#webhooks)

## Properties

### <a id="build" name="build"></a> build

• `Optional` **build**: `string`

Tag or number of the actor build to run (e.g. `beta` or `1.2.345`).
If not provided, the run uses build tag or number from the default actor run configuration (typically `latest`).

___

### <a id="contenttype" name="contenttype"></a> contentType

• `Optional` **contentType**: `string`

Content type for the `input`. If not specified,
`input` is expected to be an object that will be stringified to JSON and content type set to
`application/json; charset=utf-8`. If `options.contentType` is specified, then `input` must be a
`String` or `Buffer`.

___

### <a id="memory" name="memory"></a> memory

• `Optional` **memory**: `number`

Memory in megabytes which will be allocated for the new actor run.
If not provided, the run uses memory of the default actor run configuration.

___

### <a id="timeout" name="timeout"></a> timeout

• `Optional` **timeout**: `number`

Timeout for the actor run in seconds. Zero value means there is no timeout.
If not provided, the run uses timeout of the default actor run configuration.

___

### <a id="waitforfinish" name="waitforfinish"></a> waitForFinish

• `Optional` **waitForFinish**: `number`

Maximum time to wait for the actor run to finish, in seconds.
If the limit is reached, the returned promise is resolved to a run object that will have
status `READY` or `RUNNING` and it will not contain the actor run output.
If `waitSecs` is null or undefined, the function waits for the actor to finish (default behavior).

___

### <a id="webhooks" name="webhooks"></a> webhooks

• `Optional` **webhooks**: readonly [`WebhookUpdateData`](../modules.md#webhookupdatedata)[]

Specifies optional webhooks associated with the actor run, which can be used
to receive a notification e.g. when the actor finished or failed, see
[ad hook webhooks documentation](https://docs.apify.com/webhooks/ad-hoc-webhooks) for detailed description.
