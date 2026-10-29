import { afterAll, beforeAll, expect, test } from 'vitest';

import type { ApifyClient } from 'apify-client';
import { ActorSourceType } from 'apify-client';

import { makeClient } from './_fixtures.js';
import { getRandomResourceName } from './_utils.js';

const OPENAPI_SPEC = {
    openapi: '3.0.0',
    info: { title: 'Echo server', version: '1.0.0' },
    paths: { '/echo': { post: { responses: { '200': { description: 'The echoed request.' } } } } },
};

/** A web server that answers every request, including the platform's readiness probe, with the request it received. */
const ECHO_SERVER_SOURCE = `
const http = require('http');

http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ method: req.method, url: req.url, headers: req.headers, body }));
    });
}).listen(process.env.ACTOR_WEB_SERVER_PORT);
`;

const DOCKERFILE = `
FROM node:22-alpine
COPY main.js ./
CMD ["node", "main.js"]
`;

let client: ApifyClient;
let serverActorId: string;

/** Create and build a Server Actor running an echo server. `afterAll` deletes it. */
beforeAll(async () => {
    client = makeClient();
    const actorName = getRandomResourceName('server');
    const actorJson = {
        actorSpecification: 1,
        name: actorName,
        version: '0.0',
        usesStandbyMode: true,
        webServerSchema: OPENAPI_SPEC,
    };
    const actor = await client.actors().create({
        name: actorName,
        versions: [
            {
                versionNumber: '0.0',
                sourceType: ActorSourceType.SourceFiles,
                buildTag: 'latest',
                sourceFiles: [
                    { name: 'Dockerfile', format: 'TEXT', content: DOCKERFILE },
                    { name: 'main.js', format: 'TEXT', content: ECHO_SERVER_SOURCE },
                    { name: '.actor/actor.json', format: 'TEXT', content: JSON.stringify(actorJson) },
                ],
            },
        ],
        actorStandby: { isEnabled: true, memoryMbytes: 256, idleTimeoutSecs: 60 },
    });
    serverActorId = actor.id;

    const build = await client.actor(serverActorId).build('0.0');
    const finishedBuild = await client.build(build.id).waitForFinish({ waitSecs: 300 });
    expect(finishedBuild.status).toBe('SUCCEEDED');
}, 360_000);

afterAll(async () => {
    if (serverActorId) await client.actor(serverActorId).delete();
});

test('the server client returns the URL and OpenAPI specification and sends requests to the server', async () => {
    const actor = await client.actor(serverActorId).get();
    const actorServerClient = client.actor(serverActorId).server();

    await expect(actorServerClient.getUrl()).resolves.toBe(actor?.standbyUrl);
    await expect(actorServerClient.getOpenApiSpec()).resolves.toEqual(OPENAPI_SPEC);

    const response = await actorServerClient.request('/echo', {
        method: 'POST',
        params: { q: 'apify' },
        data: { limit: 5 },
    });

    expect(response.status).toBe(200);
    expect(response.data.method).toBe('POST');
    expect(response.data.url).toBe('/echo?q=apify');
    expect(JSON.parse(response.data.body)).toEqual({ limit: 5 });
    // The platform consumes the client's token, so it never reaches the Actor's code.
    expect(response.data.headers).not.toHaveProperty('authorization');
}, 360_000);
