/**
 * The schemas the resource clients validate API responses with.
 *
 * Nearly all of them are the generated ones, re-exported as they are. The few declared here widen a generated
 * schema where the API is known to return something the specification does not describe -- the same
 * deviations `models.ts` records as `*SpecNarrowings` and `*ClientConversions` -- so a response the published
 * types already allow for is not rejected at runtime. Each override shadows the generated export of the same
 * name, and every schema that embeds an overridden one is rebuilt on top of it. `spec_guards.ts` checks that
 * each override still accepts what the specification describes, so one cannot narrow by accident.
 *
 * Spec gaps need no counterpart here: the generated objects are loose, so a field the specification omits
 * passes through. Neither do client narrowings: a schema only ever accepts more than the published type.
 *
 * The overrides reach into `.shape` on purpose. Extending with a key the generated schema no longer has
 * would silently add it back; reading the key first turns that into a compile error, the moment the
 * specification drops or renames the field.
 */

import { z } from 'zod';

import * as generated from './generated/schemas';

export * from './generated/schemas';

// Spec omits the `null` the API can return for a storage -- or a run -- that follows the owner's user
// setting instead of carrying an access level of its own.
export const Dataset = generated.Dataset.extend({
    generalAccess: generated.Dataset.shape.generalAccess.nullable(),
});
export const DatasetListItem = generated.DatasetListItem.extend({
    generalAccess: generated.DatasetListItem.shape.generalAccess.nullable(),
});
export const ListOfDatasets = generated.ListOfDatasets.extend({ items: z.array(DatasetListItem) });

export const KeyValueStore = generated.KeyValueStore.extend({
    generalAccess: generated.KeyValueStore.shape.generalAccess.nullable(),
});
export const ListOfKeyValueStores = generated.ListOfKeyValueStores.extend({ items: z.array(KeyValueStore) });

export const RequestQueue = generated.RequestQueue.extend({
    generalAccess: generated.RequestQueue.shape.generalAccess.nullable(),
});
export const RequestQueueShort = generated.RequestQueueShort.extend({
    generalAccess: generated.RequestQueueShort.shape.generalAccess.nullable(),
});
export const ListOfRequestQueues = generated.ListOfRequestQueues.extend({ items: z.array(RequestQueueShort) });

export const Run = generated.Run.extend({
    generalAccess: generated.Run.shape.generalAccess.nullable().optional(),
});

// The spec types all three as non-nullable, but they are paths into the Actor's source tree that the API
// reports as `null` when the referenced file is absent.
export const ActorDefinition = generated.ActorDefinition.extend({
    readme: generated.ActorDefinition.shape.readme.nullable(),
    input: generated.ActorDefinition.shape.input.nullable(),
    changelog: generated.ActorDefinition.shape.changelog.nullable(),
});
export const Build = generated.Build.extend({ actorDefinition: ActorDefinition.nullable().optional() });

// The spec models the input as a plain JSON object, but the API stores and returns an array of objects
// just as well, and the client has always accepted one on update.
export const Task = generated.Task.extend({
    input: z
        .union([generated.TaskInput, z.array(generated.TaskInput)])
        .nullable()
        .optional(),
});

// `plan`, `effectivePlatformFeatures` and `isPaying` are required on the spec's `UserPrivateInfo`, but the
// client validates `GET /v2/users/{userId}` against the same schema, and that response carries none of them.
export const UserPrivateInfo = generated.UserPrivateInfo.partial({
    plan: true,
    effectivePlatformFeatures: true,
    isPaying: true,
});

// `UserClient.monthlyUsage()` has `parseDateFields` convert this field along with the `*At` ones, so by the
// time the response is validated it holds a `Date`, not the string the spec describes.
export const DailyServiceUsages = generated.DailyServiceUsages.extend({ date: z.date() });
export const MonthlyUsage = generated.MonthlyUsage.extend({ dailyServiceUsages: z.array(DailyServiceUsages) });
