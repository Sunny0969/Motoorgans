import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const fmt = (n) => {
  const num = Number(n) || 0;
  return num.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtInt = (n) => String(Number(n) || 0);

const panelStyle = {
  border: '2px solid #999',
  backgroundColor: '#fff',
  padding: '8px',
  fontSize: '11px',
};

const sectionTitle = {
  fontWeight: 'bold',
  fontSize: '12px',
  marginBottom: '6px',
  borderBottom: '1px solid #ccc',
  paddingBottom: '4px',
};

const rowStyle = (highlight, danger) => ({
  display: 'flex',
  justifyContent: 'space-between',
  padding: '2px 4px',
  backgroundColor: highlight ? '#ffe0b2' : danger ? '#ffcdd2' : 'transparent',
  fontWeight: highlight ? 'bold' : 'normal',
});

function ActivityBlock({ title, rows }) {
  return (
    <div style={{ ...panelStyle, flex: 1, minWidth: '180px' }}>
      <div style={sectionTitle}>{title}</div>
      {rows.map((row) => (
        <div key={row.label} style={rowStyle(row.highlight, row.danger)}>
          <span>{row.label}</span>
          <span>{fmt(row.value)}</span>
        </div>
      ))}
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Daily Activity');
  const [clock, setClock] = useState(new Date().toLocaleTimeString('en-US'));

  const [backuping, setBackuping] = useState(false);
  const [backupMessage, setBackupMessage] = useState(null);

  const handleBackup = async () => {
    setBackuping(true);
    setBackupMessage(null);
    try {
      const res = await api.post('/backup', {}, { timeout: 600000 });
      setBackupMessage({ type: 'success', text: res.data.message || 'Backup completed successfully.' });
    } catch (err) {
      setBackupMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Backup failed.',
      });
    } finally {
      setBackuping(false);
    }
  };

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    const timer = setInterval(() => setClock(new Date().toLocaleTimeString('en-US')), 1000);
    const refresh = setInterval(loadDashboard, 60000);
    return () => {
      clearInterval(timer);
      clearInterval(refresh);
    };
  }, [loadDashboard]);

  const da = data?.dailyActivity;
  const fp = data?.financialPosition;

  const tabs = ['Daily Activity', 'Cash Flow', 'Bank Flow', 'Purchase', 'Sale', 'Expenses', 'Notes'];

  return (
    <div style={{ fontFamily: 'Segoe UI, Tahoma, sans-serif', backgroundColor: '#d8d8d8', minHeight: 'calc(100vh - 120px)' }}>
      {backupMessage && (
        <div style={{
          margin: '8px', padding: '10px 12px', fontSize: '12px',
          backgroundColor: backupMessage.type === 'success' ? '#e8f5e9' : '#ffebee',
          color: backupMessage.type === 'success' ? '#2e7d32' : '#c62828',
          border: `1px solid ${backupMessage.type === 'success' ? '#a5d6a7' : '#ef9a9a'}`,
          whiteSpace: 'pre-wrap',
        }}>
          {backupMessage.text}
        </div>
      )}

      <div style={{
        backgroundColor: '#fff', border: '1px solid #999', margin: '8px',
        padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px',
      }}>
        <div style={{ maxWidth: '320px', lineHeight: 1.4 }}>
          <strong>Al Qur&apos;an:</strong> &quot;And give full measure when you measure, and weigh with an even balance...&quot;
        </div>
        <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#333' }}>{clock}</div>
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{data?.displayDate || ''}</div>
      </div>

      <div style={{
        backgroundColor: '#ff8c00', color: '#fff', textAlign: 'center',
        padding: '10px', margin: '0 8px', fontSize: '28px', fontWeight: 'bold', border: '1px solid #cc7000',
      }}>
        Moto Organs Traders
      </div>

      {error && (
        <div style={{ margin: '8px', padding: '8px', background: '#ffebee', color: '#c62828', fontSize: '12px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px', alignItems: 'flex-start' }}>
        <div style={{ ...panelStyle, flex: '0 1 220px' }}>
          <div style={sectionTitle}>Stock Notification</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Short Products</span>
            <span>{fmtInt(data?.stock?.shortProducts)}</span>
          </div>
          <button type="button" style={{ fontSize: '10px', marginBottom: '8px' }} onClick={() => navigate('/page/stock')}>View</button>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>ZERO Stock Products</span>
            <span>{fmtInt(data?.stock?.zeroStock)}</span>
          </div>
          <button type="button" style={{ fontSize: '10px', marginBottom: '8px' }} onClick={() => navigate('/page/stock')}>View</button>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Stock Value</span>
            <span>{fmt(data?.stock?.stockValue)}</span>
          </div>
          <button type="button" style={{ fontSize: '10px', marginBottom: '8px' }} onClick={() => navigate('/page/product-history')}>Stock Query</button>
          <button type="button" style={{ fontSize: '10px' }} onClick={() => navigate('/vouchers/sale-order')}>
            Pending Orders ({fmtInt(data?.stock?.pendingOrders)})
          </button>
        </div>

        <div style={{ ...panelStyle, flex: '1 1 520px' }}>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '4px 10px', fontSize: '11px', border: '1px solid #999',
                  backgroundColor: activeTab === tab ? '#4a4a4a' : '#e8e8e8',
                  color: activeTab === tab ? '#fff' : '#000',
                  cursor: 'pointer',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Daily Activity' && da && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <ActivityBlock title="Purchase" rows={[
                { label: 'Cash Purchase', value: da.purchase.cashPurchase },
                { label: 'Credit Purchase', value: da.purchase.creditPurchase },
                { label: 'Total Purchase', value: da.purchase.totalPurchase, highlight: true },
                { label: 'Purchase Return', value: da.purchase.purchaseReturn },
                { label: 'Net Purchase', value: da.purchase.netPurchase, highlight: true },
              ]} />
              <ActivityBlock title="Sale" rows={[
                { label: 'Cash Sale', value: da.sale.cashSale },
                { label: 'Credit Sale', value: da.sale.creditSale },
                { label: 'Total Sale', value: da.sale.totalSale, highlight: true },
                { label: 'Sale Return', value: da.sale.saleReturn },
                { label: 'Net Sale', value: da.sale.netSale, highlight: true },
              ]} />
              <ActivityBlock title="Cash" rows={[
                { label: 'Opening Cash', value: da.cash.openingCash },
                { label: 'Cash Received', value: da.cash.cashReceived },
                { label: 'Other Incomes', value: da.cash.otherIncomes },
                { label: 'Cash Paid', value: da.cash.cashPaid },
                { label: 'Expenses', value: da.cash.expenses, danger: true },
                { label: 'Closing Cash', value: da.cash.closingCash, highlight: true },
              ]} />
              <ActivityBlock title="Bank" rows={[
                { label: 'Opening Bank Bal.', value: da.bank.openingBank, highlight: true },
                { label: 'Bank Received', value: da.bank.bankReceived },
                { label: 'Bank Paid', value: da.bank.bankPaid },
                { label: 'Closing Bank Bal.', value: da.bank.closingBank, highlight: true },
              ]} />
            </div>
          )}

          {activeTab !== 'Daily Activity' && (
            <div style={{ padding: '20px', color: '#666', textAlign: 'center' }}>
              {loading ? 'Loading...' : `${activeTab} summary uses Daily Activity data for ${data?.displayDate || 'today'}.`}
            </div>
          )}
        </div>

        <div style={{ ...panelStyle, flex: '0 1 220px' }}>
          <div style={sectionTitle}>Accounts Notification</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Mute Accounts</span><span>{fmtInt(data?.accounts?.muteAccounts)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Recv. Pending Cheques</span><span>{fmtInt(data?.accounts?.receivablePendingCheques)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Pay. Pending Cheques</span><span>{fmtInt(data?.accounts?.payablePendingCheques)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Total Receivables</span><span>{fmt(data?.accounts?.totalReceivables)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Total Payables</span><span>{fmt(data?.accounts?.totalPayables)}</span>
          </div>
        </div>
      </div>

      {fp && (
        <div style={{ ...panelStyle, margin: '8px' }}>
          <div style={sectionTitle}>Financial Position</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: '11px', minWidth: '280px' }}>
              <thead>
                <tr style={{ backgroundColor: '#e0e0e0' }}>
                  <th style={{ border: '1px solid #999', padding: '4px 8px', textAlign: 'left' }}>Assets</th>
                  <th style={{ border: '1px solid #999', padding: '4px 8px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {fp.assets.map((a) => (
                  <tr key={a.label}>
                    <td style={{ border: '1px solid #999', padding: '4px 8px' }}>{a.label}</td>
                    <td style={{ border: '1px solid #999', padding: '4px 8px', textAlign: 'right' }}>{fmt(a.amount)}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', backgroundColor: '#ffe0b2' }}>
                  <td style={{ border: '1px solid #999', padding: '4px 8px' }}>Total</td>
                  <td style={{ border: '1px solid #999', padding: '4px 8px', textAlign: 'right' }}>{fmt(fp.totalAssets)}</td>
                </tr>
              </tbody>
            </table>
            <table style={{ borderCollapse: 'collapse', fontSize: '11px', minWidth: '280px' }}>
              <thead>
                <tr style={{ backgroundColor: '#e0e0e0' }}>
                  <th style={{ border: '1px solid #999', padding: '4px 8px', textAlign: 'left' }}>Liabilities</th>
                  <th style={{ border: '1px solid #999', padding: '4px 8px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {fp.liabilities.map((a) => (
                  <tr key={a.label}>
                    <td style={{ border: '1px solid #999', padding: '4px 8px' }}>{a.label}</td>
                    <td style={{ border: '1px solid #999', padding: '4px 8px', textAlign: 'right' }}>{fmt(a.amount)}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', backgroundColor: '#ffe0b2' }}>
                  <td style={{ border: '1px solid #999', padding: '4px 8px' }}>Total</td>
                  <td style={{ border: '1px solid #999', padding: '4px 8px', textAlign: 'right' }}>{fmt(fp.totalLiabilities)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px', backgroundColor: '#c0c0c0',
        borderTop: '2px solid #999', marginTop: '8px',
      }}>
        <button type="button" onClick={loadDashboard} style={{ padding: '8px 16px', border: '1px solid #666', backgroundColor: '#e8e8e8', cursor: 'pointer' }}>
          Refresh Page Values
        </button>
        <button type="button" onClick={handleBackup} disabled={backuping} style={{ padding: '8px 16px', border: '1px solid #666', backgroundColor: backuping ? '#ccc' : '#e8e8e8', cursor: backuping ? 'wait' : 'pointer' }}>
          {backuping ? 'Backing up...' : 'Backup Data'}
        </button>
        <button type="button" onClick={() => window.print()} style={{ padding: '8px 16px', border: '1px solid #666', backgroundColor: '#e8e8e8', cursor: 'pointer' }}>
          Print
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
