const express = require('express');
const router = express.Router();
const {
  fetchBankPaymentsList,
  fetchBankPaymentByBPV,
  fetchBankPaymentById,
  createBankPayment,
  updateBankPaymentById,
  deleteBankPaymentById,
  getNextBPVNumber,
} = require('../utils/mssqlRepository');

router.get('/next-bpv', async (req, res) => {
  try {
    const nextBpv = await getNextBPVNumber();
    res.json({ nextBpv });
  } catch (err) {
    console.error('Error getting next BPV:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/list', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const records = await fetchBankPaymentsList(limit);
    res.json(records);
  } catch (err) {
    console.error('Error fetching bank payments list:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/by-bpv/:bpvNo', async (req, res) => {
  try {
    const records = await fetchBankPaymentByBPV(req.params.bpvNo);
    res.json(records);
  } catch (err) {
    console.error('Error fetching bank payment:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (req.params.id === 'list' || req.params.id === 'next-bpv') {
      return res.status(404).json({ message: 'Not found' });
    }
    const record = await fetchBankPaymentById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Bank payment not found' });
    }
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const result = await createBankPayment(req.body);
    res.status(201).json(result);
  } catch (err) {
    console.error('Error creating bank payment:', err);
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const result = await updateBankPaymentById(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    console.error('Error updating bank payment:', err);
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await deleteBankPaymentById(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('Error deleting bank payment:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
