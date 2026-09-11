import contentTypeParser from 'content-type';
import type { JsonArray, JsonObject } from 'type-fest';

const CONTENT_TYPE_JSON = 'application/json';
const STRINGIFIABLE_CONTENT_TYPE_RXS = [new RegExp(`^${CONTENT_TYPE_JSON}`, 'i'), /^application\/.*xml$/i, /^text\//i];

/**
 * Parses a binary response body using the provided content type header.
 *
 * - application/json is returned as a parsed object.
 * - application/*xml and text/* are returned as strings.
 * - everything else is returned as original body.
 *
 * If the header includes a charset, the body will be stringified only
 * if the charset is an encoding `TextDecoder` knows.
 */
export function maybeParseBody(
    body: ArrayBuffer | ArrayBufferView,
    contentTypeHeader: string,
): string | ArrayBuffer | ArrayBufferView | JsonObject | JsonArray {
    let contentType: string;
    let charset: string | undefined;
    try {
        const result = contentTypeParser.parse(contentTypeHeader);
        contentType = result.type;
        charset = result.parameters.charset;
    } catch {
        // can't parse, keep original body
        return body;
    }

    if (!isContentTypeStringifiable(contentType)) return body;

    // If we can't successfully decode it, we return
    // the original buffer rather than a mangled string.
    const decoder = createDecoder(charset);
    if (!decoder) return body;
    const dataString = decoder.decode(body);

    return contentType === CONTENT_TYPE_JSON ? JSON.parse(dataString) : dataString;
}

function createDecoder(charset?: string): TextDecoder | undefined {
    try {
        // No charset: hope that it's utf-8.
        return new TextDecoder(charset || 'utf-8');
    } catch {
        // `TextDecoder` throws a `RangeError` for a label it does not know.
        return undefined;
    }
}

function isContentTypeStringifiable(contentType: string) {
    if (!contentType) return false; // keep buffer
    return STRINGIFIABLE_CONTENT_TYPE_RXS.some((rx) => rx.test(contentType));
}
