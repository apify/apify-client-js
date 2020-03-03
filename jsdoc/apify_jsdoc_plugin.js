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
};

exports.handlers = {
    processingComplete: (evn) => {
        evn.doclets.forEach((doclet) => {
            // Skip setting generic params for whole ApifyClient.users
            // We need set different comments for userId and token
            if (doclet.memberof !== 'ApifyClient.users') {
                // adds params to generic functions parameters
                if (!doclet.undocumented && doclet.params) {
                    doclet.params.forEach((param) => {
                        if (APIFY_GENERIC_PARAMS[param.name]) Object.assign(param, APIFY_GENERIC_PARAMS[param.name]);
                    });
                }
            }
        });
    },
};
