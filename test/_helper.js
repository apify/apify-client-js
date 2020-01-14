import retry from 'async-retry';
import log from 'apify-shared/log';
import * as httpClient from '../build/http-client';
import { REQUEST_ENDPOINTS_EXP_BACKOFF_MAX_REPEATS } from '../build/request_queues';


export const DEFAULT_RATE_LIMIT_ERRORS = new Array(
    Math.max(REQUEST_ENDPOINTS_EXP_BACKOFF_MAX_REPEATS, httpClient.EXP_BACKOFF_MAX_REPEATS),
).fill(0);


export const newEmptyStats = () => {
    return {
        calls: 0,
        requests: 0,
        rateLimitErrors: [...DEFAULT_RATE_LIMIT_ERRORS],
    };
};
