import React, { useState } from 'react';

const ChartsOfAccountsUrdu = () => {
  const [filters, setFilters] = useState({
    accountType: '',
    dateFrom: '',
    dateTo: '',
    level: '',
    status: 'Active'
  });

  const [accounts, setAccounts] = useState([
    {
      id: 1,
      code: '1001',
      urduName: 'بینک اکاؤنٹ',
      englishName: 'Bank Account',
      type: 'Assets',
      level: 'Main',
      balance: '500,000',
      status: 'Active'
    },
    {
      id: 2,
      code: '1002',
      urduName: 'نقد رقم',
      englishName: 'Cash in Hand',
      type: 'Assets',
      level: 'Main',
      balance: '150,000',
      status: 'Active'
    },
    {
      id: 3,
      code: '2001',
      urduName: 'قرضے',
      englishName: 'Loans Payable',
      type: 'Liabilities',
      level: 'Main',
      balance: '300,000',
      status: 'Active'
    },
    {
      id: 4,
      code: '3001',
      urduName: 'دارالحکومت',
      englishName: 'Capital',
      type: 'Equity',
      level: 'Main',
      balance: '1,000,000',
      status: 'Active'
    },
    {
      id: 5,
      code: '4001',
      urduName: 'فروخت آمدنی',
      englishName: 'Sales Revenue',
      type: 'Revenue',
      level: 'Main',
      balance: '2,500,000',
      status: 'Active'
    },
    {
      id: 6,
      code: '5001',
      urduName: 'کرایہ کے اخراجات',
      englishName: 'Rent Expenses',
      type: 'Expenses',
      level: 'Sub',
      balance: '50,000',
      status: 'Active'
    },
    {
      id: 7,
      code: '5002',
      urduName: 'تنخواہ کے اخراجات',
      englishName: 'Salary Expenses',
      type: 'Expenses',
      level: 'Sub',
      balance: '200,000',
      status: 'Active'
    }
  ]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePrint = () => {
    alert('چارٹ آف اکاؤنٹس پرنٹ ہو رہا ہے...');
  };

  const handleExport = () => {
    alert('چارٹ آف اکاؤنٹس ایکسپورٹ ہو رہا ہے...');
  };

  const handleRefresh = () => {
    // Reset filters to default
    setFilters({
      accountType: '',
      dateFrom: '',
      dateTo: '',
      level: '',
      status: 'Active'
    });
    alert('ڈیٹا ریفریش ہو رہا ہے...');
  };

  const handleClose = () => {
    alert('ونڈو بند کی جا رہی ہے...');
  };

  const handleAnalysis = () => {
    alert('جامع تجزیہ دکھایا جا رہا ہے...');
  };

  const styles = {
    container: {
      fontFamily: "'Noto Sans Urdu', 'Jameel Noori Nastaleeq', 'Alvi Lahori', 'Urdu Typesetting', sans-serif",
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      margin: 0,
      padding: 0,
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      direction: 'rtl'
    },
    wrapper: {
      backgroundColor: 'white',
      width: '100%',
      margin: 0,
      boxSizing: 'border-box'
    },
    header: {
      backgroundColor: '#2c3e50',
      color: 'white',
      padding: '15px',
      textAlign: 'center',
      fontSize: '20px',
      fontWeight: 'bold',
      boxSizing: 'border-box',
      borderBottom: '3px solid #3498db'
    },
    reportHeader: {
      backgroundColor: '#34495e',
      color: 'white',
      padding: '10px 15px',
      textAlign: 'center',
      fontSize: '16px',
      fontWeight: 'bold',
      boxSizing: 'border-box'
    },
    filterSection: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px',
      alignItems: 'center',
      padding: '12px',
      backgroundColor: '#ecf0f1',
      borderBottom: '2px solid #bdc3c7',
      fontSize: '12px',
      boxSizing: 'border-box',
      justifyContent: 'center'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '3px',
      minWidth: '120px'
    },
    label: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#2c3e50',
      textAlign: 'right'
    },
    input: {
      padding: '4px 8px',
      border: '1px solid #bdc3c7',
      fontSize: '12px',
      backgroundColor: 'white',
      boxSizing: 'border-box',
      borderRadius: '3px',
      textAlign: 'right'
    },
    select: {
      padding: '4px 8px',
      border: '1px solid #bdc3c7',
      fontSize: '12px',
      backgroundColor: 'white',
      boxSizing: 'border-box',
      borderRadius: '3px',
      textAlign: 'right'
    },
    actionBar: {
      display: 'flex',
      gap: '8px',
      padding: '10px',
      backgroundColor: '#34495e',
      alignItems: 'center',
      borderBottom: '2px solid #2c3e50',
      flexWrap: 'wrap',
      boxSizing: 'border-box',
      justifyContent: 'center'
    },
    actionBtn: {
      padding: '6px 12px',
      border: 'none',
      backgroundColor: '#3498db',
      color: 'white',
      cursor: 'pointer',
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      whiteSpace: 'nowrap',
      boxSizing: 'border-box',
      borderRadius: '4px',
      fontWeight: 'bold',
      transition: 'all 0.3s ease'
    },
    tableContainer: {
      width: '100%',
      overflowX: 'auto',
      boxSizing: 'border-box',
      margin: '0 auto'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '11px',
      backgroundColor: 'white',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    th: {
      backgroundColor: '#3498db',
      color: 'white',
      border: '1px solid #2980b9',
      padding: '8px 4px',
      textAlign: 'center',
      fontWeight: 'bold',
      fontSize: '11px',
      position: 'sticky',
      top: 0
    },
    td: {
      border: '1px solid #bdc3c7',
      padding: '6px 4px',
      textAlign: 'center',
      fontSize: '11px'
    },
    tdRight: {
      border: '1px solid #bdc3c7',
      padding: '6px 4px',
      textAlign: 'right',
      fontSize: '11px',
      fontFamily: "'Noto Sans Urdu', 'Jameel Noori Nastaleeq', sans-serif"
    },
    summarySection: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '15px',
      padding: '12px',
      backgroundColor: '#ecf0f1',
      borderTop: '2px solid #bdc3c7',
      boxSizing: 'border-box',
      justifyContent: 'center',
      marginTop: '10px'
    },
    summaryBox: {
      flex: '1',
      minWidth: '150px',
      display: 'flex',
      flexDirection: 'column',
      gap: '3px',
      backgroundColor: 'white',
      padding: '8px',
      borderRadius: '5px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      border: '1px solid #bdc3c7'
    },
    summaryLabel: {
      fontSize: '11px',
      fontWeight: '600',
      color: '#2c3e50',
      textAlign: 'center'
    },
    summaryValue: {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#27ae60',
      textAlign: 'center',
      padding: '4px',
      backgroundColor: '#ecf0f1',
      borderRadius: '3px'
    },
    typeBadge: {
      padding: '3px 8px',
      borderRadius: '12px',
      fontSize: '10px',
      fontWeight: 'bold',
      textAlign: 'center',
      display: 'inline-block'
    },
    statusBadge: {
      padding: '3px 8px',
      borderRadius: '10px',
      fontSize: '10px',
      fontWeight: 'bold',
      textAlign: 'center',
      display: 'inline-block'
    },
    reportInfo: {
      backgroundColor: '#e8f4f8',
      padding: '8px 12px',
      borderBottom: '1px solid #3498db',
      fontSize: '11px',
      textAlign: 'center',
      color: '#2c3e50',
      boxSizing: 'border-box'
    }
  };

  const getTypeStyle = (type) => {
    switch(type) {
      case 'Assets':
        return { ...styles.typeBadge, backgroundColor: '#27ae60', color: 'white' };
      case 'Liabilities':
        return { ...styles.typeBadge, backgroundColor: '#e74c3c', color: 'white' };
      case 'Equity':
        return { ...styles.typeBadge, backgroundColor: '#3498db', color: 'white' };
      case 'Revenue':
        return { ...styles.typeBadge, backgroundColor: '#f39c12', color: 'white' };
      case 'Expenses':
        return { ...styles.typeBadge, backgroundColor: '#9b59b6', color: 'white' };
      default:
        return { ...styles.typeBadge, backgroundColor: '#95a5a6', color: 'white' };
    }
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'Active':
        return { ...styles.statusBadge, backgroundColor: '#27ae60', color: 'white' };
      case 'Inactive':
        return { ...styles.statusBadge, backgroundColor: '#e74c3c', color: 'white' };
      default:
        return { ...styles.statusBadge, backgroundColor: '#95a5a6', color: 'white' };
    }
  };

  const getTypeUrduName = (type) => {
    switch(type) {
      case 'Assets':
        return 'جائیدادیں';
      case 'Liabilities':
        return 'ذمہ داریاں';
      case 'Equity':
        return 'مساوی';
      case 'Revenue':
        return 'آمدنی';
      case 'Expenses':
        return 'اخراجات';
      default:
        return type;
    }
  };

  const getLevelUrduName = (level) => {
    switch(level) {
      case 'Main':
        return 'مرکزی';
      case 'Sub':
        return 'ذیلی';
      case 'Detail':
        return 'تفصیلی';
      default:
        return level;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          چارٹ آف اکاؤنٹس - رپورٹ
        </div>
        
        <div style={styles.reportHeader}>
          مالی کھاتوں کا جامع چارٹ
        </div>

        <div style={styles.reportInfo}>
          <strong>تاریخ:</strong> 30 مارچ 2022 | <strong>شاخ:</strong> مرکزی دفتر | <strong>کرنسی:</strong> پاکستانی روپیہ
        </div>

        <div style={styles.filterSection}>
          <div style={styles.formGroup}>
            <label style={styles.label}>اکاؤنٹ کی قسم</label>
            <select 
              name="accountType"
              value={filters.accountType}
              onChange={handleFilterChange}
              style={styles.select}
            >
              <option value="">سب قسمیں</option>
              <option value="Assets">جائیدادیں</option>
              <option value="Liabilities">ذمہ داریاں</option>
              <option value="Equity">مساوی</option>
              <option value="Revenue">آمدنی</option>
              <option value="Expenses">اخراجات</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>تاریخ سے</label>
            <input 
              type="date" 
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>تاریخ تک</label>
            <input 
              type="date" 
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>سطح</label>
            <select 
              name="level"
              value={filters.level}
              onChange={handleFilterChange}
              style={styles.select}
            >
              <option value="">سب سطحیں</option>
              <option value="Main">مرکزی</option>
              <option value="Sub">ذیلی</option>
              <option value="Detail">تفصیلی</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>حالت</label>
            <select 
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              style={styles.select}
            >
              <option value="Active">فعال</option>
              <option value="Inactive">غیر فعال</option>
            </select>
          </div>
        </div>

        <div style={styles.actionBar}>
          <button style={styles.actionBtn} onClick={handleRefresh}>
            🔄 تازہ کریں
          </button>
          <button style={{...styles.actionBtn, backgroundColor: '#27ae60'}} onClick={handlePrint}>
            🖨️ پرنٹ رپورٹ
          </button>
          <button style={{...styles.actionBtn, backgroundColor: '#e67e22'}} onClick={handleExport}>
            📊 ایکسپورٹ ڈیٹا
          </button>
          <button style={{...styles.actionBtn, backgroundColor: '#9b59b6'}} onClick={handleAnalysis}>
            📈 جامع تجزیہ
          </button>
          <button style={{...styles.actionBtn, backgroundColor: '#e74c3c'}} onClick={handleClose}>
            ❌ بند کریں
          </button>
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>سیریل نمبر</th>
                <th style={styles.th}>اکاؤنٹ کوڈ</th>
                <th style={styles.th}>اکاؤنٹ کا نام (اردو)</th>
                <th style={styles.th}>اکاؤنٹ کا نام (انگریزی)</th>
                <th style={styles.th}>قسم</th>
                <th style={styles.th}>سطح</th>
                <th style={styles.th}>بقیہ رقم</th>
                <th style={styles.th}>حالت</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account, index) => (
                <tr key={account.id}>
                  <td style={styles.td}>{index + 1}</td>
                  <td style={styles.td}>{account.code}</td>
                  <td style={styles.tdRight}>{account.urduName}</td>
                  <td style={styles.td}>{account.englishName}</td>
                  <td style={styles.td}>
                    <span style={getTypeStyle(account.type)}>
                      {getTypeUrduName(account.type)}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {getLevelUrduName(account.level)}
                  </td>
                  <td style={{...styles.td, fontWeight: 'bold', color: '#2c3e50'}}>
                    {account.balance} روپیہ
                  </td>
                  <td style={styles.td}>
                    <span style={getStatusStyle(account.status)}>
                      {account.status === 'Active' ? 'فعال' : 'غیر فعال'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={styles.summarySection}>
          <div style={styles.summaryBox}>
            <div style={styles.summaryLabel}>کل اکاؤنٹس</div>
            <div style={styles.summaryValue}>{accounts.length}</div>
          </div>
          
          <div style={styles.summaryBox}>
            <div style={styles.summaryLabel}>فعال اکاؤنٹس</div>
            <div style={styles.summaryValue}>
              {accounts.filter(acc => acc.status === 'Active').length}
            </div>
          </div>

          <div style={styles.summaryBox}>
            <div style={styles.summaryLabel}>مرکزی اکاؤنٹس</div>
            <div style={styles.summaryValue}>
              {accounts.filter(acc => acc.level === 'Main').length}
            </div>
          </div>

          <div style={styles.summaryBox}>
            <div style={styles.summaryLabel}>ذیلی اکاؤنٹس</div>
            <div style={styles.summaryValue}>
              {accounts.filter(acc => acc.level === 'Sub').length}
            </div>
          </div>

          <div style={styles.summaryBox}>
            <div style={styles.summaryLabel}>کل بقیہ رقم</div>
            <div style={{...styles.summaryValue, color: '#e74c3c'}}>
              4,700,000 روپیہ
            </div>
          </div>
        </div>

        {/* Report Footer */}
        <div style={{
          backgroundColor: '#2c3e50',
          color: 'white',
          padding: '10px',
          textAlign: 'center',
          fontSize: '10px',
          boxSizing: 'border-box',
          borderTop: '2px solid #3498db'
        }}>
          <div>یہ رپورٹ کمپیوٹر سے تیار کی گئی ہے - یہ دستخط کی ضرورت نہیں رکھتی</div>
          <div style={{marginTop: '5px', opacity: '0.8'}}>
            تیاری کی تاریخ: 30 مارچ 2022 | صفحہ: 1/1 | سسٹم ورژن: 2.1.0
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartsOfAccountsUrdu;