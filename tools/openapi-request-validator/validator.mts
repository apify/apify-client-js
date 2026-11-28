/**
 * Request-only OpenAPI validation middleware.
 *
 * Validates every incoming request against the Apify API OpenAPI specification and records each mismatch as a
 * `Finding`. It never blocks or alters a request: validation runs against a shadow copy of the request, so the
 * handlers downstream see the request exactly as the client sent it. Responses are not validated at all.
 *
 * This is a deliberately small subset of the monitoring middleware the API server runs, keeping only what is
 * needed to report client requests that do not match the published specification.
 */
import type { Request, RequestHandler, Response } from 'express';
import { error as openApiErrors, middleware as openApiMiddleware } from 'express-openapi-validator';

export interface ValidationError {
    path: string;
    message: string;
    errorCode?: string;
}

export type FindingKind = 'invalid-request' | 'undocumented-operation' | 'validator-failure';

export interface Finding {
    kind: FindingKind;
    method: string;
    /** The request URL as the client sent it, including the query string. */
    url: string;
    /** The specification path template the request matched, when it matched one. */
    route?: string;
    errors: ValidationError[];
    timestamp: string;
}

export interface RequestValidatorOptions {
    /** The parsed OpenAPI specification document. */
    spec: object;
    /** Only requests whose path starts with this prefix are validated. */
    validatedPathPrefix?: string;
    /** Paths intentionally absent from the public specification. */
    ignoredPathPrefixes?: string[];
    /** Query parameters intentionally left out of the public specification. */
    internalQueryParameters?: string[];
    /** Called for every finding, for example to stream findings to a file. */
    onFinding?: (finding: Finding) => void;
}

export interface RequestValidator {
    middleware: RequestHandler;
    findings: Finding[];
}

const DEFAULT_VALIDATED_PATH_PREFIX = '/v2';

/** Undocumented legacy alias of `/v2/actors`. */
const DEFAULT_IGNORED_PATH_SUFFIXES = ['/acts'];

const DEFAULT_INTERNAL_QUERY_PARAMETERS = ['_useNewStoreBackend', '_useCase', '_traceId'];

/** Query parameter values the API coerces to booleans, which the validator does not recognize. */
const BOOLEAN_COERCIBLE_VALUES = new Set(['0', '1']);

const queryParameterFromErrorPath = (path: string | undefined): string | undefined =>
    path?.match(/^\/query\/(.+)$/)?.[1];

const isFalsePositiveBooleanCoercionError = (error: ValidationError, req: Request): boolean => {
    if (error.message !== 'must be boolean') return false;
    const parameterName = queryParameterFromErrorPath(error.path);
    if (!parameterName) return false;
    const value = req.query[parameterName];
    return typeof value === 'string' && BOOLEAN_COERCIBLE_VALUES.has(value);
};

type OpenApiError = InstanceType<(typeof openApiErrors)[keyof typeof openApiErrors]>;

const isOpenApiError = (error: unknown): error is OpenApiError =>
    Object.values(openApiErrors).some((ErrorClass) => error instanceof ErrorClass);

/** Reserved characters the validator rejects in a query value, without `+`, which encodes a space. */
const RESERVED_QUERY_CHARACTERS = /[:/?#[\]@!$&'()*,;=]/;

/**
 * The validator rejects `+` in query values as a reserved character, but a client encoding a space as `+` follows
 * the form encoding the API accepts.
 */
const isFalsePositiveReservedCharacterError = (error: ValidationError, req: Request): boolean => {
    if (!error.message.includes('must be url encoded')) return false;
    const parameterName = queryParameterFromErrorPath(error.path);
    if (!parameterName) return false;
    const rawQuery = req.originalUrl.split('?')[1] ?? '';
    const rawValues = rawQuery
        .split('&')
        .filter((pair) => pair.startsWith(`${parameterName}=`))
        .map((pair) => pair.slice(parameterName.length + 1));
    return rawValues.length > 0 && rawValues.every((value) => !RESERVED_QUERY_CHARACTERS.test(value));
};

/**
 * Build a request object the validator may freely mutate. The validator rewrites `req.query` into its parsed form
 * and attaches `req.openapi`, neither of which must leak to the handlers that process the real request.
 */
const createShadowRequest = (req: Request): Request => {
    const shadow = Object.create(req) as Request;
    const contentType = req.headers['content-type'] ?? '';
    // A raw text body arrives as a Buffer; the specification describes it as a string.
    const body = Buffer.isBuffer(req.body) && /^text\//i.test(contentType) ? req.body.toString('utf8') : req.body;
    const ownProperties = {
        query: structuredClone(req.query),
        params: { ...req.params },
        body,
        openapi: undefined,
    };
    for (const [name, value] of Object.entries(ownProperties)) {
        Object.defineProperty(shadow, name, { value, writable: true, configurable: true, enumerable: true });
    }
    return shadow;
};

/** Run an express middleware chain to completion and resolve with the error it passed to `next`, if any. */
const runChain = async (handlers: RequestHandler[], req: Request, res: Response): Promise<unknown> => {
    for (const handler of handlers) {
        const error = await new Promise<unknown>((resolve) => {
            try {
                const result = handler(req, res, resolve) as unknown;
                if (result instanceof Promise) result.catch(resolve);
            } catch (err) {
                resolve(err);
            }
        });
        if (error) return error;
    }
    return undefined;
};

export function createRequestValidator(options: RequestValidatorOptions): RequestValidator {
    const {
        spec,
        validatedPathPrefix = DEFAULT_VALIDATED_PATH_PREFIX,
        ignoredPathPrefixes = DEFAULT_IGNORED_PATH_SUFFIXES.map((suffix) => `${validatedPathPrefix}${suffix}`),
        internalQueryParameters = DEFAULT_INTERNAL_QUERY_PARAMETERS,
        onFinding,
    } = options;
    const internalQueryParameterSet = new Set(internalQueryParameters);
    const findings: Finding[] = [];

    const validators = openApiMiddleware({
        apiSpec: spec as never,
        validateApiSpec: false,
        validateSecurity: false,
        validateResponses: false,
        validateRequests: {
            allowUnknownQueryParameters: false,
            coerceTypes: false,
            removeAdditional: false,
            allErrors: true,
        },
    });

    const shouldValidate = (path: string): boolean =>
        path.startsWith(validatedPathPrefix) && !ignoredPathPrefixes.some((prefix) => path.startsWith(prefix));

    const record = (req: Request, shadow: Request, error: unknown): void => {
        const base = {
            method: req.method,
            url: req.originalUrl,
            route: (shadow as Request & { openapi?: { expressRoute?: string } }).openapi?.expressRoute,
            timestamp: new Date().toISOString(),
        };
        let finding: Finding;
        if (error instanceof openApiErrors.NotFound || error instanceof openApiErrors.MethodNotAllowed) {
            finding = { ...base, kind: 'undocumented-operation', errors: [{ path: req.path, message: error.message }] };
        } else if (isOpenApiError(error)) {
            const errors = (error.errors as ValidationError[]).filter(
                (e) =>
                    !isFalsePositiveBooleanCoercionError(e, req) &&
                    !isFalsePositiveReservedCharacterError(e, req) &&
                    !internalQueryParameterSet.has(queryParameterFromErrorPath(e.path) ?? ''),
            );
            if (errors.length === 0) return;
            finding = { ...base, kind: 'invalid-request', errors };
        } else {
            const message = error instanceof Error ? error.message : String(error);
            finding = { ...base, kind: 'validator-failure', errors: [{ path: req.path, message }] };
        }
        findings.push(finding);
        onFinding?.(finding);
    };

    const middleware: RequestHandler = (req, res, next) => {
        if (!shouldValidate(req.path)) {
            next();
            return;
        }
        const shadow = createShadowRequest(req);
        runChain(validators, shadow, res)
            .then((error) => {
                if (error) record(req, shadow, error);
            })
            .catch((error: unknown) => record(req, shadow, error))
            .finally(() => next());
    };

    return { middleware, findings };
}
