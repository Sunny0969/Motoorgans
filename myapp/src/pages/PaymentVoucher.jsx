// src/pages/PaymentVoucher.js
import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const PaymentVoucher = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    voucherNo: '',
    date: new Date().toISOString().split('T')[0],
    payee: '',
    account: 'Accounts Payable',
    amount: '',
    paymentMethod: 'Cash',
    reference: '',
    description: '',
    status: 'Pending',
    approvedBy: '',
    preparedBy: ''
  });

  // Fetch payment vouchers on component mount
  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payment-vouchers');
      setVouchers(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch payment vouchers');
      console.error('Error fetching vouchers:', err);
    } finally {
      setLoading(false);
    }
  };

  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('All');

  // Filter vouchers
  const filteredVouchers = vouchers.filter(voucher =>
    (filterStatus === 'All' || voucher.status === filterStatus) &&
    (filterPaymentMethod === 'All' || voucher.paymentMethod === filterPaymentMethod) &&
    (voucher.payee.toLowerCase().includes(searchTerm.toLowerCase()) ||
     voucher.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
     voucher.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
     voucher.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const statusOptions = ['All', 'Pending', 'Approved', 'Paid', 'Rejected'];
  const paymentMethods = ['All', 'Cash', 'Check', 'Bank Transfer', 'Credit Card', 'Digital Payment'];
  const accounts = ['Accounts Payable', 'Utilities Expense', 'Rent Expense', 'Salary Expense', 'Office Supplies', 'Travel Expense', 'Other Expense'];

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
    return `PV-${year}-${String(nextNumber).padStart(3, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Auto-generate voucher number if not provided
      const voucherData = {
        ...formData,
        voucherNo: formData.voucherNo || generateVoucherNumber(),
        amount: parseFloat(formData.amount) || 0,
        date: formData.date || new Date().toISOString().split('T')[0]
      };

      if (editingId) {
        // Update existing voucher
        await api.put(`/payment-vouchers/${editingId}`, voucherData);
        setEditingId(null);
      } else {
        // Create new voucher
        await api.post('/payment-vouchers', voucherData);
      }

      // Refresh the vouchers list
      await fetchVouchers();

      // Reset form
      setFormData({
        voucherNo: '',
        date: new Date().toISOString().split('T')[0],
        payee: '',
        account: 'Accounts Payable',
        amount: '',
        paymentMethod: 'Cash',
        reference: '',
        description: '',
        status: 'Pending',
        approvedBy: '',
        preparedBy: ''
      });
    } catch (err) {
      setError('Failed to save payment voucher');
      console.error('Error saving voucher:', err);
    }
  };

  const handleEdit = (voucher) => {
    setFormData({
      voucherNo: voucher.voucherNo,
      date: voucher.date,
      payee: voucher.payee,
      account: voucher.account,
      amount: voucher.amount,
      paymentMethod: voucher.paymentMethod,
      reference: voucher.reference,
      description: voucher.description,
      status: voucher.status,
      approvedBy: voucher.approvedBy,
      preparedBy: voucher.preparedBy
    });
    setEditingId(voucher.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this payment voucher?')) {
      try {
        await api.delete(`/payment-vouchers/${id}`);
        // Refresh the vouchers list
        await fetchVouchers();
      } catch (err) {
        setError('Failed to delete payment voucher');
        console.error('Error deleting voucher:', err);
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      voucherNo: '',
      date: new Date().toISOString().split('T')[0],
      payee: '',
      account: 'Accounts Payable',
      amount: '',
      paymentMethod: 'Cash',
      reference: '',
      description: '',
      status: 'Pending',
      approvedBy: '',
      preparedBy: ''
    });
    setEditingId(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return '#28a745';
      case 'Approved': return '#17a2b8';
      case 'Pending': return '#ffc107';
      case 'Rejected': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getPaymentMethodColor = (method) => {
    switch (method) {
      case 'Bank Transfer': return '#007bff';
      case 'Cash': return '#28a745';
      case 'Check': return '#6f42c1';
      case 'Credit Card': return '#fd7e14';
      case 'Digital Payment': return '#20c997';
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
    const paidAmount = filteredVouchers
      .filter(v => v.status === 'Paid')
      .reduce((sum, voucher) => sum + voucher.amount, 0);
    const pendingAmount = filteredVouchers
      .filter(v => v.status === 'Pending')
      .reduce((sum, voucher) => sum + voucher.amount, 0);

    return { totalAmount, paidAmount, pendingAmount };
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
                Payment Vouchers
              </h1>
              <p style={{ 
                color: '#666', 
                margin: 0,
                fontSize: '14px'
              }}>
                Manage and track all outgoing payments
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
                  placeholder="Search vouchers..."
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
            <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '5px' }}>Total Amount</div>
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
            <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '5px' }}>Paid Amount</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>
              {formatCurrency(totals.paidAmount)}
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
            <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '5px' }}>Pending Amount</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffc107' }}>
              {formatCurrency(totals.pendingAmount)}
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
            <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '5px' }}>Total Vouchers</div>
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
              {editingId ? 'Edit Payment Voucher' : 'Create Payment Voucher'}
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
                  Payee *
                </label>
                <input
                  type="text"
                  name="payee"
                  value={formData.payee}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  placeholder="Payee name"
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
                  placeholder="Invoice/Reference number"
                />
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
                    Prepared By
                  </label>
                  <input
                    type="text"
                    name="preparedBy"
                    value={formData.preparedBy}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px'
                  }}
                    placeholder="Preparer name"
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
                    Approved By
                  </label>
                  <input
                    type="text"
                    name="approvedBy"
                    value={formData.approvedBy}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    placeholder="Approver name"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
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
                  {editingId ? 'Update' : 'Create Voucher'}
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
                Payment Vouchers
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
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>💰</div>
                <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>
                  {searchTerm ? 'No vouchers found' : 'No payment vouchers'}
                </h4>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  {searchTerm ? 'Try adjusting your search or filters' : 'Create your first payment voucher using the form'}
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
                        Voucher Details
                      </th>
                      <th style={{ 
                        padding: '12px', 
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#333',
                        borderBottom: '2px solid #dee2e6'
                      }}>
                        Payee & Account
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
                              {voucher.payee}
                            </div>
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#6c757d'
                            }}>
                              {voucher.account}
                            </div>
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
                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#dc3545' }}>
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
                          {voucher.preparedBy && (
                            <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px' }}>
                              Prep: {voucher.preparedBy}
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
            About Payment Vouchers
          </h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '15px',
            fontSize: '14px',
            color: '#666'
          }}>
            <div>
              <strong>Purpose:</strong> Document and authorize all outgoing payments 
              for proper financial control and audit trail.
            </div>
            <div>
              <strong>Workflow:</strong> Vouchers typically go through Pending → 
              Approved → Paid status workflow with proper authorization.
            </div>
            <div>
              <strong>Accounting:</strong> Each payment voucher creates accounting 
              entries for accurate financial reporting and reconciliation.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentVoucher;