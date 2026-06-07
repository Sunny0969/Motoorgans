import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../utils/api';
import ProductSearchModal from '../components/ProductSearchModal';
import SupplierSearchModal from '../components/SupplierSearchModal';
import { usePageStatePersistence } from '../hooks/usePageStatePersistence';

const PAGE_KEY = 'sale-order';

const SaleOrder = () => {
  const [orderData, setOrderData] = useState({
    orderNumber: '101',
    date: '29-Mar-22',
    deliveryDate: '05-Apr-22',
    customer: '',
    customerCode: '',
    phone: '',
    address: '',
    location: '',
    salesPerson: ''
  });

  const [productEntry, setProductEntry] = useState({
    productCode: '',
    productName: '',
    description: '',
    qty: '',
    rate: '',
    amount: '',
    discountPercent: '',
    discount: '',
    netAmount: '',
    uom: 'PC'
  });

  const [products, setProducts] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const pageSnapshot = useMemo(() => ({
    orderData, productEntry, products, editIndex, selectedProduct, selectedCustomer,
  }), [orderData, productEntry, products, editIndex, selectedProduct, selectedCustomer]);

  const restorePageState = useCallback((cached) => {
    if (cached.orderData) setOrderData(cached.orderData);
    if (cached.productEntry) setProductEntry(cached.productEntry);
    if (cached.products) setProducts(cached.products);
    if (cached.editIndex !== undefined) setEditIndex(cached.editIndex);
    if (cached.selectedProduct !== undefined) setSelectedProduct(cached.selectedProduct);
    if (cached.selectedCustomer !== undefined) setSelectedCustomer(cached.selectedCustomer);
  }, []);

  usePageStatePersistence(PAGE_KEY, pageSnapshot, restorePageState);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await api.get('/customers');
        setCustomers(response.data);
      } catch (err) {
        console.error('Error fetching customers:', err);
      }
    };
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products');
        setProductsList(response.data);
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };
    fetchCustomers();
    fetchProducts();
  }, []);

  const handleProductSelectFromModal = (product) => {
    setSelectedProduct(product);
    setProductEntry(prev => ({
      ...prev,
      productName: product.name,
      productCode: product.code,
      rate: product.saleRate != null ? String(product.saleRate) : '',
      uom: product.uom || 'PC'
    }));
    setShowProductModal(false);
  };

  const handleCustomerSelectFromModal = (customer) => {
    setSelectedCustomer(customer);
    setOrderData(prev => ({
      ...prev,
      customer: customer.name,
      customerCode: customer.code || '',
      phone: customer.phone || '',
      address: customer.address || ''
    }));
    setShowCustomerModal(false);
  };

  const [summaryData, setSummaryData] = useState({
    totalQty: '0',
    totalAmount: '0',
    totalDiscount: '0',
    netAmount: '0',
    advancePayment: '0',
    remainingAmount: '0'
  });

  const handleOrderChange = (e) => {
    const { name, value } = e.target;
    setOrderData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProductEntryChange = (e) => {
    const { name, value } = e.target;
    setProductEntry(prev => {
      const updated = { ...prev, [name]: value };
      
      if (name === 'qty' || name === 'rate') {
        const qty = name === 'qty' ? parseFloat(value) || 0 : parseFloat(prev.qty) || 0;
        const rate = name === 'rate' ? parseFloat(value) || 0 : parseFloat(prev.rate) || 0;
        updated.amount = (qty * rate).toString();
        
        const discPercent = parseFloat(prev.discountPercent) || 0;
        const discount = (updated.amount * discPercent) / 100;
        updated.discount = discount.toString();
        updated.netAmount = (parseFloat(updated.amount) - discount).toString();
      }
      
      if (name === 'discountPercent') {
        const amount = parseFloat(prev.amount) || 0;
        const discount = (amount * parseFloat(value)) / 100;
        updated.discount = discount.toString();
        updated.netAmount = (amount - discount).toString();
      }
      
      return updated;
    });
  };

  const calculateTotals = (productsList) => {
    const totalQty = productsList.reduce((sum, p) => sum + (parseFloat(p.qty) || 0), 0);
    const totalAmount = productsList.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const totalDiscount = productsList.reduce((sum, p) => sum + (parseFloat(p.discount) || 0), 0);
    const netAmount = totalAmount - totalDiscount;
    const advancePayment = parseFloat(summaryData.advancePayment) || 0;
    const remainingAmount = netAmount - advancePayment;
    
    setSummaryData(prev => ({
      ...prev,
      totalQty: totalQty.toString(),
      totalAmount: totalAmount.toString(),
      totalDiscount: totalDiscount.toString(),
      netAmount: netAmount.toString(),
      remainingAmount: remainingAmount.toString()
    }));
  };

  const handleAdd = () => {
    if (!productEntry.productName || !productEntry.qty) {
      alert('Please fill product name and quantity');
      return;
    }

    const newProduct = {
      sr: products.length + 1,
      ...productEntry
    };

    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    calculateTotals(updatedProducts);
    resetProductEntry();
  };

  const handleUpdate = () => {
    if (editIndex === null) {
      alert('Please select a product to update');
      return;
    }

    const updatedProducts = [...products];
    updatedProducts[editIndex] = {
      ...updatedProducts[editIndex],
      ...productEntry
    };
    
    setProducts(updatedProducts);
    calculateTotals(updatedProducts);
    resetProductEntry();
    setEditIndex(null);
  };

  const handleRemove = () => {
    if (editIndex === null) {
      alert('Please select a product to remove');
      return;
    }

    const updatedProducts = products.filter((_, index) => index !== editIndex);
    const reNumbered = updatedProducts.map((p, idx) => ({ ...p, sr: idx + 1 }));
    
    setProducts(reNumbered);
    calculateTotals(reNumbered);
    resetProductEntry();
    setEditIndex(null);
  };

  const handleRowClick = (index) => {
    setEditIndex(index);
    setProductEntry(products[index]);
  };

  const resetProductEntry = () => {
    setProductEntry({
      productCode: '',
      productName: '',
      description: '',
      qty: '',
      rate: '',
      amount: '',
      discountPercent: '',
      discount: '',
      netAmount: '',
      uom: 'PC'
    });
  };

  const handleReset = () => {
    resetProductEntry();
    setEditIndex(null);
  };

  const handleSave = () => {
    if (products.length === 0) {
      alert('Please add at least one product');
      return;
    }
    
    const order = {
      ...orderData,
      products,
      summary: summaryData
    };
    
    console.log('Saved Order:', order);
    alert('Sale Order saved successfully!');
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
      minWidth: '120px'
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
      minWidth: '800px',
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

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.header}>Sale Order</div>
        
        {/* Top Section - Order Details */}
        <div style={styles.topSection}>
          <div style={{...styles.formGroup, flex: '0 0 80px'}}>
            <label style={styles.label}>Order #</label>
            <input 
              type="text" 
              name="orderNumber"
              value={orderData.orderNumber}
              onChange={handleOrderChange}
              style={styles.inputBlue}
            />
          </div>

          <div style={{...styles.formGroup, flex: '0 0 110px'}}>
            <label style={styles.label}>Date</label>
            <select 
              name="date"
              value={orderData.date}
              onChange={handleOrderChange}
              style={styles.select}
            >
              <option value="29-Mar-22">29-Mar-22</option>
              <option value="30-Mar-22">30-Mar-22</option>
            </select>
          </div>

          <div style={{...styles.formGroup, flex: '0 0 110px'}}>
            <label style={styles.label}>Delivery Date</label>
            <select 
              name="deliveryDate"
              value={orderData.deliveryDate}
              onChange={handleOrderChange}
              style={styles.select}
            >
              <option value="05-Apr-22">05-Apr-22</option>
              <option value="10-Apr-22">10-Apr-22</option>
            </select>
          </div>

          <div style={{...styles.formGroup, flex: '1 1 150px'}}>
            <label style={styles.label}>Customer Name</label>
            <div style={{ display: 'flex', gap: '3px' }}>
              <input type="text" value={orderData.customer} readOnly onClick={() => setShowCustomerModal(true)} style={{...styles.input, width: '150px', cursor: 'pointer'}} placeholder="Click to select" />
              <button onClick={() => setShowCustomerModal(true)} style={{ padding: '2px 6px', border: '1px solid #999', backgroundColor: '#f0f0f0', fontSize: '12px', cursor: 'pointer' }}>...</button>
            </div>
          </div>

          <div style={{...styles.formGroup, flex: '0 0 100px'}}>
            <label style={styles.label}>Code</label>
            <input 
              type="text" 
              name="customerCode"
              value={orderData.customerCode}
              onChange={handleOrderChange}
              style={styles.input}
            />
          </div>

          <div style={{...styles.formGroup, flex: '1 1 130px'}}>
            <label style={styles.label}>Phone</label>
            <input 
              type="text" 
              name="phone"
              value={orderData.phone}
              onChange={handleOrderChange}
              style={styles.input}
            />
          </div>

          <div style={{...styles.formGroup, flex: '1 1 200px'}}>
            <label style={styles.label}>Address</label>
            <input 
              type="text" 
              name="address"
              value={orderData.address}
              onChange={handleOrderChange}
              style={styles.input}
            />
          </div>

          <div style={{...styles.formGroup, flex: '0 0 100px'}}>
            <label style={styles.label}>Location</label>
            <select 
              name="location"
              value={orderData.location}
              onChange={handleOrderChange}
              style={styles.select}
            >
              <option value=""></option>
              <option value="Main">Main</option>
            </select>
          </div>

          <div style={{...styles.formGroup, flex: '1 1 130px'}}>
            <label style={styles.label}>Sales Person</label>
            <select 
              name="salesPerson"
              value={orderData.salesPerson}
              onChange={handleOrderChange}
              style={styles.select}
            >
              <option value=""></option>
              <option value="Ali">Ali</option>
              <option value="Ahmed">Ahmed</option>
            </select>
          </div>
        </div>

        {/* Product Entry Section */}
        <div style={styles.productSection}>
          <div style={styles.entryRow}>
            <div style={styles.entryGroup}>
              <label style={styles.label}>Code</label>
              <input type="text" name="productCode" value={productEntry.productCode} onChange={handleProductEntryChange} style={{...styles.input, width: '40px'}} />
            </div>
            
            <div style={styles.entryGroup}>
              <label style={styles.label}>Product</label>
              <div style={{ display: 'flex', gap: '3px' }}>
                <input type="text" value={productEntry.productName} readOnly onClick={() => setShowProductModal(true)} style={{...styles.input, width: '140px', cursor: 'pointer'}} placeholder="Click to select" />
                <button onClick={() => setShowProductModal(true)} style={{ padding: '2px 6px', border: '1px solid #999', backgroundColor: '#f0f0f0', fontSize: '12px', cursor: 'pointer' }}>...</button>
              </div>
            </div>
            
            <div style={styles.entryGroup}>
              <label style={styles.label}>Description</label>
              <input type="text" name="description" value={productEntry.description} onChange={handleProductEntryChange} style={{...styles.input, width: '100px', maxWidth: '130px'}} />
            </div>
            
            <div style={styles.entryGroup}>
              <label style={styles.label}>Qty</label>
              <input type="text" name="qty" value={productEntry.qty} onChange={handleProductEntryChange} style={{...styles.input, width: '45px'}} />
            </div>
            
            <div style={styles.entryGroup}>
              <label style={styles.label}>UOM</label>
              <select name="uom" value={productEntry.uom} onChange={handleProductEntryChange} style={{...styles.select, width: '50px'}}>
                <option value="PC">PC</option>
                <option value="KG">KG</option>
              </select>
            </div>
            
            <div style={styles.entryGroup}>
              <label style={styles.label}>Rate</label>
              <input type="text" name="rate" value={productEntry.rate} onChange={handleProductEntryChange} style={{...styles.input, width: '50px'}} />
            </div>
            
            <div style={styles.entryGroup}>
              <label style={styles.label}>Amt</label>
              <input type="text" name="amount" value={productEntry.amount} onChange={handleProductEntryChange} style={{...styles.input, width: '60px'}} readOnly />
            </div>
            
            <div style={styles.entryGroup}>
              <label style={styles.label}>Disc%</label>
              <input type="text" name="discountPercent" value={productEntry.discountPercent} onChange={handleProductEntryChange} style={{...styles.input, width: '40px'}} />
            </div>
            
            <div style={styles.entryGroup}>
              <label style={styles.label}>Disc</label>
              <input type="text" name="discount" value={productEntry.discount} onChange={handleProductEntryChange} style={{...styles.input, width: '50px'}} readOnly />
            </div>
            
            <div style={styles.entryGroup}>
              <label style={styles.label}>Net</label>
              <input type="text" name="netAmount" value={productEntry.netAmount} onChange={handleProductEntryChange} style={{...styles.input, width: '60px'}} readOnly />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={styles.stockRow}>
          <button style={styles.btn} onClick={handleReset}>Reset</button>
          <button style={styles.btn} onClick={handleAdd}>Add</button>
          <button style={styles.btn} onClick={handleUpdate}>Update</button>
          <button style={styles.btn} onClick={handleRemove}>Remove</button>
        </div>

        {/* Products Table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Sr#</th>
                <th style={styles.th}>Code</th>
                <th style={styles.th}>Product</th>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Qty</th>
                <th style={styles.th}>UOM</th>
                <th style={styles.th}>Rate</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Disc%</th>
                <th style={styles.th}>Discount</th>
                <th style={styles.th}>Net</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{...styles.td, textAlign: 'center', padding: '20px'}}>No products added</td>
                </tr>
              ) : (
                products.map((product, index) => (
                  <tr 
                    key={index} 
                    style={{
                      ...styles.clickableRow,
                      ...(editIndex === index ? styles.selectedRow : {})
                    }}
                    onClick={() => handleRowClick(index)}
                  >
                    <td style={styles.td}>{product.sr}</td>
                    <td style={styles.td}>{product.productCode}</td>
                    <td style={styles.tdLeft}>{product.productName}</td>
                    <td style={styles.tdLeft}>{product.description}</td>
                    <td style={styles.td}>{product.qty}</td>
                    <td style={styles.td}>{product.uom}</td>
                    <td style={styles.td}>{product.rate}</td>
                    <td style={styles.td}>{product.amount}</td>
                    <td style={styles.td}>{product.discountPercent}</td>
                    <td style={styles.td}>{product.discount}</td>
                    <td style={styles.td}>{product.netAmount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Section */}
        <div style={styles.summarySection}>
          <div style={styles.summaryBox}>
            <label style={styles.label}>Total Quantity</label>
            <input type="text" value={summaryData.totalQty} style={{...styles.input, fontWeight: 'bold'}} readOnly />
          </div>
          <div style={styles.summaryBox}>
            <label style={styles.label}>Total Amount</label>
            <input type="text" value={summaryData.totalAmount} style={{...styles.input, fontWeight: 'bold'}} readOnly />
          </div>
          <div style={styles.summaryBox}>
            <label style={styles.label}>Total Discount</label>
            <input type="text" value={summaryData.totalDiscount} style={{...styles.input, fontWeight: 'bold'}} readOnly />
          </div>
          <div style={styles.summaryBox}>
            <label style={styles.label}>Net Amount</label>
            <input type="text" value={summaryData.netAmount} style={{...styles.input, fontWeight: 'bold', backgroundColor: '#ffffcc'}} readOnly />
          </div>
          <div style={styles.summaryBox}>
            <label style={styles.label}>Advance Payment</label>
            <input 
              type="text" 
              name="advancePayment"
              value={summaryData.advancePayment}
              onChange={(e) => {
                setSummaryData(prev => {
                  const advance = parseFloat(e.target.value) || 0;
                  const net = parseFloat(prev.netAmount) || 0;
                  return {
                    ...prev,
                    advancePayment: e.target.value,
                    remainingAmount: (net - advance).toString()
                  };
                });
              }}
              style={styles.input}
            />
          </div>
          <div style={styles.summaryBox}>
            <label style={styles.label}>Remaining Amount</label>
            <input type="text" value={summaryData.remainingAmount} style={{...styles.input, fontWeight: 'bold', backgroundColor: '#ffcccc'}} readOnly />
          </div>
        </div>

        {/* Action Bar */}
        <div style={styles.actionBar}>
          <button style={styles.actionBtn}>🔄 Refresh</button>
          <button style={styles.actionBtn} onClick={handleSave}>💾 Save</button>
          <button style={styles.actionBtn}>✏️ Update</button>
          <button style={styles.actionBtn}>🗑️ Delete</button>
          <button style={styles.actionBtn}>🖨️ Print</button>
          <button style={{...styles.actionBtn, marginLeft: 'auto', backgroundColor: '#d32f2f'}}>❌ Close</button>
        </div>
      </div>

      <ProductSearchModal isOpen={showProductModal} onClose={() => setShowProductModal(false)} onSelectProduct={handleProductSelectFromModal} selectedProduct={selectedProduct} rateType="sale" />
      <SupplierSearchModal isOpen={showCustomerModal} onClose={() => setShowCustomerModal(false)} onSelectSupplier={handleCustomerSelectFromModal} selectedSupplier={selectedCustomer} type="customer" />
    </div>
  );
};

export default SaleOrder;