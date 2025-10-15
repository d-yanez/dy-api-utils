const { makeClient } = require('./axios');
const config = require('../config/config');

const client = makeClient(config.stockApi.baseURL, {
  'Content-Type': 'application/json',
  'x-api-key': config.stockApi.apiKey
});

// GET /api/stock/:sku  ->  [{ sku, location, stock }, ...]
async function getStockBySku(sku) {
  const url = `/api/stock/${encodeURIComponent(sku)}`;
  const { data } = await client.get(url);
  if (!Array.isArray(data)) throw new Error('Invalid stock response');
  return data;
}

module.exports = { getStockBySku };
