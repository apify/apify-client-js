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
