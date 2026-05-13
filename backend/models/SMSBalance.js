const mongoose = require('mongoose');

const smsBalanceSchema = new mongoose.Schema({
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  sentToday: {
    type: Number,
    default: 0,
    min: 0
  },
  deliveryRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  scheduled: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure only one SMS balance document exists
smsBalanceSchema.pre('save', async function(next) {
  if (this.isNew) {
    const existing = await this.constructor.findOne();
    if (existing) {
      throw new Error('Only one SMS balance document can exist');
    }
  }
  next();
});

module.exports = mongoose.model('SMSBalance', smsBalanceSchema);
