/**
 * Base class of the errors the client throws for a failed API call: {@link ApifyApiError} and its subclasses,
 * {@link InvalidResponseBodyError} and {@link ResponseValidationError}. A single `instanceof ApifyClientError`
 * check catches all of them.
 *
 * Invalid arguments throw an `ArgumentValidationError` before any request is sent, and transport errors, timeouts
 * and aborts surface as the errors the transport raised. None of those extend this class.
 */
export class ApifyClientError extends Error {}
