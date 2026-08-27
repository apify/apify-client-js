import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { absolutizeDocLinks, hoistRefSiblingRequired, transformDateTime } from '../scripts/spec_transform.mts';

const printer = ts.createPrinter();
const blankSource = ts.createSourceFile('t.ts', '', ts.ScriptTarget.Latest);

function print(node: ts.TypeNode | undefined): string | undefined {
    return node && printer.printNode(ts.EmitHint.Unspecified, node, blankSource);
}

const SCHEMA_PATH = '#/components/schemas/Dataset/createdAt';

describe('transformDateTime', () => {
    it('types a non-nullable date-time schema as Date', () => {
        const node = transformDateTime({ type: 'string', format: 'date-time' }, { path: SCHEMA_PATH });

        expect(print(node)).toBe('Date');
    });

    it('types an OpenAPI 3.1 nullable date-time schema as a Date union', () => {
        const node = transformDateTime({ type: ['string', 'null'], format: 'date-time' }, { path: SCHEMA_PATH });

        expect(print(node)).toBe('Date | null');
    });

    it('types an array-form type without null as a plain Date', () => {
        const node = transformDateTime({ type: ['string'], format: 'date-time' }, { path: SCHEMA_PATH });

        expect(print(node)).toBe('Date');
    });

    it('leaves query parameters as strings, because axios does not serialize a Date as ISO 8601', () => {
        const node = transformDateTime(
            { type: 'string', format: 'date-time' },
            { path: '#/components/parameters/startedAfter' },
        );

        expect(node).toBeUndefined();
    });

    it('ignores a schema reached without a path', () => {
        expect(transformDateTime({ type: 'string', format: 'date-time' }, {})).toBeUndefined();
    });

    it('ignores schemas that are not date-time', () => {
        expect(transformDateTime({ type: 'string' }, { path: SCHEMA_PATH })).toBeUndefined();
        expect(transformDateTime({ type: 'string', format: 'uri' }, { path: SCHEMA_PATH })).toBeUndefined();
    });

    it('returns a fresh node per call, which the TypeScript factory requires for reuse across a tree', () => {
        const first = transformDateTime({ type: 'string', format: 'date-time' }, { path: SCHEMA_PATH });
        const second = transformDateTime({ type: 'string', format: 'date-time' }, { path: SCHEMA_PATH });

        expect(first).not.toBe(second);
    });
});

describe('absolutizeDocLinks', () => {
    it('rewrites a root-relative link against the docs base URL', () => {
        expect(absolutizeDocLinks('see [docs](/api/v2/dataset-get)')).toBe(
            'see [docs](https://docs.apify.com/api/v2/dataset-get)',
        );
    });

    it('rewrites every occurrence, not just the first', () => {
        expect(absolutizeDocLinks('[a](/one) and [b](/two)')).toBe(
            '[a](https://docs.apify.com/one) and [b](https://docs.apify.com/two)',
        );
    });

    it('preserves the fragment of a root-relative link', () => {
        expect(absolutizeDocLinks('[a](/api/v2/getting-started#authentication)')).toBe(
            '[a](https://docs.apify.com/api/v2/getting-started#authentication)',
        );
    });

    it('leaves absolute and protocol-relative links alone', () => {
        const untouched = '[a](https://example.com/x) [b](//cdn.example.com/y) [c](./relative)';

        expect(absolutizeDocLinks(untouched)).toBe(untouched);
    });
});

describe('hoistRefSiblingRequired', () => {
    it('moves a required next to a $ref up to the parent of the allOf', () => {
        const schema = {
            allOf: [{ $ref: '#/components/schemas/RequestBase', required: ['id', 'url'] }, { properties: {} }],
        };

        expect(hoistRefSiblingRequired(schema)).toEqual({
            allOf: [{ $ref: '#/components/schemas/RequestBase' }, { properties: {} }],
            required: ['id', 'url'],
        });
    });

    it('merges the hoisted keys into a required the parent already has', () => {
        const schema = {
            allOf: [{ $ref: '#/components/schemas/Base', required: ['url', 'id'] }],
            required: ['id'],
        };

        expect(hoistRefSiblingRequired(schema)).toEqual({
            allOf: [{ $ref: '#/components/schemas/Base' }],
            required: ['id', 'url'],
        });
    });

    it('keeps the other siblings of the $ref where they are', () => {
        const schema = { allOf: [{ $ref: '#/components/schemas/Base', required: ['id'], description: 'a base' }] };

        expect(hoistRefSiblingRequired(schema)).toEqual({
            allOf: [{ $ref: '#/components/schemas/Base', description: 'a base' }],
            required: ['id'],
        });
    });

    it('reaches a schema nested anywhere in the document', () => {
        const document = {
            components: { schemas: { Request: { allOf: [{ $ref: '#/x', required: ['id'] }] } } },
        };

        expect(hoistRefSiblingRequired(document)).toEqual({
            components: { schemas: { Request: { allOf: [{ $ref: '#/x' }], required: ['id'] } } },
        });
    });

    it('leaves a required that carries no $ref alongside it alone', () => {
        const schema = { allOf: [{ properties: { id: {} }, required: ['id'] }] };

        expect(hoistRefSiblingRequired(schema)).toEqual(schema);
    });

    it('leaves a bare $ref alone', () => {
        const schema = { allOf: [{ $ref: '#/components/schemas/Base' }] };

        expect(hoistRefSiblingRequired(schema)).toEqual(schema);
    });

    it('leaves a document with no allOf untouched', () => {
        const document = { components: { schemas: { Base: { type: 'object', required: ['id'] } } } };

        expect(hoistRefSiblingRequired(document)).toEqual(document);
    });
});
