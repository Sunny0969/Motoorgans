import React, { useState } from 'react';

const FinancialPosition = () => {
  const [reportDate, setReportDate] = useState('2024-01-15');
  const [comparisonPeriod, setComparisonPeriod] = useState('previous-month');
  const [viewMode, setViewMode] = useState('detailed');

  // Sample financial data
  const financialData = {
    asOf: '2024-01-15',
    assets: {
      current: [
        { name: 'Cash and Cash Equivalents', amount: 56320.75, previous: 48250.30, notes: 'Operating, Petty Cash, Merchant Accounts' },
        { name: 'Accounts Receivable', amount: 28500.00, previous: 31200.50, notes: 'Customer outstanding invoices' },
        { name: 'Inventory', amount: 125800.75, previous: 118500.25, notes: 'Stock at cost value' },
        { name: 'Prepaid Expenses', amount: 8500.00, previous: 9200.00, notes: 'Insurance, subscriptions, rent' },
        { name: 'Other Current Assets', amount: 3200.50, previous: 2850.75, notes: 'Tax receivables, deposits' }
      ],
      fixed: [
        { name: 'Property and Equipment', amount: 185000.00, previous: 185000.00, notes: 'Store fixtures, computers, POS systems' },
        { name: 'Furniture and Fixtures', amount: 45000.00, previous: 45000.00, notes: 'Counters, displays, shelving' },
        { name: 'Vehicles', amount: 35000.00, previous: 35000.00, notes: 'Delivery vehicles' },
        { name: 'Less: Accumulated Depreciation', amount: -28500.00, previous: -25500.00, notes: 'Total depreciation to date' }
      ],
      intangible: [
        { name: 'Software and Licenses', amount: 15000.00, previous: 15000.00, notes: 'POS software, business applications' },
        { name: 'Goodwill', amount: 50000.00, previous: 50000.00, notes: 'Business acquisition premium' }
      ]
    },
    liabilities: {
      current: [
        { name: 'Accounts Payable', amount: 45230.50, previous: 41200.75, notes: 'Vendor outstanding invoices' },
        { name: 'Short-term Loans', amount: 25000.00, previous: 30000.00, notes: 'Working capital loan' },
        { name: 'Accrued Expenses', amount: 12500.25, previous: 11800.50, notes: 'Wages, utilities, taxes payable' },
        { name: 'Customer Deposits', amount: 8500.00, previous: 7200.00, notes: 'Advance payments from customers' },
        { name: 'Current Portion of Long-term Debt', amount: 15000.00, previous: 15000.00, notes: 'Due within one year' }
      ],
      longTerm: [
        { name: 'Long-term Loans', amount: 75000.00, previous: 80000.00, notes: 'Business expansion loan' },
        { name: 'Equipment Financing', amount: 25000.00, previous: 27500.00, notes: 'POS equipment financing' }
      ]
    },
    equity: [
      { name: 'Owner\'s Capital', amount: 150000.00, previous: 150000.00, notes: 'Initial investment' },
      { name: 'Retained Earnings', amount: 87641.25, previous: 78250.55, notes: 'Cumulative net income' },
      { name: 'Current Year Earnings', amount: 9390.70, previous: 0, notes: 'Net income for current period' },
      { name: 'Drawings', amount: -25000.00, previous: -20000.00, notes: 'Owner withdrawals' }
    ]
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateChange = (current, previous) => {
    if (previous === 0) return { amount: current, percentage: 100 };
    const change = current - previous;
    const percentage = (change / Math.abs(previous)) * 100;
    return { amount: change, percentage };
  };

  const getChangeColor = (change) => {
    return change >= 0 ? 'text-success' : 'text-danger';
  };

  const getChangeIcon = (change) => {
    return change >= 0 ? 'fa-chevron-up' : 'fa-chevron-down';
  };

  // Calculate totals
  const totalCurrentAssets = calculateTotal(financialData.assets.current);
  const totalFixedAssets = calculateTotal(financialData.assets.fixed);
  const totalIntangibleAssets = calculateTotal(financialData.assets.intangible);
  const totalAssets = totalCurrentAssets + totalFixedAssets + totalIntangibleAssets;

  const totalCurrentLiabilities = calculateTotal(financialData.liabilities.current);
  const totalLongTermLiabilities = calculateTotal(financialData.liabilities.longTerm);
  const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;

  const totalEquity = calculateTotal(financialData.equity);

  const previousTotalAssets = 325000;
  const previousTotalLiabilities = 185000;
  const previousTotalEquity = 140000;

  const assetsChange = calculateChange(totalAssets, previousTotalAssets);
  const liabilitiesChange = calculateChange(totalLiabilities, previousTotalLiabilities);
  const equityChange = calculateChange(totalEquity, previousTotalEquity);

  // FinancialSection Component - Fixed to accept proper props
  const FinancialSection = ({ title, items, total, previousTotal, level = 0 }) => {
    const sectionChange = calculateChange(total, previousTotal);
    
    return (
      <div className={`mb-3 ${level > 0 ? 'ms-4' : ''}`}>
        {level === 0 && (
          <div className="border-bottom pb-2 mb-2">
            <h6 className="fw-bold text-dark mb-1">{title}</h6>
          </div>
        )}
        
        {items.map((item, index) => {
          const change = calculateChange(item.amount, item.previous);
          return (
            <div key={index} className="row align-items-center py-1 border-bottom">
              <div className="col-md-6">
                <div className={`fw-medium ${level === 0 ? 'text-dark' : 'text-muted'}`}>
                  {level > 0 && '• '}{item.name}
                  {item.notes && (
                    <small className="text-muted d-block">{item.notes}</small>
                  )}
                </div>
              </div>
              <div className="col-md-3 text-end">
                <div className="fw-bold">{formatCurrency(item.amount)}</div>
              </div>
              <div className="col-md-3 text-end">
                <small className={getChangeColor(change.amount)}>
                  <i className={`fas ${getChangeIcon(change.amount)} me-1`}></i>
                  {formatCurrency(Math.abs(change.amount))} ({Math.abs(change.percentage).toFixed(1)}%)
                </small>
              </div>
            </div>
          );
        })}
        
        {level === 0 && (
          <div className="row align-items-center py-2 mt-2 bg-light rounded">
            <div className="col-md-6">
              <strong>Total {title}</strong>
            </div>
            <div className="col-md-3 text-end">
              <strong>{formatCurrency(total)}</strong>
            </div>
            <div className="col-md-3 text-end">
              <small className={getChangeColor(sectionChange.amount)}>
                <i className={`fas ${getChangeIcon(sectionChange.amount)} me-1`}></i>
                {formatCurrency(Math.abs(sectionChange.amount))} ({Math.abs(sectionChange.percentage).toFixed(1)}%)
              </small>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render different views based on viewMode
  const renderDetailedView = () => (
    <div className="row">
      <div className="col-12">
        <div className="card">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">
                Balance Sheet as of {new Date(financialData.asOf).toLocaleDateString()}
              </h5>
              <div className="text-muted small">
                <i className="fas fa-info-circle me-1"></i>
                All amounts in USD
              </div>
            </div>
          </div>
          <div className="card-body">
            {/* Assets Section */}
            <div className="row mb-4">
              <div className="col-12">
                <h6 className="text-success mb-3">
                  <i className="fas fa-wallet me-2"></i>
                  ASSETS
                </h6>
                
                <FinancialSection 
                  title="Current Assets"
                  items={financialData.assets.current}
                  total={totalCurrentAssets}
                  previousTotal={280000}
                />

                <FinancialSection 
                  title="Fixed Assets"
                  items={financialData.assets.fixed}
                  total={totalFixedAssets}
                  previousTotal={240000}
                />

                <FinancialSection 
                  title="Intangible Assets"
                  items={financialData.assets.intangible}
                  total={totalIntangibleAssets}
                  previousTotal={65000}
                />

                <div className="row align-items-center py-3 mt-3 bg-success text-white rounded">
                  <div className="col-md-6">
                    <h5 className="mb-0">TOTAL ASSETS</h5>
                  </div>
                  <div className="col-md-3 text-end">
                    <h4 className="mb-0">{formatCurrency(totalAssets)}</h4>
                  </div>
                  <div className="col-md-3 text-end">
                    <small>
                      <i className={`fas ${getChangeIcon(assetsChange.amount)} me-1`}></i>
                      {formatCurrency(Math.abs(assetsChange.amount))} ({Math.abs(assetsChange.percentage).toFixed(1)}%)
                    </small>
                  </div>
                </div>
              </div>
            </div>

            {/* Liabilities & Equity Section */}
            <div className="row">
              <div className="col-md-6">
                <h6 className="text-warning mb-3">
                  <i className="fas fa-scale-balanced me-2"></i>
                  LIABILITIES
                </h6>

                <FinancialSection 
                  title="Current Liabilities"
                  items={financialData.liabilities.current}
                  total={totalCurrentLiabilities}
                  previousTotal={95000}
                />

                <FinancialSection 
                  title="Long-term Liabilities"
                  items={financialData.liabilities.longTerm}
                  total={totalLongTermLiabilities}
                  previousTotal={90000}
                />

                <div className="row align-items-center py-2 mt-2 bg-warning text-dark rounded">
                  <div className="col-8">
                    <strong>TOTAL LIABILITIES</strong>
                  </div>
                  <div className="col-4 text-end">
                    <strong>{formatCurrency(totalLiabilities)}</strong>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <h6 className="text-primary mb-3">
                  <i className="fas fa-user-tie me-2"></i>
                  EQUITY
                </h6>

                <FinancialSection 
                  title="Owner's Equity"
                  items={financialData.equity}
                  total={totalEquity}
                  previousTotal={140000}
                />

                <div className="row align-items-center py-2 mt-2 bg-primary text-white rounded">
                  <div className="col-8">
                    <strong>TOTAL EQUITY</strong>
                  </div>
                  <div className="col-4 text-end">
                    <strong>{formatCurrency(totalEquity)}</strong>
                  </div>
                </div>

                {/* Balance Check */}
                <div className="row align-items-center py-3 mt-4 bg-dark text-white rounded">
                  <div className="col-8">
                    <h6 className="mb-0">TOTAL LIABILITIES & EQUITY</h6>
                  </div>
                  <div className="col-4 text-end">
                    <h5 className="mb-0">{formatCurrency(totalLiabilities + totalEquity)}</h5>
                  </div>
                </div>

                {/* Balance Validation */}
                <div className={`text-center mt-2 p-2 rounded ${
                  totalAssets === totalLiabilities + totalEquity ? 
                  'bg-success text-white' : 'bg-danger text-white'
                }`}>
                  <i className={`fas ${
                    totalAssets === totalLiabilities + totalEquity ? 
                    'fa-check-circle' : 'fa-exclamation-triangle'
                  } me-2`}></i>
                  {totalAssets === totalLiabilities + totalEquity ? 
                   'Balance Sheet is Balanced' : 
                   'Balance Sheet is Out of Balance'}
                  <br />
                  <small>
                    Assets ({formatCurrency(totalAssets)}) = Liabilities ({formatCurrency(totalLiabilities)}) + Equity ({formatCurrency(totalEquity)})
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSummaryView = () => (
    <div className="row">
      <div className="col-12">
        <div className="card">
          <div className="card-header">
            <h5 className="card-title mb-0">Financial Summary</h5>
          </div>
          <div className="card-body">
            <div className="row text-center">
              <div className="col-md-4 mb-3">
                <div className="border rounded p-3">
                  <h4 className="text-success">{formatCurrency(totalAssets)}</h4>
                  <small className="text-muted">Total Assets</small>
                </div>
              </div>
              <div className="col-md-4 mb-3">
                <div className="border rounded p-3">
                  <h4 className="text-warning">{formatCurrency(totalLiabilities)}</h4>
                  <small className="text-muted">Total Liabilities</small>
                </div>
              </div>
              <div className="col-md-4 mb-3">
                <div className="border rounded p-3">
                  <h4 className="text-primary">{formatCurrency(totalEquity)}</h4>
                  <small className="text-muted">Total Equity</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRatiosView = () => (
    <div className="row">
      <div className="col-12">
        <div className="card">
          <div className="card-header">
            <h5 className="card-title mb-0">Financial Ratios Analysis</h5>
          </div>
          <div className="card-body">
            <div className="row text-center">
              <div className="col-md-3 mb-3">
                <div className="border rounded p-3">
                  <h4 className="text-primary">{(totalCurrentAssets / totalCurrentLiabilities).toFixed(2)}</h4>
                  <small className="text-muted">Current Ratio</small>
                  <div className="mt-1">
                    <span className="badge bg-success">Healthy</span>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="border rounded p-3">
                  <h4 className="text-info">{(totalLiabilities / totalAssets * 100).toFixed(1)}%</h4>
                  <small className="text-muted">Debt Ratio</small>
                  <div className="mt-1">
                    <span className="badge bg-warning">Moderate</span>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="border rounded p-3">
                  <h4 className="text-success">{(totalEquity / totalAssets * 100).toFixed(1)}%</h4>
                  <small className="text-muted">Equity Ratio</small>
                  <div className="mt-1">
                    <span className="badge bg-success">Strong</span>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="border rounded p-3">
                  <h4 className="text-warning">{(totalAssets / totalEquity).toFixed(2)}</h4>
                  <small className="text-muted">Financial Leverage</small>
                  <div className="mt-1">
                    <span className="badge bg-info">Optimal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Main render content based on viewMode
  const renderMainContent = () => {
    switch (viewMode) {
      case 'summary':
        return renderSummaryView();
      case 'ratios':
        return renderRatiosView();
      case 'detailed':
      default:
        return renderDetailedView();
    }
  };

  return (
    <div className="container-fluid py-3">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div>
              <h2 className="text-primary">
                <i className="fas fa-balance-scale me-2"></i>
                Statement of Financial Position
              </h2>
              <p className="text-muted mb-0">Balance Sheet - Comprehensive overview of financial position</p>
            </div>
            <div className="d-flex gap-2 mt-2 mt-md-0">
              <input 
                type="date" 
                className="form-control"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                style={{ width: '160px' }}
              />
              <select 
                className="form-select"
                value={comparisonPeriod}
                onChange={(e) => setComparisonPeriod(e.target.value)}
                style={{ width: '180px' }}
              >
                <option value="previous-month">vs Previous Month</option>
                <option value="previous-quarter">vs Previous Quarter</option>
                <option value="previous-year">vs Previous Year</option>
                <option value="budget">vs Budget</option>
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

      {/* Key Financial Metrics */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card border-success">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title text-muted">Total Assets</h6>
                  <h3 className="text-success">{formatCurrency(totalAssets)}</h3>
                  <small className={getChangeColor(assetsChange.amount)}>
                    <i className={`fas ${getChangeIcon(assetsChange.amount)} me-1`}></i>
                    {formatCurrency(Math.abs(assetsChange.amount))} ({Math.abs(assetsChange.percentage).toFixed(1)}%)
                  </small>
                </div>
                <div className="text-success">
                  <i className="fas fa-wallet fa-2x"></i>
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
                  <h6 className="card-title text-muted">Total Liabilities</h6>
                  <h3 className="text-warning">{formatCurrency(totalLiabilities)}</h3>
                  <small className={getChangeColor(liabilitiesChange.amount)}>
                    <i className={`fas ${getChangeIcon(liabilitiesChange.amount)} me-1`}></i>
                    {formatCurrency(Math.abs(liabilitiesChange.amount))} ({Math.abs(liabilitiesChange.percentage).toFixed(1)}%)
                  </small>
                </div>
                <div className="text-warning">
                  <i className="fas fa-scale-balanced fa-2x"></i>
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
                  <h6 className="card-title text-muted">Total Equity</h6>
                  <h3 className="text-primary">{formatCurrency(totalEquity)}</h3>
                  <small className={getChangeColor(equityChange.amount)}>
                    <i className={`fas ${getChangeIcon(equityChange.amount)} me-1`}></i>
                    {formatCurrency(Math.abs(equityChange.amount))} ({Math.abs(equityChange.percentage).toFixed(1)}%)
                  </small>
                </div>
                <div className="text-primary">
                  <i className="fas fa-chart-line fa-2x"></i>
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
                  <h6 className="card-title text-muted">Net Working Capital</h6>
                  <h3 className="text-info">{formatCurrency(totalCurrentAssets - totalCurrentLiabilities)}</h3>
                  <small className="text-muted">
                    Current Ratio: {(totalCurrentAssets / totalCurrentLiabilities).toFixed(2)}
                  </small>
                </div>
                <div className="text-info">
                  <i className="fas fa-exchange-alt fa-2x"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body py-2">
              <ul className="nav nav-pills">
                <li className="nav-item">
                  <button 
                    className={`nav-link ${viewMode === 'detailed' ? 'active' : ''}`}
                    onClick={() => setViewMode('detailed')}
                  >
                    <i className="fas fa-list me-1"></i>
                    Detailed View
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${viewMode === 'summary' ? 'active' : ''}`}
                    onClick={() => setViewMode('summary')}
                  >
                    <i className="fas fa-chart-bar me-1"></i>
                    Summary View
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${viewMode === 'ratios' ? 'active' : ''}`}
                    onClick={() => setViewMode('ratios')}
                  >
                    <i className="fas fa-calculator me-1"></i>
                    Financial Ratios
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {renderMainContent()}

      {/* Report Actions */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h6 className="card-title">Financial Report Actions</h6>
              <div className="d-flex flex-wrap gap-2">
                <button className="btn btn-outline-primary">
                  <i className="fas fa-file-pdf me-1"></i> Generate PDF Report
                </button>
                <button className="btn btn-outline-success">
                  <i className="fas fa-file-excel me-1"></i> Export to Excel
                </button>
                <button className="btn btn-outline-info">
                  <i className="fas fa-chart-line me-1"></i> Trend Analysis
                </button>
                <button className="btn btn-outline-warning">
                  <i className="fas fa-envelope me-1"></i> Email to Accountant
                </button>
                <button className="btn btn-outline-secondary">
                  <i className="fas fa-history me-1"></i> Compare Periods
                </button>
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
                This financial statement is prepared for internal management purposes
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialPosition;