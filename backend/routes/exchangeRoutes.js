const express = require('express');
const router = express.Router();
const exchangeController = require('../controllers/exchangeController');

// Routes for exchange operations
router.get('/', exchangeController.getAllExchanges);
router.get('/statistics', exchangeController.getExchangeStatistics);
router.get('/status/:status', exchangeController.getExchangesByStatus);
router.get('/customer/:customer', exchangeController.getExchangesByCustomer);
router.get('/:id', exchangeController.getExchangeById);
router.post('/', exchangeController.createExchange);
router.put('/:id', exchangeController.updateExchange);
router.delete('/:id', exchangeController.deleteExchange);

module.exports = router;
