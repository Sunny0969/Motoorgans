// src/pages/ClassTransactionLevels.js
import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const ClassTransactionLevels = () => {
  const [transactionClasses, setTransactionClasses] = useState([
    { 
      id: 1, 
      className: 'Revenue Transactions', 
      code: 'REV', 
      description: 'All income and revenue related transactions',
      category: 'Income',
      status: 'Active'
    },
    { 
      id: 2, 
      className: 'Expense Transactions', 
      code: 'EXP', 
      description: 'All business expenses and costs',
      category: 'Expense', 
      status: 'Active'
    },
    { 
      id: 3, 
      className: 'Asset Transactions', 
      code: 'AST', 
      description: 'Purchase and disposal of company assets',
      category: 'Balance Sheet',
      status: 'Active'
    }
  ]);

  const [formData, setFormData] = useState({
    className: '',
    code: '',
    description: '',
    category: 'Income',
    status: 'Active'
  });

  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Filter transaction classes
  const filteredClasses = transactionClasses.filter(cls =>
    (filterCategory === 'All' || cls.category === filterCategory) &&
    (cls.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
     cls.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
     cls.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const categories = ['All', 'Income', 'Expense', 'Balance Sheet', 'Other'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingId) {
      setTransactionClasses(transactionClasses.map(cls => 
        cls.id === editingId ? { ...cls, ...formData } : cls
      ));
      setEditingId(null);
    } else {
      const newClass = {
        id: Math.max(...transactionClasses.map(c => c.id)) + 1,
        ...formData
      };
      setTransactionClasses([...transactionClasses, newClass]);
    }
    
    setFormData({
      className: '',
      code: '',
      description: '',
      category: 'Income',
      status: 'Active'
    });
  };

  const handleEdit = (cls) => {
    setFormData({
      className: cls.className,
      code: cls.code,
      description: cls.description,
      category: cls.category,
      status: cls.status
    });
    setEditingId(cls.id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this transaction class?')) {
      setTransactionClasses(transactionClasses.filter(cls => cls.id !== id));
    }
  };

  const handleCancel = () => {
    setFormData({
      className: '',
      code: '',
      description: '',
      category: 'Income',
      status: 'Active'
    });
    setEditingId(null);
  };

  const getStatusColor = (status) => {
    return status === 'Active' ? '#28a745' : '#dc3545';
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Income': return '#28a745';
      case 'Expense': return '#dc3545';
      case 'Balance Sheet': return '#007bff';
      default: return '#6c757d';
    }
  };

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
                Class of Transaction Levels
              </h1>
              <p style={{ 
                color: '#666', 
                margin: 0,
                fontSize: '14px'
              }}>
                Manage transaction classification for financial reporting
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
                  placeholder="Search classes..."
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
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
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
              {editingId ? 'Edit Transaction Class' : 'Add New Transaction Class'}
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
                  Class Name *
                </label>
                <input
                  type="text"
                  name="className"
                  value={formData.className}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  placeholder="Enter class name"
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
                  Code *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  placeholder="Enter code"
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
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
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
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                  <option value="Balance Sheet">Balance Sheet</option>
                  <option value="Other">Other</option>
                </select>
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
                  placeholder="Enter description"
                />
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
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
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
                  {editingId ? 'Update' : 'Add'}
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
                Transaction Classes
              </h3>
              <div style={{
                backgroundColor: '#e9ecef',
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#495057'
              }}>
                {filteredClasses.length} of {transactionClasses.length}
              </div>
            </div>

            {filteredClasses.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px',
                color: '#6c757d'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>📊</div>
                <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>
                  {searchTerm || filterCategory !== 'All' ? 'No classes found' : 'No transaction classes'}
                </h4>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  {searchTerm || filterCategory !== 'All' ? 'Try adjusting your search or filters' : 'Add your first transaction class using the form'}
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
                        Class Name
                      </th>
                      <th style={{ 
                        padding: '12px', 
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#333',
                        borderBottom: '2px solid #dee2e6'
                      }}>
                        Code
                      </th>
                      <th style={{ 
                        padding: '12px', 
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#333',
                        borderBottom: '2px solid #dee2e6'
                      }}>
                        Category
                      </th>
                      <th style={{ 
                        padding: '12px', 
                        textAlign: 'left',
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
                        width: '100px'
                      }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClasses.map((cls, index) => (
                      <tr 
                        key={cls.id}
                        style={{ 
                          borderBottom: index === filteredClasses.length - 1 ? 'none' : '1px solid #dee2e6'
                        }}
                      >
                        <td style={{ 
                          padding: '12px', 
                          color: '#333',
                          fontWeight: '500'
                        }}>
                          <div>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                              {cls.className}
                            </div>
                            {cls.description && (
                              <div style={{ 
                                fontSize: '12px', 
                                color: '#6c757d',
                                lineHeight: '1.3'
                              }}>
                                {cls.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ 
                            backgroundColor: '#e9ecef',
                            color: '#495057',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            fontFamily: 'monospace'
                          }}>
                            {cls.code}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: getCategoryColor(cls.category) + '20',
                            color: getCategoryColor(cls.category)
                          }}>
                            {cls.category}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: getStatusColor(cls.status) + '20',
                            color: getStatusColor(cls.status)
                          }}>
                            {cls.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleEdit(cls)}
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
                              onClick={() => handleDelete(cls.id)}
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
            About Transaction Classes
          </h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '15px',
            fontSize: '14px',
            color: '#666'
          }}>
            <div>
              <strong>Purpose:</strong> Transaction classes help categorize financial activities 
              for accurate reporting and analysis.
            </div>
            <div>
              <strong>Categories:</strong> Common types include Income, Expense, Assets, 
              Liabilities, and Equity transactions.
            </div>
            <div>
              <strong>Usage:</strong> Each transaction in your system should be assigned 
              to an appropriate class for proper financial tracking.
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          div > div {
            grid-template-columns: 1fr !important;
          }
          
          .header-actions {
            flex-direction: column;
            align-items: stretch;
          }
          
          .header-actions > div {
            width: 100%;
          }
          
          input[type="text"] {
            width: 100% !important;
          }
        }
        
        @media (max-width: 480px) {
          .table-container {
            font-size: 12px;
          }
          
          th, td {
            padding: 8px 6px !important;
          }
          
          button {
            padding: 4px 8px !important;
            font-size: 11px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ClassTransactionLevels;