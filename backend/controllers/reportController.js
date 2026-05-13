const Voucher = require('../models/Voucher');
const Account = require('../models/Account');

// @desc    Get account activity report
// @route   GET /api/reports/account-activity
// @access  Public
const getAccountActivity = async (req, res) => {
  try {
    const { startDate, endDate, accountType, accountId } = req.query;

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Build account filter
    let accountFilter = {};
    if (accountId) {
      accountFilter = { _id: accountId };
    } else if (accountType && accountType !== 'all') {
      accountFilter.type = accountType;
    }

    // Get accounts
    const accounts = await Account.find({
      isActive: true,
      ...accountFilter
    }).select('_id code name type balance openingBalance');

    if (accounts.length === 0) {
      return res.json({
        summary: {
          totalTransactions: 0,
          deposits: 0,
          withdrawals: 0,
          fees: 0,
          openingBalance: 0,
          closingBalance: 0
        },
        transactions: []
      });
    }

    // Get vouchers for the accounts within date range
    const accountIds = accounts.map(acc => acc._id);
    const vouchers = await Voucher.find({
      'entries.account': { $in: accountIds },
      status: 'Posted',
      ...dateFilter
    }).sort({ date: 1, createdAt: 1 });

    // Calculate activity
    let transactions = [];
    let runningBalance = accounts.reduce((sum, acc) => sum + (acc.openingBalance || 0), 0);

    vouchers.forEach(voucher => {
      voucher.entries.forEach(entry => {
        const account = accounts.find(acc => acc._id.toString() === entry.account.toString());
        if (account) {
          const isDebit = entry.debit > 0;
          const amount = isDebit ? entry.debit : entry.credit;
          const type = isDebit ? 'deposit' : 'withdrawal';

          // For asset accounts, debits increase balance, credits decrease
          if (account.type === 'Asset' || account.type === 'Bank' || account.type === 'Cash') {
            runningBalance += isDebit ? amount : -amount;
          } else {
            // For liability/equity accounts, credits increase balance
            runningBalance += isDebit ? -amount : amount;
          }

          transactions.push({
            id: voucher._id + '_' + entry._id,
            date: voucher.date,
            time: voucher.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            type: type,
            description: voucher.description || voucher.reference || 'Transaction',
            amount: amount,
            balance: runningBalance,
            status: 'completed',
            account: account.name,
            accountCode: account.code,
            voucherNo: voucher.voucherNo,
            voucherType: voucher.type
          });
        }
      });
    });

    // Calculate summary
    const deposits = transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
    const withdrawals = transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0);
    const openingBalance = accounts.reduce((sum, acc) => sum + (acc.openingBalance || 0), 0);
    const closingBalance = runningBalance;

    res.json({
      summary: {
        totalTransactions: transactions.length,
        deposits: deposits,
        withdrawals: withdrawals,
        fees: 0, // Can be calculated separately if needed
        openingBalance: openingBalance,
        closingBalance: closingBalance
      },
      transactions: transactions.slice(-50), // Return last 50 transactions
      accounts: accounts.map(acc => ({ id: acc._id, code: acc.code, name: acc.name, type: acc.type }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get general ledger report
// @route   GET /api/reports/general-ledger
// @access  Public
const getGeneralLedger = async (req, res) => {
  try {
    const { accountId, startDate, endDate } = req.query;

    if (!accountId) {
      return res.status(400).json({ message: 'Account ID is required' });
    }

    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get vouchers for this account
    const vouchers = await Voucher.find({
      'entries.account': accountId,
      status: 'Posted',
      ...dateFilter
    }).sort({ date: 1 });

    let entries = [];
    let runningBalance = account.openingBalance || 0;

    // Opening balance entry
    entries.push({
      sr: 1,
      date: startDate || 'Opening',
      vcNumber: '',
      voucher: 'Opening Balance',
      narration: 'Opening Balance',
      invoice: '',
      debit: runningBalance >= 0 ? runningBalance : 0,
      credit: runningBalance < 0 ? Math.abs(runningBalance) : 0,
      balance: runningBalance,
      status: 'Opening'
    });

    vouchers.forEach((voucher, index) => {
      const entry = voucher.entries.find(e => e.account.toString() === accountId.toString());
      if (entry) {
        const debit = entry.debit || 0;
        const credit = entry.credit || 0;

        // Update running balance
        if (account.type === 'Asset' || account.type === 'Bank' || account.type === 'Cash') {
          runningBalance += debit - credit;
        } else {
          runningBalance += credit - debit;
        }

        entries.push({
          sr: index + 2,
          date: voucher.date.toISOString().split('T')[0],
          vcNumber: voucher.voucherNo,
          voucher: voucher.type,
          narration: voucher.description || voucher.reference,
          invoice: '',
          debit: debit,
          credit: credit,
          balance: runningBalance,
          status: voucher.status
        });
      }
    });

    const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0);
    const totalCredit = entries.reduce((sum, e) => sum + (e.credit || 0), 0);

    res.json({
      account: {
        id: account._id,
        code: account.code,
        name: account.name,
        type: account.type
      },
      summary: {
        openingBalance: account.openingBalance || 0,
        totalDebit: totalDebit,
        totalCredit: totalCredit,
        closingBalance: runningBalance
      },
      entries: entries
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get account status report
// @route   GET /api/reports/account-status
// @access  Public
const getAccountStatus = async (req, res) => {
  try {
    const { asOfDate } = req.query;

    // Use current date if no date provided
    const reportDate = asOfDate ? new Date(asOfDate) : new Date();

    // Get all active accounts
    const accounts = await Account.find({ isActive: true })
      .select('_id code name type balance openingBalance')
      .sort({ type: 1, name: 1 });

    // Calculate account balances as of the report date
    const accountStatuses = await Promise.all(
      accounts.map(async (account) => {
        // Get all vouchers up to the report date
        const vouchers = await Voucher.find({
          'entries.account': account._id,
          status: 'Posted',
          date: { $lte: reportDate }
        }).sort({ date: 1, createdAt: 1 });

        let currentBalance = account.openingBalance || 0;
        let transactionCount = 0;
        let lastActivity = null;

        vouchers.forEach(voucher => {
          const entry = voucher.entries.find(e => e.account.toString() === account._id.toString());
          if (entry) {
            const debit = entry.debit || 0;
            const credit = entry.credit || 0;

            // Update balance based on account type
            if (account.type === 'Asset' || account.type === 'Bank' || account.type === 'Cash') {
              currentBalance += debit - credit;
            } else {
              currentBalance += credit - debit;
            }

            transactionCount++;
            if (!lastActivity || voucher.date > lastActivity) {
              lastActivity = voucher.date;
            }
          }
        });

        // Determine account type for display
        let accountType = 'checking';
        if (account.type === 'Asset' && account.name.toLowerCase().includes('saving')) {
          accountType = 'savings';
        } else if (account.type === 'Asset' && account.name.toLowerCase().includes('cash')) {
          accountType = 'cash';
        } else if (account.type === 'Liability' && account.name.toLowerCase().includes('credit')) {
          accountType = 'credit';
        } else if (account.type === 'Asset' && account.name.toLowerCase().includes('merchant')) {
          accountType = 'merchant';
        }

        // For credit accounts, calculate available credit
        let availableBalance = currentBalance;
        let creditLimit = null;
        if (accountType === 'credit') {
          // Assume credit limit is stored or calculated
          creditLimit = Math.abs(currentBalance) + 35000; // Example calculation
          availableBalance = creditLimit + currentBalance; // Negative balance means used credit
        }

        return {
          id: account._id,
          name: account.name,
          type: accountType,
          balance: currentBalance,
          available: availableBalance,
          pending: 0, // Can be calculated from pending vouchers
          creditLimit: creditLimit,
          currency: 'USD',
          status: 'active',
          lastActivity: lastActivity ? lastActivity.toISOString().split('T')[0] + ' ' + lastActivity.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
          transactions: transactionCount
        };
      })
    );

    // Calculate summary statistics
    const totalAssets = accountStatuses
      .filter(acc => acc.type !== 'credit')
      .reduce((sum, acc) => sum + Math.max(0, acc.balance), 0);

    const totalLiabilities = accountStatuses
      .filter(acc => acc.type === 'credit')
      .reduce((sum, acc) => sum + Math.abs(acc.balance), 0);

    const netWorth = totalAssets - totalLiabilities;

    const cashBalance = accountStatuses
      .filter(acc => ['checking', 'savings', 'cash'].includes(acc.type))
      .reduce((sum, acc) => sum + acc.balance, 0);

    const creditAccounts = accountStatuses.filter(acc => acc.type === 'credit');
    const totalCreditUsed = creditAccounts.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
    const totalCreditLimit = creditAccounts.reduce((sum, acc) => sum + (acc.creditLimit || 0), 0);
    const creditUtilization = totalCreditLimit > 0 ? (totalCreditUsed / totalCreditLimit) * 100 : 0;

    // Get recent activities (last 10 transactions across all accounts)
    const recentVouchers = await Voucher.find({
      status: 'Posted',
      date: { $lte: reportDate }
    })
    .sort({ date: -1, createdAt: -1 })
    .limit(20);

    const recentActivities = [];
    recentVouchers.forEach(voucher => {
      voucher.entries.forEach(entry => {
        const account = accounts.find(acc => acc._id.toString() === entry.account.toString());
        if (account) {
          const isDebit = entry.debit > 0;
          const amount = isDebit ? entry.debit : entry.credit;
          const type = isDebit ? 'deposit' : 'withdrawal';

          recentActivities.push({
            id: voucher._id + '_' + entry._id,
            account: account.name,
            type: type,
            amount: amount,
            date: voucher.date.toISOString().split('T')[0] + ' ' + voucher.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            status: 'completed'
          });
        }
      });
    });

    // Sort and limit to 4 most recent
    recentActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
    const limitedActivities = recentActivities.slice(0, 4);

    res.json({
      accounts: accountStatuses,
      summary: {
        totalAssets: totalAssets,
        totalLiabilities: totalLiabilities,
        netWorth: netWorth,
        cashBalance: cashBalance,
        creditUtilization: Math.round(creditUtilization * 10) / 10,
        activeAccounts: accountStatuses.filter(acc => acc.status === 'active').length,
        inactiveAccounts: accountStatuses.filter(acc => acc.status !== 'active').length
      },
      recentActivities: limitedActivities
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAccountActivity,
  getGeneralLedger,
  getAccountStatus
};
