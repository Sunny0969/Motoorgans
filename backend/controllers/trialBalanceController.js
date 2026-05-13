const Voucher = require('../models/Voucher');
const Account = require('../models/Account');

// Helper function to get trial balance data (used by both getTrialBalance and exportTrialBalance)
const getTrialBalanceData = async (filters) => {
  const {
    fromDate,
    toDate,
    accountType = 'All',
    showZeroBalances = 'false',
    groupByType = 'true'
  } = filters;

  const startDate = new Date(fromDate);
  const endDate = new Date(toDate);

  let matchStage = {
    date: {
      $gte: startDate,
      $lte: endDate
    },
    status: 'posted'
  };

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: '$account',
        totalDebit: { $sum: '$debit' },
        totalCredit: { $sum: '$credit' }
      }
    },
    {
      $lookup: {
        from: 'accounts',
        localField: '_id',
        foreignField: '_id',
        as: 'accountInfo'
      }
    },
    {
      $unwind: '$accountInfo'
    },
    {
      $project: {
        accountCode: '$accountInfo.code',
        accountName: '$accountInfo.name',
        accountType: '$accountInfo.type',
        debit: '$totalDebit',
        credit: '$totalCredit',
        balance: { $subtract: ['$totalDebit', '$totalCredit'] }
      }
    },
    {
      $sort: { accountCode: 1 }
    }
  ];

  let accounts = await Voucher.aggregate(pipeline);

  if (accountType && accountType !== 'All') {
    accounts = accounts.filter(acc => acc.accountType === accountType);
  }

  if (showZeroBalances === 'false') {
    accounts = accounts.filter(acc => acc.debit !== 0 || acc.credit !== 0);
  }

  const totalDebit = accounts.reduce((sum, acc) => sum + acc.debit, 0);
  const totalCredit = accounts.reduce((sum, acc) => sum + acc.credit, 0);

  return {
    accounts,
    totalDebit,
    totalCredit,
    isBalanced: totalDebit === totalCredit
  };
};

// @desc    Get Trial Balance report
// @route   GET /api/reports/trial-balance
// @access  Public
const getTrialBalance = async (req, res) => {
  try {
    const {
      fromDate,
      toDate,
      accountType = 'All',
      showZeroBalances = 'false',
      groupByType = 'true'
    } = req.query;

    // Validate date parameters
    if (!fromDate || !toDate) {
      return res.status(400).json({ message: 'From date and to date are required' });
    }

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Build aggregation pipeline for trial balance
    let matchStage = {
      date: {
        $gte: startDate,
        $lte: endDate
      },
      status: 'posted' // Only include posted vouchers
    };

    // Aggregate debit and credit amounts by account
    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$account',
          totalDebit: { $sum: '$debit' },
          totalCredit: { $sum: '$credit' }
        }
      },
      {
        $lookup: {
          from: 'accounts',
          localField: '_id',
          foreignField: '_id',
          as: 'accountInfo'
        }
      },
      {
        $unwind: '$accountInfo'
      },
      {
        $project: {
          accountCode: '$accountInfo.code',
          accountName: '$accountInfo.name',
          accountType: '$accountInfo.type',
          debit: '$totalDebit',
          credit: '$totalCredit',
          balance: { $subtract: ['$totalDebit', '$totalCredit'] }
        }
      },
      {
        $sort: { accountCode: 1 }
      }
    ];

    let accounts = await Voucher.aggregate(pipeline);

    // Filter by account type if specified
    if (accountType && accountType !== 'All') {
      accounts = accounts.filter(acc => acc.accountType === accountType);
    }

    // Filter zero balances if not requested
    if (showZeroBalances === 'false') {
      accounts = accounts.filter(acc => acc.debit !== 0 || acc.credit !== 0);
    }

    // Calculate totals
    const totalDebit = accounts.reduce((sum, acc) => sum + acc.debit, 0);
    const totalCredit = accounts.reduce((sum, acc) => sum + acc.credit, 0);

    // Group by type if requested
    let groupedAccounts = [];
    if (groupByType === 'true') {
      const grouped = accounts.reduce((acc, account) => {
        if (!acc[account.accountType]) {
          acc[account.accountType] = [];
        }
        acc[account.accountType].push(account);
        return acc;
      }, {});

      groupedAccounts = Object.keys(grouped).map(type => ({
        type,
        accounts: grouped[type],
        subtotalDebit: grouped[type].reduce((sum, acc) => sum + acc.debit, 0),
        subtotalCredit: grouped[type].reduce((sum, acc) => sum + acc.credit, 0)
      }));
    } else {
      groupedAccounts = [{ type: 'All Accounts', accounts, subtotalDebit: totalDebit, subtotalCredit: totalCredit }];
    }

    const response = {
      reportPeriod: {
        fromDate: startDate.toISOString().split('T')[0],
        toDate: endDate.toISOString().split('T')[0]
      },
      filters: {
        accountType,
        showZeroBalances: showZeroBalances === 'true',
        groupByType: groupByType === 'true'
      },
      accounts: groupedAccounts,
      totals: {
        totalDebit,
        totalCredit,
        isBalanced: totalDebit === totalCredit,
        difference: Math.abs(totalDebit - totalCredit)
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Trial Balance Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export Trial Balance to Excel
// @route   GET /api/reports/trial-balance/export
// @access  Public
const exportTrialBalance = async (req, res) => {
  try {
    // Get the trial balance data
    const trialBalanceData = await getTrialBalanceData(req.query);

    // Set headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=trial-balance.xlsx');

    // For now, return JSON - in a real implementation, you'd use a library like exceljs
    res.json({
      message: 'Export functionality - would generate Excel file',
      data: trialBalanceData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTrialBalance,
  exportTrialBalance
};
