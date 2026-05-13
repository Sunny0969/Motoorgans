const mongoose = require('mongoose');

const eventLogSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  time: {
    type: String,
    required: true
  },
  eventType: {
    type: String,
    required: true,
    enum: ['Login', 'Logout', 'Sale', 'Return', 'Product Update', 'User Management', 'Backup', 'Restore', 'System', 'Purchase', 'Payment', 'Receipt', 'Inventory', 'Report'],
    default: 'System'
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: String,
    required: true,
    trim: true
  },
  userName: {
    type: String,
    required: true,
    trim: true
  },
  module: {
    type: String,
    required: true,
    enum: ['Authentication', 'Sales', 'Inventory', 'Administration', 'System', 'Reporting', 'Purchases', 'Finance', 'HR', 'Production'],
    default: 'System'
  },
  ipAddress: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Success', 'Failed', 'Warning', 'Info'],
    default: 'Success'
  },
  sessionId: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  additionalData: {
    type: mongoose.Schema.Types.Mixed
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Low'
  },
  category: {
    type: String,
    enum: ['Security', 'Business', 'System', 'User', 'Audit'],
    default: 'Audit'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
eventLogSchema.index({ date: -1 });
eventLogSchema.index({ eventType: 1 });
eventLogSchema.index({ userId: 1 });
eventLogSchema.index({ module: 1 });
eventLogSchema.index({ status: 1 });
eventLogSchema.index({ date: -1, eventType: 1 });
eventLogSchema.index({ date: -1, userId: 1 });
eventLogSchema.index({ date: -1, module: 1 });

// Virtual for formatted date
eventLogSchema.virtual('formattedDate').get(function() {
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return this.date.toLocaleDateString('en-GB', options);
});

// Virtual for formatted time
eventLogSchema.virtual('formattedTime').get(function() {
  return this.time;
});

// Ensure virtual fields are serialized
eventLogSchema.set('toJSON', { virtuals: true });
eventLogSchema.set('toObject', { virtuals: true });

// Static method to log events
eventLogSchema.statics.logEvent = async function(eventData) {
  try {
    const eventLog = new this({
      date: eventData.date || new Date(),
      time: eventData.time || new Date().toLocaleTimeString('en-GB'),
      eventType: eventData.eventType,
      description: eventData.description,
      userId: eventData.userId,
      userName: eventData.userName,
      module: eventData.module,
      ipAddress: eventData.ipAddress,
      status: eventData.status || 'Success',
      sessionId: eventData.sessionId,
      userAgent: eventData.userAgent,
      additionalData: eventData.additionalData,
      severity: eventData.severity || 'Low',
      category: eventData.category || 'Audit'
    });

    await eventLog.save();
    return eventLog;
  } catch (error) {
    console.error('Error logging event:', error);
    throw error;
  }
};

// Method to get event statistics
eventLogSchema.statics.getStatistics = async function(filters = {}) {
  try {
    const matchConditions = {};

    if (filters.startDate && filters.endDate) {
      matchConditions.date = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }

    if (filters.eventType && filters.eventType !== 'All') {
      matchConditions.eventType = filters.eventType;
    }

    if (filters.userId) {
      matchConditions.userId = new RegExp(filters.userId, 'i');
    }

    if (filters.module && filters.module !== 'All') {
      matchConditions.module = filters.module;
    }

    if (filters.status && filters.status !== 'All') {
      matchConditions.status = filters.status;
    }

    const stats = await this.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          successCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Success'] }, 1, 0] }
          },
          failedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Failed'] }, 1, 0] }
          },
          warningCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Warning'] }, 1, 0] }
          },
          infoCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Info'] }, 1, 0] }
          },
          byEventType: {
            $push: '$eventType'
          },
          byModule: {
            $push: '$module'
          },
          byUser: {
            $push: '$userId'
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        totalEvents: 0,
        successCount: 0,
        failedCount: 0,
        warningCount: 0,
        infoCount: 0,
        byEventType: {},
        byModule: {},
        byUser: {}
      };
    }

    const result = stats[0];

    // Count occurrences for each category
    const countOccurrences = (arr) => {
      return arr.reduce((acc, item) => {
        acc[item] = (acc[item] || 0) + 1;
        return acc;
      }, {});
    };

    return {
      totalEvents: result.totalEvents,
      successCount: result.successCount,
      failedCount: result.failedCount,
      warningCount: result.warningCount,
      infoCount: result.infoCount,
      byEventType: countOccurrences(result.byEventType),
      byModule: countOccurrences(result.byModule),
      byUser: countOccurrences(result.byUser)
    };
  } catch (error) {
    console.error('Error getting event statistics:', error);
    throw error;
  }
};

module.exports = mongoose.model('EventLog', eventLogSchema);
