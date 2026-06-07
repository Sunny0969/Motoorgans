import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../utils/api';
import PaperSizeSelector from '../components/PaperSizeSelector';
import { getPaperStyle, getWindowSize, getScaledFontSize } from '../utils/printHelper';

const TrialBalancePage = () => {
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];

  const [fromDate, setFromDate] = useState(firstOfMonth);
  const [toDate, setToDate] = useState(today);
  const [data, setData] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [paperSize, setPaperSize] = useState('A5');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/trial-balance/mssql', { params: { fromDate, toDate } });
      setData(res.data);
      setAllCategories(res.data.allCategories || []);
    } catch (err) {
      console.error('Trial balance error:', err);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const grouped = useMemo(() => {
    if (!data?.accounts) return {};
    const groups = {};
    data.accounts.forEach(acc => {
      const cat = acc.category || 'Others';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(acc);
    });
    return groups;
  }, [data]);

  const tocCategories = useMemo(() => {
    const fromData = Object.keys(grouped);
    const merged = [...new Set([...allCategories, ...fromData])];
    merged.sort((a, b) => a.localeCompare(b));
    return merged;
  }, [allCategories, grouped]);

  const displayedAccounts = useMemo(() => {
    if (!data?.accounts) return [];
    if (selectedCategory) return grouped[selectedCategory] || [];
    return data.accounts;
  }, [data, selectedCategory, grouped]);

  const handlePrint = () => {
    if (!data) { alert('Please load data first.'); return; }
    const dateStr = new Date(toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
    const ps = paperSize;
    const isThermal = ps === 'Thermal';
    const printWindow = window.open('', '_blank', getWindowSize(ps));
    printWindow.document.write(`
      <html>
      <head>
        <title>Trial Balance</title>
        <style>
          ${getPaperStyle(ps)}
          h1 { text-align: center; font-size: ${isThermal ? '13px' : (ps === 'A4' ? '20px' : '16px')}; border: ${isThermal ? '1px dashed #333' : '2px solid #333'}; display: inline-block; padding: ${isThermal ? '3px 10px' : '5px 30px'}; margin: 0 auto ${isThermal ? '8px' : '15px'}; }
          .center { text-align: center; }
          .info { display: flex; justify-content: space-between; margin-bottom: ${isThermal ? '6px' : '15px'}; font-size: ${getScaledFontSize(ps, 11)}; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #999; padding: ${isThermal ? '2px 3px' : '4px 8px'}; font-size: ${getScaledFontSize(ps, 10)}; }
          th { background: #f0f0f0; font-weight: bold; }
          td.right { text-align: right; }
          .total-row td { font-weight: bold; background: #f8f8f8; }
          .footer { text-align: center; margin-top: ${isThermal ? '8px' : '20px'}; font-size: ${getScaledFontSize(ps, 9)}; color: #888; }
        </style>
      </head>
      <body>
        <div class="center"><h1>Trial Balance</h1></div>
        <div class="info"><span>${dateStr}</span><span>Page 1</span></div>
        <table>
          <thead><tr><th>A/C Id.</th><th>Account Title</th><th>Debit</th><th>Credit</th></tr></thead>
          <tbody>
            ${Object.entries(grouped).map(([cat, accounts]) => {
              const catDebit = accounts.reduce((s, a) => s + a.debit, 0);
              const catCredit = accounts.reduce((s, a) => s + a.credit, 0);
              return `
                <tr><td colspan="4" style="font-weight:bold; background:#e8e8e8; font-size:${getScaledFontSize(ps, 11)};">${cat}</td></tr>
                ${accounts.map(a => `
                  <tr>
                    <td>${a.code}</td>
                    <td>${a.accountTitle}</td>
                    <td class="right">${a.debit ? a.debit.toLocaleString('en-US', {minimumFractionDigits: 2}) : '0.00'}</td>
                    <td class="right">${a.credit ? a.credit.toLocaleString('en-US', {minimumFractionDigits: 2}) : '0.00'}</td>
                  </tr>
                `).join('')}
                <tr class="total-row"><td></td><td></td><td class="right">${catDebit.toLocaleString('en-US', {minimumFractionDigits: 2})}</td><td class="right">${catCredit.toLocaleString('en-US', {minimumFractionDigits: 2})}</td></tr>
              `;
            }).join('')}
            <tr style="font-weight:bold; font-size:${getScaledFontSize(ps, 12)}; background:#d0d0d0;">
              <td colspan="2" style="text-align:right;">Grand Total:</td>
              <td class="right">${data.totalDebit.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
              <td class="right">${data.totalCredit.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
            </tr>
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

  return (
    <div style={{ fontFamily: 'Tahoma, Arial, sans-serif', backgroundColor: '#c0c0c0', minHeight: '100vh', padding: '5px', display: 'flex', flexDirection: 'column' }}>
      {/* Title Bar */}
      <div style={{ backgroundColor: '#d4d0c8', border: '2px outset #fff', marginBottom: '2px' }}>
        <div style={{ backgroundColor: '#006060', color: 'white', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold' }}>
          Moto Organs Traders / User: admin - [Trial Balance]
        </div>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', padding: '8px 0', borderBottom: '2px solid #006060' }}>
        <h2 style={{ margin: 0, fontSize: '24px', color: '#006060', fontWeight: 'bold' }}>Trial Balance</h2>
      </div>

      {/* Duration & Commands */}
      <div style={{ display: 'flex', gap: '20px', margin: '8px 4px', padding: '8px', backgroundColor: '#f0f0f0', border: '1px solid #808080', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Duration</span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '3px' }}>
            <label style={{ fontSize: '10px' }}>From</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ padding: '2px 4px', border: '1px solid #808080', fontSize: '11px', height: '20px' }} />
            <label style={{ fontSize: '10px' }}>To</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ padding: '2px 4px', border: '1px solid #808080', fontSize: '11px', height: '20px' }} />
          </div>
        </div>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Commands</span>
          <div style={{ display: 'flex', gap: '8px', marginTop: '3px' }}>
            <button onClick={fetchData} disabled={loading} style={{ padding: '3px 16px', border: '2px outset #d4d0c8', backgroundColor: '#d4d0c8', fontSize: '11px', cursor: 'pointer', height: '22px' }}>
              {loading ? 'Loading...' : 'Show'}
            </button>
            <button onClick={handlePrint} style={{ padding: '3px 16px', border: '2px outset #d4d0c8', backgroundColor: '#d4d0c8', fontSize: '11px', cursor: 'pointer', height: '22px' }}>
              Print Preview
            </button>
            <button style={{ padding: '3px 16px', border: '2px outset #d4d0c8', backgroundColor: '#d4d0c8', fontSize: '11px', cursor: 'pointer', height: '22px', color: 'red' }}>
              Close
            </button>
            <PaperSizeSelector value={paperSize} onChange={setPaperSize} style={{ marginLeft: '10px' }} />
          </div>
        </div>
        {data && (
          <div style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 'bold' }}>
            Total Debit: <span style={{ color: '#006060' }}>{data.totalDebit.toLocaleString()}</span> &nbsp;|&nbsp;
            Total Credit: <span style={{ color: '#c00' }}>{data.totalCredit.toLocaleString()}</span> &nbsp;|&nbsp;
            Balance: <span>{(data.totalDebit - data.totalCredit).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Main Content: Left TOC + Right Report */}
      <div style={{ display: 'flex', flex: 1, margin: '0 4px', gap: '2px', overflow: 'hidden' }}>
        {/* Left Sidebar - Category TOC */}
        <div style={{ width: '220px', minWidth: '220px', border: '1px solid #808080', backgroundColor: '#fff', overflowY: 'auto', padding: '4px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', padding: '4px', borderBottom: '1px solid #ccc', marginBottom: '4px' }}>Preview</div>
          <div
            onClick={() => setSelectedCategory(null)}
            style={{ padding: '3px 8px', fontSize: '11px', cursor: 'pointer', backgroundColor: !selectedCategory ? '#006060' : 'transparent', color: !selectedCategory ? 'white' : '#333', borderRadius: '2px', marginBottom: '1px' }}
          >
            All Categories
          </div>
          {tocCategories.map(cat => {
            const hasData = grouped[cat] && grouped[cat].length > 0;
            return (
              <div
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  backgroundColor: selectedCategory === cat ? '#006060' : 'transparent',
                  color: selectedCategory === cat ? 'white' : hasData ? '#333' : '#999',
                  borderRadius: '2px',
                  marginBottom: '1px',
                  fontStyle: hasData ? 'normal' : 'italic',
                }}
              >
                {cat}
              </div>
            );
          })}
        </div>

        {/* Right - Trial Balance Report */}
        <div style={{ flex: 1, border: '1px solid #808080', backgroundColor: '#fff', overflowY: 'auto', padding: '15px 30px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666', fontSize: '12px' }}>
              Loading...
            </div>
          ) : !data ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666', fontSize: '12px' }}>
              Select date range to load Trial Balance.
            </div>
          ) : (
            <>
              {/* Report Header */}
              <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                <div style={{ border: '2px solid #333', display: 'inline-block', padding: '6px 40px', fontSize: '18px', fontWeight: 'bold' }}>Trial Balance</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '11px' }}>
                <span>From: {new Date(fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })} To: {new Date(toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</span>
                <span>Page 1</span>
              </div>

              {/* Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #333' }}>
                    <th style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 'bold', width: '60px', borderBottom: '2px solid #333' }}>A/C Id.</th>
                    <th style={{ padding: '5px 8px', textAlign: 'left', fontWeight: 'bold', borderBottom: '2px solid #333' }}>Account Title</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold', width: '120px', borderBottom: '2px solid #333' }}>Debit</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold', width: '120px', borderBottom: '2px solid #333' }}>Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCategory ? (
                    <>
                      <tr><td colSpan="4" style={{ padding: '10px 0 4px', fontWeight: 'bold', fontSize: '12px' }}>{selectedCategory}</td></tr>
                      {displayedAccounts.length === 0 ? (
                        <tr><td colSpan="4" style={{ padding: '10px', textAlign: 'center', color: '#999', fontStyle: 'italic' }}>No transactions found for this category in the selected date range.</td></tr>
                      ) : (
                        <>
                          {displayedAccounts.map(acc => (
                            <tr key={acc.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                              <td style={{ padding: '3px 8px', textAlign: 'center', fontSize: '11px' }}>{acc.code}</td>
                              <td style={{ padding: '3px 8px', textAlign: 'left', fontSize: '11px' }}>{acc.accountTitle}</td>
                              <td style={{ padding: '3px 8px', textAlign: 'right', fontSize: '11px' }}>{acc.debit ? acc.debit.toLocaleString('en-US', {minimumFractionDigits: 2}) : '0.00'}</td>
                              <td style={{ padding: '3px 8px', textAlign: 'right', fontSize: '11px' }}>{acc.credit ? acc.credit.toLocaleString('en-US', {minimumFractionDigits: 2}) : '0.00'}</td>
                            </tr>
                          ))}
                          <tr style={{ borderTop: '2px solid #333' }}>
                            <td></td>
                            <td style={{ padding: '5px 8px', fontWeight: 'bold', textAlign: 'right' }}>Sub Total:</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold' }}>{displayedAccounts.reduce((s, a) => s + a.debit, 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold' }}>{displayedAccounts.reduce((s, a) => s + a.credit, 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                          </tr>
                        </>
                      )}
                    </>
                  ) : (
                    Object.entries(grouped).map(([cat, accounts]) => {
                      const catDebit = accounts.reduce((s, a) => s + a.debit, 0);
                      const catCredit = accounts.reduce((s, a) => s + a.credit, 0);
                      return (
                        <React.Fragment key={cat}>
                          <tr><td colSpan="4" style={{ padding: '10px 0 2px', fontWeight: 'bold', fontSize: '12px', backgroundColor: '#f5f5f5' }}>{cat}</td></tr>
                          {accounts.map(acc => (
                            <tr key={acc.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                              <td style={{ padding: '3px 8px', textAlign: 'center', fontSize: '11px' }}>{acc.code}</td>
                              <td style={{ padding: '3px 8px', textAlign: 'left', fontSize: '11px' }}>{acc.accountTitle}</td>
                              <td style={{ padding: '3px 8px', textAlign: 'right', fontSize: '11px' }}>{acc.debit ? acc.debit.toLocaleString('en-US', {minimumFractionDigits: 2}) : '0.00'}</td>
                              <td style={{ padding: '3px 8px', textAlign: 'right', fontSize: '11px' }}>{acc.credit ? acc.credit.toLocaleString('en-US', {minimumFractionDigits: 2}) : '0.00'}</td>
                            </tr>
                          ))}
                          <tr style={{ borderTop: '1px solid #999' }}>
                            <td></td><td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '10px', padding: '4px 8px' }}></td>
                            <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '11px' }}>{catDebit.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                            <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '11px' }}>{catCredit.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                          </tr>
                        </React.Fragment>
                      );
                    })
                  )}
                  {data && !selectedCategory && (
                    <tr style={{ fontWeight: 'bold', fontSize: '12px', backgroundColor: '#d0d0d0', borderTop: '3px solid #333' }}>
                      <td colSpan="2" style={{ padding: '6px 8px', textAlign: 'right' }}>Grand Total:</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{data.totalDebit.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{data.totalCredit.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrialBalancePage;
