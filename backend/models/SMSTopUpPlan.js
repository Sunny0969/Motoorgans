const mongoose = require('mongoose');

const smsTopUpPlanSchema = new mongoose.Schema({
  smsCount: {
    type: Number,
    required: true,
    min: 1
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  validity: {
    type: String,
    required: true,
    trim: true
  },
  popular: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate cost per SMS
smsTopUpPlanSchema.virtual('costPerSms').get(function() {
  return this.cost / this.smsCount;
});

// Ensure virtual fields are serialized
smsTopUpPlanSchema.set('toJSON', { virtuals: true });
smsTopUpPlanSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SMSTopUpPlan', smsTopUpPlanSchema);
