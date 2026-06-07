const express = require('express');
const router = express.Router();
const {
  getNextNumber,
  getLatest,
  getDemandOrders,
  getDemandOrder,
  getStockStatus,
  getProductInfo,
  createDemandOrder,
  updateDemandOrder,
  deleteDemandOrder,
} = require('../controllers/demandOrderController');

router.get('/next-number', getNextNumber);
router.get('/latest', getLatest);
router.get('/stock-status', getStockStatus);
router.get('/product/:productId', getProductInfo);

router.route('/')
  .get(getDemandOrders)
  .post(createDemandOrder);

router.route('/:doc')
  .get(getDemandOrder)
  .put(updateDemandOrder)
  .delete(deleteDemandOrder);

module.exports = router;
