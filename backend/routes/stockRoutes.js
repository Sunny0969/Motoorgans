const express = require('express');
const router = express.Router();
const { getStock } = require('../controllers/stockController');
const { fetchProductOnHand } = require('../utils/mssqlRepository');

router.get('/product/:productId', async (req, res) => {
  try {
    const onHandQty = await fetchProductOnHand(req.params.productId);
    res.json({ productId: req.params.productId, onHandQty });
  } catch (err) {
    console.error('GET /api/stock/product/:productId error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/', getStock);
module.exports = router;
