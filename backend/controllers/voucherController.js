const Voucher = require('../models/Voucher');
const Account = require('../models/Account');

// @desc    Get all vouchers
// @route   GET /api/vouchers
// @access  Public
const getVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find().sort({ createdAt: -1 });
    res.json(vouchers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single voucher
// @route   GET /api/vouchers/:id
// @access  Public
const getVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }
    res.json(voucher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create voucher
// @route   POST /api/vouchers
// @access  Public
const createVoucher = async (req, res) => {
  try {
    const {
      voucherNo,
      date,
      type,
      reference,
      description,
      entries,
      status
    } = req.body;

    const voucher = new Voucher({
      voucherNo,
      date: new Date(date),
      type,
      reference,
      description,
      entries,
      status
    });

    const createdVoucher = await voucher.save();

    // Update account balances if voucher is posted
    if (status === 'Posted') {
      for (const entry of entries) {
        const account = await Account.findById(entry.account);
        if (account) {
          if (entry.debit > 0) {
            account.balance += entry.debit;
          } else if (entry.credit > 0) {
            account.balance -= entry.credit;
          }
          await account.save();
        }
      }
    }

    res.status(201).json(createdVoucher);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Voucher number already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Update voucher
// @route   PUT /api/vouchers/:id
// @access  Public
const updateVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    const {
      voucherNo,
      date,
      type,
      reference,
      description,
      entries,
      status
    } = req.body;

    voucher.voucherNo = voucherNo || voucher.voucherNo;
    voucher.date = date ? new Date(date) : voucher.date;
    voucher.type = type || voucher.type;
    voucher.reference = reference || voucher.reference;
    voucher.description = description || voucher.description;
    voucher.entries = entries || voucher.entries;
    voucher.status = status || voucher.status;

    if (status === 'Posted' && voucher.status !== 'Posted') {
      voucher.postedAt = new Date();
      // Update account balances
      for (const entry of entries) {
        const account = await Account.findById(entry.account);
        if (account) {
          if (entry.debit > 0) {
            account.balance += entry.debit;
          } else if (entry.credit > 0) {
            account.balance -= entry.credit;
          }
          await account.save();
        }
      }
    }

    const updatedVoucher = await voucher.save();
    res.json(updatedVoucher);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Voucher number already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Delete voucher
// @route   DELETE /api/vouchers/:id
// @access  Public
const deleteVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }

    // Reverse account balance updates if voucher was posted
    if (voucher.status === 'Posted') {
      for (const entry of voucher.entries) {
        const account = await Account.findById(entry.account);
        if (account) {
          if (entry.debit > 0) {
            account.balance -= entry.debit;
          } else if (entry.credit > 0) {
            account.balance += entry.credit;
          }
          await account.save();
        }
      }
    }

    await Voucher.findByIdAndDelete(req.params.id);
    res.json({ message: 'Voucher deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search vouchers
// @route   GET /api/vouchers/search/:query
// @access  Public
const searchVouchers = async (req, res) => {
  try {
    const query = req.params.query;
    const vouchers = await Voucher.find({
      $or: [
        { voucherNo: { $regex: query, $options: 'i' } },
        { reference: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);
    res.json(vouchers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get vouchers by type
// @route   GET /api/vouchers/type/:type
// @access  Public
const getVouchersByType = async (req, res) => {
  try {
    const vouchers = await Voucher.find({
      type: req.params.type
    }).sort({ createdAt: -1 });
    res.json(vouchers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getVouchers,
  getVoucher,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  searchVouchers,
  getVouchersByType
};
