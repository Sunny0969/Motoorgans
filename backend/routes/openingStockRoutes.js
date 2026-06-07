const express = require('express');
const router = express.Router();
const {
  getNextNumber,
  getLatest,
  getAllOpeningStocks,
  getOpeningStockById,
  getLocations,
  getProduct,
  createOpeningStock,
  updateOpeningStock,
  deleteOpeningStock,
} = require('../controllers/openingStockController');

router.get('/next-number', getNextNumber);
router.get('/latest', getLatest);
router.get('/locations', getLocations);
router.get('/product/:productId', getProduct);

router.route('/')
  .get(getAllOpeningStocks)
  .post(createOpeningStock);

router.route('/:doc')
  .get(getOpeningStockById)
  .put(updateOpeningStock)
  .delete(deleteOpeningStock);

module.exports = router;
