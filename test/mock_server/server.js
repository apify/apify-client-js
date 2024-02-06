const http = require('http');
const path = require('path');

const bodyParser = require('body-parser');
const compression = require('compression');
const express = require('express');

// Routers
const actorRouter = require('./routes/actors');
const buildRouter = require('./routes/builds');
const datasetRouter = require('./routes/datasets');
const external = require('./routes/external');
const keyValueStores = require('./routes/key_value_stores');
const logRouter = require('./routes/logs');
const requestQueues = require('./routes/request_queues');
const runRouter = require('./routes/runs');
const schedules = require('./routes/schedules');
const store = require('./routes/store');
const taskRouter = require('./routes/tasks');
const userRouter = require('./routes/users');
const webhookDispatches = require('./routes/webhook_dispatches');
const webhooks = require('./routes/webhooks');

const app = express();
const v2Router = express.Router();
const mockServer = {
    requests: [],
    response: null,
    async start(port = 0) {
        this.server = http.createServer(app);
        return new Promise((resolve, reject) => {
            this.server.on('error', reject);
            this.server.on('listening', () => resolve(this.server));
            this.server.listen(port);
        });
    },
    async close() {
        return new Promise((resolve, reject) => {
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
    setResponse(response) {
        this.response = response;
    },
};

// Debugging middleware
app.use((req, res, next) => {
    next();
});
app.use(express.text());
app.use(express.json({ limit: '9mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.raw());
app.use(express.static(path.join(__dirname, 'public')));
app.use(compression());

app.use('/', (req, res, next) => {
    mockServer.requests.push(req);
    next();
});
app.set('mockServer', mockServer);
app.use('/v2', v2Router);
app.use('/external', external);

// Attaching V2 routers
v2Router.use('/acts', actorRouter);
v2Router.use('/actor-builds', buildRouter);
v2Router.use('/actor-runs', runRouter);
v2Router.use('/actor-tasks', taskRouter);
v2Router.use('/users', userRouter);
v2Router.use('/logs', logRouter);
v2Router.use('/datasets', datasetRouter);
v2Router.use('/key-value-stores', keyValueStores);
v2Router.use('/request-queues', requestQueues);
v2Router.use('/webhooks', webhooks);
v2Router.use('/schedules', schedules);
v2Router.use('/webhook-dispatches', webhookDispatches);
v2Router.use('/store', store);

// Debugging middleware
app.use((err, req, res, next) => { // eslint-disable-line
    res.status(500).json({ error: { message: err.message } });
});

app.use((req, res) => {
    res.status(404).json({
        error: {
            type: 'page-not-found',
            message: 'Nothing to do here.',
        },
    });
});

module.exports = mockServer;
