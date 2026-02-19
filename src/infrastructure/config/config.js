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
  enviosParaHoy: {
    recipient: process.env.ENVIOSPARAHOY_RECIPIENT || 'dyanez@dyshopnow.cl',
    from: process.env.ENVIOSPARAHOY_FROM || process.env.SMTP_USER,
    smtp: {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
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
