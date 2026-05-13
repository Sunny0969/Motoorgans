const Voucher = require('../models/Voucher');
const Account = require('../models/Account');

// @desc    Get balance sheet report
// @route   GET /api/financial/balance-sheet
// @access  Public
const getBalanceSheet = async (req, res) => {
  try {
    const { asOfDate, comparisonPeriod } = req.query;

    // Default to current date if not provided
    const reportDate = asOfDate ? new Date(asOfDate) : new Date();
    const startOfYear = new Date(reportDate.getFullYear(), 0, 1);
    const endOfYear = new Date(reportDate.getFullYear(), 11, 31);

    // Get all active accounts
    const accounts = await Account.find({ isActive: true });

    // Get all posted vouchers up to the report date
    const vouchers = await Voucher.find({
      status: 'Posted',
      date: { $lte: reportDate }
    }).sort({ date: 1 });

    // Calculate account balances
    const accountBalances = new Map();

    // Initialize with opening balances
    accounts.forEach(account => {
      accountBalances.set(account._id.toString(), {
        account: account,
        balance: account.openingBalance || 0,
        debit: 0,
        credit: 0
      });
    });

    // Process voucher entries
    vouchers.forEach(voucher => {
      voucher.entries.forEach(entry => {
        const accountId = entry.account.toString();
        if (accountBalances.has(accountId)) {
          const balanceData = accountBalances.get(accountId);
          balanceData.debit += entry.debit || 0;
          balanceData.credit += entry.credit || 0;

          // Calculate current balance based on account type
          if (balanceData.account.type === 'Asset') {
            balanceData.balance = (balanceData.account.openingBalance || 0) + balanceData.debit - balanceData.credit;
          } else if (balanceData.account.type === 'Liability' || balanceData.account.type === 'Equity') {
            balanceData.balance = (balanceData.account.openingBalance || 0) + balanceData.credit - balanceData.debit;
          } else if (balanceData.account.type === 'Income') {
            balanceData.balance = balanceData.credit - balanceData.debit; // Income increases with credit
          } else if (balanceData.account.type === 'Expense') {
            balanceData.balance = balanceData.debit - balanceData.credit; // Expenses increase with debit
          }
        }
      });
    });

    // Organize data for balance sheet
    const assets = {
      current: [],
      fixed: [],
      intangible: []
    };

    const liabilities = {
      current: [],
      longTerm: []
    };

    const equity = [];

    // Categorize accounts
    accountBalances.forEach(balanceData => {
      const account = balanceData.account;
      const balance = balanceData.balance;

      if (balance === 0) return; // Skip zero balance accounts

      const accountData = {
        name: account.name,
        amount: balance,
        previous: 0, // TODO: Calculate previous period balance
        notes: account.description || ''
      };

      switch (account.type) {
        case 'Asset':
          // Categorize assets based on account name/category
          if (account.name.toLowerCase().includes('cash') ||
              account.name.toLowerCase().includes('bank') ||
              account.name.toLowerCase().includes('receivable') ||
              account.name.toLowerCase().includes('inventory') ||
              account.name.toLowerCase().includes('prepaid')) {
            assets.current.push(accountData);
          } else if (account.name.toLowerCase().includes('property') ||
                     account.name.toLowerCase().includes('equipment') ||
                     account.name.toLowerCase().includes('furniture') ||
                     account.name.toLowerCase().includes('vehicle')) {
            assets.fixed.push(accountData);
          } else if (account.name.toLowerCase().includes('software') ||
                     account.name.toLowerCase().includes('license') ||
                     account.name.toLowerCase().includes('goodwill')) {
            assets.intangible.push(accountData);
          } else {
            assets.current.push(accountData); // Default to current assets
          }
          break;

        case 'Liability':
          if (account.name.toLowerCase().includes('payable') ||
              account.name.toLowerCase().includes('short') ||
              account.name.toLowerCase().includes('accrued') ||
              account.name.toLowerCase().includes('deposit')) {
            liabilities.current.push(accountData);
          } else {
            liabilities.longTerm.push(accountData);
          }
          break;

        case 'Equity':
          equity.push(accountData);
          break;
      }
    });

    // Calculate totals
    const totalCurrentAssets = assets.current.reduce((sum, item) => sum + item.amount, 0);
    const totalFixedAssets = assets.fixed.reduce((sum, item) => sum + item.amount, 0);
    const totalIntangibleAssets = assets.intangible.reduce((sum, item) => sum + item.amount, 0);
    const totalAssets = totalCurrentAssets + totalFixedAssets + totalIntangibleAssets;

    const totalCurrentLiabilities = liabilities.current.reduce((sum, item) => sum + item.amount, 0);
    const totalLongTermLiabilities = liabilities.longTerm.reduce((sum, item) => sum + item.amount, 0);
    const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;

    const totalEquity = equity.reduce((sum, item) => sum + item.amount, 0);

    // Calculate financial ratios
    const currentRatio = totalCurrentLiabilities > 0 ? totalCurrentAssets / totalCurrentLiabilities : 0;
    const debtRatio = totalAssets > 0 ? totalLiabilities / totalAssets : 0;
    const equityRatio = totalAssets > 0 ? totalEquity / totalAssets : 0;
    const debtToEquityRatio = totalEquity > 0 ? totalLiabilities / totalEquity : 0;

    res.json({
      asOf: reportDate.toISOString().split('T')[0],
      assets,
      liabilities,
      equity,
      totals: {
        totalCurrentAssets,
        totalFixedAssets,
        totalIntangibleAssets,
        totalAssets,
        totalCurrentLiabilities,
        totalLongTermLiabilities,
        totalLiabilities,
        totalEquity
      },
      ratios: {
        currentRatio: currentRatio.toFixed(2),
        debtRatio: (debtRatio * 100).toFixed(1),
        equityRatio: (equityRatio * 100).toFixed(1),
        debtToEquityRatio: debtToEquityRatio.toFixed(2)
      },
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get profit and loss statement
// @route   GET /api/financial/profit-loss
// @access  Public
const getProfitLoss = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    // Get income and expense accounts
    const incomeAccounts = await Account.find({ type: 'Income', isActive: true });
    const expenseAccounts = await Account.find({ type: 'Expense', isActive: true });

    // Get vouchers for the period
    const vouchers = await Voucher.find({
      status: 'Posted',
      date: { $gte: start, $lte: end }
    });

    // Calculate income and expenses
    const income = [];
    const expenses = [];

    incomeAccounts.forEach(account => {
      let balance = account.openingBalance || 0;
      vouchers.forEach(voucher => {
        voucher.entries.forEach(entry => {
          if (entry.account.toString() === account._id.toString()) {
            balance += entry.credit - entry.debit; // Income increases with credit
          }
        });
      });

      if (balance !== 0) {
        income.push({
          name: account.name,
          amount: balance,
          previous: 0, // TODO: Calculate previous period
          notes: account.description || ''
        });
      }
    });

    expenseAccounts.forEach(account => {
      let balance = account.openingBalance || 0;
      vouchers.forEach(voucher => {
        voucher.entries.forEach(entry => {
          if (entry.account.toString() === account._id.toString()) {
            balance += entry.debit - entry.credit; // Expenses increase with debit
          }
        });
      });

      if (balance !== 0) {
        expenses.push({
          name: account.name,
          amount: balance,
          previous: 0, // TODO: Calculate previous period
          notes: account.description || ''
        });
      }
    });

    const totalRevenue = income.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    res.json({
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      },
      revenue: income,
      expenses: expenses,
      totals: {
        totalRevenue,
        totalExpenses,
        netProfit
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get year-end closing data
// @route   GET /api/financial/year-end-closing
// @access  Public
const getYearEndClosing = async (req, res) => {
  try {
    const { year } = req.query;
    const closingYear = year ? parseInt(year) : new Date().getFullYear();

    // Get balance sheet data for year-end
    const yearEndDate = new Date(closingYear, 11, 31); // December 31st

    // Get all accounts
    const accounts = await Account.find({ isActive: true });

    // Get all vouchers for the year
    const yearVouchers = await Voucher.find({
      status: 'Posted',
      date: {
        $gte: new Date(closingYear, 0, 1), // January 1st
        $lte: yearEndDate
      }
    });

    // Calculate year-end balances
    const yearEndBalances = new Map();

    accounts.forEach(account => {
      yearEndBalances.set(account._id.toString(), {
        account: account,
        openingBalance: account.openingBalance || 0,
        yearActivity: { debit: 0, credit: 0 },
        closingBalance: account.openingBalance || 0
      });
    });

    // Process year activity
    yearVouchers.forEach(voucher => {
      voucher.entries.forEach(entry => {
        const accountId = entry.account.toString();
        if (yearEndBalances.has(accountId)) {
          const balanceData = yearEndBalances.get(accountId);
          balanceData.yearActivity.debit += entry.debit || 0;
          balanceData.yearActivity.credit += entry.credit || 0;

          // Calculate closing balance
          if (balanceData.account.type === 'Asset') {
            balanceData.closingBalance = balanceData.openingBalance + balanceData.yearActivity.debit - balanceData.yearActivity.credit;
          } else if (balanceData.account.type === 'Liability' || balanceData.account.type === 'Equity') {
            balanceData.closingBalance = balanceData.openingBalance + balanceData.yearActivity.credit - balanceData.yearActivity.debit;
          } else if (balanceData.account.type === 'Income') {
            balanceData.closingBalance = balanceData.yearActivity.credit - balanceData.yearActivity.debit;
          } else if (balanceData.account.type === 'Expense') {
            balanceData.closingBalance = balanceData.yearActivity.debit - balanceData.yearActivity.credit;
          }
        }
      });
    });

    // Prepare closing entries
    const closingEntries = [];

    // Close income and expense accounts to retained earnings
    const retainedEarningsAccount = accounts.find(acc =>
      acc.name.toLowerCase().includes('retained earnings') ||
      acc.name.toLowerCase().includes('retained')
    );

    if (retainedEarningsAccount) {
      let totalIncome = 0;
      let totalExpenses = 0;

      yearEndBalances.forEach(balanceData => {
        if (balanceData.account.type === 'Income' && balanceData.closingBalance !== 0) {
          totalIncome += balanceData.closingBalance;
          closingEntries.push({
            account: balanceData.account._id,
            accountName: balanceData.account.name,
            debit: balanceData.closingBalance,
            credit: 0,
            description: 'Closing income account'
          });
        } else if (balanceData.account.type === 'Expense' && balanceData.closingBalance !== 0) {
          totalExpenses += balanceData.closingBalance;
          closingEntries.push({
            account: balanceData.account._id,
            accountName: balanceData.account.name,
            debit: 0,
            credit: balanceData.closingBalance,
            description: 'Closing expense account'
          });
        }
      });

      // Transfer net profit/loss to retained earnings
      const netProfit = totalIncome - totalExpenses;
      if (netProfit !== 0) {
        closingEntries.push({
          account: retainedEarningsAccount._id,
          accountName: retainedEarningsAccount.name,
          debit: netProfit > 0 ? 0 : Math.abs(netProfit),
          credit: netProfit > 0 ? netProfit : 0,
          description: 'Transfer net profit/loss to retained earnings'
        });
      }
    }

    res.json({
      year: closingYear,
      yearEndBalances: Array.from(yearEndBalances.values()).map(data => ({
        account: {
          id: data.account._id,
          code: data.account.code,
          name: data.account.name,
          type: data.account.type
        },
        openingBalance: data.openingBalance,
        yearActivity: data.yearActivity,
        closingBalance: data.closingBalance
      })),
      closingEntries,
      summary: {
        totalAssets: Array.from(yearEndBalances.values())
          .filter(data => data.account.type === 'Asset')
          .reduce((sum, data) => sum + data.closingBalance, 0),
        totalLiabilities: Array.from(yearEndBalances.values())
          .filter(data => data.account.type === 'Liability')
          .reduce((sum, data) => sum + data.closingBalance, 0),
        totalEquity: Array.from(yearEndBalances.values())
          .filter(data => data.account.type === 'Equity')
          .reduce((sum, data) => sum + data.closingBalance, 0),
        netProfit: Array.from(yearEndBalances.values())
          .filter(data => data.account.type === 'Income')
          .reduce((sum, data) => sum + data.closingBalance, 0) -
          Array.from(yearEndBalances.values())
          .filter(data => data.account.type === 'Expense')
          .reduce((sum, data) => sum + data.closingBalance, 0)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBalanceSheet,
  getProfitLoss,
  getYearEndClosing
};
