// src/pages/FinancialStatementLevels.js
import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const FinancialStatementLevels = () => {
  const [levels, setLevels] = useState([]);

  const [formData, setFormData] = useState({
    levelName: '',
    code: '',
    description: '',
    status: 'Active'
  });

  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch levels from API
  const fetchLevels = async () => {
    try {
      setLoading(true);
      const response = await api.get('/financial-statement-levels');
      setLevels(response.data.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch financial statement levels');
      console.error('Error fetching levels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLevels();
  }, []);

  // Filter levels based on search
  const filteredLevels = levels.filter(level =>
    level.levelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    level.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    level.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingId) {
        // Update existing level
        await api.put(`/financial-statement-levels/${editingId}`, formData);
        setEditingId(null);
      } else {
        // Add new level
        await api.post('/financial-statement-levels', formData);
      }

      // Reset form
      setFormData({
        levelName: '',
        code: '',
        description: '',
        status: 'Active'
      });

      // Refresh levels
      await fetchLevels();
    } catch (err) {
      setError(editingId ? 'Failed to update level' : 'Failed to create level');
      console.error('Error saving level:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (level) => {
    setFormData({
      levelName: level.levelName,
      code: level.code,
      description: level.description,
      status: level.status
    });
    setEditingId(level._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this level?')) {
      try {
        setLoading(true);
        await api.delete(`/financial-statement-levels/${id}`);
        await fetchLevels();
      } catch (err) {
        setError('Failed to delete level');
        console.error('Error deleting level:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      levelName: '',
      code: '',
      description: '',
      status: 'Active'
    });
    setEditingId(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return '#28a745';
      case 'Inactive': return '#dc3545';
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
          padding: '25px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          marginBottom: '25px',
          borderLeft: '4px solid #4a4a4a'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <h1 style={{
                color: '#333',
                margin: '0 0 8px 0',
                fontSize: '28px',
                fontWeight: '600'
              }}>
                📊 Financial Statement Levels
              </h1>
              <p style={{
                color: '#666',
                margin: 0,
                fontSize: '15px'
              }}>
                Manage hierarchical levels for financial reporting and account classification
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search levels..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: '10px 15px 10px 35px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    width: '250px',
                    backgroundColor: '#fafafa'
                  }}
                />
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#999'
                }}>
                  🔍
                </span>
              </div>
              <div style={{
                backgroundColor: '#e9ecef',
                padding: '8px 15px',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#495057',
                fontWeight: '500'
              }}>
                Total: {levels.length} levels
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '15px',
            borderRadius: '6px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap' }}>

          {/* Form Section */}
          <div style={{
            flex: '1',
            minWidth: '350px',
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            height: 'fit-content'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '25px',
              paddingBottom: '15px',
              borderBottom: '2px solid #f0f0f0'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: editingId ? '#ffc107' : '#28a745',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                marginRight: '12px'
              }}>
                {editingId ? '✏️' : '➕'}
              </div>
              <h3 style={{
                color: '#333',
                margin: 0,
                fontSize: '20px',
                fontWeight: '600'
              }}>
                {editingId ? 'Edit Level' : 'Create New Level'}
              </h3>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#444',
                  fontSize: '14px'
                }}>
                  Level Name *
                </label>
                <input
                  type="text"
                  name="levelName"
                  value={formData.levelName}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                    backgroundColor: '#fafafa'
                  }}
                  placeholder="e.g., Level 1 - Main Categories"
                  onFocus={(e) => e.target.style.borderColor = '#4a4a4a'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#444',
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
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                    backgroundColor: '#fafafa'
                  }}
                  placeholder="e.g., L1, L2, etc."
                  onFocus={(e) => e.target.style.borderColor = '#4a4a4a'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#444',
                  fontSize: '14px'
                }}>
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    transition: 'border-color 0.2s',
                    backgroundColor: '#fafafa',
                    fontFamily: 'Arial, sans-serif'
                  }}
                  placeholder="Describe the purpose of this level..."
                  onFocus={(e) => e.target.style.borderColor = '#4a4a4a'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                />
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#444',
                  fontSize: '14px'
                }}>
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    backgroundColor: '#fafafa',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '12px 25px',
                    backgroundColor: editingId ? '#ffc107' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    transition: 'background-color 0.2s',
                    flex: '1',
                    minWidth: '120px'
                  }}
                  onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = editingId ? '#e0a800' : '#218838')}
                  onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = editingId ? '#ffc107' : '#28a745')}
                >
                  {loading ? 'Saving...' : (editingId ? 'Update Level' : 'Create Level')}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={loading}
                    style={{
                      padding: '12px 25px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      transition: 'background-color 0.2s',
                      flex: '1',
                      minWidth: '120px'
                    }}
                    onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#545b62')}
                    onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#6c757d')}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List Section */}
          <div style={{
            flex: '2',
            minWidth: '600px',
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '25px',
              paddingBottom: '15px',
              borderBottom: '2px solid #f0f0f0'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#4a4a4a',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                marginRight: '12px'
              }}>
                📋
              </div>
              <h3 style={{
                color: '#333',
                margin: 0,
                fontSize: '20px',
                fontWeight: '600'
              }}>
                Defined Levels
                <span style={{
                  marginLeft: '12px',
                  fontSize: '14px',
                  fontWeight: 'normal',
                  color: '#6c757d'
                }}>
                  ({filteredLevels.length} of {levels.length})
                </span>
              </h3>
            </div>

            {loading && levels.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#6c757d'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>⏳</div>
                <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>Loading levels...</h4>
                <p style={{ margin: 0, fontSize: '14px' }}>Please wait while we fetch the data.</p>
              </div>
            ) : filteredLevels.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#6c757d'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>📊</div>
                <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>No levels found</h4>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  {searchTerm ? 'Try adjusting your search terms' : 'Create your first financial statement level'}
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{
                      backgroundColor: '#4a4a4a',
                      color: 'white'
                    }}>
                      <th style={{
                        padding: '15px',
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '13px'
                      }}>
                        LEVEL NAME
                      </th>
                      <th style={{
                        padding: '15px',
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '13px'
                      }}>
                        CODE
                      </th>
                      <th style={{
                        padding: '15px',
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '13px'
                      }}>
                        DESCRIPTION
                      </th>
                      <th style={{
                        padding: '15px',
                        textAlign: 'center',
                        fontWeight: '600',
                        fontSize: '13px'
                      }}>
                        STATUS
                      </th>
                      <th style={{
                        padding: '15px',
                        textAlign: 'center',
                        fontWeight: '600',
                        fontSize: '13px',
                        width: '140px'
                      }}>
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLevels.map((level, index) => (
                      <tr
                        key={level._id}
                        style={{
                          borderBottom: index === filteredLevels.length - 1 ? 'none' : '1px solid #e9ecef',
                          transition: 'background-color 0.2s',
                          backgroundColor: 'white'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        <td style={{
                          padding: '15px',
                          color: '#333',
                          fontWeight: '500'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '8px',
                              height: '8px',
                              backgroundColor: '#4a4a4a',
                              borderRadius: '50%'
                            }}></div>
                            {level.levelName}
                          </div>
                        </td>
                        <td style={{ padding: '15px' }}>
                          <span style={{
                            backgroundColor: '#e9ecef',
                            color: '#495057',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            border: '1px solid #dee2e6'
                          }}>
                            {level.code}
                          </span>
                        </td>
                        <td style={{
                          padding: '15px',
                          color: '#6c757d',
                          maxWidth: '200px'
                        }}>
                          {level.description}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: getStatusColor(level.status) + '20',
                            color: getStatusColor(level.status),
                            border: `1px solid ${getStatusColor(level.status)}`
                          }}>
                            {level.status}
                          </span>
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleEdit(level)}
                              disabled={loading}
                              style={{
                                padding: '8px 12px',
                                backgroundColor: '#ffc107',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontWeight: '500',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#e0a800')}
                              onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#ffc107')}
                              title="Edit level"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDelete(level._id)}
                              disabled={loading}
                              style={{
                                padding: '8px 12px',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontWeight: '500',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#c82333')}
                              onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#dc3545')}
                              title="Delete level"
                            >
                              🗑️ Delete
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

        {/* Quick Stats & Info */}
        <div style={{
          display: 'flex',
          gap: '20px',
          marginTop: '25px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            flex: '1',
            minWidth: '200px',
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            borderLeft: '4px solid #4a4a4a'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>💡</div>
            <h4 style={{
              color: '#333',
              margin: '0 0 10px 0',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              About Levels
            </h4>
            <p style={{
              color: '#666',
              margin: 0,
              fontSize: '13px',
              lineHeight: '1.5'
            }}>
              Financial statement levels create a hierarchical structure for organized reporting. 
              Start with broad categories (Level 1) and drill down to detailed accounts (Level 4).
            </p>
          </div>

          <div style={{
            flex: '1',
            minWidth: '200px',
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            borderLeft: '4px solid #28a745'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚡</div>
            <h4 style={{
              color: '#333',
              margin: '0 0 10px 0',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              Best Practices
            </h4>
            <p style={{
              color: '#666',
              margin: 0,
              fontSize: '13px',
              lineHeight: '1.5'
            }}>
              Use consistent naming conventions. Keep level codes short and meaningful. 
              Maintain 4-6 levels for optimal organization without overcomplication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialStatementLevels;
