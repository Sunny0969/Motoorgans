import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const toInputDate = (value) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
};

const calcAmounts = (fields) => {
  const basicSalary = parseFloat(fields.basicSalary) || 0;
  const workingDays = parseFloat(fields.workingDays) || 0;
  const overTime = parseFloat(fields.overTime) || 0;
  const otRate = parseFloat(fields.otRate) || 0;
  const preBalance = parseFloat(fields.preBalance) || 0;
  const paid = parseFloat(fields.paid) || 0;

  const salary = workingDays > 0 ? (basicSalary / 30) * workingDays : basicSalary;
  const overTimeSalary = overTime * otRate;
  const netSalary = salary + overTimeSalary;
  const balance = preBalance + netSalary - paid;

  return {
    salary: salary.toFixed(2),
    overTimeSalary: overTimeSalary.toFixed(2),
    netSalary: netSalary.toFixed(2),
    balance: balance.toFixed(2),
  };
};

const emptyForm = () => ({
  slipId: '',
  recordKey: '',
  dated: toInputDate(),
  employeeId: '',
  guardian: '',
  contact: '',
  basicSalary: '',
  workingDays: '30',
  salary: '',
  overTime: '',
  overTimeSalary: '',
  netSalary: '',
  preBalance: '',
  paid: '',
  balance: '',
  otRate: '0',
});

const SalarySlip = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [savedSlipId, setSavedSlipId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const guardians = useMemo(() => {
    const set = new Set(employees.map((e) => e.guardian).filter(Boolean));
    return [...set];
  }, [employees]);

  const loadNextId = useCallback(async () => {
    try {
      const res = await api.get('/salary-slips/next-id');
      setForm((prev) => ({ ...prev, slipId: String(res.data.nextId || res.data.slipId) }));
    } catch {
      setForm((prev) => ({ ...prev, slipId: '1' }));
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      const res = await api.get('/salary-slips/employees');
      setEmployees(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      setEmployees([]);
    }
  }, []);

  const loadList = useCallback(async () => {
    try {
      const res = await api.get('/salary-slips/list');
      setRecords(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      setRecords([]);
    }
  }, []);

  useEffect(() => {
    loadNextId();
    loadEmployees();
    loadList();
  }, [loadNextId, loadEmployees, loadList]);

  const applyCalculated = (next) => {
    const calc = calcAmounts(next);
    return { ...next, ...calc };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => applyCalculated({ ...prev, [name]: value }));
  };

  const handleEmployeeChange = async (e) => {
    const id = e.target.value;
    if (!id) {
      setForm((prev) => applyCalculated({
        ...prev,
        employeeId: '',
        guardian: '',
        contact: '',
        basicSalary: '',
        preBalance: '',
        otRate: '0',
      }));
      return;
    }
    try {
      const res = await api.get(`/salary-slips/employees/${id}`);
      const emp = res.data.data;
      setForm((prev) => applyCalculated({
        ...prev,
        employeeId: String(id),
        guardian: emp.guardian || '',
        contact: emp.contact || '',
        basicSalary: String(emp.basicSalary ?? ''),
        preBalance: String(emp.preBalance ?? 0),
        otRate: String(emp.otRate ?? 0),
      }));
    } catch {
      const emp = employees.find((x) => String(x.id) === String(id));
      if (emp) {
        setForm((prev) => applyCalculated({
          ...prev,
          employeeId: String(id),
          guardian: emp.guardian || '',
          contact: emp.contact || '',
          basicSalary: String(emp.basicSalary ?? ''),
          preBalance: String(emp.preBalance ?? 0),
          otRate: String(emp.otRate ?? 0),
        }));
      }
    }
  };

  const loadFormFromRecord = (record) => {
    setSelectedRowId(record.recordKey || record.id);
    setSavedSlipId(record.recordKey || record.id);
    setForm(applyCalculated({
      slipId: String(record.slipNo || record.slipId || ''),
      recordKey: record.recordKey || '',
      dated: record.dated ? toInputDate(record.dated) : toInputDate(),
      employeeId: String(record.employeeId || ''),
      guardian: record.guardian || '',
      contact: record.contact || '',
      basicSalary: String(record.basicSalary ?? ''),
      workingDays: String(record.workingDays ?? '30'),
      salary: String(record.salary ?? ''),
      overTime: String(record.overTime ?? ''),
      overTimeSalary: String(record.overTimeSalary ?? ''),
      netSalary: String(record.netSalary ?? ''),
      preBalance: String(record.preBalance ?? ''),
      paid: String(record.paid ?? ''),
      balance: String(record.balance ?? ''),
      otRate: '0',
    }));
  };

  const loadBySlipId = async () => {
    const id = form.slipId?.trim();
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/salary-slips/${id}`);
      loadFormFromRecord(res.data.data);
      setMessage({ type: 'success', text: `Loaded slip #${id}.` });
    } catch (err) {
      setSavedSlipId(null);
      setSelectedRowId(null);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Slip not found.' });
    } finally {
      setLoading(false);
    }
  };

  const buildPayload = () => ({
    slipId: form.slipId,
    recordKey: form.recordKey,
    dated: form.dated,
    employeeId: form.employeeId,
    basicSalary: form.basicSalary,
    workingDays: form.workingDays,
    salary: form.salary,
    overTime: form.overTime,
    overTimeSalary: form.overTimeSalary,
    netSalary: form.netSalary,
    preBalance: form.preBalance,
    paid: form.paid,
  });

  const handleSave = async () => {
    if (!form.employeeId) {
      setMessage({ type: 'error', text: 'Select an employee.' });
      return;
    }
    setLoading(true);
    try {
      const payload = buildPayload();
      const res = savedSlipId
        ? await api.put(`/salary-slips/${encodeURIComponent(savedSlipId)}`, payload)
        : await api.post('/salary-slips', payload);
      loadFormFromRecord(res.data.data);
      setMessage({ type: 'success', text: res.data.message || 'Saved.' });
      await loadList();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Save failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!savedSlipId) {
      setMessage({ type: 'error', text: 'Select a slip from the list to delete.' });
      return;
    }
    if (!window.confirm(`Delete salary slip #${savedSlipId}?`)) return;
    setLoading(true);
    try {
      await api.delete(`/salary-slips/${encodeURIComponent(savedSlipId)}`, {
        params: { recordKey: form.recordKey || savedSlipId },
      });
      setMessage({ type: 'success', text: 'Deleted.' });
      setSelectedRowId(null);
      setSavedSlipId(null);
      setForm(emptyForm());
      await loadNextId();
      await loadList();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Delete failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setMessage(null);
    setSelectedRowId(null);
    setSavedSlipId(null);
    setForm({ ...emptyForm(), recordKey: '' });
    await loadNextId();
    await loadList();
    await loadEmployees();
  };

  const handlePrint = () => {
    if (!form.employeeId) {
      setMessage({ type: 'error', text: 'Nothing to print — select employee and save first.' });
      return;
    }
    const emp = employees.find((e) => String(e.id) === String(form.employeeId));
    const empName = emp?.name || '';
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Salary Slip #${form.slipId}</title>
      <style>
        body { font-family: Tahoma, sans-serif; font-size: 12px; padding: 20px; }
        h2 { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        td { padding: 6px 8px; border: 1px solid #ccc; }
        .lbl { font-weight: bold; width: 40%; background: #f0f0f0; }
        .right { text-align: right; }
      </style></head><body>
      <h2>Moto Organs Traders — Salary Slip</h2>
      <p><b>Slip ID:</b> ${form.slipId} &nbsp; <b>Date:</b> ${form.dated}</p>
      <p><b>Employee:</b> ${empName} &nbsp; <b>Guardian:</b> ${form.guardian}</p>
      <p><b>Contact:</b> ${form.contact}</p>
      <table>
        <tr><td class="lbl">Basic Salary</td><td class="right">${form.basicSalary}</td></tr>
        <tr><td class="lbl">Working Days</td><td class="right">${form.workingDays}</td></tr>
        <tr><td class="lbl">Salary</td><td class="right">${form.salary}</td></tr>
        <tr><td class="lbl">Over Time</td><td class="right">${form.overTime}</td></tr>
        <tr><td class="lbl">Over Time Salary</td><td class="right">${form.overTimeSalary}</td></tr>
        <tr><td class="lbl">Net Salary</td><td class="right"><b>${form.netSalary}</b></td></tr>
        <tr><td class="lbl">Pre. Balance</td><td class="right">${form.preBalance}</td></tr>
        <tr><td class="lbl">Paid</td><td class="right">${form.paid}</td></tr>
        <tr><td class="lbl">Balance</td><td class="right"><b>${form.balance}</b></td></tr>
      </table>
      <script>setTimeout(function(){ window.print(); }, 400);</script>
      </body></html>
    `);
    w.document.close();
  };

  const employeeName = (id) => {
    const e = employees.find((x) => String(x.id) === String(id));
    return e?.name || records.find((r) => String(r.employeeId) === String(id))?.employeeName || '';
  };

  return (
    <div style={s.page}>
      <div style={s.titleBar}>Salary Slip</div>

      {message && (
        <div style={message.type === 'success' ? s.msgOk : s.msgErr}>{message.text}</div>
      )}

      <fieldset style={s.fieldset}>
        <legend style={s.legend}>Enter Required Information</legend>
        <div style={s.columns}>
          <div style={s.col}>
            <div style={s.field}>
              <label style={s.lbl}>Slip ID</label>
              <input
                style={s.inpSm}
                name="slipId"
                value={form.slipId}
                onChange={handleChange}
                onBlur={loadBySlipId}
                onKeyDown={(e) => e.key === 'Enter' && loadBySlipId()}
              />
            </div>
            <div style={s.field}>
              <label style={s.lbl}>Dated</label>
              <input type="date" style={s.inpDate} name="dated" value={form.dated} onChange={handleChange} />
            </div>
            <div style={s.field}>
              <label style={s.lbl}>Employee</label>
              <select style={s.inp} value={form.employeeId} onChange={handleEmployeeChange}>
                <option value="">— Select —</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
            <div style={s.field}>
              <label style={s.lbl}>Guardian</label>
              <select style={s.inp} name="guardian" value={form.guardian} onChange={handleChange}>
                <option value="">—</option>
                {guardians.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div style={s.field}>
              <label style={s.lbl}>Contact(s)</label>
              <input style={s.inp} name="contact" value={form.contact} onChange={handleChange} />
            </div>
          </div>

          <div style={s.col}>
            <div style={s.field}>
              <label style={s.lbl}>Basic Salary</label>
              <input style={s.inp} name="basicSalary" value={form.basicSalary} onChange={handleChange} type="number" step="any" />
            </div>
            <div style={s.field}>
              <label style={s.lbl}>Working Days</label>
              <input style={s.inp} name="workingDays" value={form.workingDays} onChange={handleChange} type="number" step="any" />
            </div>
            <div style={s.field}>
              <label style={s.lbl}>Salary</label>
              <input style={s.inpRo} name="salary" value={form.salary} readOnly />
            </div>
            <div style={s.field}>
              <label style={s.lbl}>Over Time</label>
              <input style={s.inp} name="overTime" value={form.overTime} onChange={handleChange} type="number" step="any" />
            </div>
            <div style={s.field}>
              <label style={s.lbl}>Over Time Salary</label>
              <input style={s.inpRo} name="overTimeSalary" value={form.overTimeSalary} readOnly />
            </div>
            <div style={s.field}>
              <label style={s.lbl}>Net Salary</label>
              <input style={s.inpRo} name="netSalary" value={form.netSalary} readOnly />
            </div>
          </div>

          <div style={s.col}>
            <div style={s.field}>
              <label style={s.lbl}>Pre. Balance</label>
              <input style={s.inp} name="preBalance" value={form.preBalance} onChange={handleChange} type="number" step="any" />
            </div>
            <div style={s.field}>
              <label style={s.lbl}>Paid</label>
              <input style={s.inp} name="paid" value={form.paid} onChange={handleChange} type="number" step="any" />
            </div>
            <div style={s.field}>
              <label style={s.lbl}>Balance</label>
              <input style={s.inpRo} name="balance" value={form.balance} readOnly />
            </div>
          </div>
        </div>
      </fieldset>

      <div style={s.actionBar}>
        <button type="button" style={s.cmdBtn} onClick={handleRefresh} disabled={loading}>↻ Refresh</button>
        <button type="button" style={s.cmdBtnSave} onClick={handleSave} disabled={loading}>📄 Generate</button>
        <button type="button" style={s.cmdBtn} onClick={handleSave} disabled={loading || !savedSlipId}>✎ Edit</button>
        <button type="button" style={s.cmdBtn} onClick={handleDelete} disabled={loading || !savedSlipId}>✕ Delete</button>
        <button type="button" style={s.cmdBtn} onClick={handlePrint} disabled={!form.slipId}>🖨 Print</button>
        <button type="button" style={{ ...s.cmdBtn, marginLeft: 'auto', background: '#c62828', color: '#fff' }} onClick={() => navigate('/')}>✕ Close</button>
      </div>

      <fieldset style={{ ...s.fieldset, flex: 1 }}>
        <legend style={s.legend}>List</legend>
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Sr.#</th>
                <th style={s.th}>Slip ID</th>
                <th style={s.th}>Date</th>
                <th style={s.th}>Employee</th>
                <th style={s.th}>Net Salary</th>
                <th style={s.th}>Paid</th>
                <th style={s.th}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan={7} style={s.emptyCell}>No salary slips yet.</td></tr>
              ) : (
                records.map((row, idx) => (
                  <tr
                    key={row.id || idx}
                    style={selectedRowId === row.id ? s.rowSel : s.row}
                    onClick={() => loadFormFromRecord(row)}
                  >
                    <td style={s.td}>{idx + 1}</td>
                    <td style={s.td}>{row.slipId}</td>
                    <td style={s.td}>{row.dateDisplay || row.dated}</td>
                    <td style={{ ...s.td, textAlign: 'left' }}>{row.employeeName || employeeName(row.employeeId)}</td>
                    <td style={{ ...s.td, textAlign: 'right' }}>{parseFloat(row.netSalary || 0).toFixed(2)}</td>
                    <td style={{ ...s.td, textAlign: 'right' }}>{parseFloat(row.paid || 0).toFixed(2)}</td>
                    <td style={{ ...s.td, textAlign: 'right' }}>{parseFloat(row.balance || 0).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
  fieldset: { border: '1px solid #888', background: '#d4d4d4', padding: '8px 10px 10px', margin: '0 0 6px 0' },
  legend: { fontWeight: 'bold', padding: '0 6px', fontSize: 12 },
  columns: { display: 'flex', flexWrap: 'wrap', gap: 16 },
  col: { flex: '1 1 200px', minWidth: 180, display: 'flex', flexDirection: 'column', gap: 6 },
  field: { display: 'flex', flexDirection: 'column', gap: 2 },
  lbl: { fontWeight: 500, fontSize: 11 },
  inpSm: { width: 56, padding: '2px 4px', border: '1px solid #888' },
  inpDate: { width: 130, padding: '2px 4px', border: '1px solid #888' },
  inp: { padding: '2px 4px', border: '1px solid #888', width: '100%', boxSizing: 'border-box' },
  inpRo: { padding: '2px 4px', border: '1px solid #888', width: '100%', background: '#f5f5f5', boxSizing: 'border-box' },
  actionBar: { display: 'flex', flexWrap: 'wrap', gap: 6, padding: 8, background: '#d4d4d4', border: '1px solid #888', marginBottom: 6 },
  cmdBtn: { padding: '5px 12px', border: '1px solid #666', background: '#e0e0e0', cursor: 'pointer', fontSize: 11 },
  cmdBtnSave: { padding: '5px 12px', border: '1px solid #388e3c', background: '#4caf50', color: '#fff', cursor: 'pointer', fontSize: 11 },
  tableWrap: { border: '1px solid #888', minHeight: 160, maxHeight: 280, overflow: 'auto', background: '#fff' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 11 },
  th: { background: '#d0d0d0', border: '1px solid #888', padding: '4px 6px', fontWeight: 'bold' },
  td: { border: '1px solid #999', padding: '3px 6px', textAlign: 'center' },
  row: { cursor: 'pointer' },
  rowSel: { cursor: 'pointer', background: '#b3d9ff' },
  emptyCell: { textAlign: 'center', padding: 16, color: '#666' },
};

export default SalarySlip;
