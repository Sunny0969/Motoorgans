const express = require('express');
const router = express.Router();
const {
  getNextNumber,
  getLatest,
  getPurchaseOrders,
  getPurchaseOrder,
  getSuppliersList,
  getProduct,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
} = require('../controllers/purchaseOrderController');

router.get('/next-number', getNextNumber);
router.get('/latest', getLatest);
router.get('/suppliers', getSuppliersList);
router.get('/product/:productId', getProduct);

router.route('/')
  .get(getPurchaseOrders)
  .post(createPurchaseOrder);

router.route('/:doc')
  .get(getPurchaseOrder)
  .put(updatePurchaseOrder)
  .delete(deletePurchaseOrder);

module.exports = router;
