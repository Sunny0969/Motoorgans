import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ProfitLossAccount = () => {
  const navigate = useNavigate();
  
  const [filterData, setFilterData] = useState({
    fromDate: '29-Mar-22',
    toDate: '29-Mar-22'
  });

  const [showReport, setShowReport] = useState(false);
  const [profitLossData, setProfitLossData] = useState({
    revenue: [],
    expenses: [],
    totalRevenue: 0,
    totalExpenses: 0,
    netProfitLoss: 0
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleShow = () => {
    // Sample Profit & Loss data
    const sampleData = {
      revenue: [
        { account: 'Sales Revenue', amount: 150000 },
        { account: 'Service Income', amount: 45000 },
        { account: 'Other Income', amount: 5000 }
      ],
      expenses: [
        { account: 'Cost of Goods Sold', amount: 80000 },
        { account: 'Salaries & Wages', amount: 35000 },
        { account: 'Rent Expense', amount: 15000 },
        { account: 'Utilities', amount: 5000 },
        { account: 'Miscellaneous Expenses', amount: 3000 }
      ]
    };

    const totalRev = sampleData.revenue.reduce((sum, item) => sum + item.amount, 0);
    const totalExp = sampleData.expenses.reduce((sum, item) => sum + item.amount, 0);
    const netProfit = totalRev - totalExp;

    setProfitLossData({
      ...sampleData,
      totalRevenue: totalRev,
      totalExpenses: totalExp,
      netProfitLoss: netProfit
    });

    setShowReport(true);
  };

  const handlePrintPreview = () => {
    if (!showReport) {
      alert('Please click Show first to generate the report');
      return;
    }
    window.print();
  };

  const handleClose = () => {
    // Navigate back to home/dashboard or previous page
    navigate(-1); // Goes back to previous page
    // OR
    // navigate('/dashboard'); // Goes to specific route
  };

  const handleMinimize = () => {
    // Minimize functionality
    console.log('Minimize clicked');
  };

  const handleMaximize = () => {
    // Maximize/Restore functionality
    console.log('Maximize clicked');
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
    window: {
      backgroundColor: 'white',
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box'
    },
    titleBar: {
      backgroundColor: '#f0f0f0',
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid #ccc'
    },
    titleLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: 'clamp(12px, 1.5vw, 14px)'
    },
    icon: {
      fontSize: '16px'
    },
    windowControls: {
      display: 'flex',
      gap: '5px'
    },
    controlBtn: {
      width: '25px',
      height: '25px',
      border: '1px solid #999',
      backgroundColor: '#f0f0f0',
      cursor: 'pointer',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.2s'
    },
    filterSection: {
      padding: '15px',
      backgroundColor: 'white',
      borderBottom: '2px solid #000',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px',
      alignItems: 'flex-end',
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
    select: {
      padding: '5px 8px',
      border: '1px solid #999',
      fontSize: 'clamp(10px, 1.3vw, 12px)',
      backgroundColor: 'white',
      boxSizing: 'border-box',
      minWidth: '120px'
    },
    btn: {
      padding: '6px 16px',
      border: '1px solid #999',
      backgroundColor: '#e0e0e0',
      cursor: 'pointer',
      fontSize: 'clamp(10px, 1.3vw, 12px)',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      whiteSpace: 'nowrap',
      boxSizing: 'border-box',
      borderRadius: '3px',
      transition: 'background-color 0.2s'
    },
    closeBtn: {
      padding: '6px 16px',
      border: '1px solid #999',
      backgroundColor: '#e0e0e0',
      cursor: 'pointer',
      fontSize: 'clamp(10px, 1.3vw, 12px)',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      whiteSpace: 'nowrap',
      boxSizing: 'border-box',
      borderRadius: '3px',
      marginLeft: 'auto'
    },
    contentArea: {
      flex: '1',
      padding: '20px',
      backgroundColor: '#f5f5f5',
      overflow: 'auto',
      boxSizing: 'border-box'
    },
    reportContainer: {
      backgroundColor: 'white',
      padding: '20px',
      maxWidth: '900px',
      margin: '0 auto',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    reportTitle: {
      textAlign: 'center',
      fontSize: 'clamp(16px, 2vw, 20px)',
      fontWeight: 'bold',
      marginBottom: '10px',
      color: '#333'
    },
    reportSubtitle: {
      textAlign: 'center',
      fontSize: 'clamp(11px, 1.3vw, 13px)',
      marginBottom: '20px',
      color: '#666'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '15px'
    },
    th: {
      backgroundColor: '#e0e0e0',
      border: '1px solid #999',
      padding: '8px',
      textAlign: 'left',
      fontWeight: 'bold',
      fontSize: 'clamp(10px, 1.3vw, 12px)'
    },
    td: {
      border: '1px solid #ccc',
      padding: '8px',
      fontSize: 'clamp(10px, 1.3vw, 12px)'
    },
    tdRight: {
      border: '1px solid #ccc',
      padding: '8px',
      textAlign: 'right',
      fontSize: 'clamp(10px, 1.3vw, 12px)'
    },
    sectionTitle: {
      backgroundColor: '#d0d0d0',
      border: '1px solid #999',
      padding: '8px',
      fontWeight: 'bold',
      fontSize: 'clamp(10px, 1.3vw, 12px)'
    },
    totalRow: {
      backgroundColor: '#e8e8e8',
      fontWeight: 'bold'
    },
    footer: {
      backgroundColor: '#4a4a4a',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      borderTop: '2px solid #333',
      boxSizing: 'border-box'
    },
    footerLabel: {
      fontSize: 'clamp(13px, 1.5vw, 16px)',
      fontWeight: 'bold',
      color: '#ff6b35',
      whiteSpace: 'nowrap'
    },
    footerInput: {
      padding: '6px 10px',
      border: '1px solid #999',
      fontSize: 'clamp(12px, 1.4vw, 14px)',
      backgroundColor: 'white',
      width: '180px',
      fontWeight: 'bold',
      textAlign: 'right',
      boxSizing: 'border-box'
    },
    emptyState: {
      textAlign: 'center',
      padding: '50px 20px',
      color: '#999',
      fontSize: 'clamp(12px, 1.5vw, 14px)'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.window}>
        {/* Title Bar */}
        <div style={styles.titleBar}>
          <div style={styles.titleLeft}>
            <span style={styles.icon}>📄</span>
            <span>Profit & Loss</span>
          </div>
          <div style={styles.windowControls}>
            <button 
              style={styles.controlBtn}
              onClick={handleMinimize}
              onMouseOver={(e) => e.target.style.backgroundColor = '#ddd'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#f0f0f0'}
            >
              −
            </button>
            <button 
              style={styles.controlBtn}
              onClick={handleMaximize}
              onMouseOver={(e) => e.target.style.backgroundColor = '#ddd'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#f0f0f0'}
            >
              □
            </button>
            <button 
              style={styles.controlBtn}
              onClick={handleClose}
              onMouseOver={(e) => e.target.style.backgroundColor = '#f44336'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#f0f0f0'}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <div style={styles.filterSection}>
          <div style={styles.formGroup}>
            <label style={styles.label}>From</label>
            <select 
              name="fromDate"
              value={filterData.fromDate}
              onChange={handleFilterChange}
              style={styles.select}
            >
              <option value="29-Mar-22">29-Mar-22</option>
              <option value="01-Mar-22">01-Mar-22</option>
              <option value="01-Jan-22">01-Jan-22</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>To</label>
            <select 
              name="toDate"
              value={filterData.toDate}
              onChange={handleFilterChange}
              style={styles.select}
            >
              <option value="29-Mar-22">29-Mar-22</option>
              <option value="31-Mar-22">31-Mar-22</option>
              <option value="31-Dec-22">31-Dec-22</option>
            </select>
          </div>

          <button 
            style={styles.btn} 
            onClick={handleShow}
            onMouseOver={(e) => e.target.style.backgroundColor = '#d0d0d0'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#e0e0e0'}
          >
            <span>🔍</span> Show
          </button>

          <button 
            style={styles.btn} 
            onClick={handlePrintPreview}
            onMouseOver={(e) => e.target.style.backgroundColor = '#d0d0d0'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#e0e0e0'}
          >
            <span>🖨️</span> Print Preview
          </button>

          <button 
            style={styles.closeBtn} 
            onClick={handleClose}
            onMouseOver={(e) => e.target.style.backgroundColor = '#d0d0d0'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#e0e0e0'}
          >
            <span>❌</span> Close
          </button>
        </div>

        {/* Content Area */}
        <div style={styles.contentArea}>
          {!showReport ? (
            <div style={styles.emptyState}>
              Click "Show" to generate Profit & Loss report
            </div>
          ) : (
            <div style={styles.reportContainer}>
              <div style={styles.reportTitle}>Profit & Loss Statement</div>
              <div style={styles.reportSubtitle}>
                Period: {filterData.fromDate} to {filterData.toDate}
              </div>

              <table style={styles.table}>
                <tbody>
                  {/* Revenue Section */}
                  <tr>
                    <td style={styles.sectionTitle} colSpan="2">REVENUE</td>
                  </tr>
                  {profitLossData.revenue.map((item, index) => (
                    <tr key={index}>
                      <td style={styles.td}>{item.account}</td>
                      <td style={styles.tdRight}>{item.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr style={styles.totalRow}>
                    <td style={styles.td}>Total Revenue</td>
                    <td style={styles.tdRight}>{profitLossData.totalRevenue.toLocaleString()}</td>
                  </tr>

                  {/* Expenses Section */}
                  <tr>
                    <td style={styles.sectionTitle} colSpan="2">EXPENSES</td>
                  </tr>
                  {profitLossData.expenses.map((item, index) => (
                    <tr key={index}>
                      <td style={styles.td}>{item.account}</td>
                      <td style={styles.tdRight}>{item.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr style={styles.totalRow}>
                    <td style={styles.td}>Total Expenses</td>
                    <td style={styles.tdRight}>{profitLossData.totalExpenses.toLocaleString()}</td>
                  </tr>

                  {/* Net Profit/Loss */}
                  <tr style={{...styles.totalRow, backgroundColor: profitLossData.netProfitLoss >= 0 ? '#d4edda' : '#f8d7da'}}>
                    <td style={{...styles.td, fontWeight: 'bold', fontSize: 'clamp(11px, 1.4vw, 13px)'}}>
                      {profitLossData.netProfitLoss >= 0 ? 'NET PROFIT' : 'NET LOSS'}
                    </td>
                    <td style={{...styles.tdRight, fontWeight: 'bold', fontSize: 'clamp(11px, 1.4vw, 13px)'}}>
                      {Math.abs(profitLossData.netProfitLoss).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <label style={styles.footerLabel}>Total Profit/Loss:</label>
          <input 
            type="text" 
            value={showReport ? profitLossData.netProfitLoss.toLocaleString() : '0'}
            style={styles.footerInput}
            readOnly
          />
        </div>
      </div>
    </div>
  );
};

export default ProfitLossAccount;