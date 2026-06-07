// src/pages/ReceiptVoucher.js
import React, { useState } from 'react';

const ReceiptVoucher = () => {
  const [vouchers, setVouchers] = useState([
    { 
      id: 1, 
      voucherNo: 'RV-2024-001',
      date: '2024-01-15',
      receivedFrom: 'John Smith',
      account: 'Cash Sales',
      amount: 1500.00,
      paymentMethod: 'Cash',
      reference: 'INV-001',
      description: 'Payment for product sales',
      status: 'Received',
      receivedBy: 'Sarah Cashier',
      customerPhone: '+1-555-0101',
      customerEmail: 'john@email.com'
    },
    { 
      id: 2, 
      voucherNo: 'RV-2024-002',
      date: '2024-01-18',
      receivedFrom: 'ABC Corporation',
      account: 'Accounts Receivable',
      amount: 3500.00,
      paymentMethod: 'Bank Transfer',
      reference: 'INV-045',
      description: 'Payment for bulk order',
      status: 'Pending',
      receivedBy: 'Mike Manager',
      customerPhone: '+1-555-0102',
      customerEmail: 'accounts@abccorp.com'
    }
  ]);

  const [formData, setFormData] = useState({
    voucherNo: '',
    date: new Date().toISOString().split('T')[0],
    receivedFrom: '',
    account: 'Cash Sales',
    amount: '',
    paymentMethod: 'Cash',
    reference: '',
    description: '',
    status: 'Received',
    receivedBy: '',
    customerPhone: '',
    customerEmail: ''
  });

  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('All');

  // Filter vouchers
  const filteredVouchers = vouchers.filter(voucher =>
    (filterStatus === 'All' || voucher.status === filterStatus) &&
    (filterPaymentMethod === 'All' || voucher.paymentMethod === filterPaymentMethod) &&
    (voucher.receivedFrom.toLowerCase().includes(searchTerm.toLowerCase()) ||
     voucher.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
     voucher.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
     voucher.customerPhone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const statusOptions = ['All', 'Received', 'Pending', 'Reversed'];
  const paymentMethods = ['All', 'Cash', 'Check', 'Bank Transfer', 'Credit Card', 'Digital Payment', 'Mobile Payment'];
  const accounts = ['Cash Sales', 'Accounts Receivable', 'Advance Payment', 'Loan Receipt', 'Investment', 'Other Income'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateVoucherNumber = () => {
    const today = new Date();
    const year = today.getFullYear();
    const nextNumber = vouchers.length + 1;
    return `RV-${year}-${String(nextNumber).padStart(3, '0')}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Auto-generate voucher number if not provided
    const voucherData = {
      ...formData,
      voucherNo: formData.voucherNo || generateVoucherNumber(),
      amount: parseFloat(formData.amount) || 0,
      date: formData.date || new Date().toISOString().split('T')[0]
    };

    if (editingId) {
      setVouchers(vouchers.map(voucher => 
        voucher.id === editingId ? { ...voucherData, id: editingId } : voucher
      ));
      setEditingId(null);
    } else {
      const newVoucher = {
        id: Math.max(...vouchers.map(v => v.id)) + 1,
        ...voucherData
      };
      setVouchers([...vouchers, newVoucher]);
    }
    
    setFormData({
      voucherNo: '',
      date: new Date().toISOString().split('T')[0],
      receivedFrom: '',
      account: 'Cash Sales',
      amount: '',
      paymentMethod: 'Cash',
      reference: '',
      description: '',
      status: 'Received',
      receivedBy: '',
      customerPhone: '',
      customerEmail: ''
    });
  };

  const handleEdit = (voucher) => {
    setFormData({
      voucherNo: voucher.voucherNo,
      date: voucher.date,
      receivedFrom: voucher.receivedFrom,
      account: voucher.account,
      amount: voucher.amount,
      paymentMethod: voucher.paymentMethod,
      reference: voucher.reference,
      description: voucher.description,
      status: voucher.status,
      receivedBy: voucher.receivedBy,
      customerPhone: voucher.customerPhone,
      customerEmail: voucher.customerEmail
    });
    setEditingId(voucher.id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this receipt voucher?')) {
      setVouchers(vouchers.filter(voucher => voucher.id !== id));
    }
  };

  const handleCancel = () => {
    setFormData({
      voucherNo: '',
      date: new Date().toISOString().split('T')[0],
      receivedFrom: '',
      account: 'Cash Sales',
      amount: '',
      paymentMethod: 'Cash',
      reference: '',
      description: '',
      status: 'Received',
      receivedBy: '',
      customerPhone: '',
      customerEmail: ''
    });
    setEditingId(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Received': return '#28a745';
      case 'Pending': return '#ffc107';
      case 'Reversed': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getPaymentMethodColor = (method) => {
    switch (method) {
      case 'Cash': return '#28a745';
      case 'Bank Transfer': return '#007bff';
      case 'Credit Card': return '#fd7e14';
      case 'Check': return '#6f42c1';
      case 'Digital Payment': return '#20c997';
      case 'Mobile Payment': return '#e83e8c';
      default: return '#6c757d';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const calculateTotals = () => {
    const totalAmount = filteredVouchers.reduce((sum, voucher) => sum + voucher.amount, 0);
    const receivedAmount = filteredVouchers
      .filter(v => v.status === 'Received')
      .reduce((sum, voucher) => sum + voucher.amount, 0);
    const cashAmount = filteredVouchers
      .filter(v => v.paymentMethod === 'Cash')
      .reduce((sum, voucher) => sum + voucher.amount, 0);

    return { totalAmount, receivedAmount, cashAmount };
  };

  const totals = calculateTotals();

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f8f9fa', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header Section */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '5px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '20px',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '15px' 
          }}>
            <div>
              <h1 style={{ 
                color: '#333', 
                margin: '0 0 5px 0',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                Receipt Vouchers
              </h1>
              <p style={{ 
                color: '#666', 
                margin: 0,
                fontSize: '14px'
              }}>
                Manage and track all incoming payments and receipts
              </p>
            </div>
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              alignItems: 'center', 
              flexWrap: 'wrap' 
            }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search receipts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: '8px 12px 8px 35px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                    width: '200px',
                    backgroundColor: 'white'
                  }}
                />
                <span style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6c757d'
                }}>
                  🔍
                </span>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <select
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                {paymentMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px', 
          marginBottom: '20px' 
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '15px', 
            borderRadius: '5px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #dee2e6',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '5px' }}>Total Received</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
              {formatCurrency(totals.totalAmount)}
            </div>
          </div>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '15px', 
            borderRadius: '5px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #dee2e6',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '5px' }}>Confirmed Receipts</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>
              {formatCurrency(totals.receivedAmount)}
            </div>
          </div>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '15px', 
            borderRadius: '5px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #dee2e6',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '5px' }}>Cash Receipts</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>
              {formatCurrency(totals.cashAmount)}
            </div>
          </div>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '15px', 
            borderRadius: '5px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #dee2e6',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '5px' }}>Total Receipts</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>
              {filteredVouchers.length}
            </div>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 2fr', 
          gap: '20px',
          alignItems: 'start'
        }}>
          
          {/* Form Section */}
          <div style={{ 
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '5px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #dee2e6'
          }}>
            <h3 style={{ 
              color: '#333', 
              margin: '0 0 20px 0',
              fontSize: '18px',
              fontWeight: '600',
              paddingBottom: '10px',
              borderBottom: '2px solid #f0f0f0'
            }}>
              {editingId ? 'Edit Receipt Voucher' : 'Create Receipt Voucher'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '5px',
                  fontWeight: '600',
                  color: '#333',
                  fontSize: '14px'
                }}>
                  Voucher Number
                </label>
                <input
                  type="text"
                  name="voucherNo"
                  value={formData.voucherNo}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: formData.voucherNo ? 'white' : '#f8f9fa'
                  }}
                  placeholder="Auto-generated if empty"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px',
                    fontWeight: '600',
                    color: '#333',
                    fontSize: '14px'
                  }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px',
                    fontWeight: '600',
                    color: '#333',
                    fontSize: '14px'
                  }}>
                    Amount *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '5px',
                  fontWeight: '600',
                  color: '#333',
                  fontSize: '14px'
                }}>
                  Received From *
                </label>
                <input
                  type="text"
                  name="receivedFrom"
                  value={formData.receivedFrom}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  placeholder="Customer/Payer name"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px',
                    fontWeight: '600',
                    color: '#333',
                    fontSize: '14px'
                  }}>
                    Account *
                  </label>
                  <select
                    name="account"
                    value={formData.account}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: 'white'
                    }}
                  >
                    {accounts.map(account => (
                      <option key={account} value={account}>{account}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px',
                    fontWeight: '600',
                    color: '#333',
                    fontSize: '14px'
                  }}>
                    Payment Method *
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: 'white'
                    }}
                  >
                    {paymentMethods.filter(m => m !== 'All').map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '5px',
                  fontWeight: '600',
                  color: '#333',
                  fontSize: '14px'
                }}>
                  Reference Number
                </label>
                <input
                  type="text"
                  name="reference"
                  value={formData.reference}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  placeholder="Invoice/Receipt number"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px',
                    fontWeight: '600',
                    color: '#333',
                    fontSize: '14px'
                  }}>
                    Customer Phone
                  </label>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px',
                    fontWeight: '600',
                    color: '#333',
                    fontSize: '14px'
                  }}>
                    Customer Email
                  </label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    placeholder="Email address"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '5px',
                  fontWeight: '600',
                  color: '#333',
                  fontSize: '14px'
                }}>
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                  placeholder="Payment description or purpose"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px',
                    fontWeight: '600',
                    color: '#333',
                    fontSize: '14px'
                  }}>
                    Received By
                  </label>
                  <input
                    type="text"
                    name="receivedBy"
                    value={formData.receivedBy}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    placeholder="Cashier name"
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px',
                    fontWeight: '600',
                    color: '#333',
                    fontSize: '14px'
                  }}>
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: 'white'
                    }}
                  >
                    {statusOptions.filter(s => s !== 'All').map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: editingId ? '#ffc107' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    flex: '1'
                  }}
                >
                  {editingId ? 'Update' : 'Create Receipt'}
                </button>
                
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List Section */}
          <div style={{ 
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '5px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #dee2e6'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <h3 style={{ 
                color: '#333', 
                margin: 0,
                fontSize: '18px',
                fontWeight: '600'
              }}>
                Receipt Vouchers
              </h3>
              <div style={{
                backgroundColor: '#e9ecef',
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#495057'
              }}>
                {filteredVouchers.length} of {vouchers.length}
              </div>
            </div>

            {filteredVouchers.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px',
                color: '#6c757d'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>🧾</div>
                <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>
                  {searchTerm ? 'No receipts found' : 'No receipt vouchers'}
                </h4>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  {searchTerm ? 'Try adjusting your search or filters' : 'Create your first receipt voucher using the form'}
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{ 
                      backgroundColor: '#f8f9fa'
                    }}>
                      <th style={{ 
                        padding: '12px', 
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#333',
                        borderBottom: '2px solid #dee2e6'
                      }}>
                        Receipt Details
                      </th>
                      <th style={{ 
                        padding: '12px', 
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#333',
                        borderBottom: '2px solid #dee2e6'
                      }}>
                        Payer & Account
                      </th>
                      <th style={{ 
                        padding: '12px', 
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#333',
                        borderBottom: '2px solid #dee2e6'
                      }}>
                        Amount
                      </th>
                      <th style={{ 
                        padding: '12px', 
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#333',
                        borderBottom: '2px solid #dee2e6'
                      }}>
                        Payment Method
                      </th>
                      <th style={{ 
                        padding: '12px', 
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#333',
                        borderBottom: '2px solid #dee2e6'
                      }}>
                        Status
                      </th>
                      <th style={{ 
                        padding: '12px', 
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#333',
                        borderBottom: '2px solid #dee2e6',
                        width: '140px'
                      }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVouchers.map((voucher, index) => (
                      <tr 
                        key={voucher.id}
                        style={{ 
                          borderBottom: index === filteredVouchers.length - 1 ? 'none' : '1px solid #dee2e6'
                        }}
                      >
                        <td style={{ 
                          padding: '12px', 
                          color: '#333',
                          fontWeight: '500'
                        }}>
                          <div>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                              {voucher.voucherNo}
                            </div>
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#6c757d',
                              marginBottom: '2px'
                            }}>
                              {voucher.date}
                            </div>
                            {voucher.reference && (
                              <div style={{ 
                                fontSize: '12px', 
                                color: '#6c757d'
                              }}>
                                Ref: {voucher.reference}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                              {voucher.receivedFrom}
                            </div>
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#6c757d'
                            }}>
                              {voucher.account}
                            </div>
                            {voucher.customerPhone && (
                              <div style={{ 
                                fontSize: '11px', 
                                color: '#6c757d',
                                marginTop: '2px'
                              }}>
                                📞 {voucher.customerPhone}
                              </div>
                            )}
                            {voucher.description && (
                              <div style={{ 
                                fontSize: '12px', 
                                color: '#6c757d',
                                fontStyle: 'italic',
                                marginTop: '2px'
                              }}>
                                {voucher.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#28a745' }}>
                          {formatCurrency(voucher.amount)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: getPaymentMethodColor(voucher.paymentMethod) + '20',
                            color: getPaymentMethodColor(voucher.paymentMethod)
                          }}>
                            {voucher.paymentMethod}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: getStatusColor(voucher.status) + '20',
                            color: getStatusColor(voucher.status)
                          }}>
                            {voucher.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleEdit(voucher)}
                              style={{
                                padding: '6px 10px',
                                backgroundColor: '#17a2b8',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                              title="Edit"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(voucher.id)}
                              style={{
                                padding: '6px 10px',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                              title="Delete"
                            >
                              Delete
                            </button>
                          </div>
                          {voucher.receivedBy && (
                            <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px' }}>
                              By: {voucher.receivedBy}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div style={{ 
          backgroundColor: 'white',
          padding: '15px',
          borderRadius: '5px',
          marginTop: '20px',
          border: '1px solid #dee2e6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h4 style={{ 
            color: '#333', 
            margin: '0 0 10px 0',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            About Receipt Vouchers
          </h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '15px',
            fontSize: '14px',
            color: '#666'
          }}>
            <div>
              <strong>Purpose:</strong> Document and track all incoming payments 
              from customers, clients, and other sources for proper revenue tracking.
            </div>
            <div>
              <strong>POS Integration:</strong> Automatically generated from sales 
              transactions and can be manually created for other receipts.
            </div>
            <div>
              <strong>Accounting:</strong> Each receipt voucher creates proper 
              accounting entries for cash/bank and revenue accounts.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptVoucher;