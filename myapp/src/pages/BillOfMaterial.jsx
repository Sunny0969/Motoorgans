// src/pages/BillOfMaterial.js
import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const BillOfMaterial = () => {
  const [bomItems, setBomItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    productName: '',
    productCode: '',
    description: '',
    category: 'Food',
    cost: '',
    sellingPrice: '',
    components: [{ item: '', quantity: '', unit: '', cost: '' }],
    status: 'Active'
  });

  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [showComponents, setShowComponents] = useState({});

  const categories = ['All', 'Food', 'Beverages', 'Food Combo', 'Desserts', 'Other'];
  const units = ['pc', 'grams', 'ml', 'portion', 'set', 'bottle', 'pack'];

  // Fetch BOM items on component mount
  useEffect(() => {
    fetchBOMItems();
  }, []);

  const fetchBOMItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bom');
      setBomItems(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch BOM items');
      console.error('Error fetching BOM items:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter BOM items
  const filteredBomItems = bomItems.filter(item =>
    (filterCategory === 'All' || item.category === filterCategory) &&
    (item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleComponentChange = (index, field, value) => {
    const updatedComponents = [...formData.components];
    updatedComponents[index][field] = value;

    // Auto-calculate total cost if all component fields are filled
    if (field === 'cost' && updatedComponents[index].quantity && updatedComponents[index].item) {
      const totalCost = updatedComponents.reduce((sum, comp) => {
        return sum + (parseFloat(comp.cost) || 0) * (parseFloat(comp.quantity) || 0);
      }, 0);
      setFormData(prev => ({ ...prev, components: updatedComponents, cost: totalCost.toFixed(2) }));
    } else {
      setFormData(prev => ({ ...prev, components: updatedComponents }));
    }
  };

  const addComponent = () => {
    setFormData(prev => ({
      ...prev,
      components: [...prev.components, { item: '', quantity: '', unit: '', cost: '' }]
    }));
  };

  const removeComponent = (index) => {
    if (formData.components.length > 1) {
      const updatedComponents = formData.components.filter((_, i) => i !== index);
      const totalCost = updatedComponents.reduce((sum, comp) => {
        return sum + (parseFloat(comp.cost) || 0) * (parseFloat(comp.quantity) || 0);
      }, 0);
      setFormData(prev => ({ ...prev, components: updatedComponents, cost: totalCost.toFixed(2) }));
    }
  };

  const calculateProfit = (cost, sellingPrice) => {
    if (!cost || !sellingPrice) return { amount: 0, percentage: 0 };
    const profit = sellingPrice - cost;
    const percentage = (profit / cost) * 100;
    return { amount: profit, percentage: percentage };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Calculate total cost from components
    const totalCost = formData.components.reduce((sum, comp) => {
      return sum + (parseFloat(comp.cost) || 0) * (parseFloat(comp.quantity) || 0);
    }, 0);

    const bomData = {
      ...formData,
      cost: parseFloat(totalCost.toFixed(2)),
      sellingPrice: parseFloat(formData.sellingPrice)
    };

    if (editingId) {
      setBomItems(bomItems.map(item => 
        item.id === editingId ? { ...bomData, id: editingId } : item
      ));
      setEditingId(null);
    } else {
      const newBomItem = {
        id: Math.max(...bomItems.map(b => b.id)) + 1,
        ...bomData
      };
      setBomItems([...bomItems, newBomItem]);
    }
    
    setFormData({
      productName: '',
      productCode: '',
      description: '',
      category: 'Food',
      cost: '',
      sellingPrice: '',
      components: [{ item: '', quantity: '', unit: '', cost: '' }],
      status: 'Active'
    });
  };

  const handleEdit = (item) => {
    setFormData({
      productName: item.productName,
      productCode: item.productCode,
      description: item.description,
      category: item.category,
      cost: item.cost,
      sellingPrice: item.sellingPrice,
      components: item.components,
      status: item.status
    });
    setEditingId(item.id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this BOM item?')) {
      setBomItems(bomItems.filter(item => item.id !== id));
    }
  };

  const handleCancel = () => {
    setFormData({
      productName: '',
      productCode: '',
      description: '',
      category: 'Food',
      cost: '',
      sellingPrice: '',
      components: [{ item: '', quantity: '', unit: '', cost: '' }],
      status: 'Active'
    });
    setEditingId(null);
  };

  const getStatusColor = (status) => {
    return status === 'Active' ? '#28a745' : '#dc3545';
  };

  const toggleComponents = (id) => {
    setShowComponents(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
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
                Bill of Materials
              </h1>
              <p style={{ 
                color: '#666', 
                margin: 0,
                fontSize: '14px'
              }}>
                Manage product recipes, ingredients, and cost calculations
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
                  placeholder="Search products..."
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
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
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
              {editingId ? 'Edit BOM Item' : 'Add New BOM Item'}
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
                  Product Name *
                </label>
                <input
                  type="text"
                  name="productName"
                  value={formData.productName}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  placeholder="Enter product name"
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
                  Product Code *
                </label>
                <input
                  type="text"
                  name="productCode"
                  value={formData.productCode}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  placeholder="Enter product code"
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
                  <option value="Food">Food</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Food Combo">Food Combo</option>
                  <option value="Desserts">Desserts</option>
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
                  rows="2"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                  placeholder="Enter product description"
                />
              </div>

              {/* Components Section */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <label style={{ 
                    fontWeight: '600',
                    color: '#333',
                    fontSize: '14px'
                  }}>
                    Components/Ingredients *
                  </label>
                  <button
                    type="button"
                    onClick={addComponent}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    + Add Component
                  </button>
                </div>
                
                {formData.components.map((component, index) => (
                  <div key={index} style={{ 
                    border: '1px solid #e9ecef', 
                    borderRadius: '4px', 
                    padding: '10px', 
                    marginBottom: '8px',
                    backgroundColor: '#f8f9fa'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: '#666' }}>Item</label>
                        <input
                          type="text"
                          value={component.item}
                          onChange={(e) => handleComponentChange(index, 'item', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}
                          placeholder="Item name"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#666' }}>Qty</label>
                        <input
                          type="number"
                          value={component.quantity}
                          onChange={(e) => handleComponentChange(index, 'quantity', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}
                          placeholder="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#666' }}>Unit</label>
                        <select
                          value={component.unit}
                          onChange={(e) => handleComponentChange(index, 'unit', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '12px',
                            backgroundColor: 'white'
                          }}
                        >
                          {units.map(unit => (
                            <option key={unit} value={unit}>{unit}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#666' }}>Cost</label>
                        <input
                          type="number"
                          value={component.cost}
                          onChange={(e) => handleComponentChange(index, 'cost', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}
                          placeholder="0.00"
                          step="0.01"
                        />
                      </div>
                      {formData.components.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeComponent(index)}
                          style={{
                            padding: '6px 8px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            height: 'fit-content'
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
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
                    Total Cost
                  </label>
                  <input
                    type="number"
                    name="cost"
                    value={formData.cost}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: '#e9ecef'
                    }}
                    placeholder="Auto-calculated"
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
                    Selling Price *
                  </label>
                  <input
                    type="number"
                    name="sellingPrice"
                    value={formData.sellingPrice}
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

              {formData.cost && formData.sellingPrice && (
                <div style={{ 
                  backgroundColor: '#e7f3ff', 
                  padding: '10px', 
                  borderRadius: '4px', 
                  marginBottom: '15px',
                  border: '1px solid #b3d9ff'
                }}>
                  <div style={{ fontSize: '12px', color: '#0066cc' }}>
                    <strong>Profit:</strong> ${calculateProfit(parseFloat(formData.cost), parseFloat(formData.sellingPrice)).amount.toFixed(2)} 
                    ({calculateProfit(parseFloat(formData.cost), parseFloat(formData.sellingPrice)).percentage.toFixed(1)}%)
                  </div>
                </div>
              )}

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
                  {editingId ? 'Update' : 'Add BOM'}
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
                BOM Items
              </h3>
              <div style={{
                backgroundColor: '#e9ecef',
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#495057'
              }}>
                {filteredBomItems.length} of {bomItems.length}
              </div>
            </div>

            {filteredBomItems.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px',
                color: '#6c757d'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>📋</div>
                <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>
                  {searchTerm ? 'No BOM items found' : 'No BOM items configured'}
                </h4>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  {searchTerm ? 'Try adjusting your search or filters' : 'Add your first BOM item using the form'}
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
                        Product
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
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#333',
                        borderBottom: '2px solid #dee2e6'
                      }}>
                        Cost
                      </th>
                      <th style={{ 
                        padding: '12px', 
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#333',
                        borderBottom: '2px solid #dee2e6'
                      }}>
                        Price
                      </th>
                      <th style={{ 
                        padding: '12px', 
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#333',
                        borderBottom: '2px solid #dee2e6'
                      }}>
                        Profit
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
                        width: '120px'
                      }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBomItems.map((item, index) => {
                      const profit = calculateProfit(item.cost, item.sellingPrice);
                      return (
                        <React.Fragment key={item.id}>
                          <tr style={{ 
                            borderBottom: '1px solid #dee2e6',
                            cursor: 'pointer'
                          }}
                          onClick={() => toggleComponents(item.id)}
                          >
                            <td style={{ 
                              padding: '12px', 
                              color: '#333',
                              fontWeight: '500'
                            }}>
                              <div>
                                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                                  {item.productName}
                                </div>
                                <div style={{ 
                                  fontSize: '12px', 
                                  color: '#6c757d'
                                }}>
                                  {item.category} • {item.components.length} components
                                </div>
                                {item.description && (
                                  <div style={{ 
                                    fontSize: '12px', 
                                    color: '#6c757d',
                                    fontStyle: 'italic',
                                    marginTop: '2px'
                                  }}>
                                    {item.description}
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
                                {item.productCode}
                              </span>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#dc3545' }}>
                              ${item.cost.toFixed(2)}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#28a745' }}>
                              ${item.sellingPrice.toFixed(2)}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '500',
                                backgroundColor: profit.amount >= 0 ? '#d4edda' : '#f8d7da',
                                color: profit.amount >= 0 ? '#155724' : '#721c24'
                              }}>
                                ${profit.amount.toFixed(2)}
                              </span>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '500',
                                backgroundColor: getStatusColor(item.status) + '20',
                                color: getStatusColor(item.status)
                              }}>
                                {item.status}
                              </span>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(item);
                                  }}
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(item.id);
                                  }}
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
                          {showComponents[item.id] && (
                            <tr>
                              <td colSpan="7" style={{ padding: '0', backgroundColor: '#f8f9fa' }}>
                                <div style={{ padding: '15px', borderTop: '1px solid #dee2e6' }}>
                                  <h5 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#495057' }}>
                                    Components:
                                  </h5>
                                  <div style={{ display: 'grid', gap: '8px' }}>
                                    {item.components.map((comp, compIndex) => (
                                      <div key={compIndex} style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '8px',
                                        backgroundColor: 'white',
                                        borderRadius: '4px',
                                        border: '1px solid #e9ecef'
                                      }}>
                                        <span style={{ fontWeight: '500' }}>{comp.item}</span>
                                        <span style={{ color: '#6c757d', fontSize: '13px' }}>
                                          {comp.quantity} {comp.unit} × ${comp.cost} = ${(comp.quantity * comp.cost).toFixed(2)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
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
            About Bill of Materials
          </h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '15px',
            fontSize: '14px',
            color: '#666'
          }}>
            <div>
              <strong>Purpose:</strong> Define product recipes and calculate accurate costs 
              for menu items in your POS system.
            </div>
            <div>
              <strong>Usage:</strong> Track ingredients, calculate food costs, 
              and maintain consistent product quality across locations.
            </div>
            <div>
              <strong>Benefits:</strong> Accurate pricing, inventory management, 
              and profit margin analysis for each product.
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
          
          .component-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          
          .component-grid > div:last-child {
            grid-column: 1 / -1;
          }
        }
        
        @media (max-width: 480px) {
          .component-grid {
            grid-template-columns: 1fr !important;
          }
          
          table {
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

export default BillOfMaterial;