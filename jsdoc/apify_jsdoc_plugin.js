
const APIFY_GENERIC_PARAMS = {
    // Generic params
    'options.userId': {
        description: '<p>Your user ID at apify.com</p>',
        type: {
            names: ['String'],
        },
    },
    'options.token': {
        description: '<p>Your API token at apify.com</p>',
        type: {
            names: ['String'],
        },
    },
    'callback': {
        optional: true,
        description: '<p>Callback function</p>',
        type: {
            names: ['function'],
        },
    },
};


exports.handlers = {
    processingComplete:(evn) => {
        evn.doclets.forEach((doclet) => {
            // adds params to generic functions parameters
            if (!doclet.undocumented && doclet.params) {
                doclet.params.forEach((param) => {
                    if (APIFY_GENERIC_PARAMS[param.name]) Object.assign(param, APIFY_GENERIC_PARAMS[param.name]);
                });
            }
        });
    },
};

