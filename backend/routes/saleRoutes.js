const express = require('express');
const router = express.Router();
const {
  fetchSalesByCustomer,
  fetchProductSoldHistory,
  createSale,
  updateSale: updateSaleInDB,
  deleteSale: deleteSaleFromDB,
  searchSaleByInvoice,
  fetchCustomerBalance,
  fetchSaleByDoc,
  fetchLatestSale,
} = require('../utils/mssqlRepository');

router.route('/').get(async (req, res) => {
  try {
    res.json([]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const result = await createSale(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({ message: 'Failed to save sale: ' + error.message });
  }
});

router.route('/search-invoice/:invoiceNo').get(async (req, res) => {
  try {
    const sale = await searchSaleByInvoice(req.params.invoiceNo);
    if (!sale) return res.status(404).json({ message: 'Invoice not found' });
    res.json(sale);
  } catch (err) {
    console.error('Error searching sale:', err);
    res.status(500).json({ message: err.message });
  }
});

router.route('/customer-balance/:customerId').get(async (req, res) => {
  try {
    const balance = await fetchCustomerBalance(req.params.customerId);
    res.json({ balance });
  } catch (err) {
    console.error('Error fetching customer balance:', err);
    res.status(500).json({ message: err.message });
  }
});

router.route('/customer-history/:customerId').get(async (req, res) => {
  try {
    const history = await fetchSalesByCustomer(req.params.customerId);
    res.json(history);
  } catch (err) {
    console.error('Error fetching customer sale history:', err);
    res.status(500).json({ message: err.message });
  }
});

router.route('/product-sold-history/:customerId/:productId').get(async (req, res) => {
  try {
    const history = await fetchProductSoldHistory(req.params.customerId, req.params.productId);
    res.json(history);
  } catch (err) {
    console.error('Error fetching product sold history:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/latest', async (req, res) => {
  try {
    const sale = await fetchLatestSale();
    if (!sale) return res.status(404).json({ message: 'No sales found' });
    res.json(sale);
  } catch (err) {
    console.error('Error fetching latest sale:', err);
    res.status(500).json({ message: err.message });
  }
});

router.route('/:doc').get(async (req, res) => {
  try {
    const sale = await fetchSaleByDoc(req.params.doc);
    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}).put(async (req, res) => {
  try {
    const result = await updateSaleInDB(req.params.doc, req.body);
    res.json(result);
  } catch (error) {
    console.error('Error updating sale:', error);
    res.status(500).json({ message: 'Failed to update sale: ' + error.message });
  }
}).delete(async (req, res) => {
  try {
    const result = await deleteSaleFromDB(req.params.doc);
    res.json(result);
  } catch (error) {
    console.error('Error deleting sale:', error);
    res.status(500).json({ message: 'Failed to delete sale: ' + error.message });
  }
});

module.exports = router;
