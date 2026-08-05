/**
 * The pure spec helpers the maintainer scripts in this directory rely on, kept separate from their CLIs
 * so they can be unit tested and type-checked.
 */

import type { SchemaObject, TransformNodeOptions } from 'openapi-typescript';
import ts from 'typescript';

/** Base that the spec's root-relative Markdown links are resolved against. */
export const DOCS_BASE_URL = 'https://docs.apify.com';

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
