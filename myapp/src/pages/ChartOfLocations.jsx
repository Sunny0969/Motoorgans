// src/pages/ChartOfLocations.js
import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const ChartOfLocations = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch locations on component mount
  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/locations');
      setLocations(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch locations');
      console.error('Error fetching locations:', err);
    } finally {
      setLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    locationName: '',
    code: '',
    address: '',
    contactPerson: '',
    phone: '',
    email: '',
    status: 'Active'
  });

  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Filter locations
  const filteredLocations = locations.filter(location =>
    (filterStatus === 'All' || location.status === filterStatus) &&
    (location.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     location.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
     location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
     location.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const statusOptions = ['All', 'Active', 'Inactive'];

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
      if (editingId) {
        // Update existing location
        const response = await api.put(`/locations/${editingId}`, formData);
        setLocations(locations.map(location =>
          location._id === editingId ? response.data : location
        ));
        setEditingId(null);
      } else {
        // Create new location
        const response = await api.post('/locations', formData);
        setLocations([...locations, response.data]);
      }

      setFormData({
        locationName: '',
        code: '',
        address: '',
        contactPerson: '',
        phone: '',
        email: '',
        status: 'Active'
      });
    } catch (error) {
      console.error('Error saving location:', error);
      alert(error.response?.data?.message || 'Failed to save location');
    }
  };

  const handleEdit = (location) => {
    setFormData({
      locationName: location.locationName,
      code: location.code,
      address: location.address,
      contactPerson: location.contactPerson,
      phone: location.phone,
      email: location.email,
      status: location.status
    });
    setEditingId(location._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        await api.delete(`/locations/${id}`);
        setLocations(locations.filter(location => location._id !== id));
      } catch (error) {
        console.error('Error deleting location:', error);
        alert(error.response?.data?.message || 'Failed to delete location');
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      locationName: '',
      code: '',
      address: '',
      contactPerson: '',
      phone: '',
      email: '',
      status: 'Active'
    });
    setEditingId(null);
  };

  const getStatusColor = (status) => {
    return status === 'Active' ? '#28a745' : '#dc3545';
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
                Chart of Locations
              </h1>
              <p style={{ 
                color: '#666', 
                margin: 0,
                fontSize: '14px'
              }}>
                Manage business locations, warehouses, and branches
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
                  placeholder="Search locations..."
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
              {editingId ? 'Edit Location' : 'Add New Location'}
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
                  Location Name *
                </label>
                <input
                  type="text"
                  name="locationName"
                  value={formData.locationName}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  placeholder="Enter location name"
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
                  placeholder="Enter location code"
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
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="2"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                  placeholder="Enter full address"
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
                  Contact Person
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  placeholder="Enter contact person name"
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
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
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
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
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
                  {editingId ? 'Update' : 'Add Location'}
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
                Business Locations
              </h3>
              <div style={{
                backgroundColor: '#e9ecef',
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#495057'
              }}>
                {filteredLocations.length} of {locations.length}
              </div>
            </div>

            {filteredLocations.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px',
                color: '#6c757d'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>🏢</div>
                <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>
                  {searchTerm ? 'No locations found' : 'No locations configured'}
                </h4>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  {searchTerm ? 'Try adjusting your search or filters' : 'Add your first business location using the form'}
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
                        borderBottom: '2px solid #dee2e6',
                        width: '20%'
                      }}>
                        Location
                      </th>
                      <th style={{ 
                        padding: '12px', 
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#333',
                        borderBottom: '2px solid #dee2e6',
                        width: '10%'
                      }}>
                        Code
                      </th>
                      <th style={{ 
                        padding: '12px', 
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#333',
                        borderBottom: '2px solid #dee2e6',
                        width: '25%'
                      }}>
                        Address & Contact
                      </th>
                      <th style={{ 
                        padding: '12px', 
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#333',
                        borderBottom: '2px solid #dee2e6',
                        width: '15%'
                      }}>
                        Contact Info
                      </th>
                      <th style={{ 
                        padding: '12px', 
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#333',
                        borderBottom: '2px solid #dee2e6',
                        width: '10%'
                      }}>
                        Status
                      </th>
                      <th style={{ 
                        padding: '12px', 
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#333',
                        borderBottom: '2px solid #dee2e6',
                        width: '10%'
                      }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLocations.map((location, index) => (
                      <tr
                        key={location._id}
                        style={{
                          borderBottom: index === filteredLocations.length - 1 ? 'none' : '1px solid #dee2e6'
                        }}
                      >
                        <td style={{ 
                          padding: '12px', 
                          color: '#333',
                          fontWeight: '500'
                        }}>
                          <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                            {location.locationName}
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
                            {location.code}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
                            <div style={{ marginBottom: '4px' }}>
                              {location.address}
                            </div>
                            {location.contactPerson && (
                              <div style={{ color: '#6c757d', fontSize: '12px' }}>
                                📞 {location.contactPerson}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                            {location.phone && (
                              <div style={{ marginBottom: '2px' }}>
                                {location.phone}
                              </div>
                            )}
                            {location.email && (
                              <div style={{ color: '#007bff' }}>
                                {location.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: getStatusColor(location.status) + '20',
                            color: getStatusColor(location.status)
                          }}>
                            {location.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleEdit(location)}
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
                              onClick={() => handleDelete(location._id)}
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
            About Locations Management
          </h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '15px',
            fontSize: '14px',
            color: '#666'
          }}>
            <div>
              <strong>Purpose:</strong> Track all business locations including warehouses, 
              retail stores, and offices for inventory and operational management.
            </div>
            <div>
              <strong>Usage:</strong> Locations are used in inventory tracking, 
              sales reporting, and operational planning across your business.
            </div>
            <div>
              <strong>Best Practice:</strong> Use clear naming conventions and unique 
              codes for easy identification and reporting.
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
          
          .form-grid {
            grid-template-columns: 1fr !important;
          }
          
          table {
            font-size: 12px;
          }
          
          th, td {
            padding: 8px 6px !important;
          }
        }
        
        @media (max-width: 480px) {
          button {
            padding: 4px 8px !important;
            font-size: 11px !important;
          }
          
          .contact-info {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default ChartOfLocations;