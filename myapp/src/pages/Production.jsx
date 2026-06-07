import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const Production = () => {
  const [productionData, setProductionData] = useState({
    productionNumber: 'PRD-2022-125',
    date: '29-Mar-22',
    productionDate: '30-Mar-22',
    productionOrder: '',
    productionLine: '',
    supervisor: '',
    shift: 'Day',
    status: 'Planned',
    expectedCompletion: '31-Mar-22',
    notes: ''
  });

  const [materialEntry, setMaterialEntry] = useState({
    materialCode: '',
    materialName: '',
    category: '',
    requiredQty: '',
    availableStock: '0',
    uom: 'PC',
    cost: '',
    totalCost: '0',
    remarks: ''
  });

  const [productEntry, setProductEntry] = useState({
    productCode: '',
    productName: '',
    category: '',
    plannedQty: '',
    producedQty: '',
    uom: 'PC',
    qualityStatus: 'Good',
    remarks: ''
  });

  const [materials, setMaterials] = useState([]);
  const [products, setProducts] = useState([]);
  const [editMaterialIndex, setEditMaterialIndex] = useState(null);
  const [editProductIndex, setEditProductIndex] = useState(null);
  const [activeTab, setActiveTab] = useState('materials');

  const [summaryData, setSummaryData] = useState({
    totalMaterials: '0',
    totalProducts: '0',
    totalMaterialCost: '0.00',
    totalProductionQty: '0'
  });

  const handleProductionChange = (e) => {
    const { name, value } = e.target;
    setProductionData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMaterialEntryChange = (e) => {
    const { name, value } = e.target;
    setMaterialEntry(prev => {
      const updated = {
        ...prev,
        [name]: value
      };
      
      // Calculate total cost when required quantity or cost changes
      if (name === 'requiredQty' || name === 'cost') {
        const qty = parseFloat(updated.requiredQty) || 0;
        const cost = parseFloat(updated.cost) || 0;
        updated.totalCost = (qty * cost).toFixed(2);
      }
      
      return updated;
    });
  };

  const handleProductEntryChange = (e) => {
    const { name, value } = e.target;
    setProductEntry(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateTotals = (materialsList, productsList) => {
    const totalMaterials = materialsList.length;
    const totalProducts = productsList.length;
    const totalMaterialCost = materialsList.reduce((sum, m) => sum + (parseFloat(m.totalCost) || 0), 0);
    const totalProductionQty = productsList.reduce((sum, p) => sum + (parseFloat(p.producedQty) || 0), 0);
    
    setSummaryData({
      totalMaterials: totalMaterials.toString(),
      totalProducts: totalProducts.toString(),
      totalMaterialCost: totalMaterialCost.toFixed(2),
      totalProductionQty: totalProductionQty.toString()
    });
  };

  const handleAddMaterial = () => {
    if (!materialEntry.materialName || !materialEntry.requiredQty) {
      alert('Please fill material name and required quantity');
      return;
    }

    const required = parseFloat(materialEntry.requiredQty) || 0;
    const available = parseFloat(materialEntry.availableStock) || 0;

    if (required <= 0) {
      alert('Required quantity must be greater than zero!');
      return;
    }

    if (required > available) {
      alert('Required quantity cannot exceed available stock!');
      return;
    }

    const newMaterial = {
      sr: materials.length + 1,
      ...materialEntry
    };

    const updatedMaterials = [...materials, newMaterial];
    setMaterials(updatedMaterials);
    calculateTotals(updatedMaterials, products);
    resetMaterialEntry();
  };

  const handleUpdateMaterial = () => {
    if (editMaterialIndex === null) {
      alert('Please select a material to update');
      return;
    }

    const required = parseFloat(materialEntry.requiredQty) || 0;
    const available = parseFloat(materialEntry.availableStock) || 0;

    if (required <= 0) {
      alert('Required quantity must be greater than zero!');
      return;
    }

    if (required > available) {
      alert('Required quantity cannot exceed available stock!');
      return;
    }

    const updatedMaterials = [...materials];
    updatedMaterials[editMaterialIndex] = {
      ...updatedMaterials[editMaterialIndex],
      ...materialEntry
    };
    
    setMaterials(updatedMaterials);
    calculateTotals(updatedMaterials, products);
    resetMaterialEntry();
    setEditMaterialIndex(null);
  };

  const handleRemoveMaterial = () => {
    if (editMaterialIndex === null) {
      alert('Please select a material to remove');
      return;
    }

    const updatedMaterials = materials.filter((_, index) => index !== editMaterialIndex);
    const reNumbered = updatedMaterials.map((m, idx) => ({ ...m, sr: idx + 1 }));
    
    setMaterials(reNumbered);
    calculateTotals(reNumbered, products);
    resetMaterialEntry();
    setEditMaterialIndex(null);
  };

  const handleAddProduct = () => {
    if (!productEntry.productName || !productEntry.plannedQty) {
      alert('Please fill product name and planned quantity');
      return;
    }

    const planned = parseFloat(productEntry.plannedQty) || 0;
    const produced = parseFloat(productEntry.producedQty) || 0;

    if (planned <= 0) {
      alert('Planned quantity must be greater than zero!');
      return;
    }

    if (produced > planned) {
      alert('Produced quantity cannot exceed planned quantity!');
      return;
    }

    const newProduct = {
      sr: products.length + 1,
      ...productEntry
    };

    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    calculateTotals(materials, updatedProducts);
    resetProductEntry();
  };

  const handleUpdateProduct = () => {
    if (editProductIndex === null) {
      alert('Please select a product to update');
      return;
    }

    const planned = parseFloat(productEntry.plannedQty) || 0;
    const produced = parseFloat(productEntry.producedQty) || 0;

    if (planned <= 0) {
      alert('Planned quantity must be greater than zero!');
      return;
    }

    if (produced > planned) {
      alert('Produced quantity cannot exceed planned quantity!');
      return;
    }

    const updatedProducts = [...products];
    updatedProducts[editProductIndex] = {
      ...updatedProducts[editProductIndex],
      ...productEntry
    };
    
    setProducts(updatedProducts);
    calculateTotals(materials, updatedProducts);
    resetProductEntry();
    setEditProductIndex(null);
  };

  const handleRemoveProduct = () => {
    if (editProductIndex === null) {
      alert('Please select a product to remove');
      return;
    }

    const updatedProducts = products.filter((_, index) => index !== editProductIndex);
    const reNumbered = updatedProducts.map((p, idx) => ({ ...p, sr: idx + 1 }));
    
    setProducts(reNumbered);
    calculateTotals(materials, reNumbered);
    resetProductEntry();
    setEditProductIndex(null);
  };

  const handleMaterialRowClick = (index) => {
    setEditMaterialIndex(index);
    setMaterialEntry(materials[index]);
  };

  const handleProductRowClick = (index) => {
    setEditProductIndex(index);
    setProductEntry(products[index]);
  };

  const resetMaterialEntry = () => {
    setMaterialEntry({
      materialCode: '',
      materialName: '',
      category: '',
      requiredQty: '',
      availableStock: '0',
      uom: 'PC',
      cost: '',
      totalCost: '0',
      remarks: ''
    });
  };

  const resetProductEntry = () => {
    setProductEntry({
      productCode: '',
      productName: '',
      category: '',
      plannedQty: '',
      producedQty: '',
      uom: 'PC',
      qualityStatus: 'Good',
      remarks: ''
    });
  };

  const handleReset = () => {
    resetMaterialEntry();
    resetProductEntry();
    setEditMaterialIndex(null);
    setEditProductIndex(null);
  };

  const handleSave = async () => {
    if (materials.length === 0) {
      alert('Please add at least one material');
      return;
    }

    if (products.length === 0) {
      alert('Please add at least one product');
      return;
    }

    if (!productionData.productionOrder || !productionData.productionLine) {
      alert('Please select Production Order and Production Line');
      return;
    }

    try {
      const production = {
        ...productionData,
        materials,
        products,
        summary: summaryData
      };

      const response = await api.post('/productions', production);
      alert('Production order saved successfully!');
      console.log('Saved Production:', response.data);
    } catch (error) {
      console.error('Error saving production:', error);
      alert('Error saving production order. Please try again.');
    }
  };

  const handleStartProduction = () => {
    if (materials.length === 0 || products.length === 0) {
      alert('Please add materials and products before starting production');
      return;
    }
    setProductionData(prev => ({ ...prev, status: 'In Progress' }));
    alert('Production started! Status: In Progress');
  };

  const handleCompleteProduction = () => {
    if (productionData.status !== 'In Progress') {
      alert('Production must be started before completion');
      return;
    }
    setProductionData(prev => ({ ...prev, status: 'Completed' }));
    alert('Production completed successfully!');
  };

  const handlePauseProduction = () => {
    if (productionData.status !== 'In Progress') {
      alert('Production must be in progress to pause');
      return;
    }
    setProductionData(prev => ({ ...prev, status: 'Paused' }));
    alert('Production paused!');
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
      boxSizing: 'border-box',
      overflowX: 'hidden'
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
      fontSize: 'clamp(18px, 3vw, 28px)',
      fontWeight: 'bold',
      boxSizing: 'border-box'
    },
    topSection: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      alignItems: 'flex-end',
      padding: '10px',
      backgroundColor: '#e8e8e8',
      borderBottom: '2px solid #999',
      fontSize: 'clamp(9px, 1.2vw, 11px)',
      boxSizing: 'border-box'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '3px',
      flex: '1',
      minWidth: '110px'
    },
    label: {
      fontSize: 'clamp(9px, 1.2vw, 11px)',
      fontWeight: '500',
      color: '#333'
    },
    input: {
      padding: '3px 5px',
      border: '1px solid #999',
      fontSize: 'clamp(9px, 1.2vw, 11px)',
      backgroundColor: 'white',
      boxSizing: 'border-box'
    },
    inputBlue: {
      padding: '3px 5px',
      border: '1px solid #999',
      fontSize: 'clamp(9px, 1.2vw, 11px)',
      backgroundColor: '#4da6ff',
      color: 'white',
      fontWeight: 'bold',
      boxSizing: 'border-box'
    },
    select: {
      padding: '3px 5px',
      border: '1px solid #999',
      fontSize: 'clamp(9px, 1.2vw, 11px)',
      backgroundColor: 'white',
      boxSizing: 'border-box'
    },
    statusBadge: {
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: 'clamp(9px, 1.2vw, 11px)',
      fontWeight: 'bold',
      textAlign: 'center'
    },
    productionBox: {
      padding: '8px',
      backgroundColor: '#fff3cd',
      border: '2px solid #ffc107',
      borderRadius: '4px',
      marginBottom: '8px',
      boxSizing: 'border-box'
    },
    productionRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '15px',
      fontSize: 'clamp(11px, 1.4vw, 13px)',
      fontWeight: 'bold'
    },
    tabContainer: {
      display: 'flex',
      backgroundColor: '#e8e8e8',
      borderBottom: '1px solid #999'
    },
    tab: {
      padding: '8px 16px',
      cursor: 'pointer',
      fontSize: 'clamp(10px, 1.3vw, 12px)',
      fontWeight: 'bold',
      border: 'none',
      backgroundColor: 'transparent',
      borderBottom: '3px solid transparent'
    },
    activeTab: {
      backgroundColor: '#4da6ff',
      color: 'white',
      borderBottom: '3px solid #007bff'
    },
    productSection: {
      padding: '8px',
      backgroundColor: '#e8e8e8',
      borderBottom: '1px solid #999',
      boxSizing: 'border-box'
    },
    entryRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px',
      alignItems: 'center',
      marginBottom: '6px',
      fontSize: 'clamp(9px, 1.2vw, 11px)'
    },
    entryGroup: {
      display: 'flex',
      gap: '3px',
      alignItems: 'center'
    },
    stockRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 8px',
      backgroundColor: '#e8e8e8',
      fontSize: 'clamp(9px, 1.2vw, 11px)',
      flexWrap: 'wrap',
      boxSizing: 'border-box'
    },
    btn: {
      padding: '4px 10px',
      border: '1px solid #999',
      backgroundColor: '#e0e0e0',
      cursor: 'pointer',
      fontSize: 'clamp(9px, 1.2vw, 11px)',
      whiteSpace: 'nowrap',
      boxSizing: 'border-box',
      borderRadius: '3px'
    },
    tableContainer: {
      width: '100%',
      overflowX: 'auto',
      overflowY: 'auto',
      maxHeight: '300px',
      boxSizing: 'border-box'
    },
    table: {
      width: '100%',
      minWidth: '900px',
      borderCollapse: 'collapse',
      fontSize: 'clamp(8px, 1vw, 10px)',
      backgroundColor: 'white'
    },
    th: {
      backgroundColor: '#d0d0d0',
      border: '1px solid #999',
      padding: '4px 2px',
      textAlign: 'center',
      fontWeight: 'bold',
      fontSize: 'clamp(8px, 1vw, 10px)',
      position: 'sticky',
      top: 0
    },
    td: {
      border: '1px solid #999',
      padding: '4px 2px',
      textAlign: 'center',
      fontSize: 'clamp(8px, 1vw, 10px)'
    },
    tdLeft: {
      border: '1px solid #999',
      padding: '4px 2px',
      textAlign: 'left',
      fontSize: 'clamp(8px, 1vw, 10px)'
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
      gap: '10px',
      padding: '10px',
      backgroundColor: '#e8e8e8',
      borderTop: '2px solid #999',
      boxSizing: 'border-box'
    },
    summaryBox: {
      flex: '1',
      minWidth: '150px',
      display: 'flex',
      flexDirection: 'column',
      gap: '3px'
    },
    actionBar: {
      display: 'flex',
      gap: '6px',
      padding: '8px',
      backgroundColor: '#4a4a4a',
      alignItems: 'center',
      borderTop: '2px solid #333',
      flexWrap: 'wrap',
      boxSizing: 'border-box'
    },
    actionBtn: {
      padding: '6px 12px',
      border: '1px solid #666',
      backgroundColor: '#6a6a6a',
      color: 'white',
      cursor: 'pointer',
      fontSize: 'clamp(9px, 1.2vw, 11px)',
      display: 'flex',
      alignItems: 'center',
      gap: '3px',
      whiteSpace: 'nowrap',
      boxSizing: 'border-box',
      borderRadius: '3px'
    }
  };

  const getStatusStyle = () => {
    switch(productionData.status) {
      case 'Completed':
        return { ...styles.statusBadge, backgroundColor: '#28a745', color: 'white' };
      case 'In Progress':
        return { ...styles.statusBadge, backgroundColor: '#17a2b8', color: 'white' };
      case 'Paused':
        return { ...styles.statusBadge, backgroundColor: '#ffc107', color: '#000' };
      case 'Planned':
        return { ...styles.statusBadge, backgroundColor: '#6f42c1', color: 'white' };
      default:
        return { ...styles.statusBadge, backgroundColor: '#6c757d', color: 'white' };
    }
  };

  const getQualityStyle = (status) => {
    switch(status) {
      case 'Good':
        return { color: '#28a745', fontWeight: 'bold' };
      case 'Defective':
        return { color: '#dc3545', fontWeight: 'bold' };
      case 'Rework':
        return { color: '#ffc107', fontWeight: 'bold' };
      default:
        return {};
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.header}>Production Order</div>
        
        {/* Production Details Display */}
        {productionData.productionOrder && productionData.productionLine && (
          <div style={{padding: '10px'}}>
            <div style={styles.productionBox}>
              <div style={styles.productionRow}>
                <span>Order: <strong>{productionData.productionOrder}</strong></span>
                <span style={{marginLeft: '20px'}}>Line: <strong>{productionData.productionLine}</strong></span>
                <span style={{marginLeft: '20px'}}>Supervisor: <strong>{productionData.supervisor}</strong></span>
                <span style={{marginLeft: '20px'}}>Shift: <strong>{productionData.shift}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Top Section - Production Details */}
        <div style={styles.topSection}>
          <div style={{...styles.formGroup, flex: '0 0 120px'}}>
            <label style={styles.label}>Production #</label>
            <input 
              type="text" 
              name="productionNumber"
              value={productionData.productionNumber}
              onChange={handleProductionChange}
              style={styles.inputBlue}
            />
          </div>

          <div style={{...styles.formGroup, flex: '0 0 110px'}}>
            <label style={styles.label}>Date</label>
            <select 
              name="date"
              value={productionData.date}
              onChange={handleProductionChange}
              style={styles.select}
            >
              <option value="29-Mar-22">29-Mar-22</option>
              <option value="30-Mar-22">30-Mar-22</option>
            </select>
          </div>

          <div style={{...styles.formGroup, flex: '0 0 110px'}}>
            <label style={styles.label}>Production Date</label>
            <select 
              name="productionDate"
              value={productionData.productionDate}
              onChange={handleProductionChange}
              style={styles.select}
            >
              <option value="30-Mar-22">30-Mar-22</option>
              <option value="31-Mar-22">31-Mar-22</option>
            </select>
          </div>

          <div style={{...styles.formGroup, flex: '1 1 130px'}}>
            <label style={styles.label}>Production Order</label>
            <select 
              name="productionOrder"
              value={productionData.productionOrder}
              onChange={handleProductionChange}
              style={styles.select}
            >
              <option value="">Select Order</option>
              <option value="PO-2022-001">PO-2022-001</option>
              <option value="PO-2022-002">PO-2022-002</option>
              <option value="PO-2022-003">PO-2022-003</option>
            </select>
          </div>

          <div style={{...styles.formGroup, flex: '1 1 130px'}}>
            <label style={styles.label}>Production Line</label>
            <select 
              name="productionLine"
              value={productionData.productionLine}
              onChange={handleProductionChange}
              style={styles.select}
            >
              <option value="">Select Line</option>
              <option value="Line A">Line A</option>
              <option value="Line B">Line B</option>
              <option value="Line C">Line C</option>
            </select>
          </div>

          <div style={{...styles.formGroup, flex: '1 1 120px'}}>
            <label style={styles.label}>Supervisor</label>
            <select 
              name="supervisor"
              value={productionData.supervisor}
              onChange={handleProductionChange}
              style={styles.select}
            >
              <option value="">Select Supervisor</option>
              <option value="Ali Ahmed">Ali Ahmed</option>
              <option value="Sara Khan">Sara Khan</option>
              <option value="Mohammad Ali">Mohammad Ali</option>
            </select>
          </div>

          <div style={{...styles.formGroup, flex: '1 1 100px'}}>
            <label style={styles.label}>Shift</label>
            <select 
              name="shift"
              value={productionData.shift}
              onChange={handleProductionChange}
              style={styles.select}
            >
              <option value="Day">Day</option>
              <option value="Night">Night</option>
              <option value="Evening">Evening</option>
            </select>
          </div>

          <div style={{...styles.formGroup, flex: '0 0 120px'}}>
            <label style={styles.label}>Expected Completion</label>
            <select 
              name="expectedCompletion"
              value={productionData.expectedCompletion}
              onChange={handleProductionChange}
              style={styles.select}
            >
              <option value="31-Mar-22">31-Mar-22</option>
              <option value="01-Apr-22">01-Apr-22</option>
              <option value="02-Apr-22">02-Apr-22</option>
            </select>
          </div>

          <div style={{...styles.formGroup, flex: '0 0 100px'}}>
            <label style={styles.label}>Status</label>
            <div style={getStatusStyle()}>
              {productionData.status}
            </div>
          </div>

          <div style={{...styles.formGroup, flex: '2 1 200px'}}>
            <label style={styles.label}>Notes</label>
            <input 
              type="text" 
              name="notes"
              value={productionData.notes}
              onChange={handleProductionChange}
              style={styles.input}
              placeholder="Production notes..."
            />
          </div>
        </div>

        {/* Tab Section */}
        <div style={styles.tabContainer}>
          <button 
            style={{...styles.tab, ...(activeTab === 'materials' ? styles.activeTab : {})}}
            onClick={() => setActiveTab('materials')}
          >
            📦 Raw Materials
          </button>
          <button 
            style={{...styles.tab, ...(activeTab === 'products' ? styles.activeTab : {})}}
            onClick={() => setActiveTab('products')}
          >
            🏭 Finished Products
          </button>
        </div>

        {/* Materials Tab Content */}
        {activeTab === 'materials' && (
          <>
            {/* Material Entry Section */}
            <div style={styles.productSection}>
              <div style={styles.entryRow}>
                <div style={styles.entryGroup}>
                  <label style={styles.label}>Material Code</label>
                  <input type="text" name="materialCode" value={materialEntry.materialCode} onChange={handleMaterialEntryChange} style={{...styles.input, width: '40px'}} />
                </div>
                
                <div style={styles.entryGroup}>
                  <label style={styles.label}>Material Name</label>
                  <select name="materialName" value={materialEntry.materialName} onChange={handleMaterialEntryChange} style={{...styles.select, width: '150px', maxWidth: '170px'}}>
                    <option value="">Select Material</option>
                    <option value="Fabric Roll">Fabric Roll</option>
                    <option value="Thread">Thread</option>
                    <option value="Zipper">Zipper</option>
                    <option value="Buttons">Buttons</option>
                    <option value="Labels">Labels</option>
                  </select>
                </div>
                
                <div style={styles.entryGroup}>
                  <label style={styles.label}>Category</label>
                  <select name="category" value={materialEntry.category} onChange={handleMaterialEntryChange} style={{...styles.select, width: '90px'}}>
                    <option value="">Select</option>
                    <option value="Raw Material">Raw Material</option>
                    <option value="Component">Component</option>
                    <option value="Packaging">Packaging</option>
                  </select>
                </div>
                
                <div style={styles.entryGroup}>
                  <label style={styles.label}>Available Stock</label>
                  <input type="text" name="availableStock" value={materialEntry.availableStock} onChange={handleMaterialEntryChange} style={{...styles.input, width: '70px', backgroundColor: '#ffffcc', fontWeight: 'bold'}} readOnly />
                </div>
                
                <div style={styles.entryGroup}>
                  <label style={styles.label}>Required Qty</label>
                  <input type="text" name="requiredQty" value={materialEntry.requiredQty} onChange={handleMaterialEntryChange} style={{...styles.input, width: '60px'}} />
                </div>
                
                <div style={styles.entryGroup}>
                  <label style={styles.label}>UOM</label>
                  <select name="uom" value={materialEntry.uom} onChange={handleMaterialEntryChange} style={{...styles.select, width: '50px'}}>
                    <option value="PC">PC</option>
                    <option value="MTR">MTR</option>
                    <option value="KG">KG</option>
                    <option value="ROLL">ROLL</option>
                  </select>
                </div>

                <div style={styles.entryGroup}>
                  <label style={styles.label}>Cost/Unit</label>
                  <input type="text" name="cost" value={materialEntry.cost} onChange={handleMaterialEntryChange} style={{...styles.input, width: '70px'}} placeholder="0.00" />
                </div>

                <div style={styles.entryGroup}>
                  <label style={styles.label}>Total Cost</label>
                  <input type="text" name="totalCost" value={materialEntry.totalCost} onChange={handleMaterialEntryChange} style={{...styles.input, width: '80px', backgroundColor: '#e8f4f8', fontWeight: 'bold'}} readOnly />
                </div>
                
                <div style={styles.entryGroup}>
                  <label style={styles.label}>Remarks</label>
                  <input type="text" name="remarks" value={materialEntry.remarks} onChange={handleMaterialEntryChange} style={{...styles.input, width: '120px', maxWidth: '150px'}} placeholder="Material notes..." />
                </div>
              </div>
            </div>

            {/* Material Action Buttons */}
            <div style={styles.stockRow}>
              <button style={styles.btn} onClick={handleReset}>Reset</button>
              <button style={styles.btn} onClick={handleAddMaterial}>Add Material</button>
              <button style={styles.btn} onClick={handleUpdateMaterial}>Update Material</button>
              <button style={styles.btn} onClick={handleRemoveMaterial}>Remove Material</button>
            </div>

            {/* Materials Table */}
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Sr#</th>
                    <th style={styles.th}>Code</th>
                    <th style={styles.th}>Material Name</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Available Stock</th>
                    <th style={styles.th}>Required Qty</th>
                    <th style={styles.th}>UOM</th>
                    <th style={styles.th}>Cost/Unit</th>
                    <th style={styles.th}>Total Cost</th>
                    <th style={styles.th}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{...styles.td, textAlign: 'center', padding: '20px'}}>No materials added</td>
                    </tr>
                  ) : (
                    materials.map((material, index) => (
                      <tr 
                        key={index} 
                        style={{
                          ...styles.clickableRow,
                          ...(editMaterialIndex === index ? styles.selectedRow : {})
                        }}
                        onClick={() => handleMaterialRowClick(index)}
                      >
                        <td style={styles.td}>{material.sr}</td>
                        <td style={styles.td}>{material.materialCode}</td>
                        <td style={styles.tdLeft}>{material.materialName}</td>
                        <td style={styles.td}>{material.category}</td>
                        <td style={styles.td}>{material.availableStock}</td>
                        <td style={styles.td}>{material.requiredQty}</td>
                        <td style={styles.td}>{material.uom}</td>
                        <td style={styles.td}>${material.cost}</td>
                        <td style={styles.td}>${material.totalCost}</td>
                        <td style={styles.tdLeft}>{material.remarks}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Products Tab Content */}
        {activeTab === 'products' && (
          <>
            {/* Product Entry Section */}
            <div style={styles.productSection}>
              <div style={styles.entryRow}>
                <div style={styles.entryGroup}>
                  <label style={styles.label}>Product Code</label>
                  <input type="text" name="productCode" value={productEntry.productCode} onChange={handleProductEntryChange} style={{...styles.input, width: '40px'}} />
                </div>
                
                <div style={styles.entryGroup}>
                  <label style={styles.label}>Product Name</label>
                  <select name="productName" value={productEntry.productName} onChange={handleProductEntryChange} style={{...styles.select, width: '150px', maxWidth: '170px'}}>
                    <option value="">Select Product</option>
                    <option value="Track Suit">Track Suit</option>
                    <option value="T-Shirt">T-Shirt</option>
                    <option value="Jeans">Jeans</option>
                    <option value="Jacket">Jacket</option>
                  </select>
                </div>
                
                <div style={styles.entryGroup}>
                  <label style={styles.label}>Category</label>
                  <select name="category" value={productEntry.category} onChange={handleProductEntryChange} style={{...styles.select, width: '90px'}}>
                    <option value="">Select</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Footwear">Footwear</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                
                <div style={styles.entryGroup}>
                  <label style={styles.label}>Planned Qty</label>
                  <input type="text" name="plannedQty" value={productEntry.plannedQty} onChange={handleProductEntryChange} style={{...styles.input, width: '70px'}} />
                </div>
                
                <div style={styles.entryGroup}>
                  <label style={styles.label}>Produced Qty</label>
                  <input type="text" name="producedQty" value={productEntry.producedQty} onChange={handleProductEntryChange} style={{...styles.input, width: '60px'}} />
                </div>
                
                <div style={styles.entryGroup}>
                  <label style={styles.label}>UOM</label>
                  <select name="uom" value={productEntry.uom} onChange={handleProductEntryChange} style={{...styles.select, width: '50px'}}>
                    <option value="PC">PC</option>
                    <option value="BOX">BOX</option>
                    <option value="SET">SET</option>
                  </select>
                </div>

                <div style={styles.entryGroup}>
                  <label style={styles.label}>Quality Status</label>
                  <select name="qualityStatus" value={productEntry.qualityStatus} onChange={handleProductEntryChange} style={{...styles.select, width: '90px'}}>
                    <option value="Good">Good</option>
                    <option value="Defective">Defective</option>
                    <option value="Rework">Rework</option>
                  </select>
                </div>
                
                <div style={styles.entryGroup}>
                  <label style={styles.label}>Remarks</label>
                  <input type="text" name="remarks" value={productEntry.remarks} onChange={handleProductEntryChange} style={{...styles.input, width: '120px', maxWidth: '150px'}} placeholder="Product notes..." />
                </div>
              </div>
            </div>

            {/* Product Action Buttons */}
            <div style={styles.stockRow}>
              <button style={styles.btn} onClick={handleReset}>Reset</button>
              <button style={styles.btn} onClick={handleAddProduct}>Add Product</button>
              <button style={styles.btn} onClick={handleUpdateProduct}>Update Product</button>
              <button style={styles.btn} onClick={handleRemoveProduct}>Remove Product</button>
            </div>

            {/* Products Table */}
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Sr#</th>
                    <th style={styles.th}>Code</th>
                    <th style={styles.th}>Product Name</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Planned Qty</th>
                    <th style={styles.th}>Produced Qty</th>
                    <th style={styles.th}>UOM</th>
                    <th style={styles.th}>Quality Status</th>
                    <th style={styles.th}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{...styles.td, textAlign: 'center', padding: '20px'}}>No products added</td>
                    </tr>
                  ) : (
                    products.map((product, index) => (
                      <tr 
                        key={index} 
                        style={{
                          ...styles.clickableRow,
                          ...(editProductIndex === index ? styles.selectedRow : {})
                        }}
                        onClick={() => handleProductRowClick(index)}
                      >
                        <td style={styles.td}>{product.sr}</td>
                        <td style={styles.td}>{product.productCode}</td>
                        <td style={styles.tdLeft}>{product.productName}</td>
                        <td style={styles.td}>{product.category}</td>
                        <td style={styles.td}>{product.plannedQty}</td>
                        <td style={styles.td}>{product.producedQty}</td>
                        <td style={styles.td}>{product.uom}</td>
                        <td style={{...styles.td, ...getQualityStyle(product.qualityStatus)}}>
                          {product.qualityStatus}
                        </td>
                        <td style={styles.tdLeft}>{product.remarks}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Summary Section */}
        <div style={styles.summarySection}>
          <div style={styles.summaryBox}>
            <label style={styles.label}>Total Materials</label>
            <input type="text" value={summaryData.totalMaterials} style={{...styles.input, fontWeight: 'bold', backgroundColor: '#e8f4f8'}} readOnly />
          </div>
          
          <div style={styles.summaryBox}>
            <label style={styles.label}>Total Products</label>
            <input type="text" value={summaryData.totalProducts} style={{...styles.input, fontWeight: 'bold', backgroundColor: '#ffffcc'}} readOnly />
          </div>

          <div style={styles.summaryBox}>
            <label style={styles.label}>Total Material Cost</label>
            <input type="text" value={`$${summaryData.totalMaterialCost}`} style={{...styles.input, fontWeight: 'bold', backgroundColor: '#ffcccc'}} readOnly />
          </div>

          <div style={styles.summaryBox}>
            <label style={styles.label}>Total Production Qty</label>
            <input type="text" value={summaryData.totalProductionQty} style={{...styles.input, fontWeight: 'bold', backgroundColor: '#ccffcc'}} readOnly />
          </div>
          
          <div style={styles.summaryBox}>
            <label style={styles.label}>Production Status</label>
            <input type="text" value={productionData.status} style={{
              ...styles.input, 
              fontWeight: 'bold', 
              backgroundColor: productionData.status === 'Completed' ? '#ccffcc' : 
                            productionData.status === 'In Progress' ? '#cce5ff' : 
                            productionData.status === 'Paused' ? '#fff8cc' : '#e6ccff'
            }} readOnly />
          </div>
        </div>

        {/* Action Bar */}
        <div style={styles.actionBar}>
          <button style={styles.actionBtn}>🔄 Refresh</button>
          <button style={styles.actionBtn} onClick={handleSave}>💾 Save</button>
          <button style={styles.actionBtn}>✏️ Update</button>
          <button style={styles.actionBtn}>🗑️ Delete</button>
          <button style={styles.actionBtn}>🖨️ Print Production</button>
          <button style={{...styles.actionBtn, backgroundColor: '#007bff'}} onClick={handleStartProduction}>🏭 Start Production</button>
          <button style={{...styles.actionBtn, backgroundColor: '#ffc107', color: '#000'}} onClick={handlePauseProduction}>⏸️ Pause</button>
          <button style={{...styles.actionBtn, backgroundColor: '#28a745'}} onClick={handleCompleteProduction}>✅ Complete</button>
          <button style={{...styles.actionBtn, marginLeft: 'auto', backgroundColor: '#d32f2f'}}>❌ Close</button>
        </div>
      </div>
    </div>
  );
};

export default Production;