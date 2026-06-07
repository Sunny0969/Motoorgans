const express = require('express');
const router = express.Router();
const {
  getNextNumber,
  getLatest,
  getAll,
  getByDoc,
  getLocations,
  getCustomers,
  getCustomer,
  getProduct,
  getAvailable,
  createExchange,
  updateExchange,
  deleteExchange,
} = require('../controllers/exchangeController');

router.get('/next-number', getNextNumber);
router.get('/latest', getLatest);
router.get('/locations', getLocations);
router.get('/customers', getCustomers);
router.get('/customers/:id', getCustomer);
router.get('/product/:productId', getProduct);
router.get('/available/:productId', getAvailable);

router.route('/')
  .get(getAll)
  .post(createExchange);

router.route('/:doc')
  .get(getByDoc)
  .put(updateExchange)
  .delete(deleteExchange);

module.exports = router;
