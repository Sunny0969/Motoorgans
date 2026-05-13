const Account = require('../models/Account');

exports.getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find();
    res.json(accounts);
  } catch (err) {
    console.error('Error fetching accounts:', err);
    res.status(500).json({ message: 'Server error fetching accounts' });
  }
};

exports.getAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) return res.status(404).json({ message: 'Account not found' });
    res.json(account);
  } catch (err) {
    console.error('Error fetching account:', err);
    res.status(500).json({ message: 'Server error fetching account' });
  }
};

exports.createAccount = async (req, res) => {
  try {
    const existingByAccountId = await Account.findOne({ accountId: req.body.accountId });
    if (existingByAccountId) {
      return res.status(400).json({ message: 'Account with this accountId already exists' });
    }
    const existingByCode = await Account.findOne({ code: req.body.code });
    if (existingByCode) {
      return res.status(400).json({ message: 'Account with this code already exists' });
    }
    const newAccount = new Account(req.body);
    await newAccount.save();
    res.status(201).json(newAccount);
  } catch (err) {
    console.error('Error creating account:', err);
    res.status(500).json({ message: 'Server error creating account' });
  }
};

exports.updateAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) return res.status(404).json({ message: 'Account not found' });
    
    if (req.body.accountId && req.body.accountId !== account.accountId) {
      const existingId = await Account.findOne({ accountId: req.body.accountId });
      if (existingId) return res.status(400).json({ message: 'AccountId already in use' });
    }
    if (req.body.code && req.body.code !== account.code) {
      const existingCode = await Account.findOne({ code: req.body.code });
      if (existingCode) return res.status(400).json({ message: 'Code already in use' });
    }

    Object.assign(account, req.body);
    await account.save();
    res.json(account);
  } catch (err) {
    console.error('Error updating account:', err);
    res.status(500).json({ message: 'Server error updating account' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) return res.status(404).json({ message: 'Account not found' });
    await account.deleteOne();
    res.json({ message: 'Account deleted' });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ message: 'Server error deleting account' });
  }
};

exports.searchAccounts = async (req, res) => {
  try {
    const query = req.params.query;
    const regex = new RegExp(query, 'i');
    const accounts = await Account.find({
      $or: [{ accountTitle: regex }, { code: regex }],
    });
    res.json(accounts);
  } catch (err) {
    console.error('Error searching accounts:', err);
    res.status(500).json({ message: 'Server error searching accounts' });
  }
};

exports.getAccountsByType = async (req, res) => {
  try {
    const type = req.params.type;
    const accounts = await Account.find({ accountType: type });
    res.json(accounts);
  } catch (err) {
    console.error('Error getting accounts by type:', err);
    res.status(500).json({ message: 'Server error getting accounts by type' });
  }
};
