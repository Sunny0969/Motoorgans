import React, { useState, useCallback, useEffect } from 'react';
import api from '../utils/api';
import ProductSearchModal from '../components/ProductSearchModal';
import SupplierSearchModal from '../components/SupplierSearchModal';

const monthStart = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
};
const monthEnd = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
};

const emptySummary = {
  lastPurchaseRate: 0,
  lastSaleRate: 0,
  totalIn: 0,
  totalOut: 0,
  stockBalance: 0,
};

const styles = {
  container: { fontFamily: 'Segoe UI, Tahoma, sans-serif', backgroundColor: '#f0f0f0', minHeight: 'calc(100vh - 80px)' },
  header: {
    backgroundColor: '#4a4a4a', color: '#fff', padding: '14px 24px', fontSize: '26px',
    fontWeight: 'bold', textAlign: 'center', borderBottom: '3px solid #333',
  },
  panel: { backgroundColor: '#fff', border: '2px solid #999', margin: '10px', padding: '12px' },
  sectionTitle: { fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' },
  label: { fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '2px' },
  input: { padding: '4px 6px', border: '1px solid #999', fontSize: '12px' },
  btn: {
    padding: '6px 14px', border: '1px solid #666', backgroundColor: '#e8e8e8',
    cursor: 'pointer', fontSize: '12px', marginRight: '6px',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '11px' },
  th: { border: '1px solid #999', padding: '4px', backgroundColor: '#d0d0d0', textAlign: 'center' },
  td: { border: '1px solid #999', padding: '4px', textAlign: 'center' },
};

const rowBg = (kind) => {
  if (kind === 'sale') return '#d4edda';
  if (kind === 'purchase') return '#f8d7da';
  if (kind === 'brought-forward') return '#f8d7da';
  return '#fff';
};

const fmt = (n) => {
  if (n === '' || n == null) return '';
  const num = Number(n);
  if (Number.isNaN(num)) return n;
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
};

function ProductHistory() {
  const [fromDate, setFromDate] = useState(monthStart());
  const [toDate, setToDate] = useState(monthEnd());
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedParty, setSelectedParty] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(emptySummary);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadHistory = useCallback(async () => {
    if (!selectedProduct) return;
    setLoading(true);
    setError(null);
    try {
      const params = {
        productId: selectedProduct.id || selectedProduct._id || selectedProduct.code,
        fromDate,
        toDate,
      };
      if (selectedParty) {
        params.partyId = selectedParty.Id || selectedParty.id || selectedParty._id;
      }
      const res = await api.get('/product-history', { params });
      setSummary(res.data?.summary || emptySummary);
      setRows(Array.isArray(res.data?.rows) ? res.data.rows : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load product history.');
      setRows([]);
      setSummary(emptySummary);
    } finally {
      setLoading(false);
    }
  }, [selectedProduct, selectedParty, fromDate, toDate]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleShowTransactions = () => {
    if (!selectedProduct) {
      alert('Please select a product first.');
      return;
    }
    loadHistory();
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setShowProductModal(false);
  };

  const handlePartySelect = (party) => {
    setSelectedParty(party);
    setShowPartyModal(false);
  };

  const clearParty = () => setSelectedParty(null);

  const productId = selectedProduct
    ? (selectedProduct.code || selectedProduct.id || selectedProduct._id || '')
    : '';
  const productName = selectedProduct?.name || '';

  const partyLabel = selectedParty
    ? (selectedParty.customerName || selectedParty.accountTitle || selectedParty.name || '')
    : '';

  return (
    <div style={styles.container}>
      <div style={styles.header}>Product History</div>

      <div style={styles.panel}>
        <div style={styles.sectionTitle}>Information Required</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
          <div>
            <label style={styles.label}>From</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={styles.input} />
          </div>
          <div>
            <label style={styles.label}>To</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={styles.input} />
          </div>
          <div style={{ minWidth: '320px' }}>
            <label style={styles.label}>Select Product</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              <input
                type="text"
                readOnly
                value={productId}
                placeholder="ID"
                onClick={() => setShowProductModal(true)}
                style={{ ...styles.input, width: '60px', cursor: 'pointer', textAlign: 'center' }}
              />
              <input
                type="text"
                readOnly
                value={productName}
                placeholder="Click to select product..."
                onClick={() => setShowProductModal(true)}
                style={{ ...styles.input, width: '240px', cursor: 'pointer' }}
              />
              <button type="button" style={styles.btn} onClick={() => setShowProductModal(true)}>...</button>
            </div>
          </div>
          <div style={{ minWidth: '260px' }}>
            <label style={styles.label}>Select Party (optional)</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              <input
                type="text"
                readOnly
                value={partyLabel}
                placeholder="All parties if empty"
                onClick={() => setShowPartyModal(true)}
                style={{ ...styles.input, width: '220px', cursor: 'pointer' }}
              />
              <button type="button" style={styles.btn} onClick={() => setShowPartyModal(true)}>...</button>
              {selectedParty && (
                <button type="button" style={styles.btn} onClick={clearParty} title="Clear party">X</button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={styles.panel}>
        <div style={styles.sectionTitle}>Commands</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={styles.label}>Last Purchase Rate</label>
            <input readOnly value={fmt(summary.lastPurchaseRate)} style={{ ...styles.input, width: '90px', backgroundColor: '#f0f0f0' }} />
          </div>
          <div>
            <label style={styles.label}>Last Sale Rate</label>
            <input readOnly value={fmt(summary.lastSaleRate)} style={{ ...styles.input, width: '90px', backgroundColor: '#f0f0f0' }} />
          </div>
          <div>
            <label style={styles.label}>Total In</label>
            <input readOnly value={fmt(summary.totalIn)} style={{ ...styles.input, width: '90px', backgroundColor: '#f0f0f0' }} />
          </div>
          <div>
            <label style={styles.label}>Total Out</label>
            <input readOnly value={fmt(summary.totalOut)} style={{ ...styles.input, width: '90px', backgroundColor: '#f0f0f0' }} />
          </div>
          <div>
            <label style={styles.label}>Stock Balance</label>
            <input readOnly value={fmt(summary.stockBalance)} style={{ ...styles.input, width: '90px', backgroundColor: '#f0f0f0', fontWeight: 'bold' }} />
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button type="button" style={styles.btn} onClick={loadHistory} disabled={loading || !selectedProduct}>
              Refresh
            </button>
            <button type="button" style={styles.btn} onClick={handleShowTransactions} disabled={loading}>
              {loading ? 'Loading...' : 'Show Transactions'}
            </button>
            <button type="button" style={styles.btn} onClick={() => window.print()}>Print Preview</button>
          </div>
        </div>
        {error && <div style={{ color: '#c62828', marginTop: '8px', fontSize: '12px' }}>{error}</div>}
      </div>

      <div style={{ ...styles.panel, marginBottom: '20px' }}>
        <div style={styles.sectionTitle}>Result(s)</div>
        <div style={{ maxHeight: '420px', overflow: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Sr.#</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Doc.#</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>In</th>
                <th style={styles.th}>Out</th>
                <th style={styles.th}>Rate</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Balance Qty.</th>
                <th style={{ ...styles.th, textAlign: 'left', minWidth: '180px' }}>Party</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ ...styles.td, color: '#888', padding: '12px' }}>
                    {loading ? 'Loading...' : selectedProduct ? 'No transactions in selected period' : 'Select product to view history'}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={`${row.sr}-${row.docNo}-${row.date}`} style={{ backgroundColor: rowBg(row.rowKind) }}>
                    <td style={styles.td}>{row.sr}</td>
                    <td style={styles.td}>{row.date}</td>
                    <td style={styles.td}>{row.docNo}</td>
                    <td style={styles.td}>{row.type}</td>
                    <td style={styles.td}>{fmt(row.qtyIn)}</td>
                    <td style={styles.td}>{fmt(row.qtyOut)}</td>
                    <td style={styles.td}>{fmt(row.rate)}</td>
                    <td style={styles.td}>{fmt(row.amount)}</td>
                    <td style={{ ...styles.td, fontWeight: 'bold' }}>{fmt(row.balanceQty)}</td>
                    <td style={{ ...styles.td, textAlign: 'left' }}>{row.partyName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductSearchModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        onSelectProduct={handleProductSelect}
        selectedProduct={selectedProduct}
        rateType="sale"
      />

      <SupplierSearchModal
        isOpen={showPartyModal}
        onClose={() => setShowPartyModal(false)}
        onSelectSupplier={handlePartySelect}
        selectedSupplier={selectedParty}
        type="customer"
      />
    </div>
  );
}

export default ProductHistory;
