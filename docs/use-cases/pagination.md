---
sidebar_label: 'Pagination'
title: 'Pagination'
---

Most methods named `list` or `listSomething` return a [`Promise<PaginatedList>`](/reference/interface/PaginatedList).

:::note Expection of pagination

There are some exceptions though, like `listKeys` or `listHead` which paginate differently. 

:::

The results you're looking for are always stored under `items` and you can use the `limit` property to get only a subset of results. Other props are also available, depending on the method.

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

// Resource clients accept an ID of the resource.
const datasetClient = client.dataset('dataset-id');

// Number of items per page
const limit = 1000;
// Initial offset
let offset = 0;
// Array to store all items
let allItems = [];

while (true) {
    const { items, total } = await datasetClient.listItems({ limit, offset });

    console.log(`Fetched ${items.length} items`);

    // Merge new items with other already loaded items
    allItems.push(...items);

    // If there are no more items to fetch, exit the loading
    if (offset + limit >= total) {
        break;
    }

    offset += limit;
}

console.log(`Overall fetched ${allItems.length} items`);
```
