import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const ShopList = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [shopData, setShopData] = useState({
    code: '',
    name: '',
    type: 'Retail',
    address: '',
    contact: '',
    email: '',
    manager: '',
    status: 'Active',
    openingDate: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [editIndex, setEditIndex] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await api.get('/shops');
        setShops(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching shops:', error);
        setError('Failed to load shops');
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShopData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddShop = async () => {
    if (!shopData.name || !shopData.code) {
      alert('Please fill shop name and code');
      return;
    }

    try {
      const response = await api.post('/shops', shopData);
      setShops(prev => [...prev, response.data]);
      resetForm();
      setShowForm(false);
      alert('Shop added successfully!');
    } catch (error) {
      console.error('Error adding shop:', error);
      alert('Failed to add shop. Please try again.');
    }
  };

  const handleUpdateShop = async () => {
    if (editIndex === null) {
      alert('Please select a shop to update');
      return;
    }

    if (!shopData.name || !shopData.code) {
      alert('Please fill shop name and code');
      return;
    }

    try {
      const shopId = shops[editIndex].id;
      const response = await api.put(`/shops/${shopId}`, shopData);
      const updatedShops = [...shops];
      updatedShops[editIndex] = response.data;
      setShops(updatedShops);
      resetForm();
      alert('Shop updated successfully!');
    } catch (error) {
      console.error('Error updating shop:', error);
      alert('Failed to update shop. Please try again.');
    }
  };

  const handleDeleteShop = async () => {
    if (editIndex === null) {
      alert('Please select a shop to delete');
      return;
    }

    if (window.confirm('Are you sure you want to delete this shop?')) {
      try {
        const shopId = shops[editIndex].id;
        await api.delete(`/shops/${shopId}`);
        const updatedShops = shops.filter((_, index) => index !== editIndex);
        setShops(updatedShops);
        resetForm();
        alert('Shop deleted successfully!');
      } catch (error) {
        console.error('Error deleting shop:', error);
        alert('Failed to delete shop. Please try again.');
      }
    }
  };

  const handleRowClick = (index) => {
    setEditIndex(index);
    setShopData(shops[index]);
    setShowForm(true);
  };

  const resetForm = () => {
    setShopData({
      code: '',
      name: '',
      type: 'Retail',
      address: '',
      contact: '',
      email: '',
      manager: '',
      status: 'Active',
      openingDate: ''
    });
    setEditIndex(null);
  };

  const handleNewShop = () => {
    resetForm();
    setShowForm(true);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  // Filter shops based on search and filters
  const filteredShops = shops.filter(shop => {
    const matchesSearch = shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shop.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shop.manager.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || shop.type === filterType;
    const matchesStatus = filterStatus === 'All' || shop.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const styles = {
    container: {
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      padding: '0',
      margin: '0'
    },
    wrapper: {
      backgroundColor: 'white',
      margin: '0',
      padding: '0',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    header: {
      backgroundColor: '#2c3e50',
      color: 'white',
      padding: '15px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    headerTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      margin: '0'
    },
    controlsSection: {
      padding: '15px 20px',
      backgroundColor: '#ecf0f1',
      borderBottom: '1px solid #bdc3c7'
    },
    searchRow: {
      display: 'flex',
      gap: '15px',
      alignItems: 'center',
      marginBottom: '10px',
      flexWrap: 'wrap'
    },
    filterRow: {
      display: 'flex',
      gap: '15px',
      alignItems: 'center',
      flexWrap: 'wrap'
    },
    searchBox: {
      flex: '1',
      minWidth: '200px',
      position: 'relative'
    },
    searchInput: {
      width: '100%',
      padding: '8px 35px 8px 10px',
      border: '1px solid #bdc3c7',
      borderRadius: '4px',
      fontSize: '14px'
    },
    searchIcon: {
      position: 'absolute',
      right: '10px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#7f8c8d'
    },
    filterGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    filterLabel: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#2c3e50'
    },
    filterSelect: {
      padding: '8px 12px',
      border: '1px solid #bdc3c7',
      borderRadius: '4px',
      fontSize: '14px',
      backgroundColor: 'white'
    },
    actionButtons: {
      display: 'flex',
      gap: '10px',
      marginLeft: 'auto'
    },
    btn: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      transition: 'all 0.3s ease'
    },
    btnPrimary: {
      backgroundColor: '#3498db',
      color: 'white'
    },
    btnSuccess: {
      backgroundColor: '#27ae60',
      color: 'white'
    },
    btnWarning: {
      backgroundColor: '#f39c12',
      color: 'white'
    },
    btnDanger: {
      backgroundColor: '#e74c3c',
      color: 'white'
    },
    btnSecondary: {
      backgroundColor: '#95a5a6',
      color: 'white'
    },
    contentSection: {
      display: 'flex',
      minHeight: '500px'
    },
    listSection: {
      flex: '1',
      padding: '0'
    },
    formSection: {
      width: '400px',
      backgroundColor: '#f8f9fa',
      borderLeft: '1px solid #dee2e6',
      padding: '20px',
      display: showForm ? 'block' : 'none'
    },
    formHeader: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '20px',
      color: '#2c3e50',
      paddingBottom: '10px',
      borderBottom: '2px solid #3498db'
    },
    formGroup: {
      marginBottom: '15px'
    },
    formLabel: {
      display: 'block',
      marginBottom: '5px',
      fontWeight: '600',
      color: '#2c3e50',
      fontSize: '14px'
    },
    formInput: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #bdc3c7',
      borderRadius: '4px',
      fontSize: '14px',
      boxSizing: 'border-box'
    },
    formSelect: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #bdc3c7',
      borderRadius: '4px',
      fontSize: '14px',
      backgroundColor: 'white',
      boxSizing: 'border-box'
    },
    formActions: {
      display: 'flex',
      gap: '10px',
      marginTop: '25px'
    },
    tableContainer: {
      maxHeight: '500px',
      overflow: 'auto'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '14px'
    },
    th: {
      backgroundColor: '#34495e',
      color: 'white',
      padding: '12px 8px',
      textAlign: 'left',
      fontWeight: '600',
      position: 'sticky',
      top: '0',
      borderRight: '1px solid #2c3e50'
    },
    td: {
      padding: '10px 8px',
      borderBottom: '1px solid #ecf0f1',
      fontSize: '13px'
    },
    clickableRow: {
      cursor: 'pointer',
      transition: 'background-color 0.2s ease'
    },
    clickableRowHover: {
      backgroundColor: '#f8f9fa'
    },
    selectedRow: {
      backgroundColor: '#d6eaf8'
    },
    statusActive: {
      backgroundColor: '#27ae60',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      display: 'inline-block'
    },
    statusInactive: {
      backgroundColor: '#e74c3c',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      display: 'inline-block'
    },
    typeRetail: {
      backgroundColor: '#3498db',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      display: 'inline-block'
    },
    typeWholesale: {
      backgroundColor: '#9b59b6',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      display: 'inline-block'
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px 20px',
      color: '#7f8c8d'
    },
    emptyStateIcon: {
      fontSize: '48px',
      marginBottom: '10px',
      color: '#bdc3c7'
    },
    emptyStateText: {
      fontSize: '16px',
      margin: '0'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>🏪 Shop Management</h1>
          <div style={styles.actionButtons}>
            <button 
              style={{...styles.btn, ...styles.btnSuccess}}
              onClick={handleNewShop}
            >
              ➕ Add New Shop
            </button>
          </div>
        </div>

        {/* Controls Section */}
        <div style={styles.controlsSection}>
          <div style={styles.searchRow}>
            <div style={styles.searchBox}>
              <input
                type="text"
                placeholder="Search shops by name, code, or manager..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
              <span style={styles.searchIcon}>🔍</span>
            </div>
            <div style={styles.actionButtons}>
              <button style={{...styles.btn, ...styles.btnPrimary}}>📊 Reports</button>
              <button style={{...styles.btn, ...styles.btnSecondary}}>🖨️ Print</button>
            </div>
          </div>
          
          <div style={styles.filterRow}>
            <div style={styles.filterGroup}>
              <span style={styles.filterLabel}>Type:</span>
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="All">All Types</option>
                <option value="Retail">Retail</option>
                <option value="Wholesale">Wholesale</option>
                <option value="Online">Online</option>
              </select>
            </div>
            
            <div style={styles.filterGroup}>
              <span style={styles.filterLabel}>Status:</span>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div style={styles.contentSection}>
          {/* Shops List */}
          <div style={styles.listSection}>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Code</th>
                    <th style={styles.th}>Shop Name</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Address</th>
                    <th style={styles.th}>Contact</th>
                    <th style={styles.th}>Manager</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Opening Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShops.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={styles.emptyState}>
                        <div style={styles.emptyStateIcon}>🏪</div>
                        <p style={styles.emptyStateText}>
                          {shops.length === 0 ? 'No shops found. Add your first shop!' : 'No shops match your search criteria.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredShops.map((shop, index) => (
                      <tr 
                        key={shop.id}
                        style={{
                          ...styles.clickableRow,
                          ...(editIndex === index ? styles.selectedRow : {}),
                          ...styles.clickableRowHover
                        }}
                        onClick={() => handleRowClick(index)}
                      >
                        <td style={styles.td}>
                          <strong>{shop.code}</strong>
                        </td>
                        <td style={styles.td}>
                          <strong>{shop.name}</strong>
                          <br />
                          <small style={{color: '#7f8c8d'}}>{shop.email}</small>
                        </td>
                        <td style={styles.td}>
                          <span style={shop.type === 'Retail' ? styles.typeRetail : styles.typeWholesale}>
                            {shop.type}
                          </span>
                        </td>
                        <td style={styles.td}>{shop.address}</td>
                        <td style={styles.td}>{shop.contact}</td>
                        <td style={styles.td}>{shop.manager}</td>
                        <td style={styles.td}>
                          <span style={shop.status === 'Active' ? styles.statusActive : styles.statusInactive}>
                            {shop.status}
                          </span>
                        </td>
                        <td style={styles.td}>{shop.openingDate}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Shop Form */}
          {showForm && (
            <div style={styles.formSection}>
              <h3 style={styles.formHeader}>
                {editIndex !== null ? '✏️ Edit Shop' : '➕ Add New Shop'}
              </h3>
              
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Shop Code *</label>
                <input
                  type="text"
                  name="code"
                  value={shopData.code}
                  onChange={handleInputChange}
                  style={styles.formInput}
                  placeholder="e.g., SH001"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Shop Name *</label>
                <input
                  type="text"
                  name="name"
                  value={shopData.name}
                  onChange={handleInputChange}
                  style={styles.formInput}
                  placeholder="Enter shop name"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Shop Type</label>
                <select
                  name="type"
                  value={shopData.type}
                  onChange={handleInputChange}
                  style={styles.formSelect}
                >
                  <option value="Retail">Retail Store</option>
                  <option value="Wholesale">Wholesale</option>
                  <option value="Online">Online Store</option>
                  <option value="Kiosk">Kiosk</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Address</label>
                <input
                  type="text"
                  name="address"
                  value={shopData.address}
                  onChange={handleInputChange}
                  style={styles.formInput}
                  placeholder="Full address"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Contact Number</label>
                <input
                  type="text"
                  name="contact"
                  value={shopData.contact}
                  onChange={handleInputChange}
                  style={styles.formInput}
                  placeholder="Phone number"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={shopData.email}
                  onChange={handleInputChange}
                  style={styles.formInput}
                  placeholder="Email address"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Manager</label>
                <input
                  type="text"
                  name="manager"
                  value={shopData.manager}
                  onChange={handleInputChange}
                  style={styles.formInput}
                  placeholder="Manager name"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Status</label>
                <select
                  name="status"
                  value={shopData.status}
                  onChange={handleInputChange}
                  style={styles.formSelect}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Maintenance">Under Maintenance</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Opening Date</label>
                <input
                  type="text"
                  name="openingDate"
                  value={shopData.openingDate}
                  onChange={handleInputChange}
                  style={styles.formInput}
                  placeholder="DD-MMM-YYYY"
                />
              </div>

              <div style={styles.formActions}>
                {editIndex !== null ? (
                  <>
                    <button 
                      style={{...styles.btn, ...styles.btnSuccess}}
                      onClick={handleUpdateShop}
                    >
                      💾 Update Shop
                    </button>
                    <button 
                      style={{...styles.btn, ...styles.btnDanger}}
                      onClick={handleDeleteShop}
                    >
                      🗑️ Delete
                    </button>
                  </>
                ) : (
                  <button 
                    style={{...styles.btn, ...styles.btnSuccess}}
                    onClick={handleAddShop}
                  >
                    ➕ Add Shop
                  </button>
                )}
                <button 
                  style={{...styles.btn, ...styles.btnSecondary}}
                  onClick={handleCancel}
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopList;