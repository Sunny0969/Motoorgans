const express = require('express');
const router = express.Router();
const {
  getAllTransactionClasses,
  getTransactionClassById,
  createTransactionClass,
  updateTransactionClass,
  deleteTransactionClass,
  getTransactionClassesByCategory
} = require('../controllers/transactionClassController');

// Routes for transaction classes
router.route('/')
  .get(getAllTransactionClasses)
  .post(createTransactionClass);

router.route('/:id')
  .get(getTransactionClassById)
  .put(updateTransactionClass)
  .delete(deleteTransactionClass);

router.route('/category/:category')
  .get(getTransactionClassesByCategory);

module.exports = router;
