const { Router } = require('express');
const { stockView, stockViewJson } = require('../controllers/stock.controller');
const { createLabels } = require('../controllers/enviosparahoy.controller');
const { requireApiKey } = require('../../../infrastructure/middlewares/auth');

const router = Router();

// 🔓 Público (sin auth mientras desarrollas)
router.get('/stock/view/:sku', /* requireKeyOrSignedLink, */ stockView);
router.get('/stock/data/:sku', /* requireKeyOrSignedLink, */ stockViewJson);

router.post('/enviosparahoy/label', requireApiKey, createLabels);

module.exports = router;
