import { describe, expect, test } from 'vitest';

import { maybeParseBody } from '../src/body_parser.js';

const encode = (text: string) => new TextEncoder().encode(text);

describe('maybeParseBody()', () => {
    test('parses a JSON body', () => {
        expect(maybeParseBody(encode('{"a":1}'), 'application/json; charset=utf-8')).toEqual({ a: 1 });
    });

    test('decodes text and XML bodies to strings', () => {
        expect(maybeParseBody(encode('hello'), 'text/plain')).toBe('hello');
        expect(maybeParseBody(encode('<a/>'), 'application/xml')).toBe('<a/>');
    });

    test('decodes a body in a charset other than UTF-8', () => {
        const body = new Uint8Array([0x63, 0x61, 0x66, 0xe9]);
        expect(maybeParseBody(body, 'text/plain; charset=iso-8859-1')).toBe('café');
    });

    test('reads the ascii charset as windows-1252, so a byte above 0x7F decodes to its character', () => {
        const body = new Uint8Array([0x63, 0x61, 0x66, 0xe9]);
        expect(maybeParseBody(body, 'text/plain; charset=ascii')).toBe('café');
    });

    test('strips a leading byte order mark from a JSON body, which would otherwise fail to parse', () => {
        expect(maybeParseBody(encode('﻿{"a":1}'), 'application/json')).toEqual({ a: 1 });
    });

    test('strips a leading byte order mark from a text body', () => {
        expect(maybeParseBody(encode('﻿a,b\n1,2'), 'text/csv; charset=utf-8')).toBe('a,b\n1,2');
    });

    test('accepts an ArrayBuffer, which the browser adapters of axios return', () => {
        const bytes = encode('{"a":1}');
        const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
        expect(maybeParseBody(body, 'application/json')).toEqual({ a: 1 });
    });

    test('keeps the body binary when the charset is unknown', () => {
        const body = encode('hello');
        expect(maybeParseBody(body, 'text/plain; charset=x-unknown')).toBe(body);
    });

    test.each(['hex', 'base64'])('keeps the body binary for the %s charset, which only Buffer knows', (charset) => {
        const body = encode('6869');
        expect(maybeParseBody(body, `text/plain; charset=${charset}`)).toBe(body);
    });

    test('keeps a binary content type as it is', () => {
        const body = new Uint8Array([1, 2, 3]);
        expect(maybeParseBody(body, 'image/png')).toBe(body);
    });

    test('keeps the body when the content type header cannot be parsed', () => {
        const body = encode('hello');
        expect(maybeParseBody(body, 'nonsense')).toBe(body);
    });
});
