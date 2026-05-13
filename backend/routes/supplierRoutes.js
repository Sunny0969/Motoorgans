const express = require('express');
const router = express.Router();
const {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  searchSuppliers
} = require('../controllers/supplierController');

// Routes
router.route('/').get(getSuppliers).post(createSupplier);
router.route('/:id').get(getSupplier).put(updateSupplier).delete(deleteSupplier);
router.route('/search/:query').get(searchSuppliers);

module.exports = router;
