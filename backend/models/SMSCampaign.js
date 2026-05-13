const mongoose = require('mongoose');

const smsCampaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  recipientType: {
    type: String,
    enum: ['customers', 'custom'],
    required: true
  },
  customerGroup: {
    type: String,
    trim: true
  },
  customNumbers: [{
    type: String,
    trim: true
  }],
  message: {
    type: String,
    required: true,
    trim: true
  },
  senderId: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['promotional', 'transactional', 'alert'],
    required: true
  },
  schedule: {
    type: String,
    enum: ['immediate', 'scheduled'],
    required: true
  },
  scheduledTime: {
    type: Date
  },
  recipientCount: {
    type: Number,
    required: true,
    min: 0
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['scheduled', 'sending', 'sent', 'delivered', 'failed', 'cancelled'],
    default: 'scheduled'
  },
  deliveryRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  sentAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SMSCampaign', smsCampaignSchema);
