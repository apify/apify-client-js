# Changelog

All notable changes to this project will be documented in this file.

<!-- git-cliff-unreleased-start -->
## 2.16.1 - **not yet released**

### 🚀 Features

- Add forcePermissionLevel run option ([#743](https://github.com/apify/apify-client-js/pull/743)) ([693808c](https://github.com/apify/apify-client-js/commit/693808c6dbbf24542f8f86f3d49673b75309e9f6)) by [@tobice](https://github.com/tobice)

### 🐛 Bug Fixes

- Signed storage URLs avoid adding expiresInSecs to query params ([#734](https://github.com/apify/apify-client-js/pull/734)) ([70aff4f](https://github.com/apify/apify-client-js/commit/70aff4fedefc02a1c8c6e5155057e213a8ad6c81)) by [@danpoletaev](https://github.com/danpoletaev)
- Presigned resource urls shouldn&#x27;t follow `baseUrl` ([#745](https://github.com/apify/apify-client-js/pull/745)) ([07b36fb](https://github.com/apify/apify-client-js/commit/07b36fbd46ed74e9c4ad3977cac883af55ad525d)) by [@barjin](https://github.com/barjin), closes [#744](https://github.com/apify/apify-client-js/issues/744)


<!-- git-cliff-unreleased-end -->
## [2.16.0](https://github.com/apify/apify-client-js/releases/tag/v2.16.0) (2025-08-26)

### Refactor

- [**breaking**] Rename expiresInMillis to expiresInSecs in create storage content URL ([#733](https://github.com/apify/apify-client-js/pull/733)) ([a190b72](https://github.com/apify/apify-client-js/commit/a190b72f6f62ffb54898fd74c80981a6967d573f)) by [@danpoletaev](https://github.com/danpoletaev)


## [2.15.1](https://github.com/apify/apify-client-js/releases/tag/v2.15.1) (2025-08-20)

### 🐛 Bug Fixes

- Add recordPublicUrl to KeyValueListItem type ([#730](https://github.com/apify/apify-client-js/pull/730)) ([42dfe64](https://github.com/apify/apify-client-js/commit/42dfe6484e3504aaf46c516bade3d7ff989782ea)) by [@danpoletaev](https://github.com/danpoletaev)


## [2.15.0](https://github.com/apify/apify-client-js/releases/tag/v2.15.0) (2025-08-12)

### 🚀 Features

- Extend status parameter to an array of possible statuses ([#723](https://github.com/apify/apify-client-js/pull/723)) ([0be893f](https://github.com/apify/apify-client-js/commit/0be893f2401a652908aff1ed305736068ee0b421)) by [@JanHranicky](https://github.com/JanHranicky)


## [2.14.0](https://github.com/apify/apify-client-js/releases/tag/v2.14.0) (2025-08-11)

### 🚀 Features

- Add keyValueStore.getRecordPublicUrl ([#725](https://github.com/apify/apify-client-js/pull/725)) ([d84a03a](https://github.com/apify/apify-client-js/commit/d84a03afe6fd49e38d4ca9a6821681e852c73a2a)) by [@danpoletaev](https://github.com/danpoletaev)


## [2.13.0](https://github.com/apify/apify-client-js/releases/tag/v2.13.0) (2025-08-06)

### 🚀 Features

- Add new methods Dataset.createItemsPublicUrl &amp; KeyValueStore.createKeysPublicUrl ([#720](https://github.com/apify/apify-client-js/pull/720)) ([62554e4](https://github.com/apify/apify-client-js/commit/62554e48a8bf6bf1853f356ac84f046fed5945c1)) by [@danpoletaev](https://github.com/danpoletaev)

### 🐛 Bug Fixes

- Add `eventData` to `WebhookDispatch` type ([#714](https://github.com/apify/apify-client-js/pull/714)) ([351f11f](https://github.com/apify/apify-client-js/commit/351f11f268a54532c7003ab099bc0d7d8d9c9ad7)) by [@valekjo](https://github.com/valekjo)
- Sync `@docusaurus` dependencies version [internal] ([#715](https://github.com/apify/apify-client-js/pull/715)) ([3dc9c50](https://github.com/apify/apify-client-js/commit/3dc9c500c84840f13790013ee61642c032ce246f)) by [@katzino](https://github.com/katzino)
- KV store createKeysPublicUrl wrong URL ([#724](https://github.com/apify/apify-client-js/pull/724)) ([a48ec58](https://github.com/apify/apify-client-js/commit/a48ec58e16a36cc8aa188524e4a738c40f5b74e9)) by [@danpoletaev](https://github.com/danpoletaev)


## [2.12.6](https://github.com/apify/apify-client-js/releases/tag/v2.12.6) (2025-06-30)

### 🚀 Features

- Allow sorting of Actors collection ([#708](https://github.com/apify/apify-client-js/pull/708)) ([562a193](https://github.com/apify/apify-client-js/commit/562a193b90ce4f2b05bf166da8fe2dddaa87eb6b)) by [@protoss70](https://github.com/protoss70)

### 🐛 Bug Fixes

- Use appropriate timeouts ([#704](https://github.com/apify/apify-client-js/pull/704)) ([b896bf2](https://github.com/apify/apify-client-js/commit/b896bf2e653e0766ef297f29a35304c1a5f27598)) by [@janbuchar](https://github.com/janbuchar), closes [#685](https://github.com/apify/apify-client-js/issues/685)
- Rename option for new sortBy parameter ([#711](https://github.com/apify/apify-client-js/pull/711)) ([f45dd03](https://github.com/apify/apify-client-js/commit/f45dd037c581a6c0e27fd8c036033b99cec1ba89)) by [@protoss70](https://github.com/protoss70)


## [2.12.5](https://github.com/apify/apify-client-js/releases/tag/v2.12.5) (2025-05-28)

### 🚀 Features

- List kv store keys by collection of prefix ([#688](https://github.com/apify/apify-client-js/pull/688)) ([be25137](https://github.com/apify/apify-client-js/commit/be25137575435547aaf2c3849fc772daf0537450)) by [@MFori](https://github.com/MFori)
- Add unlockRequests endpoint to RequestQueue client ([#700](https://github.com/apify/apify-client-js/pull/700)) ([7c52c64](https://github.com/apify/apify-client-js/commit/7c52c645e2eb66ad97c8daa9791b080bfc747288)) by [@drobnikj](https://github.com/drobnikj)

### 🐛 Bug Fixes

- Add missing &#x27;effectivePlatformFeatures&#x27;, &#x27;createdAt&#x27;, &#x27;isPaying&#x27; to User interface ([#691](https://github.com/apify/apify-client-js/pull/691)) ([e138093](https://github.com/apify/apify-client-js/commit/e1380933476e5336469e5da083d2017147518f88)) by [@metalwarrior665](https://github.com/metalwarrior665)
- Move prettier into `devDependencies` ([#695](https://github.com/apify/apify-client-js/pull/695)) ([1ba903a](https://github.com/apify/apify-client-js/commit/1ba903a1bfa7a95a8c54ef53951db502dfa4b276)) by [@hudson-worden](https://github.com/hudson-worden)


## [2.12.4](https://github.com/apify/apify-client-js/releases/tag/v2.12.4) (2025-05-13)

### 🚀 Features

- Allow overriding timeout of `KVS.setRecord` calls ([#692](https://github.com/apify/apify-client-js/pull/692)) ([105bd68](https://github.com/apify/apify-client-js/commit/105bd6888117a6c64b21a725c536d4992dff099c)) by [@B4nan](https://github.com/B4nan)

### 🐛 Bug Fixes

- Fix `RunCollectionListOptions` status type ([#681](https://github.com/apify/apify-client-js/pull/681)) ([8fbcf82](https://github.com/apify/apify-client-js/commit/8fbcf82bfaca57d087719cf079fc850c6d31daa5)) by [@MatousMarik](https://github.com/MatousMarik)
- **actor:** Add missing &#x27;pricingInfos&#x27; field to Actor object ([#683](https://github.com/apify/apify-client-js/pull/683)) ([4bd4853](https://github.com/apify/apify-client-js/commit/4bd485369ac42d0b72597638c0316a6ca60f9847)) by [@metalwarrior665](https://github.com/metalwarrior665)


## [2.12.3](https://github.com/apify/apify-client-js/releases/tag/v2.12.3) (2025-04-24)

### 🐛 Bug Fixes

- DefaultBuild() returns BuildClient ([#677](https://github.com/apify/apify-client-js/pull/677)) ([8ce72a4](https://github.com/apify/apify-client-js/commit/8ce72a4c90aac421281d14ad0ff25fdecba1d094)) by [@danpoletaev](https://github.com/danpoletaev)


## [2.12.2](https://github.com/apify/apify-client-js/releases/tag/v2.12.2) (2025-04-14)

### 🚀 Features

- Add support for general resource access ([#669](https://github.com/apify/apify-client-js/pull/669)) ([7deba52](https://github.com/apify/apify-client-js/commit/7deba52a5ff96c990254687d6b965fc1a5bf3467)) by [@tobice](https://github.com/tobice)
- Add defaultBuild method ([#668](https://github.com/apify/apify-client-js/pull/668)) ([c494b3b](https://github.com/apify/apify-client-js/commit/c494b3b8b664a88620e9f41c902acba533d636cf)) by [@danpoletaev](https://github.com/danpoletaev)


## [2.12.1](https://github.com/apify/apify-client-js/releases/tag/v2.12.1) (2025-03-11)

### 🚀 Features

- Add maxItems and maxTotalChargeUsd to resurrect ([#652](https://github.com/apify/apify-client-js/pull/652)) ([5fb9c9a](https://github.com/apify/apify-client-js/commit/5fb9c9a35d6ccb7313c5cbbd7d09b19a64d70d8e)) by [@novotnyj](https://github.com/novotnyj)


## [2.11.2](https://github.com/apify/apify-client-js/releases/tag/v2.11.2) (2025-02-03)

### 🚀 Features

- Add dataset.statistics ([#621](https://github.com/apify/apify-client-js/pull/621)) ([6aeb2b7](https://github.com/apify/apify-client-js/commit/6aeb2b7fae041468d125a0c8bbb00804e290143a)) by [@MFori](https://github.com/MFori)
- Added getOpenApiSpecification() to BuildClient ([#626](https://github.com/apify/apify-client-js/pull/626)) ([6248b28](https://github.com/apify/apify-client-js/commit/6248b2844796f93e22404ddea85ee77c1a5b7d50)) by [@danpoletaev](https://github.com/danpoletaev)


## [2.11.1](https://github.com/apify/apify-client-js/releases/tag/v2.11.1) (2025-01-10)

### 🐛 Bug Fixes

- Change type `Build.actorDefinitions` to `Build.actorDefinition` ([#624](https://github.com/apify/apify-client-js/pull/624)) ([611f313](https://github.com/apify/apify-client-js/commit/611f31365727e70f58d899009ff5a05c6b888253)) by [@jirispilka](https://github.com/jirispilka)
- Add ActorRunPricingInfo type ([#623](https://github.com/apify/apify-client-js/pull/623)) ([8880295](https://github.com/apify/apify-client-js/commit/8880295f13c1664ab6ae0b8b3f171025317ea011)) by [@janbuchar](https://github.com/janbuchar)


## [2.11.0](https://github.com/apify/apify-client-js/releases/tag/v2.11.0) (2024-12-16)

### 🚀 Features

- **actor-build:** Add actorDefinition type for actor build detail, deprecate inputSchema and readme. ([#611](https://github.com/apify/apify-client-js/pull/611)) ([123c2b8](https://github.com/apify/apify-client-js/commit/123c2b81c945a0ca6922221598aa73c42cc298d6)) by [@drobnikj](https://github.com/drobnikj)
- Add `charge` method to the run client for &quot;pay per event&quot; ([#613](https://github.com/apify/apify-client-js/pull/613)) ([3d9c64d](https://github.com/apify/apify-client-js/commit/3d9c64d5442b4f8f27c2b19dd98dd3b758944287)) by [@Jkuzz](https://github.com/Jkuzz)
- **request-queue:** Add queueHasLockedRequests and clientKey into RequestQueueClientListAndLockHeadResult ([#617](https://github.com/apify/apify-client-js/pull/617)) ([f58ce98](https://github.com/apify/apify-client-js/commit/f58ce989e431de54eb673e561e407a7066ea2b64)) by [@drobnikj](https://github.com/drobnikj)

### 🐛 Bug Fixes

- **actor:** Correctly set type for ActorTaggedBuilds ([#612](https://github.com/apify/apify-client-js/pull/612)) ([3bda7ee](https://github.com/apify/apify-client-js/commit/3bda7ee741caf2ccfea249a42ed7512cda36bf0b)) by [@metalwarrior665](https://github.com/metalwarrior665)


## [2.10.0](https://github.com/apify/apify-client-js/releases/tag/v2.10.0) (2024-11-01)

### 🚀 Features

- Add user.updateLimits ([#595](https://github.com/apify/apify-client-js/pull/595)) ([bf97c0f](https://github.com/apify/apify-client-js/commit/bf97c0f5bf8d0cbd8decb60382f0605243b00dd5)) by [@MFori](https://github.com/MFori), closes [#329](https://github.com/apify/apify-client-js/issues/329)
- Allow appending custom parts to the user agent ([#602](https://github.com/apify/apify-client-js/pull/602)) ([d07452b](https://github.com/apify/apify-client-js/commit/d07452b7bff83d16b48bf3cfba5b88aa564ffe2b)) by [@B4nan](https://github.com/B4nan)

### 🐛 Bug Fixes

- Allow `null` when updating dataset/kvs/rq `name` ([#604](https://github.com/apify/apify-client-js/pull/604)) ([0034c2e](https://github.com/apify/apify-client-js/commit/0034c2ee63d6d1c6856c4e7786da43d86a3d63ce)) by [@B4nan](https://github.com/B4nan)


## [2.9.7](https://github.com/apify/apify-client-js/releases/tags/v2.9.7) (2024-10-14)

### 🚀 Features

- Rename maxCostPerRunUsd to maxTotalChargeUsd ([#592](https://github.com/apify/apify-client-js/pull/592)) ([4ffd1c6](https://github.com/apify/apify-client-js/commit/4ffd1c620a6fdb0660d6a49a667e67a4840c8e6b)) by [@novotnyj](https://github.com/novotnyj)

## [2.9.5](https://github.com/apify/apify-client-js/releases/tags/v2.9.5) (2024-08-19)

### 🚀 Features

- Add Actor Standby types ([#569](https://github.com/apify/apify-client-js/pull/569)) ([d3ba82b](https://github.com/apify/apify-client-js/commit/d3ba82b5cb700e0a38e8565308ab795ccf39b32f)) by [@jirimoravcik](https://github.com/jirimoravcik)
- Allow `unwind` param to `DatasetClient.listItems()` to be an array ([#576](https://github.com/apify/apify-client-js/pull/576)) ([7ef3b14](https://github.com/apify/apify-client-js/commit/7ef3b146cc8d4bbd0fedaf32da37726420def800)) by [@fnesveda](https://github.com/fnesveda)
- *(client)* Add maxCostPerRun param ([#578](https://github.com/apify/apify-client-js/pull/578)) ([854e776](https://github.com/apify/apify-client-js/commit/854e776e67519ebf9582dd8eecd990f7de402b24)) by [@stetizu1](https://github.com/stetizu1)

### Fix

- Add `isDeprecated` to actor update type ([#566](https://github.com/apify/apify-client-js/pull/566)) ([d6aba08](https://github.com/apify/apify-client-js/commit/d6aba085a04d3a00a495d856490bce46f519b39d)) by [@Jkuzz](https://github.com/Jkuzz)

## [2.9.4](https://github.com/apify/apify-client-js/releases/tags/v2.9.4) (2024-06-26)

### 🚀 Features

- Add smartlook token to docs build [internal] ([#540](https://github.com/apify/apify-client-js/pull/540)) ([4b408bd](https://github.com/apify/apify-client-js/commit/4b408bd0ad90ffa0f05b5d63c2472f1cced0d57f)) by [@HonzaTuron](https://github.com/HonzaTuron)
- Add notifications field to Schedule ([#545](https://github.com/apify/apify-client-js/pull/545)) ([c6f9429](https://github.com/apify/apify-client-js/commit/c6f9429b5bac317da8cdf143343379b1755cf426)) by [@m-murasovs](https://github.com/m-murasovs)
- JavaScript client code examples for platform ([#548](https://github.com/apify/apify-client-js/pull/548)) ([bac3692](https://github.com/apify/apify-client-js/commit/bac36922722ccf89da5ac2f7e47dccb065291e1a)) by [@HonzaTuron](https://github.com/HonzaTuron)
- Added data property to API error object ([#559](https://github.com/apify/apify-client-js/pull/559)) ([3b7c4b7](https://github.com/apify/apify-client-js/commit/3b7c4b73607f40a74f31f39491025c63bc92e40e)) by [@gippy](https://github.com/gippy)

### 🐛 Bug Fixes

- Add missing `isApifyIntegration` field to `Webhook` type ([#523](https://github.com/apify/apify-client-js/pull/523)) ([0af85fc](https://github.com/apify/apify-client-js/commit/0af85fc07939b8418dd867bb69492e742625b568)) by [@omikader](https://github.com/omikader)

## [2.9.2](https://github.com/apify/apify-client-js/releases/tags/v2.9.2) (2024-02-23)

### 🚀 Features

- Add monthlyUsage() and limits() endpoints to UserClients ([#517](https://github.com/apify/apify-client-js/pull/517)) ([2767c8d](https://github.com/apify/apify-client-js/commit/2767c8d18fcffe4ddb0d77105e3ac4acc2394a9b)) by [@tobice](https://github.com/tobice)
- Parse monthlyUsage.dailyServiceUsages[].date as Date ([#519](https://github.com/apify/apify-client-js/pull/519)) ([980d958](https://github.com/apify/apify-client-js/commit/980d958ee5e6bf8610f7ce08fb282e126c68fa82)) by [@tobice](https://github.com/tobice)

## [2.9.1](https://github.com/apify/apify-client-js/releases/tags/v2.9.1) (2024-02-20)

### 🐛 Bug Fixes

- Ensure axios headers are instance of AxiosHeaders via interceptor ([#515](https://github.com/apify/apify-client-js/pull/515)) ([1f4633f](https://github.com/apify/apify-client-js/commit/1f4633f00fd318eab20d0c66dad4be484d46a4ef)) by [@B4nan](https://github.com/B4nan)

## [2.9.0](https://github.com/apify/apify-client-js/releases/tags/v2.9.0) (2024-02-16)

### 🚀 Features

- Add `KeyValueStore.recordExists()` method ([#510](https://github.com/apify/apify-client-js/pull/510), closes [#507](https://github.com/apify/apify-client-js/issues/507)) ([069d620](https://github.com/apify/apify-client-js/commit/069d620e37035fca5f6cb8a1a1b7d0fa1644bbca)) by [@barjin](https://github.com/barjin)
- Add log() method to BuildClient ([#509](https://github.com/apify/apify-client-js/pull/509)) ([8821df6](https://github.com/apify/apify-client-js/commit/8821df65d79c59e9284786cafec63e1ab87e05d3)) by [@tobice](https://github.com/tobice)
- Add `runs()` and `builds()` top level endpoints ([#468](https://github.com/apify/apify-client-js/pull/468), closes [#296](https://github.com/apify/apify-client-js/issues/296)) ([252d2ac](https://github.com/apify/apify-client-js/commit/252d2ac4e1c1bbb801c5ec570cbd207d30901b7c)) by [@foxt451](https://github.com/foxt451)

### 🐛 Bug Fixes

- Publish browser bundle ([#506](https://github.com/apify/apify-client-js/pull/506)) ([01f9fe1](https://github.com/apify/apify-client-js/commit/01f9fe18cd5572bfa9716019c704d331ef170634)) by [@B4nan](https://github.com/B4nan)
- Update axios to v1.6 ([#505](https://github.com/apify/apify-client-js/pull/505), closes [#501](https://github.com/apify/apify-client-js/issues/501)) ([6567e0c](https://github.com/apify/apify-client-js/commit/6567e0c1ff510628ddec906b064c20e5a4e8c258)) by [@B4nan](https://github.com/B4nan)

## [2.8.6](https://github.com/apify/apify-client-js/releases/tags/v2.8.6) (2024-02-02)

### 🚀 Features

- *(request-queue)* Limit payload size for batchAddRequests() ([#489](https://github.com/apify/apify-client-js/pull/489), closes [#446](https://github.com/apify/apify-client-js/issues/446)) ([164c9c7](https://github.com/apify/apify-client-js/commit/164c9c71ab6a0232f58ff76360c2b0d73fc38775)) by [@drobnikj](https://github.com/drobnikj)

### 🐛 Bug Fixes

- Replace ReadableStream with Readable ([#463](https://github.com/apify/apify-client-js/pull/463), closes [#240](https://github.com/apify/apify-client-js/issues/240)) ([6f6deb7](https://github.com/apify/apify-client-js/commit/6f6deb70025eeeb439a8361c80bcb7485696b0d1)) by [@foxt451](https://github.com/foxt451)
- Add missing properties to `ActorCollectionCreateOptions` type ([#486](https://github.com/apify/apify-client-js/pull/486)) ([623b516](https://github.com/apify/apify-client-js/commit/623b51677a6e748446f552db39d91093be40032c)) by [@jirimoravcik](https://github.com/jirimoravcik)

## [2.8.4](https://github.com/apify/apify-client-js/releases/tags/v2.8.4) (2023-11-20)

### 🐛 Bug Fixes

- *(schedule)* Expose other fields when id optional ([#451](https://github.com/apify/apify-client-js/pull/451)) ([abe9d51](https://github.com/apify/apify-client-js/commit/abe9d518160da98ce43216a1cdec1b2289799e9c)) by [@omikader](https://github.com/omikader)

## [2.8.2](https://github.com/apify/apify-client-js/releases/tags/v2.8.2) (2023-10-30)

### 🚀 Features

- Add how to install javascript Apify client ([#440](https://github.com/apify/apify-client-js/pull/440)) ([b79e463](https://github.com/apify/apify-client-js/commit/b79e463a906f09d7544ead998f5ac5ced1f6c9b0)) by [@webrdaniel](https://github.com/webrdaniel)

### 🐛 Bug Fixes

- *(types)* `ScheduleCreateOrUpdateData` should have `id` as optional ([#276](https://github.com/apify/apify-client-js/pull/276)) ([e59ff10](https://github.com/apify/apify-client-js/commit/e59ff10ad4569811d4554c3d73bf6800ecef5cef)) by [@magne4000](https://github.com/magne4000)

## [2.8.1](https://github.com/apify/apify-client-js/releases/tags/v2.8.1) (2023-10-11)

### 🚀 Features

- Add new webhook fields ([#426](https://github.com/apify/apify-client-js/pull/426)) ([44ced4d](https://github.com/apify/apify-client-js/commit/44ced4d6d12cc71308e669377e6fa488978854f1)) by [@m-murasovs](https://github.com/m-murasovs)
- Add delete to runs and builds ([#428](https://github.com/apify/apify-client-js/pull/428)) ([a399663](https://github.com/apify/apify-client-js/commit/a3996638f1f342805df19f721f9f284d29b669c1)) by [@Jkuzz](https://github.com/Jkuzz)

### 🐛 Bug Fixes

- Don't parse non-date strings ([#412](https://github.com/apify/apify-client-js/pull/412), closes [#406](https://github.com/apify/apify-client-js/issues/406)) ([97cf657](https://github.com/apify/apify-client-js/commit/97cf6576b01dcb1892cf84c48c5bb98ed7451b2c)) by [@barjin](https://github.com/barjin)

## [2.8.0](https://github.com/apify/apify-client-js/releases/tags/v2.8.0) (2023-09-08)

### 🚀 Features

- Add Actor reboot method ([#408](https://github.com/apify/apify-client-js/pull/408)) ([be21c82](https://github.com/apify/apify-client-js/commit/be21c82ce9c852fc594a250d8bf9b7aaae0d61a7)) by [@jirimoravcik](https://github.com/jirimoravcik)

### 🐛 Bug Fixes

- *(docs)* Fix docs for 2.7 version ([00fca1e](https://github.com/apify/apify-client-js/commit/00fca1eacc71c2076c9cca45fc48620010afe8b8)) by [@drobnikj](https://github.com/drobnikj)

## [2.7.2](https://github.com/apify/apify-client-js/releases/tags/v2.7.2) (2023-08-28)

### 🚀 Features

- Rename APIFY_ACTOR_MAX_ITEMS to ACTOR_MAX_PAID_DATASET_ITEMS ([#353](https://github.com/apify/apify-client-js/pull/353)) ([36d6c20](https://github.com/apify/apify-client-js/commit/36d6c208cb9edac4f8b1f0f61ee9cf42b8aa9e6e)) by [@novotnyj](https://github.com/novotnyj)
- *(runs, builds)* Add usage usd into actor run and build types ([#355](https://github.com/apify/apify-client-js/pull/355)) ([a6be0b8](https://github.com/apify/apify-client-js/commit/a6be0b89fbccc7592590cc4685e483d5a976a301)) by [@drobnikj](https://github.com/drobnikj)
- Add shouldInterpolateStrings field to webhook type ([#358](https://github.com/apify/apify-client-js/pull/358)) ([ad1f204](https://github.com/apify/apify-client-js/commit/ad1f2049f8f038681da6457d1e85bd56c29db99b)) by [@valekjo](https://github.com/valekjo)
- Use Actor/Apify env vars instead of `ENV_VARS` ([#373](https://github.com/apify/apify-client-js/pull/373)) ([b2743f5](https://github.com/apify/apify-client-js/commit/b2743f5b475631a2ba0171f8e94e82a3ac73da8e)) by [@jirimoravcik](https://github.com/jirimoravcik)
- Added StoreCollectionClient class useful for listing Actors in Apify Store ([#395](https://github.com/apify/apify-client-js/pull/395)) ([5ffd98b](https://github.com/apify/apify-client-js/commit/5ffd98b48eccffbf9dd1ef94a1bcf6d49ebefc02)) by [@drobnikj](https://github.com/drobnikj)

### 🐛 Bug Fixes

- *(docs)* Fix docs for resource clients to hide constructor ([#397](https://github.com/apify/apify-client-js/pull/397)) ([bffb2a2](https://github.com/apify/apify-client-js/commit/bffb2a2a7b5fee01add8ddc26d0372739c453d3a)) by [@drobnikj](https://github.com/drobnikj)

## [2.7.1](https://github.com/apify/apify-client-js/releases/tags/v2.7.1) (2023-04-06)

### 🐛 Bug Fixes

- Add `types` to package `exports` ([#349](https://github.com/apify/apify-client-js/pull/349)) ([930ea84](https://github.com/apify/apify-client-js/commit/930ea84c4754b8f05dd199c792cf2b9f26b5a077)) by [@B4nan](https://github.com/B4nan)

## [2.7.0](https://github.com/apify/apify-client-js/releases/tags/v2.7.0) (2023-03-14)

### 🚀 Features

- Add support for `maxItems` in run options ([#330](https://github.com/apify/apify-client-js/pull/330)) ([9442187](https://github.com/apify/apify-client-js/commit/94421873ea1b8425e5c3178829bc0490ed4e7685)) by [@novotnyj](https://github.com/novotnyj)
- *(repo)* Repository links ([#335](https://github.com/apify/apify-client-js/pull/335)) ([8c30566](https://github.com/apify/apify-client-js/commit/8c30566c97170b04b41f80b04d383218449e5a42)) by [@drobnikj](https://github.com/drobnikj)
- *(requestQueue)* Request queue v2 features release ([#334](https://github.com/apify/apify-client-js/pull/334)) ([bde2ac7](https://github.com/apify/apify-client-js/commit/bde2ac71433437eaf1c48c03ba2d0bf25d64af21)) by [@drobnikj](https://github.com/drobnikj)
- Add "standard" handing for setStatusMessage ([#333](https://github.com/apify/apify-client-js/pull/333)) ([4dab74a](https://github.com/apify/apify-client-js/commit/4dab74a60eb701d74832dd6f91201bf33df2cdfb)) by [@barjin](https://github.com/barjin)

### 🐛 Bug Fixes

- Fix isAtHome value in User-Agent header ([#286](https://github.com/apify/apify-client-js/pull/286)) ([5232c1b](https://github.com/apify/apify-client-js/commit/5232c1b4b62cdb31b7509b6309d802f5d92eabbc)) by [@mvolfik](https://github.com/mvolfik)
- *(actor)* Fix types for actor run ([#331](https://github.com/apify/apify-client-js/pull/331)) ([8440f2f](https://github.com/apify/apify-client-js/commit/8440f2fa639917079b66ea97021d218d04970399)) by [@drobnikj](https://github.com/drobnikj)
- Improve reading of the version when using bundlers ([#332](https://github.com/apify/apify-client-js/pull/332), closes [#235](https://github.com/apify/apify-client-js/issues/235)) ([4ac1ba4](https://github.com/apify/apify-client-js/commit/4ac1ba4cd67eb98319428cc6d4587200adf214df)) by [@vladfrangu](https://github.com/vladfrangu)

## [2.6.3](https://github.com/apify/apify-client-js/releases/tags/v2.6.3) (2023-02-14)

### 🚀 Features

- Updating pull request toolkit config [INTERNAL] ([3fc9f85](https://github.com/apify/apify-client-js/commit/3fc9f85881c68e0dbc91a3294b17527c3e160527)) by [@mtrunkat](https://github.com/mtrunkat)
- Updating pull request toolkit config [INTERNAL] ([80008ea](https://github.com/apify/apify-client-js/commit/80008ea77bb16211cc177cae377c8e220cff3ed1)) by [@mtrunkat](https://github.com/mtrunkat)
- IsStatusMessageTerminal in RunUpdate interface ([#306](https://github.com/apify/apify-client-js/pull/306)) ([e60d9a6](https://github.com/apify/apify-client-js/commit/e60d9a691578240b42f4e114800ffb83f636f1c9)) by [@barjin](https://github.com/barjin)

## [2.6.2](https://github.com/apify/apify-client-js/releases/tags/v2.6.2) (2023-01-04)

### 🚀 Features

- Re-export useful types and classes ([#285](https://github.com/apify/apify-client-js/pull/285), closes [#279](https://github.com/apify/apify-client-js/issues/279)) ([868c420](https://github.com/apify/apify-client-js/commit/868c420791e0374413ac8b7848466702753ac6e8)) by [@vladfrangu](https://github.com/vladfrangu)

### 🐛 Bug Fixes

- `Actor.call` and `Task.call` accept `waitSecs` not `waitForFinish` ([#283](https://github.com/apify/apify-client-js/pull/283), closes [#282](https://github.com/apify/apify-client-js/issues/282)) ([1ce8ed5](https://github.com/apify/apify-client-js/commit/1ce8ed5bf0899826c58f248896623f93a18a2a44)) by [@vladfrangu](https://github.com/vladfrangu)
- *(types)* Correct extends clause for Dataset entries ([#284](https://github.com/apify/apify-client-js/pull/284), closes [#267](https://github.com/apify/apify-client-js/issues/267)) ([cb07c3a](https://github.com/apify/apify-client-js/commit/cb07c3a2e9c754045621c5a4dc3103a6708af680)) by [@vladfrangu](https://github.com/vladfrangu)
- Correct docs links for actor env vars, some refactoring ([#287](https://github.com/apify/apify-client-js/pull/287)) ([669d7ac](https://github.com/apify/apify-client-js/commit/669d7ac62537e5b54fa2d1fff3ea475a3ecf6415)) by [@jirimoravcik](https://github.com/jirimoravcik)
- Make ActorUpdateOptions type have optional fields ([#288](https://github.com/apify/apify-client-js/pull/288)) ([46a0e4f](https://github.com/apify/apify-client-js/commit/46a0e4ff59f3b42dc7fee047783ab040e31819f7)) by [@metalwarrior665](https://github.com/metalwarrior665)
- Correctly set default client headers ([#290](https://github.com/apify/apify-client-js/pull/290)) ([08eeae1](https://github.com/apify/apify-client-js/commit/08eeae1f6e04aefb67c01cee9e118bca4941c664)) by [@valekjo](https://github.com/valekjo)

## [2.6.1](https://github.com/apify/apify-client-js/releases/tags/v2.6.1) (2022-10-13)

### 🚀 Features

- Drop single file support ([#257](https://github.com/apify/apify-client-js/pull/257)) ([2b8b3af](https://github.com/apify/apify-client-js/commit/2b8b3afa56c854dd53272d92b0e33010aecba37f)) by [@valekjo](https://github.com/valekjo)
- Update actor types ([#263](https://github.com/apify/apify-client-js/pull/263)) ([cb57822](https://github.com/apify/apify-client-js/commit/cb578225636d54383d2ffbc89f4a8adceb25aa1a)) by [@HonzaTuron](https://github.com/HonzaTuron)
- Add flatten param to Dataset items listing ([#264](https://github.com/apify/apify-client-js/pull/264)) ([0c40ea7](https://github.com/apify/apify-client-js/commit/0c40ea7914586ce87f14ca00fc585900c25deb11)) by [@Strajk](https://github.com/Strajk)
- Add optional title field to task, schedule, key-value store, dataset, and request queue ([#271](https://github.com/apify/apify-client-js/pull/271)) ([46d625b](https://github.com/apify/apify-client-js/commit/46d625b4bd59ff82ad553643aca93a826c7aa6ee)) by [@valekjo](https://github.com/valekjo)

### 🐛 Bug Fixes

- Add tslib dependency ([35d633f](https://github.com/apify/apify-client-js/commit/35d633fa17b8d5ca3dc236a09c49823c3a8e3ee0)) by [@B4nan](https://github.com/B4nan)
- Add `defaultRequestQueueId` property to `ActorRun` type ([#268](https://github.com/apify/apify-client-js/pull/268)) ([2a78dde](https://github.com/apify/apify-client-js/commit/2a78dde3a112eceaeaf431f63670af916c937282)) by [@fnesveda](https://github.com/fnesveda)

2.6.0 / 2022/07/18
==================
- Add `run.update()` method for setting fields on runs. You can update statusMessage of run using this method.
- Fix parsing ApifyError for method called with `forceBuffer` param to `true`.
- Fix stream support, related with axios/axios#1045

2.5.2 / 2022/06/27
===================
- Adjust default parallels and retries for batch add requests

2.5.1 / 2022/06/06
===================
- Add methods to list all requests in queue, `requestQueueClient.listRequests()` and `requestQueueClient.paginateRequests()`.
  The paginate requests returns async iterator, you can use it:
```
for await (const page of rqClient.paginateRequests()) {
  // Do something with page.items
}
```
- Fix ActorRun - correct type for `status`

2.5.0 / 2022/05/23
===================
- Add `origin` param to the last actor/task run endpoints

2.4.1 / 2022/05/11
===================
- Add request queue methods `listAndLockHead()`, `prolongRequestLock()`, `deleteRequestLock()`

2.4.0 / 2022/05/11
===================
- Add exponential backoff to `batchAddRequests`
- Add option `minDelayBetweenUnprocessedRequestsRetriesMillis` to `batchAddRequests`

2.3.1 / 2022/04/28
===================
- Fix: Retries in batch requests insert endpoint

2.3.0 / 2022/04/20
===================
- Add batch delete requests method for request queue (for now experimental)
- Add support for `schema` parameter in key-value store and dataset `getOrCreate` function
- Make `RequestQueueClientListItem.method` strictly typed
- Fix: Correct types and validation for `tasks().create`
- Fix: Add missing override modifier for error cause
- Fix: Updated incorrect RunCollectionClient list status type

2.2.0 / 2022/02/14
===================
- Added support for the (for now experimental) `view` parameter to the dataset items endpoints
- For TypeScript users, the type for the fields that end in `At` (ex.: `createdAt`) have been correctly typed as a Date object instead of a string
- Add option to set custom timeout for RequestQueue client calls.

2.1.0 / 2022/01/26
===================
- Added `ActorEnvVarCollectionClient` and `ActorEnvVarClient`
- Add export for `PaginatedList` interface.
- Experimental: Add method for request queue batch requests insert endpoint

2.0.7 / 2022/01/10
===================
- For TypeScript users, the input type for Task#start and Task#call is now correctly marked as optional

2.0.6 / 2022/01/03
===================
- For TypeScript users, the input type for Task#start and Task#call have been corrected
(these methods expect an optional input of an object, not an object or an array of objects)
- For TypeScript users, the overloads for KeyValueStore#getRecord have been relaxed and their order has been corrected

2.0.5 / 2022/01/03
===================
- For TypeScript users, the `WebhookEventType` type was corrected to represent its correct value.

2.0.4 / 2021/12/XX
===================
- Fix: Unnamed storages can now be created again.

2.0.3 / 2021/11/18
===================
- For TypeScript users, DatasetClients can now take in a generic type parameter that defines the data present in a dataset.

2.0.1 / 2021/10/07
===================
- BREAKING CHANGE: Remove default export for ApifyClient.
Migration from v1.x.x to v2.x.x:
```javascript
// v2.x.x
const { ApifyClient } = require('apify-client');

// v1.x.x
const ApifyClient = require('apify-client');

```
- TypeScript rewrite
- Fix: Exposing token on ApifyClient instance
- Changed passing token using request HTTP header instead of the request parameter for every API calls

1.4.2 / 2021/08/25
===================
- Fix: Exposing token on ApifyClient instance

1.4.1 / 2021/08/24
===================
- Changed passing token using request HTTP header instead of the request parameter for every API calls

1.3.0 / 2021/07/15
===================
- Added new method `.test()` to the `WebhookClient` class

1.2.6 / 2021/06/21
===================
- Added gracefully parameter for abort run function

1.2.5 / 2021/06/15
===================
- Enabled access to actor run storages via `RunClient`

1.2.4 / 2021/06/01
===================
- use new `apify-shared` packages to reduce bundle size

1.2.3 / 2021/05/27
===================
- Fixed invalid max body length setting thanks to a transitive default in `axios`.

1.2.2 / 2021/04/20
===================
- Fixed double stringification of JSON inputs in `.start()`, `.call()` and `.metamorph()` functions.

1.2.1 / 2021/04/20
===================
- Added missing function serialization to `.metamorph()`. See 1.2.0 release.

1.2.0 / 2021/04/20
===================
- Added function serialization to `.start()` and `.call()` function inputs. You can now define input functions as JS functions instead of having to type them out as a string.
- Added validation for resource IDs to be non-empty. This is non-breaking and prevents cryptic errors like `We have bad news: there is no API endpoint at this URL.`

1.1.1 / 2021/04/14
===================
- Fixed slow parsing of large responses due to a [bug in `axios`](https://github.com/axios/axios/issues/2829).

1.1.0 / 2021/04/10
===================
- Added timeout, memory, and build parameters to `client.run.resurrect()`
- Deprecated `disableRedirect` option for `kvs.setRecord()`
- Updated `apify-shared` version to resolve a sub-dependency vulnerability.

1.0.5 / 2021/02/16
===================
- Fix requests timing out too early due to socket timeouts.
- Fix `.call` and `.waitForFinish` waiting infinitely with `waitSecs: 0`.
- Add missing validations to `getOrCreate` methods.
- Remove signed URL uploads from `kvs.setRecord()`

1.0.4 / 2021/02/10
===================
- Omit query params for direct upload URL calls

1.0.3 / 2021/01/29
===================
- Removed limits on max content/body length.

1.0.2 / 2021/01/16
===================
- Fix `axios` security vulnerability by updating version.
- Update `ow` to `0.22.0`.
- Improve docs.

1.0.1 / 2020/12/10
===================
- Removed the `desc` option from `keyValueStoreClient.listKeys()` because Apify API does not support it.

1.0.0 / 2020/12/09
===================
- A complete rewrite of the client. See README.

0.6.0 / 2019/12/05
===================
- Removed legacy Apify Crawler methods that are no longer supported by Apify API.

0.5.26 / 2019/07/24
===================
- Added update method for request queues, datasets and key-value stores.

0.5.23 / 2019/07/24
===================
- Added new method `client.acts.resurrectRun()` that resurrects finished (even failed) actor run.

0.5.20 / 2019/06/18
===================
- `body` and `contentType` parameters of `client.tasks.runTask()` were deprecated in favor of new `input` parameter.
- Added new methods to get and update input of actor task - `client.tasks.getInput()` and `client.tasks.updateInput()`.

0.5.19 / 2019/05/28
===================
- Added `simplified` and `skipFailedPages` parameters to `datasets.getItems()`
  to support legacy crawler produced datasets.

0.5.18 / 2019/05/21
===================
- Added parameter retryOnStatusCodes to define an array of HTTP status codes on which
  client retries the request. Default value is `[429]` (only rate limit exceeded).

0.5.17 / 2019/05/14
===================
- Fix of non-JSON crawler execution results retrieval

0.5.15 / 2019/04/25
===================
- Added support for clientKey parameter to request queue endpoints.

0.5.13 / 2019/04/15
===================
- Fixed a bug where last retry stats would not be saved correctly.

0.5.11 / 2019/04/04
===================
- Client now retries request in a case of an invalid JSON response (incomplete response payload).

0.5.10 / 2019/03/21
===================
- `apifyClient.stats.rateLimitErrors` is now an `Array` and tracks errors per retry count.

0.5.9 / 2019/03/15
==================
- Added `client.tasks.listWebhooks()` to list task webhooks.

0.5.8 / 2019/03/14
==================
- Added `client.webhooks` providing access to Apify webhooks.
- Added `client.webhookDispatches` providing access to Apify webhook dispatches.
- Added `client.acts.listWebhooks()` to list actor webhooks.

0.5.7 / 2019/03/01
==================
- Added exponential backoff to `datasets.getItems()` in a case of "Unexpected end of JSON input" error

0.5.6 / 2019/02/26
==================
- Added more details to `ApifyClientError` for easier debugging
- Added `client.acts.metamorphRun()`, see documentation for more information.

0.5.5 / 2019/01/24
==================
- Improve `.toString()` message of `ApifyClientError`.

0.5.4 / 2019/01/15
==================
- Added `clean`, `skipHidden` and `skipEmpty` parameters to `client.datasets.getItems()` method.

0.5.3 / 2018/12/31
==================
- Increased number of retries for request queue endpoints that may be slower to scale up.

0.5.2 / 2018/12/05
==================
- Fixed getActorVersion method, now returns `null` if version does not exist

0.5.1 / 2018/11/27
==================
- Added `ApifyClient.stats` object that collects various statistics of the API client

0.5.0 / 2018/11/21
==================
- Methods for Apify storages (i.e. key-value stores, datasets and request queues) that use other than GET HTTP method
  now require token parameter.
- `tasks.runTask()` method now allows to overload input and options from actor task configuration.

0.4.0 / 2018/11/06
==================
- All key-value store records with content type `text/*` are now parsed into string.
- Option `promise` to customize Promise implementation is not supported any more.
- All methods now use native promises instead of Bluebird implementation. Make sure that your code doesn't depend on Bluebird.
- All Boolean parameters of v2 endpoints (Actor, Storages) are now truly Boolean and don't accept `1` as `true`.
  Legacy crawler API hasn't changed.
- Added support for actor versions API.
- Endpoint to get items from dataset now passes `encoding: null` to support XSLX format.

0.3.4 / 2018/10/31
==================
- Added support for actor tasks API.

0.3.3 / 2018/10/25
==================
- Requests repeated more than `expBackOffMaxRepeats/2` times are logged.

0.3.1 / 2018-08-06
===================
- Added `client.tasks` providing access to Apify tasks.

0.3.0 / 2018-08-06
===================
- Upgraded NPM dependencies
- Renamed `ApifyError` to `ApifyClientError`

0.2.13 / 2018-08-06
===================
- Added support for more content types to `utils.parseBody()`.

0.2.12 / 2018-08-01
===================
- Added support for pre-serialized data (strings) to `Apify.datasets.putItems()`.

0.2.10 / 2018-05-23
===================
- Added `executionId` parameter to getCrawlerSettings method. You can get crawler settings for specific execution with that.

0.2.9 / 2018-05-10
==================
- Thrown error in a case of failed request now contains details such as `URL`, `method`, ... .

0.2.8 / 2018-04-42
==================
- All date fields (ending with `At`) such as `modifiedAt`, `createdAt`, etc. are now parsed to `Date` object.

0.2.7 / 2018-04-03
==================
- Added `client.requestQueues` providing access to Apify Request Queue.
- RequestQueue / KeyValueStore / Dataset now support `[username]~[store-name]` instead of store ID.

0.2.6 / 2018-03-26
==================
- Added `client.users.getUser()` method that retrieves own accout details including usage and limits.

0.2.0 / 2018-03-09
==================
- WARNING: Method `datasets.getItems()` now returns object PaginationList with items wrapped inside instead of plain items array. This helps to iterate through all the items using pagination. This change is not backward compatible!

0.1.69 / 2018-02-08
===================
- Support for Function type added to `utils.checkParamOrThrow()`

0.1.68 / 2018-02-05
===================
- Updated GitHub repo and Travis CI links

0.1.65 / 2018-01-31
===================
- Datasets group addded
<!-- generated by git-cliff -->