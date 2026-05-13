const EventLog = require('../models/EventLog');
const Employee = require('../models/Employee');

// @desc    Get all event logs with filtering and pagination
// @route   GET /api/event-logs
// @access  Public
const getEventLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    if (req.query.startDate && req.query.endDate) {
      filter.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    if (req.query.eventType && req.query.eventType !== 'All') {
      filter.eventType = req.query.eventType;
    }

    if (req.query.userId) {
      filter.userId = new RegExp(req.query.userId, 'i');
    }

    if (req.query.module && req.query.module !== 'All') {
      filter.module = req.query.module;
    }

    if (req.query.status && req.query.status !== 'All') {
      filter.status = req.query.status;
    }

    if (req.query.severity && req.query.severity !== 'All') {
      filter.severity = req.query.severity;
    }

    if (req.query.category && req.query.category !== 'All') {
      filter.category = req.query.category;
    }

    // Sort options
    const sortOption = req.query.sortBy || 'date';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = {};
    sort[sortOption] = sortOrder;

    const eventLogs = await EventLog.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await EventLog.countDocuments(filter);

    res.json({
      success: true,
      data: eventLogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        applied: Object.keys(filter).length > 0,
        criteria: filter
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get single event log
// @route   GET /api/event-logs/:id
// @access  Public
const getEventLog = async (req, res) => {
  try {
    const eventLog = await EventLog.findById(req.params.id);

    if (!eventLog) {
      return res.status(404).json({
        success: false,
        message: 'Event log not found'
      });
    }

    res.json({
      success: true,
      data: eventLog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Create new event log entry
// @route   POST /api/event-logs
// @access  Public
const createEventLog = async (req, res) => {
  try {
    const {
      eventType,
      description,
      userId,
      userName,
      module,
      ipAddress,
      status,
      sessionId,
      userAgent,
      additionalData,
      severity,
      category
    } = req.body;

    // Validate required fields
    if (!eventType || !description || !userId || !userName || !module) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: eventType, description, userId, userName, module'
      });
    }

    // Validate user exists if userId is provided
    if (userId && userId !== 'SYSTEM') {
      const user = await Employee.findOne({ code: userId });
      if (!user && userId !== 'SYSTEM') {
        // Log warning but don't fail - system events might not have users
        console.warn(`User ${userId} not found in employee records`);
      }
    }

    const eventLog = new EventLog({
      eventType,
      description,
      userId,
      userName,
      module,
      ipAddress: ipAddress || req.ip || req.connection.remoteAddress,
      status: status || 'Success',
      sessionId,
      userAgent: userAgent || req.get('User-Agent'),
      additionalData,
      severity: severity || 'Low',
      category: category || 'Audit'
    });

    const savedLog = await eventLog.save();

    res.status(201).json({
      success: true,
      data: savedLog,
      message: 'Event log created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get event log statistics
// @route   GET /api/event-logs/statistics
// @access  Public
const getEventLogStatistics = async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      eventType: req.query.eventType,
      userId: req.query.userId,
      module: req.query.module,
      status: req.query.status
    };

    const statistics = await EventLog.getStatistics(filters);

    res.json({
      success: true,
      data: statistics,
      filters: {
        applied: Object.values(filters).some(val => val && val !== 'All'),
        criteria: filters
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get event log summary by date range
// @route   GET /api/event-logs/summary
// @access  Public
const getEventLogSummary = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const matchConditions = {};
    if (startDate && endDate) {
      matchConditions.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    let groupByField;
    switch (groupBy) {
      case 'hour':
        groupByField = {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' },
          hour: { $hour: '$date' }
        };
        break;
      case 'month':
        groupByField = {
          year: { $year: '$date' },
          month: { $month: '$date' }
        };
        break;
      case 'eventType':
        groupByField = '$eventType';
        break;
      case 'module':
        groupByField = '$module';
        break;
      case 'user':
        groupByField = '$userId';
        break;
      default: // day
        groupByField = {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' }
        };
    }

    const summary = await EventLog.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: groupByField,
          count: { $sum: 1 },
          successCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Success'] }, 1, 0] }
          },
          failedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Failed'] }, 1, 0] }
          },
          warningCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Warning'] }, 1, 0] }
          },
          eventTypes: { $addToSet: '$eventType' },
          modules: { $addToSet: '$module' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      success: true,
      data: summary,
      groupBy,
      dateRange: {
        startDate,
        endDate
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete event logs older than specified date
// @route   DELETE /api/event-logs/cleanup
// @access  Public
const cleanupEventLogs = async (req, res) => {
  try {
    const { olderThan } = req.body;

    if (!olderThan) {
      return res.status(400).json({
        success: false,
        message: 'Please provide olderThan date'
      });
    }

    const cutoffDate = new Date(olderThan);
    const result = await EventLog.deleteMany({
      date: { $lt: cutoffDate }
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} event logs older than ${cutoffDate.toISOString()}`,
      data: {
        deletedCount: result.deletedCount,
        cutoffDate: cutoffDate.toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Export event logs to CSV
// @route   GET /api/event-logs/export
// @access  Public
const exportEventLogs = async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      eventType: req.query.eventType,
      userId: req.query.userId,
      module: req.query.module,
      status: req.query.status
    };

    // Build filter object
    const filter = {};

    if (filters.startDate && filters.endDate) {
      filter.date = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }

    if (filters.eventType && filters.eventType !== 'All') {
      filter.eventType = filters.eventType;
    }

    if (filters.userId) {
      filter.userId = new RegExp(filters.userId, 'i');
    }

    if (filters.module && filters.module !== 'All') {
      filter.module = filters.module;
    }

    if (filters.status && filters.status !== 'All') {
      filter.status = filters.status;
    }

    const eventLogs = await EventLog.find(filter)
      .sort({ date: -1 })
      .select('-__v -_id');

    // Convert to CSV
    if (eventLogs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No event logs found for export'
      });
    }

    const csvHeaders = [
      'Date',
      'Time',
      'Event Type',
      'Description',
      'User ID',
      'User Name',
      'Module',
      'IP Address',
      'Status',
      'Severity',
      'Category'
    ];

    const csvRows = eventLogs.map(log => [
      log.formattedDate,
      log.time,
      log.eventType,
      `"${log.description}"`,
      log.userId,
      log.userName,
      log.module,
      log.ipAddress || '',
      log.status,
      log.severity,
      log.category
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="event_logs.csv"');
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get unique values for filter dropdowns
// @route   GET /api/event-logs/filters
// @access  Public
const getFilterOptions = async (req, res) => {
  try {
    const eventTypes = await EventLog.distinct('eventType');
    const modules = await EventLog.distinct('module');
    const statuses = await EventLog.distinct('status');
    const severities = await EventLog.distinct('severity');
    const categories = await EventLog.distinct('category');

    // Get unique user IDs and names
    const users = await EventLog.aggregate([
      {
        $group: {
          _id: '$userId',
          userName: { $first: '$userName' }
        }
      },
      {
        $project: {
          userId: '$_id',
          userName: 1,
          _id: 0
        }
      },
      { $sort: { userId: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        eventTypes: ['All', ...eventTypes.sort()],
        modules: ['All', ...modules.sort()],
        statuses: ['All', ...statuses.sort()],
        severities: ['All', ...severities.sort()],
        categories: ['All', ...categories.sort()],
        users: users
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

module.exports = {
  getEventLogs,
  getEventLog,
  createEventLog,
  getEventLogStatistics,
  getEventLogSummary,
  cleanupEventLogs,
  exportEventLogs,
  getFilterOptions
};
