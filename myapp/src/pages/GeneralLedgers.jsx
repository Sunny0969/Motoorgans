import React, { useState } from 'react';
import api from '../utils/api';
import SupplierSearchModal from '../components/SupplierSearchModal';
import PaperSizeSelector from '../components/PaperSizeSelector';
import { getPaperStyle, getWindowSize, getScaledFontSize } from '../utils/printHelper';

const AccountLedger = () => {
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];

  const [filterData, setFilterData] = useState({
    fromDate: firstOfMonth,
    toDate: today,
    accountId: '',
    accountCode: '',
    accountTitle: ''
  });

  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [paperSize, setPaperSize] = useState('A5');

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterData(prev => ({ ...prev, [name]: value }));
  };

  const handleAccountSelect = (account) => {
    const name = account.customerName || account.accountTitle || account.name || '';
    const code = account.code || account.Id || '';
    const id = account.Id || account._id || account.id || '';
    setFilterData(prev => ({
      ...prev,
      accountId: String(id),
      accountCode: String(code),
      accountTitle: name,
    }));
    setShowAccountModal(false);
    fetchLedger(String(id));
  };

  const fetchLedger = async (accountId) => {
    if (!accountId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/ledger', {
        params: { accountId, fromDate: filterData.fromDate, toDate: filterData.toDate, limit: 5000 },
      });
      const { entries, summary } = response.data;
      let runningBalance = summary.openingBalance || 0;
      const processedEntries = entries.map((entry, i) => {
        runningBalance = runningBalance + (parseFloat(entry.debit) || 0) - (parseFloat(entry.credit) || 0);
        return {
          sr: i + 1, date: entry.date, vcNumber: entry.docNo, voucher: entry.type || '',
          narration: entry.narration || '', invoice: entry.invoice ?? '',
          debit: parseFloat(entry.debit) || 0, credit: parseFloat(entry.credit) || 0,
          balance: runningBalance, status: runningBalance >= 0 ? 'Dr' : 'Cr',
        };
      });
      const openingEntry = {
        sr: '', date: entries.length > 0 ? entries[0].date : '', vcNumber: '', voucher: '',
        narration: 'Brought Forward', invoice: '',
        debit: summary.openingBalance > 0 ? summary.openingBalance : 0,
        credit: summary.openingBalance < 0 ? Math.abs(summary.openingBalance) : 0,
        balance: summary.openingBalance || 0, status: (summary.openingBalance || 0) >= 0 ? 'Dr' : 'Cr',
      };
      setLedgerData({
        summary: { openingBalance: summary.openingBalance || 0, totalDebit: summary.totalDebit || 0, totalCredit: summary.totalCredit || 0, closingBalance: summary.closingBalance || 0 },
        entries: [openingEntry, ...processedEntries],
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error fetching ledger');
      setLedgerData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleShow = async () => {
    if (!filterData.accountId) {
      alert('Please select an Account');
      return;
    }
    fetchLedger(filterData.accountId);
  };

  const handlePreview = () => {
    if (!ledgerData) {
      alert('Please generate the report first');
      return;
    }
    const s = ledgerData.summary;
    const ps = paperSize;
    const isThermal = ps === 'Thermal';
    const printWindow = window.open('', '_blank', getWindowSize(ps));
    printWindow.document.write(`
      <html>
      <head>
        <title>Account Ledger - ${filterData.accountTitle}</title>
        <style>
          ${getPaperStyle(ps)}
          .header { text-align: center; border-bottom: ${isThermal ? '1px dashed #333' : '2px solid #333'}; padding-bottom: 6px; margin-bottom: ${isThermal ? '6px' : '12px'}; }
          .header h1 { margin: 0; font-size: ${isThermal ? '12px' : (ps === 'A4' ? '20px' : '16px')}; }
          .info { display: ${isThermal ? 'block' : 'flex'}; justify-content: space-between; margin-bottom: 8px; font-size: ${getScaledFontSize(ps, 11)}; }
          .summary { display: ${isThermal ? 'block' : 'flex'}; gap: ${isThermal ? '2px' : '30px'}; margin-bottom: ${isThermal ? '6px' : '12px'}; font-size: ${getScaledFontSize(ps, 11)}; border: 1px solid #999; padding: ${isThermal ? '4px' : '8px'}; background: #f5f5f5; }
          .summary div span { font-weight: bold; }
          .summary div { ${isThermal ? 'margin: 2px 0;' : ''} }
          table { width: 100%; border-collapse: collapse; margin: ${isThermal ? '4px 0' : '8px 0'}; }
          th, td { border: 1px solid #333; padding: ${isThermal ? '1px 3px' : '4px 6px'}; font-size: ${getScaledFontSize(ps, 10)}; }
          th { background: #e0e0e0; font-weight: bold; text-align: center; }
          td.right { text-align: right; }
          td.left { text-align: left; }
          .footer { text-align: center; font-size: ${getScaledFontSize(ps, 9)}; color: #888; margin-top: ${isThermal ? '6px' : '15px'}; border-top: 1px solid #ddd; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header"><h1>Moto Organs Traders - Account Ledger</h1></div>
        <div class="info">
          <span><strong>Account:</strong> ${filterData.accountTitle} (${filterData.accountCode})</span>
          ${isThermal ? '<br/>' : ''}
          <span><strong>Period:</strong> ${filterData.fromDate} to ${filterData.toDate}</span>
        </div>
        <div class="summary">
          <div>Opening Balance: <span>${Math.abs(s.openingBalance).toLocaleString()} ${s.openingBalance >= 0 ? 'Dr' : 'Cr'}</span></div>
          <div>Total Debit: <span>${s.totalDebit.toLocaleString()}</span></div>
          <div>Total Credit: <span>${s.totalCredit.toLocaleString()}</span></div>
          <div>Closing Balance: <span>${Math.abs(s.closingBalance).toLocaleString()} ${s.closingBalance >= 0 ? 'Dr' : 'Cr'}</span></div>
        </div>
        <table>
          <thead><tr><th>Sr#</th><th>Date</th>${isThermal ? '' : '<th>Vc#</th><th>Voucher</th>'}<th>Narration</th>${isThermal ? '' : '<th>Invoice</th>'}<th>Debit</th><th>Credit</th><th>Balance</th>${isThermal ? '' : '<th>Status</th>'}</tr></thead>
          <tbody>
            ${ledgerData.entries.map(e => `
              <tr>
                <td>${e.sr}</td><td>${e.date}</td>${isThermal ? '' : `<td>${e.vcNumber || ''}</td><td>${e.voucher}</td>`}
                <td class="left">${e.narration}</td>${isThermal ? '' : `<td>${e.invoice}</td>`}
                <td class="right">${e.debit ? e.debit.toLocaleString() : ''}</td>
                <td class="right">${e.credit ? e.credit.toLocaleString() : ''}</td>
                <td class="right">${Math.abs(e.balance).toLocaleString()}</td>${isThermal ? '' : `<td>${e.status}</td>`}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">Software developed by: Rathisoft / www.rathisoft.com</div>
        <script>setTimeout(function(){ window.print(); }, 400);</script>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  };

  const handleRefresh = () => {
    setFilterData({ fromDate: firstOfMonth, toDate: today, accountId: '', accountCode: '', accountTitle: '' });
    setLedgerData(null);
    setError(null);
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    if (num === 0) return '';
    return Math.abs(num).toLocaleString('en-US');
  };

  return (
    <div style={{ fontFamily: 'Tahoma, Arial, sans-serif', backgroundColor: '#c0c0c0', minHeight: '100vh', padding: '5px' }}>
      {/* Title Bar */}
      <div style={{ backgroundColor: '#d4d0c8', border: '2px outset #fff', marginBottom: '2px' }}>
        <div style={{ backgroundColor: '#000080', color: 'white', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold' }}>
          Moto Organs Traders / User: admin - [Account Ledger]
        </div>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', padding: '8px 0', borderBottom: '2px solid #000080' }}>
        <h2 style={{ margin: 0, fontSize: '24px', color: '#000080', fontStyle: 'italic', fontWeight: 'bold' }}>Account Ledger</h2>
      </div>

      {/* Information Required Section */}
      <div style={{ border: '1px solid #808080', margin: '8px 4px', padding: '8px', backgroundColor: '#f0f0f0' }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px' }}>Information Required</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <label style={{ fontSize: '10px', fontWeight: 'bold' }}>From</label>
            <input type="date" name="fromDate" value={filterData.fromDate} onChange={handleFilterChange} style={{ padding: '2px 4px', border: '1px solid #808080', fontSize: '11px', height: '20px', width: '110px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <label style={{ fontSize: '10px', fontWeight: 'bold' }}>To</label>
            <input type="date" name="toDate" value={filterData.toDate} onChange={handleFilterChange} style={{ padding: '2px 4px', border: '1px solid #808080', fontSize: '11px', height: '20px', width: '110px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <label style={{ fontSize: '10px', fontWeight: 'bold' }}>Code</label>
            <input type="text" value={filterData.accountCode} readOnly style={{ padding: '2px 4px', border: '1px solid #808080', fontSize: '11px', height: '20px', width: '50px', backgroundColor: '#c0ffff', fontWeight: 'bold', textAlign: 'center' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: '1', minWidth: '200px' }}>
            <label style={{ fontSize: '10px', fontWeight: 'bold' }}>Account Title</label>
            <input type="text" value={filterData.accountTitle} readOnly onClick={() => setShowAccountModal(true)} style={{ padding: '2px 4px', border: '1px solid #808080', fontSize: '11px', height: '20px', cursor: 'pointer', backgroundColor: 'white' }} placeholder="Click to select..." />
          </div>
          <button onClick={handleShow} disabled={loading} style={{ padding: '3px 16px', border: '2px outset #d4d0c8', backgroundColor: '#d4d0c8', fontSize: '11px', cursor: 'pointer', height: '22px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'green', fontWeight: 'bold' }}>&#9654;</span> {loading ? 'Loading...' : 'Show'}
          </button>
          <button onClick={handlePreview} style={{ padding: '3px 16px', border: '2px outset #d4d0c8', backgroundColor: '#d4d0c8', fontSize: '11px', cursor: 'pointer', height: '22px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>&#128438;</span> Preview
          </button>
          <PaperSizeSelector value={paperSize} onChange={setPaperSize} />
        </div>
      </div>

      {/* Commands Section */}
      <div style={{ border: '1px solid #808080', margin: '8px 4px', padding: '8px', backgroundColor: '#f0f0f0' }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px' }}>Commands</div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <label style={{ fontSize: '10px', fontWeight: 'bold' }}>Opening Balance</label>
            <input type="text" value={ledgerData ? formatCurrency(ledgerData.summary.openingBalance) : '0'} readOnly style={{ padding: '2px 4px', border: '1px solid #808080', fontSize: '11px', height: '20px', width: '100px', textAlign: 'right', fontWeight: 'bold' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <label style={{ fontSize: '10px', fontWeight: 'bold' }}>Total Debit</label>
            <input type="text" value={ledgerData ? formatCurrency(ledgerData.summary.totalDebit) : '0'} readOnly style={{ padding: '2px 4px', border: '1px solid #808080', fontSize: '11px', height: '20px', width: '100px', textAlign: 'right' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <label style={{ fontSize: '10px', fontWeight: 'bold' }}>Total Credit</label>
            <input type="text" value={ledgerData ? formatCurrency(ledgerData.summary.totalCredit) : '0'} readOnly style={{ padding: '2px 4px', border: '1px solid #808080', fontSize: '11px', height: '20px', width: '100px', textAlign: 'right' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <label style={{ fontSize: '10px', fontWeight: 'bold' }}>Closing Balance</label>
            <input type="text" value={ledgerData ? formatCurrency(ledgerData.summary.closingBalance) : '0'} readOnly style={{ padding: '2px 4px', border: '1px solid #808080', fontSize: '11px', height: '20px', width: '100px', textAlign: 'right', fontWeight: 'bold' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <label style={{ fontSize: '10px', fontWeight: 'bold' }}>&nbsp;</label>
            <input type="text" value={ledgerData ? (ledgerData.summary.closingBalance >= 0 ? 'Dr' : 'Cr') : ''} readOnly style={{ padding: '2px 4px', border: '1px solid #808080', fontSize: '11px', height: '20px', width: '30px', textAlign: 'center', fontWeight: 'bold' }} />
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button onClick={handleRefresh} style={{ padding: '3px 14px', border: '2px outset #d4d0c8', backgroundColor: '#d4d0c8', fontSize: '11px', cursor: 'pointer', height: '22px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: 'green' }}>&#8635;</span> Refresh
            </button>
            <button style={{ padding: '3px 14px', border: '2px outset #d4d0c8', backgroundColor: '#d4d0c8', fontSize: '11px', cursor: 'pointer', height: '22px', display: 'flex', alignItems: 'center', gap: '4px', color: 'red' }}>
              <span>&#10006;</span> Close
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ border: '1px solid red', margin: '8px 4px', padding: '6px', backgroundColor: '#ffe0e0', color: '#c00', fontSize: '11px', fontWeight: 'bold' }}>
          {error}
        </div>
      )}

      {/* Results Section */}
      <div style={{ border: '1px solid #808080', margin: '8px 4px', padding: '8px', backgroundColor: '#f0f0f0', flexGrow: 1 }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}>Result(s)</div>
        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 340px)', overflowY: 'auto', border: '1px solid #808080' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', backgroundColor: 'white' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #808080', padding: '4px 6px', backgroundColor: '#d4d0c8', fontWeight: 'bold', textAlign: 'center', fontSize: '11px', position: 'sticky', top: 0, zIndex: 1 }}>Sr #</th>
                <th style={{ border: '1px solid #808080', padding: '4px 6px', backgroundColor: '#d4d0c8', fontWeight: 'bold', textAlign: 'center', fontSize: '11px', position: 'sticky', top: 0, zIndex: 1 }}>Date</th>
                <th style={{ border: '1px solid #808080', padding: '4px 6px', backgroundColor: '#d4d0c8', fontWeight: 'bold', textAlign: 'center', fontSize: '11px', position: 'sticky', top: 0, zIndex: 1 }}>Vc #</th>
                <th style={{ border: '1px solid #808080', padding: '4px 6px', backgroundColor: '#d4d0c8', fontWeight: 'bold', textAlign: 'center', fontSize: '11px', position: 'sticky', top: 0, zIndex: 1 }}>Voucher</th>
                <th style={{ border: '1px solid #808080', padding: '4px 6px', backgroundColor: '#d4d0c8', fontWeight: 'bold', textAlign: 'left', fontSize: '11px', position: 'sticky', top: 0, zIndex: 1 }}>Narration</th>
                <th style={{ border: '1px solid #808080', padding: '4px 6px', backgroundColor: '#d4d0c8', fontWeight: 'bold', textAlign: 'center', fontSize: '11px', position: 'sticky', top: 0, zIndex: 1 }}>Invoice</th>
                <th style={{ border: '1px solid #808080', padding: '4px 6px', backgroundColor: '#d4d0c8', fontWeight: 'bold', textAlign: 'right', fontSize: '11px', position: 'sticky', top: 0, zIndex: 1 }}>Debit</th>
                <th style={{ border: '1px solid #808080', padding: '4px 6px', backgroundColor: '#d4d0c8', fontWeight: 'bold', textAlign: 'right', fontSize: '11px', position: 'sticky', top: 0, zIndex: 1 }}>Credit</th>
                <th style={{ border: '1px solid #808080', padding: '4px 6px', backgroundColor: '#d4d0c8', fontWeight: 'bold', textAlign: 'right', fontSize: '11px', position: 'sticky', top: 0, zIndex: 1 }}>Balance</th>
                <th style={{ border: '1px solid #808080', padding: '4px 6px', backgroundColor: '#d4d0c8', fontWeight: 'bold', textAlign: 'center', fontSize: '11px', position: 'sticky', top: 0, zIndex: 1 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="10" style={{ border: '1px solid #808080', padding: '8px', textAlign: 'center', fontSize: '11px' }}>Loading ledger data...</td></tr>
              ) : !ledgerData ? (
                <tr><td colSpan="10" style={{ border: '1px solid #808080', padding: '8px', textAlign: 'center', fontSize: '11px', color: '#666' }}>Select an account and click Show to view ledger.</td></tr>
              ) : ledgerData.entries.length === 0 ? (
                <tr><td colSpan="10" style={{ border: '1px solid #808080', padding: '8px', textAlign: 'center', fontSize: '11px' }}>No transactions found.</td></tr>
              ) : (
                ledgerData.entries.map((entry, i) => (
                  <tr key={i}>
                    <td style={{ border: '1px solid #c0c0c0', padding: '3px 6px', textAlign: 'center', fontSize: '11px' }}>{entry.sr}</td>
                    <td style={{ border: '1px solid #c0c0c0', padding: '3px 6px', textAlign: 'center', fontSize: '11px' }}>{entry.date}</td>
                    <td style={{ border: '1px solid #c0c0c0', padding: '3px 6px', textAlign: 'right', fontSize: '11px' }}>{entry.vcNumber || ''}</td>
                    <td style={{ border: '1px solid #c0c0c0', padding: '3px 6px', textAlign: 'left', fontSize: '11px' }}>{entry.voucher}</td>
                    <td style={{ border: '1px solid #c0c0c0', padding: '3px 6px', textAlign: 'left', fontSize: '11px' }}>{entry.narration}</td>
                    <td style={{ border: '1px solid #c0c0c0', padding: '3px 6px', textAlign: 'center', fontSize: '11px' }}>{entry.invoice}</td>
                    <td style={{ border: '1px solid #c0c0c0', padding: '3px 6px', textAlign: 'right', fontSize: '11px' }}>{entry.debit ? formatCurrency(entry.debit) : ''}</td>
                    <td style={{ border: '1px solid #c0c0c0', padding: '3px 6px', textAlign: 'right', fontSize: '11px' }}>{entry.credit ? formatCurrency(entry.credit) : ''}</td>
                    <td style={{ border: '1px solid #c0c0c0', padding: '3px 6px', textAlign: 'right', fontSize: '11px', fontWeight: 'bold' }}>{formatCurrency(entry.balance)}</td>
                    <td style={{ border: '1px solid #c0c0c0', padding: '3px 6px', textAlign: 'center', fontSize: '11px' }}>{entry.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SupplierSearchModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        onSelectSupplier={handleAccountSelect}
        selectedSupplier={null}
        type="customer"
      />
    </div>
  );
};

export default AccountLedger;
