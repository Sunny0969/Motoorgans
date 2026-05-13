const express = require('express');
const router = express.Router();
const {
  getAllChequeTransfers,
  getChequeTransferById,
  createChequeTransfer,
  updateChequeTransfer,
  updateChequeTransferStatus,
  deleteChequeTransfer,
  getChequeTransfersBySupplier,
  getChequeTransfersByStatus
} = require('../controllers/chequeTransferController');

// GET /api/cheque-transfers - Get all cheque transfers
router.get('/', getAllChequeTransfers);

// GET /api/cheque-transfers/:id - Get cheque transfer by ID
router.get('/:id', getChequeTransferById);

// POST /api/cheque-transfers - Create new cheque transfer
router.post('/', createChequeTransfer);

// PUT /api/cheque-transfers/:id - Update cheque transfer
router.put('/:id', updateChequeTransfer);

// PATCH /api/cheque-transfers/:id/status - Update cheque transfer status
router.patch('/:id/status', updateChequeTransferStatus);

// DELETE /api/cheque-transfers/:id - Delete cheque transfer
router.delete('/:id', deleteChequeTransfer);

// GET /api/cheque-transfers/supplier/:supplierId - Get cheque transfers by supplier
router.get('/supplier/:supplierId', getChequeTransfersBySupplier);

// GET /api/cheque-transfers/status/:status - Get cheque transfers by status
router.get('/status/:status', getChequeTransfersByStatus);

module.exports = router;
