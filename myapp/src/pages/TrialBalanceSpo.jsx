import React, { useState } from 'react';

const TrialBalanceSpo = () => {
  const [filters, setFilters] = useState({
    date: '2024-03-31',
    period: 'monthly',
    level: 'all',
    includeZeroBalance: false
  });

  const [trialBalanceData, setTrialBalanceData] = useState({
    assets: [
      { code: '1001', name: 'Cash in Hand', debit: 150000, credit: 0, balance: 150000 },
      { code: '1002', name: 'Bank Account', debit: 500000, credit: 0, balance: 500000 },
      { code: '1003', name: 'Accounts Receivable', debit: 250000, credit: 0, balance: 250000 },
      { code: '1004', name: 'Inventory', debit: 380000, credit: 0, balance: 380000 },
      { code: '1005', name: 'Prepaid Expenses', debit: 45000, credit: 0, balance: 45000 },
      { code: '1006', name: 'Fixed Assets', debit: 800000, credit: 0, balance: 800000 },
    ],
    liabilities: [
      { code: '2001', name: 'Accounts Payable', debit: 0, credit: 180000, balance: -180000 },
      { code: '2002', name: 'Loans Payable', debit: 0, credit: 300000, balance: -300000 },
      { code: '2003', name: 'Accrued Expenses', debit: 0, credit: 75000, balance: -75000 },
      { code: '2004', name: 'Tax Payable', debit: 0, credit: 45000, balance: -45000 },
    ],
    equity: [
      { code: '3001', name: 'Owner\'s Capital', debit: 0, credit: 1000000, balance: -1000000 },
      { code: '3002', name: 'Retained Earnings', debit: 0, credit: 275000, balance: -275000 },
      { code: '3003', name: 'Current Year Profit', debit: 0, credit: 590000, balance: -590000 },
    ],
    income: [
      { code: '4001', name: 'Sales Revenue', debit: 0, credit: 2500000, balance: -2500000 },
      { code: '4002', name: 'Service Income', debit: 0, credit: 350000, balance: -350000 },
      { code: '4003', name: 'Other Income', debit: 0, credit: 75000, balance: -75000 },
    ],
    expenses: [
      { code: '5001', name: 'Cost of Goods Sold', debit: 1270000, credit: 0, balance: 1270000 },
      { code: '5002', name: 'Salaries Expense', debit: 450000, credit: 0, balance: 450000 },
      { code: '5003', name: 'Rent Expense', debit: 180000, credit: 0, balance: 180000 },
      { code: '5004', name: 'Utilities Expense', debit: 75000, credit: 0, balance: 75000 },
      { code: '5005', name: 'Marketing Expense', debit: 120000, credit: 0, balance: 120000 },
      { code: '5006', name: 'Supplies Expense', debit: 45000, credit: 0, balance: 45000 },
      { code: '5007', name: 'Depreciation Expense', debit: 60000, credit: 0, balance: 60000 },
      { code: '5008', name: 'Other Expenses', debit: 30000, credit: 0, balance: 30000 },
    ]
  });

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    alert('Exporting Trial Balance...');
  };

  const handleRefresh = () => {
    setFilters({
      date: '2024-03-31',
      period: 'monthly',
      level: 'all',
      includeZeroBalance: false
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Calculate totals
  const calculateSectionTotal = (section) => {
    return section.reduce((sum, account) => sum + account.balance, 0);
  };

  const totalDebit = Object.values(trialBalanceData).flat().reduce((sum, account) => sum + account.debit, 0);
  const totalCredit = Object.values(trialBalanceData).flat().reduce((sum, account) => sum + account.credit, 0);
  const totalBalance = Object.values(trialBalanceData).flat().reduce((sum, account) => sum + account.balance, 0);

  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const styles = {
    container: {
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      padding: '0',
      margin: '0'
    },
    header: {
      backgroundColor: 'white',
      padding: '24px',
      borderBottom: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    headerContent: {
      maxWidth: '1400px',
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#1e293b',
      margin: 0
    },
    subtitle: {
      fontSize: '16px',
      color: '#64748b',
      margin: '4px 0 0 0'
    },
    mainContent: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '24px'
    },
    summaryCards: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '24px'
    },
    summaryCard: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      textAlign: 'center'
    },
    balancedCard: {
      backgroundColor: '#f0fdf4',
      border: '1px solid #bbf7d0'
    },
    unbalancedCard: {
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca'
    },
    summaryValue: {
      fontSize: '24px',
      fontWeight: 'bold',
      margin: '12px 0',
      color: '#1e293b'
    },
    positiveValue: {
      color: '#059669'
    },
    negativeValue: {
      color: '#dc2626'
    },
    summaryLabel: {
      fontSize: '14px',
      color: '#64748b',
      fontWeight: '600'
    },
    actionBar: {
      display: 'flex',
      gap: '12px',
      marginBottom: '24px',
      flexWrap: 'wrap'
    },
    button: {
      padding: '12px 20px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
      minWidth: '140px',
      justifyContent: 'center'
    },
    primaryButton: {
      backgroundColor: '#3b82f6',
      color: 'white'
    },
    secondaryButton: {
      backgroundColor: '#6b7280',
      color: 'white'
    },
    successButton: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    filterSection: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '24px'
    },
    filterGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      alignItems: 'end'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    },
    checkboxGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    label: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151'
    },
    input: {
      padding: '10px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: 'white'
    },
    select: {
      padding: '10px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: 'white'
    },
    checkbox: {
      width: '16px',
      height: '16px'
    },
    reportContainer: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      marginBottom: '24px'
    },
    reportHeader: {
      backgroundColor: '#1e293b',
      color: 'white',
      padding: '20px',
      textAlign: 'center'
    },
    reportTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      margin: '0 0 8px 0'
    },
    reportSubtitle: {
      fontSize: '14px',
      opacity: '0.8',
      margin: 0
    },
    tableContainer: {
      overflowX: 'auto'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '14px',
      minWidth: '1000px'
    },
    th: {
      backgroundColor: '#f8fafc',
      padding: '16px 12px',
      textAlign: 'left',
      fontWeight: '600',
      color: '#374151',
      borderBottom: '1px solid #e2e8f0',
      whiteSpace: 'nowrap'
    },
    td: {
      padding: '12px 12px',
      borderBottom: '1px solid #e2e8f0',
      color: '#4b5563'
    },
    accountCode: {
      fontWeight: '600',
      color: '#374151',
      minWidth: '80px'
    },
    accountName: {
      minWidth: '200px'
    },
    amountCell: {
      textAlign: 'right',
      fontWeight: '500',
      minWidth: '120px',
      fontFamily: "'Courier New', monospace"
    },
    debitAmount: {
      color: '#059669'
    },
    creditAmount: {
      color: '#dc2626'
    },
    balanceAmount: {
      color: '#1e293b',
      fontWeight: '600'
    },
    sectionHeader: {
      backgroundColor: '#e2e8f0',
      fontWeight: 'bold',
      color: '#1e293b',
      fontSize: '15px'
    },
    sectionTotal: {
      backgroundColor: '#f8fafc',
      fontWeight: 'bold',
      color: '#1e293b',
      borderTop: '2px solid #e2e8f0'
    },
    grandTotal: {
      backgroundColor: '#1e293b',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '15px'
    },
    balancedStatus: {
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      display: 'inline-block',
      marginLeft: '12px'
    },
    balanced: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    unbalanced: {
      backgroundColor: '#ef4444',
      color: 'white'
    },
    footer: {
      backgroundColor: '#1e293b',
      color: 'white',
      padding: '20px',
      textAlign: 'center',
      fontSize: '12px'
    }
  };

  const renderSection = (title, accounts, sectionKey) => {
    const sectionTotal = calculateSectionTotal(accounts);
    
    return (
      <>
        <tr style={styles.sectionHeader}>
          <td style={{...styles.td, ...styles.accountCode}} colSpan="2">
            {title.toUpperCase()}
          </td>
          <td style={styles.td}></td>
          <td style={styles.td}></td>
          <td style={styles.td}></td>
        </tr>
        
        {accounts.map((account, index) => (
          <tr key={account.code} style={styles.statementRow}>
            <td style={{...styles.td, ...styles.accountCode}}>{account.code}</td>
            <td style={{...styles.td, ...styles.accountName}}>{account.name}</td>
            <td style={{...styles.td, ...styles.amountCell, ...styles.debitAmount}}>
              {account.debit > 0 ? `PKR ${formatCurrency(account.debit)}` : '-'}
            </td>
            <td style={{...styles.td, ...styles.amountCell, ...styles.creditAmount}}>
              {account.credit > 0 ? `PKR ${formatCurrency(account.credit)}` : '-'}
            </td>
            <td style={{...styles.td, ...styles.amountCell, ...styles.balanceAmount}}>
              {account.balance !== 0 ? 
                `PKR ${formatCurrency(Math.abs(account.balance))} ${account.balance > 0 ? 'Dr' : 'Cr'}` 
                : '-'
              }
            </td>
          </tr>
        ))}
        
        <tr style={styles.sectionTotal}>
          <td style={{...styles.td, ...styles.accountCode}} colSpan="2">
            Total {title}
          </td>
          <td style={{...styles.td, ...styles.amountCell, ...styles.debitAmount}}>
            PKR {formatCurrency(accounts.reduce((sum, acc) => sum + acc.debit, 0))}
          </td>
          <td style={{...styles.td, ...styles.amountCell, ...styles.creditAmount}}>
            PKR {formatCurrency(accounts.reduce((sum, acc) => sum + acc.credit, 0))}
          </td>
          <td style={{...styles.td, ...styles.amountCell, ...styles.balanceAmount}}>
            PKR {formatCurrency(Math.abs(sectionTotal))} {sectionTotal > 0 ? 'Dr' : 'Cr'}
          </td>
        </tr>
      </>
    );
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>Trial Balance</h1>
            <p style={styles.subtitle}>Account balances and verification</p>
          </div>
        </div>
      </div>

      <div style={styles.mainContent}>
        {/* Summary Cards */}
        <div style={styles.summaryCards}>
          <div style={{
            ...styles.summaryCard,
            ...(isBalanced ? styles.balancedCard : styles.unbalancedCard)
          }}>
            <div style={styles.summaryLabel}>Trial Balance Status</div>
            <div style={{
              ...styles.summaryValue,
              ...(isBalanced ? styles.positiveValue : styles.negativeValue)
            }}>
              {isBalanced ? 'BALANCED' : 'UNBALANCED'}
            </div>
            <div style={styles.summaryLabel}>
              Debits {isBalanced ? '=' : '≠'} Credits
            </div>
          </div>
          
          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Total Debits</div>
            <div style={styles.summaryValue}>
              PKR {formatCurrency(totalDebit)}
            </div>
            <div style={styles.summaryLabel}>All Debit Accounts</div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Total Credits</div>
            <div style={styles.summaryValue}>
              PKR {formatCurrency(totalCredit)}
            </div>
            <div style={styles.summaryLabel}>All Credit Accounts</div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Difference</div>
            <div style={{
              ...styles.summaryValue,
              ...(Math.abs(totalDebit - totalCredit) === 0 ? styles.positiveValue : styles.negativeValue)
            }}>
              PKR {formatCurrency(Math.abs(totalDebit - totalCredit))}
            </div>
            <div style={styles.summaryLabel}>
              {totalDebit > totalCredit ? 'Debit > Credit' : 'Credit > Debit'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={styles.actionBar}>
          <button style={{...styles.button, ...styles.primaryButton}} onClick={handlePrint}>
            🖨️ Print Report
          </button>
          <button style={{...styles.button, ...styles.successButton}} onClick={handleExport}>
            📊 Export Data
          </button>
          <button style={{...styles.button, ...styles.secondaryButton}} onClick={handleRefresh}>
            🔄 Refresh
          </button>
        </div>

        {/* Filters */}
        <div style={styles.filterSection}>
          <div style={styles.filterGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>As of Date</label>
              <input
                type="date"
                name="date"
                value={filters.date}
                onChange={handleFilterChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Period</label>
              <select
                name="period"
                value={filters.period}
                onChange={handleFilterChange}
                style={styles.select}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Account Level</label>
              <select
                name="level"
                value={filters.level}
                onChange={handleFilterChange}
                style={styles.select}
              >
                <option value="all">All Levels</option>
                <option value="main">Main Accounts</option>
                <option value="sub">Sub Accounts</option>
                <option value="detail">Detail Accounts</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <div style={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  name="includeZeroBalance"
                  checked={filters.includeZeroBalance}
                  onChange={handleFilterChange}
                  style={styles.checkbox}
                />
                <label style={styles.label}>Include Zero Balance Accounts</label>
              </div>
            </div>
          </div>
        </div>

        {/* Trial Balance Report */}
        <div style={styles.reportContainer}>
          <div style={styles.reportHeader}>
            <h2 style={styles.reportTitle}>TRIAL BALANCE</h2>
            <p style={styles.reportSubtitle}>
              As of {filters.date} | {filters.period.charAt(0).toUpperCase() + filters.period.slice(1)} Period
              <span style={{
                ...styles.balancedStatus,
                ...(isBalanced ? styles.balanced : styles.unbalanced)
              }}>
                {isBalanced ? 'BALANCED' : 'UNBALANCED'}
              </span>
            </p>
          </div>

          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Account Code</th>
                  <th style={styles.th}>Account Name</th>
                  <th style={{...styles.th, textAlign: 'right'}}>Debit (PKR)</th>
                  <th style={{...styles.th, textAlign: 'right'}}>Credit (PKR)</th>
                  <th style={{...styles.th, textAlign: 'right'}}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {/* Assets */}
                {renderSection('Assets', trialBalanceData.assets, 'assets')}
                
                {/* Liabilities */}
                {renderSection('Liabilities', trialBalanceData.liabilities, 'liabilities')}
                
                {/* Equity */}
                {renderSection('Equity', trialBalanceData.equity, 'equity')}
                
                {/* Income */}
                {renderSection('Income', trialBalanceData.income, 'income')}
                
                {/* Expenses */}
                {renderSection('Expenses', trialBalanceData.expenses, 'expenses')}
                
                {/* Grand Total */}
                <tr style={styles.grandTotal}>
                  <td style={{...styles.td, ...styles.accountCode}} colSpan="2">
                    GRAND TOTAL
                  </td>
                  <td style={{...styles.td, ...styles.amountCell}}>
                    PKR {formatCurrency(totalDebit)}
                  </td>
                  <td style={{...styles.td, ...styles.amountCell}}>
                    PKR {formatCurrency(totalCredit)}
                  </td>
                  <td style={{...styles.td, ...styles.amountCell}}>
                    PKR {formatCurrency(Math.abs(totalBalance))} {totalBalance > 0 ? 'Dr' : 'Cr'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary Information */}
          <div style={{
            padding: '20px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px'
            }}>
              <div>
                <h4 style={{color: '#374151', margin: '0 0 8px 0'}}>Accounting Equation</h4>
                <p style={{color: '#64748b', fontSize: '14px', margin: 0}}>
                  Assets = Liabilities + Equity<br />
                  PKR {formatCurrency(calculateSectionTotal(trialBalanceData.assets))} = 
                  PKR {formatCurrency(Math.abs(calculateSectionTotal(trialBalanceData.liabilities)))} + 
                  PKR {formatCurrency(Math.abs(calculateSectionTotal(trialBalanceData.equity)))}
                </p>
              </div>
              <div>
                <h4 style={{color: '#374151', margin: '0 0 8px 0'}}>Net Income</h4>
                <p style={{color: '#64748b', fontSize: '14px', margin: 0}}>
                  Income - Expenses<br />
                  PKR {formatCurrency(Math.abs(calculateSectionTotal(trialBalanceData.income)))} - 
                  PKR {formatCurrency(calculateSectionTotal(trialBalanceData.expenses))} = 
                  PKR {formatCurrency(Math.abs(calculateSectionTotal(trialBalanceData.income) - calculateSectionTotal(trialBalanceData.expenses)))}
                </p>
              </div>
              <div>
                <h4 style={{color: '#374151', margin: '0 0 8px 0'}}>Verification</h4>
                <p style={{color: '#64748b', fontSize: '14px', margin: 0}}>
                  Total Debits: PKR {formatCurrency(totalDebit)}<br />
                  Total Credits: PKR {formatCurrency(totalCredit)}<br />
                  Difference: PKR {formatCurrency(Math.abs(totalDebit - totalCredit))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <div>Generated on {new Date().toLocaleDateString()} | POS Accounting System v2.0</div>
          <div style={{marginTop: '8px', opacity: '0.8'}}>
            This trial balance is computer generated for verification purposes
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialBalanceSpo;