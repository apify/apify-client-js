/**
 * The pure spec helpers the maintainer scripts in this directory rely on, kept separate from their CLIs
 * so they can be unit tested and type-checked.
 */

import type { SchemaObject, TransformNodeOptions } from 'openapi-typescript';
import ts from 'typescript';

/** Base that the spec's root-relative Markdown links are resolved against. */
const DOCS_BASE_URL = 'https://docs.apify.com';

/**
 * Types `format: date-time` as `Date`, but only for `#/components/schemas` -- the models that flow through
 * `parseDateFields`.
 *
 * Query parameters are deliberately left as `string`. A `Date` there would be serialized into the query
 * string by axios' param serializer, which does not produce ISO 8601. Request bodies are safe because they
 * go through `JSON.stringify`, which does.
 */
export function transformDateTime(
    schemaObject: SchemaObject,
    options: Pick<TransformNodeOptions, 'path'>,
): ts.TypeNode | undefined {
    if (schemaObject.format !== 'date-time') return undefined;
    if (!options.path?.startsWith('#/components/schemas/')) return undefined;

    // A fresh node per call. The TypeScript factory does not support placing one node instance at several
    // positions of the same tree, and this transform is invoked once per date-time schema.
    const date = ts.factory.createTypeReferenceNode(ts.factory.createIdentifier('Date'));

    // OpenAPI 3.1 spells nullability as `type: ['string', 'null']` rather than `nullable: true`.
    const isNullable = Array.isArray(schemaObject.type) && schemaObject.type.includes('null');
    if (!isNullable) return date;

    return ts.factory.createUnionTypeNode([date, ts.factory.createLiteralTypeNode(ts.factory.createNull())]);
}

/**
 * Moves a `required` that sits next to a `$ref` inside an `allOf` up to the branch's parent.
 *
 * OpenAPI 3.1 lets a `$ref` carry siblings, and the specification uses that to say which of
 * `RequestBase`'s fields a stored `Request` always carries. `openapi-typescript` drops a `required` in
 * that position, so all three arrive optional. Every branch of an `allOf` constrains the same instance
 * the parent does, so moving the list up is an equivalent rewrite -- and one the generator honours,
 * through its `WithRequired` helper.
 *
 * TODO: Remove once `openapi-typescript` keeps a `required` that sits next to a `$ref`.
 */
export function hoistRefSiblingRequired<T>(document: T): T {
    return hoist(document) as T;
}

function hoist(node: unknown): unknown {
    if (Array.isArray(node)) return node.map(hoist);
    if (node === null || typeof node !== 'object') return node;

    const rewritten: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node)) rewritten[key] = hoist(value);

    const branches = rewritten.allOf;
    if (!Array.isArray(branches)) return rewritten;

    const required = new Set(Array.isArray(rewritten.required) ? (rewritten.required as string[]) : []);
    const sizeBefore = required.size;

    rewritten.allOf = branches.map((branch: unknown) => {
        if (branch === null || typeof branch !== 'object' || Array.isArray(branch)) return branch;
        const { $ref, required: branchRequired, ...rest } = branch as Record<string, unknown>;
        if ($ref === undefined || !Array.isArray(branchRequired)) return branch;
        for (const key of branchRequired as string[]) required.add(key);
        return { $ref, ...rest };
    });

    if (required.size > sizeBefore) rewritten.required = [...required];
    return rewritten;
}

/**
 * Rewrites `](/api/v2/foo)` into `](https://docs.apify.com/api/v2/foo)`, leaving protocol-relative
 * `](//host)` alone.
 *
 * The spec's descriptions are copied verbatim into JSDoc, where TypeDoc resolves a root-relative link
 * against the API-reference `baseUrl` and produces a broken `/api/client/js/api/v2/...` URL that the docs
 * link checker flags.
 */
export function absolutizeDocLinks(source: string): string {
    return source.replaceAll(/\]\(\/(?!\/)/g, `](${DOCS_BASE_URL}/`);
}
