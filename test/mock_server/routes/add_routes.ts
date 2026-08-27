import type { Dictionary } from 'apify-client';
import type { Request, Response, Router } from 'express';

/**
 * The `data` of a successful response. A fixture that carries an `id` gets the route's id instead, which is how
 * the tests tell which route answered; a list or an array is served as it is.
 */
function withRouteId(fixture: unknown, id: string): unknown {
    if (fixture && typeof fixture === 'object' && !Array.isArray(fixture) && 'id' in fixture) {
        return { ...fixture, id };
    }
    return fixture;
}

function maybeParseContextFromResourceId(resourceId: any) {
    if (typeof resourceId !== 'string') return;
    const hexBuffer = Buffer.from(resourceId, 'hex');
    const json = hexBuffer.toString('utf-8');
    try {
        return JSON.parse(json);
    } catch {
        return undefined;
    }
}

const HANDLERS = {
    text(id: string) {
        return (req: Request, res: Response) => {
            const [resourceId] = Object.values(req.params);
            const responseStatusCode = Number(resourceId) || 200;
            let payload: string | null | Dictionary<any>;
            if (responseStatusCode === 200) payload = id;
            else if (responseStatusCode === 204) payload = null;
            else if (responseStatusCode === 404) {
                payload = {
                    error: {
                        type: 'record-not-found',
                        message: 'Record with this name was not found',
                    },
                };
            }

            const context = maybeParseContextFromResourceId(resourceId);
            const delayMillis = context && context.delayMillis;
            setTimeout(() => {
                res.send(payload);
            }, delayMillis || 0);
        };
    },
    json(id: string, fixture?: unknown) {
        return (req: Request, res: Response) => {
            const [resourceId] = Object.values(req.params);
            const responseStatusCode = Number(resourceId) || 200;
            let payload: Dictionary<any> | null = {};
            if (responseStatusCode === 200)
                payload = { data: fixture === undefined ? { id } : withRouteId(fixture, id) };
            else if (responseStatusCode === 204) payload = null;
            else if (responseStatusCode === 400) {
                // This is not ideal, what if we have more endpoints which can return 400?
                payload = {
                    error: {
                        type: 'schema-validation-error',
                        message: 'Schema validation failed',
                        data: {
                            invalidItems: {
                                0: [`should have required property 'name'`],
                            },
                        },
                    },
                };
            } else if (responseStatusCode === 404) {
                payload = {
                    error: {
                        type: 'record-not-found',
                        message: 'Record with this name was not found',
                    },
                };
            }

            const context = maybeParseContextFromResourceId(resourceId);
            const delayMillis = context && context.delayMillis;
            setTimeout(() => {
                res.status(responseStatusCode).json(payload);
            }, delayMillis || 0);
        };
    },
    dummyBatchOperation() {
        return (req: Request, res: Response) => {
            // Every request is reported as added, in the shape of the API's `BatchAddResult`.
            const processedRequests = (req.body as { uniqueKey: string }[]).map(({ uniqueKey }, index) => ({
                requestId: `request-${index}`,
                uniqueKey,
                wasAlreadyPresent: false,
                wasAlreadyHandled: false,
            }));
            res.status(200).json({ data: { unprocessedRequests: [], processedRequests } });
        };
    },
    responseJsonMock(id: string, fixture?: unknown) {
        return (req: Request, res: Response) => {
            const [resourceId] = Object.values(req.params);
            const responseStatusCode = Number(resourceId) || 200;

            const mockServer = req.app.get('mockServer');
            let body: Dictionary<any> = { data: fixture === undefined ? { id } : withRouteId(fixture, id) };
            let headers: Dictionary<string> = {};
            let statusCode = responseStatusCode;

            if (mockServer.response) {
                body = mockServer.response.body;
                headers = mockServer.response.headers;
                statusCode = mockServer.response.statusCode || 200;
            }

            let payload: Dictionary<any> | null = {};
            if (statusCode === 200) payload = body;
            else if (statusCode === 204) payload = null;
            else if (statusCode === 404) {
                payload = {
                    error: {
                        type: 'record-not-found',
                        message: 'Record with this name was not found',
                    },
                };
            }

            const context = maybeParseContextFromResourceId(resourceId);
            const delayMillis = context && context.delayMillis;
            setTimeout(() => {
                res.status(statusCode).set(headers).send(payload);
            }, delayMillis || 0);
        };
    },
} as const;

export interface MockServerRoute {
    id: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    type?: 'json' | 'text' | 'dummyBatchOperation' | 'responseJsonMock';
    /**
     * The `data` of a successful JSON response, for a route whose response the client validates against the
     * OpenAPI schema. Without it the route answers `{ id }`, which only a response nobody validates can afford.
     */
    fixture?: unknown;
}

export function addRoutes(router: Router, routes: MockServerRoute[]) {
    routes.forEach((route) => {
        const type = route.type ? route.type : 'json';
        const handler = HANDLERS[type];
        const method = route.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete';
        router[method](route.path, (req: Request, res: Response) => {
            (req as any).endpointId = route.id;
            handler(route.id, route.fixture)(req, res);
        });
    });
}
