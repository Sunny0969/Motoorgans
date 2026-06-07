import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../utils/api';
import SupplierSearchModal from '../components/SupplierSearchModal';
import PaperSizeSelector from '../components/PaperSizeSelector';
import { getPaperStyle, getWindowSize, getScaledFontSize } from '../utils/printHelper';
import { usePageStatePersistence } from '../hooks/usePageStatePersistence';

const PAGE_KEY = 'cash-payment';

const CashPaymentVoucher = () => {
  const [records, setRecords] = useState([]);
  const [paymentData, setPaymentData] = useState({
    cpvNumber: '',
    date: new Date().toISOString().split('T')[0],
    code: '',
    accountId: '',
    accountTitle: '',
    description: '',
    invoice: '',
    amount: ''
  });
  const [editId, setEditId] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [paperSize, setPaperSize] = useState('A5');

  const loadAllRecords = useCallback((from, to) => {
    const params = {};
    if (from) params.fromDate = from;
    if (to) params.toDate = to;
    api.get('/cashpayments', { params })
      .then(res => setRecords(Array.isArray(res.data) ? res.data : []))
      .catch(() => setRecords([]));
  }, []);

  const loadNextCpv = useCallback(() => {
    api.get('/cashpayments/next-cpv')
      .then(res => setPaymentData(prev => ({ ...prev, cpvNumber: String(res.data.nextCpv) })))
      .catch(() => {});
  }, []);

  const onFirstMount = useCallback(() => {
    loadNextCpv();
    loadAllRecords();
  }, [loadNextCpv, loadAllRecords]);

  const pageSnapshot = useMemo(() => ({
    paymentData, records, editId, fromDate, toDate, paperSize,
  }), [paymentData, records, editId, fromDate, toDate, paperSize]);

  const restorePageState = useCallback((cached) => {
    if (cached.paymentData) setPaymentData(cached.paymentData);
    if (cached.records) setRecords(cached.records);
    if (cached.editId !== undefined) setEditId(cached.editId);
    if (cached.fromDate !== undefined) setFromDate(cached.fromDate);
    if (cached.toDate !== undefined) setToDate(cached.toDate);
    if (cached.paperSize) setPaperSize(cached.paperSize);
  }, []);

  const { clearPersistedState } = usePageStatePersistence(
    PAGE_KEY,
    pageSnapshot,
    restorePageState,
    { onFirstMount },
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
  };

  const handleCustomerSelect = (customer) => {
    const name = customer.customerName || customer.accountTitle || customer.name || '';
    const code = customer.code || customer.Id || '';
    const id = customer.Id || customer._id || customer.id || '';
    setPaymentData(prev => ({
      ...prev,
      accountTitle: name,
      code: String(code),
      accountId: String(id),
    }));
    setShowCustomerModal(false);
  };

  const handleSave = async () => {
    if (!paymentData.accountTitle || !paymentData.amount) {
      alert('Please fill Account Title and Amount');
      return;
    }
    try {
      await api.post('/cashpayments', {
        cpvNumber: paymentData.cpvNumber,
        date: paymentData.date,
        code: paymentData.code,
        accountId: paymentData.accountId,
        description: paymentData.description,
        invoice: paymentData.invoice,
        amount: paymentData.amount,
      });
      alert('Record saved successfully!');
      resetForm();
      loadAllRecords(fromDate, toDate);
    } catch (error) {
      alert('Error saving: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdate = async () => {
    if (!editId) {
      alert('Please select a record to update.');
      return;
    }
    try {
      await api.put(`/cashpayments/${editId}`, {
        date: paymentData.date,
        accountId: paymentData.accountId,
        description: paymentData.description,
        invoice: paymentData.invoice,
        amount: paymentData.amount,
      });
      alert('Record updated successfully!');
      resetForm();
      loadAllRecords(fromDate, toDate);
    } catch (error) {
      alert('Error updating: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async () => {
    if (!editId) {
      alert('Please select a record to delete.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await api.delete(`/cashpayments/${editId}`);
      alert('Record deleted successfully!');
      resetForm();
      loadAllRecords(fromDate, toDate);
    } catch (error) {
      alert('Error deleting: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRowClick = (record) => {
    if (editId === record.id) {
      resetForm();
      return;
    }
    setEditId(record.id);
    setPaymentData(prev => ({
      ...prev,
      cpvNumber: String(record.cpvNumber),
      date: record.date || prev.date,
      code: record.accountCode || '',
      accountId: String(record.accountId || ''),
      accountTitle: record.accountTitle || '',
      description: record.description || '',
      invoice: record.invoice || '',
      amount: String(record.amount || ''),
    }));
  };

  const resetForm = (fullRefresh = false) => {
    if (fullRefresh) {
      clearPersistedState();
      setRecords([]);
    }
    setEditId(null);
    setPaymentData(prev => ({
      ...prev,
      code: '',
      accountId: '',
      accountTitle: '',
      description: '',
      invoice: '',
      amount: '',
    }));
    loadNextCpv();
  };

  const handleSearchCPV = () => {
    if (paymentData.cpvNumber) {
      api.get(`/cashpayments/by-cpv/${paymentData.cpvNumber}`)
        .then(res => setRecords(Array.isArray(res.data) ? res.data : []))
        .catch(() => setRecords([]));
    }
  };

  const handleDateFilter = () => {
    loadAllRecords(fromDate, toDate);
  };

  const handlePrint = () => {
    const totalAmt = records.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    const ps = paperSize;
    const isThermal = ps === 'Thermal';
    const printWindow = window.open('', '_blank', getWindowSize(ps));
    printWindow.document.write(`
      <html>
      <head>
        <title>Cash Payment Voucher</title>
        <style>
          ${getPaperStyle(ps)}
          .header { text-align: center; border-bottom: ${isThermal ? '1px dashed #333' : '2px solid #333'}; padding-bottom: 6px; margin-bottom: ${isThermal ? '8px' : '15px'}; }
          .header h1 { margin: 0; font-size: ${isThermal ? '13px' : (ps === 'A4' ? '20px' : '16px')}; }
          .info { display: flex; justify-content: space-between; margin-bottom: ${isThermal ? '6px' : '10px'}; font-size: ${getScaledFontSize(ps, 12)}; }
          table { width: 100%; border-collapse: collapse; margin: ${isThermal ? '5px 0' : '10px 0'}; }
          th, td { border: 1px solid #333; padding: ${isThermal ? '2px 4px' : '5px 8px'}; font-size: ${getScaledFontSize(ps, 11)}; }
          th { background: #e0e0e0; font-weight: bold; text-align: center; }
          td.left { text-align: left; }
          td.right { text-align: right; }
          .total { text-align: right; font-weight: bold; font-size: ${getScaledFontSize(ps, 13)}; margin-top: 8px; }
          .footer { text-align: center; font-size: ${getScaledFontSize(ps, 10)}; color: #888; margin-top: ${isThermal ? '8px' : '20px'}; border-top: 1px solid #ddd; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Moto Organs Traders</h1>
          <p>Cash Payment Voucher</p>
        </div>
        <div class="info">
          <span><strong>Date Range:</strong> ${fromDate || 'All'} to ${toDate || 'All'}</span>
          <span><strong>Total Records:</strong> ${records.length}</span>
        </div>
        <table>
          <thead>
            <tr><th>Sr#</th>${isThermal ? '' : '<th>Date</th><th>CPV#</th>'}<th>Account Title</th>${isThermal ? '' : '<th>Description</th>'}<th>Amount</th></tr>
          </thead>
          <tbody>
            ${records.map((r, i) => `
              <tr>
                <td>${i + 1}</td>
                ${isThermal ? '' : `<td>${r.date}</td><td>${r.cpvNumber}</td>`}
                <td class="left">${r.accountTitle}</td>
                ${isThermal ? '' : `<td class="left">${r.description || ''}</td>`}
                <td class="right">${parseFloat(r.amount).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total">Total: ${totalAmt.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
        <div class="footer">Software developed by: Rathisoft / www.rathisoft.com</div>
        <script>setTimeout(function(){ window.print(); }, 400);</script>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    clearPersistedState();
    setRecords([]);
    setEditId(null);
    loadNextCpv();
  };

  const totalAmount = useMemo(() => {
    return records.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  }, [records]);

  const styles = {
    container: { fontFamily: 'Tahoma, Arial, sans-serif', backgroundColor: '#d3d3d3', minHeight: '100vh', width: '100%', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' },
    wrapper: { backgroundColor: 'white', width: '100%', margin: '10px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', flexGrow: 1, border: '2px solid #000' },
    header: { backgroundColor: '#4a4a4a', color: '#ffffff', padding: '15px 30px', fontSize: '28px', fontWeight: 'bold', textAlign: 'center', borderBottom: '3px solid #333' },
    section: { border: '1px solid #999', margin: '8px', padding: '10px', backgroundColor: '#f5f5f5', boxSizing: 'border-box' },
    sectionTitle: { fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: '#333' },
    formRow: { display: 'flex', flexWrap: 'nowrap', gap: '3px', alignItems: 'flex-end', boxSizing: 'border-box', width: '100%' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '2px', flex: '1 1 auto', minWidth: '70px' },
    label: { fontSize: '10px', fontWeight: '500', color: '#333' },
    input: { padding: '3px 5px', border: '1px solid #999', fontSize: '11px', backgroundColor: 'white', boxSizing: 'border-box', height: '22px' },
    inputCpv: { padding: '3px 5px', border: '1px solid #999', fontSize: '11px', backgroundColor: '#4da6ff', color: 'white', fontWeight: 'bold', boxSizing: 'border-box', height: '22px', cursor: 'pointer' },
    commandsSection: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', padding: '8px', backgroundColor: '#f5f5f5', border: '1px solid #999', margin: '8px', boxSizing: 'border-box' },
    btn: { padding: '5px 12px', border: '1px solid #666', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', borderRadius: '3px' },
    resultsSection: { border: '1px solid #999', margin: '8px', padding: '8px', backgroundColor: '#f5f5f5', boxSizing: 'border-box', flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    tableContainer: { width: '100%', overflow: 'auto', boxSizing: 'border-box', flexGrow: 1 },
    table: { width: '100%', minWidth: '800px', borderCollapse: 'collapse', fontSize: '10px', backgroundColor: 'white' },
    th: { backgroundColor: '#c0c0c0', border: '1px solid #999', padding: '4px 3px', textAlign: 'center', fontWeight: 'bold', fontSize: '10px', position: 'sticky', top: 0, zIndex: 1 },
    td: { border: '1px solid #999', padding: '4px 3px', textAlign: 'center', fontSize: '10px', cursor: 'pointer' },
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.header}>Cash Payment Voucher</div>
        
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Cash Payment</div>
          <div style={styles.formRow}>
            <div style={{...styles.formGroup, flex: '0 0 8%'}}>
              <label style={styles.label}>CPV #</label>
              <input type="text" name="cpvNumber" value={paymentData.cpvNumber} onChange={handleInputChange} onKeyDown={(e) => { if (e.key === 'Enter') handleSearchCPV(); }} style={styles.inputCpv} />
            </div>
            <div style={{...styles.formGroup, flex: '0 0 10%'}}>
              <label style={styles.label}>Date</label>
              <input type="date" name="date" value={paymentData.date} onChange={handleInputChange} style={styles.input} />
            </div>
            <div style={{...styles.formGroup, flex: '0 0 7%'}}>
              <label style={styles.label}>Code</label>
              <input type="text" name="code" value={paymentData.code} readOnly style={{...styles.input, backgroundColor: '#f0f0f0'}} />
            </div>
            <div style={{...styles.formGroup, flex: '1 1 20%'}}>
              <label style={styles.label}>Account Title</label>
              <input type="text" value={paymentData.accountTitle} readOnly onClick={() => setShowCustomerModal(true)} style={{...styles.input, cursor: 'pointer', backgroundColor: '#ffffcc'}} placeholder="Click to select..." />
            </div>
            <div style={{...styles.formGroup, flex: '1 1 20%'}}>
              <label style={styles.label}>Description</label>
              <input type="text" name="description" value={paymentData.description} onChange={handleInputChange} style={styles.input} />
            </div>
            <div style={{...styles.formGroup, flex: '0 0 7%'}}>
              <label style={styles.label}>Invoice</label>
              <input type="text" name="invoice" value={paymentData.invoice} onChange={handleInputChange} style={styles.input} />
            </div>
            <div style={{...styles.formGroup, flex: '0 0 10%'}}>
              <label style={styles.label}>Amount</label>
              <input type="number" name="amount" value={paymentData.amount} onChange={handleInputChange} style={styles.input} />
            </div>
          </div>
        </div>

        <div style={styles.commandsSection}>
          <button style={{...styles.btn, backgroundColor: '#e0e0e0'}} onClick={() => resetForm(true)}>Refresh</button>
          <button style={{...styles.btn, backgroundColor: '#4CAF50', color: 'white'}} onClick={handleSave}>Save</button>
          <button style={{...styles.btn, backgroundColor: '#17a2b8', color: 'white'}} onClick={handleUpdate}>Update</button>
          <button style={{...styles.btn, backgroundColor: '#dc3545', color: 'white'}} onClick={handleDelete}>Delete</button>
          <button style={{...styles.btn, backgroundColor: '#007bff', color: 'white'}} onClick={handlePrint}>Print</button>
          <PaperSizeSelector value={paperSize} onChange={setPaperSize} />

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '5px', alignItems: 'center' }}>
            <label style={{ fontSize: '10px', fontWeight: 'bold' }}>From:</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{...styles.input, width: '110px'}} />
            <label style={{ fontSize: '10px', fontWeight: 'bold' }}>To:</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{...styles.input, width: '110px'}} />
            <button style={{...styles.btn, backgroundColor: '#6c757d', color: 'white'}} onClick={handleDateFilter}>Filter</button>
          </div>
        </div>

        <div style={styles.resultsSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={styles.sectionTitle}>Expenses Records</div>
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
              Total Amount: <span style={{ backgroundColor: '#fff', border: '1px solid #999', padding: '2px 10px', fontSize: '13px' }}>{totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
            </div>
          </div>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Sr.#</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>CPV #</th>
                  <th style={styles.th}>Code</th>
                  <th style={styles.th}>Account Title</th>
                  <th style={styles.th}>Description</th>
                  <th style={styles.th}>Invoice</th>
                  <th style={styles.th}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td style={styles.td} colSpan="8">No records found.</td></tr>
                ) : (
                  records.map((record, index) => (
                    <tr key={record.id || index} onClick={() => handleRowClick(record)} style={{ backgroundColor: editId === record.id ? '#b3d9ff' : 'transparent', cursor: 'pointer' }}>
                      <td style={styles.td}>{index + 1}</td>
                      <td style={styles.td}>{record.date}</td>
                      <td style={styles.td}>{record.cpvNumber}</td>
                      <td style={styles.td}>{record.accountCode}</td>
                      <td style={{...styles.td, textAlign: 'left'}}>{record.accountTitle}</td>
                      <td style={{...styles.td, textAlign: 'left'}}>{record.description}</td>
                      <td style={styles.td}>{record.invoice}</td>
                      <td style={{...styles.td, textAlign: 'right', fontWeight: 'bold'}}>{parseFloat(record.amount).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                    </tr>
                  ))
                )}
                {records.length > 0 && (
                  <tr style={{ backgroundColor: '#e0e0e0' }}>
                    <td colSpan="7" style={{...styles.td, textAlign: 'right', fontWeight: 'bold', fontSize: '11px'}}>Total:</td>
                    <td style={{...styles.td, textAlign: 'right', fontWeight: 'bold', fontSize: '11px'}}>{totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <SupplierSearchModal 
        isOpen={showCustomerModal} 
        onClose={() => setShowCustomerModal(false)} 
        onSelectSupplier={handleCustomerSelect} 
        selectedSupplier={null} 
        type="customer" 
      />
    </div>
  );
};

export default CashPaymentVoucher;
