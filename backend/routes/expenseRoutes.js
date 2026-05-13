const express = require('express');
const router = express.Router();
const {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  approveExpense,
  rejectExpense,
  deleteExpense,
  getExpenseStats
} = require('../controllers/expenseController');

// Routes
router.route('/')
  .get(getAllExpenses)
  .post(createExpense);

router.route('/:id')
  .get(getExpenseById)
  .put(updateExpense)
  .delete(deleteExpense);

router.route('/:id/approve')
  .put(approveExpense);

router.route('/:id/reject')
  .put(rejectExpense);

router.route('/stats/summary')
  .get(getExpenseStats);

module.exports = router;
