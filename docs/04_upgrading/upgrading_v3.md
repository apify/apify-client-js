---
id: upgrading-to-v3
title: Upgrading to v3
sidebar_label: Upgrading to v3
description: 'Breaking changes to be aware of when upgrading to version 3 of the Apify API client for JavaScript.'
---

import ApiLink from '@theme/ApiLink';

This page summarizes the breaking changes when upgrading from v2 to v3 of `apify-client`.

## The package is now pure ESM

`apify-client` ships as an ES module. The CommonJS build is gone, along with the `dist/index.mjs` wrapper and the `require` condition in `exports`, so `import` is the supported way to load the client.

```diff
- const { ApifyClient } = require('apify-client'); // v2
+ import { ApifyClient } from 'apify-client';      // v3
```

A CommonJS project can keep calling `require('apify-client')`: the client has no top-level `await`, and Node.js 22.12 and newer load an ES module through `require()` directly. On Node.js 22.0 to 22.11, `require()` of an ES module is still behind the `--experimental-require-module` flag, so use `import` there.

The browser bundle at `dist/bundle.js` is now an ES module instead of UMD, so it no longer defines an `Apify` global. Importing it, whether through a bundler or the `apify-client/browser` subpath, is unchanged. A classic `<script>` tag that read `Apify.ApifyClient` off the global has to become a `<script type="module">` that imports it instead. For details, see [Bundled environments](../02_concepts/05_bundled-environments.md).

## Argument validation switched from `ow` to `zod`

The client now validates the arguments you pass with [zod](https://zod.dev) instead of `ow`. This changes what gets thrown for invalid arguments, and tightens a few gaps `ow` used to let through silently.

### A new error type

Invalid arguments now throw an <ApiLink to="class/ArgumentValidationError">`ArgumentValidationError`</ApiLink> (exported from `apify-client`), not `ow`'s `ArgumentError`. Its message is a plain, human-readable sentence naming the offending field and the value it received, rather than `ow`'s JSON dump:

```diff
- Expected property string `countryCode` to match `/^[A-Z]{2}$/`, got `CZE` in object   // v2 (ow)
+ Invalid string: must match pattern /^[A-Z]{2}$/ at `countryCode`, got `CZE`            // v3 (zod)
```

The structured zod issues are available on `issues`, and the original `ZodError` on `cause`:

```js
import { ApifyClient, ArgumentValidationError } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

try {
    await client.dataset('my-dataset').listItems({ limit: 'ten' });
} catch (error) {
    if (error instanceof ArgumentValidationError) {
        console.log(error.message); // Invalid input: expected number, received string at `limit`, got `ten`
        console.log(error.issues); // [{ code: 'invalid_type', expected: 'number', path: ['limit'], ... }]
    }
}
```

If you were matching on `ow`'s `ArgumentError`, switch to `ArgumentValidationError`. If you were parsing the old message text, use `issues` instead.

### Arrays and functions no longer pass where a plain object is expected

`ow`'s object check let arrays and functions through wherever a plain object was expected. Zod's does not, so passing one now throws instead of reaching the API with a nonsensical body. This affects `update()` / `create()` fields, `TaskClient.start()` / `call()` input, the storage `schema` option, `DatasetClient.pushItems()` items, and `RequestQueueClient.addRequest()` / `batchAddRequests()` requests.

```js
// Now throws: Invalid input: expected object, received array
await client.actor('my-actor').update([{ name: 'my-actor' }]);
```

`Date`, `Map`, `Set` and other class instances still pass as objects, same as under `ow`.

### `Infinity` and invalid `Date`s are now rejected

`ow` only checked the type, so `Infinity` passed as a number and an invalid `Date` passed as a date. Zod additionally requires a *finite* number and a *valid* date, so both now throw:

```js
// Now throws: Invalid input: expected a finite number at `timeout`, got `Infinity`
await client.actor('my-actor').call(undefined, { timeout: Infinity });

// Now throws: Invalid input: expected a valid date at `startedBefore`
//             Invalid input: expected string, received Date at `startedBefore`
await client.actor('my-actor').runs().list({ startedBefore: new Date('nonsense') });
```

The second example reports a line per arm, because `startedBefore` accepts either a `Date` or a string.

This affects numeric options such as `waitSecs`, `timeout` and `memory`, and date options such as `startedBefore` / `startedAfter`. `KeyValueStoreClient.setRecord()` rejects `NaN` and `Infinity` as a record value too, since `JSON.stringify()` turns both into `null`.

### A few always-rejected options are gone from the types

Some options were declared in the TypeScript types but always rejected by the client's own validation before a request was ever sent: `chunkSize` on `DatasetClient.downloadItems()` and `createItemsPublicUrl()`, and `signature` on `createItemsPublicUrl()` and `createKeysPublicUrl()`. These are no longer part of the option types, so passing them is now a compile-time error instead of a runtime throw.

The reverse also happened: `chunkSize` now works on every `list()` method that takes pagination options. In v2 only `DatasetClient.listItems()` accepted it - everywhere else it type-checked and then threw.

## API errors are thrown as subclasses of `ApifyApiError`

An error response from the API now throws the <ApiLink to="class/ApifyApiError">`ApifyApiError`</ApiLink> subclass matching its HTTP status code: <ApiLink to="class/InvalidRequestError">`InvalidRequestError`</ApiLink> (400), <ApiLink to="class/UnauthorizedError">`UnauthorizedError`</ApiLink> (401), <ApiLink to="class/ForbiddenError">`ForbiddenError`</ApiLink> (403), <ApiLink to="class/NotFoundError">`NotFoundError`</ApiLink> (404), <ApiLink to="class/ConflictError">`ConflictError`</ApiLink> (409), <ApiLink to="class/RateLimitError">`RateLimitError`</ApiLink> (429) or <ApiLink to="class/ServerError">`ServerError`</ApiLink> (5xx). Any other status code still throws a plain `ApifyApiError`. Every subclass extends `ApifyApiError`, so existing `instanceof ApifyApiError` checks keep working. For details, see [Telling API errors apart](../02_concepts/02_error-handling.md#telling-api-errors-apart).

Two things change as a result:

- `error.name`, and with it the first line of the printed stack, now carries the subclass name, such as `NotFoundError: Actor task was not found` instead of `ApifyApiError: Actor task was not found`. Log tooling that matches on the `ApifyApiError` name has to match the subclass names as well.
- Methods that swallow a 404 response, such as `get()` returning `undefined` or `delete()` succeeding silently, now swallow every 404, whatever its `type`. In v2 they swallowed only the `record-not-found` and `record-or-token-not-found` types and threw for any other 404. The same helper backs <ApiLink to="class/RunClient#waitForFinish">`waitForFinish()`</ApiLink> and <ApiLink to="class/ActorClient#call">`call()`</ApiLink>, which read a swallowed 404 as "the run is not visible yet", so a 404 that used to throw now keeps them polling until `waitSecs` runs out.

## Published types now follow the OpenAPI specification

Every output type the client publishes, such as <ApiLink to="interface/Dataset">`Dataset`</ApiLink>, <ApiLink to="interface/KeyValueStore">`KeyValueStore`</ApiLink>, <ApiLink to="interface/Build">`Build`</ApiLink>, <ApiLink to="interface/ActorRun">`ActorRun`</ApiLink>, <ApiLink to="interface/Webhook">`Webhook`</ApiLink>, <ApiLink to="interface/Schedule">`Schedule`</ApiLink>, <ApiLink to="interface/Task">`Task`</ApiLink>, <ApiLink to="interface/RequestQueue">`RequestQueue`</ApiLink>, and <ApiLink to="interface/User">`User`</ApiLink>, is now declared on top of a type generated from the published [OpenAPI specification](https://docs.apify.com/api/v2) instead of being hand-written. Several of the previous hand-written types were wrong, and some even contradicted the client's own runtime behavior. For example, `nextExclusiveStartKey` was typed as a required `string`, but `listKeys()` has always compared it to `null`.

For most consumers, the change only surfaces as new compiler errors. Many fields that were typed as required are now optional (`field?: T`) or nullable (`field: T | null`) to match what the API can actually return. Recompile your project and add the null and undefined checks the compiler points out. These type corrections don't change what the client returns at runtime, only what TypeScript claimed about it before.

A few fields went the other way and became required. `ActorVersion.versionNumber` is one, and `ActorVersion` is what <ApiLink to="class/ActorVersionCollectionClient#create">`create()`</ApiLink> takes, so a call that omitted the version number no longer compiles. <ApiLink to="class/ActorVersionClient#update">`update()`</ApiLink> is unaffected. It takes `ActorVersionUpdateData`, where every field is optional, matching an endpoint that leaves untouched whatever the payload doesn't mention.

A handful of fields and return types also change entirely to match the client's actual behavior:

- `Webhook.lastDispatch` was typed as a `string`, even though the API returns an object. It's now optional and nullable, typed as <ApiLink to="interface/WebhookLastDispatch">`WebhookLastDispatch`</ApiLink>.
- `Schedule.nextRunAt`, `Schedule.lastRunAt`, `RequestQueue.expireAt` and `RequestQueueClientRequestSchema.handledAt` were typed as `string`, even though `parseDateFields()` has always converted them to `Date`. They're now typed as such. `handledAt` also carries into what <ApiLink to="class/RequestQueueClient#updateRequest">`updateRequest()`</ApiLink> takes, so a call that marked a request handled with an ISO string has to pass a `Date` instead.
- `Build.status` was typed as the four terminal statuses, even though `waitForFinish()` documents `READY` and `RUNNING`. It's now all eight Actor job statuses, so an exhaustive `switch` over it no longer compiles.
- `WebhookDispatch.webhook` was `Pick<Webhook, 'requestUrl' | 'isAdHoc'>`. It's now an optional, nullable <ApiLink to="interface/WebhookDispatchWebhookSummary">`WebhookDispatchWebhookSummary`</ApiLink>, which also carries `actionType` and a `condition` typed as the same `WebhookCondition` union `Webhook.condition` carries.
- `UserPlan.enabledPlatformFeatures` was a `PlatformFeature[]`, even though the platform has features that enum never gained, such as `PROXY_RESIDENTIAL`. It's now a `string[]`. `PlatformFeature` stays published, so an existing comparison against one of its members still works.
- <ApiLink to="class/RequestQueueClient#getRequest">`getRequest()`</ApiLink> was typed as a queue-head projection, even though the endpoint returns the whole request. It's now the full request schema.
- <ApiLink to="class/RequestQueueClient#batchDeleteRequests">`batchDeleteRequests()`</ApiLink> was typed with the batch *add* result, whose processed entries carry `requestId`, `wasAlreadyPresent` and `wasAlreadyHandled`. The delete endpoint answers with none of those, so the return type is now <ApiLink to="interface/RequestQueueClientBatchDeleteRequestsResult">`RequestQueueClientBatchDeleteRequestsResult`</ApiLink>, whose processed entries carry `id` and `uniqueKey`. Code that read any of the three old fields was reading `undefined`.

A few changes need more than a null check.

### Date parsing reaches one level deeper

`parseDateFields()`'s recursion depth increased from 3 to 4, so a list response, such as from `webhook.dispatches().list()`, gets the same `Date` conversion as the single resource it wraps.

The extra level applies to every response, so the conversion also reaches one step further into the caller-owned blobs the API stores verbatim. A listed request's `userData.foo.somethingAt` comes back as a `Date` instead of the string it was written as, and so does a `somethingAt` three levels inside a task's `input`.

### A resource and its list item are no longer interchangeable

The specification describes a full resource and its list item as two different shapes, so <ApiLink to="interface/ActorRun">`ActorRun`</ApiLink> no longer extends <ApiLink to="interface/ActorRunListItem">`ActorRunListItem`</ApiLink>, and a <ApiLink to="interface/Build">`Build`</ApiLink> still isn't assignable to <ApiLink to="interface/BuildCollectionClientListItem">`BuildCollectionClientListItem`</ApiLink>, which requires the `usageTotalUsd` that only the list endpoint always returns. Code that passes a full resource where a list item is expected needs to change.

### An Actor version's source files can be folders

An Actor version's `sourceFiles` is a flat list that mixes files and folders, so its element type is now <ApiLink to="interface/ActorVersionSourceFile">`ActorVersionSourceFile`</ApiLink> or the new <ApiLink to="interface/ActorVersionSourceFolder">`ActorVersionSourceFolder`</ApiLink>. Code that reads `content` or `format` off an element has to tell the two apart first, by the `folder` flag only a folder carries. The `ActorVersion` union also gains a fifth variant for `SOURCE_CODE`, <ApiLink to="interface/ActorVersionSourceCode">`ActorVersionSourceCode`</ApiLink>, so an exhaustive `switch` over `sourceType` no longer compiles.

### Enum-typed inputs take plain strings

Four positions that took a published enum now take that enum's values as plain string literals:

- `ActorVersion.sourceType`, and with it <ApiLink to="class/ActorVersionCollectionClient#create">`create()`</ApiLink> and <ApiLink to="class/ActorVersionClient#update">`update()`</ApiLink>, takes `'SOURCE_FILES' | 'GIT_REPO' | 'TARBALL' | 'GITHUB_GIST' | 'SOURCE_CODE'` instead of `ActorSourceType`.
- A scheduled action's `type`, and with it <ApiLink to="class/ScheduleCollectionClient#create">`create()`</ApiLink> and <ApiLink to="class/ScheduleClient#update">`update()`</ApiLink>, takes `'RUN_ACTOR' | 'RUN_ACTOR_TASK'` instead of `ScheduleActions`.
- <ApiLink to="interface/ActorCollectionListOptions">`ActorCollectionListOptions.sortBy`</ApiLink> takes `'createdAt' | 'stats.lastRunStartedAt'` instead of `ActorListSortBy`.
- <ApiLink to="class/DatasetClient#downloadItems">`downloadItems()`</ApiLink> takes `'json' | 'jsonl' | 'xml' | 'html' | 'csv' | 'xlsx' | 'rss'` instead of `DownloadItemsFormat`.

All four enums stay published and their members stay assignable, so `sourceType: ActorSourceType.GitRepo` still works, and `sourceType: 'GIT_REPO'` now compiles without a cast.

The other direction breaks where the value is also read back. `const type: ActorSourceType = version.sourceType` no longer compiles. Annotate it as `ActorVersion['sourceType']` instead, or leave it to inference.

### The request-queue head splits into two item types

<ApiLink to="interface/RequestQueueClientRequestSchema">`RequestQueueClientRequestSchema`</ApiLink> is now derived from the specification's stored-request schema. Its `id`, `url` and `uniqueKey` stay required, as the specification states them, and the rest of the fields follow the specification's optionality.

The queue head splits into two item types. <ApiLink to="class/RequestQueueClient#listHead">`listHead()`</ApiLink> still yields <ApiLink to="interface/RequestQueueClientListItem">`RequestQueueClientListItem`</ApiLink>, which drops `lockExpiresAt`, while <ApiLink to="class/RequestQueueClient#listAndLockHead">`listAndLockHead()`</ApiLink> now yields the new <ApiLink to="interface/RequestQueueClientLockedListItem">`RequestQueueClientLockedListItem`</ApiLink>, where the field is required.

Submitting a request is unchanged: <ApiLink to="class/RequestQueueClient#addRequest">`addRequest()`</ApiLink> and <ApiLink to="class/RequestQueueClient#batchAddRequests">`batchAddRequests()`</ApiLink> take <ApiLink to="interface/RequestQueueClientRequestToAdd">`RequestQueueClientRequestToAdd`</ApiLink>, which is the stored request without the `id` the API assigns.

### A scheduled Actor-task action takes its input as an object

`ScheduleActionRunActorTask.input` was typed as a `string`, and is now the object the specification describes. The same type backs <ApiLink to="class/ScheduleClient#update">`update()`</ApiLink>, so an action that passed its input as a JSON string has to pass the parsed object instead.

For the full per-resource breakdown of what became optional, nullable, newly exposed, or dropped, see the `BREAKING CHANGE` commit footer of [#985](https://github.com/apify/apify-client-js/pull/985).

## Responses are validated against the OpenAPI specification

Every response the client turns into a typed value is now checked against a [zod](https://zod.dev) schema generated from the same specification the types come from, the way the Python client validates its responses with pydantic. A response that doesn't match, whether a missing required field, a different type, or a value outside the documented range, throws a new <ApiLink to="class/ResponseValidationError">`ResponseValidationError`</ApiLink> (exported from `apify-client`) instead of being handed on as if it were what the type claims.

The check is deliberately lenient about growth: fields the specification doesn't describe pass through untouched, and an enum value it doesn't list is accepted too, so a new field or status on the API side isn't an error. What it catches is the API and its specification disagreeing, which previously surfaced as an `undefined` somewhere down the line. If you hit one, the specification is wrong or the API changed, so please [report it](https://github.com/apify/apify-client-js/issues).

```js
import { ApifyClient, ResponseValidationError } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

try {
    await client.actor('my-actor').get();
} catch (error) {
    if (error instanceof ResponseValidationError) {
        console.log(error.message);
        // Response from GET https://api.apify.com/v2/acts/my-actor does not match the API schema:
        // Invalid input: expected string, received null at `name`
        // The API returned something its OpenAPI specification does not describe. Please report this at https://github.com/apify/apify-client-js/issues.
        console.log(error.issues); // [{ code: 'invalid_type', expected: 'string', path: ['name'], ... }]
    }
}
```

Bodies the specification leaves to you aren't validated: dataset items, key-value store records and logs are returned as before.

Two return types change as a result of describing what the endpoints really return:

- <ApiLink to="class/ScheduleClient#getLog">`ScheduleClient.getLog()`</ApiLink> was typed as a `string`, even though the endpoint returns the log as a list of entries. It's now typed as <ApiLink to="interface/ScheduleInvoked">`ScheduleInvoked[]`</ApiLink>, each entry carrying `message`, `level` and `createdAt`.
- <ApiLink to="interface/TaskPublicConfig">`TaskPublicConfig`</ApiLink> now follows the specification: `publishedAt` is optional and read-only, and `categorization`, which the specification doesn't describe, is gone from the type.

## `versions().list()` and `envVars().list()` take no options

<ApiLink to="class/ActorVersionCollectionClient#list">`ActorVersionCollectionClient.list()`</ApiLink> and <ApiLink to="class/ActorEnvVarCollectionClient#list">`ActorEnvVarCollectionClient.list()`</ApiLink> now take no arguments. Neither endpoint reads `offset`, `limit` or `desc`, and both return every item in one response, so `chunkSize` had nothing to size either. The `ActorVersionCollectionListOptions` and `ActorEnvVarCollectionListOptions` types that declared those four options, deprecated since v2.21.0, are gone from the package. A call that passed an options object no longer compiles. Drop the argument and the call returns the same items as before.

## The last deprecated options are gone

Two options that carried a `@deprecated` marker throughout v2 have been removed.

`restartOnError` is gone from <ApiLink to="interface/ActorCollectionCreateOptions">`ActorCollectionCreateOptions`</ApiLink>, so <ApiLink to="class/ActorCollectionClient#create">`ActorCollectionClient.create()`</ApiLink> no longer accepts it at the top level. Pass it inside `defaultRunOptions` instead, as the deprecation notice advised.

`exclusiveStartId` is gone from <ApiLink to="class/RequestQueueClient#listRequests">`listRequests()`</ApiLink> and <ApiLink to="class/RequestQueueClient#paginateRequests">`paginateRequests()`</ApiLink>. Both paginate by `cursor` alone now, and passing `exclusiveStartId` throws an `ArgumentValidationError` about an unrecognized key. In v2 the two were mutually exclusive, so the error about combining them is gone as well. Responses are unaffected, since the API still echoes `exclusiveStartId` back in the request listing.
