# API Client Notes

I went ahead and changed quite a lot of things. I don't assume we'll agree on everything, but I wanted to have all the possible options we've touched in the Slack conversation written down and expanded upon, so we can see how it would look. We can always go back a step.

## async iterators

> It's supported in all browsers (if they're kept updated) except Internet Explorer.

It seems like a good idea to make resources iterable. Mainly to give users a much more convenient API to paginate any collection, but also to simplify working with resource properties that are not available in the truncated objects which are returned from `list` operations.

> I made this section quite long to explain my whole thought process so that we can have a discussion right away.

First we must decide where to put the iterator symbol. We could do it directly on the collection like this:

```javascript
for await (const actor of client.actors) {
    // do something for each actor
}
```

But that does not give us any option to configure the iterator. For `actors` it's not that important, but for dataset `items`, it would definitely make sense to be able to add pagination info like `offset` or `limit` so you wouldn't have to iterate the whole dataset every time.

```javascript
const items = client.datasets.items(datasetId, { offset: 50, limit: 100 });
for await (const item of items) {
    // do something for each item 51-151
}
```

But having this only for `items` and not for `actors` feels inconsistent. So we should probably add it too:

```javascript
const actors = client.actors({ my: true, desc: true, limit: 5 });
for await (const actor of actors) {
    // do something for 5 of my newest actors
}
```

But this introduces some complicated merging, decision making and uncertainty.

```javascript
const actors = client.actors({ my: true, desc: true, limit: 5 });
for await (const actor of actors) { ... }

// later somewhere else:
// Do I list everything or does the above limitation
// I've probably already forgotten about still apply?
const unknownActors = await actors.list({ offset: 10 });

// What if I get something that does not make the cut?
// Should it throw?
const actor = await actors.get(idOfActorThatsNotIncludedInTheLimit);
```

Making `client.actors` different from `client.actors()` is a big difference that's easy to miss. And it's also quite annoying programmatically. We would need to work with functions instead of classes.

```javascript
const actors = client.actors({ my: true, desc: true, limit: 5 });
const limitedActors = actors.list();

const unlimitedActors = await client.actors.list();
```

So, to get rid of all this confusion, but still keep the iterators, because I find them really useful, I would separate the collections from the iterators by adding the `entries` property, which is somewhat consistent with the JavaScript iterator API such as `map.entries()` or `set.entries()`:

```javascript
const limitedActors = client.actors.entries({ my: true });
for await (const [id, actor] of limitedActors) {
    // do something with my actors
}

const limitedItems = client.datasets.items(datasetId).entries({ offset: 50 });
for await (const [index, item] of limitedItems) {
    // do something with items 51+
}
```

This would also make it consistent with the `list` operation:

```javascript
// Prepares an iterator to process one item at a time asynchronously
const iterator = client.datasets.items(datasetId).entries({ limit: 10 });

// Loads all 10 items into memory for synchronous processing
const items = await client.datasets.items(datasetId).list({ limit: 10 });
```

It's not as terse as `for await (const actor of client.actors)` but more configurable, more consistent and clear in what it does.

## get vs find (throw vs null vs undefined)

I read an interesting remark that it's better to name methods which return `null` on 404 `find` rather than `get`. What do you think? All our 404 API errors are caught and replaced with `null` in the Client. On the other hand, `find` implies that you can add some query parameters, which you can't with our `get` methods.

If we keep `get` and don't throw, I'd prefer to return `undefined` instead of `null`, because that makes it consistent with how JavaScript behaves on get operations. Also, `typeof null === 'object'`

## merge top level and nested namespaces

See [webhooks](#webhooks) for the proposal.

## actors

```javascript
.actors                                     BASE:   /acts
    .entries([options])                     [id, actor]
    .list([options])                        GET:    /
[*] .create([actor])                        POST:   /
    .get(id)                                GET:    /:actorId
    .update(id, newFields)                  PUT:    /:actorId
    .delete(id)                             DELETE: /:actorId
[*] .run(id, [options])                     POST:   /:actorId/runs
[*] .build(id, [options])                   POST:   /:actorId/builds

    .runs(actorId)
        .entries([options])                 [id, run]
        .list([options])                    GET:    /:actorId/runs
        .get(id)                            GET:    /:actorId/runs/:runId
        .abort(id)                          POST:   /:actorId/runs/:runId/abort
[*]     .metamorph(id, targetId, [options]) POST:   /:actorId/runs/:runId/metamorph
        .resurrect(id)                      POST:   /:actorId/runs/:runId/resurrect

    .builds(actorId)
        .entries([options])                 [id, build]
        .list([options])                    GET:    /:actorId/builds
        .get(id)                            GET:    /:actorId/builds/:buildId
        .abort(id)                          POST:   /:actorId/builds/:buildId/abort

[*] .versions(actorId)
        .entries([options])                 [versionNumber, version]
        .list([options])                    GET:    /:actorId/versions
        .create(version)                    POST:   /:actorId/versions
        .get(versionNumber)                 GET:    /:actorId/versions/:versionNumber
        .update(versionNumber, newFields)   PUT:    /:actorId/versions/:versionNumber
        .delete(versionNumber)              DELETE: /:actorId/versions/:versionNumber

    .webhooks(actorId)
        .entries([options])                 [id, webhook]
        .list([options])                    GET:    /:actorId/webhooks

```

### create

- [API Docs](https://docs.apify.com/api/v2#/reference/actors/actor-collection/create-actor) say that there are three required parameters, but you can create an actor without specifying any of those.
- API Docs also include invalid parameter `my`, which doesn't make sense.

### run and build

- I know those are technically a `runs.create` and `builds.create` endpoints so it should be nested under `runs` and `builds`, but it feels inconvenient that way. We could keep both options for consistency, but it also might be confusing.

#### runs.metamorph

- Either 3 params or `targetActorId` in `options`. Don't know what's better.

### versions

- Probably the only resource/collection that does not use IDs but a custom prop (`versionNumber` which is a `String`) for identification.

#### versions.create

- Requires `versionNumber` + `sourceType` in body, as well as props matching the selected `sourceType`. API Docs don't mention required params, only the source type table hints that all those may actually be required.

## datasets

```javascript
.datasets                                   BASE:   /datasets
    .entries([options])                     [id, dataset]
    .list([options])                        GET:    /
    .getOrCreate([name])                    POST:   /
    .get(id)                                GET:    /:datasetId
[*] .update(id, newFields)                  PUT:    /:datasetId
    .delete(id)                             DELETE: /:datasetId

    .items(datasetId)
        .entries([options])                 [index, item]
[*]     .list([options])                    GET:    /:datasetId/items
[*]     .append(items)                      POST:   /:datasetId/items

```

### update

- Does this even do anything? The docs are totally empty. I guess it can be used to update the `name` of the dataset?

#### items.list

- Currently it's named `getItems` which is not neccessarily bad, but it's not consistent with other `get` functions.

#### items.append

- I figure renaming this from `putItems` makes sense, because `PUT` operations typically create or update. You can't update dataset items and you also can't delete them. I think `append` conveys this best.

## key value stores

```javascript
.keyValueStores                             BASE:   /key-value-stores
    .entries([options])                     [id, keyValueStore]
    .list([options])                        GET:    /
    .getOrCreate([name])                    POST:   /
    .get(id)                                GET:    /:storeId
[*] .update(id, newFields)                  PUT:    /:storeId
    .delete(id)                             DELETE: /:storeId

    .records(keyValueStoreId)
        .entries([options])                 [key, value]
        .listKeys([options])                GET:    /:storeId/keys
        .get(key, [options])                GET:    /:storeId/records/:key
[*]     .set(key, data, [options])          PUT:    /:storeId/records/:key
        .delete(id)                         DELETE: /:storeId/records/:key

```

### update

- Same as update in datasets. Probably only changes name. API Docs are empty.


#### records.set

- Renaming this from `putRecord` to `set` makes it more consistent with well known APIs.

##

## logs

```javascript
.logs                                       BASE:   /logs
    .get(id)                                GET:    /:logId
```

## request queues

```javascript
.requestQueues                              BASE:   /request-queues
    .entries([options])                     [id, requestQueue]
    .list([options])                        GET:    /
    .getOrCreate([name])                    POST:   /
    .get(id)                                GET:    /:queueId
[*] .update(id, newFields)                  PUT:    /:queueId
    .delete(id)                             DELETE: /:queueId

    .requests(requestQueueId)
        .entries(THROWS)                    You cannot iterate requests in the queue.
[*]     .listHead([options])                GET:    /:queueId/head
        .add(request)                       POST:   /:queueId/requests/
        .get(id)                            GET:    /:queueId/requests/:requestId
        .update(id, newFields)              PUT:    /:queueId/requests/:requestId
        .delete(id)                         DELETE: /:queueId/requests/:requestId


```

### update

- Same as dataset and key-value store. No idea what it can do and no docs.

#### requests.listHead

- `getHead` feels inconsistent with other `get` operations which require ID and return a single item.

## schedules

```javascript
.schedules                                  BASE:   /schedules
    .entries([options])                     [id, schedule]
    .list([options])                        GET:    /
    .create(schedule)                       POST:   /
    .get(id)                                GET:    /:scheduleId
    .update(id, newFields)                  PUT:    /:scheduleId
    .delete(id)                             DELETE: /:scheduleId
    .getLog(id)                             GET:    /:scheduleId/log
```

## tasks

```javascript
.tasks                                      BASE:   /actor-tasks
    .entries([options])                     [id, task]
    .list([options])                        GET:    /
    .create(task)                           POST:   /
    .get(id)                                GET:    /:taskId
    .update(id, newFields)                  PUT:    /:taskId
    .delete(id)                             DELETE: /:taskId
[*] .run(id, [options])                     POST:   /:taskId/runs
    .getInput(id)                           GET:    /:taskId/input
    .updateInput(id, newFields)             PUT:    /:taskId/input

    .runs(taskId)
        .entries([options])                 [id, run]
        .list([options])                    GET:    /:taskId/runs

    .webhooks(taskId)
        .entries([options])                 [id, webhook]
        .list(id)                           GET:    /:taskId/webhooks


    ```

### run

- Same as with `actors` it feels inconvenient to have this nested under runs.

## users

```javascript
.users                                      BASE:   /users
    .get(id)                                GET:    /:userId
```

## webhooks

This is an experiment that could be applied across the board. Instead of having separate `webhookDispatches`, we can use `webhook.dispatches()` without a `webhookId` to get a collection not limited to a single webhook. If a `.get(id)` would be called in a limited collection, it would throw if the dispatch does not belong to the webhook.

```javascript
const allMyDispatches = await client.webhooks.dispatches().list();

const webhookSpecific = await client.webhooks.dispatches('fsdjifjsd').list();

// throws: Dispatch with ID: 'abc' does not belong to webhook ID: 'foo', but 'bar'.
const dispatch = await client.webhooks.dispatches('foo').get('bar');
```

This could be applied to other collections such as runs, tasks etc. I reckon it makes the API simpler for the user since they don't have to jump between namespaces to get the same thing and provides extra security with the matching checks.

```javascript
.webhooks                                   BASE:   /webhooks |             /webhook-dispatches
    .entries([options])                     [id, webhook]
    .list([options])                        GET:    /
    .create(webhook)                        POST:   /
    .get(id)                                GET:    /:webhookId
    .update(id, newFields)                  PUT:    /:webhookId
    .delete(id)                             DELETE: /:webhookId

    .dispatches([webhookId])
        .entries([options])                 [id, dispatch]
        .list([options])                    GET     /webhook-dispatches |   GET: /:webhookId/dispatches
        .get(id)                            GET:    /:webhookDispatchId
```

## [removed] webhook dispatches

Removed in favor of `webhook.dispatches`

```javascript
.webhookDispatches                          BASE: /webhook-dispatches
    .entries([options])                     [id, dispatch]
    .list(id)                               GET:    /
    .get(id)                                GET:    /:webhookDispatchId
```

