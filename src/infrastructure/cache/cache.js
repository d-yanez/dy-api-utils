const NodeCache = require('node-cache');
const config = require('../config/config');

const stockCache = new NodeCache({ stdTTL: config.cache.stockTtl, checkperiod: Math.max(5, Math.floor(config.cache.stockTtl/2)) });
const mlCache = new NodeCache({ stdTTL: config.cache.mlTtl, checkperiod: Math.max(30, Math.floor(config.cache.mlTtl/2)) });

function cacheGet(cache, key) {
  const val = cache.get(key);
  return val === undefined ? null : val;
}
function cacheSet(cache, key, val) {
  cache.set(key, val);
}

module.exports = {
  stockCache,
  mlCache,
  cacheGet,
  cacheSet
};