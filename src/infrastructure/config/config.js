require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 8080),
  stockApi: {
    baseURL: process.env.STOCK_API_BASE,
    apiKey: process.env.STOCK_API_KEY
  },
  mlApi: {
    baseURL: process.env.ML_API_BASE,
    apiKey: process.env.ML_API_KEY,
    accountId: process.env.ML_ACCOUNT_ID
  },
  http: {
    timeoutMs: 7000,
    retries: 2
  },
  cache: {
    stockTtl: Number(process.env.CACHE_STOCK_TTL_SECONDS || 10),   // corto
    mlTtl: Number(process.env.CACHE_ML_TTL_SECONDS || 300)         // más largo
  }
};

module.exports = config;