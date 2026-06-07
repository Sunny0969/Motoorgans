import React, { useState, useEffect, useCallback } from 'react';

const SMSHistory = () => {
  const [smsHistory, setSmsHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    phoneNumber: '',
    searchTerm: ''
  });
  const [selectedSms, setSelectedSms] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });

  // Sample SMS data
  const sampleSmsData = [
    {
      id: 1,
      phoneNumber: '+1 (555) 123-4567',
      message: 'Your order #12345 has been shipped. Tracking number: TRK789456123',
      status: 'delivered',
      timestamp: '2024-01-15 14:30:25',
      type: 'outgoing',
      cost: 0.05,
      messageLength: 78
    },
    {
      id: 2,
      phoneNumber: '+1 (555) 987-6543',
      message: 'Thank you for your payment of $150.00. Your account is now current.',
      status: 'delivered',
      timestamp: '2024-01-15 13:15:42',
      type: 'outgoing',
      cost: 0.05,
      messageLength: 72
    },
    {
      id: 3,
      phoneNumber: '+1 (555) 456-7890',
      message: 'Your verification code is: 849327. Valid for 10 minutes.',
      status: 'failed',
      timestamp: '2024-01-15 12:05:18',
      type: 'outgoing',
      cost: 0.05,
      messageLength: 55
    },
    {
      id: 4,
      phoneNumber: '+1 (555) 234-5678',
      message: 'Appointment reminder: Dr. Smith tomorrow at 2:00 PM.',
      status: 'sent',
      timestamp: '2024-01-15 11:20:33',
      type: 'outgoing',
      cost: 0.05,
      messageLength: 58
    },
    {
      id: 5,
      phoneNumber: '+1 (555) 876-5432',
      message: 'Hi, I would like to schedule a service call for my account.',
      status: 'delivered',
      timestamp: '2024-01-14 16:45:12',
      type: 'incoming',
      cost: 0.00,
      messageLength: 65
    },
    {
      id: 6,
      phoneNumber: '+1 (555) 345-6789',
      message: 'Your monthly statement is ready. View online or we can mail it.',
      status: 'delivered',
      timestamp: '2024-01-14 15:30:47',
      type: 'outgoing',
      cost: 0.05,
      messageLength: 75
    },
    {
      id: 7,
      phoneNumber: '+1 (555) 765-4321',
      message: 'URGENT: Your payment is overdue. Please contact us immediately.',
      status: 'sent',
      timestamp: '2024-01-14 14:15:29',
      type: 'outgoing',
      cost: 0.05,
      messageLength: 68
    },
    {
      id: 8,
      phoneNumber: '+1 (555) 123-4567',
      message: 'Yes, I received the package. Thank you!',
      status: 'delivered',
      timestamp: '2024-01-14 13:05:54',
      type: 'incoming',
      cost: 0.00,
      messageLength: 42
    },
    {
      id: 9,
      phoneNumber: '+1 (555) 987-6543',
      message: 'New promotion: Get 20% off your next purchase with code SAVE20',
      status: 'failed',
      timestamp: '2024-01-13 17:20:38',
      type: 'outgoing',
      cost: 0.05,
      messageLength: 70
    },
    {
      id: 10,
      phoneNumber: '+1 (555) 456-7890',
      message: 'Your support ticket #789 has been resolved. Thank you.',
      status: 'delivered',
      timestamp: '2024-01-13 16:10:22',
      type: 'outgoing',
      cost: 0.05,
      messageLength: 62
    },
    {
      id: 11,
      phoneNumber: '+1 (555) 111-2233',
      message: 'Your package is out for delivery today.',
      status: 'delivered',
      timestamp: '2024-01-13 10:30:15',
      type: 'outgoing',
      cost: 0.05,
      messageLength: 45
    },
    {
      id: 12,
      phoneNumber: '+1 (555) 444-5566',
      message: 'Payment received. Thank you!',
      status: 'delivered',
      timestamp: '2024-01-12 09:15:33',
      type: 'outgoing',
      cost: 0.05,
      messageLength: 32
    }
  ];

  // Initialize data
  useEffect(() => {
    setSmsHistory(sampleSmsData);
    setFilteredHistory(sampleSmsData);
  }, []);

  // Filter and sort history
  const filterHistory = useCallback(() => {
    let filtered = [...smsHistory];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(sms => sms.status === filters.status);
    }

    // Filter by date range
    if (filters.dateFrom) {
      filtered = filtered.filter(sms => sms.timestamp.split(' ')[0] >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(sms => sms.timestamp.split(' ')[0] <= filters.dateTo);
    }

    // Filter by phone number
    if (filters.phoneNumber) {
      filtered = filtered.filter(sms => 
        sms.phoneNumber.toLowerCase().includes(filters.phoneNumber.toLowerCase())
      );
    }

    // Filter by search term
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(sms => 
        sms.message.toLowerCase().includes(term) ||
        sms.phoneNumber.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredHistory(filtered);
    setCurrentPage(1);
  }, [filters, smsHistory, sortConfig]);

  useEffect(() => {
    filterHistory();
  }, [filterHistory]);

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      status: 'all',
      dateFrom: '',
      dateTo: '',
      phoneNumber: '',
      searchTerm: ''
    });
  };

  const handleResendSms = (smsId) => {
    alert(`Resending SMS #${smsId}`);
    // In real app, you would call an API here
  };

  const handleDeleteSms = (smsId) => {
    if (window.confirm('Are you sure you want to delete this SMS record?')) {
      setSmsHistory(prev => prev.filter(sms => sms.id !== smsId));
    }
  };

  const handleViewDetails = (sms) => {
    setSelectedSms(sms);
  };

  const closeDetails = () => {
    setSelectedSms(null);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

  const getStatusBadge = (status) => {
    const statusStyles = {
      delivered: { backgroundColor: '#27ae60', color: 'white' },
      sent: { backgroundColor: '#3498db', color: 'white' },
      failed: { backgroundColor: '#e74c3c', color: 'white' }
    };
    
    return (
      <span style={{
        ...styles.statusBadge,
        ...statusStyles[status]
      }}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    return (
      <span style={{
        ...styles.typeBadge,
        backgroundColor: type === 'outgoing' ? '#e3f2fd' : '#f3e5f5',
        color: type === 'outgoing' ? '#1976d2' : '#7b1fa2'
      }}>
        {type === 'outgoing' ? 'OUTGOING' : 'INCOMING'}
      </span>
    );
  };

  // Generate page numbers with ellipsis for better UX
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>SMS History</h1>
        <div style={styles.headerStats}>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Total Messages</span>
            <span style={styles.statValue}>{smsHistory.length}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Delivered</span>
            <span style={styles.statValue}>
              {smsHistory.filter(sms => sms.status === 'delivered').length}
            </span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Failed</span>
            <span style={styles.statValue}>
              {smsHistory.filter(sms => sms.status === 'failed').length}
            </span>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div style={styles.filtersSection}>
        <h3 style={styles.sectionTitle}>Filters & Search</h3>
        <div style={styles.filtersGrid}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Status</label>
            <select 
              style={styles.filterSelect}
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="delivered">Delivered</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Date From</label>
            <input 
              type="date"
              style={styles.filterInput}
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Date To</label>
            <input 
              type="date"
              style={styles.filterInput}
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Phone Number</label>
            <input 
              type="text"
              style={styles.filterInput}
              placeholder="Search by phone..."
              value={filters.phoneNumber}
              onChange={(e) => handleFilterChange('phoneNumber', e.target.value)}
            />
          </div>
        </div>

        <div style={styles.searchRow}>
          <div style={styles.searchGroup}>
            <input 
              type="text"
              style={styles.searchInput}
              placeholder="Search messages or phone numbers..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            />
          </div>
          <button style={styles.resetButton} onClick={handleResetFilters}>
            Reset Filters
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div style={styles.resultsSummary}>
        <span style={styles.resultsText}>
          Showing {filteredHistory.length} of {smsHistory.length} messages
          {currentItems.length > 0 && ` (Page ${currentPage} of ${totalPages})`}
        </span>
        {(filters.status !== 'all' || filters.dateFrom || filters.dateTo || filters.phoneNumber || filters.searchTerm) && (
          <span style={styles.activeFilters}>
            Active filters applied
          </span>
        )}
      </div>

      {/* SMS History Table */}
      <div style={styles.tableContainer}>
        <div style={styles.tableHeader}>
          <div 
            style={styles.tableHeaderCell} 
            onClick={() => handleSort('phoneNumber')}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && handleSort('phoneNumber')}
          >
            Phone Number {sortConfig.key === 'phoneNumber' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
          </div>
          <div 
            style={styles.tableHeaderCell} 
            onClick={() => handleSort('message')}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && handleSort('message')}
          >
            Message {sortConfig.key === 'message' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
          </div>
          <div 
            style={styles.tableHeaderCell} 
            onClick={() => handleSort('status')}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && handleSort('status')}
          >
            Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
          </div>
          <div 
            style={styles.tableHeaderCell} 
            onClick={() => handleSort('timestamp')}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && handleSort('timestamp')}
          >
            Date & Time {sortConfig.key === 'timestamp' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
          </div>
          <div 
            style={styles.tableHeaderCell} 
            onClick={() => handleSort('type')}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && handleSort('type')}
          >
            Type {sortConfig.key === 'type' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
          </div>
          <div style={styles.tableHeaderCell}>Actions</div>
        </div>

        {currentItems.length === 0 ? (
          <div style={styles.noResults}>
            <div style={styles.noResultsIcon}>📱</div>
            <div style={styles.noResultsText}>No SMS messages found matching your criteria.</div>
            <button 
              style={styles.clearFiltersButton}
              onClick={handleResetFilters}
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          currentItems.map(sms => (
            <div key={sms.id} style={styles.tableRow}>
              <div style={styles.tableCell}>
                <div style={styles.phoneNumber}>{sms.phoneNumber}</div>
              </div>
              <div style={styles.tableCell}>
                <div style={styles.messagePreview}>
                  {sms.message.length > 60 ? `${sms.message.substring(0, 60)}...` : sms.message}
                </div>
              </div>
              <div style={styles.tableCell}>
                {getStatusBadge(sms.status)}
              </div>
              <div style={styles.tableCell}>
                <div style={styles.timestamp}>{sms.timestamp}</div>
              </div>
              <div style={styles.tableCell}>
                {getTypeBadge(sms.type)}
              </div>
              <div style={styles.tableCell}>
                <div style={styles.actionButtons}>
                  <button 
                    style={styles.viewButton}
                    onClick={() => handleViewDetails(sms)}
                    title="View Details"
                  >
                    View
                  </button>
                  {sms.type === 'outgoing' && sms.status === 'failed' && (
                    <button 
                      style={styles.resendButton}
                      onClick={() => handleResendSms(sms.id)}
                      title="Resend SMS"
                    >
                      Resend
                    </button>
                  )}
                  <button 
                    style={styles.deleteButton}
                    onClick={() => handleDeleteSms(sms.id)}
                    title="Delete Record"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button 
            style={{
              ...styles.paginationButton,
              ...(currentPage === 1 ? styles.paginationButtonDisabled : {})
            }}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </button>
          
          <div style={styles.pageNumbers}>
            {getPageNumbers().map((page, index) => (
              page === '...' ? (
                <span key={`ellipsis-${index}`} style={styles.ellipsis}>...</span>
              ) : (
                <button
                  key={page}
                  style={{
                    ...styles.pageButton,
                    ...(page === currentPage ? styles.activePageButton : {})
                  }}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              )
            ))}
          </div>
          
          <button 
            style={{
              ...styles.paginationButton,
              ...(currentPage === totalPages ? styles.paginationButtonDisabled : {})
            }}
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* SMS Details Modal */}
      {selectedSms && (
        <div style={styles.modalOverlay} onClick={closeDetails}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>SMS Details</h2>
              <button 
                style={styles.closeButton} 
                onClick={closeDetails}
                title="Close"
              >
                ×
              </button>
            </div>
            
            <div style={styles.modalContent}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Phone Number:</span>
                <span style={styles.detailValue}>{selectedSms.phoneNumber}</span>
              </div>
              
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Message Type:</span>
                <span style={styles.detailValue}>
                  {getTypeBadge(selectedSms.type)}
                </span>
              </div>
              
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Status:</span>
                <span style={styles.detailValue}>
                  {getStatusBadge(selectedSms.status)}
                </span>
              </div>
              
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Date & Time:</span>
                <span style={styles.detailValue}>{selectedSms.timestamp}</span>
              </div>
              
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Message Length:</span>
                <span style={styles.detailValue}>{selectedSms.messageLength} characters</span>
              </div>
              
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Cost:</span>
                <span style={styles.detailValue}>${selectedSms.cost.toFixed(2)}</span>
              </div>
              
              <div style={styles.messageContainer}>
                <span style={styles.detailLabel}>Full Message:</span>
                <div style={styles.messageContent}>
                  {selectedSms.message}
                </div>
              </div>
            </div>
            
            <div style={styles.modalActions}>
              {selectedSms.type === 'outgoing' && selectedSms.status === 'failed' && (
                <button 
                  style={styles.modalResendButton}
                  onClick={() => {
                    handleResendSms(selectedSms.id);
                    closeDetails();
                  }}
                >
                  Resend SMS
                </button>
              )}
              <button 
                style={styles.modalCloseButton}
                onClick={closeDetails}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
  },
  header: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '5px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  headerStats: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap'
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px 15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '5px',
    minWidth: '80px'
  },
  statLabel: {
    fontSize: '12px',
    color: '#6c757d',
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  statValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  filtersSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '5px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  sectionTitle: {
    margin: '0 0 15px 0',
    color: '#2c3e50',
    fontSize: '18px',
    fontWeight: 'bold'
  },
  filtersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '15px'
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  filterLabel: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333'
  },
  filterSelect: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '3px',
    fontSize: '14px'
  },
  filterInput: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '3px',
    fontSize: '14px'
  },
  searchRow: {
    display: 'flex',
    gap: '15px',
    alignItems: 'flex-end'
  },
  searchGroup: {
    flex: '1'
  },
  searchInput: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '3px',
    fontSize: '14px'
  },
  resetButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap'
  },
  resultsSummary: {
    backgroundColor: 'white',
    padding: '15px 20px',
    borderRadius: '5px',
    marginBottom: '15px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px'
  },
  resultsText: {
    fontSize: '14px',
    color: '#333',
    fontWeight: 'bold'
  },
  activeFilters: {
    fontSize: '12px',
    color: '#e67e22',
    fontWeight: 'bold',
    padding: '5px 10px',
    backgroundColor: '#fef9e7',
    borderRadius: '3px'
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '5px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflow: 'hidden'
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 2fr 0.8fr 1.2fr 0.8fr 1.2fr',
    backgroundColor: '#34495e',
    color: 'white',
    padding: '15px',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  tableHeaderCell: {
    padding: '0 10px',
    cursor: 'pointer',
    userSelect: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    outline: 'none'
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 2fr 0.8fr 1.2fr 0.8fr 1.2fr',
    padding: '15px',
    borderBottom: '1px solid #eee',
    fontSize: '14px',
    alignItems: 'center',
    transition: 'background-color 0.2s ease'
  },
  tableCell: {
    padding: '0 10px'
  },
  phoneNumber: {
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  messagePreview: {
    color: '#555',
    lineHeight: '1.4'
  },
  timestamp: {
    color: '#666',
    fontSize: '13px'
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
    display: 'inline-block',
    textAlign: 'center',
    minWidth: '70px'
  },
  typeBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
    display: 'inline-block',
    textAlign: 'center',
    minWidth: '70px'
  },
  actionButtons: {
    display: 'flex',
    gap: '5px',
    flexWrap: 'wrap'
  },
  viewButton: {
    padding: '6px 12px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap'
  },
  resendButton: {
    padding: '6px 12px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap'
  },
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap'
  },
  noResults: {
    padding: '60px 20px',
    textAlign: 'center',
    color: '#6c757d'
  },
  noResultsIcon: {
    fontSize: '48px',
    marginBottom: '15px'
  },
  noResultsText: {
    fontSize: '16px',
    marginBottom: '20px',
    fontStyle: 'italic'
  },
  clearFiltersButton: {
    padding: '10px 20px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '15px',
    padding: '20px',
    flexWrap: 'wrap'
  },
  paginationButton: {
    padding: '8px 16px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    minWidth: '80px'
  },
  paginationButtonDisabled: {
    backgroundColor: '#bdc3c7',
    cursor: 'not-allowed',
    opacity: 0.6
  },
  pageNumbers: {
    display: 'flex',
    gap: '5px',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  pageButton: {
    padding: '8px 12px',
    backgroundColor: '#ecf0f1',
    color: '#2c3e50',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '14px',
    minWidth: '40px'
  },
  activePageButton: {
    backgroundColor: '#3498db',
    color: 'white'
  },
  ellipsis: {
    padding: '8px 5px',
    color: '#7f8c8d'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '5px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #eee',
    position: 'sticky',
    top: 0,
    backgroundColor: 'white',
    zIndex: 1
  },
  modalTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6c757d',
    padding: '0',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalContent: {
    padding: '20px'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #f8f9fa'
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#333',
    minWidth: '120px'
  },
  detailValue: {
    color: '#555',
    flex: '1',
    textAlign: 'right'
  },
  messageContainer: {
    marginTop: '15px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '5px'
  },
  messageContent: {
    marginTop: '10px',
    padding: '15px',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '3px',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap'
  },
  modalActions: {
    padding: '20px',
    borderTop: '1px solid #eee',
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    flexWrap: 'wrap'
  },
  modalResendButton: {
    padding: '10px 20px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  modalCloseButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  }
};

export default SMSHistory;