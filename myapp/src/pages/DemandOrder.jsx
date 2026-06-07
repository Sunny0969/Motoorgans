import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ProductSearchModal from '../components/ProductSearchModal';

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

const formatDisplayDate = (value) => {
  const d = new Date(value || Date.now());
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
};

const DemandOrder = () => {
  const navigate = useNavigate();
  const [header, setHeader] = useState({
    doc: '',
    date: toInputDate(),
    description: '',
  });
  const [entry, setEntry] = useState(initialEntry);
  const [lines, setLines] = useState([]);
  const [stockRows, setStockRows] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [savedDoc, setSavedDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportList, setReportList] = useState([]);

  const totals = useMemo(() => {
    const totalPackets = lines.reduce((s, l) => s + (parseFloat(l.packets) || 0), 0);
    const totalPcs = lines.reduce((s, l) => s + (parseFloat(l.pcs) || 0), 0);
    return { totalPackets, totalPcs };
  }, [lines]);

  const loadStockStatus = useCallback(async () => {
    try {
      const res = await api.get('/demand-orders/stock-status');
      setStockRows(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      setStockRows([]);
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

  const applyOrder = useCallback((order) => {
    if (!order) return;
    setHeader({
      doc: String(order.doc || order.demandNumber || ''),
      date: toInputDate(order.date),
      description: order.description || '',
    });
    setSavedDoc(order.doc);
    setLines(
      (order.items || []).map((item, i) => ({
        sr: i + 1,
        productId: item.productId,
        productCode: item.productCode || '',
        description: item.description || item.productName || '',
        packing: item.packets ?? 0,
        packingSize: item.packingSize ?? item.packing ?? 0,
        pcs: item.pcs ?? 0,
        totalQty: item.totalQty ?? calcTotalQty(item.packets, item.packingSize ?? item.packing, item.pcs),
      })),
    );
    setEditIndex(null);
    resetEntry();
  }, []);

  const loadNextDoc = useCallback(async () => {
    try {
      const res = await api.get('/demand-orders/next-number');
      const next = res.data.nextNumber ?? res.data.nextDoc;
      setHeader((h) => ({ ...h, doc: String(next) }));
      setSavedDoc(null);
    } catch {
      setHeader((h) => ({ ...h, doc: '1' }));
    }
  }, []);

  const loadLatest = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.get('/demand-orders/latest');
      applyOrder(res.data.data);
    } catch (err) {
      if (err.response?.status === 404) {
        await loadNextDoc();
        setLines([]);
      } else {
        setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load demand order.' });
      }
    } finally {
      setLoading(false);
    }
  }, [applyOrder, loadNextDoc]);

  useEffect(() => {
    loadProducts();
    loadStockStatus();
    loadLatest();
  }, [loadProducts, loadStockStatus, loadLatest]);

  const resetEntry = () => {
    setEntry(initialEntry);
    setEditIndex(null);
  };

  const loadProductInfo = async (productId) => {
    if (!productId) return;
    try {
      const res = await api.get(`/demand-orders/product/${productId}`);
      const p = res.data.data;
      const packingSize = p.packingSize ?? 0;
      setEntry((prev) => {
        const packets = prev.packets;
        const pcs = prev.pcs;
        return {
          ...prev,
          productId: String(p.productId),
          productCode: p.productCode || '',
          productName: p.productName || '',
          description: p.productName || '',
          uom: p.uom || 'PCS',
          packingSize: packingSize > 0 ? String(packingSize) : '',
          availableStock: String(p.availableStock ?? 0),
          totalQty: String(calcTotalQty(packets, packingSize, pcs)),
        };
      });
    } catch {
      try {
        const stockRes = await api.get(`/stock/product/${productId}`);
        const prod = productsList.find((x) => String(x.id || x._id) === String(productId));
        const packingSize = prod?.packing ?? 0;
        setEntry((prev) => ({
          ...prev,
          productId: String(productId),
          productCode: prod?.code || '',
          productName: prod?.name || '',
          description: prod?.name || '',
          uom: prod?.unit || prod?.uom || 'PCS',
          packingSize: packingSize > 0 ? String(packingSize) : '',
          availableStock: String(stockRes.data?.onHandQty ?? 0),
        }));
      } catch {
        /* ignore */
      }
    }
  };

  const handleProductSelect = (product) => {
    const id = product.id || product._id;
    setEntry((prev) => ({
      ...prev,
      productId: String(id),
      productCode: product.code || '',
      productName: product.name || '',
      description: product.name || '',
      uom: product.unit || product.uom || 'PCS',
      packingSize: product.packing > 0 ? String(product.packing) : '',
    }));
    setShowProductModal(false);
    loadProductInfo(id);
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

  const buildLineFromEntry = () => {
    const packingSize = parseFloat(entry.packingSize) || 0;
    const packets = parseFloat(entry.packets) || 0;
    const pcs = parseFloat(entry.pcs) || 0;
    const totalQty = calcTotalQty(entry.packets, entry.packingSize, entry.pcs);
    if (!entry.productId) {
      throw new Error('Select a product first.');
    }
    if (totalQty <= 0) {
      throw new Error('Enter packet(s) or piece(s) quantity.');
    }
    const packingDisplay = packingSize > 0 && packets > 0
      ? `${packets} x ${packingSize}`
      : (packets > 0 ? String(packets) : '-');
    return {
      productId: Number(entry.productId),
      productCode: entry.productCode,
      description: entry.description || entry.productName,
      packing: packets,
      packingSize,
      packets,
      pcs,
      totalQty,
      packingDisplay,
    };
  };

  const handleAdd = () => {
    try {
      const line = buildLineFromEntry();
      setLines((prev) => [...prev, { sr: prev.length + 1, ...line }]);
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
      const line = buildLineFromEntry();
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
    const ps = row.packingSize || 0;
    setEntry({
      productId: String(row.productId),
      productCode: row.productCode || '',
      productName: row.description || '',
      description: row.description || '',
      uom: 'PCS',
      packingSize: ps > 0 ? String(ps) : '',
      availableStock: '',
      packets: String(row.packets ?? row.packing ?? ''),
      pcs: String(row.pcs ?? ''),
      totalQty: String(row.totalQty ?? ''),
    });
    loadProductInfo(row.productId);
  };

  const handleRefresh = async () => {
    resetEntry();
    setLines([]);
    setMessage(null);
    await loadNextDoc();
    await loadStockStatus();
  };

  const handleLoadByDoc = async () => {
    const doc = header.doc?.trim();
    if (!doc) return;
    setLoading(true);
    try {
      const res = await api.get(`/demand-orders/${doc}`);
      applyOrder(res.data.data);
      setMessage({ type: 'success', text: `Loaded demand order #${doc}.` });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Order not found.' });
    } finally {
      setLoading(false);
    }
  };

  const saveOrder = async (isUpdate) => {
    if (!lines.length) {
      setMessage({ type: 'error', text: 'Add at least one product line.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const payload = {
        doc: savedDoc || (isUpdate ? header.doc : undefined),
        date: header.date,
        description: header.description,
        items: lines.map((l) => ({
          productId: l.productId,
          description: l.description,
          productName: l.description,
          packingSize: l.packingSize,
          packets: l.packets ?? l.packing,
          pcs: l.pcs,
        })),
      };
      let res;
      if (savedDoc && isUpdate) {
        res = await api.put(`/demand-orders/${savedDoc}`, payload);
      } else {
        res = await api.post('/demand-orders', payload);
      }
      applyOrder(res.data.data);
      setMessage({ type: 'success', text: res.data.message || 'Saved successfully.' });
      await loadStockStatus();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Save failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!savedDoc) {
      setMessage({ type: 'error', text: 'No saved record to delete.' });
      return;
    }
    if (!window.confirm(`Delete demand order #${savedDoc}?`)) return;
    setLoading(true);
    try {
      await api.delete(`/demand-orders/${savedDoc}`);
      setMessage({ type: 'success', text: `Demand order #${savedDoc} deleted.` });
      setLines([]);
      setSavedDoc(null);
      await loadNextDoc();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Delete failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!lines.length) {
      setMessage({ type: 'error', text: 'Nothing to print. Add items first.' });
      return;
    }
    const w = window.open('', '_blank');
    const rows = lines.map((l) => `
      <tr>
        <td>${l.sr}</td>
        <td>${l.description}</td>
        <td>${l.packingDisplay || l.packing}</td>
        <td>${l.pcs}</td>
      </tr>`).join('');
    w.document.write(`
      <html><head><title>Demand Order #${header.doc}</title>
      <style>body{font-family:Arial,sans-serif;padding:16px} table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #333;padding:6px;text-align:center} th{background:#ddd}</style></head>
      <body>
        <h2>Demand Order Form</h2>
        <p><b>D.O #:</b> ${header.doc} &nbsp; <b>Date:</b> ${formatDisplayDate(header.date)}</p>
        <p><b>Description:</b> ${header.description || '-'}</p>
        <table><thead><tr><th>Sr#</th><th>Description</th><th>Packing</th><th>Pc(s)</th></tr></thead>
        <tbody>${rows}</tbody></table>
        <p style="text-align:right"><b>Total Packets:</b> ${totals.totalPackets} &nbsp;
        <b>Total Psc.:</b> ${totals.totalPcs}</p>
      </body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  const openReport = async () => {
    setShowReport(true);
    try {
      const res = await api.get('/demand-orders', { params: { limit: 100 } });
      setReportList(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      setReportList([]);
    }
  };

  const canUpdate = editIndex !== null;
  const canRemove = editIndex !== null;
  const canSave = lines.length > 0 && !loading;
  const canUpdateRecord = Boolean(savedDoc) && lines.length > 0 && !loading;
  const canDelete = Boolean(savedDoc) && !loading;
  const canPrint = lines.length > 0;

  return (
    <div style={s.page}>
      <div style={s.titleBar}>Demand Order Form</div>

      {message && (
        <div style={message.type === 'success' ? s.msgOk : s.msgErr}>{message.text}</div>
      )}

      <div style={s.headerBox}>
        <label style={s.lbl}>D.O #</label>
        <input
          style={s.inpSm}
          value={header.doc}
          onChange={(e) => setHeader((h) => ({ ...h, doc: e.target.value }))}
          onBlur={handleLoadByDoc}
          onKeyDown={(e) => e.key === 'Enter' && handleLoadByDoc()}
        />
        <label style={s.lbl}>Date</label>
        <input
          type="date"
          style={s.inpDate}
          value={header.date}
          onChange={(e) => setHeader((h) => ({ ...h, date: e.target.value }))}
        />
        <label style={s.lbl}>Description</label>
        <input
          style={s.inpDesc}
          value={header.description}
          onChange={(e) => setHeader((h) => ({ ...h, description: e.target.value }))}
        />
      </div>

      <div style={s.entryBox}>
        <div style={s.entryRow}>
          <label style={s.lbl}>Select Product</label>
          <select
            style={s.selProduct}
            name="productId"
            value={entry.productId}
            onChange={handleEntryChange}
          >
            <option value="">— Select —</option>
            {productsList.map((p) => (
              <option key={p.id || p._id} value={p.id || p._id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
          <button type="button" style={s.btnSmall} onClick={() => setShowProductModal(true)}>…</button>
        </div>
        <div style={s.entryRow2}>
          <label style={s.lbl}>U.O.M</label>
          <input style={s.inpTiny} value={entry.uom} readOnly />
          <label style={s.lbl}>Available Stock</label>
          <input style={s.inpStock} value={entry.availableStock} readOnly />
          <label style={s.lbl}>Packet(s)</label>
          <input
            style={s.inpQty}
            name="packets"
            value={entry.packets}
            onChange={handleEntryChange}
            type="number"
            min="0"
            step="any"
          />
          <label style={s.lbl}>Pc(s)</label>
          <input
            style={s.inpQty}
            name="pcs"
            value={entry.pcs}
            onChange={handleEntryChange}
            type="number"
            min="0"
            step="any"
          />
          <label style={s.lbl}>Total Qty.</label>
          <input style={s.inpQty} value={entry.totalQty} readOnly />
          <button type="button" style={s.btn} onClick={resetEntry}>Reset</button>
          <button type="button" style={s.btn} onClick={handleAdd}>Add</button>
          <button type="button" style={s.btn} onClick={handleUpdate} disabled={!canUpdate}>Update</button>
          <button type="button" style={s.btn} onClick={handleRemove} disabled={!canRemove}>Remove</button>
        </div>
      </div>

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
                <tr
                  key={`${row.productId}-${idx}`}
                  style={editIndex === idx ? s.rowSel : s.row}
                  onClick={() => handleRowClick(idx)}
                >
                  <td style={s.td}>{row.sr}</td>
                  <td style={{ ...s.td, ...s.tdLeft }}>{row.description}</td>
                  <td style={s.td}>{row.packingDisplay ?? row.packing}</td>
                  <td style={s.td}>{row.pcs}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Sr.#</th>
              <th style={s.th}>Description</th>
              <th style={s.th}>Min. Qty</th>
              <th style={s.th}>Available</th>
            </tr>
          </thead>
          <tbody>
            {stockRows.length === 0 ? (
              <tr><td colSpan={4} style={s.emptyCell}>Loading stock…</td></tr>
            ) : (
              stockRows.slice(0, 200).map((row) => (
                <tr
                  key={row.productId}
                  style={s.row}
                  onDoubleClick={() => {
                    setEntry((prev) => ({
                      ...initialEntry,
                      productId: String(row.productId),
                      productCode: row.productCode || '',
                      description: row.description || '',
                      productName: row.description || '',
                      packingSize: row.packingSize > 0 ? String(row.packingSize) : '',
                    }));
                    loadProductInfo(row.productId);
                  }}
                  title="Double-click to select product"
                >
                  <td>{row.sr}</td>
                  <td style={s.tdLeft}>{row.description}</td>
                  <td>{row.minQty}</td>
                  <td style={parseFloat(row.available) <= parseFloat(row.minQty) ? { color: '#c00', fontWeight: 'bold' } : undefined}>
                    {row.available}
                  </td>
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
        <button type="button" style={s.actionBtn} onClick={() => saveOrder(false)} disabled={!canSave}>💾 Save Record</button>
        <button type="button" style={s.actionBtn} onClick={() => saveOrder(true)} disabled={!canUpdateRecord}>✎ Update</button>
        <button type="button" style={s.actionBtn} onClick={handleDelete} disabled={!canDelete}>✕ Delete Record</button>
        <button type="button" style={s.actionBtn} onClick={handlePrint} disabled={!canPrint}>🖨 Print D.O</button>
        <button type="button" style={s.actionBtn} onClick={openReport}>📋 Report</button>
        <button type="button" style={{ ...s.actionBtn, marginLeft: 'auto', background: '#8b0000' }} onClick={() => navigate('/')}>✕ Close</button>
      </div>

      {showProductModal && (
        <ProductSearchModal
          isOpen={showProductModal}
          onClose={() => setShowProductModal(false)}
          onSelectProduct={handleProductSelect}
        />
      )}

      {showReport && (
        <div style={s.modalOverlay} onClick={() => setShowReport(false)} role="presentation">
          <div style={s.modal} onClick={(e) => e.stopPropagation()} role="dialog">
            <h3 style={{ margin: '0 0 12px' }}>Demand Orders</h3>
            <table style={s.table}>
              <thead>
                <tr>
                  <th>D.O #</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Packets</th>
                  <th>Pcs</th>
                </tr>
              </thead>
              <tbody>
                {reportList.map((r) => (
                  <tr
                    key={r.doc}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setShowReport(false);
                      setHeader((h) => ({ ...h, doc: String(r.doc) }));
                      api.get(`/demand-orders/${r.doc}`).then((res) => applyOrder(res.data.data));
                    }}
                  >
                    <td>{r.doc}</td>
                    <td>{formatDisplayDate(r.date)}</td>
                    <td style={s.tdLeft}>{r.description}</td>
                    <td>{r.totalPackets}</td>
                    <td>{r.totalPcs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" style={{ ...s.btn, marginTop: 12 }} onClick={() => setShowReport(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

const s = {
  page: {
    fontFamily: 'Tahoma, Segoe UI, sans-serif',
    fontSize: 12,
    background: '#c0c0c0',
    minHeight: '100vh',
    padding: 8,
    boxSizing: 'border-box',
  },
  titleBar: {
    background: 'linear-gradient(180deg, #4a4a4a 0%, #2d2d2d 100%)',
    color: '#fff',
    textAlign: 'center',
    padding: '6px 8px',
    fontWeight: 'bold',
    border: '1px solid #1a1a1a',
    marginBottom: 6,
  },
  msgOk: { background: '#d4edda', color: '#155724', padding: 8, marginBottom: 6, border: '1px solid #a5d6a7' },
  msgErr: { background: '#f8d7da', color: '#721c24', padding: 8, marginBottom: 6, border: '1px solid #ef9a9a' },
  headerBox: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    background: '#d4d4d4',
    border: '1px solid #888',
    marginBottom: 6,
  },
  entryBox: {
    padding: 8,
    background: '#d4d4d4',
    border: '1px solid #888',
    marginBottom: 6,
  },
  entryRow: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 },
  entryRow2: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  lbl: { fontWeight: 500, whiteSpace: 'nowrap' },
  inpSm: { width: 56, padding: '2px 4px', border: '1px solid #888' },
  inpDate: { width: 130, padding: '2px 4px', border: '1px solid #888' },
  inpDesc: { flex: 1, minWidth: 200, padding: '2px 4px', border: '1px solid #888' },
  selProduct: { minWidth: 280, maxWidth: 420, padding: '2px 4px', border: '1px solid #888' },
  btnSmall: { padding: '2px 8px', border: '1px solid #888', background: '#e8e8e8', cursor: 'pointer' },
  inpTiny: { width: 48, padding: '2px 4px', border: '1px solid #888', background: '#fff' },
  inpStock: { width: 72, padding: '2px 4px', border: '1px solid #888', background: '#ffffcc' },
  inpQty: { width: 64, padding: '2px 4px', border: '1px solid #888' },
  btn: {
    padding: '3px 12px',
    border: '1px solid #888',
    background: 'linear-gradient(180deg, #f0f0f0, #d8d8d8)',
    cursor: 'pointer',
  },
  gridWrap: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#fff',
    fontSize: 11,
  },
  th: {
    background: '#d0d0d0',
    border: '1px solid #888',
    padding: '4px 6px',
    fontWeight: 'bold',
  },
  td: {
    border: '1px solid #999',
    padding: '3px 6px',
    textAlign: 'center',
  },
  row: { cursor: 'pointer' },
  rowSel: { cursor: 'pointer', background: '#b3d9ff' },
  emptyCell: { textAlign: 'center', padding: 12, color: '#666' },
  tdLeft: { textAlign: 'left', paddingLeft: 6 },
  totalsRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    padding: '6px 8px',
    background: '#d4d4d4',
    border: '1px solid #888',
    marginBottom: 6,
  },
  inpTotal: { width: 80, padding: '2px 4px', border: '1px solid #888', fontWeight: 'bold', textAlign: 'right' },
  actionBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    padding: 8,
    background: '#4a4a4a',
    border: '1px solid #333',
  },
  actionBtn: {
    padding: '6px 12px',
    border: '1px solid #666',
    background: '#6a6a6a',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 11,
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#fff',
    padding: 16,
    maxWidth: '90vw',
    maxHeight: '80vh',
    overflow: 'auto',
    border: '2px solid #333',
  },
};

export default DemandOrder;
