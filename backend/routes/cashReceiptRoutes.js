const express = require('express');
const router = express.Router();
const {
  fetchCashReceiptsByCRV,
  createCashReceipt,
  deleteCashReceiptById,
  getNextCRVNumber,
} = require('../utils/mssqlRepository');

router.get('/next-crv', async (req, res) => {
  try {
    const nextCrv = await getNextCRVNumber();
    res.json({ nextCrv });
  } catch (err) {
    console.error('Error getting next CRV:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/by-crv/:crvNo', async (req, res) => {
  try {
    const records = await fetchCashReceiptsByCRV(req.params.crvNo);
    res.json(records);
  } catch (err) {
    console.error('Error fetching cash receipts:', err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const result = await createCashReceipt(req.body);
    res.status(201).json(result);
  } catch (err) {
    console.error('Error creating cash receipt:', err);
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await deleteCashReceiptById(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('Error deleting cash receipt:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
