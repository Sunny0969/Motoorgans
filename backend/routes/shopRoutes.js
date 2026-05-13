const express = require('express');
const router = express.Router();
const {
  getShops,
  getShop,
  createShop,
  updateShop,
  deleteShop,
  searchShops
} = require('../controllers/shopController');

// Routes
router.route('/')
  .get(getShops)
  .post(createShop);

router.route('/:id')
  .get(getShop)
  .put(updateShop)
  .delete(deleteShop);

router.route('/search/:query')
  .get(searchShops);

module.exports = router;
