import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const AccountActivityReport = () => {
  const [dateRange, setDateRange] = useState('today');
  const [accountType, setAccountType] = useState('all');
  const [viewMode, setViewMode] = useState('summary');
  const [activityData, setActivityData] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch accounts on component mount
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await api.get('/accounts');
        setAccounts(response.data);
      } catch (err) {
        console.error('Error fetching accounts:', err);
      }
    };
    fetchAccounts();
  }, []);

  // Fetch activity data when filters change
  useEffect(() => {
    const fetchActivityData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();

        // Calculate date range
        const now = new Date();
        let startDate, endDate;

        switch (dateRange) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            break;
          case 'yesterday':
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
            endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
            break;
          case 'week':
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            startDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            break;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        }

        params.append('startDate', startDate.toISOString().split('T')[0]);
        params.append('endDate', endDate.toISOString().split('T')[0]);

        if (accountType !== 'all') {
          params.append('accountType', accountType);
        }

        const response = await api.get(`/reports/account-activity?${params}`);
        setActivityData(response.data);
      } catch (err) {
        console.error('Error fetching activity data:', err);
        setError('Failed to load activity data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchActivityData();
  }, [dateRange, accountType]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getTransactionIcon = (type) => {
    const icons = {
      deposit: 'fa-arrow-down text-success',
      withdrawal: 'fa-arrow-up text-danger',
      fee: 'fa-file-invoice-dollar text-warning',
      transfer: 'fa-exchange-alt text-info'
    };
    return icons[type] || 'fa-exchange-alt';
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'success',
      pending: 'warning',
      failed: 'danger',
      cancelled: 'secondary'
    };
    return `badge bg-${styles[status] || 'secondary'}`;
  };

  const getAccountBadge = (accountName) => {
    const styles = {
      Operating: 'primary',
      'Petty Cash': 'success',
      Equipment: 'info',
      Savings: 'warning',
      'Tax Reserve': 'danger'
    };
    return `badge bg-${styles[accountName] || 'secondary'}`;
  };

  if (loading) {
    return (
      <div className="container-fluid py-3">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading account activity data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-3">
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      </div>
    );
  }

  const currentData = activityData || {
    summary: {
      totalTransactions: 0,
      deposits: 0,
      withdrawals: 0,
      fees: 0,
      openingBalance: 0,
      closingBalance: 0
    },
    transactions: []
  };

  return (
    <div className="container-fluid py-3">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div>
              <h2 className="text-primary">
                <i className="fas fa-file-invoice-dollar me-2"></i>
                Account Activity Report
              </h2>
              <p className="text-muted mb-0">Track all financial transactions and account movements</p>
            </div>
            <div className="d-flex gap-2 mt-2 mt-md-0">
              <button className="btn btn-outline-primary" onClick={() => window.location.reload()}>
                <i className="fas fa-sync-alt me-1"></i> Refresh
              </button>
              <button className="btn btn-primary">
                <i className="fas fa-download me-1"></i> Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label">Date Range</label>
                  <select
                    className="form-select"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                  >
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Account Type</label>
                  <select
                    className="form-select"
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                  >
                    <option value="all">All Accounts</option>
                    <option value="Asset">Asset Accounts</option>
                    <option value="Liability">Liability Accounts</option>
                    <option value="Equity">Equity Accounts</option>
                    <option value="Income">Income Accounts</option>
                    <option value="Expense">Expense Accounts</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">View Mode</label>
                  <select
                    className="form-select"
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value)}
                  >
                    <option value="summary">Summary View</option>
                    <option value="detailed">Detailed View</option>
                    <option value="charts">Chart Analysis</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Quick Actions</label>
                  <div className="d-flex gap-2">
                    <button className="btn btn-outline-secondary flex-fill">
                      <i className="fas fa-filter"></i>
                    </button>
                    <button className="btn btn-outline-secondary flex-fill">
                      <i className="fas fa-print"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-xl-2 col-md-4 col-6 mb-3">
          <div className="card border-primary">
            <div className="card-body text-center p-3">
              <div className="text-primary mb-2">
                <i className="fas fa-exchange-alt fa-2x"></i>
              </div>
              <h5 className="card-title text-muted mb-1">Total Transactions</h5>
              <h3 className="text-primary">{currentData.summary.totalTransactions}</h3>
            </div>
          </div>
        </div>

        <div className="col-xl-2 col-md-4 col-6 mb-3">
          <div className="card border-success">
            <div className="card-body text-center p-3">
              <div className="text-success mb-2">
                <i className="fas fa-arrow-down fa-2x"></i>
              </div>
              <h5 className="card-title text-muted mb-1">Total Deposits</h5>
              <h4 className="text-success">{formatCurrency(currentData.summary.deposits)}</h4>
            </div>
          </div>
        </div>

        <div className="col-xl-2 col-md-4 col-6 mb-3">
          <div className="card border-danger">
            <div className="card-body text-center p-3">
              <div className="text-danger mb-2">
                <i className="fas fa-arrow-up fa-2x"></i>
              </div>
              <h5 className="card-title text-muted mb-1">Total Withdrawals</h5>
              <h4 className="text-danger">{formatCurrency(currentData.summary.withdrawals)}</h4>
            </div>
          </div>
        </div>

        <div className="col-xl-2 col-md-4 col-6 mb-3">
          <div className="card border-warning">
            <div className="card-body text-center p-3">
              <div className="text-warning mb-2">
                <i className="fas fa-file-invoice-dollar fa-2x"></i>
              </div>
              <h5 className="card-title text-muted mb-1">Fees & Charges</h5>
              <h4 className="text-warning">{formatCurrency(currentData.summary.fees)}</h4>
            </div>
          </div>
        </div>

        <div className="col-xl-2 col-md-4 col-6 mb-3">
          <div className="card border-info">
            <div className="card-body text-center p-3">
              <div className="text-info mb-2">
                <i className="fas fa-wallet fa-2x"></i>
              </div>
              <h5 className="card-title text-muted mb-1">Opening Balance</h5>
              <h4 className="text-info">{formatCurrency(currentData.summary.openingBalance)}</h4>
            </div>
          </div>
        </div>

        <div className="col-xl-2 col-md-4 col-6 mb-3">
          <div className="card border-dark">
            <div className="card-body text-center p-3">
              <div className="text-dark mb-2">
                <i className="fas fa-balance-scale fa-2x"></i>
              </div>
              <h5 className="card-title text-muted mb-1">Closing Balance</h5>
              <h4 className="text-dark">{formatCurrency(currentData.summary.closingBalance)}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="row">
        {/* Transaction List */}
        <div className="col-lg-8 mb-4">
          <div className="card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Transaction History</h5>
                <span className="badge bg-primary">
                  {currentData.transactions.length} transactions
                </span>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Account</th>
                      <th>Amount</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.transactions.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center text-muted py-4">
                          No transactions found for the selected period
                        </td>
                      </tr>
                    ) : (
                      currentData.transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="text-muted">{new Date(transaction.date).toLocaleDateString()}</td>
                          <td className="text-muted">{transaction.time}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className={`fas ${getTransactionIcon(transaction.type)} me-2`}></i>
                              <span className="text-capitalize">{transaction.type}</span>
                            </div>
                          </td>
                          <td>
                            <div className="fw-medium">{transaction.description}</div>
                            <small className="text-muted">Voucher: {transaction.voucherNo}</small>
                          </td>
                          <td>
                            <span className={getAccountBadge(transaction.account)}>
                              {transaction.account}
                            </span>
                          </td>
                          <td className={`fw-bold ${
                            transaction.type === 'deposit' ? 'text-success' :
                            transaction.type === 'withdrawal' ? 'text-danger' : 'text-warning'
                          }`}>
                            {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </td>
                          <td className="fw-medium">{formatCurrency(transaction.balance)}</td>
                          <td>
                            <span className={getStatusBadge(transaction.status)}>
                              {transaction.status}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button className="btn btn-outline-primary" title="View Details">
                                <i className="fas fa-eye"></i>
                              </button>
                              <button className="btn btn-outline-secondary" title="Print Receipt">
                                <i className="fas fa-print"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card-footer">
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  Showing {currentData.transactions.length} transactions
                </small>
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className="page-item disabled">
                      <a className="page-link" href="#">Previous</a>
                    </li>
                    <li className="page-item active">
                      <a className="page-link" href="#">1</a>
                    </li>
                    <li className="page-item">
                      <a className="page-link" href="#">Next</a>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Quick Stats and Filters */}
        <div className="col-lg-4 mb-4">
          {/* Account Summary */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="card-title mb-0">Account Summary</h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">Net Flow</span>
                  <strong className={
                    currentData.summary.deposits - currentData.summary.withdrawals >= 0 ?
                    'text-success' : 'text-danger'
                  }>
                    {formatCurrency(currentData.summary.deposits - currentData.summary.withdrawals)}
                  </strong>
                </div>
                <div className="progress" style={{ height: '6px' }}>
                  <div
                    className="progress-bar bg-success"
                    style={{
                      width: `${currentData.summary.deposits + currentData.summary.withdrawals > 0 ?
                        (currentData.summary.deposits / (currentData.summary.deposits + currentData.summary.withdrawals)) * 100 : 0}%`
                    }}
                  ></div>
                </div>
              </div>

              <div className="row text-center">
                <div className="col-6">
                  <div className="border-end">
                    <div className="text-success fw-bold">+{formatCurrency(currentData.summary.deposits)}</div>
                    <small className="text-muted">Incoming</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="text-danger fw-bold">-{formatCurrency(currentData.summary.withdrawals)}</div>
                  <small className="text-muted">Outgoing</small>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Types Breakdown */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="card-title mb-0">Transaction Types</h6>
            </div>
            <div className="card-body">
              {['deposit', 'withdrawal'].map((type) => {
                const count = currentData.transactions.filter(t => t.type === type).length;
                const percentage = currentData.transactions.length > 0 ? (count / currentData.transactions.length) * 100 : 0;
                return (
                  <div key={type} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-capitalize">{type}</span>
                      <span>{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="progress" style={{ height: '4px' }}>
                      <div
                        className={`progress-bar ${
                          type === 'deposit' ? 'bg-success' : 'bg-danger'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h6 className="card-title mb-0">Quick Actions</h6>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button className="btn btn-outline-primary btn-sm">
                  <i className="fas fa-plus me-2"></i>Add Manual Transaction
                </button>
                <button className="btn btn-outline-success btn-sm">
                  <i className="fas fa-file-export me-2"></i>Export to CSV
                </button>
                <button className="btn btn-outline-info btn-sm">
                  <i className="fas fa-chart-bar me-2"></i>Generate Chart
                </button>
                <button className="btn btn-outline-warning btn-sm">
                  <i className="fas fa-bell me-2"></i>Set Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="fas fa-history me-2"></i>
                Recent Activity Timeline
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                {currentData.transactions.slice(0, 4).map((transaction, index) => (
                  <div key={transaction.id} className="col-lg-3 col-md-6 mb-3">
                    <div className="d-flex">
                      <div className={`flex-shrink-0 rounded-circle d-flex align-items-center justify-content-center ${
                        transaction.type === 'deposit' ? 'bg-success' :
                        transaction.type === 'withdrawal' ? 'bg-danger' : 'bg-warning'
                      }`} style={{ width: '40px', height: '40px' }}>
                        <i className={`fas ${getTransactionIcon(transaction.type)} text-white`}></i>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h6 className="mb-0">{transaction.description}</h6>
                        <small className="text-muted">{transaction.time}</small>
                        <div className={`fw-bold ${
                          transaction.type === 'deposit' ? 'text-success' : 'text-danger'
                        }`}>
                          {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </div>
                      </div>
                    </div>
                    {index < 3 && <hr className="d-md-none" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountActivityReport;
