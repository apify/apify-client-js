---
id: upgrading-to-v3
title: Upgrading to v3
sidebar_label: Upgrading to v3
description: 'Breaking changes to be aware of when upgrading to version 3 of the Apify API client for JavaScript.'
---

import ApiLink from '@theme/ApiLink';

This page summarizes the breaking changes when upgrading from v2 to v3 of `apify-client`.

## Argument validation switched from `ow` to `zod`

The client now validates the arguments you pass with [zod](https://zod.dev) instead of `ow`. This changes what gets thrown for invalid arguments, and tightens a few gaps `ow` used to let through silently.

### A new error type

Invalid arguments now throw an <ApiLink to="class/ArgumentValidationError">`ArgumentValidationError`</ApiLink> (exported from `apify-client`), not `ow`'s `ArgumentError`. Its message is a plain, human-readable sentence naming the offending field and the value it received, rather than `ow`'s JSON dump:

```diff
- Expected property string `countryCode` to match `/^[A-Z]{2}$/`, got `CZE` in object   // v2 (ow)
+ Invalid input: must match pattern /^[A-Z]{2}$/ at `countryCode`, got `CZE`             // v3 (zod)
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

`ow`'s object check let arrays and functions through wherever a plain object was expected. Zod's does not, so passing one now throws instead of reaching the API with a nonsensical body. This affects `update()` / `create()` fields, `TaskClient.start()` / `call()` input, the storage `schema` option, and `DatasetClient.pushItems()` items.

```js
// Now throws: Invalid input: expected object, received array
await client.dataset('my-dataset').pushItems([{ foo: 'bar' }, [1, 2, 3]]);
```

`Date`, `Map`, `Set` and other class instances still pass as objects, same as under `ow`.

### `Infinity` and invalid `Date`s are now rejected

`ow` only checked the type, so `Infinity` passed as a number and an invalid `Date` passed as a date. Zod additionally requires a *finite* number and a *valid* date, so both now throw:

```js
// Now throws: Invalid input: expected a finite number at `timeoutSecs`, got `Infinity`
await client.actor('my-actor').call({ timeoutSecs: Infinity });

// Now throws: Invalid input: expected a valid date at `startedBefore`
await client.actor('my-actor').runs().list({ startedBefore: new Date('nonsense') });
```

This affects numeric options such as `waitSecs`, `timeoutSecs` and `memory`, and date options such as `startedBefore` / `startedAfter`.

### A few always-rejected options are gone from the types

Some options were declared in the TypeScript types but always rejected at runtime by the API: `chunkSize` on `DatasetClient.downloadItems()` and `createItemsPublicUrl()`, and `signature` on `createItemsPublicUrl()` and `createKeysPublicUrl()`. These are no longer part of the option types, so passing them is now a compile-time error instead of a runtime throw.

`chunkSize` still works everywhere else it always did - on every paginating `list()` method.
