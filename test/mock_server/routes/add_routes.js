const HANDLERS = {
    json(id) {
        return (req, res) => {
            const [resourceId] = Object.values(req.params);
            const responseStatusCode = Number(resourceId) || 200;
            let payload;
            if (responseStatusCode === 200) payload = { data: { id } };
            else if (responseStatusCode === 204) payload = null;
            else if (responseStatusCode === 404) {
                payload = {
                    error: {
                        type: 'record-not-found',
                        message: 'Record with this name was not found',
                    },
                };
            }

            res
                .status(responseStatusCode)
                .json(payload);
        };
    },
    responseJsonMock() {
        return (req, res) => {
            const mockServer = req.app.get('mockServer');
            const { body, headers = {}, statusCode = 200 } = mockServer.response;
            let payload;
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
            res
                .status(statusCode)
                .set(headers)
                .send(payload);
        };
    },
};

exports.addRoutes = (router, routes) => {
    routes.forEach((route) => {
        const type = route.type ? route.type : 'json';
        const handler = HANDLERS[type];
        const method = route.method.toLowerCase();
        router[method](route.path, handler(route.id));
    });
};
