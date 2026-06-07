import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import api from '../utils/api';

const SupplierSearchModal = ({ isOpen, onClose, onSelectSupplier, selectedSupplier, type = 'supplier' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const listRef = useRef(null);

  const isCustomer = type === 'customer';

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/accounts');
        setSuppliers(response.data);
      } catch (err) {
        setError('Failed to load accounts.');
        setSuppliers([]);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, isCustomer]);

  const filteredSuppliers = suppliers.filter((supplier) => {
    const name = (supplier.customerName || supplier.accountTitle || supplier.name || '').toLowerCase();
    const code = (supplier.code || String(supplier.Id || '')).toLowerCase();
    const address = (supplier.address || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || code.includes(term) || address.includes(term);
  });

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchTerm]);

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const rows = listRef.current.children;
      if (rows[highlightedIndex]) {
        rows[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleSelectSupplier = (supplier) => {
    const selected = {
      ...supplier,
      name: supplier.customerName || supplier.accountTitle || supplier.name || '',
      code: supplier.code || String(supplier.Id || ''),
      address: supplier.address || '',
      phone: supplier.mobile || supplier.phone || '',
    };
    onSelectSupplier(selected);
    onClose();
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, filteredSuppliers.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredSuppliers.length) {
        handleSelectSupplier(filteredSuppliers[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
      setSearchTerm('');
      setHighlightedIndex(-1);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        border: '2px solid #999',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '85vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: '#f0f0f0',
          borderBottom: '1px solid #999'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search style={{ width: '16px', height: '16px', color: '#666' }} />
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>Search A/C</span>
          </div>
          <button
            onClick={() => {
              onClose();
              setSearchTerm('');
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#666',
              padding: '4px'
            }}
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Account Search Field */}
        <div style={{
          padding: '12px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #999'
        }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Account:</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type to search by name, code, or address..."
            autoFocus
            style={{
              width: '100%',
              padding: '6px 8px',
              border: '1px solid #999',
              fontSize: '13px',
              backgroundColor: '#ffffff'
            }}
          />
        </div>

        {/* Search Section */}
        <div style={{
          padding: '12px',
          backgroundColor: '#f8f8f8',
          borderBottom: '1px solid #999',
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 'bold' }}>Searching Results:</label>
          {loading && <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Loading {isCustomer ? 'customers' : 'suppliers'}...</div>}
          {error && <div style={{ fontSize: '12px', color: '#b00020', marginBottom: '8px' }}>{error}</div>}
          <div style={{
            border: '1px solid #999',
            backgroundColor: '#ffffff',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '60px 120px 1fr 200px',
              backgroundColor: '#e0e0e0',
              borderBottom: '1px solid #999',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              <div style={{ padding: '6px 8px', borderRight: '1px solid #999' }}>Sr No</div>
              <div style={{ padding: '6px 8px', borderRight: '1px solid #999' }}>Code</div>
              <div style={{ padding: '6px 8px', borderRight: '1px solid #999' }}>Account Title</div>
              <div style={{ padding: '6px 8px' }}>Address</div>
            </div>

            {/* Table Body - Scrollable */}
            <div ref={listRef} style={{
              flex: 1,
              overflowY: 'auto',
              maxHeight: '400px'
            }}>
              {filteredSuppliers.map((supplier, index) => (
                <div
                  key={supplier._id || supplier.id || index}
                  onClick={() => handleSelectSupplier(supplier)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 120px 1fr 200px',
                    borderBottom: '1px solid #ddd',
                    cursor: 'pointer',
                    fontSize: '12px',
                    backgroundColor: index === highlightedIndex ? '#1a73e8' : (index % 2 === 0 ? '#ffffff' : '#f9f9f9'),
                    color: index === highlightedIndex ? '#fff' : '#333',
                  }}
                  onMouseEnter={(e) => { if (index !== highlightedIndex) e.currentTarget.style.backgroundColor = '#e6f7ff'; }}
                  onMouseLeave={(e) => { if (index !== highlightedIndex) e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f9f9f9'; }}
                >
                  <div style={{ padding: '6px 8px', borderRight: '1px solid #ddd', textAlign: 'center' }}>{index + 1}</div>
                  <div style={{ padding: '6px 8px', borderRight: '1px solid #ddd' }}>{supplier.code || supplier.Id}</div>
                  <div style={{ padding: '6px 8px', borderRight: '1px solid #ddd' }}>{supplier.customerName || supplier.accountTitle || supplier.name}</div>
                  <div style={{ padding: '6px 8px' }}>{supplier.address}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#f8f8f8',
          fontSize: '12px',
          color: '#666',
          textAlign: 'right'
        }}>
          {filteredSuppliers.length} records
        </div>
      </div>
    </div>
  );
};

export default SupplierSearchModal;
