const BankReceipt = require('../models/BankReceipt');

// @desc    Get all bank receipts
// @route   GET /api/bankreceipts
// @access  Public
const getBankReceipts = async (req, res) => {
  try {
    const bankReceipts = await BankReceipt.find().sort({ createdAt: -1 });
    res.json(bankReceipts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single bank receipt
// @route   GET /api/bankreceipts/:id
// @access  Public
const getBankReceipt = async (req, res) => {
  try {
    const bankReceipt = await BankReceipt.findById(req.params.id);
    if (!bankReceipt) {
      return res.status(404).json({ message: 'Bank receipt not found' });
    }
    res.json(bankReceipt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create bank receipt
// @route   POST /api/bankreceipts
// @access  Public
const createBankReceipt = async (req, res) => {
  try {
    const {
      receiptNumber,
      date,
      receiptDate,
      bankAccount,
      accountNumber,
      transactionType,
      paymentMode,
      chequeNumber,
      chequeDate,
      customer,
      customerPhone,
      amount,
      currency,
      narration,
      preparedBy,
      approvedBy,
      status,
      reference,
      items,
      summary
    } = req.body;

    const bankReceipt = new BankReceipt({
      receiptNumber,
      date: new Date(date),
      receiptDate: new Date(receiptDate),
      bankAccount,
      accountNumber,
      transactionType: transactionType || 'Deposit',
      paymentMode: paymentMode || 'Cash',
      chequeNumber,
      chequeDate: chequeDate ? new Date(chequeDate) : undefined,
      customer,
      customerPhone,
      amount: parseFloat(amount),
      currency: currency || 'USD',
      narration,
      preparedBy,
      approvedBy,
      status: status || 'Draft',
      reference,
      items: items || [],
      summary: summary || { totalItems: 0, subTotal: 0, totalTax: 0, grandTotal: 0 }
    });

    const createdBankReceipt = await bankReceipt.save();
    res.status(201).json(createdBankReceipt);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Receipt number already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Update bank receipt
// @route   PUT /api/bankreceipts/:id
// @access  Public
const updateBankReceipt = async (req, res) => {
  try {
    const bankReceipt = await BankReceipt.findById(req.params.id);
    if (!bankReceipt) {
      return res.status(404).json({ message: 'Bank receipt not found' });
    }

    const {
      receiptNumber,
      date,
      receiptDate,
      bankAccount,
      accountNumber,
      transactionType,
      paymentMode,
      chequeNumber,
      chequeDate,
      customer,
      customerPhone,
      amount,
      currency,
      narration,
      preparedBy,
      approvedBy,
      status,
      reference,
      items,
      summary
    } = req.body;

    bankReceipt.receiptNumber = receiptNumber || bankReceipt.receiptNumber;
    bankReceipt.date = date ? new Date(date) : bankReceipt.date;
    bankReceipt.receiptDate = receiptDate ? new Date(receiptDate) : bankReceipt.receiptDate;
    bankReceipt.bankAccount = bankAccount || bankReceipt.bankAccount;
    bankReceipt.accountNumber = accountNumber || bankReceipt.accountNumber;
    bankReceipt.transactionType = transactionType || bankReceipt.transactionType;
    bankReceipt.paymentMode = paymentMode || bankReceipt.paymentMode;
    bankReceipt.chequeNumber = chequeNumber || bankReceipt.chequeNumber;
    bankReceipt.chequeDate = chequeDate ? new Date(chequeDate) : bankReceipt.chequeDate;
    bankReceipt.customer = customer || bankReceipt.customer;
    bankReceipt.customerPhone = customerPhone || bankReceipt.customerPhone;
    bankReceipt.amount = amount !== undefined ? parseFloat(amount) : bankReceipt.amount;
    bankReceipt.currency = currency || bankReceipt.currency;
    bankReceipt.narration = narration || bankReceipt.narration;
    bankReceipt.preparedBy = preparedBy || bankReceipt.preparedBy;
    bankReceipt.approvedBy = approvedBy || bankReceipt.approvedBy;
    bankReceipt.status = status || bankReceipt.status;
    bankReceipt.reference = reference || bankReceipt.reference;
    bankReceipt.items = items || bankReceipt.items;
    bankReceipt.summary = summary || bankReceipt.summary;

    const updatedBankReceipt = await bankReceipt.save();
    res.json(updatedBankReceipt);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Receipt number already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Delete bank receipt
// @route   DELETE /api/bankreceipts/:id
// @access  Public
const deleteBankReceipt = async (req, res) => {
  try {
    const bankReceipt = await BankReceipt.findById(req.params.id);
    if (!bankReceipt) {
      return res.status(404).json({ message: 'Bank receipt not found' });
    }

    await BankReceipt.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bank receipt deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search bank receipts
// @route   GET /api/bankreceipts/search/:query
// @access  Public
const searchBankReceipts = async (req, res) => {
  try {
    const query = req.params.query;
    const bankReceipts = await BankReceipt.find({
      $or: [
        { receiptNumber: { $regex: query, $options: 'i' } },
        { customer: { $regex: query, $options: 'i' } },
        { bankAccount: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);
    res.json(bankReceipts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBankReceipts,
  getBankReceipt,
  createBankReceipt,
  updateBankReceipt,
  deleteBankReceipt,
  searchBankReceipts
};
