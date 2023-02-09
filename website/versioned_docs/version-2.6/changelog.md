---
title: Changelog
sidebar_label: Changelog
toc_max_heading_level: 2
---
## [v2.6.2](https://github.com/apify/apify-client-js/releases/tag/v2.6.2)
### What's Changed
* fix: `Actor.call` and `Task.call` accept `waitSecs` not `waitForFinish` by [@vladfrangu](https://github.com/vladfrangu) in [#283](https://github.com/apify/apify-client-js/pull/283)
* feat: re-export useful types and classes by [@vladfrangu](https://github.com/vladfrangu) in [#285](https://github.com/apify/apify-client-js/pull/285)
* fix(types): correct extends clause for Dataset entries by [@vladfrangu](https://github.com/vladfrangu) in [#284](https://github.com/apify/apify-client-js/pull/284)
* fix: Correct docs links for actor env vars, some refactoring by [@jirimoravcik](https://github.com/jirimoravcik) in [#287](https://github.com/apify/apify-client-js/pull/287)
* fix: make ActorUpdateOptions type have optional fields by [@metalwarrior665](https://github.com/metalwarrior665) in [#288](https://github.com/apify/apify-client-js/pull/288)
* fix: correctly set default client headers by [@valekjo](https://github.com/valekjo) in [#290](https://github.com/apify/apify-client-js/pull/290)


**Full Changelog**: https://github.com/apify/apify-client-js/compare/v2.6.1...v2.6.2
## [v2.6.1](https://github.com/apify/apify-client-js/releases/tag/v2.6.1)
### What's Changed
* feat: drop single file support by [@valekjo](https://github.com/valekjo) in [#257](https://github.com/apify/apify-client-js/pull/257)
* feat: update actor types by [@HonzaTuron](https://github.com/HonzaTuron) in [#263](https://github.com/apify/apify-client-js/pull/263)
* feat: Add flatten param to Dataset items listing by [@Strajk](https://github.com/Strajk) in [#264](https://github.com/apify/apify-client-js/pull/264)
* feat: Add optional title field to task, schedule, key-value store, dataset, and request queue by [@valekjo](https://github.com/valekjo) in [#271](https://github.com/apify/apify-client-js/pull/271)
* fix: Add `defaultRequestQueueId` property to `ActorRun` type by [@fnesveda](https://github.com/fnesveda) in [#268](https://github.com/apify/apify-client-js/pull/268)

**Full Changelog**: https://github.com/apify/apify-client-js/compare/v2.6.0...v2.6.1
## [v2.6.0](https://github.com/apify/apify-client-js/releases/tag/v2.6.0)
### What's Changed
* Add run.update() method for setting fields on runs. You can update statusMessage of run using this method. by [@barjin](https://github.com/barjin) in [#258](https://github.com/apify/apify-client-js/pull/258)
* Fix parsing ApifyError for method called with forceBuffer param to true. by [@drobnikj](https://github.com/drobnikj) in [#260](https://github.com/apify/apify-client-js/pull/260)
* Fix stream support, related with https://github.com/axios/axios/issues/1045 by [@mvolfik](https://github.com/mvolfik) in [#256](https://github.com/apify/apify-client-js/pull/256)
### New Contributors
* [@barjin](https://github.com/barjin) made their first contribution in [#258](https://github.com/apify/apify-client-js/pull/258)
* [@mvolfik](https://github.com/mvolfik) made their first contribution in [#256](https://github.com/apify/apify-client-js/pull/256)

**Full Changelog**: https://github.com/apify/apify-client-js/compare/v2.5.2...v2.6.0
## [v2.5.2](https://github.com/apify/apify-client-js/releases/tag/v2.5.2)
### What's Changed
* Adjust default parallels and retries for batch add requests by [@drobnikj](https://github.com/drobnikj) in [#255](https://github.com/apify/apify-client-js/pull/255)


**Full Changelog**: https://github.com/apify/apify-client-js/compare/v2.5.1...v2.5.2
## [v2.5.1](https://github.com/apify/apify-client-js/releases/tag/v2.5.1)
### What's Changed
* Fix ActorRun - correct type for `status` by [@vladfrangu](https://github.com/vladfrangu) in [#254](https://github.com/apify/apify-client-js/pull/254)
* Add methods to list all requests in queue, `requestQueueClient.listRequests()` and `requestQueueClient.paginateRequests()`.
  The paginate requests return an async iterator. by [@drobnikj](https://github.com/drobnikj) in [#249](https://github.com/apify/apify-client-js/pull/249)
```
for await (const page of rqClient.paginateRequests()) {
  // Do something with page.items
}
```



**Full Changelog**: https://github.com/apify/apify-client-js/compare/v2.5.0...v2.5.1
## [v2.5.0](https://github.com/apify/apify-client-js/releases/tag/v2.5.0)
### What's Changed
* feat: origin param added for last actor/task run endpoints by [@HonzaKirchner](https://github.com/HonzaKirchner) in [#248](https://github.com/apify/apify-client-js/pull/248)
* chore: version update by [@HonzaKirchner](https://github.com/HonzaKirchner) in [#250](https://github.com/apify/apify-client-js/pull/250)
### New Contributors
* [@HonzaKirchner](https://github.com/HonzaKirchner) made their first contribution in [#248](https://github.com/apify/apify-client-js/pull/248)

**Full Changelog**: https://github.com/apify/apify-client-js/compare/v2.4.1...v2.5.0
## [v2.4.1](https://github.com/apify/apify-client-js/releases/tag/v2.4.1)
### What's Changed
* feat: Add request queue methods `listAndLockHead`, `prolongRequestLock`, `deleteRequestLock` by [@drobnikj](https://github.com/drobnikj) in [#246](https://github.com/apify/apify-client-js/pull/246)


**Full Changelog**: https://github.com/apify/apify-client-js/compare/v2.4.0...v2.4.1
## [v2.4.0](https://github.com/apify/apify-client-js/releases/tag/v2.4.0)
### What's Changed
* fix: Add exponential backoff to batchAddRequests, untie batch and client settings by [@jirimoravcik](https://github.com/jirimoravcik) in [#243](https://github.com/apify/apify-client-js/pull/243)


**Full Changelog**: https://github.com/apify/apify-client-js/compare/v2.3.1...v2.4.0
## [v2.3.1](https://github.com/apify/apify-client-js/releases/tag/v2.3.1)
### What's Changed
* Fix: Retries in batch requests insert endpoint [@drobnikj](https://github.com/drobnikj) in [#242](https://github.com/apify/apify-client-js/pull/242)


**Full Changelog**: https://github.com/apify/apify-client-js/compare/v2.3.0...v2.3.1
## [v2.3.0](https://github.com/apify/apify-client-js/releases/tag/v2.3.0)
### What's Changed
* Add batch delete requests method for request queue (for now experimental)
* Add support for `schema` parameter in key-value store and dataset `getOrCreate` function
* Make `RequestQueueClientListItem.method` strictly typed
* Fix: Correct types and validation for `tasks().create`
* Fix: Add missing override modifier for error cause
* Fix: Updated incorrect RunCollectionClient list status type


**Full Changelog**: https://github.com/apify/apify-client-js/compare/v2.2.0...v2.3.0
## [v2.2.0](https://github.com/apify/apify-client-js/releases/tag/v2.2.0)
### What's Changed
* feat: Add support for the `view` parameter in dataset items client by [@fnesveda](https://github.com/fnesveda) in [#226](https://github.com/apify/apify-client-js/pull/226)
* fix: fields ending in `At` are Date objects by [@vladfrangu](https://github.com/vladfrangu) in [#230](https://github.com/apify/apify-client-js/pull/230)
* feat: add option to set timeout for request queue client by [@AndreyBykov](https://github.com/AndreyBykov) in [#232](https://github.com/apify/apify-client-js/pull/232)

**Full Changelog**: https://github.com/apify/apify-client-js/compare/v2.1.0...v2.2.0
## [v2.1.0](https://github.com/apify/apify-client-js/releases/tag/v2.1.0)
### What's Changed
* feat: Add clients for actor env vars by [@jirimoravcik](https://github.com/jirimoravcik) in [#202](https://github.com/apify/apify-client-js/pull/202)
* feat: Implement method for request batch insert endpoint by [@valekjo](https://github.com/valekjo) in [#211](https://github.com/apify/apify-client-js/pull/211)
* chore: Add missing breaking change by [@drobnikj](https://github.com/drobnikj) in [#224](https://github.com/apify/apify-client-js/pull/224)
### New Contributors
* [@valekjo](https://github.com/valekjo) made their first contribution in [#211](https://github.com/apify/apify-client-js/pull/211)

**Full Changelog**: https://github.com/apify/apify-client-js/compare/v2.0.7...v2.1.0
## [v2.0.7](https://github.com/apify/apify-client-js/releases/tag/v2.0.7)
### What's Changed
* types(Task): input is optional by [@vladfrangu](https://github.com/vladfrangu) in [#223](https://github.com/apify/apify-client-js/pull/223)


**Full Changelog**: https://github.com/apify/apify-client-js/compare/v2.0.6...v2.0.7
## [v2.0.6](https://github.com/apify/apify-client-js/releases/tag/v2.0.6)
### What's Changed
* fix: correct validation for Task call & start, and loosen up KeyValueStore getRecord options by [@vladfrangu](https://github.com/vladfrangu) in [#222](https://github.com/apify/apify-client-js/pull/222)


**Full Changelog**: https://github.com/apify/apify-client-js/compare/v2.0.5...v2.0.6
## [v2.0.5](https://github.com/apify/apify-client-js/releases/tag/v2.0.5)
### What's Changed
* fix: correct type for webhook event type by [@vladfrangu](https://github.com/vladfrangu) in [#221](https://github.com/apify/apify-client-js/pull/221)


**Full Changelog**: https://github.com/apify/apify-client-js/compare/v2.0.4...v2.0.5
## [v2.0.4](https://github.com/apify/apify-client-js/releases/tag/v2.0.4)
### What's Changed
* chore: fix some annoying types by [@vladfrangu](https://github.com/vladfrangu) in [#218](https://github.com/apify/apify-client-js/pull/218)
* fix: unnamed storages by [@mnmkng](https://github.com/mnmkng) in [#219](https://github.com/apify/apify-client-js/pull/219)


**Full Changelog**: https://github.com/apify/apify-client-js/compare/v2.0.3...v2.0.4
## [v2.0.3](https://github.com/apify/apify-client-js/releases/tag/v2.0.3)
### What's Changed
* chore: make Datasets support generics by [@vladfrangu](https://github.com/vladfrangu) in [#214](https://github.com/apify/apify-client-js/pull/214)


**Full Changelog**: https://github.com/apify/apify-client-js/compare/v2.0.2...v2.0.3
## [v2.0.2](https://github.com/apify/apify-client-js/releases/tag/v2.0.2)
- added export for `package.json`

**Full Changelog**: https://github.com/apify/apify-client-js/compare/v2.0.1...v2.0.2
## [v2.0.1](https://github.com/apify/apify-client-js/releases/tag/v2.0.1)
- TypeScript rewrite

**Full Changelog**: https://github.com/apify/apify-client-js/compare/v1.4.2...v2.0.1
## [v1.4.2](https://github.com/apify/apify-client-js/releases/tag/v1.4.2)
* Fix: Exposing token on ApifyClient instance
## [v1.4.1](https://github.com/apify/apify-client-js/releases/tag/v1.4.1)
* Changed passing token using request HTTP header instead of the request parameter for every API calls
## [v1.3.0](https://github.com/apify/apify-client-js/releases/tag/v1.3.0)
- Added new method `.test()` to the `WebhookClient` class.
## [v1.2.6](https://github.com/apify/apify-client-js/releases/tag/v1.2.6)
* Added gracefully parameter for abort run function
* Enabled access to actor run storages via RunClient
## [v1.2.4](https://github.com/apify/apify-client-js/releases/tag/v1.2.4)
- use new `apify-shared` packages to reduce bundle size
## [v1.2.3](https://github.com/apify/apify-client-js/releases/tag/v1.2.3)
- Fixed invalid max body length setting thanks to a transitive default in `axios`.
## [v1.2.2](https://github.com/apify/apify-client-js/releases/tag/v1.2.2)
- Fixed double stringification of JSON inputs in `.start()`, `.call()` and `.metamorph()` functions.
## [v1.2.1](https://github.com/apify/apify-client-js/releases/tag/v1.2.1)
- Added missing function serialization to `.metamorph()`. See 1.2.0 release.
## [v1.2.0](https://github.com/apify/apify-client-js/releases/tag/v1.2.0)
- Added function serialization to `.start()` and `.call()` function inputs. You can now define input functions as JS functions instead of having to type them out as a string.
- Added validation for resource IDs to be non-empty. This is non-breaking and prevents cryptic errors like `We have bad news: there is no API endpoint at this URL.`
## [v1.1.1](https://github.com/apify/apify-client-js/releases/tag/v1.1.1)
- Fixed slow parsing of large responses due to a [bug in `axios`](https://github.com/axios/axios/issues/2829).
## [v1.1.0](https://github.com/apify/apify-client-js/releases/tag/v1.1.0)
- Added timeout, memory, and build parameters to `client.run.resurrect()`
- Deprecated `disableRedirect` option for `kvs.setRecord()`
- Updated `apify-shared` version to resolve a sub-dependency vulnerability.
