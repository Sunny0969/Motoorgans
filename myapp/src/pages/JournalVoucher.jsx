import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const EMPTY_ROW = () => ({
  key: `row-${Date.now()}-${Math.random()}`,
  accountId: '',
  accountTitle: '',
  description: '',
  invoice: '',
  debit: '',
  credit: '',
});

const makeEmptyRows = (count = 15) => Array.from({ length: count }, () => EMPTY_ROW());

const toInputDate = (value) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
};

const calcTotals = (lines) => {
  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  return {
    totalDebit: totalDebit.toFixed(2),
    totalCredit: totalCredit.toFixed(2),
    difference: (totalDebit - totalCredit).toFixed(2),
  };
};

const JournalVoucher = () => {
  const navigate = useNavigate();
  const [docNumber, setDocNumber] = useState('');
  const [date, setDate] = useState(toInputDate());
  const [lines, setLines] = useState(makeEmptyRows());
  const [accounts, setAccounts] = useState([]);
  const [savedDoc, setSavedDoc] = useState(null);
  const [highlightRow, setHighlightRow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const totals = useMemo(() => calcTotals(lines), [lines]);

  const loadNextDoc = useCallback(async () => {
    try {
      const res = await api.get('/journal-vouchers/next-doc');
      setDocNumber(String(res.data.nextDoc || res.data.docNumber));
    } catch {
      setDocNumber('1');
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
    loadNextDoc();
    loadAccounts();
  }, [loadNextDoc, loadAccounts]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'F2' && highlightRow != null) {
        e.preventDefault();
        setLines((prev) => {
          const next = prev.filter((_, i) => i !== highlightRow);
          return next.length ? next : makeEmptyRows(5);
        });
        setHighlightRow(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [highlightRow]);

  const updateLine = (index, field, value) => {
    setLines((prev) => {
      const next = [...prev];
      const row = { ...next[index], [field]: value };
      if (field === 'accountId') {
        const acc = accounts.find((a) => String(a.Id || a.id) === String(value));
        row.accountTitle = acc
          ? (acc.accountTitle || acc.customerName || acc.Subsidary || acc.name || '')
          : '';
      }
      if (field === 'debit' && value) row.credit = '';
      if (field === 'credit' && value) row.debit = '';
      next[index] = row;
      return next;
    });
  };

  const loadByDoc = async () => {
    const doc = docNumber?.trim();
    if (!doc) return;
    setLoading(true);
    try {
      const res = await api.get(`/journal-vouchers/${doc}`);
      const data = res.data.data;
      setSavedDoc(data.doc);
      setDate(data.date ? toInputDate(data.date) : toInputDate());
      const loaded = (data.lines || []).map((l) => ({
        key: `loaded-${l.ledgerId}`,
        accountId: String(l.accountId || ''),
        accountTitle: l.accountTitle || '',
        description: l.description || '',
        invoice: l.invoice || '',
        debit: l.debit > 0 ? String(l.debit) : '',
        credit: l.credit > 0 ? String(l.credit) : '',
      }));
      while (loaded.length < 15) loaded.push(EMPTY_ROW());
      setLines(loaded);
      setMessage({ type: 'success', text: `Loaded journal voucher #${doc}.` });
    } catch (err) {
      setSavedDoc(null);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Voucher not found.' });
    } finally {
      setLoading(false);
    }
  };

  const buildPayloadLines = () => lines.filter(
    (l) => l.accountId && ((parseFloat(l.debit) || 0) > 0 || (parseFloat(l.credit) || 0) > 0),
  );

  const handleSave = async (isUpdate = false) => {
    const payloadLines = buildPayloadLines();
    if (!payloadLines.length) {
      setMessage({ type: 'error', text: 'Enter at least one line with account and amount.' });
      return;
    }
    if (Math.abs(parseFloat(totals.difference)) > 0.01) {
      setMessage({ type: 'error', text: 'Total Debit and Total Credit must be equal.' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        doc: docNumber,
        date,
        lines: payloadLines.map((l) => ({
          accountId: l.accountId,
          accountTitle: l.accountTitle,
          description: l.description,
          invoice: l.invoice,
          debit: l.debit,
          credit: l.credit,
        })),
      };
      const res = savedDoc && isUpdate
        ? await api.put(`/journal-vouchers/${savedDoc}`, payload)
        : await api.post('/journal-vouchers', payload);
      const data = res.data.data;
      setSavedDoc(data.doc);
      setDocNumber(String(data.doc));
      const loaded = (data.lines || []).map((l) => ({
        key: `saved-${l.ledgerId}`,
        accountId: String(l.accountId || ''),
        accountTitle: l.accountTitle || '',
        description: l.description || '',
        invoice: l.invoice || '',
        debit: l.debit > 0 ? String(l.debit) : '',
        credit: l.credit > 0 ? String(l.credit) : '',
      }));
      while (loaded.length < 15) loaded.push(EMPTY_ROW());
      setLines(loaded);
      setMessage({ type: 'success', text: res.data.message || 'Saved.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Save failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!savedDoc) {
      setMessage({ type: 'error', text: 'Load a saved voucher to delete.' });
      return;
    }
    if (!window.confirm(`Delete journal voucher #${savedDoc}?`)) return;
    setLoading(true);
    try {
      await api.delete(`/journal-vouchers/${savedDoc}`);
      setMessage({ type: 'success', text: 'Deleted.' });
      setSavedDoc(null);
      setLines(makeEmptyRows());
      await loadNextDoc();
      setDate(toInputDate());
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Delete failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setMessage(null);
    setSavedDoc(null);
    setHighlightRow(null);
    setLines(makeEmptyRows());
    setDate(toInputDate());
    await loadNextDoc();
  };

  return (
    <div style={s.page}>
      <div style={s.titleBar}>Journal Voucher</div>

      {message && (
        <div style={message.type === 'success' ? s.msgOk : s.msgErr}>{message.text}</div>
      )}

      <div style={s.headerRow}>
        <div style={s.headerLeft}>
          <label style={s.lbl}>Doc. #</label>
          <input
            style={s.inpSm}
            value={docNumber}
            onChange={(e) => setDocNumber(e.target.value)}
            onBlur={loadByDoc}
            onKeyDown={(e) => e.key === 'Enter' && loadByDoc()}
          />
          <label style={s.lbl}>Date</label>
          <input
            type="date"
            style={s.inpDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div style={s.headerRight}>
          <div style={s.totalBox}>
            <label style={s.lbl}>Total Debit</label>
            <input style={s.inpTotal} value={totals.totalDebit} readOnly />
          </div>
          <div style={s.totalBox}>
            <label style={s.lbl}>Total Credit</label>
            <input style={s.inpTotal} value={totals.totalCredit} readOnly />
          </div>
          <div style={s.totalBox}>
            <label style={s.lbl}>Total Difference</label>
            <input
              style={{
                ...s.inpTotal,
                color: Math.abs(parseFloat(totals.difference)) > 0.01 ? '#c00' : '#000',
                fontWeight: 'bold',
              }}
              value={totals.difference}
              readOnly
            />
          </div>
        </div>
      </div>

      <p style={s.hint}>Hint: Press &apos;F2&apos; to remove single row.</p>

      <fieldset style={s.fieldset}>
        <legend style={s.legend}>Entries</legend>
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.thSr}>Sr.#</th>
                <th style={s.thAcct}>Account Title</th>
                <th style={s.thDesc}>Description</th>
                <th style={s.thInv}>Invoice</th>
                <th style={s.thAmt}>Debit</th>
                <th style={s.thAmt}>Credit</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((row, idx) => (
                <tr
                  key={row.key}
                  style={highlightRow === idx ? s.rowSel : s.row}
                  onClick={() => setHighlightRow(idx)}
                >
                  <td style={s.td}>{idx + 1}</td>
                  <td style={s.td}>
                    <select
                      style={s.cellSelect}
                      value={row.accountId}
                      onChange={(e) => updateLine(idx, 'accountId', e.target.value)}
                    >
                      <option value="">—</option>
                      {accounts.map((a) => (
                        <option key={a.Id || a.id} value={a.Id || a.id}>
                          {a.code} — {a.accountTitle || a.Subsidary || a.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={s.td}>
                    <input
                      style={s.cellInp}
                      value={row.description}
                      onChange={(e) => updateLine(idx, 'description', e.target.value)}
                    />
                  </td>
                  <td style={s.td}>
                    <input
                      style={s.cellInpSm}
                      value={row.invoice}
                      onChange={(e) => updateLine(idx, 'invoice', e.target.value)}
                    />
                  </td>
                  <td style={s.td}>
                    <input
                      style={s.cellInpAmt}
                      value={row.debit}
                      onChange={(e) => updateLine(idx, 'debit', e.target.value)}
                      type="number"
                      min="0"
                      step="any"
                    />
                  </td>
                  <td style={s.td}>
                    <input
                      style={s.cellInpAmt}
                      value={row.credit}
                      onChange={(e) => updateLine(idx, 'credit', e.target.value)}
                      type="number"
                      min="0"
                      step="any"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </fieldset>

      <fieldset style={s.fieldset}>
        <legend style={s.legend}>Commands</legend>
        <div style={s.commands}>
          <button type="button" style={s.cmdBtn} onClick={handleRefresh} disabled={loading}>↻ Refresh</button>
          <button type="button" style={s.cmdBtnSave} onClick={() => handleSave(false)} disabled={loading}>💾 Save Record</button>
          <button type="button" style={s.cmdBtn} onClick={() => handleSave(true)} disabled={loading || !savedDoc}>✎ Update</button>
          <button type="button" style={s.cmdBtn} onClick={handleDelete} disabled={loading || !savedDoc}>✕ Delete Record</button>
          <button
            type="button"
            style={{ ...s.cmdBtn, marginLeft: 'auto', background: '#c62828', color: '#fff' }}
            onClick={() => navigate('/')}
          >
            ✕ Close
          </button>
        </div>
      </fieldset>
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
  headerRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    padding: 8,
    background: '#d4d4d4',
    border: '1px solid #888',
    marginBottom: 4,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  headerRight: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  totalBox: { display: 'flex', flexDirection: 'column', gap: 2 },
  lbl: { fontWeight: 500, fontSize: 11 },
  inpSm: { width: 56, padding: '2px 4px', border: '1px solid #888' },
  inpDate: { width: 130, padding: '2px 4px', border: '1px solid #888' },
  inpTotal: { width: 100, padding: '2px 4px', border: '1px solid #888', textAlign: 'right', background: '#fff' },
  hint: { textAlign: 'center', fontSize: 11, color: '#333', margin: '4px 0' },
  fieldset: { border: '1px solid #888', background: '#d4d4d4', padding: '6px 8px 8px', margin: '0 0 6px 0' },
  legend: { fontWeight: 'bold', padding: '0 6px', fontSize: 12 },
  tableWrap: { border: '1px solid #888', maxHeight: 380, overflow: 'auto', background: '#fff' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 11 },
  thSr: { background: '#d0d0d0', border: '1px solid #888', padding: '4px', width: 36, fontWeight: 'bold' },
  thAcct: { background: '#d0d0d0', border: '1px solid #888', padding: '4px', minWidth: 200, fontWeight: 'bold' },
  thDesc: { background: '#d0d0d0', border: '1px solid #888', padding: '4px', minWidth: 160, fontWeight: 'bold' },
  thInv: { background: '#d0d0d0', border: '1px solid #888', padding: '4px', width: 70, fontWeight: 'bold' },
  thAmt: { background: '#d0d0d0', border: '1px solid #888', padding: '4px', width: 90, fontWeight: 'bold' },
  td: { border: '1px solid #999', padding: 2, verticalAlign: 'middle' },
  row: { cursor: 'pointer' },
  rowSel: { cursor: 'pointer', background: '#b3d9ff' },
  cellSelect: { width: '100%', fontSize: 11, border: 'none', padding: '2px' },
  cellInp: { width: '100%', fontSize: 11, border: 'none', padding: '2px', boxSizing: 'border-box' },
  cellInpSm: { width: '100%', fontSize: 11, border: 'none', padding: '2px', boxSizing: 'border-box' },
  cellInpAmt: { width: '100%', fontSize: 11, border: 'none', padding: '2px', textAlign: 'right', boxSizing: 'border-box' },
  commands: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  cmdBtn: { padding: '5px 12px', border: '1px solid #666', background: '#e0e0e0', cursor: 'pointer', fontSize: 11 },
  cmdBtnSave: { padding: '5px 12px', border: '1px solid #388e3c', background: '#4caf50', color: '#fff', cursor: 'pointer', fontSize: 11 },
};

export default JournalVoucher;
