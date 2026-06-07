import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const DayClose = () => {
  const [filters, setFilters] = useState({
    closeDate: new Date().toISOString().split('T')[0],
    shift: 'all',
    cashier: 'all'
  });

  const [dayCloseData, setDayCloseData] = useState(null);
  const [dayCloseList, setDayCloseList] = useState([]);
  const [cashiers, setCashiers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    closeDate: new Date().toISOString().split('T')[0],
    shift: 'evening',
    cashier: '',
    openingBalance: 0,
    actualBalance: 0
  });

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [cashiersRes, dayClosesRes] = await Promise.all([
        api.get('/employees'),
        api.get('/day-close')
      ]);

      setCashiers(cashiersRes.data);
      setDayCloseList(dayClosesRes.data.data || []);
    } catch (err) {
      setError('Failed to load initial data');
      console.error('Error fetching initial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDayCloseData = async (date, shift) => {
    try {
      setIsLoading(true);
      const response = await api.get(`/day-close/by-date/${date}/${shift}`);
      setDayCloseData(response.data.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setDayCloseData(null);
        setError('No day close data found for this date and shift');
      } else {
        setError('Failed to load day close data');
        console.error('Error fetching day close data:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'closeDate' || name === 'shift') {
      if (value !== 'all') {
        fetchDayCloseData(
          name === 'closeDate' ? value : filters.closeDate,
          name === 'shift' ? value : filters.shift
        );
      }
    }
  };

  const handleGenerateFormChange = (e) => {
    const { name, value } = e.target;
    setGenerateForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenerateDayClose = async () => {
    if (!generateForm.closeDate || !generateForm.shift || !generateForm.cashier) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await api.post('/day-close/generate', generateForm);
      setSuccess('Day close data generated successfully!');
      setDayCloseData(response.data.data);
      setShowGenerateForm(false);
      fetchInitialData(); // Refresh the list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate day close data');
      console.error('Error generating day close:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCashier = async () => {
    if (!dayCloseData) return;

    try {
      setIsLoading(true);
      await api.post(`/day-close/${dayCloseData._id}/verify/cashier`, {
        verifiedBy: generateForm.cashier // Using the same cashier for demo
      });
      setSuccess('Cashier verification completed!');
      fetchDayCloseData(dayCloseData.closeDate, dayCloseData.shift);
    } catch (err) {
      setError('Failed to verify as cashier');
      console.error('Error verifying cashier:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyManager = async () => {
    if (!dayCloseData) return;

    try {
      setIsLoading(true);
      await api.post(`/day-close/${dayCloseData._id}/verify/manager`, {
        verifiedBy: generateForm.cashier // Using the same person for demo
      });
      setSuccess('Manager verification completed! Day close finalized.');
      fetchDayCloseData(dayCloseData.closeDate, dayCloseData.shift);
    } catch (err) {
      setError('Failed to verify as manager');
      console.error('Error verifying manager:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    alert('Exporting Day Close Report...');
  };

  const handleRefresh = () => {
    setFilters({
      closeDate: new Date().toISOString().split('T')[0],
      shift: 'all',
      cashier: 'all'
    });
    setDayCloseData(null);
    setError(null);
    setSuccess(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getCashDifferenceStyle = (difference) => {
    if (difference === 0) return { color: '#059669', fontWeight: 'bold' };
    if (Math.abs(difference) <= 100) return { color: '#f59e0b', fontWeight: 'bold' };
    return { color: '#dc2626', fontWeight: 'bold' };
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { bg: '#fef3c7', color: '#92400e', text: 'OPEN' },
      closing: { bg: '#dbeafe', color: '#1e40af', text: 'CLOSING' },
      closed: { bg: '#d1fae5', color: '#065f46', text: 'CLOSED' },
      reopened: { bg: '#fee2e2', color: '#991b1b', text: 'REOPENED' }
    };

    const config = statusConfig[status] || statusConfig.open;

    return {
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      backgroundColor: config.bg,
      color: config.color,
      display: 'inline-block'
    };
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
    statusBanner: {
      backgroundColor: dayCloseData?.status === 'closed' ? '#d1fae5' : '#fef3c7',
      border: `1px solid ${dayCloseData?.status === 'closed' ? '#a7f3d0' : '#fcd34d'}`,
      padding: '16px 20px',
      borderRadius: '8px',
      marginBottom: '24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    statusText: {
      fontSize: '16px',
      fontWeight: '600',
      color: dayCloseData?.status === 'closed' ? '#065f46' : '#92400e'
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
    successButton: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    warningButton: {
      backgroundColor: '#f59e0b',
      color: 'white'
    },
    secondaryButton: {
      backgroundColor: '#6b7280',
      color: 'white'
    },
    dangerButton: {
      backgroundColor: '#ef4444',
      color: 'white'
    },
    disabledButton: {
      backgroundColor: '#d1d5db',
      color: '#6b7280',
      cursor: 'not-allowed'
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
    dashboard: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '20px',
      marginBottom: '24px'
    },
    card: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
      paddingBottom: '12px',
      borderBottom: '1px solid #e5e7eb'
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#1e293b',
      margin: 0
    },
    cardContent: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    metricRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0'
    },
    metricLabel: {
      fontSize: '14px',
      color: '#64748b'
    },
    metricValue: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#1e293b'
    },
    positiveValue: {
      color: '#059669'
    },
    negativeValue: {
      color: '#dc2626'
    },
    warningValue: {
      color: '#f59e0b'
    },
    cashReconciliation: {
      backgroundColor: '#f0fdf4',
      border: '1px solid #bbf7d0'
    },
    cashDifference: {
      backgroundColor: dayCloseData?.cashReconciliation?.difference === 0 ? '#f0fdf4' :
                      Math.abs(dayCloseData?.cashReconciliation?.difference || 0) <= 100 ? '#fffbeb' : '#fef2f2',
      border: dayCloseData?.cashReconciliation?.difference === 0 ? '1px solid #bbf7d0' :
              Math.abs(dayCloseData?.cashReconciliation?.difference || 0) <= 100 ? '1px solid #fcd34d' : '1px solid #fecaca'
    },
    verificationSection: {
      backgroundColor: '#f8fafc',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      padding: '16px'
    },
    verificationRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0',
      borderBottom: '1px solid #e5e7eb'
    },
    verificationLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      color: '#374151'
    },
    checkmark: {
      color: '#10b981',
      fontSize: '16px'
    },
    cross: {
      color: '#ef4444',
      fontSize: '16px'
    },
    progressBar: {
      width: '100%',
      height: '8px',
      backgroundColor: '#e5e7eb',
      borderRadius: '4px',
      overflow: 'hidden',
      marginTop: '8px'
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#3b82f6',
      borderRadius: '4px',
      transition: 'width 0.3s ease'
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
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '14px'
    },
    th: {
      backgroundColor: '#f8fafc',
      padding: '16px 12px',
      textAlign: 'left',
      fontWeight: '600',
      color: '#374151',
      borderBottom: '1px solid #e2e8f0'
    },
    td: {
      padding: '12px 12px',
      borderBottom: '1px solid #e2e8f0',
      color: '#4b5563'
    },
    amountCell: {
      textAlign: 'right',
      fontWeight: '500',
      fontFamily: "'Courier New', monospace"
    },
    footer: {
      backgroundColor: '#1e293b',
      color: 'white',
      padding: '20px',
      textAlign: 'center',
      fontSize: '12px'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    },
    modalContent: {
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '8px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
      maxWidth: '500px',
      width: '100%',
      maxHeight: '80vh',
      overflow: 'auto'
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      paddingBottom: '16px',
      borderBottom: '1px solid #e5e7eb'
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#1e293b',
      margin: 0
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#6b7280'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>Day Close</h1>
            <p style={styles.subtitle}>End of day settlement and reporting</p>
          </div>
          <div style={getStatusBadge(dayCloseData?.status || 'open')}>
            {dayCloseData?.status?.toUpperCase() || 'OPEN'}
          </div>
        </div>
      </div>

      <div style={styles.mainContent}>
        {/* Status Banner */}
        {dayCloseData && (
          <div style={styles.statusBanner}>
            <div style={styles.statusText}>
              {dayCloseData.status === 'closed'
                ? `✅ Day successfully closed on ${new Date(dayCloseData.updatedAt).toLocaleString()}`
                : dayCloseData.status === 'closing'
                ? '🔄 Day close in progress...'
                : '⚠️ Day close pending verification'
              }
            </div>
            {dayCloseData.status !== 'closed' && (
              <div style={{ display: 'flex', gap: '10px' }}>
                {!dayCloseData.verification.cashier.verified && (
                  <button
                    style={{
                      ...styles.button,
                      ...styles.warningButton,
                      ...(isLoading && styles.disabledButton)
                    }}
                    onClick={handleVerifyCashier}
                    disabled={isLoading}
                  >
                    {isLoading ? '🔄 Verifying...' : '👤 Cashier Verify'}
                  </button>
                )}
                {dayCloseData.verification.cashier.verified && !dayCloseData.verification.manager.verified && (
                  <button
                    style={{
                      ...styles.button,
                      ...styles.successButton,
                      ...(isLoading && styles.disabledButton)
                    }}
                    onClick={handleVerifyManager}
                    disabled={isLoading}
                  >
                    {isLoading ? '🔄 Finalizing...' : '✅ Manager Verify'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '20px',
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: '#d1fae5',
            color: '#065f46',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '20px',
            border: '1px solid #a7f3d0'
          }}>
            {success}
          </div>
        )}

        {/* Action Buttons */}
        <div style={styles.actionBar}>
          <button
            style={{...styles.button, ...styles.primaryButton}}
            onClick={() => setShowGenerateForm(true)}
            disabled={isLoading}
          >
            📊 Generate Day Close
          </button>
          <button
            style={{...styles.button, ...styles.secondaryButton}}
            onClick={handlePrint}
            disabled={!dayCloseData || isLoading}
          >
            🖨️ Print Z Report
          </button>
          <button
            style={{...styles.button, ...styles.secondaryButton}}
            onClick={handleExport}
            disabled={!dayCloseData || isLoading}
          >
            📊 Export Reports
          </button>
          <button
            style={{...styles.button, ...styles.warningButton}}
            onClick={handleRefresh}
            disabled={isLoading}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Filters */}
        <div style={styles.filterSection}>
          <div style={styles.filterGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Close Date</label>
              <input
                type="date"
                name="closeDate"
                value={filters.closeDate}
                onChange={handleFilterChange}
                style={styles.input}
                disabled={isLoading}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Shift</label>
              <select
                name="shift"
                value={filters.shift}
                onChange={handleFilterChange}
                style={styles.select}
                disabled={isLoading}
              >
                <option value="all">All Shifts</option>
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
                <option value="night">Night</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Cashier</label>
              <select
                name="cashier"
                value={filters.cashier}
                onChange={handleFilterChange}
                style={styles.select}
                disabled={isLoading}
              >
                <option value="all">All Cashiers</option>
                {cashiers.map(cashier => (
                  <option key={cashier._id} value={cashier._id}>
                    {cashier.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Dashboard Cards */}
        {dayCloseData && (
          <>
            <div style={styles.dashboard}>
              {/* Sales Summary */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>Sales Summary</h3>
                  <span style={{...getStatusBadge('closed'), fontSize: '10px', padding: '4px 8px'}}>
                    FINAL
                  </span>
                </div>
                <div style={styles.cardContent}>
                  <div style={styles.metricRow}>
                    <span style={styles.metricLabel}>Total Sales</span>
                    <span style={{...styles.metricValue, ...styles.positiveValue}}>
                      PKR {formatCurrency(dayCloseData.sales.totalSales)}
                    </span>
                  </div>
                  <div style={styles.metricRow}>
                    <span style={styles.metricLabel}>Cash Sales</span>
                    <span style={styles.metricValue}>
                      PKR {formatCurrency(dayCloseData.sales.cashSales)}
                    </span>
                  </div>
                  <div style={styles.metricRow}>
                    <span style={styles.metricLabel}>Card Sales</span>
                    <span style={styles.metricValue}>
                      PKR {formatCurrency(dayCloseData.sales.cardSales)}
                    </span>
                  </div>
                  <div style={styles.metricRow}>
                    <span style={styles.metricLabel}>Digital Payments</span>
                    <span style={styles.metricValue}>
                      PKR {formatCurrency(dayCloseData.sales.digitalSales)}
                    </span>
                  </div>
                  <div style={styles.metricRow}>
                    <span style={styles.metricLabel}>Total Transactions</span>
                    <span style={styles.metricValue}>
                      {dayCloseData.sales.totalTransactions}
                    </span>
                  </div>
                  <div style={styles.metricRow}>
                    <span style={styles.metricLabel}>Average Transaction</span>
                    <span style={styles.metricValue}>
                      PKR {formatCurrency(dayCloseData.sales.averageTransaction)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cash Reconciliation */}
              <div style={{...styles.card, ...styles.cashReconciliation}}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>Cash Reconciliation</h3>
                  <span style={{
                    ...getStatusBadge(Math.abs(dayCloseData.cashReconciliation.difference) === 0 ? 'closed' : 'open'),
                    fontSize: '10px',
                    padding: '4px 8px',
                    backgroundColor: Math.abs(dayCloseData.cashReconciliation.difference) === 0 ? '#10b981' :
                                    Math.abs(dayCloseData.cashReconciliation.difference) <= 100 ? '#f59e0b' : '#ef4444'
                  }}>
                    {Math.abs(dayCloseData.cashReconciliation.difference) === 0 ? 'BALANCED' :
                     Math.abs(dayCloseData.cashReconciliation.difference) <= 100 ? 'MINOR DIFF' : 'UNBALANCED'}
                  </span>
                </div>
                <div style={styles.cardContent}>
                  <div style={styles.metricRow}>
                    <span style={styles.metricLabel}>Opening Balance</span>
                    <span style={styles.metricValue}>
                      PKR {formatCurrency(dayCloseData.cashReconciliation.openingBalance)}
                    </span>
                  </div>
                  <div style={styles.metricRow}>
                    <span style={styles.metricLabel}>+ Cash Sales</span>
                    <span style={{...styles.metricValue, ...styles.positiveValue}}>
                      PKR {formatCurrency(dayCloseData.cashReconciliation.sales)}
                    </span>
                  </div>
                  <div style={styles.metricRow}>
                    <span style={styles.metricLabel}>- Cash Expenses</span>
                    <span style={{...styles.metricValue, ...styles.negativeValue}}>
                      PKR {formatCurrency(dayCloseData.cashReconciliation.expenses)}
                    </span>
                  </div>
                  <div style={{...styles.metricRow, borderTop: '1px solid #e5e7eb', paddingTop: '12px'}}>
                    <span style={styles.metricLabel}>Expected Balance</span>
                    <span style={styles.metricValue}>
                      PKR {formatCurrency(dayCloseData.cashReconciliation.expectedBalance)}
                    </span>
                  </div>
                  <div style={styles.metricRow}>
                    <span style={styles.metricLabel}>Actual Balance</span>
                    <span style={styles.metricValue}>
                      PKR {formatCurrency(dayCloseData.cashReconciliation.actualBalance)}
                    </span>
                  </div>
                  <div style={{...styles.metricRow, borderTop: '2px solid #e5e7eb', paddingTop: '12px'}}>
                    <span style={styles.metricLabel}>Difference</span>
                    <span style={getCashDifferenceStyle(dayCloseData.cashReconciliation.difference)}>
                      {dayCloseData.cashReconciliation.difference >= 0 ? '+' : ''}
                      PKR {formatCurrency(dayCloseData.cashReconciliation.difference)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transaction Summary */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>Transaction Summary</h3>
                </div>
                <div style={styles.cardContent}>
                  <div style={styles.metricRow}>
                    <span style={styles.metricLabel}>Successful Sales</span>
                    <span style={{...styles.metricValue, ...styles.positiveValue}}>
                      {dayCloseData.transactions.sales}
                    </span>
                  </div>
                  <div style={styles.metricRow}>
                    <span style={styles.metricLabel}>Returns</span>
                    <span style={{...styles.metricValue, ...styles.warningValue}}>
                      {dayCloseData.transactions.returns}
                    </span>
                  </div>
                  <div style={styles.metricRow}>
                    <span style={styles.metricLabel}>Voided Transactions</span>
                    <span style={{...styles.metricValue, ...styles.negativeValue}}>
                      {dayCloseData.transactions.voids}
                    </span>
                  </div>
                  <div style={styles.metricRow}>
                    <span style={styles.metricLabel}>Total Discounts</span>
                    <span style={styles.metricValue}>
                      PKR {formatCurrency(dayCloseData.transactions.discounts)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Verification */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>Close Verification</h3>
                </div>
                <div style={styles.verificationSection}>
                  <div style={styles.verificationRow}>
                    <span style={styles.verificationLabel}>
                      {dayCloseData.verification.cashier.verified ? '✅' : '❌'} Cashier Verification
                    </span>
                    <span style={styles.metricValue}>
                      {dayCloseData.verification.cashier.verified ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                  <div style={styles.verificationRow}>
                    <span style={styles.verificationLabel}>
                      {dayCloseData.verification.manager.verified ? '✅' : '❌'} Manager Approval
                    </span>
                    <span style={styles.metricValue}>
                      {dayCloseData.verification.manager.verified ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                  <div style={styles.verificationRow}>
                    <span style={styles.verificationLabel}>
                      {dayCloseData.verification.system.verified ? '✅' : '❌'} System Verification
                    </span>
                    <span style={styles.metricValue}>
                      {dayCloseData.verification.system.verified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                  {dayCloseData.status === 'closing' && (
                    <div style={styles.progressBar}>
                      <div style={{...styles.progressFill, width: '65%'}}></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Detailed Report */}
            <div style={styles.reportContainer}>
              <div style={styles.reportHeader}>
                <h2 style={styles.reportTitle}>DAY CLOSE REPORT - Z READING</h2>
                <p style={styles.reportSubtitle}>
                  {new Date(dayCloseData.closeDate).toLocaleDateString()} | {dayCloseData.shift.charAt(0).toUpperCase() + dayCloseData.shift.slice(1)} Shift | Cashier: {dayCloseData.cashierDetails?.name || 'N/A'}
                </p>
              </div>

              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Description</th>
                    <th style={styles.th}>Count</th>
                    <th style={{...styles.th, textAlign: 'right'}}>Amount (PKR)</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={styles.td}>Opening Balance</td>
                    <td style={styles.td}>-</td>
                    <td style={{...styles.td, ...styles.amountCell}}>
                      {formatCurrency(dayCloseData.cashReconciliation.openingBalance)}
                    </td>
                    <td style={styles.td}>✅ Verified</td>
                  </tr>
                  <tr>
                    <td style={styles.td}>Cash Sales</td>
                    <td style={styles.td}>{dayCloseData.transactions.sales}</td>
                    <td style={{...styles.td, ...styles.amountCell, ...styles.positiveValue}}>
                      +{formatCurrency(dayCloseData.cashReconciliation.sales)}
                    </td>
                    <td style={styles.td}>✅ Recorded</td>
                  </tr>
                  <tr>
                    <td style={styles.td}>Card Payments</td>
                    <td style={styles.td}>{dayCloseData.payments.card.transactions}</td>
                    <td style={{...styles.td, ...styles.amountCell}}>
                      {formatCurrency(dayCloseData.payments.card.total)}
                    </td>
                    <td style={styles.td}>✅ Settled</td>
                  </tr>
                  <tr>
                    <td style={styles.td}>Digital Payments</td>
                    <td style={styles.td}>{dayCloseData.payments.digital.transactions}</td>
                    <td style={{...styles.td, ...styles.amountCell}}>
                      {formatCurrency(dayCloseData.payments.digital.total)}
                    </td>
                    <td style={styles.td}>✅ Processed</td>
                  </tr>
                  <tr>
                    <td style={styles.td}>Cash Expenses</td>
                    <td style={styles.td}>-</td>
                    <td style={{...styles.td, ...styles.amountCell, ...styles.negativeValue}}>
                      -{formatCurrency(dayCloseData.cashReconciliation.expenses)}
                    </td>
                    <td style={styles.td}>✅ Approved</td>
                  </tr>
                  <tr>
                    <td style={{...styles.td, fontWeight: 'bold'}}>Expected Cash</td>
                    <td style={styles.td}>-</td>
                    <td style={{...styles.td, ...styles.amountCell, fontWeight: 'bold'}}>
                      {formatCurrency(dayCloseData.cashReconciliation.expectedBalance)}
                    </td>
                    <td style={styles.td}>📊 Calculated</td>
                  </tr>
                  <tr>
                    <td style={{...styles.td, fontWeight: 'bold'}}>Actual Cash</td>
                    <td style={styles.td}>-</td>
                    <td style={{...styles.td, ...styles.amountCell, fontWeight: 'bold'}}>
                      {formatCurrency(dayCloseData.cashReconciliation.actualBalance)}
                    </td>
                    <td style={styles.td}>💰 Counted</td>
                  </tr>
                  <tr style={{backgroundColor: '#f8fafc'}}>
                    <td style={{...styles.td, fontWeight: 'bold', color: '#1e293b'}}>
                      CASH DIFFERENCE
                    </td>
                    <td style={styles.td}>-</td>
                    <td style={{
                      ...styles.td,
                      ...styles.amountCell,
                      fontWeight: 'bold',
                      ...getCashDifferenceStyle(dayCloseData.cashReconciliation.difference)
                    }}>
                      {dayCloseData.cashReconciliation.difference >= 0 ? '+' : ''}
                      {formatCurrency(dayCloseData.cashReconciliation.difference)}
                    </td>
                    <td style={styles.td}>
                      {Math.abs(dayCloseData.cashReconciliation.difference) === 0 ? '✅ Perfect' :
                       Math.abs(dayCloseData.cashReconciliation.difference) <= 100 ? '⚠️ Acceptable' : '❌ Investigate'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={styles.footer}>
              <div>Generated on {new Date().toLocaleDateString()} | POS System v2.0</div>
              <div style={{marginTop: '8px', opacity: '0.8'}}>
                {dayCloseData.status === 'closed'
                  ? `Day closed successfully at ${new Date(dayCloseData.updatedAt).toLocaleString()}`
                  : 'Day close procedures must be completed by authorized personnel only'
                }
              </div>
            </div>
          </>
        )}

        {/* Generate Day Close Modal */}
        {showGenerateForm && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Generate Day Close</h3>
                <button
                  style={styles.closeButton}
                  onClick={() => setShowGenerateForm(false)}
                >
                  ×
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Close Date *</label>
                  <input
                    type="date"
                    name="closeDate"
                    value={generateForm.closeDate}
                    onChange={handleGenerateFormChange}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Shift *</label>
                  <select
                    name="shift"
                    value={generateForm.shift}
                    onChange={handleGenerateFormChange}
                    style={styles.select}
                  >
                    <option value="morning">Morning</option>
                    <option value="evening">Evening</option>
                    <option value="night">Night</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Cashier *</label>
                  <select
                    name="cashier"
                    value={generateForm.cashier}
                    onChange={handleGenerateFormChange}
                    style={styles.select}
                  >
                    <option value="">Select Cashier</option>
                    {cashiers.map(cashier => (
                      <option key={cashier._id} value={cashier._id}>
                        {cashier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Opening Balance</label>
                  <input
                    type="number"
                    name="openingBalance"
                    value={generateForm.openingBalance}
                    onChange={handleGenerateFormChange}
                    style={styles.input}
                    step="0.01"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Actual Balance</label>
                  <input
                    type="number"
                    name="actualBalance"
                    value={generateForm.actualBalance}
                    onChange={handleGenerateFormChange}
                    style={styles.input}
                    step="0.01"
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button
                    style={{...styles.button, ...styles.primaryButton}}
                    onClick={handleGenerateDayClose}
                    disabled={isLoading}
                  >
                    {isLoading ? '🔄 Generating...' : '📊 Generate'}
                  </button>
                  <button
                    style={{...styles.button, ...styles.secondaryButton}}
                    onClick={() => setShowGenerateForm(false)}
                  >
                    Cancel
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DayClose;
