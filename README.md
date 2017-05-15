# Apify Client JS [![Build Status](https://travis-ci.org/Apifier/apify-client-js.svg)](https://travis-ci.org/Apifier/apify-client-js) [![npm version](https://badge.fury.io/js/apify-client.svg)](http://badge.fury.io/js/apify-client)

Apify Client for JavaScript

This package is still a work in progress, stay tuned.

## Installation

```bash
npm install apify-client --save
```

## Usage

```javascript
const ApifyClient = require('apify-client');

// Configuration
const apifyClient = new ApifyClient({ 
    userId: 'jklnDMNKLekk', 
    token: 'SNjkeiuoeD443lpod68dk',
});

// Storages
const store = await apifyClient.keyValueStores.getOrCreateStore({ storeName: 'my-store' });
apifyClient.setOptions({ storeId: store._id });
await apifyClient.keyValueStores.putRecord({
    recordKey: 'foo',
    body: 'bar',
    contentType: 'text/plain',
});
const body = await apifyClient.keyValueStores.getRecord({ recordKey: 'foo' });
const keys = await apifyClient.keyValueStores.getRecordsKeys();
await apifyClient.keyValueStores.deleteRecord({ recordKey: 'foo' });

// Crawler
const crawler = await apifyClient.crawlers.getCrawler({ crawlerId: 'DNjkhrkjnri' });
const execution = await apifyClient.crawlers.startCrawler({ crawlerId: 'DNjkhrkjnri' });
apifyClient.setOptions({ crawlerId: 'DNjkhrkjnri' });
const execution = await apifyClient.crawlers.startCrawler();

// Acts

const act = await apifyClient.acts.getAct({ actId: 'kjnjknDDNkl' });
apifyClient.setOptions({ actId: 'kjnjknDDNkl' });
const build = await apifyClient.acts.buildAct();
const run = await apifyClient.acts.runAct();

```

## Promises, await, callbacks

Every method can be used as either **promise** or with **callback**. If your Node version supports await/async then you can await promise result.

```javascript
const options = { crawlerId: 'DNjkhrkjnri' };

// Awaited promise
try {
    const crawler = await apifyClient.crawlers.getCrawler(options);

    // Do something crawler ...
} catch (err) {
    // Do something with error ...
}

// Promise
apifyClient.crawlers.getCrawler(options)
    .then((crawler) => {
        // Do something crawler ...
    })
    .catch((err) => {
        // Do something with error ...
    });

// Callback
apifyClient.crawlers.getCrawler(options, (err, crawler) => {
    // Do something with error and crawler ...
});
```

## Package maintenance

* `npm run test` to run tests
* `npm run test-cov` to generate test coverage
* `npm run build` to transform ES6/ES7 to ES5 by Babel
* `npm run clean` to clean `build/` directory
* `npm run lint` to lint js using ESLint in Airbnb's Javascript style
* `npm publish` to run Babel, run tests and publish the package to NPM

## License

Apache 2.0

