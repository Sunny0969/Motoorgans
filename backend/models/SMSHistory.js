const mongoose = require('mongoose');

const smsHistorySchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['delivered', 'sent', 'failed', 'pending'],
    default: 'sent'
  },
  timestamp: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['outgoing', 'incoming'],
    default: 'outgoing'
  },
  cost: {
    type: Number,
    default: 0.05,
    min: 0
  },
  messageLength: {
    type: Number,
    required: true,
    min: 1
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SMSCampaign'
  },
  senderId: {
    type: String,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['promotional', 'transactional', 'alert'],
    default: 'promotional'
  }
}, {
  timestamps: true
});

// Index for efficient querying
smsHistorySchema.index({ timestamp: 1, type: 1, status: 1 });
smsHistorySchema.index({ phoneNumber: 1 });
smsHistorySchema.index({ campaignId: 1 });

module.exports = mongoose.model('SMSHistory', smsHistorySchema);
