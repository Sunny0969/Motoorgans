import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const MonthlyTransactionReport = () => {
  const [selectedMonth, setSelectedMonth] = useState('2024-01');
  const [viewType, setViewType] = useState('summary'); // 'summary', 'detailed', 'charts'
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch report data from API
  const fetchReportData = async (month, year) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/monthly-transaction-reports?month=${month}&year=${year}`);
      setReportData(response.data);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to load report data. Using sample data instead.');
      // Fallback to sample data
      setReportData(getSampleData(month, year));
    } finally {
      setLoading(false);
    }
  };

  // Sample data fallback
  const getSampleData = (month, year) => {
    const key = `${year}-${month.toString().padStart(2, '0')}`;
    return {
      summary: {
        totalSales: 85420.75,
        totalExpenses: 45230.50,
        netProfit: 40190.25,
        transactionCount: 1247,
        averageTransaction: 68.52,
        refunds: 1250.00
      },
      dailyBreakdown: [
        { date: `${year}-${month.toString().padStart(2, '0')}-01`, sales: 2850.25, transactions: 42, expenses: 1520.30 },
        { date: `${year}-${month.toString().padStart(2, '0')}-02`, sales: 3120.50, transactions: 48, expenses: 1680.75 },
        { date: `${year}-${month.toString().padStart(2, '0')}-03`, sales: 2980.75, transactions: 45, expenses: 1420.20 },
        { date: `${year}-${month.toString().padStart(2, '0')}-04`, sales: 3450.00, transactions: 52, expenses: 1890.50 },
        { date: `${year}-${month.toString().padStart(2, '0')}-05`, sales: 4120.25, transactions: 58, expenses: 2150.80 },
        { date: `${year}-${month.toString().padStart(2, '0')}-06`, sales: 5230.75, transactions: 65, expenses: 2450.90 },
        { date: `${year}-${month.toString().padStart(2, '0')}-07`, sales: 4850.50, transactions: 61, expenses: 2320.40 },
      ],
      categories: [
        { name: 'Electronics', amount: 32500.25, percentage: 38.1 },
        { name: 'Clothing', amount: 21500.50, percentage: 25.2 },
        { name: 'Food & Beverages', amount: 18500.75, percentage: 21.7 },
        { name: 'Accessories', amount: 8500.25, percentage: 9.9 },
        { name: 'Services', amount: 4420.00, percentage: 5.2 }
      ],
      paymentMethods: [
        { method: 'Credit Card', amount: 45210.25, percentage: 52.9 },
        { method: 'Cash', amount: 28500.50, percentage: 33.4 },
        { method: 'Digital Wallet', amount: 9850.00, percentage: 11.5 },
        { method: 'Bank Transfer', amount: 1860.00, percentage: 2.2 }
      ]
    };
  };

  // Load data when component mounts or month changes
  useEffect(() => {
    const [year, month] = selectedMonth.split('-');
    fetchReportData(parseInt(month), parseInt(year));
  }, [selectedMonth]);

  const currentData = reportData || getSampleData(1, 2024);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getProfitColor = (profit) => {
    return profit >= 0 ? 'text-success' : 'text-danger';
  };

  const getGrowthIndicator = (current, previous) => {
    if (!previous) return null;
    const growth = ((current - previous) / previous) * 100;
    return (
      <span className={growth >= 0 ? 'text-success' : 'text-danger'}>
        <i className={`fas fa-chevron-${growth >= 0 ? 'up' : 'down'} me-1`}></i>
        {Math.abs(growth).toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="container-fluid py-3">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div>
              <h2 className="text-primary">
                <i className="fas fa-chart-line me-2"></i>
                Monthly Transaction Report
              </h2>
              <p className="text-muted mb-0">Comprehensive overview of your monthly business performance</p>
            </div>
            <div className="d-flex gap-2 mt-2 mt-md-0">
              <select 
                className="form-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{ minWidth: '150px' }}
              >
                <option value="2024-01">January 2024</option>
                <option value="2023-12">December 2023</option>
                <option value="2023-11">November 2023</option>
              </select>
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
                    className={`nav-link ${viewType === 'summary' ? 'active' : ''}`}
                    onClick={() => setViewType('summary')}
                  >
                    <i className="fas fa-chart-bar me-1"></i>
                    Summary
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
                    className={`nav-link ${viewType === 'charts' ? 'active' : ''}`}
                    onClick={() => setViewType('charts')}
                  >
                    <i className="fas fa-chart-pie me-1"></i>
                    Charts & Analytics
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card border-primary">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title text-muted">Total Sales</h6>
                  <h3 className="text-primary">{formatCurrency(currentData.summary.totalSales)}</h3>
                  <small className="text-muted">
                    {currentData.summary.transactionCount} transactions
                  </small>
                </div>
                <div className="text-primary">
                  <i className="fas fa-shopping-cart fa-2x"></i>
                </div>
              </div>
              <div className="mt-2">
                <small className="text-success">
                  <i className="fas fa-chevron-up me-1"></i>
                  12.5% from previous month
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card border-warning">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title text-muted">Net Profit</h6>
                  <h3 className={getProfitColor(currentData.summary.netProfit)}>
                    {formatCurrency(currentData.summary.netProfit)}
                  </h3>
                  <small className="text-muted">
                    Profit Margin: {((currentData.summary.netProfit / currentData.summary.totalSales) * 100).toFixed(1)}%
                  </small>
                </div>
                <div className="text-warning">
                  <i className="fas fa-dollar-sign fa-2x"></i>
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
                  <h6 className="card-title text-muted">Avg. Transaction</h6>
                  <h3 className="text-info">{formatCurrency(currentData.summary.averageTransaction)}</h3>
                  <small className="text-muted">
                    Per transaction
                  </small>
                </div>
                <div className="text-info">
                  <i className="fas fa-receipt fa-2x"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card border-danger">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title text-muted">Refunds</h6>
                  <h3 className="text-danger">{formatCurrency(currentData.summary.refunds)}</h3>
                  <small className="text-muted">
                    {((currentData.summary.refunds / currentData.summary.totalSales) * 100).toFixed(1)}% of sales
                  </small>
                </div>
                <div className="text-danger">
                  <i className="fas fa-undo fa-2x"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content based on View Type */}
      {viewType === 'summary' && (
        <div className="row">
          {/* Daily Sales Chart */}
          <div className="col-lg-8 mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Daily Sales Trend</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Sales</th>
                        <th>Transactions</th>
                        <th>Avg. Value</th>
                        <th>Expenses</th>
                        <th>Daily Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentData.dailyBreakdown.map((day, index) => (
                        <tr key={index}>
                          <td>{new Date(day.date).toLocaleDateString()}</td>
                          <td className="fw-bold">{formatCurrency(day.sales)}</td>
                          <td>{day.transactions}</td>
                          <td>{formatCurrency(day.sales / day.transactions)}</td>
                          <td className="text-danger">{formatCurrency(day.expenses)}</td>
                          <td className={getProfitColor(day.sales - day.expenses)}>
                            {formatCurrency(day.sales - day.expenses)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="col-lg-4 mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Sales by Category</h5>
              </div>
              <div className="card-body">
                {currentData.categories.map((category, index) => (
                  <div key={index} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="fw-medium">{category.name}</span>
                      <span>{formatCurrency(category.amount)}</span>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div 
                        className="progress-bar" 
                        style={{ 
                          width: `${category.percentage}%`,
                          backgroundColor: `hsl(${index * 60}, 70%, 45%)`
                        }}
                      ></div>
                    </div>
                    <small className="text-muted">{category.percentage}% of total sales</small>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="card mt-4">
              <div className="card-header">
                <h5 className="card-title mb-0">Payment Methods</h5>
              </div>
              <div className="card-body">
                {currentData.paymentMethods.map((method, index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <i className={`fas fa-${method.method === 'Credit Card' ? 'credit-card' : method.method === 'Cash' ? 'money-bill' : 'mobile-alt'} me-2 text-muted`}></i>
                      {method.method}
                    </div>
                    <div className="text-end">
                      <div className="fw-medium">{formatCurrency(method.amount)}</div>
                      <small className="text-muted">{method.percentage}%</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewType === 'detailed' && (
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Detailed Transaction List</h5>
                  <div className="d-flex gap-2">
                    <input 
                      type="text" 
                      className="form-control form-control-sm" 
                      placeholder="Search transactions..."
                      style={{ width: '200px' }}
                    />
                    <select className="form-select form-select-sm" style={{ width: '150px' }}>
                      <option>All Categories</option>
                      <option>Electronics</option>
                      <option>Clothing</option>
                      <option>Food & Beverages</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Date & Time</th>
                        <th>Transaction ID</th>
                        <th>Customer</th>
                        <th>Category</th>
                        <th>Items</th>
                        <th>Payment Method</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Sample transaction rows */}
                      <tr>
                        <td>2024-01-05 14:32</td>
                        <td className="fw-bold">TXN-001254</td>
                        <td>John Smith</td>
                        <td>Electronics</td>
                        <td>3 items</td>
                        <td>
                          <span className="badge bg-primary">Credit Card</span>
                        </td>
                        <td className="fw-bold">{formatCurrency(450.75)}</td>
                        <td>
                          <span className="badge bg-success">Completed</span>
                        </td>
                      </tr>
                      <tr>
                        <td>2024-01-05 11:15</td>
                        <td className="fw-bold">TXN-001253</td>
                        <td>Sarah Johnson</td>
                        <td>Clothing</td>
                        <td>2 items</td>
                        <td>
                          <span className="badge bg-success">Cash</span>
                        </td>
                        <td className="fw-bold">{formatCurrency(125.50)}</td>
                        <td>
                          <span className="badge bg-success">Completed</span>
                        </td>
                      </tr>
                      <tr>
                        <td>2024-01-05 09:48</td>
                        <td className="fw-bold">TXN-001252</td>
                        <td>Mike Brown</td>
                        <td>Food & Beverages</td>
                        <td>5 items</td>
                        <td>
                          <span className="badge bg-info">Digital Wallet</span>
                        </td>
                        <td className="fw-bold">{formatCurrency(68.25)}</td>
                        <td>
                          <span className="badge bg-warning">Refunded</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="card-footer">
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">Showing 50 of {currentData.summary.transactionCount} transactions</small>
                  <nav>
                    <ul className="pagination pagination-sm mb-0">
                      <li className="page-item disabled"><a className="page-link" href="#">Previous</a></li>
                      <li className="page-item active"><a className="page-link" href="#">1</a></li>
                      <li className="page-item"><a className="page-link" href="#">2</a></li>
                      <li className="page-item"><a className="page-link" href="#">3</a></li>
                      <li className="page-item"><a className="page-link" href="#">Next</a></li>
                    </ul>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewType === 'charts' && (
        <div className="row">
          <div className="col-lg-6 mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Sales Distribution by Category</h5>
              </div>
              <div className="card-body text-center">
                <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                  <div className="text-muted">
                    <i className="fas fa-chart-pie fa-3x mb-3"></i>
                    <p>Pie Chart Visualization</p>
                    <small>(Chart library integration required)</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-6 mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Monthly Comparison</h5>
              </div>
              <div className="card-body text-center">
                <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                  <div className="text-muted">
                    <i className="fas fa-chart-bar fa-3x mb-3"></i>
                    <p>Bar Chart Visualization</p>
                    <small>(Chart library integration required)</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Performance Analytics</h5>
              </div>
              <div className="card-body">
                <div className="row text-center">
                  <div className="col-md-3 mb-3">
                    <div className="border rounded p-3">
                      <h4 className="text-primary">47.2%</h4>
                      <small className="text-muted">Customer Retention Rate</small>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="border rounded p-3">
                      <h4 className="text-success">12.8%</h4>
                      <small className="text-muted">Sales Growth</small>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="border rounded p-3">
                      <h4 className="text-warning">3.2%</h4>
                      <small className="text-muted">Refund Rate</small>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="border rounded p-3">
                      <h4 className="text-info">18.5</h4>
                      <small className="text-muted">Avg. Items per Transaction</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Actions */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h6 className="card-title">Report Actions</h6>
              <div className="d-flex flex-wrap gap-2">
                <button className="btn btn-outline-primary">
                  <i className="fas fa-file-pdf me-1"></i> Generate PDF Report
                </button>
                <button className="btn btn-outline-success">
                  <i className="fas fa-file-excel me-1"></i> Export to Excel
                </button>
                <button className="btn btn-outline-info">
                  <i className="fas fa-chart-bar me-1"></i> Custom Analysis
                </button>
                <button className="btn btn-outline-warning">
                  <i className="fas fa-envelope me-1"></i> Email Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyTransactionReport;