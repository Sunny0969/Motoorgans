import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const RateList = () => {
  const [filters, setFilters] = useState({
    category: '',
    dateFrom: '',
    dateTo: '',
    status: 'Active'
  });

  const [rateEntry, setRateEntry] = useState({
    itemCode: '',
    itemName: '',
    category: '',
    uom: 'PC',
    costPrice: '',
    sellingPrice: '',
    minPrice: '',
    maxPrice: '',
    effectiveDate: '',
    status: 'Active',
    remarks: ''
  });

  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [editIndex, setEditIndex] = useState(null);

  // Fetch rates on component mount
  useEffect(() => {
    fetchRates();
  }, []);

  // Filter rates when filters change
  const filteredRates = rates.filter(rate => {
    const matchesCategory = !filters.category || rate.category === filters.category;
    const matchesStatus = !filters.status || rate.status === filters.status;
    const matchesDateFrom = !filters.dateFrom || new Date(rate.effectiveDate) >= new Date(filters.dateFrom);
    const matchesDateTo = !filters.dateTo || new Date(rate.effectiveDate) <= new Date(filters.dateTo);
    return matchesCategory && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  const fetchRates = async () => {
    setLoading(true);
    try {
      const response = await api.get('/rates');
      setRates(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch rates');
      console.error('Error fetching rates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRateEntryChange = (e) => {
    const { name, value } = e.target;
    setRateEntry(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddRate = async () => {
    if (!rateEntry.itemName || !rateEntry.costPrice || !rateEntry.sellingPrice) {
      alert('Please fill item name, cost price, and selling price');
      return;
    }

    const costPrice = parseFloat(rateEntry.costPrice) || 0;
    const sellingPrice = parseFloat(rateEntry.sellingPrice) || 0;

    if (costPrice <= 0 || sellingPrice <= 0) {
      alert('Prices must be greater than zero!');
      return;
    }

    if (sellingPrice <= costPrice) {
      alert('Selling price must be greater than cost price!');
      return;
    }

    try {
      const response = await api.post('/rates', rateEntry);
      setRates([...rates, response.data]);
      resetRateEntry();
      alert('Rate added successfully!');
    } catch (err) {
      alert('Failed to add rate: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateRate = async () => {
    if (editIndex === null) {
      alert('Please select a rate to update');
      return;
    }

    const costPrice = parseFloat(rateEntry.costPrice) || 0;
    const sellingPrice = parseFloat(rateEntry.sellingPrice) || 0;

    if (costPrice <= 0 || sellingPrice <= 0) {
      alert('Prices must be greater than zero!');
      return;
    }

    if (sellingPrice <= costPrice) {
      alert('Selling price must be greater than cost price!');
      return;
    }

    try {
      const rateId = rates[editIndex].id;
      const response = await api.put(`/rates/${rateId}`, rateEntry);
      const updatedRates = [...rates];
      updatedRates[editIndex] = response.data;
      setRates(updatedRates);
      resetRateEntry();
      setEditIndex(null);
      alert('Rate updated successfully!');
    } catch (err) {
      alert('Failed to update rate: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRemoveRate = async () => {
    if (editIndex === null) {
      alert('Please select a rate to remove');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this rate?')) {
      return;
    }

    try {
      const rateId = rates[editIndex].id;
      await api.delete(`/rates/${rateId}`);
      const updatedRates = rates.filter((_, index) => index !== editIndex);
      setRates(updatedRates);
      resetRateEntry();
      setEditIndex(null);
      alert('Rate deleted successfully!');
    } catch (err) {
      alert('Failed to delete rate: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRowClick = (index) => {
    setEditIndex(index);
    setRateEntry(rates[index]);
  };

  const resetRateEntry = () => {
    setRateEntry({
      itemCode: '',
      itemName: '',
      category: '',
      uom: 'PC',
      costPrice: '',
      sellingPrice: '',
      minPrice: '',
      maxPrice: '',
      effectiveDate: '',
      status: 'Active',
      remarks: ''
    });
  };

  const handleReset = () => {
    resetRateEntry();
    setEditIndex(null);
  };

  const handleSave = () => {
    if (rates.length === 0) {
      alert('Please add at least one rate');
      return;
    }
    alert('Rate list saved successfully!');
  };

  const handlePrint = () => {
    if (rates.length === 0) {
      alert('No rates to print');
      return;
    }
    alert('Printing rate list...');
  };

  const handleExport = () => {
    if (rates.length === 0) {
      alert('No rates to export');
      return;
    }
    alert('Exporting rate list...');
  };

  const handleRefresh = () => {
    alert('Refreshing rate list...');
  };

  const styles = {
    container: {
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#d0d0d0',
      minHeight: '100vh',
      margin: 0,
      padding: 0,
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box'
    },
    wrapper: {
      backgroundColor: 'white',
      width: '100%',
      margin: 0,
      boxSizing: 'border-box'
    },
    header: {
      backgroundColor: '#4a4a4a',
      color: 'white',
      padding: '10px',
      textAlign: 'center',
      fontSize: '18px',
      fontWeight: 'bold',
      boxSizing: 'border-box'
    },
    topSection: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
      alignItems: 'flex-end',
      padding: '8px',
      backgroundColor: '#e8e8e8',
      borderBottom: '2px solid #999',
      fontSize: '10px',
      boxSizing: 'border-box'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      flex: '1',
      minWidth: '100px'
    },
    label: {
      fontSize: '10px',
      fontWeight: '500',
      color: '#333'
    },
    input: {
      padding: '2px 4px',
      border: '1px solid #999',
      fontSize: '10px',
      backgroundColor: 'white',
      boxSizing: 'border-box'
    },
    inputBlue: {
      padding: '2px 4px',
      border: '1px solid #999',
      fontSize: '10px',
      backgroundColor: '#4da6ff',
      color: 'white',
      fontWeight: 'bold',
      boxSizing: 'border-box'
    },
    select: {
      padding: '2px 4px',
      border: '1px solid #999',
      fontSize: '10px',
      backgroundColor: 'white',
      boxSizing: 'border-box'
    },
    statusBadge: {
      padding: '3px 8px',
      borderRadius: '10px',
      fontSize: '10px',
      fontWeight: 'bold',
      textAlign: 'center'
    },
    productSection: {
      padding: '6px',
      backgroundColor: '#e8e8e8',
      borderBottom: '1px solid #999',
      boxSizing: 'border-box'
    },
    entryRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '3px',
      alignItems: 'center',
      marginBottom: '4px',
      fontSize: '10px'
    },
    entryGroup: {
      display: 'flex',
      gap: '2px',
      alignItems: 'center'
    },
    stockRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 6px',
      backgroundColor: '#e8e8e8',
      fontSize: '10px',
      flexWrap: 'wrap',
      boxSizing: 'border-box'
    },
    btn: {
      padding: '3px 8px',
      border: '1px solid #999',
      backgroundColor: '#e0e0e0',
      cursor: 'pointer',
      fontSize: '10px',
      whiteSpace: 'nowrap',
      boxSizing: 'border-box',
      borderRadius: '2px'
    },
    tableContainer: {
      width: '100%',
      overflowX: 'auto',
      maxHeight: '300px',
      boxSizing: 'border-box'
    },
    table: {
      width: '100%',
      minWidth: '1000px',
      borderCollapse: 'collapse',
      fontSize: '9px',
      backgroundColor: 'white'
    },
    th: {
      backgroundColor: '#d0d0d0',
      border: '1px solid #999',
      padding: '3px 2px',
      textAlign: 'center',
      fontWeight: 'bold',
      fontSize: '9px',
      position: 'sticky',
      top: 0
    },
    td: {
      border: '1px solid #999',
      padding: '3px 2px',
      textAlign: 'center',
      fontSize: '9px'
    },
    tdLeft: {
      border: '1px solid #999',
      padding: '3px 2px',
      textAlign: 'left',
      fontSize: '9px'
    },
    clickableRow: {
      cursor: 'pointer'
    },
    selectedRow: {
      backgroundColor: '#b3d9ff'
    },
    summarySection: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      padding: '8px',
      backgroundColor: '#e8e8e8',
      borderTop: '2px solid #999',
      boxSizing: 'border-box'
    },
    summaryBox: {
      flex: '1',
      minWidth: '120px',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px'
    },
    actionBar: {
      display: 'flex',
      gap: '4px',
      padding: '6px',
      backgroundColor: '#4a4a4a',
      alignItems: 'center',
      borderTop: '2px solid #333',
      flexWrap: 'wrap',
      boxSizing: 'border-box',
      justifyContent: 'space-between'
    },
    leftActions: {
      display: 'flex',
      gap: '4px',
      flexWrap: 'wrap'
    },
    rightActions: {
      display: 'flex',
      gap: '4px',
      flexWrap: 'wrap'
    },
    actionBtn: {
      padding: '4px 8px',
      border: '1px solid #666',
      backgroundColor: '#6a6a6a',
      color: 'white',
      cursor: 'pointer',
      fontSize: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
      whiteSpace: 'nowrap',
      boxSizing: 'border-box',
      borderRadius: '2px'
    }
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'Active':
        return { ...styles.statusBadge, backgroundColor: '#28a745', color: 'white' };
      case 'Inactive':
        return { ...styles.statusBadge, backgroundColor: '#dc3545', color: 'white' };
      default:
        return { ...styles.statusBadge, backgroundColor: '#6c757d', color: 'white' };
    }
  };

  const getProfitMargin = (costPrice, sellingPrice) => {
    const cost = parseFloat(costPrice) || 0;
    const selling = parseFloat(sellingPrice) || 0;
    if (cost === 0) return '0%';
    const margin = ((selling - cost) / cost) * 100;
    return `${margin.toFixed(1)}%`;
  };

  const activeRatesCount = rates.filter(rate => rate.status === 'Active').length;
  const clothingRatesCount = rates.filter(rate => rate.category === 'Clothing').length;

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.header}>Rate List</div>

        <div style={styles.topSection}>
          <div style={{...styles.formGroup, flex: '0 0 100px'}}>
            <label style={styles.label}>Category</label>
            <select 
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              style={styles.select}
            >
              <option value="">All Categories</option>
              <option value="Clothing">Clothing</option>
              <option value="Footwear">Footwear</option>
              <option value="Raw Material">Raw Material</option>
            </select>
          </div>

          <div style={{...styles.formGroup, flex: '0 0 90px'}}>
            <label style={styles.label}>Date From</label>
            <input 
              type="date" 
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              style={styles.input}
            />
          </div>

          <div style={{...styles.formGroup, flex: '0 0 90px'}}>
            <label style={styles.label}>Date To</label>
            <input 
              type="date" 
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              style={styles.input}
            />
          </div>

          <div style={{...styles.formGroup, flex: '0 0 80px'}}>
            <label style={styles.label}>Status</label>
            <select 
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              style={styles.select}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div style={styles.productSection}>
          <div style={styles.entryRow}>
            <div style={styles.entryGroup}>
              <label style={styles.label}>Item Code</label>
              <input 
                type="text" 
                name="itemCode" 
                value={rateEntry.itemCode} 
                onChange={handleRateEntryChange} 
                style={{...styles.input, width: '60px'}} 
              />
            </div>
            
            <div style={styles.entryGroup}>
              <label style={styles.label}>Item Name</label>
              <input 
                type="text" 
                name="itemName" 
                value={rateEntry.itemName} 
                onChange={handleRateEntryChange} 
                style={{...styles.input, width: '120px'}} 
                placeholder="Item name"
              />
            </div>
            
            <div style={styles.entryGroup}>
              <label style={styles.label}>Category</label>
              <select 
                name="category" 
                value={rateEntry.category} 
                onChange={handleRateEntryChange} 
                style={{...styles.select, width: '100px'}}
              >
                <option value="">Select</option>
                <option value="Clothing">Clothing</option>
                <option value="Footwear">Footwear</option>
                <option value="Raw Material">Raw Material</option>
              </select>
            </div>
            
            <div style={styles.entryGroup}>
              <label style={styles.label}>UOM</label>
              <select 
                name="uom" 
                value={rateEntry.uom} 
                onChange={handleRateEntryChange} 
                style={{...styles.select, width: '50px'}}
              >
                <option value="PC">PC</option>
                <option value="MTR">MTR</option>
                <option value="KG">KG</option>
                <option value="BOX">BOX</option>
              </select>
            </div>
            
            <div style={styles.entryGroup}>
              <label style={styles.label}>Cost Price</label>
              <input 
                type="text" 
                name="costPrice" 
                value={rateEntry.costPrice} 
                onChange={handleRateEntryChange} 
                style={{...styles.input, width: '70px'}} 
                placeholder="0.00"
              />
            </div>
            
            <div style={styles.entryGroup}>
              <label style={styles.label}>Selling Price</label>
              <input 
                type="text" 
                name="sellingPrice" 
                value={rateEntry.sellingPrice} 
                onChange={handleRateEntryChange} 
                style={{...styles.input, width: '70px'}} 
                placeholder="0.00"
              />
            </div>

            <div style={styles.entryGroup}>
              <label style={styles.label}>Min Price</label>
              <input 
                type="text" 
                name="minPrice" 
                value={rateEntry.minPrice} 
                onChange={handleRateEntryChange} 
                style={{...styles.input, width: '70px'}} 
                placeholder="0.00"
              />
            </div>

            <div style={styles.entryGroup}>
              <label style={styles.label}>Max Price</label>
              <input 
                type="text" 
                name="maxPrice" 
                value={rateEntry.maxPrice} 
                onChange={handleRateEntryChange} 
                style={{...styles.input, width: '70px'}} 
                placeholder="0.00"
              />
            </div>

            <div style={styles.entryGroup}>
              <label style={styles.label}>Effective Date</label>
              <input 
                type="text" 
                name="effectiveDate" 
                value={rateEntry.effectiveDate} 
                onChange={handleRateEntryChange} 
                style={{...styles.input, width: '80px'}} 
                placeholder="DD-MMM-YY"
              />
            </div>
          </div>
        </div>

        <div style={styles.stockRow}>
          <button style={styles.btn} onClick={handleReset}>Reset</button>
          <button style={styles.btn} onClick={handleAddRate}>Add Rate</button>
          <button style={styles.btn} onClick={handleUpdateRate}>Update Rate</button>
          <button style={styles.btn} onClick={handleRemoveRate}>Remove Rate</button>
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Item Code</th>
                <th style={styles.th}>Item Name</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>UOM</th>
                <th style={styles.th}>Cost Price</th>
                <th style={styles.th}>Selling Price</th>
                <th style={styles.th}>Min Price</th>
                <th style={styles.th}>Max Price</th>
                <th style={styles.th}>Profit Margin</th>
                <th style={styles.th}>Effective Date</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRates.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{...styles.td, textAlign: 'center', padding: '15px'}}>
                    No rates match the filters
                  </td>
                </tr>
              ) : (
                filteredRates.map((rate, index) => {
                  const originalIndex = rates.findIndex(r => r.id === rate.id);
                  return (
                    <tr
                      key={rate.id}
                      style={{
                        ...styles.clickableRow,
                        ...(editIndex === originalIndex ? styles.selectedRow : {})
                      }}
                      onClick={() => handleRowClick(originalIndex)}
                    >
                      <td style={styles.td}>{rate.itemCode}</td>
                      <td style={styles.tdLeft}>{rate.itemName}</td>
                      <td style={styles.td}>{rate.category}</td>
                      <td style={styles.td}>{rate.uom}</td>
                      <td style={styles.td}>${rate.costPrice}</td>
                      <td style={styles.td}>${rate.sellingPrice}</td>
                      <td style={styles.td}>${rate.minPrice}</td>
                      <td style={styles.td}>${rate.maxPrice}</td>
                      <td style={styles.td}>{getProfitMargin(rate.costPrice, rate.sellingPrice)}</td>
                      <td style={styles.td}>{rate.effectiveDate}</td>
                      <td style={styles.td}>
                        <span style={getStatusStyle(rate.status)}>
                          {rate.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div style={styles.summarySection}>
          <div style={styles.summaryBox}>
            <label style={styles.label}>Total Rates</label>
            <input 
              type="text" 
              value={rates.length} 
              style={{...styles.input, fontWeight: 'bold'}} 
              readOnly 
            />
          </div>
          
          <div style={styles.summaryBox}>
            <label style={styles.label}>Active Rates</label>
            <input 
              type="text" 
              value={activeRatesCount} 
              style={{...styles.input, fontWeight: 'bold', backgroundColor: '#ccffcc'}} 
              readOnly 
            />
          </div>

          <div style={styles.summaryBox}>
            <label style={styles.label}>Clothing Items</label>
            <input 
              type="text" 
              value={clothingRatesCount} 
              style={{...styles.input, fontWeight: 'bold'}} 
              readOnly 
            />
          </div>

          <div style={styles.summaryBox}>
            <label style={styles.label}>Last Updated</label>
            <input 
              type="text" 
              value="30-Mar-22" 
              style={{...styles.input, fontWeight: 'bold'}} 
              readOnly 
            />
          </div>
        </div>

        <div style={styles.actionBar}>
          <div style={styles.leftActions}>
            <button style={styles.actionBtn} onClick={handleSave}>💾 Save</button>
            <button style={styles.actionBtn} onClick={handlePrint}>🖨️ Print List</button>
            <button style={styles.actionBtn} onClick={handleRefresh}>🔄 Refresh</button>
          </div>
          <div style={styles.rightActions}>
            <button style={{...styles.actionBtn, backgroundColor: '#e67e22'}} onClick={handleExport}>📊 Export</button>
            <button style={{...styles.actionBtn, backgroundColor: '#d32f2f'}}>❌ Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateList;