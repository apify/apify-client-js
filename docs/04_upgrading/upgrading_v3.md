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
+ import { ApifyClient } from 'apify-client';     // v3
```

A CommonJS project can still `require('apify-client')` on Node.js 22.12 or newer, which loads an ES module through `require()` directly. Anywhere without that support, switch to `import`, either by adding `"type": "module"` to your `package.json` or through a dynamic `import()`:

```js
const { ApifyClient } = await import('apify-client');
```

The browser bundle moved from `dist/bundle.js` to `dist/bundle.cjs`, because a `.js` file inside an ESM package is parsed as an ES module, and the bundle is UMD. The `apify-client/browser` subpath is unchanged, so only code that pointed at the file path itself needs updating. For details, see [Bundled environments](../02_concepts/05_bundled-environments.md).

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

The reverse also happened: `chunkSize` now works on every paginating `list()` method. In v2 only `DatasetClient.listItems()` accepted it - everywhere else it type-checked and then threw.

## Published types now follow the OpenAPI specification

Every output type the client publishes, such as <ApiLink to="interface/Dataset">`Dataset`</ApiLink>, <ApiLink to="interface/KeyValueStore">`KeyValueStore`</ApiLink>, <ApiLink to="interface/Build">`Build`</ApiLink>, <ApiLink to="interface/ActorRun">`ActorRun`</ApiLink>, <ApiLink to="interface/Webhook">`Webhook`</ApiLink>, <ApiLink to="interface/Schedule">`Schedule`</ApiLink>, <ApiLink to="interface/Task">`Task`</ApiLink>, <ApiLink to="interface/RequestQueue">`RequestQueue`</ApiLink>, and <ApiLink to="interface/User">`User`</ApiLink>, is now declared on top of a type generated from the published [OpenAPI specification](https://docs.apify.com/api/v2) instead of being hand-written. Several of the previous hand-written types were wrong, and some even contradicted the client's own runtime behavior. For example, `nextExclusiveStartKey` was typed as a required `string`, but `listKeys()` has always compared it to `null`.

For most consumers, the change only surfaces as new compiler errors. Many fields that were typed as required are now optional (`field?: T`) or nullable (`field: T | null`) to match what the API can actually return. Recompile your project and add the null and undefined checks the compiler points out. These type corrections don't change what the client returns at runtime, only what TypeScript claimed about it before.

A few fields went the other way and became required. `ActorVersion.versionNumber` is one, and `ActorVersion` is also what <ApiLink to="class/ActorVersionClient#update">`update()`</ApiLink> and <ApiLink to="class/ActorVersionCollectionClient#create">`create()`</ApiLink> take, so a call that omitted the version number no longer compiles.

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

### The request-queue head splits into two item types

<ApiLink to="interface/RequestQueueClientRequestSchema">`RequestQueueClientRequestSchema`</ApiLink> is now derived from the specification's stored-request schema. Its `id`, `url` and `uniqueKey` stay required, as the specification states them, and the rest of the fields follow the specification's optionality.

The queue head splits into two item types. <ApiLink to="class/RequestQueueClient#listHead">`listHead()`</ApiLink> still yields <ApiLink to="interface/RequestQueueClientListItem">`RequestQueueClientListItem`</ApiLink>, which drops `lockExpiresAt`, while <ApiLink to="class/RequestQueueClient#listAndLockHead">`listAndLockHead()`</ApiLink> now yields the new <ApiLink to="interface/RequestQueueClientLockedListItem">`RequestQueueClientLockedListItem`</ApiLink>, where the field is required.

Submitting a request is unchanged: <ApiLink to="class/RequestQueueClient#addRequest">`addRequest()`</ApiLink> and <ApiLink to="class/RequestQueueClient#batchAddRequests">`batchAddRequests()`</ApiLink> take <ApiLink to="interface/RequestQueueClientRequestToAdd">`RequestQueueClientRequestToAdd`</ApiLink>, which is the stored request without the `id` the API assigns.

### A scheduled Actor-task action takes its input as an object

`ScheduleActionRunActorTask.input` was typed as a `string`, and is now the object the specification describes. The same type backs <ApiLink to="class/ScheduleClient#update">`update()`</ApiLink>, so an action that passed its input as a JSON string has to pass the parsed object instead.

For the full per-resource breakdown of what became optional, nullable, newly exposed, or dropped, see the `BREAKING CHANGE` commit footer of [#985](https://github.com/apify/apify-client-js/pull/985).
