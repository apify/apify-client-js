---
id: pagination
title: Pagination
sidebar_label: Pagination
description: 'Paginate through large result sets and use async iteration with the Apify API client for JavaScript.'
---

Methods that return lists (such as `list()` or `listSomething()`) return a [`PaginatedList`](/reference/interface/PaginatedList) object. Exceptions include `listKeys()` and `listHead()`, which use different pagination mechanisms.

The list results are stored in the `items` property. Use the `limit` parameter to retrieve a specific number of results. Additional properties vary by method—see the method reference for details.

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Resource clients accept an ID of the resource.
const datasetClient = client.dataset('dataset-id');

// Maximum amount of items to fetch in total
const limit = 1000;
// Maximum amount of items to fetch in one API call
const chunkSize = 100;
// Initial offset
const offset = 0;

for await (const item of datasetClient.listItems({ limit, offset, chunkSize })) {
    // Processs individual item
    console.log(item);
}
```
