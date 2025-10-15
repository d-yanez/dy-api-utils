const axios = require('axios');

// 👇 Import robusto para axios-retry v4 con CJS
const axiosRetryDefault = require('axios-retry').default;
const { exponentialDelay, isNetworkOrIdempotentRequestError } = require('axios-retry');

const config = require('../config/config');

function makeClient(baseURL, headers = {}) {
  const instance = axios.create({
    baseURL,
    timeout: config.http.timeoutMs,
    headers
  });

  // Configura reintentos exponenciales (con jitter natural de la función)
  axiosRetryDefault(instance, {
    retries: config.http.retries,
    retryDelay: exponentialDelay,
    retryCondition: (error) =>
      isNetworkOrIdempotentRequestError(error) ||
      error.code === 'ECONNABORTED' ||
      (error.response && error.response.status >= 500)
  });

  return instance;
}

module.exports = { makeClient };
