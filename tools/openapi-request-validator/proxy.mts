/**
 * Validating reverse proxy for the Apify API.
 *
 * Every request is validated against the OpenAPI specification (requests only) and then forwarded unchanged to the
 * upstream API; the upstream response is passed back to the client. Point a client's integration tests at the
 * proxy to collect every request they make that does not match the specification.
 *
 *   node proxy.mts --spec tmp/openapi.json --upstream https://api.apify.com --port 3999 --report findings.jsonl
 *
 * `GET /__openapi-report` returns the findings collected so far as JSON. The spec may be a local path or a URL.
 */
import { readFileSync } from 'node:fs';
import { Readable } from 'node:stream';
import { parseArgs } from 'node:util';

import express from 'express';
import type { Request } from 'express';

import { createJsonlSink } from './report.mts';
import { createRequestValidator } from './validator.mts';

const DEFAULT_SPEC_URL = 'https://docs.apify.com/api/openapi.json';
const DEFAULT_UPSTREAM = 'https://api.apify.com';
const BODY_LIMIT = '100mb';

/** Headers that describe the connection or the encoded body, which the proxy re-creates itself. */
const HOP_BY_HOP_HEADERS = new Set([
    'host',
    'connection',
    'keep-alive',
    'transfer-encoding',
    'content-length',
    'content-encoding',
    'expect',
    'proxy-connection',
    'upgrade',
]);

type RequestWithRawBody = Request & { rawBody?: Buffer };

const loadSpec = async (source: string): Promise<object> => {
    if (/^https?:\/\//.test(source)) {
        const response = await fetch(source);
        if (!response.ok) throw new Error(`Failed to download the specification: ${response.status} ${source}`);
        return (await response.json()) as object;
    }
    return JSON.parse(readFileSync(source, 'utf8')) as object;
};

const main = async (): Promise<void> => {
    const { values } = parseArgs({
        options: {
            spec: { type: 'string', default: DEFAULT_SPEC_URL },
            upstream: { type: 'string', default: DEFAULT_UPSTREAM },
            port: { type: 'string', default: '0' },
            report: { type: 'string' },
        },
    });
    const upstream = values.upstream.replace(/\/$/, '');
    const spec = await loadSpec(values.spec);
    const validator = createRequestValidator({
        spec,
        onFinding: values.report ? createJsonlSink(values.report) : undefined,
    });
    let validatedRequests = 0;

    const keepRawBody = (req: RequestWithRawBody, _res: unknown, buffer: Buffer): void => {
        req.rawBody = buffer;
    };

    const app = express();
    app.get('/__openapi-report', (_req, res) => {
        res.json({ validatedRequests, findings: validator.findings });
    });
    // Bodies arrive decompressed from the parsers (`inflate`), so the validator sees the payload and the proxy
    // forwards it without the original `Content-Encoding`.
    app.use(
        express.json({
            limit: BODY_LIMIT,
            inflate: true,
            strict: false,
            type: 'application/json',
            verify: keepRawBody,
        }),
    );
    app.use(express.raw({ limit: BODY_LIMIT, inflate: true, type: () => true, verify: keepRawBody }));
    app.use((req, _res, next) => {
        if (req.path.startsWith('/v2')) validatedRequests += 1;
        next();
    });
    app.use(validator.middleware);
    app.use(async (req: RequestWithRawBody, res, next) => {
        try {
            const headers = new Headers();
            for (const [name, value] of Object.entries(req.headers)) {
                if (HOP_BY_HOP_HEADERS.has(name) || value === undefined) continue;
                headers.set(name, Array.isArray(value) ? value.join(', ') : value);
            }
            const hasBody = !['GET', 'HEAD'].includes(req.method) && req.rawBody && req.rawBody.length > 0;
            const upstreamResponse = await fetch(`${upstream}${req.originalUrl}`, {
                method: req.method,
                headers,
                body: hasBody ? req.rawBody : undefined,
                redirect: 'manual',
            });
            res.status(upstreamResponse.status);
            upstreamResponse.headers.forEach((value, name) => {
                if (!HOP_BY_HOP_HEADERS.has(name)) res.setHeader(name, value);
            });
            if (upstreamResponse.body) {
                Readable.fromWeb(upstreamResponse.body as never).pipe(res);
            } else {
                res.end();
            }
        } catch (error) {
            next(error);
        }
    });

    const server = app.listen(Number(values.port), () => {
        const address = server.address();
        const port = typeof address === 'object' && address ? address.port : values.port;
        console.log(`OpenAPI validating proxy listening on http://127.0.0.1:${port}, forwarding to ${upstream}`);
    });

    const shutdown = (): void => {
        console.log(
            `OpenAPI validating proxy: ${validator.findings.length} finding(s) in ${validatedRequests} request(s)`,
        );
        server.close(() => process.exit(0));
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
};

await main();
