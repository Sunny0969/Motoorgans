const express = require('express');
const router = express.Router();
const {
  fetchPendingCheques,
  getNextChequeTransferDoc,
  fetchChequeTransferByDoc,
  fetchChequeTransferById,
  createChequeTransfer,
  updateChequeTransferById,
  deleteChequeTransferById,
} = require('../utils/mssqlRepository');

router.get('/next-doc', async (req, res) => {
  try {
    const nextDoc = await getNextChequeTransferDoc();
    res.json({ nextDoc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/pending', async (req, res) => {
  try {
    const filter = req.query.filter || 'received';
    const search = req.query.search || '';
    const records = await fetchPendingCheques(filter, search);
    res.json(records);
  } catch (err) {
    console.error('Error fetching pending cheques:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/by-doc/:doc', async (req, res) => {
  try {
    const data = await fetchChequeTransferByDoc(req.params.doc);
    if (!data) {
      return res.status(404).json({ message: 'Cheque transfer not found' });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (id === 'pending' || id === 'next-doc') {
      return res.status(404).json({ message: 'Not found' });
    }
    const data = await fetchChequeTransferById(id);
    if (!data) {
      return res.status(404).json({ message: 'Cheque transfer not found' });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const result = await createChequeTransfer(req.body);
    res.status(201).json(result);
  } catch (err) {
    console.error('Error creating cheque transfer:', err);
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const result = await updateChequeTransferById(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await deleteChequeTransferById(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
