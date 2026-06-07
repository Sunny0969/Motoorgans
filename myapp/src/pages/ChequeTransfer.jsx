import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  docNumber: '',
  transferDate: toInputDate(),
  transferredToId: '',
  transferredToName: '',
  description: '',
  transferStatus: 'Pending',
  chequeNo: '',
  dueDate: toInputDate(),
  amount: '',
  sourceLedgerId: '',
});

const ChequeTransfer = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [pendingCheques, setPendingCheques] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [listFilter, setListFilter] = useState('received');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPendingId, setSelectedPendingId] = useState(null);
  const [savedTransferId, setSavedTransferId] = useState(null);
  const [sendSMS, setSendSMS] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showAccountModal, setShowAccountModal] = useState(false);

  const filteredPending = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return pendingCheques;
    return pendingCheques.filter((row) => {
      const cheque = (row.chequeNo || '').toLowerCase();
      const desc = (row.description || '').toLowerCase();
      const acct = (row.accountTitle || '').toLowerCase();
      const amt = String(row.amount || '');
      return cheque.includes(term) || desc.includes(term) || acct.includes(term) || amt.includes(term);
    });
  }, [pendingCheques, searchTerm]);

  const loadNextDoc = useCallback(async () => {
    try {
      const res = await api.get('/cheque-transfers/next-doc');
      setForm((prev) => ({ ...prev, docNumber: String(res.data.nextDoc) }));
    } catch {
      setForm((prev) => ({ ...prev, docNumber: '1' }));
    }
  }, []);

  const loadPending = useCallback(async (filter) => {
    try {
      const res = await api.get('/cheque-transfers/pending', {
        params: { filter: filter || listFilter },
      });
      setPendingCheques(Array.isArray(res.data) ? res.data : []);
    } catch {
      setPendingCheques([]);
    }
  }, [listFilter]);

  const loadAccounts = useCallback(async () => {
    try {
      const res = await api.get('/accounts');
      setAccounts(Array.isArray(res.data) ? res.data : []);
    } catch {
      setAccounts([]);
    }
  }, []);

  useEffect(() => {
    loadNextDoc();
    loadPending('received');
    loadAccounts();
  }, [loadNextDoc, loadPending, loadAccounts]);

  useEffect(() => {
    loadPending(listFilter);
  }, [listFilter, loadPending]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (status) => {
    setForm((prev) => ({ ...prev, transferStatus: status }));
  };

  const handleAccountSelect = (account) => {
    const name = account.customerName || account.accountTitle || account.name || '';
    const id = account.Id || account._id || account.id || '';
    setForm((prev) => ({
      ...prev,
      transferredToId: String(id),
      transferredToName: name,
    }));
    setShowAccountModal(false);
  };

  const handleAccountDropdown = (e) => {
    const id = e.target.value;
    const acc = accounts.find((a) => String(a.Id || a.id || a._id) === String(id));
    setForm((prev) => ({
      ...prev,
      transferredToId: id,
      transferredToName: acc
        ? (acc.accountTitle || acc.customerName || acc.name || acc.Subsidary || '')
        : '',
    }));
  };

  const handlePendingRowClick = (row) => {
    setSelectedPendingId(row.id);
    setSavedTransferId(null);
    setForm((prev) => ({
      ...prev,
      sourceLedgerId: String(row.sourceLedgerId || row.id),
      chequeNo: row.chequeNo || '',
      dueDate: row.dueDate ? toInputDate(row.dueDate) : prev.dueDate,
      amount: String(row.amount ?? ''),
      description: row.description || prev.description,
    }));
    setMessage(null);
  };

  const loadByDoc = async () => {
    const doc = form.docNumber?.trim();
    if (!doc) return;
    setLoading(true);
    try {
      const res = await api.get(`/cheque-transfers/by-doc/${doc}`);
      const data = res.data;
      setSavedTransferId(data.id);
      setSelectedPendingId(null);
      setForm({
        docNumber: String(data.doc || ''),
        transferDate: data.transferDate ? toInputDate(data.transferDate) : toInputDate(),
        transferredToId: String(data.transferredToId || ''),
        transferredToName: data.transferredToName || '',
        description: data.description || '',
        transferStatus: data.transferStatus || 'Pending',
        chequeNo: data.chequeNo || '',
        dueDate: data.dueDate ? toInputDate(data.dueDate) : toInputDate(),
        amount: String(data.amount ?? ''),
        sourceLedgerId: data.sourceLedgerId ? String(data.sourceLedgerId) : '',
      });
      setMessage({ type: 'success', text: `Loaded transfer Doc #${doc}.` });
    } catch (err) {
      setSavedTransferId(null);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Transfer document not found.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.transferredToId) {
      setMessage({ type: 'error', text: 'Select Transferred to account.' });
      return;
    }
    if (!form.chequeNo) {
      setMessage({ type: 'error', text: 'Cheque number is required.' });
      return;
    }
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setMessage({ type: 'error', text: 'Enter a valid amount.' });
      return;
    }
    if (!savedTransferId && !form.sourceLedgerId) {
      setMessage({ type: 'error', text: 'Select a cheque from the pending list.' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        docNumber: form.docNumber,
        transferDate: form.transferDate,
        transferredToId: form.transferredToId,
        description: form.description,
        transferStatus: form.transferStatus,
        chequeNo: form.chequeNo,
        dueDate: form.dueDate,
        amount: form.amount,
        sourceLedgerId: form.sourceLedgerId,
        sendSMS,
      };

      if (savedTransferId) {
        await api.put(`/cheque-transfers/${savedTransferId}`, payload);
        setMessage({ type: 'success', text: 'Cheque transfer updated.' });
      } else {
        const res = await api.post('/cheque-transfers', payload);
        setSavedTransferId(res.data.id);
        setForm((prev) => ({ ...prev, docNumber: String(res.data.doc || prev.docNumber) }));
        setMessage({ type: 'success', text: res.data.message || 'Cheque transfer saved.' });
      }
      setSelectedPendingId(null);
      await loadPending(listFilter);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Save failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setMessage(null);
    setSelectedPendingId(null);
    setSavedTransferId(null);
    setSearchTerm('');
    setForm(emptyForm());
    await loadNextDoc();
    await loadPending(listFilter);
  };

  return (
    <div style={s.page}>
      <div style={s.titleBar}>Cheque Transfer Voucher</div>

      {message && (
        <div style={message.type === 'success' ? s.msgOk : s.msgErr}>{message.text}</div>
      )}

      <fieldset style={s.fieldset}>
        <legend style={s.legend}>Cheque Transfer Voucher</legend>
        <div style={s.formGrid}>
          <div style={s.field}>
            <label style={s.lbl}>Doc. #</label>
            <input
              style={s.inpSm}
              name="docNumber"
              value={form.docNumber}
              onChange={handleChange}
              onBlur={loadByDoc}
              onKeyDown={(e) => e.key === 'Enter' && loadByDoc()}
            />
          </div>
          <div style={s.field}>
            <label style={s.lbl}>Transfer Date</label>
            <input
              type="date"
              style={s.inpDate}
              name="transferDate"
              value={form.transferDate}
              onChange={handleChange}
            />
          </div>
          <div style={s.fieldWide}>
            <label style={s.lbl}>Transferred to</label>
            <div style={{ display: 'flex', gap: 4 }}>
              <select
                style={s.selAccount}
                value={form.transferredToId}
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
            <label style={s.lbl}>Status</label>
            <div style={s.radioGroup}>
              <label style={s.radioLbl}>
                <input
                  type="radio"
                  name="transferStatus"
                  checked={form.transferStatus === 'Pending'}
                  onChange={() => handleStatusChange('Pending')}
                />
                Pending
              </label>
              <label style={s.radioLbl}>
                <input
                  type="radio"
                  name="transferStatus"
                  checked={form.transferStatus === 'Cash'}
                  onChange={() => handleStatusChange('Cash')}
                />
                Cash
              </label>
            </div>
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
            style={{ ...s.cmdBtn, marginLeft: 'auto', background: '#c62828' }}
            onClick={() => navigate('/')}
          >
            ✕ Close
          </button>
        </div>
      </fieldset>

      <fieldset style={{ ...s.fieldset, flex: 1 }}>
        <legend style={s.legend}>Pending Cheque List</legend>
        <div style={s.listToolbar}>
          <div style={s.radioGroup}>
            <label style={s.radioLbl}>
              <input
                type="radio"
                name="listFilter"
                checked={listFilter === 'received'}
                onChange={() => setListFilter('received')}
              />
              Received
            </label>
            <label style={s.radioLbl}>
              <input
                type="radio"
                name="listFilter"
                checked={listFilter === 'paid'}
                onChange={() => setListFilter('paid')}
              />
              Paid
            </label>
            <label style={s.radioLbl}>
              <input
                type="radio"
                name="listFilter"
                checked={listFilter === 'all'}
                onChange={() => setListFilter('all')}
              />
              All
            </label>
          </div>
          <div style={s.searchRow}>
            <span style={s.lbl}>Type here to search</span>
            <input
              style={s.searchInp}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder=""
            />
          </div>
        </div>
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Sr.#</th>
                <th style={s.th}>Cheque #</th>
                <th style={s.th}>Due Date</th>
                <th style={s.th}>Description</th>
                <th style={s.th}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredPending.length === 0 ? (
                <tr>
                  <td colSpan={5} style={s.emptyCell}>No pending cheques found.</td>
                </tr>
              ) : (
                filteredPending.map((row, idx) => (
                  <tr
                    key={row.id || idx}
                    style={selectedPendingId === row.id ? s.rowSel : s.row}
                    onClick={() => handlePendingRowClick(row)}
                  >
                    <td style={s.td}>{idx + 1}</td>
                    <td style={s.td}>{row.chequeNo}</td>
                    <td style={s.td}>{row.dueDateDisplay || row.dueDate}</td>
                    <td style={{ ...s.td, textAlign: 'left' }}>{row.description}</td>
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
    margin: '0 0 6px 0',
  },
  legend: { fontWeight: 'bold', padding: '0 6px', fontSize: 12 },
  formGrid: { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end' },
  field: { display: 'flex', flexDirection: 'column', gap: 2 },
  fieldWide: { display: 'flex', flexDirection: 'column', gap: 2, flex: '1 1 200px', minWidth: 180 },
  lbl: { fontWeight: 500, fontSize: 11 },
  inpSm: { width: 56, padding: '2px 4px', border: '1px solid #888' },
  inpDate: { width: 130, padding: '2px 4px', border: '1px solid #888' },
  inp: { padding: '2px 4px', border: '1px solid #888', minWidth: 90 },
  selAccount: { minWidth: 200, padding: '2px 4px', border: '1px solid #888', flex: 1 },
  btnSmall: { padding: '2px 8px', border: '1px solid #888', background: '#e8e8e8', cursor: 'pointer' },
  radioGroup: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  radioLbl: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer' },
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
  listToolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  searchRow: { display: 'flex', alignItems: 'center', gap: 6 },
  searchInp: { width: 180, padding: '2px 6px', border: '1px solid #888' },
  tableWrap: { border: '1px solid #888', maxHeight: 280, overflow: 'auto', background: '#fff' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 11 },
  th: { background: '#d0d0d0', border: '1px solid #888', padding: '4px 6px', fontWeight: 'bold' },
  td: { border: '1px solid #999', padding: '3px 6px', textAlign: 'center' },
  row: { cursor: 'pointer' },
  rowSel: { cursor: 'pointer', background: '#b3d9ff' },
  emptyCell: { textAlign: 'center', padding: 16, color: '#666' },
};

export default ChequeTransfer;
