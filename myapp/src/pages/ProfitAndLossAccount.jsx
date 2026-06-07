import React, { useState } from 'react';

const ProfitAndLossAccount = () => {
  const [filters, setFilters] = useState({
    period: 'monthly',
    dateFrom: '2024-01-01',
    dateTo: '2024-03-31',
    comparison: 'none'
  });

  const [profitLossData, setProfitLossData] = useState({
    revenue: {
      sales: 2500000,
      serviceIncome: 350000,
      otherIncome: 75000,
      totalRevenue: 2925000
    },
    costOfGoodsSold: {
      openingInventory: 450000,
      purchases: 1200000,
      closingInventory: 380000,
      totalCOGS: 1270000
    },
    operatingExpenses: {
      salaries: 450000,
      rent: 180000,
      utilities: 75000,
      marketing: 120000,
      supplies: 45000,
      depreciation: 60000,
      otherExpenses: 30000,
      totalOperatingExpenses: 960000
    },
    otherIncomeExpenses: {
      interestIncome: 15000,
      interestExpense: 25000,
      netOtherIncome: -10000
    }
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    alert('Exporting Profit & Loss Statement...');
  };

  const handleRefresh = () => {
    alert('Refreshing data...');
  };

  // Calculations
  const grossProfit = profitLossData.revenue.totalRevenue - profitLossData.costOfGoodsSold.totalCOGS;
  const operatingProfit = grossProfit - profitLossData.operatingExpenses.totalOperatingExpenses;
  const netProfitBeforeTax = operatingProfit + profitLossData.otherIncomeExpenses.netOtherIncome;
  const taxExpense = netProfitBeforeTax * 0.25; // Assuming 25% tax rate
  const netProfitAfterTax = netProfitBeforeTax - taxExpense;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getPercentage = (part, whole) => {
    return whole !== 0 ? ((part / whole) * 100).toFixed(1) : '0.0';
  };

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
      maxWidth: '1200px',
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
      maxWidth: '1200px',
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
    positiveCard: {
      backgroundColor: '#f0fdf4',
      border: '1px solid #bbf7d0'
    },
    negativeCard: {
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
    statementSection: {
      padding: '0'
    },
    statementTable: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    sectionHeader: {
      backgroundColor: '#f8fafc',
      padding: '16px 20px',
      borderBottom: '1px solid #e2e8f0',
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#1e293b'
    },
    statementRow: {
      borderBottom: '1px solid #f1f5f9'
    },
    statementCell: {
      padding: '12px 20px',
      fontSize: '14px'
    },
    statementLabel: {
      color: '#374151',
      paddingLeft: '40px'
    },
    statementAmount: {
      color: '#374151',
      textAlign: 'right',
      fontWeight: '500',
      minWidth: '150px'
    },
    statementTotal: {
      backgroundColor: '#f8fafc',
      fontWeight: 'bold',
      color: '#1e293b'
    },
    statementSubtotal: {
      backgroundColor: '#f8fafc',
      fontWeight: '600',
      color: '#374151'
    },
    positiveAmount: {
      color: '#059669',
      fontWeight: '600'
    },
    negativeAmount: {
      color: '#dc2626',
      fontWeight: '600'
    },
    percentageColumn: {
      color: '#64748b',
      fontSize: '12px',
      textAlign: 'center',
      minWidth: '80px'
    },
    metricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      padding: '20px',
      backgroundColor: '#f8fafc',
      borderTop: '1px solid #e2e8f0'
    },
    metricCard: {
      textAlign: 'center',
      padding: '16px'
    },
    metricValue: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#1e293b',
      margin: '8px 0'
    },
    metricLabel: {
      fontSize: '12px',
      color: '#64748b',
      fontWeight: '500'
    },
    footer: {
      backgroundColor: '#1e293b',
      color: 'white',
      padding: '20px',
      textAlign: 'center',
      fontSize: '12px'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>Profit & Loss Statement</h1>
            <p style={styles.subtitle}>Financial performance overview</p>
          </div>
        </div>
      </div>

      <div style={styles.mainContent}>
        {/* Summary Cards */}
        <div style={styles.summaryCards}>
          <div style={{
            ...styles.summaryCard,
            ...(netProfitAfterTax >= 0 ? styles.positiveCard : styles.negativeCard)
          }}>
            <div style={styles.summaryLabel}>Net Profit/Loss</div>
            <div style={{
              ...styles.summaryValue,
              ...(netProfitAfterTax >= 0 ? styles.positiveValue : styles.negativeValue)
            }}>
              PKR {formatCurrency(Math.abs(netProfitAfterTax))}
              {netProfitAfterTax >= 0 ? '' : ' (Loss)'}
            </div>
            <div style={styles.summaryLabel}>
              {netProfitAfterTax >= 0 ? 'Profit' : 'Loss'} for the period
            </div>
          </div>
          
          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Gross Profit</div>
            <div style={{...styles.summaryValue, ...styles.positiveValue}}>
              PKR {formatCurrency(grossProfit)}
            </div>
            <div style={styles.summaryLabel}>
              {getPercentage(grossProfit, profitLossData.revenue.totalRevenue)}% of Revenue
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Operating Profit</div>
            <div style={{...styles.summaryValue, ...styles.positiveValue}}>
              PKR {formatCurrency(operatingProfit)}
            </div>
            <div style={styles.summaryLabel}>
              {getPercentage(operatingProfit, profitLossData.revenue.totalRevenue)}% of Revenue
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Total Revenue</div>
            <div style={styles.summaryValue}>
              PKR {formatCurrency(profitLossData.revenue.totalRevenue)}
            </div>
            <div style={styles.summaryLabel}>Sales & Income</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={styles.actionBar}>
          <button style={{...styles.button, ...styles.primaryButton}} onClick={handlePrint}>
            🖨️ Print Statement
          </button>
          <button style={{...styles.button, ...styles.successButton}} onClick={handleExport}>
            📊 Export Report
          </button>
          <button style={{...styles.button, ...styles.secondaryButton}} onClick={handleRefresh}>
            🔄 Refresh Data
          </button>
        </div>

        {/* Filters */}
        <div style={styles.filterSection}>
          <div style={styles.filterGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Report Period</label>
              <select
                name="period"
                value={filters.period}
                onChange={handleFilterChange}
                style={styles.select}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Date From</label>
              <input
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Date To</label>
              <input
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleFilterChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Comparison</label>
              <select
                name="comparison"
                value={filters.comparison}
                onChange={handleFilterChange}
                style={styles.select}
              >
                <option value="none">No Comparison</option>
                <option value="previous">Previous Period</option>
                <option value="budget">Budget</option>
                <option value="lastYear">Last Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Profit & Loss Statement */}
        <div style={styles.reportContainer}>
          <div style={styles.reportHeader}>
            <h2 style={styles.reportTitle}>PROFIT & LOSS STATEMENT</h2>
            <p style={styles.reportSubtitle}>
              For the period from {filters.dateFrom} to {filters.dateTo}
            </p>
          </div>

          <div style={styles.statementSection}>
            {/* Revenue Section */}
            <div style={styles.sectionHeader}>REVENUE</div>
            <table style={styles.statementTable}>
              <tbody>
                <tr style={styles.statementRow}>
                  <td style={{...styles.statementCell, ...styles.statementLabel}}>Sales Revenue</td>
                  <td style={{...styles.statementCell, ...styles.statementAmount}}>
                    PKR {formatCurrency(profitLossData.revenue.sales)}
                  </td>
                  <td style={{...styles.statementCell, ...styles.percentageColumn}}>
                    {getPercentage(profitLossData.revenue.sales, profitLossData.revenue.totalRevenue)}%
                  </td>
                </tr>
                <tr style={styles.statementRow}>
                  <td style={{...styles.statementCell, ...styles.statementLabel}}>Service Income</td>
                  <td style={{...styles.statementCell, ...styles.statementAmount}}>
                    PKR {formatCurrency(profitLossData.revenue.serviceIncome)}
                  </td>
                  <td style={{...styles.statementCell, ...styles.percentageColumn}}>
                    {getPercentage(profitLossData.revenue.serviceIncome, profitLossData.revenue.totalRevenue)}%
                  </td>
                </tr>
                <tr style={styles.statementRow}>
                  <td style={{...styles.statementCell, ...styles.statementLabel}}>Other Income</td>
                  <td style={{...styles.statementCell, ...styles.statementAmount}}>
                    PKR {formatCurrency(profitLossData.revenue.otherIncome)}
                  </td>
                  <td style={{...styles.statementCell, ...styles.percentageColumn}}>
                    {getPercentage(profitLossData.revenue.otherIncome, profitLossData.revenue.totalRevenue)}%
                  </td>
                </tr>
                <tr style={{...styles.statementRow, ...styles.statementSubtotal}}>
                  <td style={{...styles.statementCell, ...styles.statementLabel}}>
                    <strong>Total Revenue</strong>
                  </td>
                  <td style={{...styles.statementCell, ...styles.statementAmount, ...styles.positiveAmount}}>
                    <strong>PKR {formatCurrency(profitLossData.revenue.totalRevenue)}</strong>
                  </td>
                  <td style={{...styles.statementCell, ...styles.percentageColumn}}>
                    <strong>100%</strong>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Cost of Goods Sold */}
            <div style={styles.sectionHeader}>COST OF GOODS SOLD</div>
            <table style={styles.statementTable}>
              <tbody>
                <tr style={styles.statementRow}>
                  <td style={{...styles.statementCell, ...styles.statementLabel}}>Opening Inventory</td>
                  <td style={{...styles.statementCell, ...styles.statementAmount}}>
                    PKR {formatCurrency(profitLossData.costOfGoodsSold.openingInventory)}
                  </td>
                  <td style={styles.statementCell}></td>
                </tr>
                <tr style={styles.statementRow}>
                  <td style={{...styles.statementCell, ...styles.statementLabel}}>Add: Purchases</td>
                  <td style={{...styles.statementCell, ...styles.statementAmount}}>
                    PKR {formatCurrency(profitLossData.costOfGoodsSold.purchases)}
                  </td>
                  <td style={styles.statementCell}></td>
                </tr>
                <tr style={styles.statementRow}>
                  <td style={{...styles.statementCell, ...styles.statementLabel}}>Less: Closing Inventory</td>
                  <td style={{...styles.statementCell, ...styles.statementAmount}}>
                    (PKR {formatCurrency(profitLossData.costOfGoodsSold.closingInventory)})
                  </td>
                  <td style={styles.statementCell}></td>
                </tr>
                <tr style={{...styles.statementRow, ...styles.statementSubtotal}}>
                  <td style={{...styles.statementCell, ...styles.statementLabel}}>
                    <strong>Total Cost of Goods Sold</strong>
                  </td>
                  <td style={{...styles.statementCell, ...styles.statementAmount}}>
                    <strong>PKR {formatCurrency(profitLossData.costOfGoodsSold.totalCOGS)}</strong>
                  </td>
                  <td style={{...styles.statementCell, ...styles.percentageColumn}}>
                    <strong>{getPercentage(profitLossData.costOfGoodsSold.totalCOGS, profitLossData.revenue.totalRevenue)}%</strong>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Gross Profit */}
            <table style={styles.statementTable}>
              <tbody>
                <tr style={{...styles.statementRow, ...styles.statementTotal}}>
                  <td style={{...styles.statementCell, ...styles.statementLabel}}>
                    <strong>GROSS PROFIT</strong>
                  </td>
                  <td style={{...styles.statementCell, ...styles.statementAmount, ...styles.positiveAmount}}>
                    <strong>PKR {formatCurrency(grossProfit)}</strong>
                  </td>
                  <td style={{...styles.statementCell, ...styles.percentageColumn}}>
                    <strong>{getPercentage(grossProfit, profitLossData.revenue.totalRevenue)}%</strong>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Operating Expenses */}
            <div style={styles.sectionHeader}>OPERATING EXPENSES</div>
            <table style={styles.statementTable}>
              <tbody>
                <tr style={styles.statementRow}>
                  <td style={{...styles.statementCell, ...styles.statementLabel}}>Salaries & Wages</td>
                  <td style={{...styles.statementCell, ...styles.statementAmount}}>
                    PKR {formatCurrency(profitLossData.operatingExpenses.salaries)}
                  </td>
                  <td style={{...styles.statementCell, ...styles.percentageColumn}}>
                    {getPercentage(profitLossData.operatingExpenses.salaries, profitLossData.revenue.totalRevenue)}%
                  </td>
                </tr>
                <tr style={styles.statementRow}>
                  <td style={{...styles.statementCell, ...styles.statementLabel}}>Rent Expense</td>
                  <td style={{...styles.statementCell, ...styles.statementAmount}}>
                    PKR {formatCurrency(profitLossData.operatingExpenses.rent)}
                  </td>
                  <td style={{...styles.statementCell, ...styles.percentageColumn}}>
                    {getPercentage(profitLossData.operatingExpenses.rent, profitLossData.revenue.totalRevenue)}%
                  </td>
                </tr>
                <tr style={styles.statementRow}>
                  <td style={{...styles.statementCell, ...styles.statementLabel}}>Utilities</td>
                  <td style={{...styles.statementCell, ...styles.statementAmount}}>
                    PKR {formatCurrency(profitLossData.operatingExpenses.utilities)}
                  </td>
                  <td style={{...styles.statementCell, ...styles.percentageColumn}}>
                    {getPercentage(profitLossData.operatingExpenses.utilities, profitLossData.revenue.totalRevenue)}%
                  </td>
                </tr>
                <tr style={styles.statementRow}>
                  <td style={{...styles.statementCell, ...styles.statementLabel}}>Marketing & Advertising</td>
                  <td style={{...styles.statementCell, ...styles.statementAmount}}>
                    PKR {formatCurrency(profitLossData.operatingExpenses.marketing)}
                  </td>
                  <td style={{...styles.statementCell, ...styles.percentageColumn}}>
                    {getPercentage(profitLossData.operatingExpenses.marketing, profitLossData.revenue.totalRevenue)}%
                  </td>
                </tr>
                <tr style={styles.statementRow}>
                  <td style={{...styles.statementCell, ...styles.statementLabel}}>Office Supplies</td>
                  <td style={{...styles.statementCell, ...styles.statementAmount}}>
                    PKR {formatCurrency(profitLossData.operatingExpenses.supplies)}
                  </td>
                  <td style={{...styles.statementCell, ...styles.percentageColumn}}>
                    {getPercentage(profitLossData.operatingExpenses.supplies, profitLossData.revenue.totalRevenue)}%
                  </td>
                </tr>
                <tr style={styles.statementRow}>
                  <td style={{...styles.statementCell, ...styles.statementLabel}}>Depreciation</td>
                  <td style={{...styles.statementCell, ...styles.statementAmount}}>
                    PKR {formatCurrency(profitLossData.operatingExpenses.depreciation)}
                  </td>
                  <td style={{...styles.statementCell, ...styles.percentageColumn}}>
                    {getPercentage(profitLossData.operatingExpenses.depreciation, profitLossData.revenue.totalRevenue)}%
                  </td>
                </tr>
                <tr style={styles.statementRow}>
                  <td style={{...styles.statementCell, ...styles.statementLabel}}>Other Expenses</td>
                  <td style={{...styles.statementCell, ...styles.statementAmount}}>
                    PKR {formatCurrency(profitLossData.operatingExpenses.otherExpenses)}
                  </td>
                  <td style={{...styles.statementCell, ...styles.percentageColumn}}>
                    {getPercentage(profitLossData.operatingExpenses.otherExpenses, profitLossData.revenue.totalRevenue)}%
                  </td>
                </tr>
                <tr style={{...styles.statementRow, ...styles.statementSubtotal}}>
                  <td style={{...styles.statementCell, ...styles.statementLabel}}>
                    <strong>Total Operating Expenses</strong>
                  </td>
                  <td style={{...styles.statementCell, ...styles.statementAmount}}>
                    <strong>PKR {formatCurrency(profitLossData.operatingExpenses.totalOperatingExpenses)}</strong>
                  </td>
                  <td style={{...styles.statementCell, ...styles.percentageColumn}}>
                    <strong>{getPercentage(profitLossData.operatingExpenses.totalOperatingExpenses, profitLossData.revenue.totalRevenue)}%</strong>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Operating Profit */}
            <table style={styles.statementTable}>
              <tbody>
                <tr style={{...styles.statementRow, ...styles.statementTotal}}>
                  <td style={{...styles.statementCell, ...styles.statementLabel}}>
                    <strong>OPERATING PROFIT</strong>
                  </td>
                  <td style={{...styles.statementCell, ...styles.statementAmount, ...styles.positiveAmount}}>
                    <strong>PKR {formatCurrency(operatingProfit)}</strong>
                  </td>
                  <td style={{...styles.statementCell, ...styles.percentageColumn}}>
                    <strong>{getPercentage(operatingProfit, profitLossData.revenue.totalRevenue)}%</strong>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Other Income/Expenses */}
            <div style={styles.sectionHeader}>OTHER INCOME & EXPENSES</div>
            <table style={styles.statementTable}>
              <tbody>
                <tr style={styles.statementRow}>
                  <td style={{...styles.statementCell, ...styles.statementLabel}}>Interest Income</td>
                  <td style={{...styles.statementCell, ...styles.statementAmount, ...styles.positiveAmount}}>
                    PKR {formatCurrency(profitLossData.otherIncomeExpenses.interestIncome)}
                  </td>
                  <td style={styles.statementCell}></td>
                </tr>
                <tr style={styles.statementRow}>
                  <td style={{...styles.statementCell, ...styles.statementLabel}}>Interest Expense</td>
                  <td style={{...styles.statementCell, ...styles.statementAmount, ...styles.negativeAmount}}>
                    (PKR {formatCurrency(profitLossData.otherIncomeExpenses.interestExpense)})
                  </td>
                  <td style={styles.statementCell}></td>
                </tr>
                <tr style={{...styles.statementRow, ...styles.statementSubtotal}}>
                  <td style={{...styles.statementCell, ...styles.statementLabel}}>
                    <strong>Net Other Income/(Expense)</strong>
                  </td>
                  <td style={{...styles.statementCell, ...styles.statementAmount}}>
                    <strong>
                      {profitLossData.otherIncomeExpenses.netOtherIncome >= 0 ? '' : '('}
                      PKR {formatCurrency(Math.abs(profitLossData.otherIncomeExpenses.netOtherIncome))}
                      {profitLossData.otherIncomeExpenses.netOtherIncome >= 0 ? '' : ')'}
                    </strong>
                  </td>
                  <td style={styles.statementCell}></td>
                </tr>
              </tbody>
            </table>

            {/* Net Profit Before Tax */}
            <table style={styles.statementTable}>
              <tbody>
                <tr style={{...styles.statementRow, ...styles.statementTotal}}>
                  <td style={{...styles.statementCell, ...styles.statementLabel}}>
                    <strong>NET PROFIT BEFORE TAX</strong>
                  </td>
                  <td style={{...styles.statementCell, ...styles.statementAmount, ...styles.positiveAmount}}>
                    <strong>PKR {formatCurrency(netProfitBeforeTax)}</strong>
                  </td>
                  <td style={{...styles.statementCell, ...styles.percentageColumn}}>
                    <strong>{getPercentage(netProfitBeforeTax, profitLossData.revenue.totalRevenue)}%</strong>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Tax Expense */}
            <table style={styles.statementTable}>
              <tbody>
                <tr style={styles.statementRow}>
                  <td style={{...styles.statementCell, ...styles.statementLabel}}>Income Tax Expense (25%)</td>
                  <td style={{...styles.statementCell, ...styles.statementAmount, ...styles.negativeAmount}}>
                    (PKR {formatCurrency(taxExpense)})
                  </td>
                  <td style={styles.statementCell}></td>
                </tr>
              </tbody>
            </table>

            {/* Net Profit After Tax */}
            <table style={styles.statementTable}>
              <tbody>
                <tr style={{...styles.statementRow, ...styles.statementTotal}}>
                  <td style={{...styles.statementCell, ...styles.statementLabel}}>
                    <strong>NET PROFIT AFTER TAX</strong>
                  </td>
                  <td style={{
                    ...styles.statementCell,
                    ...styles.statementAmount,
                    ...(netProfitAfterTax >= 0 ? styles.positiveAmount : styles.negativeAmount)
                  }}>
                    <strong>
                      {netProfitAfterTax >= 0 ? '' : '('}
                      PKR {formatCurrency(Math.abs(netProfitAfterTax))}
                      {netProfitAfterTax >= 0 ? '' : ')'}
                    </strong>
                  </td>
                  <td style={{...styles.statementCell, ...styles.percentageColumn}}>
                    <strong>{getPercentage(netProfitAfterTax, profitLossData.revenue.totalRevenue)}%</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Key Metrics */}
          <div style={styles.metricsGrid}>
            <div style={styles.metricCard}>
              <div style={styles.metricLabel}>Gross Profit Margin</div>
              <div style={styles.metricValue}>
                {getPercentage(grossProfit, profitLossData.revenue.totalRevenue)}%
              </div>
            </div>
            <div style={styles.metricCard}>
              <div style={styles.metricLabel}>Operating Margin</div>
              <div style={styles.metricValue}>
                {getPercentage(operatingProfit, profitLossData.revenue.totalRevenue)}%
              </div>
            </div>
            <div style={styles.metricCard}>
              <div style={styles.metricLabel}>Net Profit Margin</div>
              <div style={styles.metricValue}>
                {getPercentage(netProfitAfterTax, profitLossData.revenue.totalRevenue)}%
              </div>
            </div>
            <div style={styles.metricCard}>
              <div style={styles.metricLabel}>Expense to Revenue Ratio</div>
              <div style={styles.metricValue}>
                {getPercentage(
                  profitLossData.operatingExpenses.totalOperatingExpenses + profitLossData.costOfGoodsSold.totalCOGS,
                  profitLossData.revenue.totalRevenue
                )}%
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <div>Generated on {new Date().toLocaleDateString()} | POS Accounting System v2.0</div>
          <div style={{marginTop: '8px', opacity: '0.8'}}>
            This report is computer generated and does not require signature
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitAndLossAccount;