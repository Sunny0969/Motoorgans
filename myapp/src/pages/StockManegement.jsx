import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const StockManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [liveProducts, setLiveProducts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const loadStock = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const response = await api.get('/stock');
        const mapped = response.data.map((row) => ({
          id: row.id,
          name: row.name,
          sku: row.code,
          category: row.category,
          currentStock: row.onHandQty,
          minStock: row.reorderLevel,
          maxStock: row.openingStock,
          cost: row.purchaseRate,
          price: row.saleRate,
          supplier: row.company,
          lastUpdated: '',
          status: row.onHandQty <= 0 ? 'out-of-stock' : row.onHandQty <= (row.reorderLevel || 0) ? 'low-stock' : 'in-stock',
          salesRate: 'medium',
        }));
        setLiveProducts(mapped);
      } catch (err) {
        setFetchError('Failed to load stock from the database.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadStock();
  }, []);

  // Sample stock data
  const stockData = {
    summary: {
      totalProducts: 156,
      lowStockItems: 12,
      outOfStock: 3,
      totalValue: 125800.75,
      categories: 8,
      suppliers: 15
    },
    products: [
      {
        id: 1,
        name: 'iPhone 14 Pro',
        sku: 'IP14P-256-BLK',
        category: 'Electronics',
        currentStock: 45,
        minStock: 10,
        maxStock: 100,
        cost: 899.00,
        price: 1099.00,
        supplier: 'Apple Inc.',
        lastUpdated: '2024-01-15',
        status: 'in-stock',
        salesRate: 'high'
      },
      {
        id: 2,
        name: 'Samsung Galaxy S23',
        sku: 'SGS23-128-BLU',
        category: 'Electronics',
        currentStock: 8,
        minStock: 15,
        maxStock: 50,
        cost: 649.00,
        price: 799.00,
        supplier: 'Samsung Corp',
        lastUpdated: '2024-01-14',
        status: 'low-stock',
        salesRate: 'medium'
      },
      {
        id: 3,
        name: 'MacBook Air M2',
        sku: 'MBA-M2-512',
        category: 'Computers',
        currentStock: 0,
        minStock: 5,
        maxStock: 25,
        cost: 1199.00,
        price: 1399.00,
        supplier: 'Apple Inc.',
        lastUpdated: '2024-01-13',
        status: 'out-of-stock',
        salesRate: 'high'
      },
      {
        id: 4,
        name: 'Wireless Mouse',
        sku: 'WM-LOGI-001',
        category: 'Accessories',
        currentStock: 125,
        minStock: 20,
        maxStock: 200,
        cost: 25.50,
        price: 39.99,
        supplier: 'Logitech',
        lastUpdated: '2024-01-15',
        status: 'in-stock',
        salesRate: 'medium'
      },
      {
        id: 5,
        name: 'USB-C Cable',
        sku: 'UBC-3FT-001',
        category: 'Accessories',
        currentStock: 5,
        minStock: 25,
        maxStock: 100,
        cost: 8.00,
        price: 19.99,
        supplier: 'Anker',
        lastUpdated: '2024-01-14',
        status: 'low-stock',
        salesRate: 'high'
      },
      {
        id: 6,
        name: 'Gaming Headset',
        sku: 'GH-STEEL-001',
        category: 'Audio',
        currentStock: 32,
        minStock: 10,
        maxStock: 50,
        cost: 89.00,
        price: 129.99,
        supplier: 'SteelSeries',
        lastUpdated: '2024-01-15',
        status: 'in-stock',
        salesRate: 'low'
      }
    ],
    categories: [
      { name: 'Electronics', count: 45, value: 78500.00 },
      { name: 'Computers', count: 23, value: 32500.00 },
      { name: 'Accessories', count: 65, value: 12500.00 },
      { name: 'Audio', count: 18, value: 9800.00 },
      { name: 'Mobile', count: 5, value: 4500.00 }
    ],
    lowStockItems: [
      { id: 2, name: 'Samsung Galaxy S23', current: 8, min: 15, daysToStockOut: 3 },
      { id: 5, name: 'USB-C Cable', current: 5, min: 25, daysToStockOut: 2 },
      { id: 7, name: 'iPhone Charger', current: 12, min: 30, daysToStockOut: 5 },
      { id: 9, name: 'Screen Protector', current: 8, min: 20, daysToStockOut: 4 }
    ],
    recentMovements: [
      { id: 1, product: 'iPhone 14 Pro', type: 'sale', quantity: -2, date: '2024-01-15 14:30', reference: 'SALE-001254' },
      { id: 2, product: 'USB-C Cable', type: 'purchase', quantity: 50, date: '2024-01-15 11:15', reference: 'PO-001235' },
      { id: 3, product: 'Wireless Mouse', type: 'sale', quantity: -1, date: '2024-01-15 10:45', reference: 'SALE-001253' },
      { id: 4, product: 'MacBook Air M2', type: 'return', quantity: 1, date: '2024-01-14 16:20', reference: 'RET-001045' }
    ]
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStockStatus = (product) => {
    if (product.currentStock === 0) return 'out-of-stock';
    if (product.currentStock <= product.minStock) return 'low-stock';
    return 'in-stock';
  };

  const getStatusBadge = (status) => {
    const styles = {
      'in-stock': 'success',
      'low-stock': 'warning',
      'out-of-stock': 'danger'
    };
    return `badge bg-${styles[status]}`;
  };

  const getSalesRateBadge = (rate) => {
    const styles = {
      high: 'success',
      medium: 'warning',
      low: 'secondary'
    };
    return `badge bg-${styles[rate]}`;
  };

  const calculateStockValue = (product) => {
    return product.currentStock * product.cost;
  };

  const calculateProfitMargin = (product) => {
    return ((product.price - product.cost) / product.cost * 100).toFixed(1);
  };

  const productList = liveProducts || stockData.products;
  const filteredProducts = productList.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(productList.map(product => product.category))];

  return (
    <div className="container-fluid py-3">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div>
              <h2 className="text-primary">
                <i className="fas fa-boxes-stacked me-2"></i>
                Stock
              </h2>
              <p className="text-muted mb-0">Manage inventory, track stock levels, and monitor product movement</p>
            </div>
            <div className="d-flex gap-2 mt-2 mt-md-0">
              <button className="btn btn-success">
                <i className="fas fa-plus me-1"></i> Add Product
              </button>
              <button className="btn btn-primary">
                <i className="fas fa-download me-1"></i> Export
              </button>
              <button className="btn btn-outline-secondary">
                <i className="fas fa-sync-alt me-1"></i> Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && <div className="alert alert-info">Loading stock from database...</div>}
      {fetchError && <div className="alert alert-danger">{fetchError}</div>}

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-xl-2 col-md-4 col-6 mb-3">
          <div className="card border-primary">
            <div className="card-body text-center p-3">
              <div className="text-primary mb-2">
                <i className="fas fa-cube fa-2x"></i>
              </div>
              <h5 className="card-title text-muted mb-1">Total Products</h5>
              <h3 className="text-primary">{stockData.summary.totalProducts}</h3>
            </div>
          </div>
        </div>

        <div className="col-xl-2 col-md-4 col-6 mb-3">
          <div className="card border-success">
            <div className="card-body text-center p-3">
              <div className="text-success mb-2">
                <i className="fas fa-warehouse fa-2x"></i>
              </div>
              <h5 className="card-title text-muted mb-1">Stock Value</h5>
              <h4 className="text-success">{formatCurrency(stockData.summary.totalValue)}</h4>
            </div>
          </div>
        </div>

        <div className="col-xl-2 col-md-4 col-6 mb-3">
          <div className="card border-warning">
            <div className="card-body text-center p-3">
              <div className="text-warning mb-2">
                <i className="fas fa-exclamation-triangle fa-2x"></i>
              </div>
              <h5 className="card-title text-muted mb-1">Low Stock</h5>
              <h3 className="text-warning">{stockData.summary.lowStockItems}</h3>
            </div>
          </div>
        </div>

        <div className="col-xl-2 col-md-4 col-6 mb-3">
          <div className="card border-danger">
            <div className="card-body text-center p-3">
              <div className="text-danger mb-2">
                <i className="fas fa-times-circle fa-2x"></i>
              </div>
              <h5 className="card-title text-muted mb-1">Out of Stock</h5>
              <h3 className="text-danger">{stockData.summary.outOfStock}</h3>
            </div>
          </div>
        </div>

        <div className="col-xl-2 col-md-4 col-6 mb-3">
          <div className="card border-info">
            <div className="card-body text-center p-3">
              <div className="text-info mb-2">
                <i className="fas fa-tags fa-2x"></i>
              </div>
              <h5 className="card-title text-muted mb-1">Categories</h5>
              <h3 className="text-info">{stockData.summary.categories}</h3>
            </div>
          </div>
        </div>

        <div className="col-xl-2 col-md-4 col-6 mb-3">
          <div className="card border-secondary">
            <div className="card-body text-center p-3">
              <div className="text-secondary mb-2">
                <i className="fas fa-truck fa-2x"></i>
              </div>
              <h5 className="card-title text-muted mb-1">Suppliers</h5>
              <h3 className="text-secondary">{stockData.summary.suppliers}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body py-2">
              <ul className="nav nav-pills">
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                  >
                    <i className="fas fa-chart-bar me-1"></i>
                    Overview
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'products' ? 'active' : ''}`}
                    onClick={() => setActiveTab('products')}
                  >
                    <i className="fas fa-list me-1"></i>
                    All Products
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'lowstock' ? 'active' : ''}`}
                    onClick={() => setActiveTab('lowstock')}
                  >
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    Low Stock
                    <span className="badge bg-warning ms-1">{stockData.lowStockItems.length}</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'movement' ? 'active' : ''}`}
                    onClick={() => setActiveTab('movement')}
                  >
                    <i className="fas fa-exchange-alt me-1"></i>
                    Stock Movement
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="fas fa-search"></i>
                    </span>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="Search products by name or SKU..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <select 
                    className="form-select"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <select className="form-select">
                    <option>All Status</option>
                    <option>In Stock</option>
                    <option>Low Stock</option>
                    <option>Out of Stock</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <button className="btn btn-outline-secondary w-100">
                    <i className="fas fa-filter me-1"></i> Filter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'overview' && (
        <div className="row">
          {/* Products Table */}
          <div className="col-lg-8 mb-4">
            <div className="card">
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Recent Products</h5>
                  <span className="badge bg-primary">
                    {filteredProducts.length} products
                  </span>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>Category</th>
                        <th>Stock</th>
                        <th>Cost</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.slice(0, 6).map((product) => (
                        <tr key={product.id}>
                          <td>
                            <div className="fw-bold">{product.name}</div>
                            <small className="text-muted">{product.supplier}</small>
                          </td>
                          <td className="text-muted">{product.sku}</td>
                          <td>
                            <span className="badge bg-light text-dark">{product.category}</span>
                          </td>
                          <td>
                            <div className="fw-bold">{product.currentStock}</div>
                            <div className="progress" style={{ height: '4px', width: '60px' }}>
                              <div 
                                className={`progress-bar ${
                                  getStockStatus(product) === 'in-stock' ? 'bg-success' :
                                  getStockStatus(product) === 'low-stock' ? 'bg-warning' : 'bg-danger'
                                }`}
                                style={{ 
                                  width: `${(product.currentStock / product.maxStock) * 100}%` 
                                }}
                              ></div>
                            </div>
                          </td>
                          <td className="text-danger">{formatCurrency(product.cost)}</td>
                          <td className="text-success fw-bold">{formatCurrency(product.price)}</td>
                          <td>
                            <span className={getStatusBadge(getStockStatus(product))}>
                              {getStockStatus(product).replace('-', ' ')}
                            </span>
                            <br />
                            <span className={getSalesRateBadge(product.salesRate)}>
                              {product.salesRate} sales
                            </span>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button className="btn btn-outline-primary" title="Edit">
                                <i className="fas fa-edit"></i>
                              </button>
                              <button className="btn btn-outline-success" title="Restock">
                                <i className="fas fa-boxes-packing"></i>
                              </button>
                              <button className="btn btn-outline-info" title="View Details">
                                <i className="fas fa-eye"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-lg-4 mb-4">
            {/* Low Stock Alert */}
            <div className="card border-warning mb-4">
              <div className="card-header bg-warning text-white">
                <h6 className="card-title mb-0">
                  <i className="fas fa-exclamation-triangle me-1"></i>
                  Low Stock Alert
                </h6>
              </div>
              <div className="card-body">
                {stockData.lowStockItems.slice(0, 4).map((item) => (
                  <div key={item.id} className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                    <div>
                      <div className="fw-medium small">{item.name}</div>
                      <small className="text-muted">{item.current} / {item.min} units</small>
                    </div>
                    <div className="text-end">
                      <span className="badge bg-warning">{item.daysToStockOut} days</span>
                      <button className="btn btn-sm btn-outline-primary mt-1">
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
                  </div>
                ))}
                <button className="btn btn-outline-warning btn-sm w-100 mt-2">
                  View All Low Stock Items
                </button>
              </div>
            </div>

            {/* Categories */}
            <div className="card mb-4">
              <div className="card-header">
                <h6 className="card-title mb-0">Stock by Category</h6>
              </div>
              <div className="card-body">
                {stockData.categories.map((category, index) => (
                  <div key={category.name} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="small">{category.name}</span>
                      <span className="small fw-bold">{category.count} items</span>
                    </div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div 
                        className="progress-bar"
                        style={{ 
                          width: `${(category.count / stockData.summary.totalProducts) * 100}%`,
                          backgroundColor: `hsl(${index * 60}, 70%, 45%)`
                        }}
                      ></div>
                    </div>
                    <small className="text-muted">{formatCurrency(category.value)} value</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">All Products</h5>
                  <span className="badge bg-primary">
                    {filteredProducts.length} products found
                  </span>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Product Info</th>
                        <th>Category</th>
                        <th>Stock Level</th>
                        <th>Cost & Price</th>
                        <th>Stock Value</th>
                        <th>Margin</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id}>
                          <td>
                            <div className="fw-bold">{product.name}</div>
                            <div className="text-muted small">{product.sku}</div>
                            <div className="text-muted small">{product.supplier}</div>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark">{product.category}</span>
                          </td>
                          <td>
                            <div className="fw-bold">{product.currentStock} units</div>
                            <div className="progress" style={{ height: '6px', width: '80px' }}>
                              <div 
                                className={`progress-bar ${
                                  getStockStatus(product) === 'in-stock' ? 'bg-success' :
                                  getStockStatus(product) === 'low-stock' ? 'bg-warning' : 'bg-danger'
                                }`}
                                style={{ 
                                  width: `${(product.currentStock / product.maxStock) * 100}%` 
                                }}
                              ></div>
                            </div>
                            <small className="text-muted">
                              Min: {product.minStock} | Max: {product.maxStock}
                            </small>
                          </td>
                          <td>
                            <div className="text-danger small">Cost: {formatCurrency(product.cost)}</div>
                            <div className="text-success fw-bold">Price: {formatCurrency(product.price)}</div>
                          </td>
                          <td className="fw-bold text-primary">
                            {formatCurrency(calculateStockValue(product))}
                          </td>
                          <td>
                            <span className={`badge ${
                              calculateProfitMargin(product) > 50 ? 'bg-success' :
                              calculateProfitMargin(product) > 25 ? 'bg-warning' : 'bg-info'
                            }`}>
                              {calculateProfitMargin(product)}%
                            </span>
                          </td>
                          <td>
                            <span className={getStatusBadge(getStockStatus(product))}>
                              {getStockStatus(product).replace('-', ' ')}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button className="btn btn-outline-primary" title="Edit">
                                <i className="fas fa-edit"></i>
                              </button>
                              <button className="btn btn-outline-success" title="Restock">
                                <i className="fas fa-boxes-packing"></i>
                              </button>
                              <button className="btn btn-outline-info" title="View Details">
                                <i className="fas fa-eye"></i>
                              </button>
                              <button className="btn btn-outline-danger" title="Delete">
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'lowstock' && (
        <div className="row">
          <div className="col-12">
            <div className="card border-warning">
              <div className="card-header bg-warning text-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  Low Stock Items - Requires Immediate Attention
                </h5>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Product</th>
                        <th>Current Stock</th>
                        <th>Minimum Required</th>
                        <th>Stock Deficit</th>
                        <th>Days to Stock Out</th>
                        <th>Last Ordered</th>
                        <th>Supplier</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockData.lowStockItems.map((item) => (
                        <tr key={item.id} className="table-warning">
                          <td className="fw-bold">{item.name}</td>
                          <td>
                            <span className="badge bg-danger">{item.current}</span>
                          </td>
                          <td>
                            <span className="badge bg-success">{item.min}</span>
                          </td>
                          <td>
                            <span className="badge bg-warning">{item.min - item.current}</span>
                          </td>
                          <td>
                            <span className="badge bg-danger">{item.daysToStockOut} days</span>
                          </td>
                          <td className="text-muted">2024-01-10</td>
                          <td>Supplier Name</td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button className="btn btn-success">
                                <i className="fas fa-truck me-1"></i> Order
                              </button>
                              <button className="btn btn-primary">
                                <i className="fas fa-phone me-1"></i> Call
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'movement' && (
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Recent Stock Movement</h5>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Date & Time</th>
                        <th>Product</th>
                        <th>Movement Type</th>
                        <th>Quantity</th>
                        <th>Reference</th>
                        <th>User</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockData.recentMovements.map((movement) => (
                        <tr key={movement.id}>
                          <td className="text-muted">{movement.date}</td>
                          <td className="fw-bold">{movement.product}</td>
                          <td>
                            <span className={`badge ${
                              movement.type === 'sale' ? 'bg-success' :
                              movement.type === 'purchase' ? 'bg-primary' : 'bg-warning'
                            }`}>
                              {movement.type.toUpperCase()}
                            </span>
                          </td>
                          <td className={`fw-bold ${
                            movement.quantity > 0 ? 'text-success' : 'text-danger'
                          }`}>
                            {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                          </td>
                          <td className="text-muted">{movement.reference}</td>
                          <td>John Doe</td>
                          <td>
                            <button className="btn btn-sm btn-outline-info">
                              <i className="fas fa-sticky-note"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h6 className="card-title">Quick Stock Actions</h6>
              <div className="d-flex flex-wrap gap-2">
                <button className="btn btn-success">
                  <i className="fas fa-plus me-1"></i> Add New Product
                </button>
                <button className="btn btn-primary">
                  <i className="fas fa-truck me-1"></i> Purchase Order
                </button>
                <button className="btn btn-warning">
                  <i className="fas fa-boxes-packing me-1"></i> Bulk Update
                </button>
                <button className="btn btn-info">
                  <i className="fas fa-file-export me-1"></i> Export Stock
                </button>
                <button className="btn btn-danger">
                  <i className="fas fa-trash me-1"></i> Remove Discontinued
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockManagement;