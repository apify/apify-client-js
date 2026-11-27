/**
 * The schemas the resource clients validate API responses with.
 *
 * Most of these are the generated ones. This module is the one place where a generated schema is widened
 * when the API is known to return something the specification does not describe, so a documented deviation
 * never sends a resource client reaching into `./generated` directly. An override
 * declared here shadows the generated export of the same name and takes the same form, a `lazySchema()` thunk
 * built on the generated schema it replaces. Every schema that embeds an overridden one has to be rebuilt on
 * top of it, and `spec_guards.ts` checks that each override still produces what the specification describes,
 * so one cannot narrow by accident.
 *
 * Spec gaps need no override: the generated objects are loose, so a field the specification omits passes
 * through. Neither do client narrowings: a schema only ever accepts more than the published type.
 */

import { z } from 'zod';

import * as generated from './generated/schemas.js';
import { lazySchema } from './lazy_schema.js';

export * from './generated/schemas.js';

/** The API returns `actVersion.buildTag` as `null` for some builds, which the specification types as a string. */
export const Build = lazySchema(() => {
    const generatedBuild = generated.Build();
    return generatedBuild.extend({
        actVersion: generatedBuild.shape.actVersion
            .unwrap()
            .extend({ buildTag: z.string().nullable().optional() })
            .optional(),
    });
});

/** Response containing Actor build data. */
export const BuildResponse = lazySchema(() => generated.BuildResponse().extend({ data: Build() }));

/**
 * The API returns `uiState` as `null` once an API update has changed the schedule's `cronExpression` or `timezone`,
 * which the specification types as an object.
 */
export const Schedule = lazySchema(() =>
    generated.Schedule().extend({ uiState: generated.ScheduleUiState().nullable().optional() }),
);

/** Response containing schedule data. */
export const ScheduleResponse = lazySchema(() => generated.ScheduleResponse().extend({ data: Schedule() }));
