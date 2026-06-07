import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ProductSearchModal from '../components/ProductSearchModal';
import SupplierSearchModal from '../components/SupplierSearchModal';

const initialEntry = {
  productId: '',
  productCode: '',
  productName: '',
  locationId: '',
  locationName: '',
  packQty: '',
  packingSize: '',
  pcs: '',
  totalPcs: '',
  rate: '',
  amount: '0.00',
  discPercent: '',
  discount: '0.00',
  net: '0.00',
  uom: 'PCS',
  availableStock: '0',
};

const toInputDate = (value) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
};

const formatDisplayDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
};

const calcPcsFromPackQty = (packQty, packingSize) => {
  const pq = parseFloat(packQty) || 0;
  const ps = parseFloat(packingSize) || 0;
  if (ps <= 0 || pq <= 0) return '';
  return String(pq * ps);
};

const calcTotalPcs = (packQty, packingSize, pcs) => {
  const pk = parseFloat(packQty) || 0;
  const ps = parseFloat(packingSize) || 0;
  const pc = parseFloat(pcs) || 0;
  if (ps > 0) return pk * ps + pc;
  return pc;
};

const hasProductPacking = (entry) => (parseFloat(entry?.packingSize) || 0) > 0;

const recalcEntryAmounts = (entry) => {
  const pcs = parseFloat(entry.pcs) || 0;
  const rate = parseFloat(entry.rate) || 0;
  const discPercent = parseFloat(entry.discPercent) || 0;
  const amount = pcs * rate;
  const discount = (amount * discPercent) / 100;
  const net = amount - discount;
  return {
    ...entry,
    amount: amount.toFixed(2),
    discount: discount.toFixed(2),
    net: net.toFixed(2),
  };
};

const formatPackingCell = (line) => {
  const packingSize = parseFloat(line.packingSize) || 0;
  const packQty = line.packQty ?? line.packing;
  if (packingSize > 0 && packQty) return `${packQty} x ${packingSize}`;
  if (packQty) return String(packQty);
  return line.packing != null ? String(line.packing) : '-';
};

const inp = { padding: '4px 6px', border: '1px solid #999', fontSize: '12px', width: '100%', boxSizing: 'border-box' };
const ro = { ...inp, backgroundColor: '#f0f0f0' };
const lbl = { fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '2px' };

const API = '/claims-out-to-supplier';

function ClaimOutToSuppliers() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [header, setHeader] = useState({
    invoiceNo: '',
    date: toInputDate(),
    paymentType: 'Credit',
    supplierId: '',
    supplierCode: '',
    supplierName: '',
    creditDays: '',
    dueDate: toInputDate(),
    transporter: '',
    builtyNo: '',
    description: '',
    cashPaid: '',
    discPercentFooter: '',
    previousBalance: '0',
    sendSMS: false,
    printPreBalance: true,
  });

  const [entry, setEntry] = useState(initialEntry);
  const [lines, setLines] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [locations, setLocations] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [savedDoc, setSavedDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [receiptImage, setReceiptImage] = useState(null);

  const lineTotals = useMemo(() => {
    const totalPcs = lines.reduce((s, l) => s + (parseFloat(l.totalPcs ?? l.pcs) || 0), 0);
    const netAmount = lines.reduce((s, l) => s + (parseFloat(l.net) || 0), 0);
    return { totalPcs, netAmount };
  }, [lines]);

  const footerTotals = useMemo(() => {
    const netAmount = lineTotals.netAmount;
    const discPct = parseFloat(header.discPercentFooter) || 0;
    const extraDiscount = (netAmount * discPct) / 100;
    const billAmount = netAmount - extraDiscount;
    const prevBal = parseFloat(header.previousBalance) || 0;
    const cashPaid = parseFloat(header.cashPaid) || 0;
    const netPayable = billAmount + prevBal - cashPaid;
    return {
      totalPcs: lineTotals.totalPcs,
      netAmount: netAmount.toFixed(2),
      extraDiscount: extraDiscount.toFixed(2),
      billAmount: billAmount.toFixed(2),
      netPayable: netPayable.toFixed(2),
    };
  }, [lineTotals, header.discPercentFooter, header.previousBalance, header.cashPaid]);

  const resetEntry = useCallback(() => {
    setEntry(initialEntry);
    setEditIndex(null);
    setPurchaseHistory([]);
  }, []);

  const loadLocations = useCallback(async () => {
    try {
      const res = await api.get('/opening-stock/locations');
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setLocations(list);
      setTransporters(list.map((l) => l.name || l.locationName).filter(Boolean));
    } catch {
      setLocations([]);
      setTransporters([]);
    }
  }, []);

  const loadSuppliers = useCallback(async () => {
    try {
      const res = await api.get('/suppliers');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setSuppliers(list);
    } catch {
      try {
        const res2 = await api.get('/purchase-orders/suppliers');
        const list = Array.isArray(res2.data?.data) ? res2.data.data : (Array.isArray(res2.data) ? res2.data : []);
        setSuppliers(list);
      } catch {
        setSuppliers([]);
      }
    }
  }, []);

  const loadNextInvoice = useCallback(async () => {
    try {
      const res = await api.get(`${API}/next-number`);
      setHeader((h) => ({
        ...h,
        invoiceNo: String(res.data.invoiceNo || res.data.nextDoc || ''),
      }));
      setSavedDoc(null);
      setLines([]);
      resetEntry();
    } catch {
      setHeader((h) => ({ ...h, invoiceNo: '1' }));
    }
  }, [resetEntry]);

  const applyVoucher = useCallback((p) => {
    if (!p) return;
    setHeader({
      invoiceNo: String(p.invoiceNo || p.id || ''),
      date: toInputDate(p.date),
      paymentType: p.paymentType || 'Credit',
      supplierId: p.supplierId != null ? String(p.supplierId) : '',
      supplierCode: p.supplierCode || '',
      supplierName: p.supplierName || '',
      creditDays: p.creditDays != null ? String(p.creditDays) : '',
      dueDate: toInputDate(p.dueDate),
      transporter: p.transporter || '',
      builtyNo: p.builtyNo || '',
      description: p.description || '',
      cashPaid: p.cashPaid != null ? String(p.cashPaid) : '',
      discPercentFooter: p.discPercentFooter != null ? String(p.discPercentFooter) : '',
      previousBalance: p.previousBalance != null ? String(p.previousBalance) : '0',
      sendSMS: Boolean(p.sendSMS),
      printPreBalance: p.printPreBalance !== false,
    });
    setSavedDoc(p.id);
    setLines(
      (p.products || []).map((row, i) => ({
        sr: i + 1,
        productId: row.productId,
        productCode: row.productCode || '',
        productName: row.productName || '',
        location: row.location || '',
        packQty: row.packing || '',
        packing: row.packing || '',
        packingSize: row.packingSize || '',
        pcs: row.pcs ?? 0,
        totalPcs: row.pcs ?? 0,
        rate: row.rate ?? 0,
        amount: row.amount ?? '0.00',
        discPercent: row.discPercent ?? '',
        discount: row.discount ?? '0.00',
        net: row.net ?? '0.00',
        uom: row.uom || 'PCS',
      })),
    );
    resetEntry();
  }, [resetEntry]);

  const loadLatest = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.get(`${API}/latest`);
      applyVoucher(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        await loadNextInvoice();
      }
    } finally {
      setLoading(false);
    }
  }, [applyVoucher, loadNextInvoice]);

  useEffect(() => {
    loadLocations();
    loadSuppliers();
    loadLatest();
  }, [loadLocations, loadSuppliers, loadLatest]);

  useEffect(() => {
    if (!header.creditDays || !header.date) return;
    const days = parseInt(header.creditDays, 10);
    if (!days) return;
    const d = new Date(header.date);
    if (Number.isNaN(d.getTime())) return;
    d.setDate(d.getDate() + days);
    setHeader((h) => ({ ...h, dueDate: d.toISOString().slice(0, 10) }));
  }, [header.creditDays, header.date]);

  const loadSupplierBalance = async (supplierId) => {
    if (!supplierId) return;
    try {
      const res = await api.get(`${API}/supplier/${supplierId}/balance`);
      setHeader((h) => ({ ...h, previousBalance: String(res.data.balance ?? 0) }));
    } catch {
      /* ignore */
    }
  };

  const loadProductInfo = async (productId) => {
    if (!productId) return;
    try {
      const res = await api.get(`/purchase-orders/product/${productId}`);
      const p = res.data.data;
      const packingSize = p.packingSize ?? 0;
      setEntry((prev) => {
        const updated = {
          ...prev,
          productId: String(p.productId),
          productCode: p.productCode || '',
          productName: p.productName || '',
          uom: p.uom || 'PCS',
          packingSize: packingSize > 0 ? String(packingSize) : '',
          availableStock: String(p.availableStock ?? 0),
          rate: p.purchaseRate != null ? String(p.purchaseRate) : prev.rate,
          totalPcs: String(calcTotalPcs(prev.packQty, packingSize, prev.pcs)),
        };
        return recalcEntryAmounts(updated);
      });
      const histRes = await api.get(`/purchases/product-history/${productId}`);
      setPurchaseHistory(Array.isArray(histRes.data) ? histRes.data : []);
    } catch {
      setPurchaseHistory([]);
    }
  };

  const handleSupplierSelect = (supplier) => {
    const id = supplier.id || supplier._id || supplier.Id;
    setHeader((h) => ({
      ...h,
      supplierId: String(id),
      supplierCode: supplier.code || '',
      supplierName: supplier.name || supplier.Subsidary || '',
    }));
    setShowSupplierModal(false);
    loadSupplierBalance(id);
  };

  const handleSupplierDropdown = (e) => {
    const id = e.target.value;
    const sup = suppliers.find((s) => String(s.id || s._id || s.Id) === String(id));
    setHeader((h) => ({
      ...h,
      supplierId: id,
      supplierCode: sup?.code || '',
      supplierName: sup?.name || sup?.Subsidary || '',
    }));
    if (id) loadSupplierBalance(id);
  };

  const handleProductSelect = (product) => {
    const pid = product.id || product._id;
    const packingSize = product.packing > 0 ? product.packing : 0;
    setEntry({
      ...initialEntry,
      productId: String(pid),
      productCode: product.code || '',
      productName: product.name || '',
      uom: product.uom || 'PCS',
      packingSize: packingSize > 0 ? String(packingSize) : '',
      rate: product.purchaseRate != null ? String(product.purchaseRate) : '',
    });
    setShowProductModal(false);
    loadProductInfo(pid);
  };

  const handleEntryChange = (e) => {
    const { name, value } = e.target;
    setEntry((prev) => {
      let updated = { ...prev, [name]: value };
      if (name === 'locationId') {
        const loc = locations.find((l) => String(l.id || l.locationId) === String(value));
        updated.locationName = loc?.name || loc?.locationName || '';
      }
      if (name === 'packQty' && hasProductPacking(updated)) {
        updated.pcs = calcPcsFromPackQty(value, updated.packingSize);
      }
      updated.totalPcs = String(calcTotalPcs(updated.packQty, updated.packingSize, updated.pcs));
      return recalcEntryAmounts(updated);
    });
  };

  const handleHeaderChange = (e) => {
    const { name, value, type, checked } = e.target;
    setHeader((h) => ({
      ...h,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validateLine = () => {
    if (!entry.productId) {
      alert('Please select a product.');
      return false;
    }
    if (hasProductPacking(entry)) {
      if (!entry.packQty || parseFloat(entry.packQty) <= 0) {
        alert('Please enter packing (packets).');
        return false;
      }
    } else if (!entry.pcs || parseFloat(entry.pcs) <= 0) {
      alert('Please enter Pc(s).');
      return false;
    }
    if (!entry.rate || parseFloat(entry.rate) <= 0) {
      alert('Please enter rate.');
      return false;
    }
    return true;
  };

  const buildLineFromEntry = () => ({
    productId: entry.productId,
    productCode: entry.productCode,
    productName: entry.productName,
    location: entry.locationName,
    packQty: entry.packQty,
    packing: hasProductPacking(entry) ? entry.packQty : '',
    packingSize: entry.packingSize,
    pcs: entry.pcs,
    totalPcs: calcTotalPcs(entry.packQty, entry.packingSize, entry.pcs),
    rate: entry.rate,
    amount: entry.amount,
    discPercent: entry.discPercent,
    discount: entry.discount,
    net: entry.net,
    uom: entry.uom,
  });

  const handleAddLine = () => {
    if (!validateLine()) return;
    setLines([...lines, { sr: lines.length + 1, ...buildLineFromEntry() }]);
    resetEntry();
  };

  const handleUpdateLine = () => {
    if (editIndex === null || !validateLine()) return;
    const updated = [...lines];
    updated[editIndex] = { sr: editIndex + 1, ...buildLineFromEntry() };
    setLines(updated);
    resetEntry();
  };

  const handleRemoveLine = () => {
    if (editIndex === null) return;
    setLines(lines.filter((_, i) => i !== editIndex).map((l, i) => ({ ...l, sr: i + 1 })));
    resetEntry();
  };

  const handleSelectLine = (line, index) => {
    setEditIndex(index);
    setEntry({
      ...initialEntry,
      productId: String(line.productId || ''),
      productCode: line.productCode || '',
      productName: line.productName || '',
      locationName: line.location || '',
      packQty: line.packQty || line.packing || '',
      packingSize: line.packingSize ? String(line.packingSize) : '',
      pcs: String(line.pcs ?? ''),
      totalPcs: String(line.totalPcs ?? line.pcs ?? ''),
      rate: String(line.rate ?? ''),
      amount: line.amount,
      discPercent: line.discPercent ?? '',
      discount: line.discount,
      net: line.net,
      uom: line.uom || 'PCS',
    });
    if (line.productId) loadProductInfo(line.productId);
  };

  const buildPayload = () => ({
    invoiceNo: header.invoiceNo,
    date: header.date,
    dueDate: header.dueDate,
    paymentType: header.paymentType,
    supplierId: header.supplierId,
    supplierCode: header.supplierCode,
    creditDays: header.creditDays,
    products: lines.map((l) => ({
      productId: l.productId,
      productCode: l.productCode,
      productName: l.productName,
      location: l.location,
      packing: l.packing || l.packQty || '',
      pcs: l.totalPcs ?? l.pcs,
      rate: l.rate,
      amount: l.amount,
      discPercent: l.discPercent,
      discount: l.discount,
      net: l.net,
      uom: l.uom,
    })),
    previousBalance: header.previousBalance,
    cashPaid: header.cashPaid,
    discPercentFooter: header.discPercentFooter,
    extraDiscount: footerTotals.extraDiscount,
    transporter: header.transporter,
    builtyNo: header.builtyNo,
    description: header.description,
    sendSMS: header.sendSMS,
    printPreBalance: header.printPreBalance,
  });

  const handleSave = async () => {
    if (!header.supplierId) {
      alert('Please select a supplier.');
      return;
    }
    if (lines.length === 0) {
      alert('Add at least one product.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(API, buildPayload());
      setMessage(res.data.message || 'Saved.');
      applyVoucher(res.data);
      if (window.confirm('Print voucher?')) handlePrint();
      else await loadNextInvoice();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRecord = async () => {
    if (!savedDoc) return;
    if (!window.confirm(`Update claim out #${savedDoc}?`)) return;
    setLoading(true);
    try {
      const res = await api.put(`${API}/${savedDoc}`, buildPayload());
      setMessage(res.data.message || 'Updated.');
      applyVoucher(res.data);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!savedDoc) return;
    if (!window.confirm(`Delete claim out #${savedDoc}?`)) return;
    setLoading(true);
    try {
      await api.delete(`${API}/${savedDoc}`);
      setMessage('Deleted.');
      await loadNextInvoice();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const q = window.prompt('Invoice or document number:');
    if (!q) return;
    setLoading(true);
    try {
      const res = await api.get(`${API}/search/${encodeURIComponent(q)}`);
      if (!res.data.length) {
        alert('No claim out voucher found.');
        return;
      }
      applyVoucher(res.data[0]);
    } catch (err) {
      alert(err.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadLatest();
    setMessage('Refreshed.');
  };

  const handleNew = async () => {
    await loadNextInvoice();
    setMessage('New claim out.');
  };

  const handleImageBrowse = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setReceiptImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handlePrint = () => {
    const rows = lines.map((l) => `
      <tr>
        <td>${l.sr}</td><td>${l.productName}</td><td>${l.uom}</td>
        <td>${formatPackingCell(l)}</td><td align="right">${l.totalPcs ?? l.pcs}</td>
        <td align="right">${l.rate}</td><td align="right">${l.net}</td>
      </tr>`).join('');
    const html = `<!DOCTYPE html><html><head><title>Claim Out ${header.invoiceNo}</title>
      <style>body{font-family:Arial;font-size:12px}table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #333;padding:4px}h2{text-align:center}</style></head><body>
      <h2>Claim Out Form</h2>
      <p><b>Invoice #:</b> ${header.invoiceNo} &nbsp; <b>Date:</b> ${formatDisplayDate(header.date)}</p>
      <p><b>Supplier:</b> ${header.supplierCode} - ${header.supplierName} &nbsp; <b>Payment:</b> ${header.paymentType}</p>
      <table><thead><tr><th>Sr</th><th>Product</th><th>UOM</th><th>Packing</th><th>Pcs</th><th>Rate</th><th>Net</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <p style="text-align:right"><b>Net Payable:</b> ${footerTotals.netPayable} Cr</p></body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.print();
  };

  const btn = (label, onClick, disabled = false, bg = '#e8e8e8') => (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: '5px 14px',
        border: '1px solid #777',
        backgroundColor: disabled ? '#ddd' : bg,
        fontSize: '12px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {label}
    </button>
  );

  const gridCols = ['Sr.#', 'Product', 'U.O.M', 'Packing', 'Pc(s)', 'Rate', 'Amount', 'Disc.%', 'Discount', 'Net'];

  const footerFields = [
    ['Cash Paid', header.cashPaid, false, 'cashPaid'],
    ['Disc.%', header.discPercentFooter, false, 'discPercentFooter'],
    ['Extra Discount', footerTotals.extraDiscount, true],
    ['Bill Amount', footerTotals.billAmount, true],
    ['Total Pcs.', footerTotals.totalPcs, true],
    ['Net Amount', footerTotals.netAmount, true],
    ['Previous Balance', header.previousBalance, true],
    ['Net Payable', footerTotals.netPayable, true, null, true],
  ];

  return (
    <div style={{ backgroundColor: '#d4d4d4', minHeight: '100vh', fontFamily: 'Tahoma, Arial, sans-serif' }}>
      <div style={{ backgroundColor: '#4a4a4a', color: '#fff', padding: '10px', fontSize: '22px', fontWeight: 'bold', textAlign: 'center' }}>
        Claim Out Form
      </div>

      <div style={{ padding: '8px' }}>
        {message && <div style={{ marginBottom: '6px', color: '#006400', fontSize: '12px' }}>{message}</div>}
        {loading && <div style={{ marginBottom: '6px', fontSize: '12px' }}>Loading…</div>}

        <div style={{ backgroundColor: '#e8e8e8', border: '1px solid #888', padding: '8px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end' }}>
            <div>
              <span style={lbl}>Invoice #</span>
              <input name="invoiceNo" value={header.invoiceNo} onChange={handleHeaderChange} style={{ ...inp, width: '70px' }} readOnly={!!savedDoc} />
              <div style={{ marginTop: '4px' }}>
                <button type="button" onClick={handleSearch} style={{ padding: '3px 8px', fontSize: '11px', background: 'none', border: 'none', color: '#00f', textDecoration: 'underline', cursor: 'pointer' }}>
                  Search Claim Out
                </button>
              </div>
            </div>
            <div>
              <span style={lbl}>Date</span>
              <input type="date" name="date" value={header.date} onChange={handleHeaderChange} style={{ ...inp, width: '130px' }} />
            </div>
            <div>
              <span style={lbl}>Code</span>
              <input value={header.supplierCode} readOnly style={{ ...inp, width: '50px' }} />
            </div>
            <div>
              <span style={lbl}>Supplier Name</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <select value={header.supplierId} onChange={handleSupplierDropdown} style={{ ...inp, width: '220px' }}>
                  <option value="">— Select —</option>
                  {suppliers.map((s) => (
                    <option key={s.id || s._id || s.Id} value={s.id || s._id || s.Id}>
                      {s.code} - {s.name || s.Subsidary}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={() => setShowSupplierModal(true)}>…</button>
              </div>
            </div>
            <div>
              <span style={lbl}>Cr.Days</span>
              <input name="creditDays" value={header.creditDays} onChange={handleHeaderChange} style={{ ...inp, width: '50px' }} />
            </div>
            <div>
              <span style={lbl}>Due Date</span>
              <input type="date" name="dueDate" value={header.dueDate} onChange={handleHeaderChange} style={{ ...inp, width: '130px' }} />
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', border: '1px solid #888', padding: '8px', marginBottom: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '6px', marginBottom: '6px' }}>
            <div>
              <span style={lbl}>Product ID</span>
              <input readOnly value={entry.productCode} style={ro} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <span style={lbl}>Select Product</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input readOnly value={entry.productName} onClick={() => setShowProductModal(true)} style={{ ...inp, cursor: 'pointer' }} placeholder="Click to select" />
                <button type="button" onClick={() => setShowProductModal(true)}>…</button>
              </div>
            </div>
            <div>
              <span style={lbl}>Location</span>
              <select name="locationId" value={entry.locationId} onChange={handleEntryChange} style={inp}>
                <option value="">—</option>
                {locations.map((l) => (
                  <option key={l.id || l.locationId} value={l.id || l.locationId}>{l.name || l.locationName}</option>
                ))}
              </select>
            </div>
            <div>
              <span style={lbl}>Packing</span>
              {hasProductPacking(entry) ? (
                <input name="packQty" value={entry.packQty} onChange={handleEntryChange} style={inp} />
              ) : (
                <input readOnly value="-" style={ro} />
              )}
            </div>
            <div><span style={lbl}>Pc(s)</span><input name="pcs" value={entry.pcs} onChange={handleEntryChange} style={inp} readOnly={hasProductPacking(entry)} /></div>
            <div><span style={lbl}>Total Pcs</span><input readOnly value={entry.totalPcs} style={ro} /></div>
            <div><span style={lbl}>Rate</span><input name="rate" value={entry.rate} onChange={handleEntryChange} style={inp} /></div>
            <div><span style={lbl}>Amount</span><input readOnly value={entry.amount} style={ro} /></div>
            <div><span style={lbl}>Disc.%</span><input name="discPercent" value={entry.discPercent} onChange={handleEntryChange} style={inp} /></div>
            <div><span style={lbl}>Discount</span><input readOnly value={entry.discount} style={ro} /></div>
            <div><span style={lbl}>Net Amount</span><input readOnly value={entry.net} style={ro} /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px' }}><b>Available Stock:</b> {entry.availableStock}</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {btn('Reset', resetEntry)}
              {btn('Add', handleAddLine)}
              {btn('Update', handleUpdateLine, editIndex === null)}
              {btn('Remove', handleRemoveLine, editIndex === null)}
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', border: '1px solid #888', padding: '6px', marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Previous Purchased History For Selected Product</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ backgroundColor: '#e0e0e0' }}>
                {['Date', 'Doc', 'Rate', 'Pcs', 'Amount', 'Packing'].map((h) => (
                  <th key={h} style={{ border: '1px solid #999', padding: '3px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {purchaseHistory.length === 0 ? (
                <tr><td colSpan={6} style={{ border: '1px solid #999', padding: '4px', textAlign: 'center' }}>—</td></tr>
              ) : purchaseHistory.map((h, i) => (
                <tr key={i}>
                  <td style={{ border: '1px solid #999', padding: '3px' }}>{formatDisplayDate(h.date)}</td>
                  <td style={{ border: '1px solid #999', padding: '3px' }}>{h.doc}</td>
                  <td style={{ border: '1px solid #999', padding: '3px', textAlign: 'right' }}>{h.rate}</td>
                  <td style={{ border: '1px solid #999', padding: '3px', textAlign: 'right' }}>{h.pcs}</td>
                  <td style={{ border: '1px solid #999', padding: '3px', textAlign: 'right' }}>{h.amount}</td>
                  <td style={{ border: '1px solid #999', padding: '3px' }}>{h.packing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ backgroundColor: '#fff', border: '1px solid #888', padding: '6px', marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Purchased Product(s) Information</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ backgroundColor: '#e0e0e0' }}>
                  {gridCols.map((h) => (
                    <th key={h} style={{ border: '1px solid #999', padding: '3px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 ? (
                  <tr>
                    {gridCols.map((h) => (
                      <td key={h} style={{ border: '1px solid #999', padding: '3px', textAlign: 'center' }}>0</td>
                    ))}
                  </tr>
                ) : lines.map((line, idx) => (
                  <tr
                    key={idx}
                    onClick={() => handleSelectLine(line, idx)}
                    style={{ cursor: 'pointer', backgroundColor: editIndex === idx ? '#cce5ff' : 'transparent' }}
                  >
                    <td style={{ border: '1px solid #999', padding: '3px', textAlign: 'center' }}>{line.sr}</td>
                    <td style={{ border: '1px solid #999', padding: '3px' }}>{line.productName}</td>
                    <td style={{ border: '1px solid #999', padding: '3px' }}>{line.uom}</td>
                    <td style={{ border: '1px solid #999', padding: '3px' }}>{formatPackingCell(line)}</td>
                    <td style={{ border: '1px solid #999', padding: '3px', textAlign: 'right' }}>{line.totalPcs ?? line.pcs}</td>
                    <td style={{ border: '1px solid #999', padding: '3px', textAlign: 'right' }}>{line.rate}</td>
                    <td style={{ border: '1px solid #999', padding: '3px', textAlign: 'right' }}>{line.amount}</td>
                    <td style={{ border: '1px solid #999', padding: '3px', textAlign: 'center' }}>{line.discPercent}</td>
                    <td style={{ border: '1px solid #999', padding: '3px', textAlign: 'right' }}>{line.discount}</td>
                    <td style={{ border: '1px solid #999', padding: '3px', textAlign: 'right' }}>{line.net}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <div style={{ flex: 1, backgroundColor: '#fff', border: '1px solid #888', padding: '8px' }}>
            <div style={{ marginBottom: '6px' }}>
              <span style={lbl}>Transporter</span>
              <select name="transporter" value={header.transporter} onChange={handleHeaderChange} style={inp}>
                <option value="">—</option>
                {transporters.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '6px' }}>
              <span style={lbl}>Builty #</span>
              <input name="builtyNo" value={header.builtyNo} onChange={handleHeaderChange} style={inp} />
            </div>
            <div style={{ marginBottom: '6px' }}>
              <span style={lbl}>Description</span>
              <input name="description" value={header.description} onChange={handleHeaderChange} style={inp} />
            </div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageBrowse} />
              <button type="button" onClick={() => fileRef.current?.click()} style={{ fontSize: '11px' }}>Browse image</button>
              <button type="button" onClick={() => receiptImage && window.open(receiptImage)} disabled={!receiptImage} style={{ fontSize: '11px' }}>View image</button>
            </div>
            <div style={{ fontSize: '12px', marginBottom: '8px' }}>
              <label style={{ marginRight: '12px' }}>
                <input type="radio" name="paymentType" value="Cash" checked={header.paymentType === 'Cash'} onChange={handleHeaderChange} /> Cash
              </label>
              <label>
                <input type="radio" name="paymentType" value="Credit" checked={header.paymentType === 'Credit'} onChange={handleHeaderChange} /> Credit
              </label>
            </div>
            <div style={{ fontSize: '12px' }}>
              <label style={{ marginRight: '12px' }}>
                <input type="checkbox" name="sendSMS" checked={header.sendSMS} onChange={handleHeaderChange} /> Send SMS
              </label>
              <label>
                <input type="checkbox" name="printPreBalance" checked={header.printPreBalance} onChange={handleHeaderChange} /> Print Pre. Balance
              </label>
            </div>
          </div>
          <div style={{ width: '320px', backgroundColor: '#fff', border: '1px solid #888', padding: '8px' }}>
            {footerFields.map(([label, val, readOnly, field, showCr]) => (
              <div key={label} style={{ display: 'flex', marginBottom: '4px', alignItems: 'center' }}>
                <div style={{ flex: 1, textAlign: 'right', fontSize: '12px', fontWeight: 'bold', paddingRight: '8px' }}>{label}</div>
                <input
                  readOnly={readOnly}
                  name={field || undefined}
                  value={val}
                  onChange={field ? handleHeaderChange : undefined}
                  style={{ ...inp, width: showCr ? '80px' : '100px', textAlign: 'right', ...(readOnly ? { backgroundColor: '#f0f0f0' } : {}) }}
                />
                {showCr && <span style={{ marginLeft: '4px', fontSize: '12px', fontWeight: 'bold' }}>Cr</span>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: '#ff8c00', padding: '8px', display: 'flex', justifyContent: 'flex-end', gap: '6px', flexWrap: 'wrap' }}>
          {btn('♻ Refresh', handleRefresh, false, '#90EE90')}
          {btn('💾 Save Record', handleSave, !!savedDoc, '#90EE90')}
          {btn('📝 Update', handleUpdateRecord, !savedDoc, '#90EE90')}
          {btn('❌ Delete Record', handleDelete, !savedDoc, '#ffb6b6')}
          {btn('🆕 New', handleNew)}
          {btn('❌ Close', () => navigate('/'), false, '#FF6B6B')}
        </div>
      </div>

      <ProductSearchModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        onSelectProduct={handleProductSelect}
        rateType="purchase"
      />
      <SupplierSearchModal
        isOpen={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        onSelectSupplier={handleSupplierSelect}
      />
    </div>
  );
}

export default ClaimOutToSuppliers;
