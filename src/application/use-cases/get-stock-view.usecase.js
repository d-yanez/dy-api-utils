const StockEntry = require('../../domain/entities/stock-entry.entity');
const { getStockBySku } = require('../../infrastructure/http/stock.client');
const { getMlItemBySku } = require('../../infrastructure/http/ml.client');
const { stockCache, mlCache, cacheGet, cacheSet } = require('../../infrastructure/cache/cache');

async function getStockView({ sku, noCache = false }) {
  if (!sku || !/^\d+$/.test(String(sku))) {
    const err = new Error('SKU inválido. Debe ser numérico.');
    err.status = 400; err.publicMessage = err.message;
    throw err;
  }

  const stockKey = `stock:${sku}`;
  const mlKey = `ml:${sku}`;

  let stockList, itemInfo;
  let stockHit = false, mlHit = false;

  if (!noCache) {
    const cachedStock = cacheGet(stockCache, stockKey);
    if (cachedStock) { stockList = cachedStock; stockHit = true; }
    const cachedMl = cacheGet(mlCache, mlKey);
    if (cachedMl) { itemInfo = cachedMl; mlHit = true; }
  }

  // Si falta alguno, lo pedimos “fresh”
  if (!stockList) {
    stockList = await getStockBySku(sku);
    cacheSet(stockCache, stockKey, stockList);
  }
  if (!itemInfo) {
    itemInfo = await getMlItemBySku(sku);
    cacheSet(mlCache, mlKey, itemInfo);
  }

  const entries = stockList.map(r => new StockEntry(r));
  const total = entries.reduce((acc, r) => acc + r.stock, 0);

  return {
    sku: String(sku),
    total,
    item: itemInfo,
    rows: entries,
    _cache: { stock: stockHit ? 'HIT' : 'MISS', ml: mlHit ? 'HIT' : 'MISS' }
  };
}

module.exports = { getStockView };