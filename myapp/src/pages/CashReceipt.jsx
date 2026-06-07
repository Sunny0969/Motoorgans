import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../utils/api';
import SupplierSearchModal from '../components/SupplierSearchModal';
import PaperSizeSelector from '../components/PaperSizeSelector';
import { getPaperStyle, getWindowSize, getScaledFontSize } from '../utils/printHelper';
import { usePageStatePersistence } from '../hooks/usePageStatePersistence';

const PAGE_KEY = 'cash-receipt';

const CashReceiptVoucher = () => {
  const [receiptData, setReceiptData] = useState({
    crvNumber: '',
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),
    code: '',
    accountId: '',
    accountTitle: '',
    description: '',
    invoice: '',
    discount: '',
    amount: '',
    address: ''
  });

  const [records, setRecords] = useState([]);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [paperSize, setPaperSize] = useState('A5');
  const [options, setOptions] = useState({
    sms: false,
    paperSize: 'A5'
  });

  const loadNextCrv = useCallback(() => {
    api.get('/cashreceipts/next-crv')
      .then(res => setReceiptData(prev => ({ ...prev, crvNumber: String(res.data.nextCrv) })))
      .catch(() => {});
  }, []);

  const pageSnapshot = useMemo(() => ({
    receiptData, records, selectedRowId, paperSize, options,
  }), [receiptData, records, selectedRowId, paperSize, options]);

  const restorePageState = useCallback((cached) => {
    if (cached.receiptData) setReceiptData(cached.receiptData);
    if (cached.records) setRecords(cached.records);
    if (cached.selectedRowId !== undefined) setSelectedRowId(cached.selectedRowId);
    if (cached.paperSize) setPaperSize(cached.paperSize);
    if (cached.options) setOptions(cached.options);
  }, []);

  const { clearPersistedState } = usePageStatePersistence(
    PAGE_KEY,
    pageSnapshot,
    restorePageState,
    { onFirstMount: loadNextCrv },
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReceiptData(prev => ({ ...prev, [name]: value }));
  };

  const handleOptionChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOptions(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCustomerSelect = (customer) => {
    const name = customer.customerName || customer.accountTitle || customer.name || '';
    const code = customer.code || customer.Id || '';
    const id = customer.Id || customer._id || customer.id || '';
    setReceiptData(prev => ({
      ...prev,
      accountTitle: name,
      code: String(code),
      accountId: String(id),
      address: customer.address || ''
    }));
    setShowCustomerModal(false);
  };

  const handleSaveRecord = async () => {
    if (!receiptData.accountTitle || !receiptData.amount) {
      alert('Please fill Account Title and Amount');
      return;
    }

    try {
      const payload = {
        crvNumber: receiptData.crvNumber,
        date: receiptData.date,
        code: receiptData.code,
        accountId: receiptData.accountId,
        description: receiptData.description,
        invoice: receiptData.invoice,
        discount: receiptData.discount,
        amount: receiptData.amount,
      };
      await api.post('/cashreceipts', payload);
      loadRecordsByCRV(receiptData.crvNumber);
      setReceiptData(prev => ({
        ...prev,
        code: '',
        accountId: '',
        accountTitle: '',
        description: '',
        invoice: '',
        discount: '',
        amount: '',
        address: ''
      }));
    } catch (error) {
      alert('Error saving: ' + (error.response?.data?.message || error.message));
    }
  };

  const loadRecordsByCRV = async (crv) => {
    if (!crv) return;
    try {
      const res = await api.get(`/cashreceipts/by-crv/${crv}`);
      setRecords(Array.isArray(res.data) ? res.data : []);
    } catch {
      setRecords([]);
    }
  };

  const handleSearchCRV = () => {
    loadRecordsByCRV(receiptData.crvNumber);
  };

  const handleRowClick = (record) => {
    setSelectedRowId(record.id);
    setReceiptData(prev => ({
      ...prev,
      accountTitle: record.accountTitle,
      code: record.accountCode || '',
      accountId: String(record.accountId || ''),
      description: record.description || '',
      invoice: record.invoice || '',
      amount: String(record.amount || ''),
      discount: String(record.discount || ''),
    }));
  };

  const handleDelete = async () => {
    if (!selectedRowId) {
      alert('Please select a record to delete.');
      return;
    }
    const confirmed = window.confirm('Are you sure you want to delete this record?');
    if (!confirmed) return;

    try {
      await api.delete(`/cashreceipts/${selectedRowId}`);
      setSelectedRowId(null);
      loadRecordsByCRV(receiptData.crvNumber);
      setReceiptData(prev => ({
        ...prev,
        code: '',
        accountId: '',
        accountTitle: '',
        description: '',
        invoice: '',
        discount: '',
        amount: '',
      }));
    } catch (error) {
      alert('Error deleting: ' + (error.response?.data?.message || error.message));
    }
  };

  const handlePrint = () => {
    const totalAmt = records.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    const ps = paperSize;
    const isThermal = ps === 'Thermal';
    const printWindow = window.open('', '_blank', getWindowSize(ps));
    printWindow.document.write(`
      <html>
      <head>
        <title>Cash Receipt Voucher - CRV# ${receiptData.crvNumber}</title>
        <style>
          ${getPaperStyle(ps)}
          .header { text-align: center; border-bottom: ${isThermal ? '1px dashed #333' : '2px solid #333'}; padding-bottom: 6px; margin-bottom: ${isThermal ? '8px' : '15px'}; }
          .header h1 { margin: 0; font-size: ${isThermal ? '13px' : (ps === 'A4' ? '20px' : '16px')}; }
          .header p { margin: 2px 0; font-size: ${getScaledFontSize(ps, 11)}; color: #555; }
          .info { display: flex; justify-content: space-between; margin-bottom: ${isThermal ? '6px' : '12px'}; font-size: ${getScaledFontSize(ps, 12)}; }
          table { width: 100%; border-collapse: collapse; margin: ${isThermal ? '5px 0' : '10px 0'}; }
          th, td { border: 1px solid #333; padding: ${isThermal ? '2px 4px' : '5px 8px'}; font-size: ${getScaledFontSize(ps, 11)}; }
          th { background: #e0e0e0; font-weight: bold; text-align: center; }
          td { text-align: center; }
          td.left { text-align: left; }
          td.right { text-align: right; }
          .total { text-align: right; font-weight: bold; font-size: ${getScaledFontSize(ps, 13)}; margin-top: 8px; }
          .footer { text-align: center; font-size: ${getScaledFontSize(ps, 10)}; color: #888; margin-top: ${isThermal ? '8px' : '20px'}; border-top: 1px solid #ddd; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Moto Organs Traders</h1>
          <p>Cash Receipt Voucher</p>
        </div>
        <div class="info">
          <span><strong>CRV #:</strong> ${receiptData.crvNumber}</span>
          <span><strong>Date:</strong> ${receiptData.date}</span>
        </div>
        <table>
          <thead>
            <tr><th>Sr#</th><th>Account Title</th>${isThermal ? '' : '<th>Description</th><th>Invoice</th>'}<th>Amount</th></tr>
          </thead>
          <tbody>
            ${records.map((r, i) => `
              <tr>
                <td>${i + 1}</td>
                <td class="left">${r.accountTitle}</td>
                ${isThermal ? '' : `<td class="left">${r.description || ''}</td><td>${r.invoice || ''}</td>`}
                <td class="right">${parseFloat(r.amount).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total">Total: ${totalAmt.toFixed(2)}</div>
        <div class="footer">Software developed by: Rathisoft / www.rathisoft.com</div>
        <script>setTimeout(function(){ window.print(); }, 400);</script>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    clearPersistedState();
    setRecords([]);
    setSelectedRowId(null);
    loadNextCrv();
  };

  const handleRefresh = () => {
    clearPersistedState();
    setReceiptData({
      crvNumber: receiptData.crvNumber,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),
      code: '',
      accountId: '',
      accountTitle: '',
      description: '',
      invoice: '',
      discount: '',
      amount: '',
      address: ''
    });
    setRecords([]);
    setSelectedRowId(null);
    api.get('/cashreceipts/next-crv')
      .then(res => setReceiptData(prev => ({ ...prev, crvNumber: String(res.data.nextCrv) })))
      .catch(() => {});
  };

  const getTotalAmount = () => {
    return records.reduce((sum, record) => sum + (parseFloat(record.amount) || 0), 0);
  };

  const styles = {
    container: {
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#e0e0e0',
      minHeight: '100vh',
      margin: 0,
      padding: 0,
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      overflowX: 'hidden'
    },
    wrapper: {
      backgroundColor: 'white',
      width: '100%',
      margin: 0,
      boxSizing: 'border-box'
    },
    header: {
      backgroundColor: '#4a4a4a',
      color: 'white',
      padding: '12px',
      textAlign: 'center',
      fontSize: 'clamp(20px, 3vw, 32px)',
      fontWeight: 'bold',
      boxSizing: 'border-box'
    },
    section: {
      border: '2px solid #999',
      margin: '10px',
      padding: '10px',
      backgroundColor: '#f5f5f5',
      boxSizing: 'border-box'
    },
    sectionTitle: {
      fontSize: 'clamp(11px, 1.5vw, 13px)',
      fontWeight: 'bold',
      marginBottom: '10px',
      color: '#333'
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '8px',
      marginBottom: '10px',
      boxSizing: 'border-box'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '3px'
    },
    label: {
      fontSize: 'clamp(10px, 1.3vw, 12px)',
      fontWeight: '500',
      color: '#333'
    },
    input: {
      padding: '4px 6px',
      border: '1px solid #999',
      fontSize: 'clamp(10px, 1.3vw, 12px)',
      backgroundColor: 'white',
      boxSizing: 'border-box'
    },
    inputBlue: {
      padding: '4px 6px',
      border: '1px solid #999',
      fontSize: 'clamp(10px, 1.3vw, 12px)',
      backgroundColor: '#4da6ff',
      color: 'white',
      fontWeight: 'bold',
      boxSizing: 'border-box',
      cursor: 'pointer'
    },
    commandsSection: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
      flexWrap: 'wrap',
      padding: '10px',
      backgroundColor: '#f5f5f5',
      border: '2px solid #999',
      margin: '10px',
      boxSizing: 'border-box'
    },
    btn: {
      padding: '6px 14px',
      border: '1px solid #999',
      backgroundColor: '#e0e0e0',
      cursor: 'pointer',
      fontSize: 'clamp(10px, 1.3vw, 12px)',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      whiteSpace: 'nowrap',
      boxSizing: 'border-box',
      borderRadius: '3px'
    },
    checkbox: {
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      fontSize: 'clamp(10px, 1.3vw, 12px)'
    },
    radioGroup: {
      display: 'flex',
      gap: '10px',
      alignItems: 'center'
    },
    resultsSection: {
      border: '2px solid #999',
      margin: '10px',
      padding: '10px',
      backgroundColor: '#f5f5f5',
      boxSizing: 'border-box'
    },
    totalRow: {
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '10px',
      fontSize: 'clamp(10px, 1.3vw, 12px)',
      fontWeight: 'bold'
    },
    tableContainer: {
      width: '100%',
      overflowX: 'auto',
      boxSizing: 'border-box'
    },
    table: {
      width: '100%',
      minWidth: '700px',
      borderCollapse: 'collapse',
      fontSize: 'clamp(9px, 1.2vw, 11px)',
      backgroundColor: 'white'
    },
    th: {
      backgroundColor: '#d0d0d0',
      border: '1px solid #999',
      padding: '6px 4px',
      textAlign: 'center',
      fontWeight: 'bold',
      fontSize: 'clamp(9px, 1.2vw, 11px)'
    },
    td: {
      border: '1px solid #999',
      padding: '6px 4px',
      textAlign: 'center',
      fontSize: 'clamp(9px, 1.2vw, 11px)',
      cursor: 'pointer'
    },
    tdLeft: {
      border: '1px solid #999',
      padding: '6px 4px',
      textAlign: 'left',
      fontSize: 'clamp(9px, 1.2vw, 11px)',
      cursor: 'pointer'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.header}>Cash Receipt Voucher</div>
        
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Cash Receipt</div>
          
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>CRV #</label>
              <input 
                type="text" 
                name="crvNumber"
                value={receiptData.crvNumber}
                onChange={handleInputChange}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearchCRV(); }}
                style={styles.inputBlue}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Date</label>
              <input 
                type="text"
                name="date"
                value={receiptData.date}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Code</label>
              <input 
                type="text" 
                name="code"
                value={receiptData.code}
                readOnly
                style={{...styles.input, backgroundColor: '#f0f0f0'}}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Account Title</label>
              <input 
                type="text"
                value={receiptData.accountTitle}
                readOnly
                onClick={() => setShowCustomerModal(true)}
                style={{...styles.input, cursor: 'pointer', backgroundColor: '#ffffcc'}}
                placeholder="Click to select..."
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <input 
                type="text" 
                name="description"
                value={receiptData.description}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Invoice</label>
              <input 
                type="text" 
                name="invoice"
                value={receiptData.invoice}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Discount</label>
              <input 
                type="text" 
                name="discount"
                value={receiptData.discount}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Amount</label>
              <input 
                type="text" 
                name="amount"
                value={receiptData.amount}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Address</label>
            <input 
              type="text" 
              name="address"
              value={receiptData.address}
              onChange={handleInputChange}
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.commandsSection}>
          <label style={styles.checkbox}>
            <input type="checkbox" name="sms" checked={options.sms} onChange={handleOptionChange} />
            SMS
          </label>

          <PaperSizeSelector value={paperSize} onChange={setPaperSize} />

          <button style={styles.btn} onClick={handleRefresh}>Refresh</button>
          <button style={{...styles.btn, backgroundColor: '#4CAF50', color: 'white'}} onClick={handleSaveRecord}>Save Record</button>
          <button style={{...styles.btn, backgroundColor: '#dc3545', color: 'white'}} onClick={handleDelete}>Delete Record</button>
          <button style={{...styles.btn, backgroundColor: '#007bff', color: 'white'}} onClick={handlePrint}>Print Receipt</button>
          
          <button style={{...styles.btn, marginLeft: 'auto', backgroundColor: '#f44336', color: 'white', border: '1px solid #d32f2f'}} onClick={handleRefresh}>
            Close
          </button>
        </div>

        <div style={styles.resultsSection}>
          <div style={styles.sectionTitle}>Searching Results</div>
          
          <div style={styles.totalRow}>
            <label>Total Amount</label>
            <input 
              type="text" 
              value={getTotalAmount().toFixed(2)}
              style={{...styles.input, width: '150px', textAlign: 'right', fontWeight: 'bold'}}
              readOnly
            />
          </div>

          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Sr.#</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>CRV #</th>
                  <th style={styles.th}>Code</th>
                  <th style={styles.th}>Account Title</th>
                  <th style={styles.th}>Description</th>
                  <th style={styles.th}>Invoice</th>
                  <th style={styles.th}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td style={styles.td} colSpan="8">No records found. Enter CRV# and press Enter to search.</td>
                  </tr>
                ) : (
                  records.map((record, index) => (
                    <tr 
                      key={record.id || index} 
                      onClick={() => handleRowClick(record)}
                      style={{ backgroundColor: selectedRowId === record.id ? '#b3d9ff' : 'transparent' }}
                    >
                      <td style={styles.td}>{index + 1}</td>
                      <td style={styles.td}>{record.date}</td>
                      <td style={styles.td}>{record.crvNumber}</td>
                      <td style={styles.td}>{record.accountCode}</td>
                      <td style={styles.tdLeft}>{record.accountTitle}</td>
                      <td style={styles.tdLeft}>{record.description}</td>
                      <td style={styles.td}>{record.invoice}</td>
                      <td style={{...styles.td, textAlign: 'right'}}>{parseFloat(record.amount).toFixed(2)}</td>
                    </tr>
                  ))
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

export default CashReceiptVoucher;
