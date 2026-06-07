import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ProductSearchModal from '../components/ProductSearchModal';
import SupplierSearchModal from '../components/SupplierSearchModal';

const initialEntry = {
  productId: '',
  productCode: '',
  productName: '',
  uom: 'PCS',
  packingSize: '',
  packing: '',
  pcs: '',
  totalPcs: '',
  locationId: '',
  locationName: '',
  availableStock: '0',
};

const calcTotalPcs = (packing, packingSize, pcs) => {
  const pk = parseFloat(packing) || 0;
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

const Exchange = () => {
  const navigate = useNavigate();
  const [header, setHeader] = useState({
    invoiceNo: '',
    date: toInputDate(),
    customerId: '',
    customerCode: '',
    customerName: '',
    customerAddress: '',
    description: '',
  });
  const [entry, setEntry] = useState(initialEntry);
  const [lines, setLines] = useState([]);
  const [locations, setLocations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [savedDoc, setSavedDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const totalPcsFooter = useMemo(
    () => lines.reduce((s, l) => s + (parseFloat(l.totalPcs) || 0), 0),
    [lines],
  );

  const loadLocations = useCallback(async () => {
    try {
      const res = await api.get('/exchanges/locations');
      setLocations(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      setLocations([]);
    }
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      const res = await api.get('/exchanges/customers');
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setCustomers(list);
    } catch {
      try {
        const res2 = await api.get('/customers');
        setCustomers(Array.isArray(res2.data) ? res2.data : []);
      } catch {
        setCustomers([]);
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

  const refreshAvailableStock = useCallback(async (productId, locationId) => {
    if (!productId) return;
    try {
      const res = await api.get(`/exchanges/available/${productId}`, {
        params: { locationId: locationId || '' },
      });
      setEntry((prev) => ({
        ...prev,
        availableStock: String(res.data.availableStock ?? 0),
      }));
    } catch {
      setEntry((prev) => ({ ...prev, availableStock: '0' }));
    }
  }, []);

  const applyExchange = useCallback((data) => {
    if (!data) return;
    setHeader({
      invoiceNo: String(data.doc || data.invoiceNo || ''),
      date: toInputDate(data.date),
      customerId: data.customerId != null ? String(data.customerId) : '',
      customerCode: data.customerCode || '',
      customerName: data.customerName || '',
      customerAddress: data.customerAddress || '',
      description: data.description || '',
    });
    setSavedDoc(data.doc);
    setLines(
      (data.items || []).map((item, i) => ({
        sr: i + 1,
        productId: item.productId,
        productCode: item.productCode || '',
        productName: item.productName || '',
        uom: item.uom || 'PCS',
        packing: item.packing ?? 0,
        packingSize: item.packingSize ?? 0,
        packingDisplay: item.packingDisplay || String(item.packing ?? ''),
        pcs: item.pcs ?? 0,
        totalPcs: item.totalPcs ?? 0,
        locationId: item.locationId ?? '',
        locationName: item.locationName || '',
      })),
    );
    resetEntry();
  }, [resetEntry]);

  const loadNextInvoice = useCallback(async () => {
    try {
      const res = await api.get('/exchanges/next-number');
      setHeader((h) => ({
        ...h,
        invoiceNo: String(res.data.nextNumber || res.data.invoiceNo || ''),
        customerId: '',
        customerCode: '',
        customerName: '',
        customerAddress: '',
        description: '',
      }));
      setSavedDoc(null);
      setLines([]);
      resetEntry();
    } catch {
      setHeader((h) => ({ ...h, invoiceNo: '1' }));
    }
  }, [resetEntry]);

  const loadLatest = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/exchanges/latest');
      const data = res.data.data;
      if (data?.customerId) {
        try {
          const cRes = await api.get(`/exchanges/customers/${data.customerId}`);
          data.customerAddress = cRes.data.data?.address || '';
        } catch {
          /* ignore */
        }
      }
      applyExchange(data);
    } catch (err) {
      if (err.response?.status === 404) {
        await loadNextInvoice();
        setLines([]);
      }
    } finally {
      setLoading(false);
    }
  }, [applyExchange, loadNextInvoice]);

  useEffect(() => {
    loadLocations();
    loadCustomers();
    loadProducts();
    loadLatest();
  }, [loadLocations, loadCustomers, loadProducts, loadLatest]);

  const loadProductInfo = async (productId, locationId) => {
    if (!productId) return;
    try {
      const res = await api.get(`/exchanges/product/${productId}`, {
        params: { locationId: locationId ?? '' },
      });
      const p = res.data.data;
      const packingSize = p.packingSize ?? 0;
      setEntry((prev) => ({
        ...prev,
        productId: String(p.productId),
        productCode: p.productCode || '',
        productName: p.productName || '',
        uom: p.uom || 'PCS',
        packingSize: packingSize > 0 ? String(packingSize) : '',
        availableStock: String(p.availableStock ?? 0),
        totalPcs: String(calcTotalPcs(prev.packing, packingSize, prev.pcs)),
      }));
    } catch {
      const prod = productsList.find((x) => String(x.id || x._id) === String(productId));
      if (prod) {
        setEntry((prev) => ({
          ...prev,
          productId: String(productId),
          productCode: prod.code || '',
          productName: prod.name || '',
          uom: prod.unit || prod.uom || 'PCS',
          packingSize: prod.packing > 0 ? String(prod.packing) : '',
        }));
        refreshAvailableStock(productId, locationId);
      }
    }
  };

  const handleCustomerSelect = (customer) => {
    const id = customer.id || customer._id || customer.Id;
    setHeader((h) => ({
      ...h,
      customerId: String(id),
      customerCode: customer.code || '',
      customerName: customer.name || customer.customerName || customer.accountTitle || '',
      customerAddress: customer.address || '',
    }));
    setShowCustomerModal(false);
  };

  const handleCustomerDropdown = (e) => {
    const id = e.target.value;
    const cust = customers.find((c) => String(c.id || c._id || c.Id) === String(id));
    setHeader((h) => ({
      ...h,
      customerId: id,
      customerCode: cust?.code || '',
      customerName: cust?.name || cust?.customerName || '',
      customerAddress: cust?.address || '',
    }));
    if (id) {
      api.get(`/exchanges/customers/${id}`).then((res) => {
        setHeader((h) => ({
          ...h,
          customerAddress: res.data.data?.address || h.customerAddress,
        }));
      }).catch(() => {});
    }
  };

  const handleProductSelect = (product) => {
    const id = product.id || product._id;
    setEntry((prev) => ({
      ...prev,
      productId: String(id),
      productCode: product.code || '',
      productName: product.name || '',
      packingSize: product.packing > 0 ? String(product.packing) : '',
      uom: product.unit || product.uom || 'PCS',
    }));
    setShowProductModal(false);
    loadProductInfo(id, entry.locationId);
  };

  const handleEntryChange = (e) => {
    const { name, value } = e.target;
    if (name === 'productId') {
      setEntry((prev) => ({ ...prev, productId: value }));
      if (value) loadProductInfo(value, entry.locationId);
      return;
    }
    if (name === 'locationId') {
      const loc = locations.find((l) => String(l.id) === String(value));
      setEntry((prev) => {
        const next = {
          ...prev,
          locationId: value,
          locationName: loc?.name || '',
        };
        if (prev.productId) {
          loadProductInfo(prev.productId, value);
        }
        return next;
      });
      return;
    }
    setEntry((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'packing' || name === 'pcs') {
        next.totalPcs = String(calcTotalPcs(
          name === 'packing' ? value : prev.packing,
          prev.packingSize,
          name === 'pcs' ? value : prev.pcs,
        ));
      }
      return next;
    });
  };

  const buildLine = () => {
    const totalPcs = calcTotalPcs(entry.packing, entry.packingSize, entry.pcs);
    if (!entry.productId) throw new Error('Select a product first.');
    if (!entry.locationId) throw new Error('Select From Location.');
    if (totalPcs <= 0) throw new Error('Enter packing and/or piece quantity.');
    const avail = parseFloat(entry.availableStock) || 0;
    if (totalPcs > avail) {
      throw new Error(`Insufficient stock. Available: ${avail}, requested: ${totalPcs}`);
    }
    const ps = parseFloat(entry.packingSize) || 0;
    const pk = parseFloat(entry.packing) || 0;
    const packingDisplay = ps > 0 && pk > 0 ? `${pk} x ${ps}` : (pk > 0 ? String(pk) : '-');
    return {
      productId: Number(entry.productId),
      productCode: entry.productCode,
      productName: entry.productName,
      uom: entry.uom,
      packing: pk,
      packingSize: ps,
      packingDisplay,
      packets: pk,
      pcs: parseFloat(entry.pcs) || 0,
      totalPcs,
      locationId: entry.locationId,
      locationName: entry.locationName,
    };
  };

  const handleAdd = () => {
    try {
      const line = buildLine();
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
      const line = buildLine();
      setLines((prev) => {
        const next = [...prev];
        next[editIndex] = { sr: editIndex + 1, ...line };
        return next.map((r, i) => ({ ...r, sr: i + 1 }));
      });
      resetEntry();
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
      productName: row.productName || '',
      uom: row.uom || 'PCS',
      packingSize: row.packingSize > 0 ? String(row.packingSize) : '',
      packing: String(row.packing ?? ''),
      pcs: String(row.pcs ?? ''),
      totalPcs: String(row.totalPcs ?? ''),
      locationId: row.locationId != null ? String(row.locationId) : '',
      locationName: row.locationName || '',
      availableStock: '',
    });
    loadProductInfo(row.productId, row.locationId);
  };

  const handleRefresh = async () => {
    setMessage(null);
    resetEntry();
    if (savedDoc) {
      await loadLatest();
    } else {
      await loadNextInvoice();
    }
  };

  const loadByInvoice = async () => {
    const inv = header.invoiceNo?.trim();
    if (!inv) return;
    setLoading(true);
    try {
      const res = await api.get(`/exchanges/${inv}`);
      const data = res.data.data;
      if (data?.customerId) {
        try {
          const cRes = await api.get(`/exchanges/customers/${data.customerId}`);
          data.customerAddress = cRes.data.data?.address || '';
        } catch {
          /* ignore */
        }
      }
      applyExchange(data);
      setMessage({ type: 'success', text: `Loaded exchange #${inv}.` });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Invoice not found.' });
    } finally {
      setLoading(false);
    }
  };

  const saveExchange = async (isUpdate) => {
    if (!header.customerId) {
      setMessage({ type: 'error', text: 'Select buyer name before saving.' });
      return;
    }
    if (!lines.length) {
      setMessage({ type: 'error', text: 'Add at least one product line.' });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        date: header.date,
        customerId: header.customerId,
        customerCode: header.customerCode,
        customerName: header.customerName,
        description: header.description,
        items: lines.map((l) => ({
          productId: l.productId,
          packets: l.packing,
          packing: l.packing,
          packingSize: l.packingSize,
          pcs: l.pcs,
          locationId: l.locationId,
          locationName: l.locationName,
        })),
      };
      const res = savedDoc && isUpdate
        ? await api.put(`/exchanges/${savedDoc}`, payload)
        : await api.post('/exchanges', payload);
      const data = res.data.data;
      if (data?.customerId && header.customerAddress) {
        data.customerAddress = header.customerAddress;
      }
      applyExchange(data);
      setMessage({ type: 'success', text: res.data.message || 'Saved.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Save failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!savedDoc) {
      setMessage({ type: 'error', text: 'No saved record to delete.' });
      return;
    }
    if (!window.confirm(`Delete exchange #${savedDoc}?`)) return;
    setLoading(true);
    try {
      await api.delete(`/exchanges/${savedDoc}`);
      setMessage({ type: 'success', text: `Deleted exchange #${savedDoc}.` });
      setLines([]);
      setSavedDoc(null);
      await loadNextInvoice();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Delete failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.titleBar}>Exchange Form</div>

      {message && (
        <div style={message.type === 'success' ? s.msgOk : s.msgErr}>{message.text}</div>
      )}

      <div style={s.headerBox}>
        <label style={s.lbl}>Invoice #</label>
        <input
          style={s.inpSm}
          value={header.invoiceNo}
          onChange={(e) => setHeader((h) => ({ ...h, invoiceNo: e.target.value }))}
          onBlur={loadByInvoice}
          onKeyDown={(e) => e.key === 'Enter' && loadByInvoice()}
        />
        <label style={s.lbl}>Date</label>
        <input
          type="date"
          style={s.inpDate}
          value={header.date}
          onChange={(e) => setHeader((h) => ({ ...h, date: e.target.value }))}
        />
        <label style={s.lbl}>Code</label>
        <input style={s.inpCode} value={header.customerCode} readOnly />
        <label style={s.lbl}>Buyer Name</label>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <select
            style={s.selBuyer}
            value={header.customerId}
            onChange={handleCustomerDropdown}
          >
            <option value="">— Select —</option>
            {customers.map((c) => (
              <option key={c.id || c._id || c.Id} value={c.id || c._id || c.Id}>
                {c.code} — {c.name || c.customerName}
              </option>
            ))}
          </select>
          <button type="button" style={s.btnSmall} onClick={() => setShowCustomerModal(true)}>…</button>
        </div>
        <label style={s.lbl}>Description</label>
        <input
          style={s.inpDesc}
          value={header.description}
          onChange={(e) => setHeader((h) => ({ ...h, description: e.target.value }))}
        />
        {header.customerAddress ? (
          <div style={s.addressBar}>{header.customerAddress}</div>
        ) : null}
      </div>

      <div style={s.entryBox}>
        <div style={s.entryRow}>
          <label style={s.lbl}>Product ID</label>
          <input style={s.inpId} value={entry.productCode} readOnly placeholder="—" />
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
          <label style={s.lbl}>From Location</label>
          <select
            style={s.selLoc}
            name="locationId"
            value={entry.locationId}
            onChange={handleEntryChange}
          >
            <option value="">—</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
          <label style={s.lbl}>Packing</label>
          <input
            style={s.inpQty}
            name="packing"
            value={entry.packing}
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
          <label style={s.lbl}>Total Pcs.</label>
          <input style={s.inpQty} value={entry.totalPcs} readOnly />
        </div>
        <div style={s.stockBar}>
          <span>Available Stock: <strong>{entry.availableStock || '0'}</strong></span>
          {entry.locationName && (
            <span style={{ marginLeft: 8, color: '#444' }}>(at {entry.locationName})</span>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button type="button" style={s.btn} onClick={resetEntry}>Reset</button>
            <button type="button" style={s.btn} onClick={handleAdd}>Add</button>
            <button type="button" style={s.btn} onClick={handleUpdate} disabled={editIndex === null}>Update</button>
            <button type="button" style={s.btn} onClick={handleRemove} disabled={editIndex === null}>Remove</button>
          </div>
        </div>
      </div>

      <div style={s.sectionLabel}>Product(s) Information</div>
      <div style={s.gridWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Sr.#</th>
              <th style={s.th}>Product</th>
              <th style={s.th}>U.O.M</th>
              <th style={s.th}>Packing</th>
              <th style={s.th}>Pc(s)</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr><td colSpan={5} style={s.emptyCell}>—</td></tr>
            ) : (
              lines.map((row, idx) => (
                <tr
                  key={`${row.productId}-${idx}`}
                  style={editIndex === idx ? s.rowSel : s.row}
                  onClick={() => handleRowClick(idx)}
                >
                  <td style={s.td}>{row.sr}</td>
                  <td style={{ ...s.td, textAlign: 'left' }}>{row.productName}</td>
                  <td style={s.td}>{row.uom}</td>
                  <td style={s.td}>{row.packingDisplay ?? row.packing}</td>
                  <td style={s.td}>{row.totalPcs}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={s.totalsRow}>
        <label style={s.lbl}>Total Pcs.</label>
        <input style={s.inpTotal} value={totalPcsFooter} readOnly />
      </div>

      <div style={s.actionBar}>
        <button type="button" style={s.actionBtn} onClick={handleRefresh} disabled={loading}>↻ Refresh</button>
        <button type="button" style={s.actionBtn} onClick={() => saveExchange(false)} disabled={loading || !lines.length}>💾 Save Record</button>
        <button type="button" style={s.actionBtn} onClick={() => saveExchange(true)} disabled={loading || !savedDoc || !lines.length}>✎ Update</button>
        <button type="button" style={s.actionBtn} onClick={handleDelete} disabled={loading || !savedDoc}>✕ Delete Record</button>
        <button type="button" style={{ ...s.actionBtn, marginLeft: 'auto', background: '#8b0000' }} onClick={() => navigate('/')}>✕ Close</button>
      </div>

      {showProductModal && (
        <ProductSearchModal
          isOpen={showProductModal}
          onClose={() => setShowProductModal(false)}
          onSelectProduct={handleProductSelect}
        />
      )}

      {showCustomerModal && (
        <SupplierSearchModal
          isOpen={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          onSelectSupplier={handleCustomerSelect}
          type="customer"
        />
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
  addressBar: {
    width: '100%',
    fontSize: 11,
    color: '#333',
    padding: '2px 4px',
    borderTop: '1px dashed #999',
    marginTop: 2,
  },
  entryBox: {
    padding: 8,
    background: '#d4d4d4',
    border: '1px solid #888',
    marginBottom: 4,
  },
  entryRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 6 },
  stockBar: { display: 'flex', alignItems: 'center', padding: '4px 0', fontSize: 12 },
  sectionLabel: {
    padding: '4px 8px',
    background: '#b8b8b8',
    border: '1px solid #888',
    borderBottom: 'none',
    fontWeight: 'bold',
  },
  lbl: { fontWeight: 500, whiteSpace: 'nowrap' },
  inpSm: { width: 56, padding: '2px 4px', border: '1px solid #888' },
  inpDate: { width: 130, padding: '2px 4px', border: '1px solid #888' },
  inpCode: { width: 56, padding: '2px 4px', border: '1px solid #888', background: '#f5f5f5' },
  inpDesc: { flex: 1, minWidth: 160, padding: '2px 4px', border: '1px solid #888' },
  inpId: { width: 48, padding: '2px 4px', border: '1px solid #888', background: '#f5f5f5' },
  selBuyer: { minWidth: 200, maxWidth: 280, padding: '2px 4px', border: '1px solid #888' },
  selProduct: { minWidth: 180, maxWidth: 280, padding: '2px 4px', border: '1px solid #888' },
  selLoc: { minWidth: 90, padding: '2px 4px', border: '1px solid #888' },
  inpQty: { width: 64, padding: '2px 4px', border: '1px solid #888' },
  btnSmall: { padding: '2px 8px', border: '1px solid #888', background: '#e8e8e8', cursor: 'pointer' },
  btn: {
    padding: '3px 12px',
    border: '1px solid #888',
    background: 'linear-gradient(180deg, #f0f0f0, #d8d8d8)',
    cursor: 'pointer',
  },
  gridWrap: { border: '1px solid #888', marginBottom: 6, maxHeight: 300, overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', fontSize: 11 },
  th: { background: '#d0d0d0', border: '1px solid #888', padding: '4px 6px', fontWeight: 'bold' },
  td: { border: '1px solid #999', padding: '3px 6px', textAlign: 'center' },
  row: { cursor: 'pointer' },
  rowSel: { cursor: 'pointer', background: '#b3d9ff' },
  emptyCell: { textAlign: 'center', padding: 16, color: '#666' },
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
  inpTotal: { width: 90, padding: '2px 4px', border: '1px solid #888', fontWeight: 'bold', textAlign: 'right' },
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
};

export default Exchange;
