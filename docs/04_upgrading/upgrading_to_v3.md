---
id: upgrading-to-v3
title: Upgrading to v3
sidebar_label: Upgrading to v3
description: 'Breaking changes and migration guide from v2 to v3 for the Apify API client for JavaScript.'
---

import ApiLink from '@theme/ApiLink';

This guide lists the breaking changes between Apify JavaScript API Client v2.x and v3.0.

## Published types now follow the OpenAPI specification

Every output type the client publishes, such as <ApiLink to="interface/Dataset">`Dataset`</ApiLink>,
<ApiLink to="interface/KeyValueStore">`KeyValueStore`</ApiLink>, <ApiLink to="interface/Build">`Build`</ApiLink>,
<ApiLink to="interface/ActorRun">`ActorRun`</ApiLink>, <ApiLink to="interface/Webhook">`Webhook`</ApiLink>,
<ApiLink to="interface/Schedule">`Schedule`</ApiLink>, <ApiLink to="interface/Task">`Task`</ApiLink>,
<ApiLink to="interface/RequestQueue">`RequestQueue`</ApiLink>, and <ApiLink to="interface/User">`User`</ApiLink>,
is now declared on top of a type generated from the published [OpenAPI specification](https://docs.apify.com/api/v2)
instead of being hand-written. Several of the previous hand-written types were wrong, and some even contradicted
the client's own runtime behavior. For example, `nextExclusiveStartKey` was typed as a required `string`, but
`listKeys()` has always compared it to `null`.

For most consumers, this only surfaces as new compiler errors. Many fields that were typed as required are now
optional (`field?: T`) or nullable (`field: T | null`) to match what the API can actually return. Recompile your
project and add the null and undefined checks the compiler points out. These type corrections don't change what
the client returns at runtime, only what TypeScript claimed about it before.

A handful of fields also change type entirely to match the client's actual behavior:

- `Webhook.lastDispatch` was typed as a `string`, even though the API returns an object. It's now nullable and
  typed as <ApiLink to="interface/WebhookLastDispatch">`WebhookLastDispatch`</ApiLink>.
- `Schedule.nextRunAt`, `Schedule.lastRunAt`, and `RequestQueue.expireAt` were typed as `string`, even though
  `parseDateFields()` has always converted them to `Date`. They're now typed as such.

A few changes go beyond types.

### Date parsing reaches one level deeper

`parseDateFields()`'s recursion depth increased from 3 to 4, so a list response, such as from
`webhook.dispatches().list()`, gets the same `Date` conversion as the single resource it wraps. A field inside a
caller-owned blob the API stores verbatim, such as `userData.foo.somethingAt`, now comes back as a `Date` instead
of the string it was written as.

### `ActorRun` no longer extends `ActorRunListItem`

The specification describes a run and a run-list item as two different shapes. Code that relies on structural
compatibility between them, such as passing an `ActorRun` where an
<ApiLink to="interface/ActorRunListItem">`ActorRunListItem`</ApiLink> is expected, needs to change.

### Requests submitted to a RequestQueueClient require uniqueKey and url

<ApiLink to="class/RequestQueueClient#addRequest">`addRequest()`</ApiLink> and
<ApiLink to="class/RequestQueueClient#batchAddRequests">`batchAddRequests()`</ApiLink> take
`RequestQueueClientRequestToAdd`, on which both fields are mandatory. The API always required them. The previous
type just didn't say so.

For the full per-resource breakdown of what became optional, nullable, or newly exposed, see the `BREAKING CHANGE`
commit footers of [#985](https://github.com/apify/apify-client-js/pull/985).
