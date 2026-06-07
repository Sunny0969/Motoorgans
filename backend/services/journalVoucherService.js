const { connectDB, sql } = require('../config/mssqlconfig');

const JV_TYPE = 'JV';

async function getNextLedgerIds(transaction, count) {
  const idResult = await transaction.request().query(
    'SELECT ISNULL(MAX(Id), 0) AS maxId FROM Ledgers WITH (UPDLOCK, HOLDLOCK)',
  );
  const start = idResult.recordset[0]?.maxId ?? 0;
  return Array.from({ length: count }, (_, i) => start + 1 + i);
}

async function insertLedgerRow(transaction, row) {
  const invoiceVal = row.invoice != null && row.invoice !== '' && !Number.isNaN(Number(row.invoice))
    ? Number(row.invoice)
    : null;
  await transaction
    .request()
    .input('id', sql.Int, row.id)
    .input('doc', sql.Int, row.doc)
    .input('type', sql.NVarChar, row.type)
    .input('date', sql.DateTime, row.date)
    .input('acid', sql.Int, row.acid)
    .input('narration', sql.NVarChar, row.narration || '')
    .input('invoice', sql.Int, invoiceVal)
    .input('debit', sql.Float, row.debit ?? 0)
    .input('credit', sql.Float, row.credit ?? 0)
    .query(`
      INSERT INTO Ledgers (Id, Doc, Type, Date, Acid, Narration, Invoice, Debit, Credit)
      VALUES (@id, @doc, @type, @date, @acid, @narration, @invoice, @debit, @credit)
    `);
}

function mapLineRow(row, index = 0) {
  return {
    ledgerId: row.Id,
    sr: index + 1,
    accountId: row.Acid,
    accountCode: row.accountCode != null ? String(row.accountCode) : '',
    accountTitle: row.accountName || '',
    description: row.Narration || '',
    invoice: row.Invoice != null ? String(row.Invoice) : '',
    debit: row.Debit ?? 0,
    credit: row.Credit ?? 0,
  };
}

async function getNextJournalDoc() {
  const pool = await connectDB();
  const result = await pool.request().query(
    `SELECT ISNULL(MAX(Doc), 0) + 1 AS nextDoc FROM Ledgers WHERE Type = '${JV_TYPE}'`,
  );
  return result.recordset[0].nextDoc;
}

async function fetchJournalVoucherByDoc(doc) {
  const pool = await connectDB();
  const result = await pool.request()
    .input('doc', sql.Int, Number(doc))
    .query(`
      SELECT l.Id, l.Doc, l.Date, l.Acid, l.Narration, l.Invoice, l.Debit, l.Credit,
        c.Subsidary AS accountName, c.code AS accountCode
      FROM Ledgers l
      LEFT JOIN COA c ON l.Acid = c.Id
      WHERE l.Doc = @doc AND l.Type = '${JV_TYPE}'
      ORDER BY l.Id ASC
    `);
  if (!result.recordset.length) return null;
  const date = result.recordset[0].Date;
  return {
    doc: result.recordset[0].Doc,
    date: date ? new Date(date).toISOString().slice(0, 10) : '',
    lines: result.recordset.map((row, i) => mapLineRow(row, i)),
  };
}

async function resolveAcid(transaction, line) {
  if (line.accountId) {
    const byId = await new sql.Request(transaction)
      .input('id', sql.Int, Number(line.accountId))
      .query('SELECT TOP 1 Id FROM COA WHERE Id = @id');
    if (byId.recordset[0]) return byId.recordset[0].Id;
  }
  if (line.accountCode) {
    const byCode = await new sql.Request(transaction)
      .input('code', sql.NVarChar, String(line.accountCode))
      .query('SELECT TOP 1 Id FROM COA WHERE code = @code');
    if (byCode.recordset[0]) return byCode.recordset[0].Id;
  }
  if (line.accountTitle) {
    const byName = await new sql.Request(transaction)
      .input('name', sql.NVarChar, line.accountTitle.trim())
      .query('SELECT TOP 1 Id FROM COA WHERE Subsidary = @name');
    if (byName.recordset[0]) return byName.recordset[0].Id;
  }
  return null;
}

async function saveJournalVoucher(payload, existingDoc = null) {
  const pool = await connectDB();
  const lines = (payload.lines || []).filter(
    (l) => (l.accountId || l.accountTitle || l.accountCode)
      && ((parseFloat(l.debit) || 0) > 0 || (parseFloat(l.credit) || 0) > 0),
  );

  if (!lines.length) {
    throw new Error('Add at least one entry with account and debit or credit amount.');
  }

  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(
      `Debit (${totalDebit.toFixed(2)}) and Credit (${totalCredit.toFixed(2)}) must be equal.`,
    );
  }

  let docNo = existingDoc ? Number(existingDoc) : (payload.doc ? Number(payload.doc) : null);
  if (!docNo) {
    docNo = await getNextJournalDoc();
  }

  let voucherDate = new Date();
  if (payload.date) {
    const parsed = Date.parse(payload.date);
    if (!Number.isNaN(parsed)) voucherDate = new Date(parsed);
  }

  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    if (existingDoc) {
      const check = await new sql.Request(transaction)
        .input('doc', sql.Int, docNo)
        .query(`SELECT TOP 1 Id FROM Ledgers WHERE Doc = @doc AND Type = '${JV_TYPE}'`);
      if (!check.recordset[0]) {
        throw new Error(`Journal voucher #${docNo} not found.`);
      }
      await new sql.Request(transaction)
        .input('doc', sql.Int, docNo)
        .query(`DELETE FROM Ledgers WHERE Doc = @doc AND Type = '${JV_TYPE}'`);
    }

    const ids = await getNextLedgerIds(transaction, lines.length);

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const acid = await resolveAcid(transaction, line);
      if (!acid) {
        throw new Error(`Account not found for row ${i + 1}: ${line.accountTitle || line.accountCode || '?'}`);
      }

      await insertLedgerRow(transaction, {
        id: ids[i],
        doc: docNo,
        type: JV_TYPE,
        date: voucherDate,
        acid,
        narration: line.description || '',
        invoice: line.invoice || null,
        debit: parseFloat(line.debit) || 0,
        credit: parseFloat(line.credit) || 0,
      });
    }

    await transaction.commit();
    return fetchJournalVoucherByDoc(docNo);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function deleteJournalVoucher(doc) {
  const pool = await connectDB();
  const del = await pool.request()
    .input('doc', sql.Int, Number(doc))
    .query(`DELETE FROM Ledgers WHERE Doc = @doc AND Type = '${JV_TYPE}'`);
  if (del.rowsAffected[0] === 0) {
    throw new Error(`Journal voucher #${doc} not found.`);
  }
  return { success: true };
}

module.exports = {
  getNextJournalDoc,
  fetchJournalVoucherByDoc,
  saveJournalVoucher,
  deleteJournalVoucher,
};
