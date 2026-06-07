import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const AccountStatusReport = () => {
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewType, setViewType] = useState('overview');
  const [accountData, setAccountData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAccountStatus();
  }, [reportDate]);

  const fetchAccountStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reports/account-status?asOfDate=${reportDate}`);
      setAccountData(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load account status data');
      console.error('Error fetching account status:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getAccountTypeIcon = (type) => {
    const icons = {
      checking: 'fa-building-columns',
      savings: 'fa-piggy-bank',
      cash: 'fa-money-bill-wave',
      credit: 'fa-credit-card',
      merchant: 'fa-store'
    };
    return icons[type] || 'fa-wallet';
  };

  const getAccountTypeColor = (type) => {
    const colors = {
      checking: 'primary',
      savings: 'success',
      cash: 'warning',
      credit: 'info',
      merchant: 'secondary'
    };
    return colors[type] || 'dark';
  };

  const getStatusBadge = (status) => {
    return status === 'active' ? 'badge bg-success' : 'badge bg-danger';
  };

  const getBalanceColor = (balance) => {
    return balance >= 0 ? 'text-success' : 'text-danger';
  };

  if (loading) {
    return (
      <div className="container-fluid py-3">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading account status data...</p>
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

  if (!accountData) {
    return (
      <div className="container-fluid py-3">
        <div className="alert alert-warning" role="alert">
          <i className="fas fa-info-circle me-2"></i>
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-3">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div>
              <h2 className="text-primary">
                <i className="fas fa-chart-pie me-2"></i>
                Account Status Report
              </h2>
              <p className="text-muted mb-0">Comprehensive overview of all account balances and financial status</p>
            </div>
            <div className="d-flex gap-2 mt-2 mt-md-0">
              <input
                type="date"
                className="form-control"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                style={{ width: '160px' }}
              />
              <button className="btn btn-outline-primary">
                <i className="fas fa-download me-1"></i> Export
              </button>
              <button className="btn btn-primary">
                <i className="fas fa-print me-1"></i> Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View Type Tabs */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body py-2">
              <ul className="nav nav-pills">
                <li className="nav-item">
                  <button
                    className={`nav-link ${viewType === 'overview' ? 'active' : ''}`}
                    onClick={() => setViewType('overview')}
                  >
                    <i className="fas fa-chart-bar me-1"></i>
                    Overview
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${viewType === 'detailed' ? 'active' : ''}`}
                    onClick={() => setViewType('detailed')}
                  >
                    <i className="fas fa-list me-1"></i>
                    Detailed View
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${viewType === 'analytics' ? 'active' : ''}`}
                    onClick={() => setViewType('analytics')}
                  >
                    <i className="fas fa-chart-line me-1"></i>
                    Analytics
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card border-success">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title text-muted">Total Assets</h6>
                  <h3 className="text-success">{formatCurrency(accountData.summary.totalAssets)}</h3>
                  <small className="text-muted">Across all accounts</small>
                </div>
                <div className="text-success">
                  <i className="fas fa-wallet fa-2x"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card border-primary">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title text-muted">Net Worth</h6>
                  <h3 className="text-primary">{formatCurrency(accountData.summary.netWorth)}</h3>
                  <small className="text-muted">Assets - Liabilities</small>
                </div>
                <div className="text-primary">
                  <i className="fas fa-chart-line fa-2x"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card border-warning">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title text-muted">Cash Balance</h6>
                  <h3 className="text-warning">{formatCurrency(accountData.summary.cashBalance)}</h3>
                  <small className="text-muted">Liquid funds</small>
                </div>
                <div className="text-warning">
                  <i className="fas fa-money-bill-wave fa-2x"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card border-info">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title text-muted">Credit Utilization</h6>
                  <h3 className="text-info">{accountData.summary.creditUtilization}%</h3>
                  <small className="text-muted">Of available credit</small>
                </div>
                <div className="text-info">
                  <i className="fas fa-credit-card fa-2x"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="row">
        {/* Accounts List */}
        <div className="col-lg-8 mb-4">
          <div className="card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Account Balances</h5>
                <span className="badge bg-primary">
                  {accountData.summary.activeAccounts} Active Accounts
                </span>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Account</th>
                      <th>Type</th>
                      <th>Current Balance</th>
                      <th>Available Balance</th>
                      <th>Pending</th>
                      <th>Transactions</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountData.accounts.map((account) => (
                      <tr key={account.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <i className={`fas ${getAccountTypeIcon(account.type)} text-${getAccountTypeColor(account.type)} me-3`}></i>
                            <div>
                              <div className="fw-bold">{account.name}</div>
                              <small className="text-muted">Last activity: {account.lastActivity}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge bg-${getAccountTypeColor(account.type)}`}>
                            {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                          </span>
                        </td>
                        <td className={`fw-bold ${getBalanceColor(account.balance)}`}>
                          {formatCurrency(account.balance)}
                        </td>
                        <td className="fw-medium">
                          {formatCurrency(account.available)}
                          {account.creditLimit && (
                            <small className="text-muted d-block">Limit: {formatCurrency(account.creditLimit)}</small>
                          )}
                        </td>
                        <td className="text-warning">
                          {account.pending > 0 ? formatCurrency(account.pending) : '-'}
                        </td>
                        <td>
                          <span className="badge bg-secondary">{account.transactions}</span>
                        </td>
                        <td>
                          <span className={getStatusBadge(account.status)}>
                            {account.status}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-outline-primary" title="View Details">
                              <i className="fas fa-eye"></i>
                            </button>
                            <button className="btn btn-outline-success" title="Transfer">
                              <i className="fas fa-exchange-alt"></i>
                            </button>
                            <button className="btn btn-outline-info" title="Statement">
                              <i className="fas fa-file-invoice"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Quick Stats and Recent Activity */}
        <div className="col-lg-4 mb-4">
          {/* Account Distribution */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="card-title mb-0">Account Distribution</h6>
            </div>
            <div className="card-body">
              {accountData.accounts.map((account) => (
                <div key={account.id} className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <div className="d-flex align-items-center">
                      <i className={`fas ${getAccountTypeIcon(account.type)} text-${getAccountTypeColor(account.type)} me-2`}></i>
                      <small>{account.name}</small>
                    </div>
                    <small className="fw-bold">{formatCurrency(account.balance)}</small>
                  </div>
                  <div className="progress" style={{ height: '6px' }}>
                    <div 
                      className={`progress-bar bg-${getAccountTypeColor(account.type)}`}
                      style={{ 
                        width: `${(Math.abs(account.balance) / accountData.summary.totalAssets) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="card-title mb-0">Recent Activity</h6>
            </div>
            <div className="card-body">
              {accountData.recentActivities.map((activity) => (
                <div key={activity.id} className="d-flex align-items-start mb-3">
                  <div className={`flex-shrink-0 rounded-circle d-flex align-items-center justify-content-center bg-${
                    activity.type === 'deposit' ? 'success' : 
                    activity.type === 'withdrawal' ? 'danger' : 'info'
                  }`} style={{ width: '32px', height: '32px' }}>
                    <i className={`fas fa-${activity.type === 'deposit' ? 'arrow-down' : activity.type === 'withdrawal' ? 'arrow-up' : 'exchange-alt'} text-white`}></i>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="mb-0 small">{activity.account}</h6>
                        <small className="text-muted">{activity.date}</small>
                      </div>
                      <div className={`text-end ${
                        activity.type === 'deposit' ? 'text-success' : 
                        activity.type === 'withdrawal' ? 'text-danger' : 'text-info'
                      }`}>
                        <div className="small fw-bold">
                          {activity.type === 'deposit' ? '+' : '-'}{formatCurrency(activity.amount)}
                        </div>
                        <small className="text-capitalize">{activity.type}</small>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
                  <i className="fas fa-plus me-2"></i>Open New Account
                </button>
                <button className="btn btn-outline-success btn-sm">
                  <i className="fas fa-exchange-alt me-2"></i>Transfer Funds
                </button>
                <button className="btn btn-outline-info btn-sm">
                  <i className="fas fa-file-invoice me-2"></i>Generate Statement
                </button>
                <button className="btn btn-outline-warning btn-sm">
                  <i className="fas fa-bell me-2"></i>Set Alerts
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Summary Information */}
      <div className="row mt-4">
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Balance Summary</h5>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-4">
                  <div className="border-end">
                    <div className="text-success fw-bold h5">+{formatCurrency(accountData.summary.totalAssets)}</div>
                    <small className="text-muted">Total Assets</small>
                  </div>
                </div>
                <div className="col-4">
                  <div className="border-end">
                    <div className="text-danger fw-bold h5">{formatCurrency(accountData.summary.totalLiabilities)}</div>
                    <small className="text-muted">Liabilities</small>
                  </div>
                </div>
                <div className="col-4">
                  <div className="text-primary fw-bold h5">{formatCurrency(accountData.summary.netWorth)}</div>
                  <small className="text-muted">Net Worth</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Account Health</h5>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-3">
                  <div className="border-end">
                    <div className="text-success fw-bold h5">{accountData.summary.activeAccounts}</div>
                    <small className="text-muted">Active</small>
                  </div>
                </div>
                <div className="col-3">
                  <div className="border-end">
                    <div className="text-warning fw-bold h5">{accountData.summary.inactiveAccounts}</div>
                    <small className="text-muted">Inactive</small>
                  </div>
                </div>
                <div className="col-3">
                  <div className="border-end">
                    <div className="text-info fw-bold h5">{accountData.accounts.reduce((sum, acc) => sum + acc.transactions, 0)}</div>
                    <small className="text-muted">Total Txns</small>
                  </div>
                </div>
                <div className="col-3">
                  <div className="text-primary fw-bold h5">{accountData.summary.creditUtilization}%</div>
                  <small className="text-muted">Credit Used</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Footer */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body text-center">
              <p className="text-muted mb-0">
                Report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()} | 
                This report is for internal use only
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountStatusReport;