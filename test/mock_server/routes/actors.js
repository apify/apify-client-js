const express = require('express');

function respondWithJson(id) {
    return (req, res) => {
        const data = {
            id,
            body: req.body,
            params: req.params,
        };
        const payload = { data };
        res.json(payload);
    };
}

const actors = express.Router();

actors.get('/', respondWithJson('list-actors'));
actors.post('/', respondWithJson('create-actor'));
actors.put('/:id', respondWithJson('update-actor'));

module.exports = actors;
