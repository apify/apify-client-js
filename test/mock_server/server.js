const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');
const http = require('http');
const logger = require('morgan');
const compression = require('compression');

// Routers
const actorRouter = require('./routes/actors');
const taskRouter = require('./routes/tasks');
const userRouter = require('./routes/users');
const logRouter = require('./routes/logs');
const datasetRouter = require('./routes/datasets');
const keyValueStores = require('./routes/key_value_stores');
const requestQueues = require('./routes/request_queues');
const webhooks = require('./routes/webhooks');
const schedules = require('./routes/schedules');
const webhookDispatches = require('./routes/webhook_dispatches');
const external = require('./routes/external');

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
    setResponse(response) {
        this.response = response;
    },
};

// Debugging middleware
app.use((req, res, next) => {
    next();
});
app.use(logger('dev'));
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
v2Router.use('/actor-tasks', taskRouter);
v2Router.use('/users', userRouter);
v2Router.use('/logs', logRouter);
v2Router.use('/datasets', datasetRouter);
v2Router.use('/key-value-stores', keyValueStores);
v2Router.use('/request-queues', requestQueues);
v2Router.use('/webhooks', webhooks);
v2Router.use('/schedules', schedules);
v2Router.use('/webhook-dispatches', webhookDispatches);

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
