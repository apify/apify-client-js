---
sidebar_label: 'Retries'
title: 'Retries'
---

Network communication sometimes fails. The client will automatically retry requests that failed due to a network error, an internal error of the Apify API (HTTP 500+), or a rate limit error (HTTP 429). By default, it will retry up to 8 times. The first retry will be attempted after ~500ms, the second after ~1000ms, and so on. You can configure those parameters using the `maxRetries` and `minDelayBetweenRetriesMillis` options of the `ApifyClient` constructor.

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
    token: 'MY-APIFY-TOKEN',
    maxRetries: 8,
    minDelayBetweenRetriesMillis: 500, // 0.5s
    timeoutSecs: 360, // 6 mins
});
```
