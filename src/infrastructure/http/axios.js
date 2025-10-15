const axios = require('axios');
const axiosRetryDefault = require('axios-retry').default;
const { exponentialDelay, isNetworkOrIdempotentRequestError } = require('axios-retry');
const config = require('../config/config');
const logger = require('../logging/logger');
const { getContext } = require('../observability/als');

const MODE = (process.env.OUTBOUND_LOG_MODE || 'errors').toLowerCase(); // errors | slow | off
const SLOW_MS = Number(process.env.OUTBOUND_SLOW_MS || 800);

function makeClient(baseURL, headers = {}) {
  const instance = axios.create({
    baseURL,
    timeout: config.http.timeoutMs,
    headers
  });

  axiosRetryDefault(instance, {
    retries: config.http.retries,
    retryDelay: exponentialDelay,
    retryCondition: (error) =>
      isNetworkOrIdempotentRequestError(error) ||
      error.code === 'ECONNABORTED' ||
      (error.response && error.response.status >= 500)
  });

  instance.interceptors.request.use((req) => {
    const { requestId } = getContext();
    if (requestId) req.headers['x-request-id'] = requestId;
    req.metadata = { start: process.hrtime.bigint() };
    return req;
  });

  instance.interceptors.response.use(
    (res) => {
      if (MODE === 'off') return res;
      if (MODE === 'slow') {
        const started = res.config.metadata?.start;
        if (started) {
          const ms = Math.round(Number(process.hrtime.bigint() - started) / 1e6);
          if (ms >= SLOW_MS) {
            const { requestId } = getContext();
            logger.warn(`slow_outbound ${ms}ms`, {
              requestId, baseURL: res.config.baseURL, url: res.config.url, status: res.status
            });
          }
        }
      }
      return res;
    },
    (err) => {
      if (MODE === 'off') return Promise.reject(err);
      const cfg = err.config || {};
      const started = cfg.metadata?.start;
      const ms = started ? Math.round(Number(process.hrtime.bigint() - started) / 1e6) : undefined;
      const { requestId } = getContext();
      logger.error('outbound_error', {
        requestId, baseURL: cfg.baseURL, url: cfg.url, code: err.code, status: err.response?.status, duration_ms: ms
      });
      return Promise.reject(err);
    }
  );

  return instance;
}

module.exports = { makeClient };