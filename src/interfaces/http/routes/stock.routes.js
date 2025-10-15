const { Router } = require('express');
const { stockView, stockViewJson } = require('../controllers/stock.controller');
const { requireKeyOrSignedLink } = require('../../../infrastructure/middlewares/auth');

const router = Router();

// Vista HTML
router.get('/stock/view/:sku', requireKeyOrSignedLink, stockView);

// Nueva ruta JSON
router.get('/stock/data/:sku', requireKeyOrSignedLink, stockViewJson);

module.exports = router;