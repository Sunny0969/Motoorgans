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
  netAmount: '0.00',
  uom: 'PCS',
  availableStock: '0',
  enableScheme: true,
  schPc: '',
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
    netAmount: net.toFixed(2),
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

const API = '/sale-returns';
const PRICE_LISTS = ['Whole Sale', 'Retail'];

function SalesReturn() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [header, setHeader] = useState({
    invoiceNo: '',
    date: toInputDate(),
    paymentType: 'Credit',
    customerId: '',
    customerCode: '',
    customerName: '',
    priceList: 'Whole Sale',
    creditDays: '',
    dueDate: toInputDate(),
    transporter: '',
    builtyNo: '',
    description: '',
    cashPaid: '',
    extraDiscount: '',
    previousBalance: '0',
    sendSMS: false,
    printPreBalance: true,
    printCompanyTitle: false,
  });

  const [entry, setEntry] = useState(initialEntry);
  const [lines, setLines] = useState([]);
  const [soldHistory, setSoldHistory] = useState([]);
  const [locations, setLocations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [savedDoc, setSavedDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [receiptImage, setReceiptImage] = useState(null);

  const lineTotals = useMemo(() => {
    const totalPcs = lines.reduce((s, l) => s + (parseFloat(l.totalPcs ?? l.pcs) || 0), 0);
    const netAmount = lines.reduce((s, l) => s + (parseFloat(l.netAmount ?? l.net) || 0), 0);
    return { totalPcs, netAmount };
  }, [lines]);

  const footerTotals = useMemo(() => {
    const netAmount = lineTotals.netAmount;
    const extraDisc = parseFloat(header.extraDiscount) || 0;
    const billAmount = netAmount - extraDisc;
    const prevBal = parseFloat(header.previousBalance) || 0;
    const cashPaid = parseFloat(header.cashPaid) || 0;
    const netReceivable = billAmount + prevBal - cashPaid;
    return {
      totalPcs: lineTotals.totalPcs,
      netAmount: netAmount.toFixed(2),
      billAmount: billAmount.toFixed(2),
      netReceivable: netReceivable.toFixed(2),
    };
  }, [lineTotals, header.extraDiscount, header.previousBalance, header.cashPaid]);

  const resetEntry = useCallback(() => {
    setEntry(initialEntry);
    setEditIndex(null);
    setSoldHistory([]);
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

  const loadCustomers = useCallback(async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(Array.isArray(res.data) ? res.data : []);
    } catch {
      try {
        const res2 = await api.get('/accounts');
        const list = Array.isArray(res2.data) ? res2.data : [];
        setCustomers(list.filter((a) => a.ACType === 5 || a.acType === 5 || a.type === 'customer'));
      } catch {
        setCustomers([]);
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
      invoiceNo: String(p.invoiceNo || p.invoiceNumber || p.id || ''),
      date: toInputDate(p.date),
      paymentType: p.paymentType || 'Credit',
      customerId: p.customerId != null ? String(p.customerId) : '',
      customerCode: p.customerCode || '',
      customerName: p.customerName || '',
      priceList: p.priceList || 'Whole Sale',
      creditDays: p.creditDays != null ? String(p.creditDays) : '',
      dueDate: toInputDate(p.dueDate),
      transporter: p.transporter || '',
      builtyNo: p.builtyNo || '',
      description: p.description || '',
      cashPaid: p.cashPaid != null ? String(p.cashPaid) : (p.cashReceived != null ? String(p.cashReceived) : ''),
      extraDiscount: p.extraDiscount != null ? String(p.extraDiscount) : '',
      previousBalance: p.previousBalance != null ? String(p.previousBalance) : '0',
      sendSMS: Boolean(p.sendSMS),
      printPreBalance: p.printPreBalance !== false,
      printCompanyTitle: Boolean(p.printCompanyTitle),
    });
    setSavedDoc(p.id);
    setLines(
      (p.products || []).map((row, i) => ({
        sr: i + 1,
        productId: row.productId,
        productCode: row.productCode || '',
        productName: row.productName || '',
        location: row.location || '',
        packQty: row.packQty || row.packing || '',
        packing: row.packing || '',
        packingSize: row.packingSize || '',
        pcs: row.pcs ?? 0,
        totalPcs: row.pcs ?? 0,
        rate: row.rate ?? 0,
        amount: row.amount ?? '0.00',
        discPercent: row.discPercent ?? '',
        discount: row.discount ?? '0.00',
        netAmount: row.netAmount ?? row.net ?? '0.00',
        uom: row.uom || 'PCS',
        schPc: row.schPc || '',
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
    loadCustomers();
    loadLatest();
  }, [loadLocations, loadCustomers, loadLatest]);

  useEffect(() => {
    if (!header.creditDays || !header.date) return;
    const days = parseInt(header.creditDays, 10);
    if (!days) return;
    const d = new Date(header.date);
    if (Number.isNaN(d.getTime())) return;
    d.setDate(d.getDate() + days);
    setHeader((h) => ({ ...h, dueDate: d.toISOString().slice(0, 10) }));
  }, [header.creditDays, header.date]);

  const loadCustomerBalance = async (customerId) => {
    if (!customerId) return;
    try {
      const res = await api.get(`${API}/customer/${customerId}/balance`);
      setHeader((h) => ({ ...h, previousBalance: String(res.data.balance ?? 0) }));
    } catch {
      try {
        const res2 = await api.get(`/sales/customer-balance/${customerId}`);
        setHeader((h) => ({ ...h, previousBalance: String(res2.data.balance ?? 0) }));
      } catch {
        /* ignore */
      }
    }
  };

  const loadProductInfo = async (productId, customerId) => {
    if (!productId) return;
    try {
      const stockRes = await api.get(`/stock/product/${productId}`);
      const onHand = stockRes.data?.onHandQty ?? stockRes.data?.quantity ?? 0;
      const prodRes = await api.get(`/products/${productId}`);
      const p = prodRes.data;
      const packingSize = p.packing ?? p.Packing ?? 0;
      const isRetail = header.priceList === 'Retail';
      const rate = isRetail ? (p.retailRate ?? p.saleRate) : (p.saleRate ?? p.wholesaleRate);
      setEntry((prev) => {
        const updated = {
          ...prev,
          productId: String(productId),
          productCode: p.code || prev.productCode,
          productName: p.name || prev.productName,
          uom: p.uom || 'PCS',
          packingSize: packingSize > 0 ? String(packingSize) : '',
          availableStock: String(onHand),
          rate: rate != null ? String(rate) : prev.rate,
          totalPcs: String(calcTotalPcs(prev.packQty, packingSize, prev.pcs)),
        };
        return recalcEntryAmounts(updated);
      });
    } catch {
      /* ignore */
    }
    if (customerId) {
      try {
        const histRes = await api.get(`/sales/product-sold-history/${customerId}/${productId}`);
        setSoldHistory(Array.isArray(histRes.data) ? histRes.data : []);
      } catch {
        setSoldHistory([]);
      }
    }
  };

  const handleCustomerSelect = (customer) => {
    const id = customer.id || customer._id || customer.Id;
    setHeader((h) => ({
      ...h,
      customerId: String(id),
      customerCode: customer.code || '',
      customerName: customer.name || customer.customerName || customer.Subsidary || '',
      priceList: customer.priceList || h.priceList,
    }));
    setShowCustomerModal(false);
    loadCustomerBalance(id);
  };

  const handleCustomerDropdown = (e) => {
    const id = e.target.value;
    const c = customers.find((x) => String(x.id || x._id || x.Id) === String(id));
    setHeader((h) => ({
      ...h,
      customerId: id,
      customerCode: c?.code || '',
      customerName: c?.name || c?.customerName || c?.Subsidary || '',
      priceList: c?.priceList || h.priceList,
    }));
    if (id) loadCustomerBalance(id);
  };

  const handleProductSelect = (product) => {
    const pid = product.id || product._id;
    const packingSize = product.packing > 0 ? product.packing : 0;
    const isRetail = header.priceList === 'Retail';
    const rate = isRetail ? product.retailRate : product.saleRate;
    setEntry({
      ...initialEntry,
      productId: String(pid),
      productCode: product.code || '',
      productName: product.name || '',
      uom: product.uom || 'PCS',
      packingSize: packingSize > 0 ? String(packingSize) : '',
      rate: rate != null ? String(rate) : '',
      enableScheme: true,
    });
    setShowProductModal(false);
    loadProductInfo(pid, header.customerId);
  };

  const handleEntryChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEntry((prev) => {
      let updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };
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
    net: entry.netAmount,
    netAmount: entry.netAmount,
    uom: entry.uom,
    schPc: entry.enableScheme ? entry.schPc : '',
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
      netAmount: line.netAmount ?? line.net,
      uom: line.uom || 'PCS',
      schPc: line.schPc || '',
      enableScheme: Boolean(line.schPc),
    });
    if (line.productId) loadProductInfo(line.productId, header.customerId);
  };

  const buildPayload = () => ({
    invoiceNo: header.invoiceNo,
    date: header.date,
    dueDate: header.dueDate,
    paymentType: header.paymentType,
    customerId: header.customerId,
    customerCode: header.customerCode,
    priceList: header.priceList,
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
      net: l.netAmount,
      netAmount: l.netAmount,
      uom: l.uom,
      remarks: '',
    })),
    previousBalance: header.previousBalance,
    cashPaid: header.cashPaid,
    extraDiscount: header.extraDiscount,
    transporter: header.transporter,
    builtyNo: header.builtyNo,
    description: header.description,
    sendSMS: header.sendSMS,
    printPreBalance: header.printPreBalance,
    printCompanyTitle: header.printCompanyTitle,
  });

  const handleSave = async () => {
    if (!header.customerId) {
      alert('Please select a buyer.');
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
      if (window.confirm('Print bill?')) handlePrintBill();
      else await loadNextInvoice();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRecord = async () => {
    if (!savedDoc) return;
    if (!window.confirm(`Update sale return #${savedDoc}?`)) return;
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
    if (!window.confirm(`Delete sale return #${savedDoc}?`)) return;
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
        alert('No sale return found.');
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
    setMessage('New sale return.');
  };

  const handleImageBrowse = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setReceiptImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handlePrintBill = () => {
    const rows = lines.map((l) => `
      <tr>
        <td>${l.sr}</td><td>${l.productName}</td><td>${l.uom}</td>
        <td>${formatPackingCell(l)}</td><td align="right">${l.totalPcs ?? l.pcs}</td>
        <td align="right">${l.rate}</td><td align="right">${l.netAmount}</td>
      </tr>`).join('');
    const html = `<!DOCTYPE html><html><head><title>Sale Return ${header.invoiceNo}</title>
      <style>body{font-family:Arial;font-size:12px}table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #333;padding:4px}h2{text-align:center}</style></head><body>
      <h2>Sale Return Form</h2>
      <p><b>Invoice #:</b> ${header.invoiceNo} &nbsp; <b>Date:</b> ${formatDisplayDate(header.date)}</p>
      <p><b>Buyer:</b> ${header.customerCode} - ${header.customerName} &nbsp; <b>Price List:</b> ${header.priceList}</p>
      <table><thead><tr><th>Sr</th><th>Product</th><th>UOM</th><th>Packing</th><th>Pcs</th><th>Rate</th><th>Net</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <p style="text-align:right"><b>Net Receivable:</b> ${footerTotals.netReceivable}</p></body></html>`;
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

  const gridCols = ['Sr.#', 'Product', 'U.O.M', 'Packing', 'Pc(s)', 'Rate', 'Amount', 'Disc.%', 'Discount', 'Net', 'SchPc'];

  return (
    <div style={{ backgroundColor: '#d4d4d4', minHeight: '100vh', fontFamily: 'Tahoma, Arial, sans-serif' }}>
      <div style={{ backgroundColor: '#4a4a4a', color: '#fff', padding: '10px', fontSize: '22px', fontWeight: 'bold', textAlign: 'center' }}>
        Sale Return Form
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
                  Search Sale Returns
                </button>
              </div>
            </div>
            <div>
              <span style={lbl}>Date</span>
              <input type="date" name="date" value={header.date} onChange={handleHeaderChange} style={{ ...inp, width: '130px' }} />
            </div>
            <div style={{ marginTop: '16px' }}>
              <label style={{ fontSize: '12px', marginRight: '8px' }}>
                <input type="radio" name="paymentType" value="Cash" checked={header.paymentType === 'Cash'} onChange={handleHeaderChange} /> Cash
              </label>
              <label style={{ fontSize: '12px' }}>
                <input type="radio" name="paymentType" value="Credit" checked={header.paymentType === 'Credit'} onChange={handleHeaderChange} /> Credit
              </label>
            </div>
            <div>
              <span style={lbl}>Code</span>
              <input value={header.customerCode} readOnly style={{ ...inp, width: '50px' }} />
            </div>
            <div>
              <span style={lbl}>Buyer Name</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <select value={header.customerId} onChange={handleCustomerDropdown} style={{ ...inp, width: '200px' }}>
                  <option value="">— Select —</option>
                  {customers.map((c) => (
                    <option key={c.id || c._id || c.Id} value={c.id || c._id || c.Id}>
                      {c.code} - {c.name || c.customerName || c.Subsidary}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={() => setShowCustomerModal(true)}>…</button>
              </div>
            </div>
            <div>
              <span style={lbl}>Price List</span>
              <select name="priceList" value={header.priceList} onChange={handleHeaderChange} style={{ ...inp, width: '100px' }}>
                {PRICE_LISTS.map((pl) => <option key={pl} value={pl}>{pl}</option>)}
              </select>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: '6px', marginBottom: '6px' }}>
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
            <div><span style={lbl}>Net Amount</span><input readOnly value={entry.netAmount} style={ro} /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '12px' }}>
              <span><b>Available Stock:</b> {entry.availableStock}</span>
              <label><input type="checkbox" name="enableScheme" checked={entry.enableScheme} onChange={handleEntryChange} /> Enable Scheme</label>
              <span>Sch. Pcs.</span>
              <input name="schPc" value={entry.schPc} onChange={handleEntryChange} disabled={!entry.enableScheme} style={{ ...inp, width: '60px' }} />
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {btn('Reset', resetEntry)}
              {btn('Add', handleAddLine)}
              {btn('Update', handleUpdateLine, editIndex === null)}
              {btn('Remove', handleRemoveLine, editIndex === null)}
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', border: '1px solid #888', padding: '6px', marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Previous Sold History For Selected Product</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ backgroundColor: '#e0e0e0' }}>
                {['Date', 'Doc', 'Qty', 'Rate', 'Net'].map((h) => (
                  <th key={h} style={{ border: '1px solid #999', padding: '3px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {soldHistory.length === 0 ? (
                <tr><td colSpan={5} style={{ border: '1px solid #999', padding: '4px', textAlign: 'center' }}>—</td></tr>
              ) : soldHistory.map((h, i) => (
                <tr key={i}>
                  <td style={{ border: '1px solid #999', padding: '3px' }}>{h.date}</td>
                  <td style={{ border: '1px solid #999', padding: '3px' }}>{h.doc}</td>
                  <td style={{ border: '1px solid #999', padding: '3px', textAlign: 'right' }}>{h.qty}</td>
                  <td style={{ border: '1px solid #999', padding: '3px', textAlign: 'right' }}>{h.rate}</td>
                  <td style={{ border: '1px solid #999', padding: '3px', textAlign: 'right' }}>{h.net}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ backgroundColor: '#fff', border: '1px solid #888', padding: '6px', marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Returned Product(s) Information</div>
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
                    <td style={{ border: '1px solid #999', padding: '3px', textAlign: 'right' }}>{line.netAmount}</td>
                    <td style={{ border: '1px solid #999', padding: '3px', textAlign: 'right' }}>{line.schPc || '0'}</td>
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
          </div>
          <div style={{ width: '320px', backgroundColor: '#fff', border: '1px solid #888', padding: '8px' }}>
            {[
              ['Total Pcs.', footerTotals.totalPcs, true],
              ['Net Amount', footerTotals.netAmount, true],
              ['Cash Paid', header.cashPaid, false, 'cashPaid'],
              ['Extra Discount', header.extraDiscount, false, 'extraDiscount'],
              ['Bill Amount', footerTotals.billAmount, true],
              ['Previous Balance', header.previousBalance, true],
              ['Net Receivable', footerTotals.netReceivable, true],
            ].map(([label, val, readOnly, field]) => (
              <div key={label} style={{ display: 'flex', marginBottom: '4px', alignItems: 'center' }}>
                <div style={{ flex: 1, textAlign: 'right', fontSize: '12px', fontWeight: 'bold', paddingRight: '8px' }}>{label}</div>
                <input
                  readOnly={readOnly}
                  name={field}
                  value={val}
                  onChange={field ? handleHeaderChange : undefined}
                  style={{ ...inp, width: '100px', textAlign: 'right', ...(readOnly ? { backgroundColor: '#f0f0f0' } : {}) }}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: '#ff8c00', padding: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ fontSize: '12px' }}>
            <label style={{ marginRight: '12px' }}>
              <input type="checkbox" name="sendSMS" checked={header.sendSMS} onChange={handleHeaderChange} /> Send SMS
            </label>
            <label style={{ marginRight: '12px' }}>
              <input type="checkbox" name="printPreBalance" checked={header.printPreBalance} onChange={handleHeaderChange} /> Print Pre.Balance
            </label>
            <label>
              <input type="checkbox" name="printCompanyTitle" checked={header.printCompanyTitle} onChange={handleHeaderChange} /> Print Company Title
            </label>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {btn('♻ Refresh', handleRefresh, false, '#90EE90')}
            {btn('💾 Save Record', handleSave, !!savedDoc, '#90EE90')}
            {btn('📝 Update', handleUpdateRecord, !savedDoc, '#90EE90')}
            {btn('❌ Delete Record', handleDelete, !savedDoc, '#ffb6b6')}
            {btn('📄 Bill', handlePrintBill, lines.length === 0)}
            {btn('🆕 New', handleNew)}
            {btn('❌ Close', () => navigate('/'), false, '#FF6B6B')}
          </div>
        </div>
      </div>

      <ProductSearchModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        onSelectProduct={handleProductSelect}
        rateType="sale"
      />
      <SupplierSearchModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSelectSupplier={handleCustomerSelect}
        type="customer"
      />
    </div>
  );
}

export default SalesReturn;
