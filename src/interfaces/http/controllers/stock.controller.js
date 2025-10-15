const logger = require('../../../infrastructure/logging/logger');
const { getStockView } = require('../../../application/use-cases/get-stock-view.usecase');

async function stockView(req, res, next) {
  try {
    const { sku } = req.params;
    res.render('stock-loading', { sku });
  } catch (err) {
    logger.error({ msg: 'stockView failed', err: err.message });
    next(err);
  }
}

async function stockViewJson(req, res, next) {
  try {
    const { sku } = req.params;
    const fresh = String(req.query.fresh || '').toLowerCase();
    const noCache = fresh === '1' || fresh === 'true' || fresh === 'yes';

    const vm = await getStockView({ sku, noCache });

    // expón headers para debug
    res.set('x-cache-stock', vm._cache.stock);
    res.set('x-cache-ml', vm._cache.ml);

    res.json(vm);
  } catch (err) {
    logger.error({ msg: 'stockViewJson failed', err: err.message });
    next(err);
  }
}

module.exports = { stockView, stockViewJson };