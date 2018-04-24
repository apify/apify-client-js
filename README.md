# Apify Client JS [![Build Status](https://travis-ci.org/apifytech/apify-client-js.svg)](https://travis-ci.org/apifytech/apify-client-js) [![npm version](https://badge.fury.io/js/apify-client.svg)](http://badge.fury.io/js/apify-client)

Apify Client for JavaScript

This package is still a work in progress, stay tuned.

## Table of Contents

<!-- toc -->

- [Installation](#installation)
- [Usage](#usage)
- [Global configuration](#global-configuration)
- [Promises, await, callbacks](#promises-await-callbacks)
- [Parsing of date fields](#parsing-of-date-fields)
- [Package maintenance](#package-maintenance)
- [License](#license)

<!-- tocstop -->

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
    key: 'foo',
    body: 'bar',
    contentType: 'text/plain',
});
const record = await apifyClient.keyValueStores.getRecord({ key: 'foo' });
const keys = await apifyClient.keyValueStores.getRecordsKeys();
await apifyClient.keyValueStores.deleteRecord({ key: 'foo' });

// Crawler
const crawler = await apifyClient.crawlers.getCrawlerSettings({ crawlerId: 'DNjkhrkjnri' });
const execution = await apifyClient.crawlers.startExecution({ crawlerId: 'DNjkhrkjnri' });
apifyClient.setOptions({ crawlerId: 'DNjkhrkjnri' });
const execution = await apifyClient.crawlers.startExecution();

// Acts
const act = await apifyClient.acts.getAct({ actId: 'kjnjknDDNkl' });
apifyClient.setOptions({ actId: 'kjnjknDDNkl' });
const build = await apifyClient.acts.buildAct();
const run = await apifyClient.acts.runAct();

```

## Global configuration

You can set global parameters when you are creating instance of ApifyClient:

```javascript
const apifyClient = new ApifyClient({
    userId: 'jklnDMNKLekk', // Your Apify user ID
    token: 'SNjkeiuoeD443lpod68dk', // Your API token
    promise: Promise, // Promises dependency to use (default is native Promise)
    expBackOffMillis: 500, // Wait time in milliseconds before making a new request in a case of error
    expBackOffMaxRepeats: 8, // Maximum number of repeats in a case of error
});
```

Tp obtain your user ID and API token please visit your [Apify Account page](https://my.apify.com/account#/integrations).

## Promises, await, callbacks

Every method can be used as either **promise** or with **callback**. If your Node version supports await/async then you can await promise result.

```javascript
const options = { crawlerId: 'DNjkhrkjnri' };

// Awaited promise
try {
    const crawler = await apifyClient.crawlers.getCrawlerSettings(options);

    // Do something crawler ...
} catch (err) {
    // Do something with error ...
}

// Promise
apifyClient.crawlers.getCrawlerSettings(options)
    .then((crawler) => {
        // Do something crawler ...
    })
    .catch((err) => {
        // Do something with error ...
    });

// Callback
apifyClient.crawlers.getCrawlerSettings(options, (err, crawler) => {
    // Do something with error and crawler ...
});
```

## Parsing of date fields

Apify Client automatically parses fields that ends with `At` such as `modifiedAt` or `createdAt` to `Date` object.
This doesn't apply to user generated content such as:

* crawler results
* dataset content
* key-value store records

## Package maintenance

* `npm run test` to run tests
* `npm run test-cov` to generate test coverage
* `npm run build` to transform ES6/ES7 to ES5 by Babel
* `npm run clean` to clean `build/` directory
* `npm run lint` to lint js using ESLint in Airbnb's Javascript style
* `npm publish` to run Babel, run tests and publish the package to NPM

## License

Apache 2.0
