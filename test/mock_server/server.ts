import type { Server } from 'node:http';
import http from 'node:http';
import path from 'node:path';

import type { Dictionary } from 'apify-client';
import bodyParser from 'body-parser';
import compression from 'compression';
import express from 'express';

// Routers
import { actorRouter } from './routes/actors';
import { buildRouter } from './routes/builds';
import { datasetRouter } from './routes/datasets';
import { external } from './routes/external';
import { keyValueStores } from './routes/key_value_stores';
import { logRouter } from './routes/logs';
import { requestQueues } from './routes/request_queues';
import { runRouter } from './routes/runs';
import { schedules } from './routes/schedules';
import { store } from './routes/store';
import { taskRouter } from './routes/tasks';
import { userRouter } from './routes/users';
import { webhookDispatches } from './routes/webhook_dispatches';
import { webhooks } from './routes/webhooks';
// Consts
import { MOCKED_ACTOR_LOGS } from './test_utils';

const defaultApp = createDefaultApp();

export const mockServer = {
    server: null as Server | null,
    requests: [] as express.Request[],
    response: null as Dictionary<any> | express.Response | null,
    async start(port = 0, app = defaultApp): Promise<Server> {
        app.set('mockServer', this);
        this.server = http.createServer(app);
        return new Promise((resolve, reject) => {
            this.server?.on('error', reject);
            this.server?.on('listening', () => resolve(this.server!));
            this.server?.listen(port);
        });
    },
    async close() {
        return new Promise<void>((resolve, reject) => {
            if (this.server) {
                this.server.close((err) => {
                    if (err) reject(err);
                    resolve();
                });
            }
        });
    },
    getLastRequest() {
        return this.requests.pop();
    },
    getLastRequests(length = 1) {
        return this.requests.slice(-length);
    },
    setResponse(response: Dictionary<any> | express.Response | null) {
        this.response = response;
    },
};

export function createDefaultApp(v2Router = express.Router()) {
    async function streamLogChunks(_: express.Request, res: express.Response) {
        // Asynchronously write each chunk to the response stream
        for (const chunk of MOCKED_ACTOR_LOGS) {
            res.write(chunk);
            // the flush method is added by the compression middleware
            (res as any).flush(); // Flush the buffer and send the chunk immediately
            // Wait for a short period to simulate work being done on the server
            await new Promise((resolve) => {
                setTimeout(resolve, 1);
            });
        }

        // End the response stream once all chunks have been sent
        res.end();
    }
    const app = express();
    // Debugging middleware
    app.use((_, __, next) => {
        next();
    });
    app.use(express.text());
    app.use(express.json({ limit: '9mb' }));
    app.use(express.urlencoded({ extended: false }));
    app.use(bodyParser.raw());
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(compression());
    app.use('/', (req: express.Request, _: express.Response, next: express.NextFunction) => {
        mockServer.requests.push(req);
        next();
    });
    app.use('/v2', v2Router);
    app.use('/external', external);

    // Attaching V2 routers
    v2Router.use('/acts/redirect-actor-id', async (_, res) => {
        res.json({ data: { name: 'redirect-actor-name', id: 'redirect-run-id' } });
    });
    v2Router.use('/acts', actorRouter);
    v2Router.use('/actor-builds', buildRouter);
    v2Router.use('/actor-runs/redirect-run-id/log', streamLogChunks);
    v2Router.use('/actor-runs/redirect-run-id', async (_, res) => {
        res.json({ data: { id: 'redirect-run-id', actId: 'redirect-actor-id', status: 'SUCCEEDED' } });
    });

    v2Router.use('/actor-runs', runRouter);
    v2Router.use('/actor-tasks', taskRouter);
    v2Router.use('/users', userRouter);
    v2Router.use('/logs/redirect-log-id', streamLogChunks);
    v2Router.use('/logs', logRouter);
    v2Router.use('/datasets', datasetRouter);
    v2Router.use('/key-value-stores', keyValueStores);
    v2Router.use('/request-queues', requestQueues);
    v2Router.use('/webhooks', webhooks);
    v2Router.use('/schedules', schedules);
    v2Router.use('/webhook-dispatches', webhookDispatches);
    v2Router.use('/store', store);

    // Debugging middleware
    app.use((err: Error, _: express.Request, res: express.Response, _next: express.NextFunction) => {
        res.status(500).json({ error: { message: err.message } });
    });

    app.use((_, res) => {
        res.status(404).json({
            error: {
                type: 'page-not-found',
                message: 'Nothing to do here.',
            },
        });
    });
    return app;
}
