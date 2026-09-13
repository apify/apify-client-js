/**
 * The schemas the resource clients validate API responses with.
 *
 * These are the generated ones, plus the overrides declared below. The module is the one place where a generated
 * schema is widened when the API is known to return something the specification does not describe, so a documented
 * deviation never sends a resource client reaching into `./generated` directly. An override shadows the generated
 * export of the same name and takes the same form, a `lazySchema()` thunk built on the generated schema it replaces.
 * Every schema that embeds an overridden one has to be rebuilt on top of it, and `spec_guards.ts` checks that each
 * override still accepts what the specification describes, so one cannot narrow by accident.
 *
 * Most spec gaps need no override: the generated objects are loose, so a field the specification omits passes
 * through. Neither do client narrowings: a schema only ever accepts more than the published type. The exception is a
 * date-time the specification omits, which passes through as the string on the wire while the published model
 * declares a `Date`.
 */

import { z } from 'zod';

import * as generated from './generated/schemas.js';
import { lazySchema } from './lazy_schema.js';

export * from './generated/schemas.js';

/**
 * `RequestQueueSpecGaps` declares `expireAt` on the full request queue as a `Date`, and the specification describes
 * it as a date-time on `RequestQueueShort` alone, so the generated schema would leave it the string on the wire.
 */
export const RequestQueue = lazySchema(() =>
    generated.RequestQueue().extend({ expireAt: z.iso.datetime({ offset: true }).pipe(z.coerce.date()).optional() }),
);

/** Wraps the `RequestQueue` override, as the generated response schema wraps the generated resource. */
export const RequestQueueResponse = lazySchema(() => z.looseObject({ data: RequestQueue() }));
