import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

const hashtags = ['zebra', 'lion', 'hippo'];

// Create one task per input. Tasks are saved on the Apify platform and can be run many times.
const tasks = await Promise.all(
    hashtags.map(async (hashtag) =>
        client.tasks().create({
            actId: 'apify/instagram-hashtag-scraper',
            name: `hashtags-${hashtag}`,
            input: { hashtags: [hashtag], resultsLimit: 20 },
            options: { memoryMbytes: 1024 },
        }),
    ),
);

console.log('Tasks created:', tasks);

// Run all tasks in parallel and wait for them to finish.
const runs = await Promise.all(tasks.map(async (task) => client.task(task.id).call()));

console.log('Task runs:', runs);
