---
sidebar_label: Passing input
title: 'Passing input'
---

The fastest way to get results from an Actor is to pass input directly to the `call` function.
Input can be passed to `call` function and the reference of running Actor (or wait for finish) is available in `runData` variable.

This example starts an Actor that scrapes 20 posts from the Instagram website based on the hashtag.

```javascript
import { ApifyClient } from 'apify-client';

// Client initialization with the API token
const client = new ApifyClient({ token: 'MY_APIFY_TOKEN' });

const actorClient = client.actor('apify/instagram-hashtag-scraper');

const input = { hashtags: ['rainbow'], resultsLimit: 20 };

// Run the Actor and wait for it to finish up to 60 seconds.
// Input is not persisted for next runs.
const runData = await actorClient.call(input, { waitSecs: 60 });

console.log('Run data:');
console.log(runData);
```

### Run multiple inputs

To run multiple inputs with the same Actor, most convenient way is to create multiple [tasks](https://docs.apify.com/platform/actors/running/tasks) with different inputs. Task input is persisted on Apify platform when task is created.

```javascript
import { ApifyClient } from 'apify-client';

// Client initialization with the API token
const client = new ApifyClient({ token: 'MY_APIFY_TOKEN' });

const animalsHashtags = ['zebra', 'lion', 'hippo'];

// Multiple input schemas for one Actor can be persisted in tasks.
// Tasks are saved in the Apify platform and can be run multiple times.
const socialsTasksPromises = animalsHashtags.map((hashtag) =>
    client.tasks().create({
        actId: 'apify/instagram-hashtag-scraper',
        name: `hashtags-${hashtag}`,
        input: { hashtags: [hashtag], resultsLimit: 20 },
        options: { memoryMbytes: 1024 },
    }),
);

// Create all tasks in parallel
const createdTasks = await Promise.all(socialsTasksPromises);

console.log('Created tasks:');
console.log(createdTasks);

// Run all tasks in parallel
await Promise.all(createdTasks.map((task) => client.task(task.id).call()));
```
