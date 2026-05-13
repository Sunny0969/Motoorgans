const express = require('express');
const router = express.Router();
const {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  searchAccounts,
  getAccountsByType
} = require('../controllers/accountController');

// Routes
router.route('/').get(getAccounts).post(createAccount);
router.route('/:id').get(getAccount).put(updateAccount).delete(deleteAccount);
router.route('/search/:query').get(searchAccounts);
router.route('/type/:type').get(getAccountsByType);

module.exports = router;
