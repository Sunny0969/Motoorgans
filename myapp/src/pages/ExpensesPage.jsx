import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const ExpensesPage = () => {
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    category: '',
    paymentMethod: '',
    status: 'all'
  });

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: '',
    amount: '',
    paymentMethod: '',
    vendor: '',
    taxAmount: '0',
    notes: ''
  });

  const [showAddForm, setShowAddForm] = useState(false);

  // Fetch expenses on component mount
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/expenses');
      if (response.data.success) {
        setExpenses(response.data.data);
      } else {
        setError('Failed to fetch expenses');
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError('Error fetching expenses');
    } finally {
      setLoading(false);
    }
  };

  // Filter expenses based on filters
  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date).toISOString().split('T')[0];
    return (
      (filters.dateFrom === '' || expenseDate >= filters.dateFrom) &&
      (filters.dateTo === '' || expenseDate <= filters.dateTo) &&
      (filters.category === '' || expense.category === filters.category) &&
      (filters.paymentMethod === '' || expense.paymentMethod === filters.paymentMethod) &&
      (filters.status === 'all' || expense.status === filters.status)
    );
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewExpense(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();

    if (!newExpense.description || !newExpense.amount || !newExpense.category) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const expenseData = {
        date: newExpense.date,
        description: newExpense.description,
        category: newExpense.category,
        amount: parseFloat(newExpense.amount),
        paymentMethod: newExpense.paymentMethod || 'Cash',
        vendor: newExpense.vendor || 'N/A',
        taxAmount: parseFloat(newExpense.taxAmount) || 0,
        notes: newExpense.notes || ''
      };

      const response = await api.post('/expenses', expenseData);
      if (response.data.success) {
        setExpenses(prev => [response.data.data, ...prev]);
        setNewExpense({
          date: new Date().toISOString().split('T')[0],
          description: '',
          category: '',
          amount: '',
          paymentMethod: '',
          vendor: '',
          taxAmount: '0',
          notes: ''
        });
        setShowAddForm(false);
        alert('Expense added successfully!');
      } else {
        alert('Failed to add expense');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Error adding expense');
    }
  };

  const handleApproveExpense = async (id) => {
    try {
      const response = await api.put(`/expenses/${id}/approve`);
      if (response.data.success) {
        setExpenses(prev => prev.map(expense =>
          expense.id === id
            ? { ...expense, status: 'approved', approvedBy: 'Current User' }
            : expense
        ));
        alert('Expense approved successfully!');
      } else {
        alert('Failed to approve expense');
      }
    } catch (error) {
      console.error('Error approving expense:', error);
      alert('Error approving expense');
    }
  };

  const handleRejectExpense = async (id) => {
    try {
      const response = await api.put(`/expenses/${id}/reject`);
      if (response.data.success) {
        setExpenses(prev => prev.map(expense =>
          expense.id === id
            ? { ...expense, status: 'rejected' }
            : expense
        ));
        alert('Expense rejected successfully!');
      } else {
        alert('Failed to reject expense');
      }
    } catch (error) {
      console.error('Error rejecting expense:', error);
      alert('Error rejecting expense');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        const response = await api.delete(`/expenses/${id}`);
        if (response.data.success) {
          setExpenses(prev => prev.filter(expense => expense.id !== id));
          alert('Expense deleted successfully!');
        } else {
          alert('Failed to delete expense');
        }
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Error deleting expense');
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    alert('Exporting expenses data...');
  };

  const handleRefresh = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      category: '',
      paymentMethod: '',
      status: 'all'
    });
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'approved':
        return { backgroundColor: '#10b981', color: 'white' };
      case 'pending':
        return { backgroundColor: '#f59e0b', color: 'white' };
      case 'rejected':
        return { backgroundColor: '#ef4444', color: 'white' };
      default:
        return { backgroundColor: '#6b7280', color: 'white' };
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Calculate totals
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.totalAmount, 0);
  const approvedExpenses = filteredExpenses
    .filter(expense => expense.status === 'approved')
    .reduce((sum, expense) => sum + expense.totalAmount, 0);
  const pendingExpenses = filteredExpenses
    .filter(expense => expense.status === 'pending')
    .reduce((sum, expense) => sum + expense.totalAmount, 0);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>Expense Management</h1>
            <p style={styles.subtitle}>Manage and track all business expenses</p>
          </div>
        </div>
      </div>

      <div style={styles.mainContent}>
        {/* Summary Cards */}
        <div style={styles.summarySection}>
          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Total Expenses</div>
            <div style={styles.summaryValue}>PKR {formatCurrency(totalExpenses)}</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Approved Expenses</div>
            <div style={{...styles.summaryValue, color: '#10b981'}}>
              PKR {formatCurrency(approvedExpenses)}
            </div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Pending Approval</div>
            <div style={{...styles.summaryValue, color: '#f59e0b'}}>
              PKR {formatCurrency(pendingExpenses)}
            </div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Total Transactions</div>
            <div style={styles.summaryValue}>{filteredExpenses.length}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={styles.actionBar}>
          <button 
            style={{...styles.button, ...styles.primaryButton}}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            ➕ Add New Expense
          </button>
          <button style={{...styles.button, ...styles.secondaryButton}} onClick={handlePrint}>
            🖨️ Print Report
          </button>
          <button style={{...styles.button, ...styles.successButton}} onClick={handleExport}>
            📊 Export Data
          </button>
          <button style={{...styles.button, ...styles.warningButton}} onClick={handleRefresh}>
            🔄 Refresh
          </button>
        </div>

        {/* Add Expense Form */}
        {showAddForm && (
          <div style={styles.addForm}>
            <h3 style={styles.formTitle}>Add New Expense</h3>
            <form onSubmit={handleAddExpense}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={newExpense.date}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Description *</label>
                  <input
                    type="text"
                    name="description"
                    value={newExpense.description}
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder="Enter expense description"
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Category *</label>
                  <select
                    name="category"
                    value={newExpense.category}
                    onChange={handleInputChange}
                    style={styles.select}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Rent">Rent</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Salaries">Salaries</option>
                    <option value="Supplies">Supplies</option>
                    <option value="Inventory">Inventory</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Amount (PKR) *</label>
                  <input
                    type="number"
                    name="amount"
                    value={newExpense.amount}
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Payment Method</label>
                  <select
                    name="paymentMethod"
                    value={newExpense.paymentMethod}
                    onChange={handleInputChange}
                    style={styles.select}
                  >
                    <option value="">Select Method</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Digital Wallet">Digital Wallet</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Vendor</label>
                  <input
                    type="text"
                    name="vendor"
                    value={newExpense.vendor}
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder="Vendor name"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Tax Amount (PKR)</label>
                  <input
                    type="number"
                    name="taxAmount"
                    value={newExpense.taxAmount}
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Notes</label>
                <textarea
                  name="notes"
                  value={newExpense.notes}
                  onChange={handleInputChange}
                  style={{...styles.input, minHeight: '80px', resize: 'vertical'}}
                  placeholder="Additional notes..."
                />
              </div>
              <div style={styles.formActions}>
                <button 
                  type="button"
                  style={{...styles.button, ...styles.secondaryButton}}
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{...styles.button, ...styles.primaryButton}}
                >
                  ✅ Save Expense
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div style={styles.filterSection}>
          <h3 style={{margin: '0 0 16px 0', color: '#374151'}}>Filters</h3>
          <div style={styles.filterGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Date From</label>
              <input
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Date To</label>
              <input
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleFilterChange}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Category</label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                style={styles.select}
              >
                <option value="">All Categories</option>
                <option value="Rent">Rent</option>
                <option value="Utilities">Utilities</option>
                <option value="Salaries">Salaries</option>
                <option value="Supplies">Supplies</option>
                <option value="Inventory">Inventory</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Payment Method</label>
              <select
                name="paymentMethod"
                value={filters.paymentMethod}
                onChange={handleFilterChange}
                style={styles.select}
              >
                <option value="">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                style={styles.select}
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        <div style={styles.tableContainer}>
          <div style={styles.tableHeader}>
            <h3 style={{margin: 0, color: '#374151'}}>Expenses List</h3>
            <span style={{color: '#6b7280', fontSize: '14px'}}>
              Showing {filteredExpenses.length} expenses
            </span>
          </div>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Expense ID</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Description</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Tax</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Payment Method</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{...styles.td, textAlign: 'center', color: '#6b7280'}}>
                      No expenses found matching your filters
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td style={styles.td}>{expense.expenseId}</td>
                      <td style={styles.td}>{expense.date}</td>
                      <td style={styles.td}>{expense.description}</td>
                      <td style={styles.td}>{expense.category}</td>
                      <td style={styles.td}>PKR {formatCurrency(expense.amount)}</td>
                      <td style={styles.td}>PKR {formatCurrency(expense.taxAmount)}</td>
                      <td style={{...styles.td, fontWeight: '600', color: '#1e293b'}}>
                        PKR {formatCurrency(expense.totalAmount)}
                      </td>
                      <td style={styles.td}>{expense.paymentMethod}</td>
                      <td style={styles.td}>
                        <span style={{...styles.statusBadge, ...getStatusStyle(expense.status)}}>
                          {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionButtons}>
                          {expense.status === 'pending' && (
                            <>
                              <button 
                                style={{...styles.smallButton, backgroundColor: '#10b981', color: 'white'}}
                                onClick={() => handleApproveExpense(expense.id)}
                              >
                                Approve
                              </button>
                              <button 
                                style={{...styles.smallButton, backgroundColor: '#ef4444', color: 'white'}}
                                onClick={() => handleRejectExpense(expense.id)}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button 
                            style={{...styles.smallButton, backgroundColor: '#6b7280', color: 'white'}}
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            Delete
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
      </div>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    padding: '0',
    margin: '0'
  },
  header: {
    backgroundColor: 'white',
    padding: '24px',
    borderBottom: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: 0
  },
  subtitle: {
    fontSize: '16px',
    color: '#64748b',
    margin: '4px 0 0 0'
  },
  mainContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px'
  },
  actionBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    flexWrap: 'wrap'
  },
  button: {
    padding: '12px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    minWidth: '140px',
    justifyContent: 'center'
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    color: 'white'
  },
  secondaryButton: {
    backgroundColor: '#6b7280',
    color: 'white'
  },
  successButton: {
    backgroundColor: '#10b981',
    color: 'white'
  },
  warningButton: {
    backgroundColor: '#f59e0b',
    color: 'white'
  },
  filterSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '24px'
  },
  filterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    alignItems: 'end'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151'
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
    boxSizing: 'border-box'
  },
  select: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
    boxSizing: 'border-box'
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    marginBottom: '24px'
  },
  tableHeader: {
    padding: '20px 20px 0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  tableWrapper: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
    minWidth: '1000px'
  },
  th: {
    backgroundColor: '#f8fafc',
    padding: '16px 12px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '1px solid #e2e8f0',
    whiteSpace: 'nowrap'
  },
  td: {
    padding: '16px 12px',
    borderBottom: '1px solid #e2e8f0',
    color: '#4b5563',
    whiteSpace: 'nowrap'
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block'
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  smallButton: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    whiteSpace: 'nowrap'
  },
  summarySection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '24px'
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  summaryValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '12px 0',
    color: '#1e293b'
  },
  summaryLabel: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '600'
  },
  addForm: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    marginBottom: '24px'
  },
  formTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: '20px'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    marginBottom: '20px'
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end'
  }
};

export default ExpensesPage;