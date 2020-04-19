const ow = require('ow');

exports.paginationShape = {
    limit: ow.optional.number,
    offset: ow.optional.number,
    desc: ow.optional.boolean,
};
