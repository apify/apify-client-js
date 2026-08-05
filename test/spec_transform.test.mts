import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { absolutizeDocLinks, transformDateTime } from '../scripts/spec_transform.mts';

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

    it('leaves query parameters as strings, because axios does not serialize a Date as ISO 8601', () => {
        const node = transformDateTime(
            { type: 'string', format: 'date-time' },
            { path: '#/components/parameters/startedAfter' },
        );

        expect(node).toBeUndefined();
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
