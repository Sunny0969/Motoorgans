const ChequeTransfer = require('../models/ChequeTransfer');
const Supplier = require('../models/Supplier');
const Account = require('../models/Account');

// Get all cheque transfers
const getAllChequeTransfers = async (req, res) => {
  try {
    const chequeTransfers = await ChequeTransfer.find()
      .populate('supplier', 'name code')
      .populate('bankAccount', 'accountTitle code')
      .sort({ createdAt: -1 });

    res.status(200).json(chequeTransfers);
  } catch (error) {
    console.error('Error fetching cheque transfers:', error);
    res.status(500).json({ message: 'Error fetching cheque transfers', error: error.message });
  }
};

// Get cheque transfer by ID
const getChequeTransferById = async (req, res) => {
  try {
    const { id } = req.params;
    const chequeTransfer = await ChequeTransfer.findById(id)
      .populate('supplier', 'name code address phone email')
      .populate('bankAccount', 'accountTitle code');

    if (!chequeTransfer) {
      return res.status(404).json({ message: 'Cheque transfer not found' });
    }

    res.status(200).json(chequeTransfer);
  } catch (error) {
    console.error('Error fetching cheque transfer:', error);
    res.status(500).json({ message: 'Error fetching cheque transfer', error: error.message });
  }
};

// Create new cheque transfer
const createChequeTransfer = async (req, res) => {
  try {
    const {
      transferNumber,
      date,
      transferDate,
      transferType,
      supplier,
      invoiceNumber,
      bankAccount,
      chequeNumber,
      chequeDate,
      payeeName,
      amount,
      currency,
      reference,
      preparedBy,
      approvedBy,
      status,
      notes,
      invoices,
      summary
    } = req.body;

    // Validate required fields
    if (!transferNumber || !supplier || !bankAccount || !chequeNumber || !payeeName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if transfer number already exists
    const existingTransfer = await ChequeTransfer.findOne({ transferNumber });
    if (existingTransfer) {
      return res.status(400).json({ message: 'Transfer number already exists' });
    }

    // Validate supplier exists
    const supplierExists = await Supplier.findById(supplier);
    if (!supplierExists) {
      return res.status(400).json({ message: 'Invalid supplier' });
    }

    // Validate bank account exists
    const accountExists = await Account.findById(bankAccount);
    if (!accountExists) {
      return res.status(400).json({ message: 'Invalid bank account' });
    }

    // Calculate summary if not provided
    let calculatedSummary = summary;
    if (!calculatedSummary && invoices && invoices.length > 0) {
      const totalInvoices = invoices.length;
      const totalPaymentAmount = invoices.reduce((sum, invoice) => sum + (parseFloat(invoice.paymentAmount) || 0), 0);
      const totalPaid = invoices.reduce((sum, invoice) => sum + (parseFloat(invoice.paidAmount) || 0), 0);

      calculatedSummary = {
        totalInvoices,
        totalPaymentAmount,
        totalPaid
      };
    }

    const newChequeTransfer = new ChequeTransfer({
      transferNumber,
      date,
      transferDate,
      transferType,
      supplier,
      invoiceNumber,
      bankAccount,
      chequeNumber,
      chequeDate,
      payeeName,
      amount,
      currency,
      reference,
      preparedBy,
      approvedBy,
      status: status || 'Pending',
      notes,
      invoices: invoices || [],
      summary: calculatedSummary || { totalInvoices: 0, totalPaymentAmount: 0, totalPaid: 0 }
    });

    const savedTransfer = await newChequeTransfer.save();
    const populatedTransfer = await ChequeTransfer.findById(savedTransfer._id)
      .populate('supplier', 'name code')
      .populate('bankAccount', 'accountTitle code');

    res.status(201).json(populatedTransfer);
  } catch (error) {
    console.error('Error creating cheque transfer:', error);
    res.status(500).json({ message: 'Error creating cheque transfer', error: error.message });
  }
};

// Update cheque transfer
const updateChequeTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate supplier if provided
    if (updateData.supplier) {
      const supplierExists = await Supplier.findById(updateData.supplier);
      if (!supplierExists) {
        return res.status(400).json({ message: 'Invalid supplier' });
      }
    }

    // Validate bank account if provided
    if (updateData.bankAccount) {
      const accountExists = await Account.findById(updateData.bankAccount);
      if (!accountExists) {
        return res.status(400).json({ message: 'Invalid bank account' });
      }
    }

    // Recalculate summary if invoices are updated
    if (updateData.invoices) {
      const totalInvoices = updateData.invoices.length;
      const totalPaymentAmount = updateData.invoices.reduce((sum, invoice) => sum + (parseFloat(invoice.paymentAmount) || 0), 0);
      const totalPaid = updateData.invoices.reduce((sum, invoice) => sum + (parseFloat(invoice.paidAmount) || 0), 0);

      updateData.summary = {
        totalInvoices,
        totalPaymentAmount,
        totalPaid
      };
      updateData.amount = totalPaymentAmount;
    }

    const updatedTransfer = await ChequeTransfer.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('supplier', 'name code')
      .populate('bankAccount', 'accountTitle code');

    if (!updatedTransfer) {
      return res.status(404).json({ message: 'Cheque transfer not found' });
    }

    res.status(200).json(updatedTransfer);
  } catch (error) {
    console.error('Error updating cheque transfer:', error);
    res.status(500).json({ message: 'Error updating cheque transfer', error: error.message });
  }
};

// Update cheque transfer status
const updateChequeTransferStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approvedBy } = req.body;

    const validStatuses = ['Pending', 'Submitted', 'Approved', 'Cheque Issued', 'Cheque Delivered', 'Cleared'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updateData = { status };
    if (approvedBy && status === 'Approved') {
      updateData.approvedBy = approvedBy;
    }

    const updatedTransfer = await ChequeTransfer.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('supplier', 'name code')
      .populate('bankAccount', 'accountTitle code');

    if (!updatedTransfer) {
      return res.status(404).json({ message: 'Cheque transfer not found' });
    }

    res.status(200).json(updatedTransfer);
  } catch (error) {
    console.error('Error updating cheque transfer status:', error);
    res.status(500).json({ message: 'Error updating cheque transfer status', error: error.message });
  }
};

// Delete cheque transfer
const deleteChequeTransfer = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedTransfer = await ChequeTransfer.findByIdAndDelete(id);

    if (!deletedTransfer) {
      return res.status(404).json({ message: 'Cheque transfer not found' });
    }

    res.status(200).json({ message: 'Cheque transfer deleted successfully' });
  } catch (error) {
    console.error('Error deleting cheque transfer:', error);
    res.status(500).json({ message: 'Error deleting cheque transfer', error: error.message });
  }
};

// Get cheque transfers by supplier
const getChequeTransfersBySupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;

    const chequeTransfers = await ChequeTransfer.find({ supplier: supplierId })
      .populate('supplier', 'name code')
      .populate('bankAccount', 'accountTitle code')
      .sort({ createdAt: -1 });

    res.status(200).json(chequeTransfers);
  } catch (error) {
    console.error('Error fetching cheque transfers by supplier:', error);
    res.status(500).json({ message: 'Error fetching cheque transfers by supplier', error: error.message });
  }
};

// Get cheque transfers by status
const getChequeTransfersByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    const chequeTransfers = await ChequeTransfer.find({ status })
      .populate('supplier', 'name code')
      .populate('bankAccount', 'accountTitle code')
      .sort({ createdAt: -1 });

    res.status(200).json(chequeTransfers);
  } catch (error) {
    console.error('Error fetching cheque transfers by status:', error);
    res.status(500).json({ message: 'Error fetching cheque transfers by status', error: error.message });
  }
};

module.exports = {
  getAllChequeTransfers,
  getChequeTransferById,
  createChequeTransfer,
  updateChequeTransfer,
  updateChequeTransferStatus,
  deleteChequeTransfer,
  getChequeTransfersBySupplier,
  getChequeTransfersByStatus
};
