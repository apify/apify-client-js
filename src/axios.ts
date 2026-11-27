// The entry point of `apify-client/axios`, kept apart from the main one so that only its users need axios.
export type { AxiosHttpClientOptions, RequestInterceptorFunction } from './http_clients/axios.js';
export { AxiosHttpClient } from './http_clients/axios.js';
