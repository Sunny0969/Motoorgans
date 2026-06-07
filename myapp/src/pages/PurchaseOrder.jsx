import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ProductSearchModal from '../components/ProductSearchModal';
import SupplierSearchModal from '../components/SupplierSearchModal';

const initialEntry = {
  productId: '',
  productCode: '',
  productName: '',
  description: '',
  uom: 'PCS',
  packingSize: '',
  availableStock: '',
  packets: '',
  pcs: '',
  totalQty: '',
};

const calcTotalQty = (packets, packingSize, pcs) => {
  const pk = parseFloat(packets) || 0;
  const ps = parseFloat(packingSize) || 0;
  const pc = parseFloat(pcs) || 0;
  if (ps > 0) return pk * ps + pc;
  return pc;
};

const toInputDate = (value) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
};

const PurchaseOrder = () => {
  const navigate = useNavigate();
  const [header, setHeader] = useState({
    poNumber: '',
    date: toInputDate(),
    supplierId: '',
    supplierCode: '',
    accountTitle: '',
    description: '',
  });
  const [entry, setEntry] = useState(initialEntry);
  const [lines, setLines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [savedDoc, setSavedDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  const totals = useMemo(() => ({
    totalPackets: lines.reduce((s, l) => s + (parseFloat(l.packets) ?? parseFloat(l.packing) ?? 0), 0),
    totalPcs: lines.reduce((s, l) => s + (parseFloat(l.pcs) || 0), 0),
  }), [lines]);

  const loadSuppliers = useCallback(async () => {
    try {
      const res = await api.get('/purchase-orders/suppliers');
      setSuppliers(Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));
    } catch {
      try {
        const res2 = await api.get('/suppliers');
        setSuppliers(Array.isArray(res2.data) ? res2.data : []);
      } catch {
        setSuppliers([]);
      }
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const res = await api.get('/products', { params: { all: '1', limit: 10000 } });
      setProductsList(Array.isArray(res.data) ? res.data : []);
    } catch {
      setProductsList([]);
    }
  }, []);

  const resetEntry = useCallback(() => {
    setEntry(initialEntry);
    setEditIndex(null);
  }, []);

  const applyOrder = useCallback((order) => {
    if (!order) return;
    setHeader({
      poNumber: String(order.doc || order.poNumber || ''),
      date: toInputDate(order.date),
      supplierId: order.supplierId != null ? String(order.supplierId) : '',
      supplierCode: order.supplierCode || '',
      accountTitle: order.accountTitle || '',
      description: order.description || '',
    });
    setSavedDoc(order.doc);
    setLines(
      (order.items || []).map((item, i) => ({
        sr: i + 1,
        productId: item.productId,
        productCode: item.productCode || '',
        description: item.description || item.productName || '',
        uom: item.uom || 'PCS',
        packing: item.packing ?? item.packets ?? 0,
        packingSize: item.packingSize ?? 0,
        packingDisplay: item.packingDisplay || String(item.packing ?? ''),
        packets: item.packets ?? item.packing ?? 0,
        pcs: item.pcs ?? 0,
        totalQty: item.totalQty ?? 0,
      })),
    );
    resetEntry();
  }, [resetEntry]);

  const loadNextPo = useCallback(async () => {
    try {
      const res = await api.get('/purchase-orders/next-number');
      setHeader((h) => ({ ...h, poNumber: String(res.data.nextNumber || res.data.poNumber) }));
      setSavedDoc(null);
    } catch {
      setHeader((h) => ({ ...h, poNumber: '1' }));
    }
  }, []);

  const loadLatest = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/purchase-orders/latest');
      applyOrder(res.data.data);
    } catch (err) {
      if (err.response?.status === 404) {
        await loadNextPo();
        setLines([]);
      }
    } finally {
      setLoading(false);
    }
  }, [applyOrder, loadNextPo]);

  useEffect(() => {
    loadSuppliers();
    loadProducts();
    loadLatest();
  }, [loadSuppliers, loadProducts, loadLatest]);

  const loadProductInfo = async (productId) => {
    if (!productId) return;
    try {
      const res = await api.get(`/purchase-orders/product/${productId}`);
      const p = res.data.data;
      const packingSize = p.packingSize ?? 0;
      setEntry((prev) => ({
        ...prev,
        productId: String(p.productId),
        productCode: p.productCode || '',
        productName: p.productName || '',
        description: p.productName || '',
        uom: p.uom || 'PCS',
        packingSize: packingSize > 0 ? String(packingSize) : '',
        availableStock: String(p.availableStock ?? 0),
        totalQty: String(calcTotalQty(prev.packets, packingSize, prev.pcs)),
      }));
    } catch {
      /* ignore */
    }
  };

  const handleSupplierSelect = (supplier) => {
    setHeader((h) => ({
      ...h,
      supplierId: String(supplier.id || supplier._id),
      supplierCode: supplier.code || '',
      accountTitle: supplier.name || '',
    }));
    setShowSupplierModal(false);
  };

  const handleSupplierChange = (e) => {
    const id = e.target.value;
    const sup = suppliers.find((s) => String(s.id || s._id) === String(id));
    setHeader((h) => ({
      ...h,
      supplierId: id,
      supplierCode: sup?.code || '',
      accountTitle: sup?.name || '',
    }));
  };

  const handleProductSelect = (product) => {
    const pid = product.id || product._id;
    setEntry((prev) => ({
      ...prev,
      productId: String(pid),
      productCode: product.code || '',
      productName: product.name || '',
      description: product.name || '',
      packingSize: product.packing > 0 ? String(product.packing) : '',
      uom: product.unit || product.uom || 'PCS',
    }));
    setShowProductModal(false);
    loadProductInfo(pid);
  };

  const handleEntryChange = (e) => {
    const { name, value } = e.target;
    if (name === 'productId') {
      setEntry((prev) => ({ ...prev, productId: value }));
      if (value) loadProductInfo(value);
      return;
    }
    setEntry((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'packets' || name === 'pcs') {
        next.totalQty = String(calcTotalQty(
          name === 'packets' ? value : prev.packets,
          prev.packingSize,
          name === 'pcs' ? value : prev.pcs,
        ));
      }
      return next;
    });
  };

  const buildLine = () => {
    const totalQty = calcTotalQty(entry.packets, entry.packingSize, entry.pcs);
    if (!entry.productId) throw new Error('Select a product first.');
    if (totalQty <= 0) throw new Error('Enter packet(s) or piece quantity.');
    const ps = parseFloat(entry.packingSize) || 0;
    const pk = parseFloat(entry.packets) || 0;
    const packingDisplay = ps > 0 && pk > 0 ? `${pk} x ${ps}` : (pk > 0 ? String(pk) : '-');
    return {
      productId: Number(entry.productId),
      productCode: entry.productCode,
      productName: entry.productName,
      description: entry.description || entry.productName,
      uom: entry.uom,
      packing: pk,
      packingSize: ps,
      packingDisplay,
      packets: pk,
      pcs: parseFloat(entry.pcs) || 0,
      totalQty,
    };
  };

  const handleAdd = () => {
    try {
      setLines((prev) => [...prev, { sr: prev.length + 1, ...buildLine() }]);
      resetEntry();
      setMessage(null);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleUpdate = () => {
    if (editIndex === null) {
      setMessage({ type: 'error', text: 'Select a row to update.' });
      return;
    }
    try {
      const line = buildLine();
      setLines((prev) => {
        const next = [...prev];
        next[editIndex] = { sr: editIndex + 1, ...line };
        return next.map((r, i) => ({ ...r, sr: i + 1 }));
      });
      resetEntry();
      setMessage(null);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleRemove = () => {
    if (editIndex === null) return;
    setLines((prev) => prev.filter((_, i) => i !== editIndex).map((r, i) => ({ ...r, sr: i + 1 })));
    resetEntry();
  };

  const handleRowClick = (index) => {
    const row = lines[index];
    setEditIndex(index);
    setEntry({
      productId: String(row.productId),
      productCode: row.productCode || '',
      productName: row.description || '',
      description: row.description || '',
      uom: row.uom || 'PCS',
      packingSize: row.packingSize > 0 ? String(row.packingSize) : '',
      availableStock: '',
      packets: String(row.packets ?? row.packing ?? ''),
      pcs: String(row.pcs ?? ''),
      totalQty: String(row.totalQty ?? ''),
    });
    loadProductInfo(row.productId);
  };

  const handleRefresh = async () => {
    setLines([]);
    setMessage(null);
    resetEntry();
    await loadNextPo();
  };

  const loadByPo = async () => {
    const po = header.poNumber?.trim();
    if (!po) return;
    setLoading(true);
    try {
      const res = await api.get(`/purchase-orders/${po}`);
      applyOrder(res.data.data);
      setMessage({ type: 'success', text: `Loaded P.O #${po}.` });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Not found.' });
    } finally {
      setLoading(false);
    }
  };

  const saveOrder = async (isUpdate) => {
    if (!header.supplierId) {
      setMessage({ type: 'error', text: 'Select supplier (Account Title).' });
      return;
    }
    if (!lines.length) {
      setMessage({ type: 'error', text: 'Add at least one product.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const payload = {
        date: header.date,
        description: header.description,
        supplierId: header.supplierId,
        supplierCode: header.supplierCode,
        accountTitle: header.accountTitle,
        items: lines.map((l) => ({
          productId: l.productId,
          description: l.description,
          productName: l.description,
          packets: l.packets ?? l.packing,
          packing: l.packing ?? l.packets,
          packingSize: l.packingSize,
          pcs: l.pcs,
        })),
      };
      const res = savedDoc && isUpdate
        ? await api.put(`/purchase-orders/${savedDoc}`, payload)
        : await api.post('/purchase-orders', payload);
      applyOrder(res.data.data);
      setMessage({ type: 'success', text: res.data.message || 'Saved.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Save failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!savedDoc) {
      setMessage({ type: 'error', text: 'No saved record.' });
      return;
    }
    if (!window.confirm(`Delete purchase order #${savedDoc}?`)) return;
    setLoading(true);
    try {
      await api.delete(`/purchase-orders/${savedDoc}`);
      setMessage({ type: 'success', text: `Deleted P.O #${savedDoc}.` });
      setLines([]);
      setSavedDoc(null);
      await loadNextPo();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Delete failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!lines.length) return;
    const w = window.open('', '_blank');
    const rows = lines.map((l) => `
      <tr><td>${l.sr}</td><td>${l.description}</td><td>${l.packingDisplay}</td><td>${l.pcs}</td></tr>`).join('');
    w.document.write(`
      <html><head><title>P.O #${header.poNumber}</title>
      <style>table{border-collapse:collapse;width:100%} th,td{border:1px solid #333;padding:6px}</style></head>
      <body><h2>Purchase Order</h2>
      <p>P.O #${header.poNumber} | Date: ${header.date}</p>
      <p>Supplier: ${header.accountTitle} (${header.supplierCode})</p>
      <p>${header.description || ''}</p>
      <table><thead><tr><th>Sr</th><th>Description</th><th>Packing</th><th>Pcs</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <p align="right">Total Packets: ${totals.totalPackets} | Total Pcs: ${totals.totalPcs}</p>
      </body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div style={s.page}>
      <div style={s.titleBar}>Purchase Order Form</div>
      {message && <div style={message.type === 'success' ? s.msgOk : s.msgErr}>{message.text}</div>}

      <div style={s.headerBox}>
        <label style={s.lbl}>P.O #</label>
        <input style={s.inpSm} value={header.poNumber} onChange={(e) => setHeader((h) => ({ ...h, poNumber: e.target.value }))} onBlur={loadByPo} onKeyDown={(e) => e.key === 'Enter' && loadByPo()} />
        <label style={s.lbl}>Date</label>
        <input type="date" style={s.inpDate} value={header.date} onChange={(e) => setHeader((h) => ({ ...h, date: e.target.value }))} />
        <label style={s.lbl}>Code</label>
        <input style={s.inpCode} value={header.supplierCode} readOnly />
        <label style={s.lbl}>Account Title</label>
        <select style={s.selAccount} value={header.supplierId} onChange={handleSupplierChange}>
          <option value="">— Select Supplier —</option>
          {suppliers.map((sup) => (
            <option key={sup.id || sup._id} value={sup.id || sup._id}>{sup.code} — {sup.name}</option>
          ))}
        </select>
        <button type="button" style={s.btnSmall} onClick={() => setShowSupplierModal(true)} title="Search supplier">…</button>
        <label style={s.lbl}>Description</label>
        <input style={s.inpDesc} value={header.description} onChange={(e) => setHeader((h) => ({ ...h, description: e.target.value }))} />
      </div>

      <div style={s.entryBox}>
        <div style={s.entryRow}>
          <label style={s.lbl}>Select Product</label>
          <select style={s.selProduct} name="productId" value={entry.productId} onChange={handleEntryChange}>
            <option value="">— Select —</option>
            {productsList.map((p) => (
              <option key={p.id || p._id} value={p.id || p._id}>{p.code} — {p.name}</option>
            ))}
          </select>
          <button type="button" style={s.btnSmall} onClick={() => setShowProductModal(true)}>…</button>
          <label style={s.lbl}>U.O.M</label>
          <input style={s.inpTiny} value={entry.uom} readOnly />
          <label style={s.lbl}>Available Stock</label>
          <input style={s.inpStock} value={entry.availableStock} readOnly />
          <label style={s.lbl}>Packet(s)</label>
          <input style={s.inpQty} name="packets" value={entry.packets} onChange={handleEntryChange} type="number" min="0" step="any" />
          <label style={s.lbl}>Pc(s)</label>
          <input style={s.inpQty} name="pcs" value={entry.pcs} onChange={handleEntryChange} type="number" min="0" step="any" />
          <label style={s.lbl}>Total Qty.</label>
          <input style={s.inpQty} value={entry.totalQty} readOnly />
        </div>
        <div style={s.btnRow}>
          <button type="button" style={s.btn} onClick={resetEntry}>Reset</button>
          <button type="button" style={s.btn} onClick={handleAdd}>Add</button>
          <button type="button" style={s.btn} onClick={handleUpdate} disabled={editIndex === null}>Update</button>
          <button type="button" style={s.btn} onClick={handleRemove} disabled={editIndex === null}>Remove</button>
        </div>
      </div>

      <div style={s.sectionLabel}>Product(s) Information</div>
      <div style={s.gridWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Sr.#</th>
              <th style={s.th}>Description</th>
              <th style={s.th}>Packing</th>
              <th style={s.th}>Pc(s)</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr><td colSpan={4} style={s.emptyCell}>—</td></tr>
            ) : (
              lines.map((row, idx) => (
                <tr key={`${row.productId}-${idx}`} style={editIndex === idx ? s.rowSel : s.row} onClick={() => handleRowClick(idx)}>
                  <td style={s.td}>{row.sr}</td>
                  <td style={{ ...s.td, textAlign: 'left' }}>{row.description}</td>
                  <td style={s.td}>{row.packingDisplay ?? row.packing}</td>
                  <td style={s.td}>{row.pcs}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={s.totalsRow}>
        <label style={s.lbl}>Total Packets</label>
        <input style={s.inpTotal} value={totals.totalPackets} readOnly />
        <label style={s.lbl}>Total Psc.</label>
        <input style={s.inpTotal} value={totals.totalPcs} readOnly />
      </div>

      <div style={s.actionBar}>
        <button type="button" style={s.actionBtn} onClick={handleRefresh} disabled={loading}>↻ Refresh</button>
        <button type="button" style={s.actionBtn} onClick={() => saveOrder(false)} disabled={loading || !lines.length}>💾 Save Record</button>
        <button type="button" style={s.actionBtn} onClick={() => saveOrder(true)} disabled={loading || !savedDoc || !lines.length}>✎ Update</button>
        <button type="button" style={s.actionBtn} onClick={handleDelete} disabled={loading || !savedDoc}>✕ Delete Record</button>
        <button type="button" style={s.actionBtn} onClick={handlePrint} disabled={!lines.length}>🖨 Print P.O</button>
        <button type="button" style={{ ...s.actionBtn, marginLeft: 'auto', background: '#8b0000' }} onClick={() => navigate('/')}>✕ Close</button>
      </div>

      {showProductModal && (
        <ProductSearchModal isOpen={showProductModal} onClose={() => setShowProductModal(false)} onSelectProduct={handleProductSelect} rateType="purchase" />
      )}
      {showSupplierModal && (
        <SupplierSearchModal isOpen={showSupplierModal} onClose={() => setShowSupplierModal(false)} onSelectSupplier={handleSupplierSelect} />
      )}
    </div>
  );
};

const s = {
  page: { fontFamily: 'Tahoma, Segoe UI, sans-serif', fontSize: 12, background: '#c0c0c0', minHeight: '100vh', padding: 8, boxSizing: 'border-box' },
  titleBar: { background: 'linear-gradient(180deg, #4a4a4a 0%, #2d2d2d 100%)', color: '#fff', textAlign: 'center', padding: '6px 8px', fontWeight: 'bold', border: '1px solid #1a1a1a', marginBottom: 6 },
  msgOk: { background: '#d4edda', color: '#155724', padding: 8, marginBottom: 6, border: '1px solid #a5d6a7' },
  msgErr: { background: '#f8d7da', color: '#721c24', padding: 8, marginBottom: 6, border: '1px solid #ef9a9a' },
  headerBox: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: 8, background: '#d4d4d4', border: '1px solid #888', marginBottom: 6 },
  entryBox: { padding: 8, background: '#d4d4d4', border: '1px solid #888', marginBottom: 4 },
  entryRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 6 },
  btnRow: { display: 'flex', justifyContent: 'flex-end', gap: 6 },
  sectionLabel: { padding: '4px 8px', background: '#b8b8b8', border: '1px solid #888', borderBottom: 'none', fontWeight: 'bold' },
  lbl: { fontWeight: 500, whiteSpace: 'nowrap' },
  inpSm: { width: 56, padding: '2px 4px', border: '1px solid #888' },
  inpDate: { width: 120, padding: '2px 4px', border: '1px solid #888' },
  inpCode: { width: 48, padding: '2px 4px', border: '1px solid #888', background: '#f5f5f5' },
  inpDesc: { flex: 1, minWidth: 140, padding: '2px 4px', border: '1px solid #888' },
  selAccount: { minWidth: 180, maxWidth: 280, padding: '2px 4px', border: '1px solid #888' },
  selProduct: { minWidth: 200, maxWidth: 300, padding: '2px 4px', border: '1px solid #888' },
  inpTiny: { width: 44, padding: '2px 4px', border: '1px solid #888' },
  inpStock: { width: 64, padding: '2px 4px', border: '1px solid #888', background: '#ffffcc' },
  inpQty: { width: 58, padding: '2px 4px', border: '1px solid #888' },
  btnSmall: { padding: '2px 8px', border: '1px solid #888', background: '#e8e8e8', cursor: 'pointer' },
  btn: { padding: '3px 12px', border: '1px solid #888', background: 'linear-gradient(180deg, #f0f0f0, #d8d8d8)', cursor: 'pointer' },
  gridWrap: { border: '1px solid #888', marginBottom: 6, maxHeight: 280, overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', fontSize: 11 },
  th: { background: '#d0d0d0', border: '1px solid #888', padding: '4px 6px', fontWeight: 'bold' },
  td: { border: '1px solid #999', padding: '3px 6px', textAlign: 'center' },
  row: { cursor: 'pointer' },
  rowSel: { cursor: 'pointer', background: '#b3d9ff' },
  emptyCell: { textAlign: 'center', padding: 16, color: '#666' },
  totalsRow: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, padding: '6px 8px', background: '#d4d4d4', border: '1px solid #888', marginBottom: 6 },
  inpTotal: { width: 80, padding: '2px 4px', border: '1px solid #888', fontWeight: 'bold', textAlign: 'right' },
  actionBar: { display: 'flex', flexWrap: 'wrap', gap: 6, padding: 8, background: '#4a4a4a', border: '1px solid #333' },
  actionBtn: { padding: '6px 12px', border: '1px solid #666', background: '#6a6a6a', color: '#fff', cursor: 'pointer', fontSize: 11 },
};

export default PurchaseOrder;
