const StockEntry = require('../../domain/entities/stock-entry.entity');
const { getStockBySku } = require('../../infrastructure/http/stock.client');
const { getMlItemBySku } = require('../../infrastructure/http/ml.client');
const { stockCache, mlCache, cacheGet, cacheSet } = require('../../infrastructure/cache/cache');

function pickRelation(relations) {
  if (!Array.isArray(relations) || relations.length === 0) return null;
  const preferred = relations.find((rel) => Number(rel.stock_relation) === 1);
  return preferred || relations[0];
}

function deriveSkuFromRelationId(relationId) {
  if (!relationId) return null;
  const raw = String(relationId).trim();
  if (!raw) return null;
  const derived = raw.replace(/^[A-Za-z]+/, '');
  return derived || null;
}

async function getStockView({ sku, noCache = false }) {
  if (!sku || !/^\d+$/.test(String(sku))) {
    const err = new Error('SKU inválido. Debe ser numérico.');
    err.status = 400; err.publicMessage = err.message;
    throw err;
  }

  const sourceSku = String(sku);
  const stockKey = `stock:${sourceSku}`;
  const mlKey = `ml:${sourceSku}`;

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
    stockList = await getStockBySku(sourceSku);
    if (!noCache) cacheSet(stockCache, stockKey, stockList);
  }
  if (!itemInfo) {
    itemInfo = await getMlItemBySku(sourceSku);
    if (!noCache) cacheSet(mlCache, mlKey, itemInfo);
  }

  let resolvedSku = sourceSku;
  let fallbackUsed = false;
  let relationItemId = null;
  let resolvedFrom = null;

  if (!stockList || stockList.length === 0) {
    const relation = pickRelation(itemInfo.itemRelations);
    relationItemId = relation && relation.id ? String(relation.id) : null;
    const derivedSku = deriveSkuFromRelationId(relationItemId);

    if (derivedSku && derivedSku !== sourceSku) {
      const derivedList = await getStockBySku(derivedSku);
      if (Array.isArray(derivedList) && derivedList.length > 0) {
        stockList = derivedList;
        resolvedSku = derivedSku;
        fallbackUsed = true;
        resolvedFrom = 'item_relations';
        if (!noCache) {
          cacheSet(stockCache, `stock:${derivedSku}`, stockList);
          cacheSet(stockCache, stockKey, stockList);
        }
      }
    }
  }

  const entries = stockList.map(r => new StockEntry(r));
  const total = entries.reduce((acc, r) => acc + r.stock, 0);

  return {
    sku: sourceSku,
    total,
    item: itemInfo,
    rows: entries,
    _cache: { stock: stockHit ? 'HIT' : 'MISS', ml: mlHit ? 'HIT' : 'MISS' },
    sourceSku,
    resolvedSku,
    fallbackUsed,
    resolvedFrom,
    relationItemId
  };
}

module.exports = { getStockView };
