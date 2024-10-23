# Changelog

All notable changes to this project will be documented in this file.

## [2.9.7](https://github.com/apify/apify-client-js/releases/tags/v2.9.7) (2024-10-14)

### 🚀 Features

- Rename maxCostPerRunUsd to maxTotalChargeUsd ([#592](https://github.com/apify/apify-client-js/pulls/592)) ([4ffd1c6](https://github.com/apify/apify-client-js/commit/4ffd1c620a6fdb0660d6a49a667e67a4840c8e6b)) by [@novotnyj](https://github.com/novotnyj)

## [2.9.5](https://github.com/apify/apify-client-js/releases/tags/v2.9.5) (2024-08-19)

### 🚀 Features

- Add Actor Standby types ([#569](https://github.com/apify/apify-client-js/pulls/569)) ([d3ba82b](https://github.com/apify/apify-client-js/commit/d3ba82b5cb700e0a38e8565308ab795ccf39b32f)) by [@jirimoravcik](https://github.com/jirimoravcik)
- Allow `unwind` param to `DatasetClient.listItems()` to be an array ([#576](https://github.com/apify/apify-client-js/pulls/576)) ([7ef3b14](https://github.com/apify/apify-client-js/commit/7ef3b146cc8d4bbd0fedaf32da37726420def800)) by [@fnesveda](https://github.com/fnesveda)
- *(client)* Add maxCostPerRun param ([#578](https://github.com/apify/apify-client-js/pulls/578)) ([854e776](https://github.com/apify/apify-client-js/commit/854e776e67519ebf9582dd8eecd990f7de402b24)) by [@stetizu1](https://github.com/stetizu1)

### Fix

- Add `isDeprecated` to actor update type ([#566](https://github.com/apify/apify-client-js/pulls/566)) ([d6aba08](https://github.com/apify/apify-client-js/commit/d6aba085a04d3a00a495d856490bce46f519b39d)) by [@Jkuzz](https://github.com/Jkuzz)

## [2.9.4](https://github.com/apify/apify-client-js/releases/tags/v2.9.4) (2024-06-26)

### 🚀 Features

- Add smartlook token to docs build [internal] ([#540](https://github.com/apify/apify-client-js/pulls/540)) ([4b408bd](https://github.com/apify/apify-client-js/commit/4b408bd0ad90ffa0f05b5d63c2472f1cced0d57f)) by [@HonzaTuron](https://github.com/HonzaTuron)
- Add notifications field to Schedule ([#545](https://github.com/apify/apify-client-js/pulls/545)) ([c6f9429](https://github.com/apify/apify-client-js/commit/c6f9429b5bac317da8cdf143343379b1755cf426)) by [@m-murasovs](https://github.com/m-murasovs)
- JavaScript client code examples for platform ([#548](https://github.com/apify/apify-client-js/pulls/548)) ([bac3692](https://github.com/apify/apify-client-js/commit/bac36922722ccf89da5ac2f7e47dccb065291e1a)) by [@HonzaTuron](https://github.com/HonzaTuron)
- Added data property to API error object ([#559](https://github.com/apify/apify-client-js/pulls/559)) ([3b7c4b7](https://github.com/apify/apify-client-js/commit/3b7c4b73607f40a74f31f39491025c63bc92e40e)) by [@gippy](https://github.com/gippy)

### 🐛 Bug Fixes

- Add missing `isApifyIntegration` field to `Webhook` type ([#523](https://github.com/apify/apify-client-js/pulls/523)) ([0af85fc](https://github.com/apify/apify-client-js/commit/0af85fc07939b8418dd867bb69492e742625b568)) by [@omikader](https://github.com/omikader)

## [2.9.2](https://github.com/apify/apify-client-js/releases/tags/v2.9.2) (2024-02-23)

### 🚀 Features

- Add monthlyUsage() and limits() endpoints to UserClients ([#517](https://github.com/apify/apify-client-js/pulls/517)) ([2767c8d](https://github.com/apify/apify-client-js/commit/2767c8d18fcffe4ddb0d77105e3ac4acc2394a9b)) by [@tobice](https://github.com/tobice)
- Parse monthlyUsage.dailyServiceUsages[].date as Date ([#519](https://github.com/apify/apify-client-js/pulls/519)) ([980d958](https://github.com/apify/apify-client-js/commit/980d958ee5e6bf8610f7ce08fb282e126c68fa82)) by [@tobice](https://github.com/tobice)

## [2.9.1](https://github.com/apify/apify-client-js/releases/tags/v2.9.1) (2024-02-20)

### 🐛 Bug Fixes

- Ensure axios headers are instance of AxiosHeaders via interceptor ([#515](https://github.com/apify/apify-client-js/pulls/515)) ([1f4633f](https://github.com/apify/apify-client-js/commit/1f4633f00fd318eab20d0c66dad4be484d46a4ef)) by [@B4nan](https://github.com/B4nan)

## [2.9.0](https://github.com/apify/apify-client-js/releases/tags/v2.9.0) (2024-02-16)

### 🚀 Features

- Add `KeyValueStore.recordExists()` method ([#510](https://github.com/apify/apify-client-js/pulls/510), closes [#507](https://github.com/apify/apify-client-js/issues/507)) ([069d620](https://github.com/apify/apify-client-js/commit/069d620e37035fca5f6cb8a1a1b7d0fa1644bbca)) by [@barjin](https://github.com/barjin)
- Add log() method to BuildClient ([#509](https://github.com/apify/apify-client-js/pulls/509)) ([8821df6](https://github.com/apify/apify-client-js/commit/8821df65d79c59e9284786cafec63e1ab87e05d3)) by [@tobice](https://github.com/tobice)
- Add `runs()` and `builds()` top level endpoints ([#468](https://github.com/apify/apify-client-js/pulls/468), closes [#296](https://github.com/apify/apify-client-js/issues/296)) ([252d2ac](https://github.com/apify/apify-client-js/commit/252d2ac4e1c1bbb801c5ec570cbd207d30901b7c)) by [@foxt451](https://github.com/foxt451)

### 🐛 Bug Fixes

- Publish browser bundle ([#506](https://github.com/apify/apify-client-js/pulls/506)) ([01f9fe1](https://github.com/apify/apify-client-js/commit/01f9fe18cd5572bfa9716019c704d331ef170634)) by [@B4nan](https://github.com/B4nan)
- Update axios to v1.6 ([#505](https://github.com/apify/apify-client-js/pulls/505), closes [#501](https://github.com/apify/apify-client-js/issues/501)) ([6567e0c](https://github.com/apify/apify-client-js/commit/6567e0c1ff510628ddec906b064c20e5a4e8c258)) by [@B4nan](https://github.com/B4nan)

## [2.8.6](https://github.com/apify/apify-client-js/releases/tags/v2.8.6) (2024-02-02)

### 🚀 Features

- *(request-queue)* Limit payload size for batchAddRequests() ([#489](https://github.com/apify/apify-client-js/pulls/489), closes [#446](https://github.com/apify/apify-client-js/issues/446)) ([164c9c7](https://github.com/apify/apify-client-js/commit/164c9c71ab6a0232f58ff76360c2b0d73fc38775)) by [@drobnikj](https://github.com/drobnikj)

### 🐛 Bug Fixes

- Replace ReadableStream with Readable ([#463](https://github.com/apify/apify-client-js/pulls/463), closes [#240](https://github.com/apify/apify-client-js/issues/240)) ([6f6deb7](https://github.com/apify/apify-client-js/commit/6f6deb70025eeeb439a8361c80bcb7485696b0d1)) by [@foxt451](https://github.com/foxt451)
- Add missing properties to `ActorCollectionCreateOptions` type ([#486](https://github.com/apify/apify-client-js/pulls/486)) ([623b516](https://github.com/apify/apify-client-js/commit/623b51677a6e748446f552db39d91093be40032c)) by [@jirimoravcik](https://github.com/jirimoravcik)

## [2.8.4](https://github.com/apify/apify-client-js/releases/tags/v2.8.4) (2023-11-20)

### 🐛 Bug Fixes

- *(schedule)* Expose other fields when id optional ([#451](https://github.com/apify/apify-client-js/pulls/451)) ([abe9d51](https://github.com/apify/apify-client-js/commit/abe9d518160da98ce43216a1cdec1b2289799e9c)) by [@omikader](https://github.com/omikader)

## [2.8.2](https://github.com/apify/apify-client-js/releases/tags/v2.8.2) (2023-10-30)

### 🚀 Features

- Add how to install javascript Apify client ([#440](https://github.com/apify/apify-client-js/pulls/440)) ([b79e463](https://github.com/apify/apify-client-js/commit/b79e463a906f09d7544ead998f5ac5ced1f6c9b0)) by [@webrdaniel](https://github.com/webrdaniel)

### 🐛 Bug Fixes

- *(types)* `ScheduleCreateOrUpdateData` should have `id` as optional ([#276](https://github.com/apify/apify-client-js/pulls/276)) ([e59ff10](https://github.com/apify/apify-client-js/commit/e59ff10ad4569811d4554c3d73bf6800ecef5cef)) by [@magne4000](https://github.com/magne4000)

## [2.8.1](https://github.com/apify/apify-client-js/releases/tags/v2.8.1) (2023-10-11)

### 🚀 Features

- Add new webhook fields ([#426](https://github.com/apify/apify-client-js/pulls/426)) ([44ced4d](https://github.com/apify/apify-client-js/commit/44ced4d6d12cc71308e669377e6fa488978854f1)) by [@m-murasovs](https://github.com/m-murasovs)
- Add delete to runs and builds ([#428](https://github.com/apify/apify-client-js/pulls/428)) ([a399663](https://github.com/apify/apify-client-js/commit/a3996638f1f342805df19f721f9f284d29b669c1)) by [@Jkuzz](https://github.com/Jkuzz)

### 🐛 Bug Fixes

- Don't parse non-date strings ([#412](https://github.com/apify/apify-client-js/pulls/412), closes [#406](https://github.com/apify/apify-client-js/issues/406)) ([97cf657](https://github.com/apify/apify-client-js/commit/97cf6576b01dcb1892cf84c48c5bb98ed7451b2c)) by [@barjin](https://github.com/barjin)

## [2.8.0](https://github.com/apify/apify-client-js/releases/tags/v2.8.0) (2023-09-08)

### 🚀 Features

- Add Actor reboot method ([#408](https://github.com/apify/apify-client-js/pulls/408)) ([be21c82](https://github.com/apify/apify-client-js/commit/be21c82ce9c852fc594a250d8bf9b7aaae0d61a7)) by [@jirimoravcik](https://github.com/jirimoravcik)

### 🐛 Bug Fixes

- *(docs)* Fix docs for 2.7 version ([00fca1e](https://github.com/apify/apify-client-js/commit/00fca1eacc71c2076c9cca45fc48620010afe8b8)) by [@drobnikj](https://github.com/drobnikj)

## [2.7.2](https://github.com/apify/apify-client-js/releases/tags/v2.7.2) (2023-08-28)

### 🚀 Features

- Rename APIFY_ACTOR_MAX_ITEMS to ACTOR_MAX_PAID_DATASET_ITEMS ([#353](https://github.com/apify/apify-client-js/pulls/353)) ([36d6c20](https://github.com/apify/apify-client-js/commit/36d6c208cb9edac4f8b1f0f61ee9cf42b8aa9e6e)) by [@novotnyj](https://github.com/novotnyj)
- *(runs, builds)* Add usage usd into actor run and build types ([#355](https://github.com/apify/apify-client-js/pulls/355)) ([a6be0b8](https://github.com/apify/apify-client-js/commit/a6be0b89fbccc7592590cc4685e483d5a976a301)) by [@drobnikj](https://github.com/drobnikj)
- Add shouldInterpolateStrings field to webhook type ([#358](https://github.com/apify/apify-client-js/pulls/358)) ([ad1f204](https://github.com/apify/apify-client-js/commit/ad1f2049f8f038681da6457d1e85bd56c29db99b)) by [@valekjo](https://github.com/valekjo)
- Use Actor/Apify env vars instead of `ENV_VARS` ([#373](https://github.com/apify/apify-client-js/pulls/373)) ([b2743f5](https://github.com/apify/apify-client-js/commit/b2743f5b475631a2ba0171f8e94e82a3ac73da8e)) by [@jirimoravcik](https://github.com/jirimoravcik)
- Added StoreCollectionClient class useful for listing Actors in Apify Store ([#395](https://github.com/apify/apify-client-js/pulls/395)) ([5ffd98b](https://github.com/apify/apify-client-js/commit/5ffd98b48eccffbf9dd1ef94a1bcf6d49ebefc02)) by [@drobnikj](https://github.com/drobnikj)

### 🐛 Bug Fixes

- *(docs)* Fix docs for resource clients to hide constructor ([#397](https://github.com/apify/apify-client-js/pulls/397)) ([bffb2a2](https://github.com/apify/apify-client-js/commit/bffb2a2a7b5fee01add8ddc26d0372739c453d3a)) by [@drobnikj](https://github.com/drobnikj)

## [2.7.1](https://github.com/apify/apify-client-js/releases/tags/v2.7.1) (2023-04-06)

### 🐛 Bug Fixes

- Add `types` to package `exports` ([#349](https://github.com/apify/apify-client-js/pulls/349)) ([930ea84](https://github.com/apify/apify-client-js/commit/930ea84c4754b8f05dd199c792cf2b9f26b5a077)) by [@B4nan](https://github.com/B4nan)

## [2.7.0](https://github.com/apify/apify-client-js/releases/tags/v2.7.0) (2023-03-14)

### 🚀 Features

- Add support for `maxItems` in run options ([#330](https://github.com/apify/apify-client-js/pulls/330)) ([9442187](https://github.com/apify/apify-client-js/commit/94421873ea1b8425e5c3178829bc0490ed4e7685)) by [@novotnyj](https://github.com/novotnyj)
- *(repo)* Repository links ([#335](https://github.com/apify/apify-client-js/pulls/335)) ([8c30566](https://github.com/apify/apify-client-js/commit/8c30566c97170b04b41f80b04d383218449e5a42)) by [@drobnikj](https://github.com/drobnikj)
- *(requestQueue)* Request queue v2 features release ([#334](https://github.com/apify/apify-client-js/pulls/334)) ([bde2ac7](https://github.com/apify/apify-client-js/commit/bde2ac71433437eaf1c48c03ba2d0bf25d64af21)) by [@drobnikj](https://github.com/drobnikj)
- Add "standard" handing for setStatusMessage ([#333](https://github.com/apify/apify-client-js/pulls/333)) ([4dab74a](https://github.com/apify/apify-client-js/commit/4dab74a60eb701d74832dd6f91201bf33df2cdfb)) by [@barjin](https://github.com/barjin)

### 🐛 Bug Fixes

- Fix isAtHome value in User-Agent header ([#286](https://github.com/apify/apify-client-js/pulls/286)) ([5232c1b](https://github.com/apify/apify-client-js/commit/5232c1b4b62cdb31b7509b6309d802f5d92eabbc)) by [@mvolfik](https://github.com/mvolfik)
- *(actor)* Fix types for actor run ([#331](https://github.com/apify/apify-client-js/pulls/331)) ([8440f2f](https://github.com/apify/apify-client-js/commit/8440f2fa639917079b66ea97021d218d04970399)) by [@drobnikj](https://github.com/drobnikj)
- Improve reading of the version when using bundlers ([#332](https://github.com/apify/apify-client-js/pulls/332), closes [#235](https://github.com/apify/apify-client-js/issues/235)) ([4ac1ba4](https://github.com/apify/apify-client-js/commit/4ac1ba4cd67eb98319428cc6d4587200adf214df)) by [@vladfrangu](https://github.com/vladfrangu)

## [2.6.3](https://github.com/apify/apify-client-js/releases/tags/v2.6.3) (2023-02-14)

### 🚀 Features

- Updating pull request toolkit config [INTERNAL] ([3fc9f85](https://github.com/apify/apify-client-js/commit/3fc9f85881c68e0dbc91a3294b17527c3e160527)) by [@mtrunkat](https://github.com/mtrunkat)
- Updating pull request toolkit config [INTERNAL] ([80008ea](https://github.com/apify/apify-client-js/commit/80008ea77bb16211cc177cae377c8e220cff3ed1)) by [@mtrunkat](https://github.com/mtrunkat)
- IsStatusMessageTerminal in RunUpdate interface ([#306](https://github.com/apify/apify-client-js/pulls/306)) ([e60d9a6](https://github.com/apify/apify-client-js/commit/e60d9a691578240b42f4e114800ffb83f636f1c9)) by [@barjin](https://github.com/barjin)

## [2.6.2](https://github.com/apify/apify-client-js/releases/tags/v2.6.2) (2023-01-04)

### 🚀 Features

- Re-export useful types and classes ([#285](https://github.com/apify/apify-client-js/pulls/285), closes [#279](https://github.com/apify/apify-client-js/issues/279)) ([868c420](https://github.com/apify/apify-client-js/commit/868c420791e0374413ac8b7848466702753ac6e8)) by [@vladfrangu](https://github.com/vladfrangu)

### 🐛 Bug Fixes

- `Actor.call` and `Task.call` accept `waitSecs` not `waitForFinish` ([#283](https://github.com/apify/apify-client-js/pulls/283), closes [#282](https://github.com/apify/apify-client-js/issues/282)) ([1ce8ed5](https://github.com/apify/apify-client-js/commit/1ce8ed5bf0899826c58f248896623f93a18a2a44)) by [@vladfrangu](https://github.com/vladfrangu)
- *(types)* Correct extends clause for Dataset entries ([#284](https://github.com/apify/apify-client-js/pulls/284), closes [#267](https://github.com/apify/apify-client-js/issues/267)) ([cb07c3a](https://github.com/apify/apify-client-js/commit/cb07c3a2e9c754045621c5a4dc3103a6708af680)) by [@vladfrangu](https://github.com/vladfrangu)
- Correct docs links for actor env vars, some refactoring ([#287](https://github.com/apify/apify-client-js/pulls/287)) ([669d7ac](https://github.com/apify/apify-client-js/commit/669d7ac62537e5b54fa2d1fff3ea475a3ecf6415)) by [@jirimoravcik](https://github.com/jirimoravcik)
- Make ActorUpdateOptions type have optional fields ([#288](https://github.com/apify/apify-client-js/pulls/288)) ([46a0e4f](https://github.com/apify/apify-client-js/commit/46a0e4ff59f3b42dc7fee047783ab040e31819f7)) by [@metalwarrior665](https://github.com/metalwarrior665)
- Correctly set default client headers ([#290](https://github.com/apify/apify-client-js/pulls/290)) ([08eeae1](https://github.com/apify/apify-client-js/commit/08eeae1f6e04aefb67c01cee9e118bca4941c664)) by [@valekjo](https://github.com/valekjo)

## [2.6.1](https://github.com/apify/apify-client-js/releases/tags/v2.6.1) (2022-10-13)

### 🚀 Features

- Drop single file support ([#257](https://github.com/apify/apify-client-js/pulls/257)) ([2b8b3af](https://github.com/apify/apify-client-js/commit/2b8b3afa56c854dd53272d92b0e33010aecba37f)) by [@valekjo](https://github.com/valekjo)
- Update actor types ([#263](https://github.com/apify/apify-client-js/pulls/263)) ([cb57822](https://github.com/apify/apify-client-js/commit/cb578225636d54383d2ffbc89f4a8adceb25aa1a)) by [@HonzaTuron](https://github.com/HonzaTuron)
- Add flatten param to Dataset items listing ([#264](https://github.com/apify/apify-client-js/pulls/264)) ([0c40ea7](https://github.com/apify/apify-client-js/commit/0c40ea7914586ce87f14ca00fc585900c25deb11)) by [@Strajk](https://github.com/Strajk)
- Add optional title field to task, schedule, key-value store, dataset, and request queue ([#271](https://github.com/apify/apify-client-js/pulls/271)) ([46d625b](https://github.com/apify/apify-client-js/commit/46d625b4bd59ff82ad553643aca93a826c7aa6ee)) by [@valekjo](https://github.com/valekjo)

### 🐛 Bug Fixes

- Add tslib dependency ([35d633f](https://github.com/apify/apify-client-js/commit/35d633fa17b8d5ca3dc236a09c49823c3a8e3ee0)) by [@B4nan](https://github.com/B4nan)
- Add `defaultRequestQueueId` property to `ActorRun` type ([#268](https://github.com/apify/apify-client-js/pulls/268)) ([2a78dde](https://github.com/apify/apify-client-js/commit/2a78dde3a112eceaeaf431f63670af916c937282)) by [@fnesveda](https://github.com/fnesveda)

## [2.6.0](https://github.com/apify/apify-client-js/releases/tags/v2.6.0) (2022-07-18)

### 🚀 Features

- StatusMessage method using the new API endpoint ([#258](https://github.com/apify/apify-client-js/pulls/258)) ([2fbf802](https://github.com/apify/apify-client-js/commit/2fbf8022357df3176cc6de1dee59e69b30b5c3b4)) by [@barjin](https://github.com/barjin)
- Run.update() for generic run PUT requests ([#259](https://github.com/apify/apify-client-js/pulls/259)) ([56b701e](https://github.com/apify/apify-client-js/commit/56b701eb9b8b2f1a6b03e31a96a943b7d35ecf1e)) by [@barjin](https://github.com/barjin)

### 🐛 Bug Fixes

- Fix parsing ApifyError in case request called with forceBuffer option ([#260](https://github.com/apify/apify-client-js/pulls/260)) ([50d752a](https://github.com/apify/apify-client-js/commit/50d752acc4873bf2e87b1cd5f4da34b191b37584)) by [@drobnikj](https://github.com/drobnikj)
- Fix parsing ApifyError in case request called with forceBuffer option ([c800841](https://github.com/apify/apify-client-js/commit/c80084136b0335c2674cb12fc10e6d0012897cbc)) by [@drobnikj](https://github.com/drobnikj)

## [2.5.1](https://github.com/apify/apify-client-js/releases/tags/v2.5.1) (2022-06-06)

### 🚀 Features

- Add request queue requests list method ([#249](https://github.com/apify/apify-client-js/pulls/249)) ([488bcd8](https://github.com/apify/apify-client-js/commit/488bcd8064df7b78a6bb3815be3440ad1f97ac45)) by [@drobnikj](https://github.com/drobnikj)

### 🐛 Bug Fixes

- *(ActorRun)* Correct type for `status` field ([#254](https://github.com/apify/apify-client-js/pulls/254), closes [#253](https://github.com/apify/apify-client-js/issues/253)) ([fa8c83a](https://github.com/apify/apify-client-js/commit/fa8c83a2e19df76a6a0455085e277e5c691a6b94)) by [@vladfrangu](https://github.com/vladfrangu)

## [2.4.1](https://github.com/apify/apify-client-js/releases/tags/v2.4.1) (2022-05-19)

### 🚀 Features

- Add request queue methods `listAndLockHead`, `prolongRequestLock`, `deleteRequestLock` ([#246](https://github.com/apify/apify-client-js/pulls/246)) ([a1bf7a4](https://github.com/apify/apify-client-js/commit/a1bf7a434046e21f44273fb081276c2e7fa545ba)) by [@drobnikj](https://github.com/drobnikj)

## [2.4.0](https://github.com/apify/apify-client-js/releases/tags/v2.4.0) (2022-05-12)

### 🐛 Bug Fixes

- Add exponential backoff to batchAddRequests, untie batch and client settings ([#243](https://github.com/apify/apify-client-js/pulls/243)) ([3b5563b](https://github.com/apify/apify-client-js/commit/3b5563b55302d1c274294476f9f1e277925170e8)) by [@jirimoravcik](https://github.com/jirimoravcik)

## [2.3.1](https://github.com/apify/apify-client-js/releases/tags/v2.3.1) (2022-04-28)

### 🐛 Bug Fixes

- Bad index of attempt, fixes #241 ([#242](https://github.com/apify/apify-client-js/pulls/242)) ([ac3dfb8](https://github.com/apify/apify-client-js/commit/ac3dfb8d583a45b9876a1318b41c53d9a9396344)) by [@drobnikj](https://github.com/drobnikj)

## [2.3.0](https://github.com/apify/apify-client-js/releases/tags/v2.3.0) (2022-04-20)

### 🚀 Features

- Add schema parameter to getOrCreate for kvs, dataset ([#233](https://github.com/apify/apify-client-js/pulls/233)) ([032ecae](https://github.com/apify/apify-client-js/commit/032ecaebf46bd3d56aca048a8f3d729e2f967398)) by [@jirimoravcik](https://github.com/jirimoravcik)
- Add batch delete requests ([#239](https://github.com/apify/apify-client-js/pulls/239)) ([eee3fba](https://github.com/apify/apify-client-js/commit/eee3fba51bf0d9c8894992a597e727e6e9c9f033)) by [@drobnikj](https://github.com/drobnikj)

### 🐛 Bug Fixes

- *(typings)* Correct types and validation for `tasks().create` ([#231](https://github.com/apify/apify-client-js/pulls/231), closes [#227](https://github.com/apify/apify-client-js/issues/227)) ([1952df9](https://github.com/apify/apify-client-js/commit/1952df911e3510758f9df4c5123eaf86a6b1f986)) by [@vladfrangu](https://github.com/vladfrangu)
- Add missing override modifier for error cause ([#238](https://github.com/apify/apify-client-js/pulls/238)) ([f90e265](https://github.com/apify/apify-client-js/commit/f90e265e513e3ce20094b02fea3655e3581003f3)) by [@vladfrangu](https://github.com/vladfrangu)

## [2.2.0](https://github.com/apify/apify-client-js/releases/tags/v2.2.0) (2022-02-10)

### 🚀 Features

- Add support for the `view` parameter in dataset items client ([#226](https://github.com/apify/apify-client-js/pulls/226)) ([be040ab](https://github.com/apify/apify-client-js/commit/be040abc159b87b52ed2d467547b29ba436e298e)) by [@fnesveda](https://github.com/fnesveda)
- Add option to set timeout for request queue client ([#232](https://github.com/apify/apify-client-js/pulls/232)) ([8f7eeed](https://github.com/apify/apify-client-js/commit/8f7eeed5626e9de4c38bd3baa495c700ff5e2503)) by [@AndreyBykov](https://github.com/AndreyBykov)

### 🐛 Bug Fixes

- Fields ending in `At` are Date objects ([#230](https://github.com/apify/apify-client-js/pulls/230), closes [#228](https://github.com/apify/apify-client-js/issues/228)) ([69eb874](https://github.com/apify/apify-client-js/commit/69eb8747e65527b245d7ab0bbe6642d1d81cdbc7)) by [@vladfrangu](https://github.com/vladfrangu)

## [2.1.0](https://github.com/apify/apify-client-js/releases/tags/v2.1.0) (2022-01-26)

### 🚀 Features

- Add clients for actor env vars ([#202](https://github.com/apify/apify-client-js/pulls/202)) ([f548af2](https://github.com/apify/apify-client-js/commit/f548af24f5455938016d5673c999a0dbe486142d)) by [@jirimoravcik](https://github.com/jirimoravcik)
- Implement method for request batch insert endpoint ([#211](https://github.com/apify/apify-client-js/pulls/211)) ([680d2ff](https://github.com/apify/apify-client-js/commit/680d2ff25218c1695b991200410f288ec05a9f7b)) by [@valekjo](https://github.com/valekjo)

## [2.0.7](https://github.com/apify/apify-client-js/releases/tags/v2.0.7) (2022-01-10)

### Types

- *(Task)* Input is optional ([#223](https://github.com/apify/apify-client-js/pulls/223)) ([e5506de](https://github.com/apify/apify-client-js/commit/e5506decbce0fdbee44da3f691c4ce8498363c98)) by [@vladfrangu](https://github.com/vladfrangu)

## [2.0.6](https://github.com/apify/apify-client-js/releases/tags/v2.0.6) (2022-01-10)

### 🐛 Bug Fixes

- Correct validation for Task call & start, and loosen up KeyValueStore getRecord options ([#222](https://github.com/apify/apify-client-js/pulls/222)) ([00a0d31](https://github.com/apify/apify-client-js/commit/00a0d3197657054dc67daa8edfdc38f7c28cfd80)) by [@vladfrangu](https://github.com/vladfrangu)

## [2.0.5](https://github.com/apify/apify-client-js/releases/tags/v2.0.5) (2022-01-03)

### 🐛 Bug Fixes

- Correct type for webhook event type ([#221](https://github.com/apify/apify-client-js/pulls/221)) ([fc7566d](https://github.com/apify/apify-client-js/commit/fc7566da2a40670bc18b6afc1d62c4f42c2efa25)) by [@vladfrangu](https://github.com/vladfrangu)

## [2.0.4](https://github.com/apify/apify-client-js/releases/tags/v2.0.4) (2021-12-15)

### 🐛 Bug Fixes

- Unnamed storages ([#219](https://github.com/apify/apify-client-js/pulls/219)) ([fadbf1f](https://github.com/apify/apify-client-js/commit/fadbf1fab056717c6223fe63ba6f8deb3f74a320)) by [@mnmkng](https://github.com/mnmkng)

## [2.0.1](https://github.com/apify/apify-client-js/releases/tags/v2.0.1) (2021-10-07)

### 🚀 Features

- Adding x-apify-workflow-key header ([#212](https://github.com/apify/apify-client-js/pulls/212)) ([8655378](https://github.com/apify/apify-client-js/commit/8655378a98bfc9d8f632c763590fcae3fd45a670)) by [@mtrunkat](https://github.com/mtrunkat)

## [1.4.2](https://github.com/apify/apify-client-js/releases/tags/v1.4.2) (2021-08-25)

### 🐛 Bug Fixes

- Expose token on client ([#207](https://github.com/apify/apify-client-js/pulls/207)) ([cb18ed4](https://github.com/apify/apify-client-js/commit/cb18ed4930e0ae508177560317f6a5c6fcd5929f)) by [@drobnikj](https://github.com/drobnikj)

## [1.4.1](https://github.com/apify/apify-client-js/releases/tags/v1.4.1) (2021-08-24)

### 🚀 Features

- Changed passing token using request HTTP header instead of the request parameter for every API calls ([#184](https://github.com/apify/apify-client-js/pulls/184)) ([5e10356](https://github.com/apify/apify-client-js/commit/5e10356e4ffbdf47b4ce23c3233d2b6715095983)) by [@drobnikj](https://github.com/drobnikj)

### 🐛 Bug Fixes

- Build module before publishing in CI ([#186](https://github.com/apify/apify-client-js/pulls/186)) ([6938356](https://github.com/apify/apify-client-js/commit/69383563863607ecfc3c39ac9015045052ddc0d2)) by [@vladfrangu](https://github.com/vladfrangu)
- Correctly mark get functions as possibly returning undefined ([#194](https://github.com/apify/apify-client-js/pulls/194)) ([980b646](https://github.com/apify/apify-client-js/commit/980b64693bbea6ffabf64086a8288a7881641de8)) by [@vladfrangu](https://github.com/vladfrangu)
- Correct type for actor versions ([#199](https://github.com/apify/apify-client-js/pulls/199)) ([2fcb5cb](https://github.com/apify/apify-client-js/commit/2fcb5cbc7b3ab44f0ab19cd247463c129e0c6ddd)) by [@vladfrangu](https://github.com/vladfrangu)
- Revert back passing params using ApifyClient _params method ([#204](https://github.com/apify/apify-client-js/pulls/204)) ([72eb457](https://github.com/apify/apify-client-js/commit/72eb457d1006ccd3b0df5b823e8e071653df2102)) by [@drobnikj](https://github.com/drobnikj)

### ◀️ Revert

- Replace just the first `/` with a `~` in ids ([6900a61](https://github.com/apify/apify-client-js/commit/6900a611000f6985a19b5bc83c8a7ab034d36323)) by [@vladfrangu](https://github.com/vladfrangu)

## [1.2.3](https://github.com/apify/apify-client-js/releases/tags/v1.2.3) (2021-05-27)

### 🐛 Bug Fixes

- Axios maxBodyLength option not working ([#173](https://github.com/apify/apify-client-js/pulls/173)) ([c559b5a](https://github.com/apify/apify-client-js/commit/c559b5a64b09c4ac14202ebe0aff9800debdd771)) by [@mnmkng](https://github.com/mnmkng)

## [1.2.2](https://github.com/apify/apify-client-js/releases/tags/v1.2.2) (2021-04-22)

### 🐛 Bug Fixes

- Double stringification of JSON ([#171](https://github.com/apify/apify-client-js/pulls/171)) ([6a3e065](https://github.com/apify/apify-client-js/commit/6a3e065b0e722ba52da4d307cd6b9d06060a1209)) by [@mnmkng](https://github.com/mnmkng)

## [1.2.1](https://github.com/apify/apify-client-js/releases/tags/v1.2.1) (2021-04-21)

### 🐛 Bug Fixes

- Missing function serialization in metamorph ([#170](https://github.com/apify/apify-client-js/pulls/170)) ([1a087e8](https://github.com/apify/apify-client-js/commit/1a087e87f6b6945e6d723c9c124f024dc9e26ef4)) by [@mnmkng](https://github.com/mnmkng)

## [1.2.0](https://github.com/apify/apify-client-js/releases/tags/v1.2.0) (2021-04-20)

### 🚀 Features

- Add function serialization to actor input ([#169](https://github.com/apify/apify-client-js/pulls/169), closes [#167](https://github.com/apify/apify-client-js/issues/167)) ([59d6e80](https://github.com/apify/apify-client-js/commit/59d6e801ebdd73df2611eb5a9d7954f1bd8edf3f)) by [@mnmkng](https://github.com/mnmkng)

## [1.1.1](https://github.com/apify/apify-client-js/releases/tags/v1.1.1) (2021-04-14)

### 🐛 Bug Fixes

- Slowdown for big responses ([#166](https://github.com/apify/apify-client-js/pulls/166)) ([9625764](https://github.com/apify/apify-client-js/commit/9625764335483ab0d08c8d34168fabdcf12cc712)) by [@mnmkng](https://github.com/mnmkng)

## [1.0.5](https://github.com/apify/apify-client-js/releases/tags/v1.0.5) (2021-02-21)

### SetRecord

- Removed uploading using signed URL ([#159](https://github.com/apify/apify-client-js/pulls/159)) ([c1d3c9c](https://github.com/apify/apify-client-js/commit/c1d3c9cf32a849c09b2dbd280be9494a332653b9)) by [@drobnikj](https://github.com/drobnikj)

## [1.0.4](https://github.com/apify/apify-client-js/releases/tags/v1.0.4) (2021-02-10)

### Fixed

- Omits query params for direct upload URL calls ([#156](https://github.com/apify/apify-client-js/pulls/156)) ([7043c78](https://github.com/apify/apify-client-js/commit/7043c78e1586d38473af9cfeb01f5779d9af1024)) by [@drobnikj](https://github.com/drobnikj)

## [0.3.2](https://github.com/apify/apify-client-js/releases/tags/v0.3.2) (2018-10-22)

### Tasks

- Fixed API path ([62cc8dd](https://github.com/apify/apify-client-js/commit/62cc8dd9281dcdc2ebc17310132d842db7276a61)) by [@gippy](https://github.com/gippy)

## [0.2.1](https://github.com/apify/apify-client-js/releases/tags/v0.2.1) (2018-03-12)

### Datasets

- Get items - add skipHeaderRow option ([a672100](https://github.com/apify/apify-client-js/commit/a6721002eb7b557e064f14555d0e03404f8aaf76)) by [@drobnikj](https://github.com/drobnikj)

### Travis

- Omit node:4 and node:6, avoid to fail because sntp package use async/await in 3.x.x and request depends on it. ([55a2ed7](https://github.com/apify/apify-client-js/commit/55a2ed7bb6b1332260c83e7368ff5754f608de79)) by [@drobnikj](https://github.com/drobnikj)

## [0.2.0](https://github.com/apify/apify-client-js/releases/tags/v0.2.0) (2018-03-09)

### Datasets

- Add pagination ([70418b9](https://github.com/apify/apify-client-js/commit/70418b9ceb1eed9fd21ed2a493ec33c6c259dd98)) by [@drobnikj](https://github.com/drobnikj)
- Update doc ([c6dbb7d](https://github.com/apify/apify-client-js/commit/c6dbb7d663deab02882a21f119f3f0f4a02893cd)) by [@drobnikj](https://github.com/drobnikj)
- Update examples in comments ([a313264](https://github.com/apify/apify-client-js/commit/a3132640aeb3e33929e9dd2bb594701319f549a3)) by [@drobnikj](https://github.com/drobnikj)

## [0.1.54](https://github.com/apify/apify-client-js/releases/tags/v0.1.54) (2017-11-17)

### Crawlers

- Add example for startExecution ([d80efd1](https://github.com/apify/apify-client-js/commit/d80efd1a04495b88d257910246cc3b7d9d8728c2)) by [@drobnikj](https://github.com/drobnikj)
- Pagination list parse int from numbers attributes, fix #37 ([0c15e3e](https://github.com/apify/apify-client-js/commit/0c15e3e4f6ecfc83a07cb33d76d1b0b9af3650d8)) by [@drobnikj](https://github.com/drobnikj)
- Execution results add parameter skipHeaderRow ([afe14d1](https://github.com/apify/apify-client-js/commit/afe14d17e4b4da04f567d00d7a789838908f8388)) by [@drobnikj](https://github.com/drobnikj)
- Fix tests - it fails after parse attributes in pagination list to numbers, #37 ([0e211ab](https://github.com/apify/apify-client-js/commit/0e211ab272ed9625ba3b8e71334ff45ca1f99982)) by [@drobnikj](https://github.com/drobnikj)

## [0.1.53](https://github.com/apify/apify-client-js/releases/tags/v0.1.53) (2017-11-13)

### Crawler

- Add missing params to getExecutionResults, getLastExecutionResults ([de9d5d9](https://github.com/apify/apify-client-js/commit/de9d5d93addc9d5cb0f803d5737b1451de2bc193)) by [@drobnikj](https://github.com/drobnikj)
- Format code ([4b1c51d](https://github.com/apify/apify-client-js/commit/4b1c51de703b447cabb8ec3197788605ecb82ad5)) by [@drobnikj](https://github.com/drobnikj)

## [0.1.7-beta](https://github.com/apify/apify-client-js/releases/tags/v0.1.7-beta) (2017-06-07)

### Fix

- New parameter order in checkParamOrThrow after merge ([8ab6049](https://github.com/apify/apify-client-js/commit/8ab604994ff8749b0d4f726a5b56f82163a80a58)) by [@lubos-turek](https://github.com/lubos-turek)

<!-- generated by git-cliff -->