const express = require('express');
const router = express.Router();
const {
  fetchCashPayments,
  fetchCashPaymentsByCPV,
  createCashPayment,
  updateCashPaymentById,
  deleteCashPaymentById,
  getNextCPVNumber,
} = require('../utils/mssqlRepository');

router.get('/next-cpv', async (req, res) => {
  try {
    const nextCpv = await getNextCPVNumber();
    res.json({ nextCpv });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/by-cpv/:cpvNo', async (req, res) => {
  try {
    const records = await fetchCashPaymentsByCPV(req.params.cpvNo);
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const records = await fetchCashPayments(fromDate, toDate);
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const result = await createCashPayment(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const result = await updateCashPaymentById(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await deleteCashPaymentById(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
