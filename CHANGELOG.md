xxx
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
