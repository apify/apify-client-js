class ApifyApiError extends Error {
    constructor(response, attempt) {
        let message;
        let type;
        if (response.data && response.data.error) {
            const { error } = response.data;
            message = error.message;
            type = error.type;
        } else {
            message = `Unexpected error: ${response.data}`;
        }
        super(message);
        delete this.stack;

        this.name = this.constructor.name;
        this.type = type;
        this.statusCode = response.status;
        this.url = response.config && response.config.url;
        this.method = response.config && response.config.method;
        this.attempt = attempt;
    }
}


module.exports = ApifyApiError;
