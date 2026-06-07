import React, { useState } from 'react';

const AccountsPage = () => {
  const [activeTab, setActiveTab] = useState('receivable');

  // Sample data for accounts receivable
  const [receivables, setReceivables] = useState([
    { id: 1, customer: 'John Doe', invoice: 'INV-001', amount: 1500.00, dueDate: '2024-01-15', status: 'Pending' },
    { id: 2, customer: 'Sarah Smith', invoice: 'INV-002', amount: 2500.50, dueDate: '2024-01-20', status: 'Paid' },
    { id: 3, customer: 'Mike Johnson', invoice: 'INV-003', amount: 3200.75, dueDate: '2024-01-25', status: 'Overdue' },
    { id: 4, customer: 'Emily Brown', invoice: 'INV-004', amount: 1800.25, dueDate: '2024-02-01', status: 'Pending' },
  ]);

  // Sample data for accounts payable
  const [payables, setPayables] = useState([
    { id: 1, vendor: 'Tech Supplies Inc.', invoice: 'VIN-001', amount: 4500.00, dueDate: '2024-01-18', status: 'Pending' },
    { id: 2, vendor: 'Office Mart', invoice: 'VIN-002', amount: 1200.30, dueDate: '2024-01-22', status: 'Paid' },
    { id: 3, vendor: 'Software Solutions', invoice: 'VIN-003', amount: 8900.00, dueDate: '2024-01-28', status: 'Pending' },
    { id: 4, vendor: 'Utilities Corp', invoice: 'VIN-004', amount: 650.75, dueDate: '2024-02-05', status: 'Overdue' },
  ]);

  // Summary calculations
  const receivableSummary = {
    total: receivables.reduce((sum, item) => sum + item.amount, 0),
    pending: receivables.filter(item => item.status === 'Pending').reduce((sum, item) => sum + item.amount, 0),
    overdue: receivables.filter(item => item.status === 'Overdue').reduce((sum, item) => sum + item.amount, 0),
  };

  const payableSummary = {
    total: payables.reduce((sum, item) => sum + item.amount, 0),
    pending: payables.filter(item => item.status === 'Pending').reduce((sum, item) => sum + item.amount, 0),
    overdue: payables.filter(item => item.status === 'Overdue').reduce((sum, item) => sum + item.amount, 0),
  };

  const getStatusBadge = (status) => {
    const styles = {
      Paid: 'success',
      Pending: 'warning',
      Overdue: 'danger'
    };
    return `badge bg-${styles[status]}`;
  };

  return (
    <div className="container-fluid py-3">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="text-primary">
              <i className="fas fa-file-invoice-dollar me-2"></i>
              Accounts Management
            </h2>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-primary">
                <i className="fas fa-plus me-1"></i> New Invoice
              </button>
              <button className="btn btn-outline-secondary">
                <i className="fas fa-download me-1"></i> Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-6 mb-3">
          <div className="card border-primary">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title text-muted">Accounts Receivable</h6>
                  <h3 className="text-primary">${receivableSummary.total.toFixed(2)}</h3>
                </div>
                <div className="text-end">
                  <small className="text-muted d-block">Pending: ${receivableSummary.pending.toFixed(2)}</small>
                  <small className="text-danger d-block">Overdue: ${receivableSummary.overdue.toFixed(2)}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-3">
          <div className="card border-warning">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title text-muted">Accounts Payable</h6>
                  <h3 className="text-warning">${payableSummary.total.toFixed(2)}</h3>
                </div>
                <div className="text-end">
                  <small className="text-muted d-block">Pending: ${payableSummary.pending.toFixed(2)}</small>
                  <small className="text-danger d-block">Overdue: ${payableSummary.overdue.toFixed(2)}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="row">
        <div className="col-12">
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'receivable' ? 'active' : ''}`}
                onClick={() => setActiveTab('receivable')}
              >
                <i className="fas fa-money-bill-wave me-1"></i>
                Receivables
                <span className="badge bg-primary ms-1">{receivables.length}</span>
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'payable' ? 'active' : ''}`}
                onClick={() => setActiveTab('payable')}
              >
                <i className="fas fa-credit-card me-1"></i>
                Payables
                <span className="badge bg-warning ms-1">{payables.length}</span>
              </button>
            </li>
          </ul>

          {/* Receivables Table */}
          {activeTab === 'receivable' && (
            <div className="card">
              <div className="card-header bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Outstanding Invoices</h5>
                  <div className="d-flex gap-2">
                    <input 
                      type="text" 
                      className="form-control form-control-sm" 
                      placeholder="Search invoices..."
                      style={{ maxWidth: '200px' }}
                    />
                    <select className="form-select form-select-sm" style={{ maxWidth: '150px' }}>
                      <option>All Status</option>
                      <option>Pending</option>
                      <option>Paid</option>
                      <option>Overdue</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Invoice #</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receivables.map((item) => (
                        <tr key={item.id}>
                          <td className="fw-bold">{item.invoice}</td>
                          <td>{item.customer}</td>
                          <td>${item.amount.toFixed(2)}</td>
                          <td>{item.dueDate}</td>
                          <td>
                            <span className={getStatusBadge(item.status)}>
                              {item.status}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button className="btn btn-outline-primary">
                                <i className="fas fa-eye"></i>
                              </button>
                              <button className="btn btn-outline-success">
                                <i className="fas fa-check"></i>
                              </button>
                              <button className="btn btn-outline-danger">
                                <i className="fas fa-times"></i>
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
          )}

          {/* Payables Table */}
          {activeTab === 'payable' && (
            <div className="card">
              <div className="card-header bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Vendor Invoices</h5>
                  <div className="d-flex gap-2">
                    <input 
                      type="text" 
                      className="form-control form-control-sm" 
                      placeholder="Search vendors..."
                      style={{ maxWidth: '200px' }}
                    />
                    <select className="form-select form-select-sm" style={{ maxWidth: '150px' }}>
                      <option>All Status</option>
                      <option>Pending</option>
                      <option>Paid</option>
                      <option>Overdue</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Invoice #</th>
                        <th>Vendor</th>
                        <th>Amount</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payables.map((item) => (
                        <tr key={item.id}>
                          <td className="fw-bold">{item.invoice}</td>
                          <td>{item.vendor}</td>
                          <td>${item.amount.toFixed(2)}</td>
                          <td>{item.dueDate}</td>
                          <td>
                            <span className={getStatusBadge(item.status)}>
                              {item.status}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button className="btn btn-outline-primary">
                                <i className="fas fa-eye"></i>
                              </button>
                              <button className="btn btn-outline-success">
                                <i className="fas fa-check"></i>
                              </button>
                              <button className="btn btn-outline-danger">
                                <i className="fas fa-times"></i>
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
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h6 className="card-title">Quick Actions</h6>
              <div className="d-flex flex-wrap gap-2">
                <button className="btn btn-success btn-sm">
                  <i className="fas fa-plus me-1"></i> Create Invoice
                </button>
                <button className="btn btn-primary btn-sm">
                  <i className="fas fa-file-import me-1"></i> Import Transactions
                </button>
                <button className="btn btn-info btn-sm">
                  <i className="fas fa-chart-bar me-1"></i> Generate Report
                </button>
                <button className="btn btn-warning btn-sm">
                  <i className="fas fa-bell me-1"></i> Set Reminders
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountsPage;