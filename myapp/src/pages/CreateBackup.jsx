import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const CreateBackup = () => {
  const [formData, setFormData] = useState({
    orderNumber: '',
    date: '',
    deliveryDate: '',
    customer: '',
    salesPerson: '',
    advancedPayment: 0
  });

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [customersRes, nextOrderRes] = await Promise.all([
        api.get('/customers'),
        api.get('/sale-orders/next-order-number')
      ]);

      setCustomers(customersRes.data);
      setFormData(prev => ({
        ...prev,
        orderNumber: nextOrderRes.data.data.orderNumber,
        date: new Date().toISOString().split('T')[0],
        deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now
      }));
    } catch (err) {
      setError('Failed to load initial data');
      console.error('Error fetching initial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const containerStyle = {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '20px',
    color: '#333'
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '20px'
  };

  const inputStyle = {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '20px'
  };

  const thStyle = {
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    padding: '12px',
    textAlign: 'left',
    fontWeight: 'bold'
  };

  const tdStyle = {
    border: '1px solid #dee2e6',
    padding: '12px',
    textAlign: 'left'
  };

  const buttonStyle = {
    padding: '10px 20px',
    margin: '5px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  };

  const primaryButton = {
    ...buttonStyle,
    backgroundColor: '#007bff',
    color: 'white'
  };

  const secondaryButton = {
    ...buttonStyle,
    backgroundColor: '#6c757d',
    color: 'white'
  };

  const dangerButton = {
    ...buttonStyle,
    backgroundColor: '#dc3545',
    color: 'white'
  };

  const successButton = {
    ...buttonStyle,
    backgroundColor: '#28a745',
    color: 'white'
  };

  const addProduct = () => {
    const newProduct = {
      code: '',
      product: '',
      description: '',
      qty: 0,
      uom: '',
      pc: '',
      rate: 0,
      amt: 0,
      discPercent: 0,
      disc: 0,
      net: 0
    };
    setProducts([...products, newProduct]);
  };

  const updateProduct = (index, field, value) => {
    const updatedProducts = [...products];
    updatedProducts[index][field] = value;

    // Calculate amount and net
    if (field === 'qty' || field === 'rate') {
      const qty = parseFloat(updatedProducts[index].qty) || 0;
      const rate = parseFloat(updatedProducts[index].rate) || 0;
      const discPercent = parseFloat(updatedProducts[index].discPercent) || 0;

      const amount = qty * rate;
      const discount = amount * (discPercent / 100);
      const net = amount - discount;

      updatedProducts[index].amt = amount;
      updatedProducts[index].disc = discount;
      updatedProducts[index].net = net;
    }

    if (field === 'discPercent') {
      const amount = parseFloat(updatedProducts[index].amt) || 0;
      const discPercent = parseFloat(value) || 0;
      const discount = amount * (discPercent / 100);
      const net = amount - discount;

      updatedProducts[index].disc = discount;
      updatedProducts[index].net = net;
    }

    setProducts(updatedProducts);
  };

  const removeProduct = (index) => {
    const updatedProducts = products.filter((_, i) => i !== index);
    setProducts(updatedProducts);
  };

  const resetForm = () => {
    setProducts([]);
    setFormData({
      orderNumber: '',
      date: new Date().toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      customer: '',
      salesPerson: '',
      advancedPayment: 0
    });
    fetchInitialData(); // Refresh order number
  };

  const calculateTotals = () => {
    const totals = products.reduce((acc, product) => {
      acc.quantity += parseFloat(product.qty) || 0;
      acc.amount += parseFloat(product.amt) || 0;
      acc.discount += parseFloat(product.disc) || 0;
      acc.net += parseFloat(product.net) || 0;
      return acc;
    }, { quantity: 0, amount: 0, discount: 0, net: 0 });

    return totals;
  };

  const totals = calculateTotals();
  const remainingAmount = totals.net - (parseFloat(formData.advancedPayment) || 0);

  const handleSave = async () => {
    if (!formData.orderNumber || !formData.date || !formData.deliveryDate || !formData.customer) {
      setError('Please fill in all required fields');
      return;
    }

    if (products.length === 0) {
      setError('Please add at least one product');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const orderData = {
        orderNumber: formData.orderNumber,
        date: formData.date,
        deliveryDate: formData.deliveryDate,
        customer: formData.customer,
        customerDetails: {
          code: '',
          phone: '',
          address: '',
          location: ''
        },
        salesPerson: formData.salesPerson,
        products: products,
        advancedPayment: parseFloat(formData.advancedPayment) || 0
      };

      await api.post('/sale-orders', orderData);
      setSuccess('Sale order created successfully!');
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create sale order');
      console.error('Error creating sale order:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    // Implementation for update functionality
    setError('Update functionality not implemented yet');
  };

  const handleDelete = async () => {
    // Implementation for delete functionality
    setError('Delete functionality not implemented yet');
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1>Sale Order</h1>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          backgroundColor: '#d4edda',
          color: '#155724',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #c3e6cb'
        }}>
          {success}
        </div>
      )}

      {/* Order Information */}
      <div style={cardStyle}>
        <div style={gridStyle}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Order #
            </label>
            <input
              style={inputStyle}
              value={formData.orderNumber}
              onChange={(e) => setFormData({...formData, orderNumber: e.target.value})}
              disabled={isLoading}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Date
            </label>
            <input
              style={inputStyle}
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              disabled={isLoading}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Delivery Date
            </label>
            <input
              style={inputStyle}
              type="date"
              value={formData.deliveryDate}
              onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
              disabled={isLoading}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Customer Name
            </label>
            <select
              style={inputStyle}
              value={formData.customer}
              onChange={(e) => setFormData({...formData, customer: e.target.value})}
              disabled={isLoading}
            >
              <option value="">Select Customer</option>
              {customers.map(customer => (
                <option key={customer._id} value={customer._id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={gridStyle}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Code
            </label>
            <input style={inputStyle} disabled={isLoading} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Phone
            </label>
            <input style={inputStyle} disabled={isLoading} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Address
            </label>
            <input style={inputStyle} disabled={isLoading} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Location
            </label>
            <input style={inputStyle} disabled={isLoading} />
          </div>
        </div>

        <div style={{ width: '100%' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Sales Person
          </label>
          <input
            style={{...inputStyle, width: '100%'}}
            value={formData.salesPerson}
            onChange={(e) => setFormData({...formData, salesPerson: e.target.value})}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Product Entry */}
      <div style={cardStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Code</label>
            <input style={{...inputStyle, padding: '5px'}} disabled={isLoading} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Product</label>
            <input style={{...inputStyle, padding: '5px'}} disabled={isLoading} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Description</label>
            <input style={{...inputStyle, padding: '5px'}} disabled={isLoading} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Qty</label>
            <input style={{...inputStyle, padding: '5px'}} type="number" disabled={isLoading} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>UOM</label>
            <input style={{...inputStyle, padding: '5px'}} disabled={isLoading} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>PC</label>
            <input style={{...inputStyle, padding: '5px'}} disabled={isLoading} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Rate</label>
            <input style={{...inputStyle, padding: '5px'}} type="number" disabled={isLoading} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Amt</label>
            <input style={{...inputStyle, padding: '5px'}} type="number" readOnly disabled={isLoading} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Disc%</label>
            <input style={{...inputStyle, padding: '5px'}} type="number" disabled={isLoading} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Disc</label>
            <input style={{...inputStyle, padding: '5px'}} type="number" readOnly disabled={isLoading} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Net</label>
            <input style={{...inputStyle, padding: '5px'}} type="number" readOnly disabled={isLoading} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button style={secondaryButton} onClick={resetForm} disabled={isLoading}>Reset</button>
          <button style={primaryButton} onClick={addProduct} disabled={isLoading}>Add</button>
          <button style={successButton} onClick={handleUpdate} disabled={isLoading}>Update</button>
          <button style={dangerButton} onClick={handleDelete} disabled={isLoading}>Remove</button>
        </div>
      </div>

      {/* Products Table */}
      <div style={cardStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>$#</th>
              <th style={thStyle}>Code</th>
              <th style={thStyle}>Product</th>
              <th style={thStyle}>Description</th>
              <th style={thStyle}>Qty</th>
              <th style={thStyle}>UOM</th>
              <th style={thStyle}>Rate</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>Disc%</th>
              <th style={thStyle}>Discount</th>
              <th style={thStyle}>Net</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td style={{...tdStyle, textAlign: 'center'}} colSpan="11">
                  No products added
                </td>
              </tr>
            ) : (
              products.map((product, index) => (
                <tr key={index}>
                  <td style={tdStyle}>{index + 1}</td>
                  <td style={tdStyle}>
                    <input
                      style={{...inputStyle, border: 'none', width: '100%'}}
                      value={product.code}
                      onChange={(e) => updateProduct(index, 'code', e.target.value)}
                      disabled={isLoading}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      style={{...inputStyle, border: 'none', width: '100%'}}
                      value={product.product}
                      onChange={(e) => updateProduct(index, 'product', e.target.value)}
                      disabled={isLoading}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      style={{...inputStyle, border: 'none', width: '100%'}}
                      value={product.description}
                      onChange={(e) => updateProduct(index, 'description', e.target.value)}
                      disabled={isLoading}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      style={{...inputStyle, border: 'none', width: '100%'}}
                      type="number"
                      value={product.qty}
                      onChange={(e) => updateProduct(index, 'qty', e.target.value)}
                      disabled={isLoading}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      style={{...inputStyle, border: 'none', width: '100%'}}
                      value={product.uom}
                      onChange={(e) => updateProduct(index, 'uom', e.target.value)}
                      disabled={isLoading}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      style={{...inputStyle, border: 'none', width: '100%'}}
                      type="number"
                      value={product.rate}
                      onChange={(e) => updateProduct(index, 'rate', e.target.value)}
                      disabled={isLoading}
                    />
                  </td>
                  <td style={tdStyle}>{product.amt.toFixed(2)}</td>
                  <td style={tdStyle}>
                    <input
                      style={{...inputStyle, border: 'none', width: '100%'}}
                      type="number"
                      value={product.discPercent}
                      onChange={(e) => updateProduct(index, 'discPercent', e.target.value)}
                      disabled={isLoading}
                    />
                  </td>
                  <td style={tdStyle}>{product.disc.toFixed(2)}</td>
                  <td style={tdStyle}>{product.net.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Totals and Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Totals Section */}
        <div style={cardStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ fontWeight: 'bold' }}>Total Quantity</div>
            <div>{totals.quantity}</div>

            <div style={{ fontWeight: 'bold' }}>Total Amount</div>
            <div>${totals.amount.toFixed(2)}</div>

            <div style={{ fontWeight: 'bold' }}>Total Discount</div>
            <div>${totals.discount.toFixed(2)}</div>

            <div style={{ fontWeight: 'bold' }}>Net Amount</div>
            <div>${totals.net.toFixed(2)}</div>

            <div style={{ fontWeight: 'bold' }}>Advanced Payment</div>
            <div>
              <input
                style={{...inputStyle, width: '100%'}}
                type="number"
                value={formData.advancedPayment}
                onChange={(e) => setFormData({...formData, advancedPayment: e.target.value})}
                disabled={isLoading}
              />
            </div>

            <div style={{ fontWeight: 'bold' }}>Remaining Amount</div>
            <div>${remainingAmount.toFixed(2)}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{...cardStyle, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
            <button style={secondaryButton} disabled={isLoading}>Rotroch</button>
            <button style={successButton} onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </button>
            <button style={primaryButton} disabled={isLoading}>Update</button>
            <button style={dangerButton} disabled={isLoading}>Delete</button>
            <button style={secondaryButton} disabled={isLoading}>Print</button>
            <button style={secondaryButton} disabled={isLoading}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBackup;
