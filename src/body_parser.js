const contentTypeParser = require('content-type');
const { isNode } = require('./utils');

const CONTENT_TYPE_JSON = 'application/json';
const STRINGIFIABLE_CONTENT_TYPE_RXS = [
    new RegExp(`^${CONTENT_TYPE_JSON}`, 'i'),
    /^application\/.*xml$/i,
    /^text\//i,
];

/**
 * Parses a Buffer or ArrayBuffer using the provided content type header.
 *
 * - application/json is returned as a parsed object.
 * - application/*xml and text/* are returned as strings.
 * - everything else is returned as original body.
 *
 * If the header includes a charset, the body will be stringified only
 * if the charset represents a known encoding to Node.js or Browser.
 *
 * @param {Buffer|ArrayBuffer} body
 * @param {string} contentTypeHeader
 * @return {string|Object|Buffer|ArrayBuffer}
 */
exports.maybeParseBody = (body, contentTypeHeader) => {
    let contentType;
    let charset;
    try {
        const result = contentTypeParser.parse(contentTypeHeader);
        contentType = result.type;
        charset = result.parameters.charset;
    } catch (err) {
        // can't parse, keep original body
        return body;
    }

    // If we can't successfully parse it, we return
    // the original buffer rather than a mangled string.
    if (!areDataStringifiable(contentType, charset)) return body;
    const dataString = isomorphicBufferToString(body, charset);

    return contentType === CONTENT_TYPE_JSON
        ? JSON.parse(dataString)
        : dataString;
};

/**
 * @param {Buffer|ArrayBuffer} buffer
 * @param {string} encoding
 * @return {string}
 */
function isomorphicBufferToString(buffer, encoding) {
    if (buffer.constructor.name !== ArrayBuffer.name) {
        return buffer.toString(encoding);
    }

    // Browser decoding only works with UTF-8.
    const utf8decoder = new TextDecoder();
    return utf8decoder.decode(new Uint8Array(buffer));
}

/**
 * @param {string} charset
 * @return {boolean}
 */
function isCharsetStringifiable(charset) {
    if (!charset) return true; // hope that it's utf-8
    if (isNode()) return Buffer.isEncoding(charset);
    const normalizedCharset = charset.toLowerCase().replace('-', '');
    // Browsers only support decoding utf-8 buffers.
    return normalizedCharset === 'utf8';
}

/**
 * @param {string} contentType
 * @return {boolean}
 */
function isContentTypeStringifiable(contentType) {
    if (!contentType) return false; // keep buffer
    return STRINGIFIABLE_CONTENT_TYPE_RXS.some((rx) => rx.test(contentType));
}

/**
 * @param {string} contentType
 * @param {string} charset
 * @return {boolean}
 */
function areDataStringifiable(contentType, charset) {
    return isContentTypeStringifiable(contentType) && isCharsetStringifiable(charset);
}
