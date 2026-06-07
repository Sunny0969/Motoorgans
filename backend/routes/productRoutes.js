const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  getNextProductId,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  updateStock
} = require('../controllers/productController');

// Routes
router.get('/next-id', getNextProductId);
router.route('/').get(getProducts).post(createProduct);
router.route('/:id').get(getProduct).put(updateProduct).delete(deleteProduct);
router.route('/:id/stock').put(updateStock);
router.route('/search/:query').get(searchProducts);

module.exports = router;
