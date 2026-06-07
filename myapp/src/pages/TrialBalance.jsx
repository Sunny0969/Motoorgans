import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const TrialBalance = () => {
  const [filterData, setFilterData] = useState({
    fromDate: '2022-01-01',
    toDate: '2022-03-31',
    accountType: 'All',
    showZeroBalances: false,
    groupByType: true
  });

  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState({
    reportPeriod: { fromDate: '', toDate: '' },
    filters: {},
    accounts: [],
    totals: { totalDebit: 0, totalCredit: 0, isBalanced: false, difference: 0 }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilterData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const generateReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        fromDate: filterData.fromDate,
        toDate: filterData.toDate,
        accountType: filterData.accountType,
        showZeroBalances: filterData.showZeroBalances.toString(),
        groupByType: filterData.groupByType.toString()
      });

      const response = await api.get(`/reports/trial-balance?${params}`);
      setReportData(response.data);
      setShowReport(true);
    } catch (err) {
      console.error('Error fetching trial balance:', err);
      setError('Failed to load trial balance data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShow = () => {
    generateReport();
  };

  const handlePrint = () => {
    if (!showReport) {
      alert('Please generate report first');
      return;
    }
    window.print();
  };

  const handleExport = async () => {
    if (!showReport) {
      alert('Please generate report first');
      return;
    }

    try {
      const params = new URLSearchParams({
        fromDate: filterData.fromDate,
        toDate: filterData.toDate,
        accountType: filterData.accountType,
        showZeroBalances: filterData.showZeroBalances.toString(),
        groupByType: filterData.groupByType.toString()
      });

      // Create a link to download the Excel file
      const link = document.createElement('a');
      link.href = `${api.defaults.baseURL}/reports/trial-balance/export?${params}`;
      link.download = 'trial-balance.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting trial balance:', err);
      alert('Failed to export trial balance. Please try again.');
    }
  };

  const handleRefresh = () => {
    setFilterData({
      fromDate: '2022-01-01',
      toDate: '2022-03-31',
      accountType: 'All',
      showZeroBalances: false,
      groupByType: true
    });
    setShowReport(false);
    setReportData({
      reportPeriod: { fromDate: '', toDate: '' },
      filters: {},
      accounts: [],
      totals: { totalDebit: 0, totalCredit: 0, isBalanced: false, difference: 0 }
    });
    setError(null);
  };

  const isBalanced = reportData.totals.isBalanced;

  const styles = {
    container: {
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#d0d0d0',
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
      padding: '10px',
      textAlign: 'center',
      fontSize: 'clamp(18px, 3vw, 28px)',
      fontWeight: 'bold',
      boxSizing: 'border-box'
    },
    filterSection: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      alignItems: 'flex-end',
      padding: '10px',
      backgroundColor: '#e8e8e8',
      borderBottom: '2px solid #999',
      fontSize: 'clamp(9px, 1.2vw, 11px)',
      boxSizing: 'border-box'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '3px',
      flex: '1',
      minWidth: '110px'
    },
    label: {
      fontSize: 'clamp(9px, 1.2vw, 11px)',
      fontWeight: '500',
      color: '#333'
    },
    input: {
      padding: '3px 5px',
      border: '1px solid #999',
      fontSize: 'clamp(9px, 1.2vw, 11px)',
      backgroundColor: 'white',
      boxSizing: 'border-box'
    },
    select: {
      padding: '3px 5px',
      border: '1px solid #999',
      fontSize: 'clamp(9px, 1.2vw, 11px)',
      backgroundColor: 'white',
      boxSizing: 'border-box'
    },
    checkbox: {
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      fontSize: 'clamp(9px, 1.2vw, 11px)'
    },
    btn: {
      padding: '5px 12px',
      border: '1px solid #999',
      backgroundColor: '#e0e0e0',
      cursor: 'pointer',
      fontSize: 'clamp(9px, 1.2vw, 11px)',
      whiteSpace: 'nowrap',
      boxSizing: 'border-box',
      borderRadius: '3px'
    },
    contentArea: {
      padding: '15px',
      backgroundColor: '#f5f5f5',
      minHeight: '500px',
      boxSizing: 'border-box'
    },
    reportContainer: {
      backgroundColor: 'white',
      padding: '20px',
      maxWidth: '1000px',
      margin: '0 auto',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      boxSizing: 'border-box'
    },
    reportTitle: {
      textAlign: 'center',
      fontSize: 'clamp(16px, 2vw, 22px)',
      fontWeight: 'bold',
      marginBottom: '8px',
      color: '#333'
    },
    reportSubtitle: {
      textAlign: 'center',
      fontSize: 'clamp(11px, 1.3vw, 13px)',
      marginBottom: '20px',
      color: '#666'
    },
    groupHeader: {
      backgroundColor: '#5a5a5a',
      color: 'white',
      padding: '8px 10px',
      fontSize: 'clamp(11px, 1.4vw, 13px)',
      fontWeight: 'bold',
      marginTop: '15px',
      marginBottom: '5px',
      borderRadius: '3px'
    },
    tableContainer: {
      width: '100%',
      overflowX: 'auto',
      boxSizing: 'border-box'
    },
    table: {
      width: '100%',
      minWidth: '600px',
      borderCollapse: 'collapse',
      fontSize: 'clamp(9px, 1.2vw, 11px)',
      backgroundColor: 'white',
      marginBottom: '15px'
    },
    th: {
      backgroundColor: '#d0d0d0',
      border: '1px solid #999',
      padding: '6px 8px',
      textAlign: 'left',
      fontWeight: 'bold',
      fontSize: 'clamp(9px, 1.2vw, 11px)'
    },
    thRight: {
      backgroundColor: '#d0d0d0',
      border: '1px solid #999',
      padding: '6px 8px',
      textAlign: 'right',
      fontWeight: 'bold',
      fontSize: 'clamp(9px, 1.2vw, 11px)'
    },
    td: {
      border: '1px solid #ccc',
      padding: '6px 8px',
      fontSize: 'clamp(9px, 1.2vw, 11px)'
    },
    tdRight: {
      border: '1px solid #ccc',
      padding: '6px 8px',
      textAlign: 'right',
      fontSize: 'clamp(9px, 1.2vw, 11px)'
    },
    totalRow: {
      backgroundColor: '#ffffcc',
      fontWeight: 'bold'
    },
    balanceRow: {
      backgroundColor: '#ccffcc',
      fontWeight: 'bold'
    },
    unbalancedRow: {
      backgroundColor: '#ffcccc',
      fontWeight: 'bold'
    },
    emptyState: {
      textAlign: 'center',
      padding: '50px 20px',
      color: '#999',
      fontSize: 'clamp(12px, 1.5vw, 14px)'
    },
    errorState: {
      textAlign: 'center',
      padding: '50px 20px',
      color: '#d32f2f',
      fontSize: 'clamp(12px, 1.5vw, 14px)',
      backgroundColor: '#ffebee',
      border: '1px solid #ffcdd2',
      borderRadius: '4px',
      margin: '20px 0'
    },
    loadingState: {
      textAlign: 'center',
      padding: '50px 20px',
      color: '#666',
      fontSize: 'clamp(12px, 1.5vw, 14px)'
    },
    actionBar: {
      display: 'flex',
      gap: '6px',
      padding: '8px',
      backgroundColor: '#4a4a4a',
      alignItems: 'center',
      borderTop: '2px solid #333',
      flexWrap: 'wrap',
      boxSizing: 'border-box'
    },
    actionBtn: {
      padding: '6px 12px',
      border: '1px solid #666',
      backgroundColor: '#6a6a6a',
      color: 'white',
      cursor: 'pointer',
      fontSize: 'clamp(9px, 1.2vw, 11px)',
      display: 'flex',
      alignItems: 'center',
      gap: '3px',
      whiteSpace: 'nowrap',
      boxSizing: 'border-box',
      borderRadius: '3px'
    },
    statusBox: {
      padding: '6px 12px',
      borderRadius: '4px',
      fontSize: 'clamp(10px, 1.3vw, 12px)',
      fontWeight: 'bold',
      marginLeft: 'auto'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.header}>Trial Balance</div>

        {/* Filter Section */}
        <div style={styles.filterSection}>
          <div style={{...styles.formGroup, flex: '0 0 110px'}}>
            <label style={styles.label}>From Date</label>
            <input
              type="date"
              name="fromDate"
              value={filterData.fromDate}
              onChange={handleFilterChange}
              style={styles.input}
            />
          </div>

          <div style={{...styles.formGroup, flex: '0 0 110px'}}>
            <label style={styles.label}>To Date</label>
            <input
              type="date"
              name="toDate"
              value={filterData.toDate}
              onChange={handleFilterChange}
              style={styles.input}
            />
          </div>

          <div style={{...styles.formGroup, flex: '0 0 130px'}}>
            <label style={styles.label}>Account Type</label>
            <select
              name="accountType"
              value={filterData.accountType}
              onChange={handleFilterChange}
              style={styles.select}
            >
              <option value="All">All Accounts</option>
              <option value="Assets">Assets</option>
              <option value="Liabilities">Liabilities</option>
              <option value="Equity">Equity</option>
              <option value="Income">Income</option>
              <option value="Expenses">Expenses</option>
            </select>
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
            <label style={styles.checkbox}>
              <input
                type="checkbox"
                name="showZeroBalances"
                checked={filterData.showZeroBalances}
                onChange={handleFilterChange}
              />
              Show Zero Balances
            </label>

            <label style={styles.checkbox}>
              <input
                type="checkbox"
                name="groupByType"
                checked={filterData.groupByType}
                onChange={handleFilterChange}
              />
              Group by Type
            </label>
          </div>

          <button style={styles.btn} onClick={handleShow} disabled={loading}>
            <span>🔍</span> {loading ? 'Loading...' : 'Show Report'}
          </button>

          <button style={styles.btn} onClick={handlePrint}>
            <span>🖨️</span> Print
          </button>

          <button style={styles.btn} onClick={handleExport}>
            <span>📊</span> Export
          </button>

          <button style={styles.btn} onClick={handleRefresh}>
            <span>🔄</span> Refresh
          </button>
        </div>

        {/* Content Area */}
        <div style={styles.contentArea}>
          {error && (
            <div style={styles.errorState}>
              {error}
            </div>
          )}

          {loading && (
            <div style={styles.loadingState}>
              Loading trial balance data...
            </div>
          )}

          {!showReport && !loading && !error ? (
            <div style={styles.emptyState}>
              Click "Show Report" to generate Trial Balance
            </div>
          ) : showReport && !loading && (
            <div style={styles.reportContainer}>
              <div style={styles.reportTitle}>Trial Balance Report</div>
              <div style={styles.reportSubtitle}>
                Period: {reportData.reportPeriod.fromDate} to {reportData.reportPeriod.toDate}
              </div>

              <div style={styles.tableContainer}>
                {reportData.accounts.map((group, groupIdx) => (
                  <div key={groupIdx}>
                    {filterData.groupByType && (
                      <div style={styles.groupHeader}>{group.type}</div>
                    )}

                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Code</th>
                          <th style={styles.th}>Account Name</th>
                          <th style={styles.thRight}>Debit</th>
                          <th style={styles.thRight}>Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.accounts.map((account, idx) => (
                          <tr key={idx}>
                            <td style={styles.td}>{account.accountCode}</td>
                            <td style={styles.td}>{account.accountName}</td>
                            <td style={styles.tdRight}>
                              {account.debit > 0 ? account.debit.toLocaleString() : '-'}
                            </td>
                            <td style={styles.tdRight}>
                              {account.credit > 0 ? account.credit.toLocaleString() : '-'}
                            </td>
                          </tr>
                        ))}

                        {filterData.groupByType && (
                          <tr style={{backgroundColor: '#f0f0f0'}}>
                            <td colSpan="2" style={{...styles.td, fontWeight: 'bold'}}>
                              {group.type} Subtotal:
                            </td>
                            <td style={{...styles.tdRight, fontWeight: 'bold'}}>
                              {group.subtotalDebit.toLocaleString()}
                            </td>
                            <td style={{...styles.tdRight, fontWeight: 'bold'}}>
                              {group.subtotalCredit.toLocaleString()}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ))}

                {/* Grand Total */}
                <table style={styles.table}>
                  <tbody>
                    <tr style={styles.totalRow}>
                      <td colSpan="2" style={{...styles.td, fontWeight: 'bold', fontSize: 'clamp(10px, 1.3vw, 12px)'}}>
                        GRAND TOTAL:
                      </td>
                      <td style={{...styles.tdRight, fontWeight: 'bold', fontSize: 'clamp(10px, 1.3vw, 12px)'}}>
                        {reportData.totals.totalDebit.toLocaleString()}
                      </td>
                      <td style={{...styles.tdRight, fontWeight: 'bold', fontSize: 'clamp(10px, 1.3vw, 12px)'}}>
                        {reportData.totals.totalCredit.toLocaleString()}
                      </td>
                    </tr>

                    <tr style={isBalanced ? styles.balanceRow : styles.unbalancedRow}>
                      <td colSpan="2" style={{...styles.td, fontWeight: 'bold', fontSize: 'clamp(10px, 1.3vw, 12px)'}}>
                        {isBalanced ? 'BALANCED ✓' : 'UNBALANCED ⚠'}
                      </td>
                      <td colSpan="2" style={{...styles.tdRight, fontWeight: 'bold', fontSize: 'clamp(10px, 1.3vw, 12px)'}}>
                        {isBalanced
                          ? 'Trial Balance is Balanced'
                          : `Difference: ${reportData.totals.difference.toLocaleString()}`
                        }
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div style={styles.actionBar}>
          <button style={styles.actionBtn} onClick={handleRefresh}>🔄 Refresh</button>
          <button style={styles.actionBtn} onClick={handleShow} disabled={loading}>
            📊 {loading ? 'Loading...' : 'Generate Report'}
          </button>
          <button style={styles.actionBtn} onClick={handlePrint}>🖨️ Print</button>
          <button style={styles.actionBtn} onClick={handleExport}>📥 Export to Excel</button>

          {showReport && (
            <div style={{
              ...styles.statusBox,
              backgroundColor: isBalanced ? '#d4edda' : '#f8d7da',
              color: isBalanced ? '#155724' : '#721c24'
            }}>
              {isBalanced ? '✓ Balanced' : '⚠ Not Balanced'}
            </div>
          )}

          <button style={{...styles.actionBtn, marginLeft: showReport ? '10px' : 'auto', backgroundColor: '#d32f2f'}}>
            ❌ Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrialBalance;
