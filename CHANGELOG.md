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
