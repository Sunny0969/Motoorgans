const { connectDB, sql } = require('../config/mssqlconfig');

const LIST_ORDER = 's.date DESC, s.empid DESC';

function mapEmployeeRow(row) {
  return {
    id: row.id,
    name: row.name || '',
    guardian: row.gardian || '',
    contact: row.contact || '',
    basicSalary: row.salary ?? 0,
    otRate: row.otrate ?? 0,
    preBalance: (parseFloat(row.stloan) || 0) + (parseFloat(row.ltloan) || 0),
    designation: row.designation || '',
    department: row.department || '',
  };
}

function mapSalarySlipRow(row) {
  const preBalance = parseFloat(row.loan) || 0;
  const netSalary = parseFloat(row.netsalary) || 0;
  const paid = parseFloat(row.advance) || 0;
  const slipNo = row.slipNo != null ? row.slipNo : row.id;
  return {
    id: row.recordKey || row.id,
    recordKey: row.recordKey || (row.id instanceof Date ? row.id.toISOString() : String(row.id)),
    slipId: slipNo,
    slipNo,
    dated: row.date ? new Date(row.date).toISOString().slice(0, 10) : '',
    dateDisplay: row.date
      ? new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
      : '',
    employeeId: row.empid,
    employeeName: row.employeeName || '',
    guardian: row.gardian || '',
    contact: row.contact || '',
    basicSalary: row.grosssalary ?? 0,
    workingDays: row.days ?? 0,
    salary: row.salary ?? 0,
    overTime: row.overtime ?? 0,
    overTimeSalary: row.salaryot ?? 0,
    netSalary,
    preBalance,
    paid,
    balance: preBalance + netSalary - paid,
    month: row.month,
    year: row.year,
  };
}

function numberedSubquery() {
  return `
    SELECT s.*, e.name AS employeeName, e.gardian, e.contact,
      s.id AS recordKey,
      ROW_NUMBER() OVER (ORDER BY ${LIST_ORDER}) AS slipNo
    FROM SalarySlips s
    LEFT JOIN Employee e ON e.id = s.empid
  `;
}

async function fetchEmployeesForSalary() {
  const pool = await connectDB();
  const result = await pool.request().query(`
    SELECT id, name, gardian, contact, salary, otrate, stloan, ltloan, designation, department
    FROM Employee
    ORDER BY name
  `);
  return result.recordset.map(mapEmployeeRow);
}

async function fetchEmployeeById(id) {
  const pool = await connectDB();
  const result = await pool.request()
    .input('id', sql.Int, Number(id))
    .query(`
      SELECT id, name, gardian, contact, salary, otrate, stloan, ltloan, designation, department
      FROM Employee WHERE id = @id
    `);
  const row = result.recordset[0];
  return row ? mapEmployeeRow(row) : null;
}

async function getNextSlipId() {
  const pool = await connectDB();
  const result = await pool.request().query('SELECT COUNT(*) + 1 AS nextId FROM SalarySlips');
  return Number(result.recordset[0].nextId) || 1;
}

async function fetchSalarySlipsList(limit = 100) {
  const pool = await connectDB();
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
  const result = await pool.request()
    .input('limit', sql.Int, safeLimit)
    .query(`
      SELECT TOP (@limit) * FROM (${numberedSubquery()}) q
      ORDER BY q.slipNo DESC
    `);
  return result.recordset.map(mapSalarySlipRow);
}

async function fetchSalarySlipBySlipNo(slipNo) {
  const pool = await connectDB();
  const result = await pool.request()
    .input('slipNo', sql.Int, Number(slipNo))
    .query(`
      SELECT * FROM (${numberedSubquery()}) q WHERE q.slipNo = @slipNo
    `);
  const row = result.recordset[0];
  return row ? mapSalarySlipRow(row) : null;
}

async function fetchSalarySlipByRecordKey(recordKey) {
  const pool = await connectDB();
  const keyDate = new Date(recordKey);
  const result = await pool.request()
    .input('id', sql.SmallDateTime, keyDate)
    .query(`
      SELECT * FROM (${numberedSubquery()}) q
      WHERE q.recordKey = @id
    `);
  const row = result.recordset[0];
  return row ? mapSalarySlipRow(row) : null;
}

async function saveSalarySlip(payload, existingRecordKey = null) {
  const pool = await connectDB();
  if (!payload.employeeId) {
    throw new Error('Select an employee.');
  }

  const slipDate = payload.dated ? new Date(payload.dated) : new Date();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[slipDate.getMonth()];
  const year = slipDate.getFullYear();

  const basicSalary = parseFloat(payload.basicSalary) || 0;
  const workingDays = parseFloat(payload.workingDays) || 0;
  const salary = parseFloat(payload.salary) || 0;
  const overTime = parseFloat(payload.overTime) || 0;
  const overTimeSalary = parseFloat(payload.overTimeSalary) || 0;
  const netSalary = parseFloat(payload.netSalary) || (salary + overTimeSalary);
  const preBalance = parseFloat(payload.preBalance) || 0;
  const paid = parseFloat(payload.paid) || 0;

  if (existingRecordKey) {
    const keyDate = new Date(existingRecordKey);
    await pool.request()
      .input('id', sql.SmallDateTime, keyDate)
      .input('date', sql.SmallDateTime, slipDate)
      .input('month', sql.NVarChar, month)
      .input('year', sql.Int, year)
      .input('empid', sql.Decimal(18, 0), Number(payload.employeeId))
      .input('days', sql.Int, Math.round(workingDays))
      .input('overtime', sql.Float, overTime)
      .input('grosssalary', sql.Float, basicSalary)
      .input('loan', sql.Float, preBalance)
      .input('salary', sql.Float, salary)
      .input('salaryot', sql.Float, overTimeSalary)
      .input('netsalary', sql.Float, netSalary)
      .input('advance', sql.Float, paid)
      .query(`
        UPDATE SalarySlips SET
          date = @date, month = @month, year = @year, empid = @empid,
          days = @days, overtime = @overtime, grosssalary = @grosssalary,
          loan = @loan, salary = @salary, salaryot = @salaryot,
          netsalary = @netsalary, advance = @advance
        WHERE id = @id
      `);
    return fetchSalarySlipByRecordKey(existingRecordKey);
  }

  let idValue = new Date(slipDate.getFullYear(), slipDate.getMonth(), slipDate.getDate());
  const exists = await pool.request()
    .input('id', sql.SmallDateTime, idValue)
    .query('SELECT id FROM SalarySlips WHERE id = @id');
  if (exists.recordset[0]) {
    idValue = new Date();
  }

  await pool.request()
    .input('id', sql.SmallDateTime, idValue)
    .input('date', sql.SmallDateTime, slipDate)
    .input('month', sql.NVarChar, month)
    .input('year', sql.Int, year)
    .input('empid', sql.Decimal(18, 0), Number(payload.employeeId))
    .input('days', sql.Int, Math.round(workingDays))
    .input('overtime', sql.Float, overTime)
    .input('grosssalary', sql.Float, basicSalary)
    .input('loan', sql.Float, preBalance)
    .input('salary', sql.Float, salary)
    .input('salaryot', sql.Float, overTimeSalary)
    .input('netsalary', sql.Float, netSalary)
    .input('advance', sql.Float, paid)
    .query(`
      INSERT INTO SalarySlips (
        id, date, month, year, empid, days, overtime, grosssalary,
        loan, salary, salaryot, netsalary, advance
      ) VALUES (
        @id, @date, @month, @year, @empid, @days, @overtime, @grosssalary,
        @loan, @salary, @salaryot, @netsalary, @advance
      )
    `);

  return fetchSalarySlipByRecordKey(idValue.toISOString());
}

async function deleteSalarySlip(recordKey) {
  const pool = await connectDB();
  const keyDate = new Date(recordKey);
  const del = await pool.request()
    .input('id', sql.SmallDateTime, keyDate)
    .query('DELETE FROM SalarySlips WHERE id = @id');
  if (del.rowsAffected[0] === 0) {
    throw new Error('Salary slip not found.');
  }
  return { success: true };
}

module.exports = {
  fetchEmployeesForSalary,
  fetchEmployeeById,
  getNextSlipId,
  fetchSalarySlipsList,
  fetchSalarySlipBySlipNo,
  fetchSalarySlipByRecordKey,
  saveSalarySlip,
  deleteSalarySlip,
};
