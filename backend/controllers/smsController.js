const SMSBalance = require('../models/SMSBalance');
const SMSCampaign = require('../models/SMSCampaign');
const SMSHistory = require('../models/SMSHistory');
const SMSTopUpPlan = require('../models/SMSTopUpPlan');
const Customer = require('../models/Customer');
const CustomerGroup = require('../models/CustomerGroup');

// @desc    Get SMS history with filtering and pagination
// @route   GET /api/sms/history
// @access  Public
const getSMSHistory = async (req, res) => {
  try {
    const {
      status,
      dateFrom,
      dateTo,
      phoneNumber,
      searchTerm,
      page = 1,
      limit = 10,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;

    let filter = {};

    // Filter by status
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      filter.timestamp = {};
      if (dateFrom) filter.timestamp.$gte = dateFrom;
      if (dateTo) filter.timestamp.$lte = dateTo;
    }

    // Filter by phone number
    if (phoneNumber) {
      filter.phoneNumber = { $regex: phoneNumber, $options: 'i' };
    }

    // Filter by search term
    if (searchTerm) {
      filter.$or = [
        { message: { $regex: searchTerm, $options: 'i' } },
        { phoneNumber: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const history = await SMSHistory.find(filter)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SMSHistory.countDocuments(filter);

    // Get statistics
    const stats = await SMSHistory.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
          totalCost: { $sum: '$cost' }
        }
      }
    ]);

    res.json({
      history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      statistics: stats[0] || {
        total: 0,
        delivered: 0,
        failed: 0,
        sent: 0,
        totalCost: 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add SMS history record
// @route   POST /api/sms/history
// @access  Public
const addSMSHistory = async (req, res) => {
  try {
    const { phoneNumber, message, status, timestamp, type, cost, messageLength, campaignId, senderId, messageType } = req.body;

    const historyRecord = new SMSHistory({
      phoneNumber,
      message,
      status,
      timestamp,
      type,
      cost,
      messageLength,
      campaignId,
      senderId,
      messageType
    });

    const savedRecord = await historyRecord.save();

    // Update balance statistics if outgoing SMS
    if (type === 'outgoing') {
      const balance = await SMSBalance.findOne();
      if (balance) {
        balance.usedSms += 1;
        balance.sentToday += 1;
        balance.lastUpdated = new Date();
        await balance.save();
      }
    }

    res.status(201).json(savedRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete SMS history record
// @route   DELETE /api/sms/history/:id
// @access  Public
const deleteSMSHistory = async (req, res) => {
  try {
    const historyRecord = await SMSHistory.findById(req.params.id);
    if (!historyRecord) {
      return res.status(404).json({ message: 'SMS record not found' });
    }

    await SMSHistory.findByIdAndDelete(req.params.id);
    res.json({ message: 'SMS record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resend failed SMS
// @route   POST /api/sms/resend/:id
// @access  Public
const resendSMS = async (req, res) => {
  try {
    const historyRecord = await SMSHistory.findById(req.params.id);
    if (!historyRecord) {
      return res.status(404).json({ message: 'SMS record not found' });
    }

    if (historyRecord.type !== 'outgoing') {
      return res.status(400).json({ message: 'Only outgoing SMS can be resent' });
    }

    // Check balance
    const balance = await SMSBalance.findOne();
    if (!balance || balance.balance < 1) {
      return res.status(400).json({ message: 'Insufficient SMS balance' });
    }

    // Create new history record
    const newRecord = new SMSHistory({
      phoneNumber: historyRecord.phoneNumber,
      message: historyRecord.message,
      status: 'sent',
      timestamp: new Date().toLocaleString('en-GB'),
      type: 'outgoing',
      cost: historyRecord.cost,
      messageLength: historyRecord.messageLength,
      campaignId: historyRecord.campaignId,
      senderId: historyRecord.senderId,
      messageType: historyRecord.messageType
    });

    const savedRecord = await newRecord.save();

    // Update balance
    balance.balance -= 1;
    balance.usedSms += 1;
    balance.sentToday += 1;
    balance.lastUpdated = new Date();
    await balance.save();

    res.json({
      message: 'SMS resent successfully',
      record: savedRecord
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clear SMS history
// @route   DELETE /api/sms/history
// @access  Public
const clearSMSHistory = async (req, res) => {
  try {
    await SMSHistory.deleteMany({});
    res.json({ message: 'SMS history cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export SMS history
// @route   GET /api/sms/export-history
// @access  Public
const exportSMSHistory = async (req, res) => {
  try {
    const { status, dateFrom, dateTo, phoneNumber, searchTerm } = req.query;

    let filter = {};

    if (status && status !== 'all') filter.status = status;
    if (dateFrom || dateTo) {
      filter.timestamp = {};
      if (dateFrom) filter.timestamp.$gte = dateFrom;
      if (dateTo) filter.timestamp.$lte = dateTo;
    }
    if (phoneNumber) filter.phoneNumber = { $regex: phoneNumber, $options: 'i' };
    if (searchTerm) {
      filter.$or = [
        { message: { $regex: searchTerm, $options: 'i' } },
        { phoneNumber: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const history = await SMSHistory.find(filter).sort({ timestamp: -1 });

    // Convert to CSV format
    const csvHeaders = 'Phone Number,Message,Status,Timestamp,Type,Cost,Message Length\n';
    const csvData = history.map(record =>
      `"${record.phoneNumber}","${record.message.replace(/"/g, '""')}","${record.status}","${record.timestamp}","${record.type}",${record.cost},${record.messageLength}`
    ).join('\n');

    const csv = csvHeaders + csvData;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sms-history.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Placeholder functions for other SMS functionality
const getSMSBalance = async (req, res) => {
  res.json({ message: 'SMS balance endpoint' });
};

const updateSMSBalance = async (req, res) => {
  res.json({ message: 'Update SMS balance endpoint' });
};

const getTopUpPlans = async (req, res) => {
  res.json({ message: 'Top-up plans endpoint' });
};

const createTopUpPlan = async (req, res) => {
  res.json({ message: 'Create top-up plan endpoint' });
};

const processTopUp = async (req, res) => {
  res.json({ message: 'Process top-up endpoint' });
};

const getSMSStatistics = async (req, res) => {
  res.json({ message: 'SMS statistics endpoint' });
};

const sendTestSMS = async (req, res) => {
  res.json({ message: 'Send test SMS endpoint' });
};

const getCustomerGroups = async (req, res) => {
  res.json({ message: 'Customer groups endpoint' });
};

const sendSMS = async (req, res) => {
  res.json({ message: 'Send SMS endpoint' });
};

const scheduleSMS = async (req, res) => {
  res.json({ message: 'Schedule SMS endpoint' });
};

const getSMSCampaigns = async (req, res) => {
  res.json({ message: 'SMS campaigns endpoint' });
};

const cancelSMSCampaign = async (req, res) => {
  res.json({ message: 'Cancel SMS campaign endpoint' });
};

const buySMSCredits = async (req, res) => {
  res.json({ message: 'Buy SMS credits endpoint' });
};

module.exports = {
  getSMSBalance,
  updateSMSBalance,
  getSMSHistory,
  addSMSHistory,
  deleteSMSHistory,
  resendSMS,
  clearSMSHistory,
  exportSMSHistory,
  getTopUpPlans,
  createTopUpPlan,
  processTopUp,
  getSMSStatistics,
  sendTestSMS,
  getCustomerGroups,
  sendSMS,
  scheduleSMS,
  getSMSCampaigns,
  cancelSMSCampaign,
  buySMSCredits
};
