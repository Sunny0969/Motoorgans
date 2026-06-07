import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import SupplierSearchModal from '../components/SupplierSearchModal';

const toInputDate = (value) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
};

const emptyForm = () => ({
  bpvNumber: '',
  issueDate: toInputDate(),
  dueDate: toInputDate(),
  accountId: '',
  accountCode: '',
  accountTitle: '',
  description: '',
  chequeNo: '',
  amount: '',
});

const BankPayment = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [records, setRecords] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [sendSMS, setSendSMS] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showAccountModal, setShowAccountModal] = useState(false);

  const loadNextBpv = useCallback(async () => {
    try {
      const res = await api.get('/bankpayments/next-bpv');
      setForm((prev) => ({ ...prev, bpvNumber: String(res.data.nextBpv) }));
    } catch {
      setForm((prev) => ({ ...prev, bpvNumber: '1' }));
    }
  }, []);

  const loadList = useCallback(async () => {
    try {
      const res = await api.get('/bankpayments/list');
      setRecords(Array.isArray(res.data) ? res.data : []);
    } catch {
      setRecords([]);
    }
  }, []);

  const loadAccounts = useCallback(async () => {
    try {
      const res = await api.get('/accounts');
      setAccounts(Array.isArray(res.data) ? res.data : []);
    } catch {
      setAccounts([]);
    }
  }, []);

  useEffect(() => {
    loadNextBpv();
    loadList();
    loadAccounts();
  }, [loadNextBpv, loadList, loadAccounts]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAccountSelect = (account) => {
    const name = account.customerName || account.accountTitle || account.name || '';
    const code = account.code || String(account.Id || '');
    const id = account.Id || account._id || account.id || '';
    setForm((prev) => ({
      ...prev,
      accountTitle: name,
      accountCode: String(code),
      accountId: String(id),
    }));
    setShowAccountModal(false);
  };

  const handleAccountDropdown = (e) => {
    const id = e.target.value;
    const acc = accounts.find((a) => String(a.Id || a.id || a._id) === String(id));
    if (!acc) {
      setForm((prev) => ({
        ...prev,
        accountId: '',
        accountCode: '',
        accountTitle: '',
      }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      accountId: String(acc.Id || acc.id || acc._id),
      accountCode: acc.code != null ? String(acc.code) : '',
      accountTitle: acc.accountTitle || acc.customerName || acc.name || acc.Subsidary || '',
    }));
  };

  const loadFormFromRecord = (record) => {
    if (!record) return;
    setSelectedRowId(record.id);
    setForm({
      bpvNumber: String(record.bpvNumber || ''),
      issueDate: record.issueDate ? toInputDate(record.issueDate) : toInputDate(),
      dueDate: record.dueDate ? toInputDate(record.dueDate) : toInputDate(),
      accountId: String(record.accountId || ''),
      accountCode: record.accountCode || '',
      accountTitle: record.accountTitle || '',
      description: record.description || '',
      chequeNo: record.chequeNo || '',
      amount: String(record.amount ?? ''),
    });
  };

  const loadByBPV = async () => {
    const bpv = form.bpvNumber?.trim();
    if (!bpv) return;
    setLoading(true);
    try {
      const res = await api.get(`/bankpayments/by-bpv/${bpv}`);
      const rows = Array.isArray(res.data) ? res.data : [];
      if (rows.length > 0) {
        loadFormFromRecord(rows[0]);
        setMessage({ type: 'success', text: `Loaded BPV #${bpv}.` });
      } else {
        setSelectedRowId(null);
        setMessage({ type: 'error', text: `BPV #${bpv} not found.` });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Load failed.' });
    } finally {
      setLoading(false);
    }
  };

  const clearEntryFields = () => {
    setForm((prev) => ({
      ...prev,
      accountId: '',
      accountCode: '',
      accountTitle: '',
      description: '',
      chequeNo: '',
      amount: '',
    }));
    setSelectedRowId(null);
  };

  const handleSave = async () => {
    if (!form.accountTitle && !form.accountId) {
      setMessage({ type: 'error', text: 'Select Paid to account.' });
      return;
    }
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setMessage({ type: 'error', text: 'Enter a valid amount.' });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        bpvNumber: form.bpvNumber,
        issueDate: form.issueDate,
        dueDate: form.dueDate,
        accountId: form.accountId,
        code: form.accountCode,
        description: form.description,
        chequeNo: form.chequeNo,
        amount: form.amount,
        sendSMS,
      };
      if (selectedRowId) {
        await api.put(`/bankpayments/${selectedRowId}`, payload);
        setMessage({ type: 'success', text: 'Bank payment updated.' });
      } else {
        const res = await api.post('/bankpayments', payload);
        setForm((prev) => ({ ...prev, bpvNumber: String(res.data.doc || prev.bpvNumber) }));
        setMessage({ type: 'success', text: res.data.message || 'Bank payment saved.' });
      }
      clearEntryFields();
      await loadList();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Save failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRowId) {
      setMessage({ type: 'error', text: 'Select a record from the list to delete.' });
      return;
    }
    if (!window.confirm('Delete this bank payment record?')) return;
    setLoading(true);
    try {
      await api.delete(`/bankpayments/${selectedRowId}`);
      setMessage({ type: 'success', text: 'Record deleted.' });
      clearEntryFields();
      await loadList();
      await loadNextBpv();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Delete failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setMessage(null);
    clearEntryFields();
    await loadNextBpv();
    await loadList();
  };

  const handleRowClick = (record) => {
    loadFormFromRecord(record);
  };

  return (
    <div style={s.page}>
      <div style={s.titleBar}>Bank Payment Voucher</div>

      {message && (
        <div style={message.type === 'success' ? s.msgOk : s.msgErr}>{message.text}</div>
      )}

      <fieldset style={s.fieldset}>
        <legend style={s.legend}>Bank Payment</legend>
        <div style={s.formGrid}>
          <div style={s.field}>
            <label style={s.lbl}>BPV #</label>
            <input
              style={s.inpSm}
              name="bpvNumber"
              value={form.bpvNumber}
              onChange={handleChange}
              onBlur={loadByBPV}
              onKeyDown={(e) => e.key === 'Enter' && loadByBPV()}
            />
          </div>
          <div style={s.fieldWide}>
            <label style={s.lbl}>Paid to</label>
            <div style={{ display: 'flex', gap: 4 }}>
              <select
                style={s.selAccount}
                value={form.accountId}
                onChange={handleAccountDropdown}
              >
                <option value="">— Select —</option>
                {accounts.map((a) => (
                  <option key={a.Id || a.id || a._id} value={a.Id || a.id || a._id}>
                    {a.code} — {a.accountTitle || a.customerName || a.Subsidary || a.name}
                  </option>
                ))}
              </select>
              <button type="button" style={s.btnSmall} onClick={() => setShowAccountModal(true)}>…</button>
            </div>
          </div>
          <div style={s.field}>
            <label style={s.lbl}>Due Date</label>
            <input
              type="date"
              style={s.inpDate}
              name="dueDate"
              value={form.dueDate}
              onChange={handleChange}
            />
          </div>
          <div style={s.field}>
            <label style={s.lbl}>Issue Date</label>
            <input
              type="date"
              style={s.inpDate}
              name="issueDate"
              value={form.issueDate}
              onChange={handleChange}
            />
          </div>
          <div style={s.fieldWide}>
            <label style={s.lbl}>Description</label>
            <input
              style={s.inp}
              name="description"
              value={form.description}
              onChange={handleChange}
            />
          </div>
          <div style={s.field}>
            <label style={s.lbl}>Cheque #</label>
            <input
              style={s.inp}
              name="chequeNo"
              value={form.chequeNo}
              onChange={handleChange}
            />
          </div>
          <div style={s.field}>
            <label style={s.lbl}>Amount</label>
            <input
              style={s.inp}
              name="amount"
              value={form.amount}
              onChange={handleChange}
              type="number"
              min="0"
              step="any"
            />
          </div>
        </div>
      </fieldset>

      <fieldset style={s.fieldset}>
        <legend style={s.legend}>Commands</legend>
        <div style={s.commands}>
          <label style={s.checkbox}>
            <input
              type="checkbox"
              checked={sendSMS}
              onChange={(e) => setSendSMS(e.target.checked)}
            />
            Send SMS
          </label>
          <button type="button" style={s.cmdBtn} onClick={handleRefresh} disabled={loading}>↻ Refresh</button>
          <button type="button" style={s.cmdBtnSave} onClick={handleSave} disabled={loading}>💾 Save Record</button>
          <button
            type="button"
            style={s.cmdBtn}
            onClick={handleSave}
            disabled={loading || !selectedRowId}
          >
            ✎ Edit Record
          </button>
          <button
            type="button"
            style={s.cmdBtn}
            onClick={handleDelete}
            disabled={loading || !selectedRowId}
          >
            ✕ Delete Record
          </button>
          <button
            type="button"
            style={{ ...s.cmdBtn, marginLeft: 'auto', background: '#c62828' }}
            onClick={() => navigate('/')}
          >
            ✕ Close
          </button>
        </div>
      </fieldset>

      <fieldset style={{ ...s.fieldset, flex: 1 }}>
        <legend style={s.legend}>List</legend>
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Sr.#</th>
                <th style={s.th}>Date</th>
                <th style={s.th}>BPV #</th>
                <th style={s.th}>Account Title</th>
                <th style={s.th}>Description</th>
                <th style={s.th}>Chq.#</th>
                <th style={s.th}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} style={s.emptyCell}>No records yet.</td>
                </tr>
              ) : (
                records.map((row, idx) => (
                  <tr
                    key={row.id || idx}
                    style={selectedRowId === row.id ? s.rowSel : s.row}
                    onClick={() => handleRowClick(row)}
                  >
                    <td style={s.td}>{idx + 1}</td>
                    <td style={s.td}>{row.date}</td>
                    <td style={s.td}>{row.bpvNumber}</td>
                    <td style={{ ...s.td, textAlign: 'left' }}>{row.accountTitle}</td>
                    <td style={{ ...s.td, textAlign: 'left' }}>{row.description}</td>
                    <td style={s.td}>{row.chequeNo}</td>
                    <td style={{ ...s.td, textAlign: 'right' }}>
                      {parseFloat(row.amount || 0).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </fieldset>

      {showAccountModal && (
        <SupplierSearchModal
          isOpen={showAccountModal}
          onClose={() => setShowAccountModal(false)}
          onSelectSupplier={handleAccountSelect}
          selectedSupplier={null}
        />
      )}
    </div>
  );
};

const s = {
  page: {
    fontFamily: 'Tahoma, Segoe UI, sans-serif',
    fontSize: 12,
    background: '#c0c0c0',
    minHeight: '100vh',
    padding: 8,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
  },
  titleBar: {
    background: 'linear-gradient(180deg, #4a4a4a 0%, #2d2d2d 100%)',
    color: '#fff',
    textAlign: 'center',
    padding: '6px 8px',
    fontWeight: 'bold',
    border: '1px solid #1a1a1a',
    marginBottom: 6,
  },
  msgOk: { background: '#d4edda', color: '#155724', padding: 8, marginBottom: 6, border: '1px solid #a5d6a7' },
  msgErr: { background: '#f8d7da', color: '#721c24', padding: 8, marginBottom: 6, border: '1px solid #ef9a9a' },
  fieldset: {
    border: '1px solid #888',
    background: '#d4d4d4',
    padding: '8px 10px 10px',
    marginBottom: 6,
    margin: '0 0 6px 0',
  },
  legend: {
    fontWeight: 'bold',
    padding: '0 6px',
    fontSize: 12,
  },
  formGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'flex-end',
  },
  field: { display: 'flex', flexDirection: 'column', gap: 2 },
  fieldWide: { display: 'flex', flexDirection: 'column', gap: 2, flex: '1 1 220px', minWidth: 200 },
  lbl: { fontWeight: 500, fontSize: 11 },
  inpSm: { width: 56, padding: '2px 4px', border: '1px solid #888' },
  inpDate: { width: 130, padding: '2px 4px', border: '1px solid #888' },
  inp: { padding: '2px 4px', border: '1px solid #888', minWidth: 100 },
  selAccount: { minWidth: 220, padding: '2px 4px', border: '1px solid #888', flex: 1 },
  btnSmall: { padding: '2px 8px', border: '1px solid #888', background: '#e8e8e8', cursor: 'pointer' },
  commands: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  checkbox: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 },
  cmdBtn: {
    padding: '5px 12px',
    border: '1px solid #666',
    background: '#e0e0e0',
    cursor: 'pointer',
    fontSize: 11,
  },
  cmdBtnSave: {
    padding: '5px 12px',
    border: '1px solid #388e3c',
    background: '#4caf50',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 11,
  },
  tableWrap: { border: '1px solid #888', maxHeight: 320, overflow: 'auto', background: '#fff' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 11 },
  th: { background: '#d0d0d0', border: '1px solid #888', padding: '4px 6px', fontWeight: 'bold' },
  td: { border: '1px solid #999', padding: '3px 6px', textAlign: 'center' },
  row: { cursor: 'pointer' },
  rowSel: { cursor: 'pointer', background: '#b3d9ff' },
  emptyCell: { textAlign: 'center', padding: 16, color: '#666' },
};

export default BankPayment;
