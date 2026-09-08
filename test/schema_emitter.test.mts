import { describe, expect, it } from 'vitest';

import { COMMENT_HEADER, emitSchema, emitSchemas, type SchemaNode } from '../scripts/schema_emitter.mts';

const SCHEMAS: Record<string, SchemaNode> = {
    Base: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } }, required: ['id'] },
    Tag: { type: 'string' },
    RunActor: { type: 'object', properties: { type: { const: 'RUN_ACTOR' }, actorId: { type: 'string' } } },
    RunTask: {
        allOf: [
            { $ref: '#/components/schemas/Base' },
            { type: 'object', properties: { type: { type: 'string', const: 'RUN_TASK' } } },
        ],
    },
    Union: { anyOf: [{ type: 'string' }, { type: 'integer' }] },
};

const ref = (name: string): SchemaNode => ({ $ref: `#/components/schemas/${name}` });

describe('emitSchema', () => {
    describe('objects', () => {
        it('emits a loose object, so fields the specification does not list pass through', () => {
            const out = emitSchema({
                type: 'object',
                properties: { id: { type: 'string' }, count: { type: 'integer' } },
                required: ['id'],
            });

            expect(out).toBe('z.looseObject({\n    id: z.string(),\n    count: z.int().optional(),\n})');
        });

        it('quotes a property name that is not an identifier', () => {
            const out = emitSchema({ type: 'object', properties: { 'TIMED-OUT': { type: 'integer' } } });

            expect(out).toBe('z.looseObject({\n    "TIMED-OUT": z.int().optional(),\n})');
        });

        it('indents a nested object one level deeper', () => {
            const out = emitSchema({
                type: 'object',
                properties: { stats: { type: 'object', properties: { runs: { type: 'integer' } } } },
            });

            expect(out).toBe(
                'z.looseObject({\n    stats: z.looseObject({\n        runs: z.int().optional(),\n    }).optional(),\n})',
            );
        });

        it('emits an object without properties as a record of unknown values', () => {
            expect(emitSchema({ type: 'object' })).toBe('z.record(z.string(), z.unknown())');
            expect(emitSchema({ type: 'object', additionalProperties: true })).toBe(
                'z.record(z.string(), z.unknown())',
            );
        });

        it('emits an object with only a value schema as a record of that schema', () => {
            expect(emitSchema({ type: 'object', additionalProperties: { type: 'string' } })).toBe(
                'z.record(z.string(), z.string())',
            );
            expect(emitSchema({ type: 'object', additionalProperties: ref('Tag') }, SCHEMAS)).toBe(
                'z.record(z.string(), Tag)',
            );
        });

        it('adds a catchall when properties and a value schema are both present', () => {
            const out = emitSchema({
                type: 'object',
                properties: { id: { type: 'string' } },
                additionalProperties: { type: 'string' },
            });

            expect(out).toBe('z.looseObject({\n    id: z.string().optional(),\n}).catchall(z.string())');
        });

        it('ignores additionalProperties: false rather than emitting a strict object', () => {
            const out = emitSchema({
                type: 'object',
                properties: { id: { type: 'string' } },
                additionalProperties: false,
            });

            expect(out).toBe('z.looseObject({\n    id: z.string().optional(),\n})');
        });

        it('treats a schema with properties but no type as an object', () => {
            expect(emitSchema({ properties: { id: { type: 'string' } } })).toBe(
                'z.looseObject({\n    id: z.string().optional(),\n})',
            );
        });

        it('emits an empty properties map as an empty shape', () => {
            expect(emitSchema({ type: 'object', properties: {} })).toBe('z.looseObject({})');
        });
    });

    describe('primitives and constraints', () => {
        it('keeps the numeric constraints the specification states', () => {
            expect(emitSchema({ type: 'integer', minimum: 0, maximum: 10 })).toBe('z.int().min(0).max(10)');
            expect(emitSchema({ type: 'number', exclusiveMinimum: 0, multipleOf: 0.5 })).toBe(
                'z.number().gt(0).multipleOf(0.5)',
            );
        });

        it('keeps the string constraints and escapes slashes in a pattern', () => {
            expect(emitSchema({ type: 'string', minLength: 1, maxLength: 5 })).toBe('z.string().min(1).max(5)');
            expect(emitSchema({ type: 'string', pattern: '^a/b$' })).toBe('z.string().regex(/^a\\/b$/)');
        });

        it('rejects a pattern that is not a valid regular expression', () => {
            expect(() => emitSchema({ type: 'string', pattern: '(' })).toThrow(/not a valid regular expression/);
        });

        it('emits date-time as z.date(), because the client parses those fields before validating', () => {
            expect(emitSchema({ type: 'string', format: 'date-time' })).toBe('z.date()');
            expect(emitSchema({ type: ['string', 'null'], format: 'date-time' })).toBe('z.date().nullable()');
        });

        it('leaves other string formats as plain strings', () => {
            expect(emitSchema({ type: 'string', format: 'uri' })).toBe('z.string()');
        });

        it('emits boolean, null and a schema without a type', () => {
            expect(emitSchema({ type: 'boolean' })).toBe('z.boolean()');
            expect(emitSchema({ type: 'null' })).toBe('z.null()');
            expect(emitSchema({ description: 'anything' })).toBe('z.unknown()');
        });

        it('emits a const as a literal', () => {
            expect(emitSchema({ const: 'RUN_ACTOR' })).toBe('z.literal("RUN_ACTOR")');
            expect(emitSchema({ type: 'integer', const: 1 })).toBe('z.literal(1)');
        });

        it('does not apply a default, so the parsed value stays identical to the response', () => {
            expect(emitSchema({ type: 'boolean', default: true })).toBe('z.boolean()');
        });
    });

    describe('nullability', () => {
        it('reads the array form of type', () => {
            expect(emitSchema({ type: ['string', 'null'] })).toBe('z.string().nullable()');
            expect(emitSchema({ type: ['string'] })).toBe('z.string()');
        });

        it('emits several types as a union', () => {
            expect(emitSchema({ type: ['string', 'object', 'null'] })).toBe(
                'z.union([z.string(), z.record(z.string(), z.unknown())]).nullable()',
            );
        });

        it('reads anyOf with a null member as nullable', () => {
            expect(emitSchema({ anyOf: [ref('Base'), { type: 'null' }] }, SCHEMAS)).toBe('Base.nullable()');
            expect(emitSchema({ anyOf: [{ type: 'array', items: { type: 'string' } }, { type: 'null' }] })).toBe(
                'z.array(z.string()).nullable()',
            );
        });
    });

    describe('enums', () => {
        it('accepts any other string too, so a value the API adds does not fail every response', () => {
            expect(emitSchema({ type: 'string', enum: ['READY', 'RUNNING'] })).toBe(
                'z.enum(["READY", "RUNNING"]).or(z.string())',
            );
        });

        it('reads a null member or a nullable type as nullable', () => {
            expect(emitSchema({ type: ['string', 'null'], enum: ['NONE', null] })).toBe(
                'z.enum(["NONE"]).or(z.string()).nullable()',
            );
        });

        it('rejects a non-string enum', () => {
            expect(() => emitSchema({ type: 'integer', enum: [1, 2] })).toThrow(/Only string enums/);
        });
    });

    describe('arrays', () => {
        it('emits the item schema and the size constraints', () => {
            expect(emitSchema({ type: 'array', items: ref('Tag'), minItems: 1, maxItems: 3 }, SCHEMAS)).toBe(
                'z.array(Tag).min(1).max(3)',
            );
        });

        it('emits an array without items as an array of unknown', () => {
            expect(emitSchema({ type: 'array' })).toBe('z.array(z.unknown())');
        });
    });

    describe('references', () => {
        it('emits a reference as the name of the referenced constant', () => {
            expect(emitSchema(ref('Base'), SCHEMAS)).toBe('Base');
        });

        it('rejects a reference to an unknown schema', () => {
            expect(() => emitSchema(ref('Missing'), SCHEMAS)).toThrow(/Unknown schema "Missing"/);
        });

        it('rejects a reference outside components.schemas', () => {
            expect(() => emitSchema({ $ref: '#/components/parameters/limit' }, SCHEMAS)).toThrow(
                /Only references into components.schemas/,
            );
        });

        it('rejects a required next to a $ref, which only the allOf hoist can place', () => {
            expect(() => emitSchema({ ...ref('Base'), required: ['id'] }, SCHEMAS)).toThrow(/carries "required"/);
        });

        it('tolerates a description next to a $ref', () => {
            expect(emitSchema({ ...ref('Base'), description: 'the base' }, SCHEMAS)).toBe('Base');
        });
    });

    describe('compositions', () => {
        it('emits allOf over objects as extend calls, keeping a ZodObject', () => {
            const out = emitSchema(
                {
                    allOf: [
                        ref('Base'),
                        { type: 'object', properties: { count: { type: 'integer' } }, required: ['count'] },
                    ],
                },
                SCHEMAS,
            );

            expect(out).toBe('Base.extend({\n    count: z.int(),\n})');
        });

        it('extends with the shape of a referenced member', () => {
            expect(emitSchema({ allOf: [ref('Base'), ref('RunActor')] }, SCHEMAS)).toBe('Base.extend(RunActor.shape)');
        });

        it('applies a required that names fields of the base with .required()', () => {
            expect(emitSchema({ allOf: [ref('Base')], required: ['name'] }, SCHEMAS)).toBe(
                'Base.required({ name: true })',
            );
            expect(emitSchema({ allOf: [ref('Base'), { required: ['name'] }] }, SCHEMAS)).toBe(
                'Base.required({ name: true })',
            );
        });

        it('emits a single-member allOf as the member itself', () => {
            expect(emitSchema({ allOf: [ref('Base')] }, SCHEMAS)).toBe('Base');
        });

        it('falls back to an intersection when the first member is not an object', () => {
            expect(emitSchema({ allOf: [ref('Union'), ref('Base')] }, SCHEMAS)).toBe('z.intersection(Union, Base)');
        });

        it('emits a discriminated union when every member declares the discriminator as a const', () => {
            const out = emitSchema(
                { oneOf: [ref('RunActor'), ref('RunTask')], discriminator: { propertyName: 'type' } },
                SCHEMAS,
            );

            expect(out).toBe('z.discriminatedUnion("type", [RunActor, RunTask])');
        });

        it('emits a plain union when a member lacks the discriminator const', () => {
            const out = emitSchema(
                { oneOf: [ref('RunActor'), ref('Base')], discriminator: { propertyName: 'type' } },
                SCHEMAS,
            );

            expect(out).toBe('z.union([RunActor, Base])');
        });

        it('emits oneOf and anyOf without a discriminator as unions', () => {
            expect(emitSchema({ oneOf: [{ type: 'string' }, { type: 'integer' }] })).toBe(
                'z.union([z.string(), z.int()])',
            );
            expect(emitSchema({ anyOf: [ref('Base'), ref('Tag')] }, SCHEMAS)).toBe('z.union([Base, Tag])');
        });
    });

    describe('unsupported input', () => {
        it('rejects a keyword it does not understand rather than dropping it', () => {
            expect(() => emitSchema({ type: 'string', not: { const: 'x' } })).toThrow(/Unsupported keyword "not"/);
            expect(() => emitSchema({ type: 'array', items: { type: 'string' }, uniqueItems: true })).toThrow(
                /Unsupported keyword "uniqueItems"/,
            );
        });

        it('ignores vendor extensions and documentation keywords', () => {
            expect(
                emitSchema({ type: 'string', 'x-internal': true, title: 'T', description: 'd', examples: ['a'] }),
            ).toBe('z.string()');
        });

        it('rejects an unsupported type', () => {
            expect(() => emitSchema({ type: 'file' })).toThrow(/Unsupported type "file"/);
        });

        it('rejects a constraint that has no type to apply to', () => {
            expect(() => emitSchema({ pattern: '^a$' })).toThrow(/"pattern" at schema has no string type/);
            expect(() => emitSchema({ items: { type: 'string' } })).toThrow(/"items" at schema has no array type/);
        });

        it('rejects a constraint that does not apply to the declared type rather than dropping it', () => {
            expect(() => emitSchema({ type: 'string', minimum: 1 })).toThrow(
                /"minimum" at schema has no integer or number type/,
            );
            expect(() => emitSchema({ type: ['string', 'null'], minItems: 1 })).toThrow(
                /"minItems" at schema has no array type/,
            );
        });

        it('rejects a constraint next to an enum, a const or a union rather than dropping it', () => {
            expect(() => emitSchema({ enum: ['a'], pattern: '^a$' })).toThrow(/enum at schema combined with "pattern"/);
            expect(() => emitSchema({ const: 'a', minLength: 1 })).toThrow(/const at schema combined with "minLength"/);
            expect(() => emitSchema({ oneOf: [{ type: 'string' }], properties: {} })).toThrow(
                /oneOf at schema combined with "properties"/,
            );
            expect(() => emitSchema({ anyOf: [{ type: 'string' }], items: {} })).toThrow(
                /anyOf at schema combined with "items"/,
            );
        });

        it('rejects a required on an allOf whose first member is not an object', () => {
            expect(() => emitSchema({ allOf: [ref('Union'), ref('Base')], required: ['name'] }, SCHEMAS)).toThrow(
                /first member is not an object/,
            );
        });
    });
});

describe('emitSchemas', () => {
    const document = (schemas: Record<string, SchemaNode>) => ({ components: { schemas } });

    it('emits the header, the zod import and one export per schema', () => {
        const out = emitSchemas(document({ Tag: { type: 'string' } }));

        expect(out).toBe(`${COMMENT_HEADER}import { z } from 'zod';\n\nexport const Tag = z.string();\n`);
    });

    it('declares every schema after the ones it references', () => {
        const out = emitSchemas(
            document({ Actor: { type: 'object', properties: { tag: ref('Tag') } }, Tag: { type: 'string' } }),
        );

        expect(out.indexOf('export const Tag')).toBeLessThan(out.indexOf('export const Actor'));
    });

    it('follows a reference from a property named like a documentation keyword', () => {
        const out = emitSchemas(
            document({ Actor: { type: 'object', properties: { title: ref('Tag') } }, Tag: { type: 'string' } }),
        );

        expect(out.indexOf('export const Tag')).toBeLessThan(out.indexOf('export const Actor'));
    });

    it('renders the description as a doc comment', () => {
        const out = emitSchemas(document({ Tag: { type: 'string', description: 'A tag.\nSecond line.' } }));

        expect(out).toContain('/**\n * A tag.\n * Second line.\n */\nexport const Tag');
    });

    it('rejects a reference cycle, which would need z.lazy()', () => {
        const cyclic = document({
            Folder: { type: 'object', properties: { children: { type: 'array', items: ref('Folder') } } },
        });

        expect(() => emitSchemas(cyclic)).toThrow(/Reference cycle among schemas: Folder -> Folder/);
    });

    it('rejects a schema name that cannot be an exported identifier', () => {
        expect(() => emitSchemas(document({ 'My-Schema': { type: 'string' } }))).toThrow(/not usable/);
        expect(() => emitSchemas(document({ z: { type: 'string' } }))).toThrow(/not usable/);
    });

    it('rejects a document without schemas', () => {
        expect(() => emitSchemas({})).toThrow(/no `components.schemas`/);
    });
});
