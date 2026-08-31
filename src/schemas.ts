/**
 * The schemas the resource clients validate API responses with.
 *
 * Today these are exactly the generated ones. The module still exists as the one place where a generated
 * schema is widened when the API is known to return something the specification does not describe, so a
 * documented deviation never sends a resource client reaching into `./generated` directly. An override
 * declared here shadows the generated export of the same name, every schema that embeds an overridden one
 * has to be rebuilt on top of it, and `spec_guards.ts` checks that each override still accepts what the
 * specification describes, so one cannot narrow by accident.
 *
 * Spec gaps need no override: the generated objects are loose, so a field the specification omits passes
 * through. Neither do client narrowings: a schema only ever accepts more than the published type.
 */

export * from './generated/schemas';
