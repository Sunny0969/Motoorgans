const express = require('express');
const router = express.Router();
const {
  fetchBankReceiptsList,
  fetchBankReceiptByBRV,
  fetchBankReceiptById,
  createBankReceipt,
  updateBankReceiptById,
  deleteBankReceiptById,
  getNextBRVNumber,
} = require('../utils/mssqlRepository');

router.get('/next-brv', async (req, res) => {
  try {
    const nextBrv = await getNextBRVNumber();
    res.json({ nextBrv });
  } catch (err) {
    console.error('Error getting next BRV:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/list', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const records = await fetchBankReceiptsList(limit);
    res.json(records);
  } catch (err) {
    console.error('Error fetching bank receipts list:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/by-brv/:brvNo', async (req, res) => {
  try {
    const records = await fetchBankReceiptByBRV(req.params.brvNo);
    res.json(records);
  } catch (err) {
    console.error('Error fetching bank receipt:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const record = await fetchBankReceiptById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Bank receipt not found' });
    }
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const result = await createBankReceipt(req.body);
    res.status(201).json(result);
  } catch (err) {
    console.error('Error creating bank receipt:', err);
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const result = await updateBankReceiptById(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    console.error('Error updating bank receipt:', err);
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await deleteBankReceiptById(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('Error deleting bank receipt:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
