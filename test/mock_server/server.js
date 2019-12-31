const express = require('express');
const path = require('path');
const http = require('http');
const logger = require('morgan');
const compression = require('compression');
const actorRouter = require('./routes/actors');

const app = express();
const v2Router = express.Router();
const mockServer = {
    requests: [],
    async start(port = 0) {
        this.server = http.createServer(app);
        return new Promise((resolve, reject) => {
            this.server.on('error', reject);
            this.server.on('listening', () => resolve(this.server));
            this.server.listen(port);
        });
    },
    close() {
        if (this.server) this.server.close();
    },
    getLastRequest() {
        return this.requests.pop();
    },
};

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(compression());

app.use('/', (req, res, next) => {
    mockServer.requests.push(req);
    next();
});

app.use('/v2', v2Router);
v2Router.use('/acts', actorRouter);

module.exports = mockServer;
