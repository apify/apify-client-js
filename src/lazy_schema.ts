/**
 * Wraps the construction of a zod schema so it runs on the first call and only once.
 *
 * The generated response schemas are exported this way: a couple of hundred `z.looseObject()` calls at import time
 * would cost more than importing zod itself, so each schema is built by the first response validated against it and
 * kept for the rest of the process.
 */
export function lazySchema<T>(build: () => T): () => T {
    let schema: T | undefined;
    return () => (schema ??= build());
}
