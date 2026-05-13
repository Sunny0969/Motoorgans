const mongoose = require('mongoose');

const fontSettingsSchema = new mongoose.Schema({
  userId: {
    type: String,
    default: 'global', // Use 'global' for app-wide settings if no user auth
    required: true
  },
  fontFamily: {
    type: String,
    default: 'Arial'
  },
  fontSize: {
    type: Number,
    default: 16
  },
  fontWeight: {
    type: String,
    default: 'normal'
  },
  fontStyle: {
    type: String,
    default: 'normal'
  },
  isApplied: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FontSettings', fontSettingsSchema);
