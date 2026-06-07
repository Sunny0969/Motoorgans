import React, { useState } from 'react';

const PurchaseAdd = () => {
  const [purchaseData, setPurchaseData] = useState({
    purchaseNumber: 'PUR-2022-125',
    date: '29-Mar-22',
    purchaseDate: '30-Mar-22',
    supplier: '',
    supplierInvoice: '',
    paymentMethod: 'Cash',
    paymentStatus: 'Pending',
    purchaseType: 'Goods',
    warehouse: '',
    receivedBy: '',
    approvedBy: '',
    status: 'Draft',
    notes: ''
  });

  const [itemEntry, setItemEntry] = useState({
    itemCode: '',
    itemName: '',
    batchNumber: '',
    category: '',
    quantity: '',
    uom: 'PC',
    unitCost: '',
    sellingPrice: '',
    discount: '0',
    taxRate: '0',
    lineTotal: '0',
    expiryDate: '',
    remarks: ''
  });

  const [items, setItems] = useState([]);
  const [editIndex, setEditIndex] = useState(null);

  const [summaryData, setSummaryData] = useState({
    totalItems: '0',
    totalQuantity: '0',
    subtotal: '0.00',
    totalDiscount: '0.00',
    totalTax: '0.00',
    grandTotal: '0.00',
    totalCost: '0.00'
  });

  const handlePurchaseChange = (e) => {
    const { name, value } = e.target;
    setPurchaseData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemEntryChange = (e) => {
    const { name, value } = e.target;
    setItemEntry(prev => {
      const updated = {
        ...prev,
        [name]: value
      };
      
      // Calculate line total when quantity, unit cost, discount, or tax changes
      if (name === 'quantity' || name === 'unitCost' || name === 'discount' || name === 'taxRate') {
        const qty = parseFloat(updated.quantity) || 0;
        const unitCost = parseFloat(updated.unitCost) || 0;
        const discount = parseFloat(updated.discount) || 0;
        const taxRate = parseFloat(updated.taxRate) || 0;
        
        const baseAmount = qty * unitCost;
        const discountAmount = (baseAmount * discount) / 100;
        const amountAfterDiscount = baseAmount - discountAmount;
        const taxAmount = (amountAfterDiscount * taxRate) / 100;
        const lineTotal = amountAfterDiscount + taxAmount;
        
        updated.lineTotal = lineTotal.toFixed(2);
      }
      
      return updated;
    });
  };

  const calculateTotals = (itemsList) => {
    const totalItems = itemsList.length;
    const totalQuantity = itemsList.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
    const subtotal = itemsList.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const unitCost = parseFloat(item.unitCost) || 0;
      return sum + (qty * unitCost);
    }, 0);
    
    const totalDiscount = itemsList.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const unitCost = parseFloat(item.unitCost) || 0;
      const discount = parseFloat(item.discount) || 0;
      return sum + ((qty * unitCost * discount) / 100);
    }, 0);
    
    const totalTax = itemsList.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const unitCost = parseFloat(item.unitCost) || 0;
      const discount = parseFloat(item.discount) || 0;
      const taxRate = parseFloat(item.taxRate) || 0;
      const baseAmount = qty * unitCost;
      const discountAmount = (baseAmount * discount) / 100;
      const amountAfterDiscount = baseAmount - discountAmount;
      return sum + ((amountAfterDiscount * taxRate) / 100);
    }, 0);
    
    const grandTotal = subtotal - totalDiscount + totalTax;
    const totalCost = itemsList.reduce((sum, item) => sum + (parseFloat(item.lineTotal) || 0), 0);
    
    setSummaryData({
      totalItems: totalItems.toString(),
      totalQuantity: totalQuantity.toString(),
      subtotal: subtotal.toFixed(2),
      totalDiscount: totalDiscount.toFixed(2),
      totalTax: totalTax.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
      totalCost: totalCost.toFixed(2)
    });
  };

  const handleAddItem = () => {
    if (!itemEntry.itemName || !itemEntry.quantity || !itemEntry.unitCost) {
      alert('Please fill item name, quantity, and unit cost');
      return;
    }

    const quantity = parseFloat(itemEntry.quantity) || 0;
    const unitCost = parseFloat(itemEntry.unitCost) || 0;

    if (quantity <= 0) {
      alert('Quantity must be greater than zero!');
      return;
    }

    if (unitCost <= 0) {
      alert('Unit cost must be greater than zero!');
      return;
    }

    const newItem = {
      sr: items.length + 1,
      ...itemEntry
    };

    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    calculateTotals(updatedItems);
    resetItemEntry();
  };

  const handleUpdateItem = () => {
    if (editIndex === null) {
      alert('Please select an item to update');
      return;
    }

    const quantity = parseFloat(itemEntry.quantity) || 0;
    const unitCost = parseFloat(itemEntry.unitCost) || 0;

    if (quantity <= 0) {
      alert('Quantity must be greater than zero!');
      return;
    }

    if (unitCost <= 0) {
      alert('Unit cost must be greater than zero!');
      return;
    }

    const updatedItems = [...items];
    updatedItems[editIndex] = {
      ...updatedItems[editIndex],
      ...itemEntry
    };
    
    setItems(updatedItems);
    calculateTotals(updatedItems);
    resetItemEntry();
    setEditIndex(null);
  };

  const handleRemoveItem = () => {
    if (editIndex === null) {
      alert('Please select an item to remove');
      return;
    }

    const updatedItems = items.filter((_, index) => index !== editIndex);
    const reNumbered = updatedItems.map((item, idx) => ({ ...item, sr: idx + 1 }));
    
    setItems(reNumbered);
    calculateTotals(reNumbered);
    resetItemEntry();
    setEditIndex(null);
  };

  const handleRowClick = (index) => {
    setEditIndex(index);
    setItemEntry(items[index]);
  };

  const resetItemEntry = () => {
    setItemEntry({
      itemCode: '',
      itemName: '',
      batchNumber: '',
      category: '',
      quantity: '',
      uom: 'PC',
      unitCost: '',
      sellingPrice: '',
      discount: '0',
      taxRate: '0',
      lineTotal: '0',
      expiryDate: '',
      remarks: ''
    });
  };

  const handleReset = () => {
    resetItemEntry();
    setEditIndex(null);
  };

  const handleSave = () => {
    if (items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    if (!purchaseData.supplier || !purchaseData.warehouse) {
      alert('Please select Supplier and Warehouse');
      return;
    }
    
    const purchase = {
      ...purchaseData,
      items,
      summary: summaryData
    };
    
    console.log('Saved Purchase:', purchase);
    alert('Purchase saved successfully!');
  };

  const handleSubmit = () => {
    if (items.length === 0) {
      alert('No items to submit');
      return;
    }
    setPurchaseData(prev => ({ ...prev, status: 'Submitted' }));
    alert('Purchase submitted for approval!');
  };

  const handleApprove = () => {
    if (items.length === 0) {
      alert('No items to approve');
      return;
    }
    if (purchaseData.status !== 'Submitted') {
      alert('Purchase must be submitted before approval');
      return;
    }
    setPurchaseData(prev => ({ ...prev, status: 'Approved' }));
    alert('Purchase approved!');
  };

  const handleReceive = () => {
    if (items.length === 0) {
      alert('No items to receive');
      return;
    }
    if (purchaseData.status !== 'Approved') {
      alert('Purchase must be approved before receiving');
      return;
    }
    setPurchaseData(prev => ({ 
      ...prev, 
      status: 'Received',
      paymentStatus: 'Paid'
    }));
    alert('Purchase items received and marked as paid!');
  };

  const handlePay = () => {
    if (items.length === 0) {
      alert('No items to pay for');
      return;
    }
    setPurchaseData(prev => ({ ...prev, paymentStatus: 'Paid' }));
    alert('Payment recorded successfully!');
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
    supplierBox: {
      padding: '8px',
      backgroundColor: '#fff3cd',
      border: '2px solid #ffc107',
      borderRadius: '4px',
      marginBottom: '8px',
      boxSizing: 'border-box'
    },
    supplierRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: 'clamp(11px, 1.4vw, 13px)',
      fontWeight: 'bold',
      flexWrap: 'wrap',
      gap: '10px'
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
      minWidth: '1300px',
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
    totalsSection: {
      padding: '10px',
      backgroundColor: '#f8f9fa',
      borderTop: '2px solid #dee2e6',
      boxSizing: 'border-box'
    },
    totalRow: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '20px',
      alignItems: 'center',
      marginBottom: '5px',
      fontSize: 'clamp(10px, 1.3vw, 12px)'
    },
    totalLabel: {
      fontWeight: 'bold',
      minWidth: '120px',
      textAlign: 'right'
    },
    totalValue: {
      fontWeight: 'bold',
      minWidth: '100px',
      textAlign: 'right',
      padding: '5px 10px',
      backgroundColor: '#e8e8e8',
      border: '1px solid #999'
    },
    grandTotal: {
      fontSize: 'clamp(12px, 1.5vw, 14px)',
      color: '#d32f2f',
      backgroundColor: '#ffcccc !important'
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
    switch(purchaseData.status) {
      case 'Received':
        return { ...styles.statusBadge, backgroundColor: '#28a745', color: 'white' };
      case 'Approved':
        return { ...styles.statusBadge, backgroundColor: '#17a2b8', color: 'white' };
      case 'Submitted':
        return { ...styles.statusBadge, backgroundColor: '#ffc107', color: '#000' };
      case 'Draft':
        return { ...styles.statusBadge, backgroundColor: '#6c757d', color: 'white' };
      default:
        return { ...styles.statusBadge, backgroundColor: '#6c757d', color: 'white' };
    }
  };

  const getPaymentStatusStyle = () => {
    switch(purchaseData.paymentStatus) {
      case 'Paid':
        return { ...styles.statusBadge, backgroundColor: '#28a745', color: 'white' };
      case 'Partial':
        return { ...styles.statusBadge, backgroundColor: '#ffc107', color: '#000' };
      case 'Pending':
        return { ...styles.statusBadge, backgroundColor: '#dc3545', color: 'white' };
      default:
        return { ...styles.statusBadge, backgroundColor: '#6c757d', color: 'white' };
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.header}>Add Purchase</div>
        
        {/* Supplier Details Display */}
        {purchaseData.supplier && (
          <div style={{padding: '10px'}}>
            <div style={styles.supplierBox}>
              <div style={styles.supplierRow}>
                <span>Supplier: <strong>{purchaseData.supplier}</strong></span>
                <span>Invoice: <strong>{purchaseData.supplierInvoice}</strong></span>
                <span>Warehouse: <strong>{purchaseData.warehouse}</strong></span>
                <span>Payment: <strong>{purchaseData.paymentMethod}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Top Section - Purchase Details */}
        <div style={styles.topSection}>
          <div style={{...styles.formGroup, flex: '0 0 120px'}}>
            <label style={styles.label}>Purchase #</label>
            <input 
              type="text" 
              name="purchaseNumber"
              value={purchaseData.purchaseNumber}
              onChange={handlePurchaseChange}
              style={styles.inputBlue}
            />
          </div>

          <div style={{...styles.formGroup, flex: '0 0 110px'}}>
            <label style={styles.label}>Date</label>
            <select 
              name="date"
              value={purchaseData.date}
              onChange={handlePurchaseChange}
              style={styles.select}
            >
              <option value="29-Mar-22">29-Mar-22</option>
              <option value="30-Mar-22">30-Mar-22</option>
            </select>
          </div>

          <div style={{...styles.formGroup, flex: '0 0 110px'}}>
            <label style={styles.label}>Purchase Date</label>
            <select 
              name="purchaseDate"
              value={purchaseData.purchaseDate}
              onChange={handlePurchaseChange}
              style={styles.select}
            >
              <option value="30-Mar-22">30-Mar-22</option>
              <option value="31-Mar-22">31-Mar-22</option>
              <option value="01-Apr-22">01-Apr-22</option>
            </select>
          </div>

          <div style={{...styles.formGroup, flex: '1 1 150px'}}>
            <label style={styles.label}>Supplier *</label>
            <select 
              name="supplier"
              value={purchaseData.supplier}
              onChange={handlePurchaseChange}
              style={styles.select}
            >
              <option value="">Select Supplier</option>
              <option value="ABC Textiles Ltd.">ABC Textiles Ltd.</option>
              <option value="Global Fabrics Inc.">Global Fabrics Inc.</option>
              <option value="Prime Materials Co.">Prime Materials Co.</option>
              <option value="Quick Supplies">Quick Supplies</option>
            </select>
          </div>

          <div style={{...styles.formGroup, flex: '1 1 130px'}}>
            <label style={styles.label}>Supplier Invoice</label>
            <input 
              type="text" 
              name="supplierInvoice"
              value={purchaseData.supplierInvoice}
              onChange={handlePurchaseChange}
              style={styles.input}
              placeholder="Invoice #"
            />
          </div>

          <div style={{...styles.formGroup, flex: '1 1 120px'}}>
            <label style={styles.label}>Payment Method</label>
            <select 
              name="paymentMethod"
              value={purchaseData.paymentMethod}
              onChange={handlePurchaseChange}
              style={styles.select}
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Credit">Credit</option>
            </select>
          </div>

          <div style={{...styles.formGroup, flex: '1 1 120px'}}>
            <label style={styles.label}>Payment Status</label>
            <div style={getPaymentStatusStyle()}>
              {purchaseData.paymentStatus}
            </div>
          </div>

          <div style={{...styles.formGroup, flex: '1 1 120px'}}>
            <label style={styles.label}>Purchase Type</label>
            <select 
              name="purchaseType"
              value={purchaseData.purchaseType}
              onChange={handlePurchaseChange}
              style={styles.select}
            >
              <option value="Goods">Goods</option>
              <option value="Services">Services</option>
              <option value="Assets">Assets</option>
              <option value="Consumables">Consumables</option>
            </select>
          </div>

          <div style={{...styles.formGroup, flex: '1 1 140px'}}>
            <label style={styles.label}>Warehouse *</label>
            <select 
              name="warehouse"
              value={purchaseData.warehouse}
              onChange={handlePurchaseChange}
              style={styles.select}
            >
              <option value="">Select Warehouse</option>
              <option value="Main Warehouse">Main Warehouse</option>
              <option value="Store A">Store A</option>
              <option value="Store B">Store B</option>
              <option value="Cold Storage">Cold Storage</option>
            </select>
          </div>

          <div style={{...styles.formGroup, flex: '1 1 120px'}}>
            <label style={styles.label}>Received By</label>
            <select 
              name="receivedBy"
              value={purchaseData.receivedBy}
              onChange={handlePurchaseChange}
              style={styles.select}
            >
              <option value="">Select Person</option>
              <option value="Ali Ahmed">Ali Ahmed</option>
              <option value="Sara Khan">Sara Khan</option>
              <option value="Mohammad Ali">Mohammad Ali</option>
            </select>
          </div>

          <div style={{...styles.formGroup, flex: '1 1 120px'}}>
            <label style={styles.label}>Approved By</label>
            <select 
              name="approvedBy"
              value={purchaseData.approvedBy}
              onChange={handlePurchaseChange}
              style={styles.select}
            >
              <option value="">Select Approver</option>
              <option value="Store Manager">Store Manager</option>
              <option value="Purchase Manager">Purchase Manager</option>
              <option value="Director">Director</option>
            </select>
          </div>

          <div style={{...styles.formGroup, flex: '0 0 100px'}}>
            <label style={styles.label}>Status</label>
            <div style={getStatusStyle()}>
              {purchaseData.status}
            </div>
          </div>

          <div style={{...styles.formGroup, flex: '2 1 200px'}}>
            <label style={styles.label}>Notes</label>
            <input 
              type="text" 
              name="notes"
              value={purchaseData.notes}
              onChange={handlePurchaseChange}
              style={styles.input}
              placeholder="Purchase notes..."
            />
          </div>
        </div>

        {/* Item Entry Section */}
        <div style={styles.productSection}>
          <div style={styles.entryRow}>
            <div style={styles.entryGroup}>
              <label style={styles.label}>Item Code</label>
              <input type="text" name="itemCode" value={itemEntry.itemCode} onChange={handleItemEntryChange} style={{...styles.input, width: '40px'}} />
            </div>
            
            <div style={styles.entryGroup}>
              <label style={styles.label}>Item Name *</label>
              <select name="itemName" value={itemEntry.itemName} onChange={handleItemEntryChange} style={{...styles.select, width: '150px', maxWidth: '170px'}}>
                <option value="">Select Item</option>
                <option value="Cotton Fabric">Cotton Fabric</option>
                <option value="Polyester Material">Polyester Material</option>
                <option value="Thread Roll">Thread Roll</option>
                <option value="Zippers">Zippers</option>
                <option value="Buttons">Buttons</option>
                <option value="Labels">Labels</option>
                <option value="Packaging Boxes">Packaging Boxes</option>
                <option value="T-Shirt">T-Shirt</option>
                <option value="Jeans">Jeans</option>
                <option value="Jacket">Jacket</option>
              </select>
            </div>
            
            <div style={styles.entryGroup}>
              <label style={styles.label}>Batch No.</label>
              <input type="text" name="batchNumber" value={itemEntry.batchNumber} onChange={handleItemEntryChange} style={{...styles.input, width: '80px'}} placeholder="BATCH001" />
            </div>
            
            <div style={styles.entryGroup}>
              <label style={styles.label}>Category</label>
              <select name="category" value={itemEntry.category} onChange={handleItemEntryChange} style={{...styles.select, width: '90px'}}>
                <option value="">Select</option>
                <option value="Raw Material">Raw Material</option>
                <option value="Finished Goods">Finished Goods</option>
                <option value="Components">Components</option>
                <option value="Packaging">Packaging</option>
                <option value="Consumables">Consumables</option>
              </select>
            </div>
            
            <div style={styles.entryGroup}>
              <label style={styles.label}>Quantity *</label>
              <input type="text" name="quantity" value={itemEntry.quantity} onChange={handleItemEntryChange} style={{...styles.input, width: '60px'}} />
            </div>
            
            <div style={styles.entryGroup}>
              <label style={styles.label}>UOM</label>
              <select name="uom" value={itemEntry.uom} onChange={handleItemEntryChange} style={{...styles.select, width: '50px'}}>
                <option value="PC">PC</option>
                <option value="MTR">MTR</option>
                <option value="KG">KG</option>
                <option value="ROLL">ROLL</option>
                <option value="BOX">BOX</option>
                <option value="SET">SET</option>
              </select>
            </div>

            <div style={styles.entryGroup}>
              <label style={styles.label}>Unit Cost *</label>
              <input type="text" name="unitCost" value={itemEntry.unitCost} onChange={handleItemEntryChange} style={{...styles.input, width: '70px'}} placeholder="0.00" />
            </div>

            <div style={styles.entryGroup}>
              <label style={styles.label}>Selling Price</label>
              <input type="text" name="sellingPrice" value={itemEntry.sellingPrice} onChange={handleItemEntryChange} style={{...styles.input, width: '70px'}} placeholder="0.00" />
            </div>

            <div style={styles.entryGroup}>
              <label style={styles.label}>Discount %</label>
              <input type="text" name="discount" value={itemEntry.discount} onChange={handleItemEntryChange} style={{...styles.input, width: '50px'}} placeholder="0" />
            </div>

            <div style={styles.entryGroup}>
              <label style={styles.label}>Tax Rate %</label>
              <select name="taxRate" value={itemEntry.taxRate} onChange={handleItemEntryChange} style={{...styles.select, width: '60px'}}>
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="10">10%</option>
                <option value="15">15%</option>
              </select>
            </div>

            <div style={styles.entryGroup}>
              <label style={styles.label}>Expiry Date</label>
              <input type="text" name="expiryDate" value={itemEntry.expiryDate} onChange={handleItemEntryChange} style={{...styles.input, width: '80px'}} placeholder="DD-MMM-YY" />
            </div>

            <div style={styles.entryGroup}>
              <label style={styles.label}>Line Total</label>
              <input type="text" name="lineTotal" value={itemEntry.lineTotal} onChange={handleItemEntryChange} style={{...styles.input, width: '80px', backgroundColor: '#e8f4f8', fontWeight: 'bold'}} readOnly />
            </div>
            
            <div style={styles.entryGroup}>
              <label style={styles.label}>Remarks</label>
              <input type="text" name="remarks" value={itemEntry.remarks} onChange={handleItemEntryChange} style={{...styles.input, width: '120px', maxWidth: '150px'}} placeholder="Item notes..." />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={styles.stockRow}>
          <button style={styles.btn} onClick={handleReset}>Reset</button>
          <button style={styles.btn} onClick={handleAddItem}>Add Item</button>
          <button style={styles.btn} onClick={handleUpdateItem}>Update Item</button>
          <button style={styles.btn} onClick={handleRemoveItem}>Remove Item</button>
        </div>

        {/* Items Table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Sr#</th>
                <th style={styles.th}>Code</th>
                <th style={styles.th}>Item Name</th>
                <th style={styles.th}>Batch No.</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Quantity</th>
                <th style={styles.th}>UOM</th>
                <th style={styles.th}>Unit Cost</th>
                <th style={styles.th}>Selling Price</th>
                <th style={styles.th}>Discount %</th>
                <th style={styles.th}>Tax Rate %</th>
                <th style={styles.th}>Expiry Date</th>
                <th style={styles.th}>Line Total</th>
                <th style={styles.th}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="14" style={{...styles.td, textAlign: 'center', padding: '20px'}}>No items added to purchase</td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr 
                    key={index} 
                    style={{
                      ...styles.clickableRow,
                      ...(editIndex === index ? styles.selectedRow : {})
                    }}
                    onClick={() => handleRowClick(index)}
                  >
                    <td style={styles.td}>{item.sr}</td>
                    <td style={styles.td}>{item.itemCode}</td>
                    <td style={styles.tdLeft}>{item.itemName}</td>
                    <td style={styles.td}>{item.batchNumber}</td>
                    <td style={styles.td}>{item.category}</td>
                    <td style={styles.td}>{item.quantity}</td>
                    <td style={styles.td}>{item.uom}</td>
                    <td style={styles.td}>${item.unitCost}</td>
                    <td style={styles.td}>${item.sellingPrice}</td>
                    <td style={styles.td}>{item.discount}%</td>
                    <td style={styles.td}>{item.taxRate}%</td>
                    <td style={styles.td}>{item.expiryDate}</td>
                    <td style={styles.td}>${item.lineTotal}</td>
                    <td style={styles.tdLeft}>{item.remarks}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Section */}
        <div style={styles.summarySection}>
          <div style={styles.summaryBox}>
            <label style={styles.label}>Total Items</label>
            <input type="text" value={summaryData.totalItems} style={{...styles.input, fontWeight: 'bold', backgroundColor: '#e8f4f8'}} readOnly />
          </div>
          
          <div style={styles.summaryBox}>
            <label style={styles.label}>Total Quantity</label>
            <input type="text" value={summaryData.totalQuantity} style={{...styles.input, fontWeight: 'bold', backgroundColor: '#ffffcc'}} readOnly />
          </div>

          <div style={styles.summaryBox}>
            <label style={styles.label}>Purchase Status</label>
            <input type="text" value={purchaseData.status} style={{
              ...styles.input, 
              fontWeight: 'bold', 
              backgroundColor: purchaseData.status === 'Received' ? '#ccffcc' : 
                            purchaseData.status === 'Approved' ? '#cce5ff' : 
                            purchaseData.status === 'Submitted' ? '#fff8cc' : '#e8e8e8'
            }} readOnly />
          </div>

          <div style={styles.summaryBox}>
            <label style={styles.label}>Payment Status</label>
            <input type="text" value={purchaseData.paymentStatus} style={{
              ...styles.input, 
              fontWeight: 'bold', 
              backgroundColor: purchaseData.paymentStatus === 'Paid' ? '#ccffcc' : 
                            purchaseData.paymentStatus === 'Partial' ? '#fff8cc' : '#ffcccc'
            }} readOnly />
          </div>
        </div>

        {/* Totals Section */}
        <div style={styles.totalsSection}>
          <div style={styles.totalRow}>
            <div style={styles.totalLabel}>Subtotal:</div>
            <div style={styles.totalValue}>${summaryData.subtotal}</div>
          </div>
          <div style={styles.totalRow}>
            <div style={styles.totalLabel}>Total Discount:</div>
            <div style={styles.totalValue}>-${summaryData.totalDiscount}</div>
          </div>
          <div style={styles.totalRow}>
            <div style={styles.totalLabel}>Total Tax:</div>
            <div style={styles.totalValue}>+${summaryData.totalTax}</div>
          </div>
          <div style={styles.totalRow}>
            <div style={styles.totalLabel}>Total Cost:</div>
            <div style={{...styles.totalValue, ...styles.grandTotal}}>${summaryData.totalCost}</div>
          </div>
        </div>

        {/* Action Bar */}
        <div style={styles.actionBar}>
          <button style={styles.actionBtn}>🔄 Refresh</button>
          <button style={styles.actionBtn} onClick={handleSave}>💾 Save</button>
          <button style={styles.actionBtn}>✏️ Update</button>
          <button style={styles.actionBtn}>🗑️ Delete</button>
          <button style={styles.actionBtn}>🖨️ Print</button>
          <button style={{...styles.actionBtn, backgroundColor: '#007bff'}} onClick={handleSubmit}>📤 Submit</button>
          <button style={{...styles.actionBtn, backgroundColor: '#ffc107', color: '#000'}} onClick={handleApprove}>✓ Approve</button>
          <button style={{...styles.actionBtn, backgroundColor: '#17a2b8'}} onClick={handleReceive}>📦 Receive</button>
          <button style={{...styles.actionBtn, backgroundColor: '#28a745'}} onClick={handlePay}>💰 Pay Now</button>
          <button style={{...styles.actionBtn, marginLeft: 'auto', backgroundColor: '#d32f2f'}}>❌ Close</button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseAdd;