/**
 * Compile-time guards that fail `pnpm build:node` when the OpenAPI spec drifts away from an assumption
 * the hand-written models depend on.
 *
 * These live in their own module for two reasons. `noUnusedLocals` rejects a non-exported type alias
 * that nothing references, and exporting them from a module that `src/index.ts` re-exports would grow
 * the public API. Nothing imports this file -- `tsconfig.json` includes all of `src`, so being part of
 * the program is enough for the assertions to be checked.
 *
 * When one of these fails, the fix is a deliberate decision, not a mechanical update: either the shared
 * `@apify/consts` value is stale, or a published type needs a new member, or the spec regressed.
 */

import type { STORAGE_GENERAL_ACCESS, ValueOf, WEBHOOK_DISPATCH_STATUSES } from '@apify/consts';

import type { components } from './generated/api';
import type {
    DatasetSpecGaps,
    DatasetSpecNarrowings,
    DatasetStatisticsRePointed,
    DatasetStatsSpecGaps,
    WebhookDispatch,
    WebhookDispatchRePointed,
    WebhookDispatchStatus,
} from './models';
import type { WebhookEventType } from './resource_clients/webhook';

type Schemas = components['schemas'];

/** Resolves to `true` only for mutually assignable types, so a near-miss still fails. */
type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/** Fails to compile unless every member of the tuple is exactly `true`. */
type AssertAll<T extends true[]> = T;

/**
 * Every key an override block replaces must still exist in the schema it overrides.
 *
 * Without this, dropping a field upstream is invisible: `Omit<T, keyof Override>` of a key that no longer
 * exists is a silent no-op, and the override block then supplies the field itself, so the published type
 * keeps advertising something the API has stopped documenting.
 */
type OverridesStillExist<Override, Generated> = Equals<keyof Override & keyof Generated, keyof Override>;

/**
 * Every override must still be at least as wide as the field it replaces.
 *
 * Key-level checks alone are not enough: they pass while the spec changes a field's optionality or
 * nullability underneath an override, which is exactly how a narrowing sneaks in. Adopting a wider spec
 * type is always safe, so the rule is one-directional -- the generated type must remain assignable to the
 * published one. When this fails, either drop the override and take the spec's type, or record why the
 * API really is narrower than the spec now claims.
 *
 * Optional keys are compared through a required lens, because whether a key may be absent is checked by
 * `OverridesStillExist` and reading `Pick` of an optional key would otherwise add `undefined` to both
 * sides and hide a real difference.
 */
type OverridesStayWider<Override, Generated> =
    Required<Pick<Generated, keyof Override & keyof Generated>> extends Required<
        Pick<Override, keyof Override & keyof Generated>
    >
        ? true
        : false;

/** Every `*SpecGaps` key must still be absent upstream, so a filled gap shows up as a build failure. */
type GapsStillMissing<Gaps, Generated> = Equals<keyof Gaps & keyof Generated, never>;

/**
 * `@apify/consts` stays the source of truth for the enums it declares, rather than the spec, because
 * `apify-sdk-js` and `crawlee` consume those same types -- diverging would break structural
 * compatibility across the Apify JS ecosystem. These assertions prove the two still agree.
 */
export type EnumGuards = AssertAll<
    [
        Equals<Schemas['GeneralAccess'], STORAGE_GENERAL_ACCESS>,
        Equals<Schemas['WebhookEventType'], WebhookEventType>,
        // `WebhookDispatchStatus` is a runtime enum this package publishes itself, so it is pinned to
        // `@apify/consts` first -- asserting it only against the spec would quietly make the spec its source
        // of truth and contradict the policy above. The spec is checked too, so all three stay in step.
        Equals<`${WebhookDispatchStatus}`, ValueOf<typeof WEBHOOK_DISPATCH_STATUSES>>,
        Equals<Schemas['WebhookDispatchStatus'], `${WebhookDispatchStatus}`>,
    ]
>;

/**
 * `WebhookDispatch` is assembled in `./models`, which cannot reach `Webhook` without closing an import
 * cycle, so `eventType` is asserted here to be the shared `@apify/consts` union rather than the spec's
 * own copy of it.
 *
 * `WebhookDispatch['webhook']` deliberately has no assertion against `Pick<Webhook, ...>` any more. It
 * used to be declared as exactly that, but the spec disagrees in two ways that are worth adopting: the
 * summary also carries `actionType` and `condition`, and `requestUrl` is nullable because hook actions
 * other than a plain HTTP request (Slack, email) have no URL. The still-hand-written `Webhook` types
 * `requestUrl` as a bare `string`, so the two cannot be equal until `Webhook` is migrated too.
 *
 * TODO: Restore an equality assertion once `Webhook` is adapted from the spec.
 */
export type WebhookDispatchGuards = AssertAll<[Equals<WebhookDispatch['eventType'], WebhookEventType>]>;

/**
 * Keeps the adapter honest about which fields it overrides and which the spec is still missing. A
 * failure here means the spec moved: either a field the client overrides was dropped or renamed, or a
 * gap was filled and its `*SpecGaps` entry should now be deleted.
 */
export type AdapterKeyGuards = AssertAll<
    [
        OverridesStillExist<DatasetSpecNarrowings, Schemas['Dataset']>,
        OverridesStillExist<DatasetStatisticsRePointed, Schemas['DatasetStatistics']>,
        OverridesStillExist<WebhookDispatchRePointed, Schemas['WebhookDispatch']>,
        GapsStillMissing<DatasetSpecGaps, Schemas['Dataset']>,
        GapsStillMissing<DatasetStatsSpecGaps, Schemas['DatasetStats']>,
    ]
>;

/**
 * The same overrides, checked for width rather than just for existence. Split from `AdapterKeyGuards` so a
 * failure says which of the two rules broke.
 *
 * Two groups are deliberately excluded, because width is not the right question for either:
 *
 *   - `calls`, `webhook` and `eventData` re-point at adapted types that are intentionally not the
 *     generated ones.
 *   - `status` publishes a runtime enum, and a string-literal union is never assignable to a string enum
 *     even when the members are identical. Its members are pinned by `EnumGuards` instead, against both
 *     `@apify/consts` and the spec.
 */
export type AdapterWidthGuards = AssertAll<
    [
        OverridesStayWider<Pick<DatasetSpecNarrowings, 'generalAccess' | 'consoleUrl' | 'stats'>, Schemas['Dataset']>,
        OverridesStayWider<Pick<WebhookDispatchRePointed, 'eventType'>, Schemas['WebhookDispatch']>,
    ]
>;
