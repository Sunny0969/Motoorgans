import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import api from '../utils/api';
import { companyKey, companyColorStyle } from '../utils/companyColor';

const ProductSearchModal = ({ isOpen, onClose, onSelectProduct, selectedProduct, rateType = 'purchase' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [products, setProducts] = useState([]);
  const [companyRecords, setCompanyRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const listRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const [productsRes, companiesRes] = await Promise.all([
          api.get('/products'),
          api.get('/companies', { params: { limit: 5000 } }),
        ]);
        setProducts(productsRes.data);
        setCompanyRecords(Array.isArray(companiesRes.data?.entries) ? companiesRes.data.entries : []);
      } catch (err) {
        const detail = err.response?.data?.message || err.message || 'Network error';
        setError(`Failed to load products. Is the backend running? (${detail})`);
        setProducts([]);
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [isOpen]);

  const companyColorMap = useMemo(() => {
    const map = {};
    companyRecords.forEach((c) => {
      const key = companyKey(c.name);
      if (key) map[key] = c.color;
    });
    return map;
  }, [companyRecords]);

  const getCompanyCellStyle = useCallback((companyName, rowHighlighted) => {
    const colorStyle = companyColorStyle(companyName, companyColorMap);
    if (colorStyle) {
      return {
        padding: '6px 8px',
        borderRight: '1px solid #ddd',
        minHeight: '100%',
        ...colorStyle,
      };
    }
    return {
      padding: '6px 8px',
      borderRight: '1px solid #ddd',
      color: rowHighlighted ? '#fff' : '#333',
    };
  }, [companyColorMap]);

  const companies = useMemo(
    () => [...new Set(products.map((p) => p.company).filter(Boolean))],
    [products]
  );

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))],
    [products]
  );

  const filteredProducts = products.filter((product) => {
    const name = (product.name || '').toLowerCase();
    const urduName = (product.urduName || product.descUrdu || '').toLowerCase();
    const code = (product.code || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    const matchesSearch = name.includes(term) || urduName.includes(term) || code.includes(term);
    const matchesCompany = !selectedCompany || product.company === selectedCompany;
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCompany && matchesCategory;
  });

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchTerm, selectedCompany, selectedCategory]);

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const rows = listRef.current.children;
      if (rows[highlightedIndex]) {
        rows[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleSelectProduct = (product) => {
    onSelectProduct(product);
    onClose();
    setSearchTerm('');
    setSelectedCompany('');
    setSelectedCategory('');
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, filteredProducts.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredProducts.length) {
        handleSelectProduct(filteredProducts[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
      setSearchTerm('');
      setHighlightedIndex(-1);
    }
  };

  if (!isOpen) return null;

  const commonInputStyle = {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid #999',
    fontSize: '13px',
    borderRadius: '3px'
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#ffffff', border: '2px solid #999', width: '90%',
        maxWidth: '1000px', maxHeight: '85vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', backgroundColor: '#f0f0f0', borderBottom: '1px solid #999'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search style={{ width: '16px', height: '16px', color: '#666' }} />
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>Search Product</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Filter & Search Section */}
        <div style={{ padding: '12px', backgroundColor: '#ffffff', borderBottom: '1px solid #999', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Search (Name/Code):</label>
              <input type="text" style={commonInputStyle} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={handleKeyDown} autoFocus />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Company:</label>
              <select style={commonInputStyle} value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)}>
                <option value="">All</option>
                {companies.map((company) => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Category:</label>
              <select style={commonInputStyle} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="">All</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Selected Product:</label>
            <input type="text" value={selectedProduct ? `${selectedProduct.code} - ${selectedProduct.name}${selectedProduct.urduName ? ` / ${selectedProduct.urduName}` : ''}` : ''} readOnly style={{ ...commonInputStyle, backgroundColor: '#f9f9f9' }} />
          </div>
        </div>

        {/* Results Table */}
        <div style={{
          padding: '12px', backgroundColor: '#f8f8f8', borderBottom: '1px solid #999',
          flex: 1, display: 'flex', flexDirection: 'column'
        }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 'bold' }}>Searching Results:</label>
          {loading && <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Loading products...</div>}
          {error && <div style={{ fontSize: '12px', color: '#b00020', marginBottom: '8px' }}>{error}</div>}
          <div style={{ border: '1px solid #999', backgroundColor: '#ffffff', flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Table Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '45px 70px 1fr 1fr 1.6fr 1.4fr 90px',
              backgroundColor: '#e0e0e0', borderBottom: '1px solid #999',
              fontSize: '12px', fontWeight: 'bold', color: '#333'
            }}>
              <div style={{ padding: '6px 8px', borderRight: '1px solid #999' }}>Sr</div>
              <div style={{ padding: '6px 8px', borderRight: '1px solid #999' }}>Code</div>
              <div style={{ padding: '6px 8px', borderRight: '1px solid #999' }}>Company</div>
              <div style={{ padding: '6px 8px', borderRight: '1px solid #999' }}>Category</div>
              <div style={{ padding: '6px 8px', borderRight: '1px solid #999' }}>Name</div>
              <div style={{ padding: '6px 8px', borderRight: '1px solid #999' }}>Urdu Name</div>
              <div style={{ padding: '6px 8px' }}>{rateType === 'sale' ? 'Sale Rate' : 'Pur. Rate'}</div>
            </div>

            {/* Table Body - Scrollable */}
            <div ref={listRef} style={{ flex: 1, overflowY: 'auto', maxHeight: '350px' }}>
              {filteredProducts.map((product, index) => {
                const rowHighlighted = index === highlightedIndex;
                const rowBg = rowHighlighted ? '#1a73e8' : (index % 2 === 0 ? '#ffffff' : '#f9f9f9');
                const companyHasColor = companyColorMap[companyKey(product.company)] != null;
                return (
                <div
                  key={product.id || product._id || index}
                  onClick={() => handleSelectProduct(product)}
                  style={{
                    display: 'grid', gridTemplateColumns: '45px 70px 1fr 1fr 1.6fr 1.4fr 90px',
                    borderBottom: '1px solid #ddd', cursor: 'pointer', fontSize: '12px',
                    backgroundColor: rowBg,
                    color: rowHighlighted ? '#fff' : '#333',
                  }}
                  onMouseEnter={(e) => {
                    if (!rowHighlighted && !companyHasColor) e.currentTarget.style.backgroundColor = '#e6f7ff';
                  }}
                  onMouseLeave={(e) => {
                    if (!rowHighlighted) e.currentTarget.style.backgroundColor = rowBg;
                  }}
                >
                  <div style={{ padding: '6px 8px', borderRight: '1px solid #ddd', textAlign: 'center', color: rowHighlighted ? '#fff' : '#333' }}>{index + 1}</div>
                  <div style={{ padding: '6px 8px', borderRight: '1px solid #ddd', color: rowHighlighted ? '#fff' : '#333' }}>{product.code}</div>
                  <div style={getCompanyCellStyle(product.company, rowHighlighted)}>{product.company}</div>
                  <div style={{ padding: '6px 8px', borderRight: '1px solid #ddd', color: rowHighlighted ? '#fff' : '#333' }}>{product.category}</div>
                  <div style={{ padding: '6px 8px', borderRight: '1px solid #ddd', color: rowHighlighted ? '#fff' : '#333' }}>{product.name}</div>
                  <div style={{
                    padding: '6px 8px', borderRight: '1px solid #ddd',
                    fontFamily: "'Segoe UI', 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', sans-serif",
                    direction: 'rtl', textAlign: 'right',
                    color: rowHighlighted ? '#fff' : '#333',
                  }}>{product.urduName || product.descUrdu || ''}</div>
                  <div style={{ padding: '6px 8px', textAlign: 'right', color: rowHighlighted ? '#fff' : '#333' }}>{rateType === 'sale' ? product.saleRate : product.purchaseRate}</div>
                </div>
              );})}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSearchModal;