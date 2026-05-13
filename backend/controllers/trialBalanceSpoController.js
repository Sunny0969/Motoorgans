const Account = require('../models/Account');
const Voucher = require('../models/Voucher');

// Get Trial Balance SPO-wise (by account type with subtotals)
const getTrialBalanceSpo = async (req, res) => {
  try {
    const { date, period, level, includeZeroBalance } = req.query;

    // Parse date
    const asOfDate = new Date(date || new Date());

    // Build match conditions
    let matchConditions = {};

    // Date filtering based on period
    if (period === 'daily') {
      matchConditions.date = {
        $gte: new Date(asOfDate.getFullYear(), asOfDate.getMonth(), asOfDate.getDate()),
        $lt: new Date(asOfDate.getFullYear(), asOfDate.getMonth(), asOfDate.getDate() + 1)
      };
    } else if (period === 'weekly') {
      const weekStart = new Date(asOfDate);
      weekStart.setDate(asOfDate.getDate() - asOfDate.getDay());
      matchConditions.date = {
        $gte: weekStart,
        $lt: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
      };
    } else if (period === 'monthly') {
      matchConditions.date = {
        $gte: new Date(asOfDate.getFullYear(), asOfDate.getMonth(), 1),
        $lt: new Date(asOfDate.getFullYear(), asOfDate.getMonth() + 1, 1)
      };
    } else if (period === 'quarterly') {
      const quarterStart = new Date(asOfDate.getFullYear(), Math.floor(asOfDate.getMonth() / 3) * 3, 1);
      matchConditions.date = {
        $gte: quarterStart,
        $lt: new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 1)
      };
    } else if (period === 'yearly') {
      matchConditions.date = {
        $gte: new Date(asOfDate.getFullYear(), 0, 1),
        $lt: new Date(asOfDate.getFullYear() + 1, 0, 1)
      };
    }

    // Account level filtering
    if (level !== 'all') {
      // This would require account hierarchy logic - simplified for now
      matchConditions.accountLevel = level;
    }

    // Aggregate voucher transactions
    const voucherAggregation = await Voucher.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: '$accountCode',
          totalDebit: { $sum: '$debit' },
          totalCredit: { $sum: '$credit' }
        }
      }
    ]);

    // Get all accounts
    const accounts = await Account.find({}).sort({ accountCode: 1 });

    // Group accounts by type
    const groupedAccounts = {
      assets: [],
      liabilities: [],
      equity: [],
      income: [],
      expenses: []
    };

    // Process accounts and calculate balances
    for (const account of accounts) {
      const voucherData = voucherAggregation.find(v => v._id === account.accountCode) || { totalDebit: 0, totalCredit: 0 };

      const balance = voucherData.totalDebit - voucherData.totalCredit;

      // Skip zero balances if not included
      if (!includeZeroBalance && balance === 0 && voucherData.totalDebit === 0 && voucherData.totalCredit === 0) {
        continue;
      }

      const accountData = {
        code: account.accountCode,
        name: account.accountName,
        debit: voucherData.totalDebit,
        credit: voucherData.totalCredit,
        balance: balance
      };

      // Group by account type
      const accountType = account.accountType?.toLowerCase() || 'assets';
      if (groupedAccounts[accountType]) {
        groupedAccounts[accountType].push(accountData);
      } else {
        groupedAccounts.assets.push(accountData); // Default to assets
      }
    }

    // Calculate totals
    const calculateSectionTotal = (section) => {
      return section.reduce((sum, acc) => sum + acc.balance, 0);
    };

    const totalDebit = Object.values(groupedAccounts).flat().reduce((sum, acc) => sum + acc.debit, 0);
    const totalCredit = Object.values(groupedAccounts).flat().reduce((sum, acc) => sum + acc.credit, 0);
    const totalBalance = Object.values(groupedAccounts).flat().reduce((sum, acc) => sum + acc.balance, 0);

    const response = {
      reportPeriod: {
        date: asOfDate.toISOString().split('T')[0],
        period: period || 'monthly'
      },
      filters: {
        level: level || 'all',
        includeZeroBalance: includeZeroBalance === 'true'
      },
      accounts: groupedAccounts,
      totals: {
        totalDebit,
        totalCredit,
        totalBalance,
        isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
        difference: Math.abs(totalDebit - totalCredit)
      },
      sectionTotals: {
        assets: calculateSectionTotal(groupedAccounts.assets),
        liabilities: calculateSectionTotal(groupedAccounts.liabilities),
        equity: calculateSectionTotal(groupedAccounts.equity),
        income: calculateSectionTotal(groupedAccounts.income),
        expenses: calculateSectionTotal(groupedAccounts.expenses)
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching trial balance SPO:', error);
    res.status(500).json({ error: 'Failed to fetch trial balance data' });
  }
};

// Export to Excel
const exportTrialBalanceSpo = async (req, res) => {
  try {
    // Similar logic as getTrialBalanceSpo but return Excel file
    // For now, return JSON - Excel export can be implemented later
    const data = await getTrialBalanceSpo(req, res);
    res.json(data);
  } catch (error) {
    console.error('Error exporting trial balance SPO:', error);
    res.status(500).json({ error: 'Failed to export trial balance data' });
  }
};

module.exports = {
  getTrialBalanceSpo,
  exportTrialBalanceSpo
};
