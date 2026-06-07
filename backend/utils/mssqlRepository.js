const { connectDB, sql } = require('../config/mssqlconfig');
const {
  mapCoaRowToAccount,
  mapCoaRowToSupplier,
  mapCoaRowToCustomer,
  mapProductRowToApi,
  mapProductRowToItem,
  mapStockRow,
  mapProductHistoryRow,
  mapLedgerRow,
  mapPurchaseHeader,
  mapPurchaseLineRow,
  mapSaleHeader,
  mapSaleLineRow,
  resolveSaleInvoiceNo,
  SUPPLIER_AC_TYPE,
  CUSTOMER_AC_TYPE,
} = require('./mssqlMappers');

const COA_LIST_WHERE = `
  Subsidary IS NOT NULL
  AND LTRIM(RTRIM(Subsidary)) <> ''
  AND Subsidary <> 'N/A'
`;

async function getPool() {
  return connectDB();
}

async function getNextLedgerIds(transaction, count) {
  const idResult = await transaction.request().query(
    `SELECT ISNULL(MAX(Id), 0) AS maxId FROM Ledgers WITH (UPDLOCK, HOLDLOCK)`
  );
  const start = idResult.recordset[0]?.maxId ?? 0;
  return Array.from({ length: count }, (_, i) => start + 1 + i);
}

async function insertLedgerRow(transaction, row) {
  const invoiceVal = row.invoice != null && !Number.isNaN(Number(row.invoice))
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
    .input('debit', sql.Float, row.debit ?? null)
    .input('credit', sql.Float, row.credit ?? null)
    .query(`
      INSERT INTO Ledgers (Id, Doc, Type, Date, Acid, Narration, Invoice, Debit, Credit)
      VALUES (@id, @doc, @type, @date, @acid, @narration, @invoice, @debit, @credit)
    `);
}

async function resolveSaleAccountIds(transaction) {
  const saleRes = await transaction.request().query(
    `SELECT TOP 1 Id FROM COA WHERE code = '4' OR Subsidary = 'SALE'`
  );
  const cashRes = await transaction.request().query(
    `SELECT TOP 1 Id FROM COA WHERE code = '1' OR Subsidary = 'CASH IN HAND'`
  );
  return {
    saleAccountId: saleRes.recordset[0]?.Id ?? 4,
    cashAccountId: cashRes.recordset[0]?.Id ?? 1,
  };
}

async function writeSaleLedgerEntries(transaction, {
  doc, saleDate, customerId, customerName, totalAmount, invoiceNo, received,
}) {
  if (!customerId || !totalAmount) return;

  const { saleAccountId, cashAccountId } = await resolveSaleAccountIds(transaction);
  const cashReceived = parseFloat(received) || 0;
  const rowCount = cashReceived > 0 ? 4 : 2;
  const ids = await getNextLedgerIds(transaction, rowCount);
  let idx = 0;
  const invNum = invoiceNo != null && String(invoiceNo) !== '0' ? invoiceNo : doc;
  const narration = `Sold to: ${(customerName || '').trim()}`.trim();

  await insertLedgerRow(transaction, {
    id: ids[idx++],
    doc,
    type: 'Sale',
    date: saleDate,
    acid: saleAccountId,
    narration,
    invoice: invNum,
    debit: null,
    credit: totalAmount,
  });

  await insertLedgerRow(transaction, {
    id: ids[idx++],
    doc,
    type: 'Sale',
    date: saleDate,
    acid: customerId,
    narration: '',
    invoice: invNum,
    debit: totalAmount,
    credit: null,
  });

  if (cashReceived > 0) {
    await insertLedgerRow(transaction, {
      id: ids[idx++],
      doc,
      type: 'Sale',
      date: saleDate,
      acid: customerId,
      narration: 'Cash received ',
      invoice: invNum,
      debit: null,
      credit: cashReceived,
    });

    await insertLedgerRow(transaction, {
      id: ids[idx++],
      doc,
      type: 'Sale',
      date: saleDate,
      acid: cashAccountId,
      narration: '',
      invoice: invNum,
      debit: cashReceived,
      credit: null,
    });
  }
}

async function deleteSaleLedgerEntries(transaction, doc) {
  await transaction
    .request()
    .input('doc', sql.Int, Number(doc))
    .query(`DELETE FROM Ledgers WHERE Doc = @doc AND Type = 'Sale'`);
}

async function fetchCoaAccounts() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT *
    FROM COA
    WHERE ${COA_LIST_WHERE}
    ORDER BY Subsidary ASC
  `);
  return result.recordset.map(mapCoaRowToAccount);
}

async function fetchCoaAccountById(id) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, Number(id))
    .query('SELECT * FROM COA WHERE Id = @id');
  const row = result.recordset[0];
  return row ? mapCoaRowToAccount(row) : null;
}

async function searchCoaAccounts(query) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('query', sql.NVarChar, `%${query}%`)
    .query(`
      SELECT TOP 50 *
      FROM COA
      WHERE ${COA_LIST_WHERE}
        AND (
          Subsidary LIKE @query
          OR CAST(code AS NVARCHAR(50)) LIKE @query
        )
      ORDER BY Id
    `);
  return result.recordset.map(mapCoaRowToAccount);
}

async function fetchCoaAccountsByType(typeLabel) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('typeLabel', sql.NVarChar, typeLabel)
    .query(`
      SELECT *
      FROM COA
      WHERE ${COA_LIST_WHERE}
        AND (
          (@typeLabel = 'Debtors, Buyers, Customers, Clients' AND ACType = 5)
          OR (@typeLabel = 'Creditors, Suppliers, Vendors' AND ACType = 15)
        )
      ORDER BY Id
    `);
  return result.recordset.map(mapCoaRowToAccount);
}

async function fetchSuppliers() {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('acType', sql.Int, SUPPLIER_AC_TYPE)
    .query(`
      SELECT *
      FROM COA
      WHERE ACType = @acType
        AND (isactive IS NULL OR isactive = 1)
      ORDER BY Subsidary
    `);
  return result.recordset.map(mapCoaRowToSupplier);
}

async function fetchSupplierById(id) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, Number(id))
    .input('acType', sql.Int, SUPPLIER_AC_TYPE)
    .query('SELECT * FROM COA WHERE Id = @id AND ACType = @acType');
  const row = result.recordset[0];
  return row ? mapCoaRowToSupplier(row) : null;
}

async function searchSuppliers(query) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('query', sql.NVarChar, `%${query}%`)
    .input('acType', sql.Int, SUPPLIER_AC_TYPE)
    .query(`
      SELECT TOP 50 *
      FROM COA
      WHERE ACType = @acType
        AND (isactive IS NULL OR isactive = 1)
        AND (
          Subsidary LIKE @query
          OR CAST(code AS NVARCHAR(50)) LIKE @query
          OR OAddress LIKE @query
        )
      ORDER BY Subsidary
    `);
  return result.recordset.map(mapCoaRowToSupplier);
}

async function fetchProducts(search = '', limit = 5000, options = {}) {
  const { includeInactive = false } = options;
  const pool = await getPool();
  const safeLimit = Math.min(Math.max(Number(limit) || 5000, 1), 10000);
  const request = pool.request().input('limit', sql.Int, safeLimit);
  const searchClause = search
    ? `AND (
        Name LIKE @search
        OR CAST(code AS NVARCHAR(50)) LIKE @search
        OR Company LIKE @search
        OR Category LIKE @search
        OR UrduName LIKE @search
        OR CAST(ID AS NVARCHAR(50)) LIKE @search
      )`
    : '';
  const activeClause = includeInactive ? '' : 'AND (isactive IS NULL OR isactive = 1)';
  if (search) request.input('search', sql.NVarChar, `%${search}%`);

  const result = await request.query(`
    SELECT TOP (@limit)
      ID, Company, Category, category2, Size, Name, UrduName,
      Packing, PurchaseRate, SaleRate, SaleRate2, SaleRate3, SaleRate4,
      OQty, Batch, ODate, code, SchRate, SchPc, ReOrder, location, isactive, country, discount
    FROM Products
    WHERE 1=1
      ${activeClause}
      ${searchClause}
    ORDER BY ID DESC
  `);
  return result.recordset.map(mapProductRowToApi);
}

async function fetchProductById(id) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, Number(id))
    .query('SELECT * FROM Products WHERE ID = @id');
  const row = result.recordset[0];
  return row ? mapProductRowToApi(row) : null;
}

async function searchProducts(query) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('query', sql.NVarChar, `%${query}%`)
    .query(`
      SELECT TOP 50 *
      FROM Products
      WHERE (isactive IS NULL OR isactive = 1)
        AND (
          Name LIKE @query
          OR CAST(code AS NVARCHAR(50)) LIKE @query
          OR Company LIKE @query
          OR Category LIKE @query
        )
      ORDER BY Name
    `);
  return result.recordset.map(mapProductRowToApi);
}

async function fetchCoaById(id) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, Number(id))
    .query('SELECT Id, code, Subsidary FROM COA WHERE Id = @id');
  return result.recordset[0] || null;
}

async function fetchPurchaseHeaders(limit = 100) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('limit', sql.Int, limit)
    .query(`
      SELECT TOP (@limit) *
      FROM PSDetail
      WHERE Type = 'Purchase'
      ORDER BY Doc DESC
    `);
  return result.recordset;
}

async function fetchPurchaseByDoc(doc) {
  const pool = await getPool();
  const headerResult = await pool
    .request()
    .input('doc', sql.Int, Number(doc))
    .query(`
      SELECT *
      FROM PSDetail
      WHERE Doc = @doc AND Type = 'Purchase'
    `);

  const header = headerResult.recordset[0];
  if (!header) return null;

  const supplierRow = header.Acid != null ? await fetchCoaById(header.Acid) : null;
  const supplier = supplierRow
    ? {
        code: supplierRow.code != null ? String(supplierRow.code) : String(supplierRow.Id),
        name: supplierRow.Subsidary || '',
      }
    : null;

  const linesResult = await pool
    .request()
    .input('doc', sql.Int, Number(doc))
    .query(`
      SELECT
        p.*,
        pr.Name AS productName,
        pr.code AS productCode,
        pr.Size AS uom
      FROM PSProduct p
      LEFT JOIN Products pr ON p.Prid = pr.ID
      WHERE p.Doc = @doc AND p.Type = 'Purchase'
      ORDER BY p.ID
    `);

  const purchase = mapPurchaseHeader(header, supplier);
  purchase.products = linesResult.recordset.map((row, index) => ({
    ...mapPurchaseLineRow(row),
    sr: index + 1,
  }));

  const totalPcs = purchase.products.reduce((sum, item) => sum + (parseFloat(item.pcs) || 0), 0);
  const netAmount = purchase.products.reduce((sum, item) => sum + (parseFloat(item.net) || 0), 0);
  purchase.totalPcsFooter = totalPcs;
  purchase.netAmountFooter = netAmount.toFixed(2);
  purchase.billAmount = (header.Amount ?? netAmount).toFixed(2);
  purchase.netPayable = purchase.billAmount;

  return purchase;
}

async function fetchLatestPurchase() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT TOP 1 Doc
    FROM PSDetail
    WHERE Type = 'Purchase'
    ORDER BY Doc DESC
  `);
  const doc = result.recordset[0]?.Doc;
  if (doc == null) return null;
  return fetchPurchaseByDoc(doc);
}

async function createPurchase(data) {
  const pool = await getPool();
  const transaction = pool.transaction();
  await transaction.begin();

  try {
    const docResult = await transaction.request().query(
      `SELECT ISNULL(MAX(Doc), 0) + 1 AS nextDoc FROM PSDetail`
    );
    const newDoc = docResult.recordset[0].nextDoc;

    const acid = await resolveSupplierAcid(transaction, data);
    await upsertPurchaseHeader(transaction, newDoc, data, acid);
    await insertPurchaseLines(transaction, newDoc, data.products);

    await transaction.commit();
    return fetchPurchaseByDoc(newDoc);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function resolveSupplierAcid(transaction, data) {
  if (data.supplierId) {
    const byId = await transaction.request()
      .input('id', sql.Int, Number(data.supplierId))
      .query('SELECT TOP 1 Id FROM COA WHERE Id = @id');
    if (byId.recordset[0]) return byId.recordset[0].Id;
  }
  if (data.supplierCode) {
    const byCode = await transaction.request()
      .input('code', sql.NVarChar, String(data.supplierCode))
      .query('SELECT TOP 1 Id FROM COA WHERE code = @code');
    if (byCode.recordset[0]) return byCode.recordset[0].Id;
  }
  return null;
}

async function insertPurchaseLines(transaction, doc, products, voucherType = 'Purchase') {
  for (const product of products || []) {
    let prid = product.productId ? Number(product.productId) : null;
    if (!prid && product.productCode) {
      const prodResult = await transaction
        .request()
        .input('code', sql.NVarChar, String(product.productCode))
        .query('SELECT TOP 1 ID FROM Products WHERE code = @code');
      if (prodResult.recordset.length > 0) {
        prid = prodResult.recordset[0].ID;
      }
    }

    await transaction
      .request()
      .input('doc', sql.Int, doc)
      .input('type', sql.NVarChar, voucherType)
      .input('prid', sql.Int, prid)
      .input('qty', sql.Float, parseFloat(product.pcs) || 0)
      .input('rate', sql.Float, parseFloat(product.rate) || 0)
      .input('vest', sql.Float, parseFloat(product.amount) || 0)
      .input('discount', sql.Float, parseFloat(product.discount) || 0)
      .input('discP', sql.Float, parseFloat(product.discPercent) || 0)
      .input('vist', sql.Float, parseFloat(product.net) || 0)
      .input('packet', sql.NVarChar, product.packing != null ? String(product.packing) : '')
      .input('comments', sql.NVarChar, product.remarks || '')
      .query(`
        INSERT INTO PSProduct (
          Doc, Type, Prid, Qty, Rate, VEST, Discount, DiscP, VIST, Packet, comments
        ) VALUES (
          @doc, @type, @prid, @qty, @rate, @vest, @discount, @discP, @vist, @packet, @comments
        )
      `);
  }
}

async function upsertPurchaseHeader(transaction, doc, data, acid, voucherType = 'Purchase') {
  const totalAmount = (data.products || []).reduce(
    (sum, p) => sum + (parseFloat(p.net) || 0),
    0,
  );
  let purchaseDate = new Date();
  if (data.date) {
    const parsed = Date.parse(data.date);
    if (!Number.isNaN(parsed)) purchaseDate = new Date(parsed);
  }
  let dueDate = purchaseDate;
  if (data.dueDate) {
    const parsedDue = Date.parse(data.dueDate);
    if (!Number.isNaN(parsedDue)) dueDate = new Date(parsedDue);
  }
  const extraDisc = parseFloat(data.extraDiscount) || 0;
  const billAmount = totalAmount - extraDisc;
  const prevBal = parseFloat(data.previousBalance) || 0;
  const cashPaid = parseFloat(data.cashReceived ?? data.cashPaid) || 0;

  await transaction
    .request()
    .input('doc', sql.Int, doc)
    .input('type', sql.NVarChar, voucherType)
    .input('date', sql.DateTime, purchaseDate)
    .input('acid', sql.Int, acid)
    .input('invoice', sql.NVarChar, data.invoiceNo || String(doc))
    .input('term', sql.NVarChar, data.paymentType || 'Cash')
    .input('creditDays', sql.Int, parseInt(data.creditDays, 10) || 0)
    .input('dueDate', sql.DateTime, dueDate)
    .input('amount', sql.Float, billAmount)
    .input('discount', sql.Float, parseFloat(data.discPercentFooter) || 0)
    .input('extraDiscount', sql.Float, extraDisc)
    .input('pbalance', sql.Float, prevBal)
    .input('received', sql.Float, cashPaid)
    .input('goods', sql.NVarChar, data.transporter || '')
    .input('builty', sql.NVarChar, data.builtyNo || '')
    .input('description', sql.NVarChar, data.description || '')
    .query(`
      MERGE PSDetail AS target
      USING (SELECT @doc AS Doc, @type AS Type) AS source
      ON target.Doc = source.Doc AND target.Type = source.Type
      WHEN MATCHED THEN UPDATE SET
        Date = @date, Acid = @acid, invoice = @invoice, Term = @term,
        CreditDays = @creditDays, DueDate = @dueDate, Amount = @amount,
        Discount = @discount, ExtraDiscount = @extraDiscount, PBalance = @pbalance,
        Received = @received, goods = @goods, builty = @builty, Description = @description
      WHEN NOT MATCHED THEN INSERT (
        Doc, Type, Date, Acid, invoice, Term, CreditDays, DueDate,
        Amount, Discount, ExtraDiscount, PBalance, Received, goods, builty, Description
      ) VALUES (
        @doc, @type, @date, @acid, @invoice, @term, @creditDays, @dueDate,
        @amount, @discount, @extraDiscount, @pbalance, @received, @goods, @builty, @description
      );
    `);
}

async function updatePurchase(doc, data) {
  const pool = await getPool();
  const transaction = pool.transaction();
  await transaction.begin();
  try {
    const docNum = Number(doc);
    const acid = await resolveSupplierAcid(transaction, data);
    await upsertPurchaseHeader(transaction, docNum, data, acid);
    await transaction.request()
      .input('doc', sql.Int, docNum)
      .query(`DELETE FROM PSProduct WHERE Doc = @doc AND Type = 'Purchase'`);
    await insertPurchaseLines(transaction, docNum, data.products);
    await transaction.commit();
    return fetchPurchaseByDoc(docNum);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function deletePurchase(doc) {
  const pool = await getPool();
  const transaction = pool.transaction();
  await transaction.begin();
  try {
    const docNum = Number(doc);
    await transaction.request()
      .input('doc', sql.Int, docNum)
      .query(`DELETE FROM PSProduct WHERE Doc = @doc AND Type = 'Purchase'`);
    await transaction.request()
      .input('doc', sql.Int, docNum)
      .query(`DELETE FROM PSDetail WHERE Doc = @doc AND Type = 'Purchase'`);
    await transaction.commit();
    return { success: true, doc: docNum };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function fetchNextPurchaseDoc() {
  const pool = await getPool();
  const result = await pool.request().query(
    `SELECT ISNULL(MAX(Doc), 0) + 1 AS nextDoc FROM PSDetail WHERE Type = 'Purchase'`,
  );
  return result.recordset[0]?.nextDoc || 1;
}

async function fetchSupplierBalance(supplierId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, Number(supplierId))
    .query('SELECT ISNULL(Balance, 0) AS balance FROM COA WHERE Id = @id');
  return result.recordset[0]?.balance ?? 0;
}

async function fetchProductPurchaseHistory(productId, limit = 10) {
  const pool = await getPool();
  const result = await pool.request()
    .input('prid', sql.Int, Number(productId))
    .input('limit', sql.Int, limit)
    .query(`
      SELECT TOP (@limit)
        pd.Date, pd.Doc, ps.Rate, ps.Qty AS pcs, ps.VIST AS amount, ps.Packet AS packing
      FROM PSProduct ps
      INNER JOIN PSDetail pd ON ps.Doc = pd.Doc AND ps.Type = pd.Type
      WHERE ps.Type = 'Purchase' AND ps.Prid = @prid
      ORDER BY pd.Date DESC, pd.Doc DESC
    `);
  return result.recordset.map((row, i) => ({
    sr: i + 1,
    date: row.Date,
    doc: row.Doc,
    rate: row.Rate ?? 0,
    pcs: row.pcs ?? 0,
    amount: row.amount ?? 0,
    packing: row.packing || '',
  }));
}

const PURCHASE_RETURN_TYPE = 'Purchase Return';

async function fetchPurchaseReturnHeaders(limit = 100) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('limit', sql.Int, limit)
    .query(`
      SELECT TOP (@limit) *
      FROM PSDetail
      WHERE Type = '${PURCHASE_RETURN_TYPE}'
      ORDER BY Doc DESC
    `);
  return result.recordset;
}

async function fetchPurchaseReturnByDoc(doc) {
  const pool = await getPool();
  const headerResult = await pool
    .request()
    .input('doc', sql.Int, Number(doc))
    .query(`
      SELECT *
      FROM PSDetail
      WHERE Doc = @doc AND Type = '${PURCHASE_RETURN_TYPE}'
    `);

  const header = headerResult.recordset[0];
  if (!header) return null;

  const supplierRow = header.Acid != null ? await fetchCoaById(header.Acid) : null;
  const supplier = supplierRow
    ? {
        code: supplierRow.code != null ? String(supplierRow.code) : String(supplierRow.Id),
        name: supplierRow.Subsidary || '',
      }
    : null;

  const linesResult = await pool
    .request()
    .input('doc', sql.Int, Number(doc))
    .query(`
      SELECT
        p.*,
        pr.Name AS productName,
        pr.code AS productCode,
        pr.Size AS uom
      FROM PSProduct p
      LEFT JOIN Products pr ON p.Prid = pr.ID
      WHERE p.Doc = @doc AND p.Type = '${PURCHASE_RETURN_TYPE}'
      ORDER BY p.ID
    `);

  const voucher = mapPurchaseHeader(header, supplier);
  voucher.cashReceived = voucher.cashPaid;
  voucher.products = linesResult.recordset.map((row, index) => ({
    ...mapPurchaseLineRow(row),
    sr: index + 1,
  }));

  const totalPcs = voucher.products.reduce((sum, item) => sum + (parseFloat(item.pcs) || 0), 0);
  const netAmount = voucher.products.reduce((sum, item) => sum + (parseFloat(item.net) || 0), 0);
  voucher.totalPcsFooter = totalPcs;
  voucher.netAmountFooter = netAmount.toFixed(2);
  voucher.billAmount = (header.Amount ?? netAmount).toFixed(2);
  voucher.netPayable = voucher.billAmount;

  return voucher;
}

async function fetchLatestPurchaseReturn() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT TOP 1 Doc
    FROM PSDetail
    WHERE Type = '${PURCHASE_RETURN_TYPE}'
    ORDER BY Doc DESC
  `);
  const doc = result.recordset[0]?.Doc;
  if (doc == null) return null;
  return fetchPurchaseReturnByDoc(doc);
}

async function fetchNextPurchaseReturnDoc() {
  const pool = await getPool();
  const result = await pool.request().query(
    `SELECT ISNULL(MAX(Doc), 0) + 1 AS nextDoc FROM PSDetail WHERE Type = '${PURCHASE_RETURN_TYPE}'`,
  );
  return result.recordset[0]?.nextDoc || 1;
}

async function createPurchaseReturn(data) {
  const pool = await getPool();
  const transaction = pool.transaction();
  await transaction.begin();
  try {
    const docResult = await transaction.request().query(
      `SELECT ISNULL(MAX(Doc), 0) + 1 AS nextDoc FROM PSDetail WHERE Type = '${PURCHASE_RETURN_TYPE}'`,
    );
    const newDoc = docResult.recordset[0].nextDoc;
    const acid = await resolveSupplierAcid(transaction, data);
    await upsertPurchaseHeader(transaction, newDoc, data, acid, PURCHASE_RETURN_TYPE);
    await insertPurchaseLines(transaction, newDoc, data.products, PURCHASE_RETURN_TYPE);
    await transaction.commit();
    return fetchPurchaseReturnByDoc(newDoc);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function updatePurchaseReturn(doc, data) {
  const pool = await getPool();
  const transaction = pool.transaction();
  await transaction.begin();
  try {
    const docNum = Number(doc);
    const acid = await resolveSupplierAcid(transaction, data);
    await upsertPurchaseHeader(transaction, docNum, data, acid, PURCHASE_RETURN_TYPE);
    await transaction.request()
      .input('doc', sql.Int, docNum)
      .query(`DELETE FROM PSProduct WHERE Doc = @doc AND Type = '${PURCHASE_RETURN_TYPE}'`);
    await insertPurchaseLines(transaction, docNum, data.products, PURCHASE_RETURN_TYPE);
    await transaction.commit();
    return fetchPurchaseReturnByDoc(docNum);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function deletePurchaseReturn(doc) {
  const pool = await getPool();
  const transaction = pool.transaction();
  await transaction.begin();
  try {
    const docNum = Number(doc);
    await transaction.request()
      .input('doc', sql.Int, docNum)
      .query(`DELETE FROM PSProduct WHERE Doc = @doc AND Type = '${PURCHASE_RETURN_TYPE}'`);
    await transaction.request()
      .input('doc', sql.Int, docNum)
      .query(`DELETE FROM PSDetail WHERE Doc = @doc AND Type = '${PURCHASE_RETURN_TYPE}'`);
    await transaction.commit();
    return { success: true, doc: docNum };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function fetchProductPurchaseReturnHistory(productId, limit = 10) {
  const pool = await getPool();
  const result = await pool.request()
    .input('prid', sql.Int, Number(productId))
    .input('limit', sql.Int, limit)
    .query(`
      SELECT TOP (@limit)
        pd.Date, pd.Doc, ps.Rate, ps.Qty AS pcs, ps.VIST AS amount, ps.Packet AS packing
      FROM PSProduct ps
      INNER JOIN PSDetail pd ON ps.Doc = pd.Doc AND ps.Type = pd.Type
      WHERE ps.Type = '${PURCHASE_RETURN_TYPE}' AND ps.Prid = @prid
      ORDER BY pd.Date DESC, pd.Doc DESC
    `);
  return result.recordset.map((row, i) => ({
    sr: i + 1,
    date: row.Date,
    doc: row.Doc,
    rate: row.Rate ?? 0,
    pcs: row.pcs ?? 0,
    amount: row.amount ?? 0,
    packing: row.packing || '',
  }));
}

const CLAIM_OUT_TYPE = 'Claim Out';

async function fetchClaimOutHeaders(limit = 100) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('limit', sql.Int, limit)
    .query(`
      SELECT TOP (@limit) *
      FROM PSDetail
      WHERE Type = '${CLAIM_OUT_TYPE}'
      ORDER BY Doc DESC
    `);
  return result.recordset;
}

async function fetchClaimOutByDoc(doc) {
  const pool = await getPool();
  const headerResult = await pool
    .request()
    .input('doc', sql.Int, Number(doc))
    .query(`
      SELECT *
      FROM PSDetail
      WHERE Doc = @doc AND Type = '${CLAIM_OUT_TYPE}'
    `);

  const header = headerResult.recordset[0];
  if (!header) return null;

  const supplierRow = header.Acid != null ? await fetchCoaById(header.Acid) : null;
  const supplier = supplierRow
    ? {
        code: supplierRow.code != null ? String(supplierRow.code) : String(supplierRow.Id),
        name: supplierRow.Subsidary || '',
      }
    : null;

  const linesResult = await pool
    .request()
    .input('doc', sql.Int, Number(doc))
    .query(`
      SELECT
        p.*,
        pr.Name AS productName,
        pr.code AS productCode,
        pr.Size AS uom
      FROM PSProduct p
      LEFT JOIN Products pr ON p.Prid = pr.ID
      WHERE p.Doc = @doc AND p.Type = '${CLAIM_OUT_TYPE}'
      ORDER BY p.ID
    `);

  const voucher = mapPurchaseHeader(header, supplier);
  voucher.products = linesResult.recordset.map((row, index) => ({
    ...mapPurchaseLineRow(row),
    sr: index + 1,
  }));

  const totalPcs = voucher.products.reduce((sum, item) => sum + (parseFloat(item.pcs) || 0), 0);
  const netAmount = voucher.products.reduce((sum, item) => sum + (parseFloat(item.net) || 0), 0);
  voucher.totalPcsFooter = totalPcs;
  voucher.netAmountFooter = netAmount.toFixed(2);
  voucher.billAmount = (header.Amount ?? netAmount).toFixed(2);
  voucher.netPayable = voucher.billAmount;

  return voucher;
}

async function fetchLatestClaimOut() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT TOP 1 Doc
    FROM PSDetail
    WHERE Type = '${CLAIM_OUT_TYPE}'
    ORDER BY Doc DESC
  `);
  const doc = result.recordset[0]?.Doc;
  if (doc == null) return null;
  return fetchClaimOutByDoc(doc);
}

async function fetchNextClaimOutDoc() {
  const pool = await getPool();
  const result = await pool.request().query(
    `SELECT ISNULL(MAX(Doc), 0) + 1 AS nextDoc FROM PSDetail WHERE Type = '${CLAIM_OUT_TYPE}'`,
  );
  return result.recordset[0]?.nextDoc || 1;
}

async function createClaimOut(data) {
  const pool = await getPool();
  const transaction = pool.transaction();
  await transaction.begin();
  try {
    const docResult = await transaction.request().query(
      `SELECT ISNULL(MAX(Doc), 0) + 1 AS nextDoc FROM PSDetail WHERE Type = '${CLAIM_OUT_TYPE}'`,
    );
    const newDoc = docResult.recordset[0].nextDoc;
    const acid = await resolveSupplierAcid(transaction, data);
    await upsertPurchaseHeader(transaction, newDoc, data, acid, CLAIM_OUT_TYPE);
    await insertPurchaseLines(transaction, newDoc, data.products, CLAIM_OUT_TYPE);
    await transaction.commit();
    return fetchClaimOutByDoc(newDoc);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function updateClaimOut(doc, data) {
  const pool = await getPool();
  const transaction = pool.transaction();
  await transaction.begin();
  try {
    const docNum = Number(doc);
    const acid = await resolveSupplierAcid(transaction, data);
    await upsertPurchaseHeader(transaction, docNum, data, acid, CLAIM_OUT_TYPE);
    await transaction.request()
      .input('doc', sql.Int, docNum)
      .query(`DELETE FROM PSProduct WHERE Doc = @doc AND Type = '${CLAIM_OUT_TYPE}'`);
    await insertPurchaseLines(transaction, docNum, data.products, CLAIM_OUT_TYPE);
    await transaction.commit();
    return fetchClaimOutByDoc(docNum);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function deleteClaimOut(doc) {
  const pool = await getPool();
  const transaction = pool.transaction();
  await transaction.begin();
  try {
    const docNum = Number(doc);
    await transaction.request()
      .input('doc', sql.Int, docNum)
      .query(`DELETE FROM PSProduct WHERE Doc = @doc AND Type = '${CLAIM_OUT_TYPE}'`);
    await transaction.request()
      .input('doc', sql.Int, docNum)
      .query(`DELETE FROM PSDetail WHERE Doc = @doc AND Type = '${CLAIM_OUT_TYPE}'`);
    await transaction.commit();
    return { success: true, doc: docNum };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

const CLAIM_IN_TYPE = 'Claim In';

async function fetchClaimInHeaders(limit = 100) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('limit', sql.Int, limit)
    .query(`
      SELECT TOP (@limit) *
      FROM PSDetail
      WHERE Type = '${CLAIM_IN_TYPE}'
      ORDER BY Doc DESC
    `);
  return result.recordset;
}

async function fetchClaimInByDoc(doc) {
  const pool = await getPool();
  const headerResult = await pool
    .request()
    .input('doc', sql.Int, Number(doc))
    .query(`
      SELECT *
      FROM PSDetail
      WHERE Doc = @doc AND Type = '${CLAIM_IN_TYPE}'
    `);

  const header = headerResult.recordset[0];
  if (!header) return null;

  const customerRow = header.Acid != null ? await fetchCoaById(header.Acid) : null;
  const customer = customerRow
    ? {
        code: customerRow.code != null ? String(customerRow.code) : String(customerRow.Id),
        name: customerRow.Subsidary || '',
      }
    : null;

  const linesResult = await pool
    .request()
    .input('doc', sql.Int, Number(doc))
    .query(`
      SELECT
        p.*,
        pr.Name AS productName,
        pr.code AS productCode,
        pr.Size AS uom
      FROM PSProduct p
      LEFT JOIN Products pr ON p.Prid = pr.ID
      WHERE p.Doc = @doc AND p.Type = '${CLAIM_IN_TYPE}'
      ORDER BY p.ID
    `);

  const voucher = mapSaleHeader(
    header,
    customer ? { id: header.Acid, code: customer.code, name: customer.name } : null,
  );
  voucher.products = linesResult.recordset.map((row, index) => {
    const line = mapSaleLineRow(row);
    return {
      ...line,
      sr: index + 1,
      net: line.netAmount,
      pcs: line.pcs,
    };
  });

  const totalPcs = voucher.products.reduce((sum, item) => sum + (parseFloat(item.pcs) || 0), 0);
  const netAmount = voucher.products.reduce((sum, item) => sum + (parseFloat(item.netAmount) || 0), 0);
  voucher.totalPcsFooter = totalPcs;
  voucher.netAmountFooter = netAmount.toFixed(2);
  voucher.billAmount = (header.Amount ?? netAmount).toFixed(2);
  voucher.netPayable = voucher.billAmount;
  voucher.cashPaid = voucher.cashReceived;

  return voucher;
}

async function fetchLatestClaimIn() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT TOP 1 Doc
    FROM PSDetail
    WHERE Type = '${CLAIM_IN_TYPE}'
    ORDER BY Doc DESC
  `);
  const doc = result.recordset[0]?.Doc;
  if (doc == null) return null;
  return fetchClaimInByDoc(doc);
}

async function fetchNextClaimInDoc() {
  const pool = await getPool();
  const result = await pool.request().query(
    `SELECT ISNULL(MAX(Doc), 0) + 1 AS nextDoc FROM PSDetail WHERE Type = '${CLAIM_IN_TYPE}'`,
  );
  return result.recordset[0]?.nextDoc || 1;
}

async function createClaimIn(data) {
  const pool = await getPool();
  const transaction = pool.transaction();
  await transaction.begin();
  try {
    const docResult = await transaction.request().query(
      `SELECT ISNULL(MAX(Doc), 0) + 1 AS nextDoc FROM PSDetail WHERE Type = '${CLAIM_IN_TYPE}'`,
    );
    const newDoc = docResult.recordset[0].nextDoc;
    const acid = await resolveCustomerAcid(transaction, data);
    await upsertSaleVoucherHeader(transaction, newDoc, data, acid, CLAIM_IN_TYPE);
    await insertSaleVoucherLines(transaction, newDoc, data.products, CLAIM_IN_TYPE);
    await transaction.commit();
    return fetchClaimInByDoc(newDoc);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function updateClaimIn(doc, data) {
  const pool = await getPool();
  const transaction = pool.transaction();
  await transaction.begin();
  try {
    const docNum = Number(doc);
    const acid = await resolveCustomerAcid(transaction, data);
    await upsertSaleVoucherHeader(transaction, docNum, data, acid, CLAIM_IN_TYPE);
    await transaction.request()
      .input('doc', sql.Int, docNum)
      .query(`DELETE FROM PSProduct WHERE Doc = @doc AND Type = '${CLAIM_IN_TYPE}'`);
    await insertSaleVoucherLines(transaction, docNum, data.products, CLAIM_IN_TYPE);
    await transaction.commit();
    return fetchClaimInByDoc(docNum);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function deleteClaimIn(doc) {
  const pool = await getPool();
  const transaction = pool.transaction();
  await transaction.begin();
  try {
    const docNum = Number(doc);
    await transaction.request()
      .input('doc', sql.Int, docNum)
      .query(`DELETE FROM PSProduct WHERE Doc = @doc AND Type = '${CLAIM_IN_TYPE}'`);
    await transaction.request()
      .input('doc', sql.Int, docNum)
      .query(`DELETE FROM PSDetail WHERE Doc = @doc AND Type = '${CLAIM_IN_TYPE}'`);
    await transaction.commit();
    return { success: true, doc: docNum };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

const SALE_RETURN_TYPE = 'Sale Return';

async function resolveCustomerAcid(transaction, data) {
  if (data.customerId) {
    const byId = await transaction.request()
      .input('id', sql.Int, Number(data.customerId))
      .query('SELECT TOP 1 Id FROM COA WHERE Id = @id');
    if (byId.recordset[0]) return byId.recordset[0].Id;
  }
  if (data.customerCode) {
    const byCode = await transaction.request()
      .input('code', sql.NVarChar, String(data.customerCode))
      .query('SELECT TOP 1 Id FROM COA WHERE code = @code');
    if (byCode.recordset[0]) return byCode.recordset[0].Id;
  }
  return null;
}

async function insertSaleVoucherLines(transaction, doc, products, voucherType) {
  for (const product of products || []) {
    let prid = product.productId ? Number(product.productId) : null;
    if (!prid && product.productCode) {
      const prodResult = await transaction
        .request()
        .input('code', sql.NVarChar, String(product.productCode))
        .query('SELECT TOP 1 ID FROM Products WHERE code = @code');
      if (prodResult.recordset.length > 0) {
        prid = prodResult.recordset[0].ID;
      }
    }
    if (!prid && product.product) {
      prid = Number(product.product) || null;
    }

    await transaction
      .request()
      .input('doc', sql.Int, doc)
      .input('type', sql.NVarChar, voucherType)
      .input('prid', sql.Int, prid)
      .input('qty', sql.Float, parseFloat(product.pcs) || 0)
      .input('rate', sql.Float, parseFloat(product.rate) || 0)
      .input('vest', sql.Float, parseFloat(product.amount) || 0)
      .input('discount', sql.Float, parseFloat(product.discount) || 0)
      .input('discP', sql.Float, parseFloat(product.discPercent) || 0)
      .input('vist', sql.Float, parseFloat(product.net ?? product.netAmount) || 0)
      .input('packet', sql.NVarChar, product.packing != null ? String(product.packing) : '')
      .input('comments', sql.NVarChar, product.remarks || '')
      .query(`
        INSERT INTO PSProduct (
          Doc, Type, Prid, Qty, Rate, VEST, Discount, DiscP, VIST, Packet, comments
        ) VALUES (
          @doc, @type, @prid, @qty, @rate, @vest, @discount, @discP, @vist, @packet, @comments
        )
      `);
  }
}

async function upsertSaleVoucherHeader(transaction, doc, data, acid, voucherType) {
  const totalAmount = (data.products || []).reduce(
    (sum, p) => sum + (parseFloat(p.net ?? p.netAmount) || 0),
    0,
  );
  let saleDate = new Date();
  if (data.date) {
    const parsed = Date.parse(data.date);
    if (!Number.isNaN(parsed)) saleDate = new Date(parsed);
  }
  let dueDate = saleDate;
  if (data.dueDate) {
    const parsedDue = Date.parse(data.dueDate);
    if (!Number.isNaN(parsedDue)) dueDate = new Date(parsedDue);
  }
  const extraDisc = parseFloat(data.extraDiscount) || 0;
  const billAmount = totalAmount - extraDisc;
  const prevBal = parseFloat(data.previousBalance) || 0;
  const cashPaid = parseFloat(data.cashPaid ?? data.cashReceived) || 0;

  await transaction
    .request()
    .input('doc', sql.Int, doc)
    .input('type', sql.NVarChar, voucherType)
    .input('date', sql.DateTime, saleDate)
    .input('acid', sql.Int, acid)
    .input('invoice', sql.NVarChar, data.invoiceNo || String(doc))
    .input('term', sql.NVarChar, data.paymentType || 'Cash')
    .input('creditDays', sql.Int, parseInt(data.creditDays, 10) || 0)
    .input('dueDate', sql.DateTime, dueDate)
    .input('amount', sql.Float, billAmount)
    .input('discount', sql.Float, parseFloat(data.discPercentFooter) || 0)
    .input('extraDiscount', sql.Float, extraDisc)
    .input('pbalance', sql.Float, prevBal)
    .input('received', sql.Float, cashPaid)
    .input('goods', sql.NVarChar, data.transporter || '')
    .input('builty', sql.NVarChar, data.builtyNo || '')
    .input('description', sql.NVarChar, data.description || '')
    .input('priceList', sql.NVarChar, data.priceList || 'Whole Sale')
    .query(`
      MERGE PSDetail AS target
      USING (SELECT @doc AS Doc, @type AS Type) AS source
      ON target.Doc = source.Doc AND target.Type = source.Type
      WHEN MATCHED THEN UPDATE SET
        Date = @date, Acid = @acid, invoice = @invoice, Term = @term,
        CreditDays = @creditDays, DueDate = @dueDate, Amount = @amount,
        Discount = @discount, ExtraDiscount = @extraDiscount, PBalance = @pbalance,
        Received = @received, goods = @goods, builty = @builty, Description = @description,
        PriceList = @priceList
      WHEN NOT MATCHED THEN INSERT (
        Doc, Type, Date, Acid, invoice, Term, CreditDays, DueDate,
        Amount, Discount, ExtraDiscount, PBalance, Received, goods, builty, Description, PriceList
      ) VALUES (
        @doc, @type, @date, @acid, @invoice, @term, @creditDays, @dueDate,
        @amount, @discount, @extraDiscount, @pbalance, @received, @goods, @builty, @description, @priceList
      );
    `);
}

async function fetchSaleReturnHeaders(limit = 100) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('limit', sql.Int, limit)
    .query(`
      SELECT TOP (@limit) *
      FROM PSDetail
      WHERE Type = '${SALE_RETURN_TYPE}'
      ORDER BY Doc DESC
    `);
  return result.recordset;
}

async function fetchSaleReturnByDoc(doc) {
  const pool = await getPool();
  const headerResult = await pool
    .request()
    .input('doc', sql.Int, Number(doc))
    .query(`
      SELECT *
      FROM PSDetail
      WHERE Doc = @doc AND Type = '${SALE_RETURN_TYPE}'
    `);

  const header = headerResult.recordset[0];
  if (!header) return null;

  const customerRow = header.Acid != null ? await fetchCoaById(header.Acid) : null;
  const customer = customerRow
    ? {
        code: customerRow.code != null ? String(customerRow.code) : String(customerRow.Id),
        name: customerRow.Subsidary || '',
      }
    : null;

  const linesResult = await pool
    .request()
    .input('doc', sql.Int, Number(doc))
    .input('lineLimit', sql.Int, 500)
    .query(`
      SELECT TOP (@lineLimit)
        p.*,
        pr.Name AS productName,
        pr.UrduName AS urduName,
        pr.code AS productCode,
        pr.Size AS uom,
        pr.Packing AS packingSize
      FROM PSProduct p
      LEFT JOIN Products pr ON p.Prid = pr.ID
      WHERE p.Doc = @doc AND p.Type = '${SALE_RETURN_TYPE}'
      ORDER BY p.ID
    `);

  const voucher = mapSaleHeader(
    header,
    customer ? { id: header.Acid, code: customer.code, name: customer.name } : null,
  );
  voucher.priceList = header.PriceList || 'Whole Sale';
  voucher.products = linesResult.recordset.map((row, index) => {
    const line = mapSaleLineRow(row);
    return { ...line, sr: index + 1, net: line.netAmount, schPc: '' };
  });

  const totalPcs = voucher.products.reduce((sum, item) => sum + (parseFloat(item.pcs) || 0), 0);
  const netAmount = voucher.products.reduce((sum, item) => sum + (parseFloat(item.netAmount) || 0), 0);
  voucher.totalPcsFooter = totalPcs;
  voucher.netAmountFooter = netAmount.toFixed(2);
  voucher.billAmount = (header.Amount ?? netAmount).toFixed(2);
  voucher.netReceivable = voucher.billAmount;

  return voucher;
}

async function fetchLatestSaleReturn() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT TOP 1 Doc
    FROM PSDetail
    WHERE Type = '${SALE_RETURN_TYPE}'
    ORDER BY Doc DESC
  `);
  const doc = result.recordset[0]?.Doc;
  if (doc == null) return null;
  return fetchSaleReturnByDoc(doc);
}

async function fetchNextSaleReturnDoc() {
  const pool = await getPool();
  const result = await pool.request().query(
    `SELECT ISNULL(MAX(Doc), 0) + 1 AS nextDoc FROM PSDetail WHERE Type = '${SALE_RETURN_TYPE}'`,
  );
  return result.recordset[0]?.nextDoc || 1;
}

async function createSaleReturn(data) {
  const pool = await getPool();
  const transaction = pool.transaction();
  await transaction.begin();
  try {
    const docResult = await transaction.request().query(
      `SELECT ISNULL(MAX(Doc), 0) + 1 AS nextDoc FROM PSDetail WHERE Type = '${SALE_RETURN_TYPE}'`,
    );
    const newDoc = docResult.recordset[0].nextDoc;
    const acid = await resolveCustomerAcid(transaction, data);
    await upsertSaleVoucherHeader(transaction, newDoc, data, acid, SALE_RETURN_TYPE);
    await insertSaleVoucherLines(transaction, newDoc, data.products, SALE_RETURN_TYPE);
    await transaction.commit();
    return fetchSaleReturnByDoc(newDoc);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function updateSaleReturn(doc, data) {
  const pool = await getPool();
  const transaction = pool.transaction();
  await transaction.begin();
  try {
    const docNum = Number(doc);
    const acid = await resolveCustomerAcid(transaction, data);
    await upsertSaleVoucherHeader(transaction, docNum, data, acid, SALE_RETURN_TYPE);
    await transaction.request()
      .input('doc', sql.Int, docNum)
      .query(`DELETE FROM PSProduct WHERE Doc = @doc AND Type = '${SALE_RETURN_TYPE}'`);
    await insertSaleVoucherLines(transaction, docNum, data.products, SALE_RETURN_TYPE);
    await transaction.commit();
    return fetchSaleReturnByDoc(docNum);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function deleteSaleReturn(doc) {
  const pool = await getPool();
  const transaction = pool.transaction();
  await transaction.begin();
  try {
    const docNum = Number(doc);
    await transaction.request()
      .input('doc', sql.Int, docNum)
      .query(`DELETE FROM PSProduct WHERE Doc = @doc AND Type = '${SALE_RETURN_TYPE}'`);
    await transaction.request()
      .input('doc', sql.Int, docNum)
      .query(`DELETE FROM PSDetail WHERE Doc = @doc AND Type = '${SALE_RETURN_TYPE}'`);
    await transaction.commit();
    return { success: true, doc: docNum };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function fetchCustomers() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT *
    FROM COA
    WHERE ACType IN (5, 1)
      AND Subsidary IS NOT NULL
      AND LTRIM(RTRIM(Subsidary)) <> ''
      AND Subsidary <> 'N/A'
      AND (isactive IS NULL OR isactive = 1)
    ORDER BY Subsidary
  `);
  return result.recordset.map(mapCoaRowToCustomer);
}

async function fetchCustomerById(id) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, Number(id))
    .input('acType', sql.Int, CUSTOMER_AC_TYPE)
    .query('SELECT * FROM COA WHERE Id = @id AND ACType = @acType');
  const row = result.recordset[0];
  return row ? mapCoaRowToCustomer(row) : null;
}

async function searchCustomers(query) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('query', sql.NVarChar, `%${query}%`)
    .input('acType', sql.Int, CUSTOMER_AC_TYPE)
    .query(`
      SELECT TOP 50 *
      FROM COA
      WHERE ACType = @acType
        AND (isactive IS NULL OR isactive = 1)
        AND (
          Subsidary LIKE @query
          OR CAST(code AS NVARCHAR(50)) LIKE @query
          OR OCell LIKE @query
          OR OAddress LIKE @query
        )
      ORDER BY Subsidary
    `);
  return result.recordset.map(mapCoaRowToCustomer);
}

async function fetchItems(limit = 2000) {
  const pool = await getPool();
  const safeLimit = Math.min(Math.max(Number(limit) || 2000, 1), 10000);
  const result = await pool
    .request()
    .input('limit', sql.Int, safeLimit)
    .query(`
      SELECT TOP (@limit) *
      FROM Products
      WHERE isactive IS NULL OR isactive = 1
      ORDER BY Name
    `);
  return result.recordset.map(mapProductRowToItem);
}

async function fetchItemById(id) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, Number(id))
    .query('SELECT * FROM Products WHERE ID = @id');
  const row = result.recordset[0];
  return row ? mapProductRowToItem(row) : null;
}

async function fetchStock() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT
      p.*,
      t.os,
      t.purchase,
      t.purchasereturn,
      t.sale,
      t.salereturn
    FROM Products p
    LEFT JOIN tempstock t ON p.ID = t.PRID
    WHERE p.isactive IS NULL OR p.isactive = 1
    ORDER BY p.Name
  `);
  return result.recordset.map(mapStockRow);
}

async function fetchProductHistory(limit = 500, productId = null) {
  const pool = await getPool();
  const request = pool.request().input('limit', sql.Int, limit);

  let productFilter = '';
  if (productId != null && productId !== '') {
    request.input('productId', sql.Int, Number(productId));
    productFilter = 'AND p.Prid = @productId';
  }

  const result = await request.query(`
    SELECT TOP (@limit)
      p.*,
      pr.Name AS productName,
      pr.code AS productCode,
      c.Subsidary AS partyName
    FROM PSProduct p
    LEFT JOIN Products pr ON p.Prid = pr.ID
    LEFT JOIN COA c ON p.Acid = c.Id
    WHERE 1 = 1
    ${productFilter}
    ORDER BY p.Date DESC, p.ID DESC
  `);

  return result.recordset.map(mapProductHistoryRow);
}

async function fetchLedgerEntries({ accountId, fromDate, toDate, limit = 1000 } = {}) {
  const pool = await getPool();
  const request = pool.request().input('limit', sql.Int, limit);

  const conditions = ['1 = 1'];
  if (accountId) {
    request.input('accountId', sql.Int, Number(accountId));
    conditions.push('l.Acid = @accountId');
  }
  if (fromDate) {
    request.input('fromDate', sql.DateTime, new Date(fromDate));
    conditions.push('l.Date >= @fromDate');
  }
  if (toDate) {
    request.input('toDate', sql.DateTime, new Date(toDate));
    conditions.push('l.Date <= @toDate');
  }

  const result = await request.query(`
    SELECT TOP (@limit)
      l.*,
      c.Subsidary AS accountName,
      c.code AS accountCode
    FROM Ledgers l
    LEFT JOIN COA c ON l.Acid = c.Id
    WHERE ${conditions.join(' AND ')}
    ORDER BY l.Date DESC, l.Id DESC
  `);

  return result.recordset.map(mapLedgerRow);
}

async function fetchSaleHeaders(limit = 100) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('limit', sql.Int, limit)
    .query(`
      SELECT TOP (@limit) *
      FROM PSDetail
      WHERE Type = 'Sale'
      ORDER BY Doc DESC
    `);
  return result.recordset;
}

async function fetchSaleByDoc(doc) {
  const pool = await getPool();
  const headerResult = await pool
    .request()
    .input('doc', sql.Int, Number(doc))
    .query(`
      SELECT *
      FROM PSDetail
      WHERE Doc = @doc AND Type = 'Sale'
    `);

  const header = headerResult.recordset[0];
  if (!header) return null;

  const customerRow = header.Acid != null ? await fetchCoaById(header.Acid) : null;
  const customer = customerRow
    ? {
        code: customerRow.code != null ? String(customerRow.code) : String(customerRow.Id),
        name: customerRow.Subsidary || '',
      }
    : null;

  const linesResult = await pool
    .request()
    .input('doc', sql.Int, Number(doc))
    .input('lineLimit', sql.Int, 500)
    .query(`
      SELECT TOP (@lineLimit)
        p.*,
        pr.Name AS productName,
        pr.UrduName AS urduName,
        pr.code AS productCode,
        pr.Size AS uom,
        pr.PurchaseRate AS purchaseRate,
        pr.Packing AS packingSize
      FROM PSProduct p
      LEFT JOIN Products pr ON p.Prid = pr.ID
      WHERE p.Doc = @doc AND p.Type = 'Sale'
      ORDER BY p.ID
    `);

  const sale = mapSaleHeader(
    header,
    customer ? { id: header.Acid, code: customer.code, name: customer.name } : null
  );
  sale.products = linesResult.recordset.map((row, index) => ({
    ...mapSaleLineRow(row),
    sr: index + 1,
  }));

  const netAmount = sale.products.reduce((sum, item) => sum + (parseFloat(item.netAmount) || 0), 0);
  sale.netAmount = netAmount.toFixed(2);
  sale.billAmount = (header.Amount ?? netAmount).toFixed(2);
  sale.netReceivable = sale.billAmount;

  return sale;
}

async function fetchProductOnHand(productId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, Number(productId))
    .query(`
      SELECT ISNULL(t.os, ISNULL(p.OQty, 0)) AS onHandQty
      FROM Products p
      LEFT JOIN tempstock t ON p.ID = t.PRID
      WHERE p.ID = @id
    `);
  return result.recordset[0]?.onHandQty ?? 0;
}

async function fetchLatestSale() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT TOP 1 Doc
    FROM PSDetail
    WHERE Type = 'Sale'
    ORDER BY Doc DESC
  `);
  const doc = result.recordset[0]?.Doc;
  if (doc == null) return null;
  return fetchSaleByDoc(doc);
}

async function fetchSalesByCustomer(customerId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('acid', sql.Int, Number(customerId))
    .query(`
      SELECT TOP 20 Doc, invoice, Date, Amount, Received
      FROM PSDetail
      WHERE Type = 'Sale' AND Acid = @acid
      ORDER BY Doc DESC
    `);
  return result.recordset.map(row => ({
    doc: row.Doc,
    invoiceNo: resolveSaleInvoiceNo(row),
    date: row.Date ? new Date(row.Date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '',
    amount: row.Amount ?? 0,
    received: row.Received ?? 0,
  }));
}

async function fetchProductSoldHistory(customerId, productId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('acid', sql.Int, Number(customerId))
    .input('prid', sql.Int, Number(productId))
    .query(`
      SELECT TOP 15
        ps.Doc,
        ps.Date,
        pp.Qty,
        pp.Rate,
        pp.VIST AS Net
      FROM PSDetail ps
      INNER JOIN PSProduct pp ON ps.Doc = pp.Doc AND ps.Type = pp.Type
      WHERE ps.Type = 'Sale' AND ps.Acid = @acid AND pp.Prid = @prid
      ORDER BY ps.Doc DESC
    `);
  return result.recordset.map(row => ({
    doc: row.Doc,
    date: row.Date ? new Date(row.Date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '',
    qty: row.Qty ?? 0,
    rate: row.Rate ?? 0,
    net: row.Net ?? 0,
  }));
}

async function searchSaleByInvoice(invoiceNo) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('invoice', sql.NVarChar, String(invoiceNo))
    .query(`
      SELECT TOP 1 Doc
      FROM PSDetail
      WHERE Type = 'Sale'
        AND (
          CAST(Doc AS NVARCHAR(50)) = @invoice
          OR (invoice = @invoice AND invoice NOT IN ('0', ''))
        )
      ORDER BY Doc DESC
    `);
  const doc = result.recordset[0]?.Doc;
  if (doc == null) return null;
  return fetchSaleByDoc(doc);
}

async function updateSale(doc, data) {
  const pool = await getPool();
  const transaction = pool.transaction();
  await transaction.begin();

  try {
    let acid = null;
    let customerName = '';
    if (data.customerCode) {
      const custResult = await transaction
        .request()
        .input('custId', sql.Int, Number(data.customerCode))
        .query(`SELECT TOP 1 Id, Subsidary FROM COA WHERE Id = @custId`);
      if (custResult.recordset.length > 0) {
        acid = custResult.recordset[0].Id;
        customerName = custResult.recordset[0].Subsidary || '';
      }
    }

    const totalAmount = (data.products || []).reduce(
      (sum, p) => sum + (parseFloat(p.net) || 0), 0
    );

    let saleDate = new Date();
    if (data.date) {
      const parsed = Date.parse(data.date);
      if (!isNaN(parsed)) saleDate = new Date(parsed);
    }

    let dueDate = saleDate;
    if (data.dueDate) {
      const parsed = Date.parse(data.dueDate);
      if (!isNaN(parsed)) dueDate = new Date(parsed);
    }

    await transaction
      .request()
      .input('doc', sql.Int, Number(doc))
      .input('date', sql.DateTime, saleDate)
      .input('acid', sql.Int, acid)
      .input('invoice', sql.NVarChar, data.invoiceNo || String(doc))
      .input('term', sql.NVarChar, data.paymentType || 'Cash')
      .input('creditDays', sql.Int, parseInt(data.creditDays) || 0)
      .input('dueDate', sql.DateTime, dueDate)
      .input('amount', sql.Float, totalAmount)
      .input('discount', sql.Float, parseFloat(data.discPercentFooter) || 0)
      .input('extraDiscount', sql.Float, parseFloat(data.extraDiscount) || 0)
      .input('pbalance', sql.Float, parseFloat(data.previousBalance) || 0)
      .input('received', sql.Float, parseFloat(data.cashPaid) || 0)
      .input('description', sql.NVarChar, data.description || '')
      .query(`
        UPDATE PSDetail SET
          Date = @date, Acid = @acid, invoice = @invoice, Term = @term,
          CreditDays = @creditDays, DueDate = @dueDate, Amount = @amount,
          Discount = @discount, ExtraDiscount = @extraDiscount, PBalance = @pbalance,
          Received = @received, Description = @description
        WHERE Doc = @doc AND Type = 'Sale'
      `);

    await transaction.request()
      .input('doc', sql.Int, Number(doc))
      .query(`DELETE FROM PSProduct WHERE Doc = @doc AND Type = 'Sale'`);

    for (const product of (data.products || [])) {
      let prid = null;
      if (product.productCode) {
        const prodResult = await transaction
          .request()
          .input('pcode', sql.NVarChar, String(product.productCode))
          .query(`SELECT TOP 1 ID FROM Products WHERE code = @pcode`);
        if (prodResult.recordset.length > 0) {
          prid = prodResult.recordset[0].ID;
        }
      }
      if (!prid && product.product) {
        prid = Number(product.product) || null;
      }
      if (!prid && product.productId) {
        prid = Number(product.productId) || null;
      }

      await transaction
        .request()
        .input('doc', sql.Int, Number(doc))
        .input('type', sql.NVarChar, 'Sale')
        .input('prid', sql.Int, prid)
        .input('qty', sql.Float, parseFloat(product.pcs) || 0)
        .input('rate', sql.Float, parseFloat(product.rate) || 0)
        .input('vest', sql.Float, parseFloat(product.amount) || 0)
        .input('discount', sql.Float, parseFloat(product.discount) || 0)
        .input('discP', sql.Float, parseFloat(product.discPercent) || 0)
        .input('vist', sql.Float, parseFloat(product.net || product.netAmount) || 0)
        .input('packet', sql.NVarChar, product.packing || '')
        .input('comments', sql.NVarChar, product.remarks || '')
        .query(`
          INSERT INTO PSProduct (
            Doc, Type, Prid, Qty, Rate, VEST, Discount, DiscP, VIST, Packet, comments
          ) VALUES (
            @doc, @type, @prid, @qty, @rate, @vest, @discount, @discP, @vist, @packet, @comments
          )
        `);
    }

    await deleteSaleLedgerEntries(transaction, doc);
    await writeSaleLedgerEntries(transaction, {
      doc: Number(doc),
      saleDate,
      customerId: acid,
      customerName,
      totalAmount,
      invoiceNo: data.invoiceNo || String(doc),
      received: (() => {
        const paid = parseFloat(data.cashPaid) || 0;
        if (paid > 0) return paid;
        return (data.paymentType || '').toLowerCase() === 'cash' ? totalAmount : 0;
      })(),
    });

    await transaction.commit();
    return { doc, message: 'Sale updated successfully! Invoice, stock & ledger updated.' };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function deleteSale(doc) {
  const pool = await getPool();
  const transaction = pool.transaction();
  await transaction.begin();

  try {
    await transaction.request()
      .input('doc', sql.Int, Number(doc))
      .query(`DELETE FROM PSProduct WHERE Doc = @doc AND Type = 'Sale'`);

    await deleteSaleLedgerEntries(transaction, doc);

    await transaction.request()
      .input('doc', sql.Int, Number(doc))
      .query(`DELETE FROM PSDetail WHERE Doc = @doc AND Type = 'Sale'`);

    await transaction.commit();
    return { doc, message: 'Sale deleted successfully' };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function fetchCashReceiptsByCRV(crvNo) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('doc', sql.Int, Number(crvNo))
    .query(`
      SELECT l.*, c.Subsidary AS accountName, c.code AS accountCode
      FROM Ledgers l
      LEFT JOIN COA c ON l.Acid = c.Id
      WHERE l.Doc = @doc AND l.Type = 'CRV'
      ORDER BY l.Id ASC
    `);
  return result.recordset.map((row, i) => ({
    id: row.Id,
    sr: i + 1,
    date: row.Date ? new Date(row.Date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '',
    crvNumber: row.Doc,
    accountTitle: row.accountName || '',
    accountCode: row.accountCode != null ? String(row.accountCode) : '',
    accountId: row.Acid,
    description: row.Narration || '',
    invoice: row.Invoice != null ? String(row.Invoice) : '',
    amount: row.Debit ?? 0,
    discount: row.Credit ?? 0,
  }));
}

async function createCashReceipt(data) {
  const pool = await getPool();
  let docNo = data.crvNumber;
  if (!docNo) {
    const maxResult = await pool.request().query(
      `SELECT ISNULL(MAX(Doc), 0) + 1 AS nextDoc FROM Ledgers WHERE Type = 'CRV'`
    );
    docNo = maxResult.recordset[0].nextDoc;
  }

  let acid = null;
  if (data.accountId) {
    acid = Number(data.accountId);
  } else if (data.code) {
    const codeResult = await pool.request()
      .input('code', sql.NVarChar, String(data.code))
      .query(`SELECT TOP 1 Id FROM COA WHERE code = @code`);
    if (codeResult.recordset.length > 0) acid = codeResult.recordset[0].Id;
  }

  let receiptDate = new Date();
  if (data.date) {
    const parsed = Date.parse(data.date);
    if (!isNaN(parsed)) receiptDate = new Date(parsed);
  }

  const invoiceVal = data.invoice && !isNaN(Number(data.invoice)) ? Number(data.invoice) : null;

  const idResult = await pool.request().query(`SELECT ISNULL(MAX(Id), 0) + 1 AS nextId FROM Ledgers`);
  const nextId = idResult.recordset[0].nextId;

  await pool.request()
    .input('id', sql.Int, nextId)
    .input('doc', sql.Int, Number(docNo))
    .input('type', sql.NVarChar, 'CRV')
    .input('date', sql.DateTime, receiptDate)
    .input('acid', sql.Int, acid)
    .input('narration', sql.NVarChar, data.description || '')
    .input('invoice', sql.Int, invoiceVal)
    .input('debit', sql.Float, parseFloat(data.amount) || 0)
    .input('credit', sql.Float, parseFloat(data.discount) || 0)
    .query(`
      INSERT INTO Ledgers (Id, Doc, Type, Date, Acid, Narration, Invoice, Debit, Credit)
      VALUES (@id, @doc, @type, @date, @acid, @narration, @invoice, @debit, @credit)
    `);

  const result = { recordset: [{ Id: nextId }] };

  return { id: result.recordset[0]?.Id, doc: Number(docNo), message: 'Cash receipt saved successfully' };
}

async function deleteCashReceiptById(id) {
  const pool = await getPool();
  await pool.request()
    .input('id', sql.Int, Number(id))
    .query(`DELETE FROM Ledgers WHERE Id = @id AND Type = 'CRV'`);
  return { message: 'Cash receipt deleted successfully' };
}

async function getNextCRVNumber() {
  const pool = await getPool();
  const result = await pool.request().query(
    `SELECT ISNULL(MAX(Doc), 0) + 1 AS nextDoc FROM Ledgers WHERE Type = 'CRV'`
  );
  return result.recordset[0].nextDoc;
}

function mapBankReceiptRow(row, index = 0) {
  return {
    id: row.Id,
    sr: index + 1,
    date: row.Date ? new Date(row.Date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '',
    brvNumber: row.Doc,
    accountTitle: row.accountName || '',
    accountCode: row.accountCode != null ? String(row.accountCode) : '',
    accountId: row.Acid,
    description: row.Narration || '',
    chequeNo: row.Cheque || '',
    amount: row.Debit ?? 0,
    dueDate: row.duedate ? new Date(row.duedate).toISOString().slice(0, 10) : '',
    receivingDate: row.Date ? new Date(row.Date).toISOString().slice(0, 10) : '',
  };
}

async function fetchBankReceiptsList(limit = 100) {
  const pool = await getPool();
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
  const result = await pool.request()
    .input('limit', sql.Int, safeLimit)
    .query(`
      SELECT TOP (@limit) l.Id, l.Doc, l.Date, l.Acid, l.Narration, l.Cheque, l.Debit, l.duedate,
        c.Subsidary AS accountName, c.code AS accountCode
      FROM Ledgers l
      LEFT JOIN COA c ON l.Acid = c.Id
      WHERE l.Type = 'BRV'
      ORDER BY l.Doc DESC, l.Id DESC
    `);
  return result.recordset.map((row, i) => mapBankReceiptRow(row, i));
}

async function fetchBankReceiptByBRV(brvNo) {
  const pool = await getPool();
  const result = await pool.request()
    .input('doc', sql.Int, Number(brvNo))
    .query(`
      SELECT l.Id, l.Doc, l.Date, l.Acid, l.Narration, l.Cheque, l.Debit, l.duedate,
        c.Subsidary AS accountName, c.code AS accountCode
      FROM Ledgers l
      LEFT JOIN COA c ON l.Acid = c.Id
      WHERE l.Doc = @doc AND l.Type = 'BRV'
      ORDER BY l.Id ASC
    `);
  return result.recordset.map((row, i) => mapBankReceiptRow(row, i));
}

async function fetchBankReceiptById(id) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, Number(id))
    .query(`
      SELECT l.Id, l.Doc, l.Date, l.Acid, l.Narration, l.Cheque, l.Debit, l.duedate,
        c.Subsidary AS accountName, c.code AS accountCode
      FROM Ledgers l
      LEFT JOIN COA c ON l.Acid = c.Id
      WHERE l.Id = @id AND l.Type = 'BRV'
    `);
  const row = result.recordset[0];
  return row ? mapBankReceiptRow(row) : null;
}

async function createBankReceipt(data) {
  const pool = await getPool();
  let docNo = data.brvNumber;
  if (!docNo) {
    const maxResult = await pool.request().query(
      `SELECT ISNULL(MAX(Doc), 0) + 1 AS nextDoc FROM Ledgers WHERE Type = 'BRV'`,
    );
    docNo = maxResult.recordset[0].nextDoc;
  }

  let acid = null;
  if (data.accountId) {
    acid = Number(data.accountId);
  } else if (data.code) {
    const codeResult = await pool.request()
      .input('code', sql.NVarChar, String(data.code))
      .query('SELECT TOP 1 Id FROM COA WHERE code = @code');
    if (codeResult.recordset.length > 0) acid = codeResult.recordset[0].Id;
  }

  let receivingDate = new Date();
  if (data.receivingDate) {
    const parsed = Date.parse(data.receivingDate);
    if (!Number.isNaN(parsed)) receivingDate = new Date(parsed);
  } else if (data.date) {
    const parsed = Date.parse(data.date);
    if (!Number.isNaN(parsed)) receivingDate = new Date(parsed);
  }

  let dueDate = null;
  if (data.dueDate) {
    const parsedDue = Date.parse(data.dueDate);
    if (!Number.isNaN(parsedDue)) dueDate = new Date(parsedDue);
  }

  const idResult = await pool.request().query('SELECT ISNULL(MAX(Id), 0) + 1 AS nextId FROM Ledgers');
  const nextId = idResult.recordset[0].nextId;

  await pool.request()
    .input('id', sql.Int, nextId)
    .input('doc', sql.Int, Number(docNo))
    .input('type', sql.NVarChar, 'BRV')
    .input('date', sql.DateTime, receivingDate)
    .input('acid', sql.Int, acid)
    .input('narration', sql.NVarChar, data.description || '')
    .input('cheque', sql.NVarChar, data.chequeNo || '')
    .input('debit', sql.Float, parseFloat(data.amount) || 0)
    .input('credit', sql.Float, 0)
    .input('duedate', sql.DateTime, dueDate)
    .query(`
      INSERT INTO Ledgers (Id, Doc, Type, Date, Acid, Narration, Cheque, Debit, Credit, duedate)
      VALUES (@id, @doc, @type, @date, @acid, @narration, @cheque, @debit, @credit, @duedate)
    `);

  return { id: nextId, doc: Number(docNo), message: 'Bank receipt saved successfully' };
}

async function updateBankReceiptById(id, data) {
  const pool = await getPool();
  let acid = null;
  if (data.accountId) {
    acid = Number(data.accountId);
  } else if (data.code) {
    const codeResult = await pool.request()
      .input('code', sql.NVarChar, String(data.code))
      .query('SELECT TOP 1 Id FROM COA WHERE code = @code');
    if (codeResult.recordset.length > 0) acid = codeResult.recordset[0].Id;
  }

  let receivingDate = new Date();
  if (data.receivingDate) {
    const parsed = Date.parse(data.receivingDate);
    if (!Number.isNaN(parsed)) receivingDate = new Date(parsed);
  } else if (data.date) {
    const parsed = Date.parse(data.date);
    if (!Number.isNaN(parsed)) receivingDate = new Date(parsed);
  }

  let dueDate = null;
  if (data.dueDate) {
    const parsedDue = Date.parse(data.dueDate);
    if (!Number.isNaN(parsedDue)) dueDate = new Date(parsedDue);
  }

  await pool.request()
    .input('id', sql.Int, Number(id))
    .input('date', sql.DateTime, receivingDate)
    .input('acid', sql.Int, acid)
    .input('narration', sql.NVarChar, data.description || '')
    .input('cheque', sql.NVarChar, data.chequeNo || '')
    .input('debit', sql.Float, parseFloat(data.amount) || 0)
    .input('duedate', sql.DateTime, dueDate)
    .query(`
      UPDATE Ledgers
      SET Date = @date, Acid = @acid, Narration = @narration, Cheque = @cheque,
          Debit = @debit, duedate = @duedate
      WHERE Id = @id AND Type = 'BRV'
    `);

  return { message: 'Bank receipt updated successfully' };
}

async function deleteBankReceiptById(id) {
  const pool = await getPool();
  await pool.request()
    .input('id', sql.Int, Number(id))
    .query(`DELETE FROM Ledgers WHERE Id = @id AND Type = 'BRV'`);
  return { message: 'Bank receipt deleted successfully' };
}

async function getNextBRVNumber() {
  const pool = await getPool();
  const result = await pool.request().query(
    `SELECT ISNULL(MAX(Doc), 0) + 1 AS nextDoc FROM Ledgers WHERE Type = 'BRV'`,
  );
  return result.recordset[0].nextDoc;
}

function mapBankPaymentRow(row, index = 0) {
  return {
    id: row.Id,
    sr: index + 1,
    date: row.Date ? new Date(row.Date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '',
    bpvNumber: row.Doc,
    accountTitle: row.accountName || '',
    accountCode: row.accountCode != null ? String(row.accountCode) : '',
    accountId: row.Acid,
    description: row.Narration || '',
    chequeNo: row.Cheque || '',
    amount: row.Debit ?? 0,
    dueDate: row.duedate ? new Date(row.duedate).toISOString().slice(0, 10) : '',
    issueDate: row.Date ? new Date(row.Date).toISOString().slice(0, 10) : '',
  };
}

async function fetchBankPaymentsList(limit = 100) {
  const pool = await getPool();
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
  const result = await pool.request()
    .input('limit', sql.Int, safeLimit)
    .query(`
      SELECT TOP (@limit) l.Id, l.Doc, l.Date, l.Acid, l.Narration, l.Cheque, l.Debit, l.duedate,
        c.Subsidary AS accountName, c.code AS accountCode
      FROM Ledgers l
      LEFT JOIN COA c ON l.Acid = c.Id
      WHERE l.Type = 'BPV'
      ORDER BY l.Doc DESC, l.Id DESC
    `);
  return result.recordset.map((row, i) => mapBankPaymentRow(row, i));
}

async function fetchBankPaymentByBPV(bpvNo) {
  const pool = await getPool();
  const result = await pool.request()
    .input('doc', sql.Int, Number(bpvNo))
    .query(`
      SELECT l.Id, l.Doc, l.Date, l.Acid, l.Narration, l.Cheque, l.Debit, l.duedate,
        c.Subsidary AS accountName, c.code AS accountCode
      FROM Ledgers l
      LEFT JOIN COA c ON l.Acid = c.Id
      WHERE l.Doc = @doc AND l.Type = 'BPV'
      ORDER BY l.Id ASC
    `);
  return result.recordset.map((row, i) => mapBankPaymentRow(row, i));
}

async function fetchBankPaymentById(id) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, Number(id))
    .query(`
      SELECT l.Id, l.Doc, l.Date, l.Acid, l.Narration, l.Cheque, l.Debit, l.duedate,
        c.Subsidary AS accountName, c.code AS accountCode
      FROM Ledgers l
      LEFT JOIN COA c ON l.Acid = c.Id
      WHERE l.Id = @id AND l.Type = 'BPV'
    `);
  const row = result.recordset[0];
  return row ? mapBankPaymentRow(row) : null;
}

async function createBankPayment(data) {
  const pool = await getPool();
  let docNo = data.bpvNumber;
  if (!docNo) {
    const maxResult = await pool.request().query(
      `SELECT ISNULL(MAX(Doc), 0) + 1 AS nextDoc FROM Ledgers WHERE Type = 'BPV'`,
    );
    docNo = maxResult.recordset[0].nextDoc;
  }

  let acid = null;
  if (data.accountId) {
    acid = Number(data.accountId);
  } else if (data.code) {
    const codeResult = await pool.request()
      .input('code', sql.NVarChar, String(data.code))
      .query('SELECT TOP 1 Id FROM COA WHERE code = @code');
    if (codeResult.recordset.length > 0) acid = codeResult.recordset[0].Id;
  }

  let issueDate = new Date();
  if (data.issueDate) {
    const parsed = Date.parse(data.issueDate);
    if (!Number.isNaN(parsed)) issueDate = new Date(parsed);
  } else if (data.date) {
    const parsed = Date.parse(data.date);
    if (!Number.isNaN(parsed)) issueDate = new Date(parsed);
  }

  let dueDate = null;
  if (data.dueDate) {
    const parsedDue = Date.parse(data.dueDate);
    if (!Number.isNaN(parsedDue)) dueDate = new Date(parsedDue);
  }

  const idResult = await pool.request().query('SELECT ISNULL(MAX(Id), 0) + 1 AS nextId FROM Ledgers');
  const nextId = idResult.recordset[0].nextId;

  await pool.request()
    .input('id', sql.Int, nextId)
    .input('doc', sql.Int, Number(docNo))
    .input('type', sql.NVarChar, 'BPV')
    .input('date', sql.DateTime, issueDate)
    .input('acid', sql.Int, acid)
    .input('narration', sql.NVarChar, data.description || '')
    .input('cheque', sql.NVarChar, data.chequeNo || '')
    .input('debit', sql.Float, parseFloat(data.amount) || 0)
    .input('credit', sql.Float, 0)
    .input('duedate', sql.DateTime, dueDate)
    .query(`
      INSERT INTO Ledgers (Id, Doc, Type, Date, Acid, Narration, Cheque, Debit, Credit, duedate)
      VALUES (@id, @doc, @type, @date, @acid, @narration, @cheque, @debit, @credit, @duedate)
    `);

  return { id: nextId, doc: Number(docNo), message: 'Bank payment saved successfully' };
}

async function updateBankPaymentById(id, data) {
  const pool = await getPool();
  let acid = null;
  if (data.accountId) {
    acid = Number(data.accountId);
  } else if (data.code) {
    const codeResult = await pool.request()
      .input('code', sql.NVarChar, String(data.code))
      .query('SELECT TOP 1 Id FROM COA WHERE code = @code');
    if (codeResult.recordset.length > 0) acid = codeResult.recordset[0].Id;
  }

  let issueDate = new Date();
  if (data.issueDate) {
    const parsed = Date.parse(data.issueDate);
    if (!Number.isNaN(parsed)) issueDate = new Date(parsed);
  } else if (data.date) {
    const parsed = Date.parse(data.date);
    if (!Number.isNaN(parsed)) issueDate = new Date(parsed);
  }

  let dueDate = null;
  if (data.dueDate) {
    const parsedDue = Date.parse(data.dueDate);
    if (!Number.isNaN(parsedDue)) dueDate = new Date(parsedDue);
  }

  await pool.request()
    .input('id', sql.Int, Number(id))
    .input('date', sql.DateTime, issueDate)
    .input('acid', sql.Int, acid)
    .input('narration', sql.NVarChar, data.description || '')
    .input('cheque', sql.NVarChar, data.chequeNo || '')
    .input('debit', sql.Float, parseFloat(data.amount) || 0)
    .input('duedate', sql.DateTime, dueDate)
    .query(`
      UPDATE Ledgers
      SET Date = @date, Acid = @acid, Narration = @narration, Cheque = @cheque,
          Debit = @debit, duedate = @duedate
      WHERE Id = @id AND Type = 'BPV'
    `);

  return { message: 'Bank payment updated successfully' };
}

async function deleteBankPaymentById(id) {
  const pool = await getPool();
  await pool.request()
    .input('id', sql.Int, Number(id))
    .query(`DELETE FROM Ledgers WHERE Id = @id AND Type = 'BPV'`);
  return { message: 'Bank payment deleted successfully' };
}

async function getNextBPVNumber() {
  const pool = await getPool();
  const result = await pool.request().query(
    `SELECT ISNULL(MAX(Doc), 0) + 1 AS nextDoc FROM Ledgers WHERE Type = 'BPV'`,
  );
  return result.recordset[0].nextDoc;
}

const CHEQUE_TRANSFER_TYPE = 'CTV';
const RECEIVED_CHEQUE_TYPES = ['BRV', 'CRV'];
const PAID_CHEQUE_TYPES = ['BPV', 'CPV'];

function mapPendingChequeRow(row, index = 0) {
  const amount = row.Debit > 0 ? row.Debit : (row.Credit > 0 ? row.Credit : 0);
  return {
    id: row.Id,
    sourceLedgerId: row.Id,
    sr: index + 1,
    chequeNo: row.Cheque || '',
    dueDate: row.duedate ? new Date(row.duedate).toISOString().slice(0, 10) : '',
    dueDateDisplay: row.duedate
      ? new Date(row.duedate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
      : '',
    description: row.Narration || '',
    amount,
    ledgerType: row.Type,
    accountTitle: row.accountName || '',
    accountId: row.Acid,
    doc: row.Doc,
  };
}

function mapChequeTransferRow(row, index = 0) {
  return {
    id: row.Id,
    sr: index + 1,
    doc: row.Doc,
    transferDate: row.Date ? new Date(row.Date).toISOString().slice(0, 10) : '',
    dateDisplay: row.Date
      ? new Date(row.Date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
      : '',
    transferredToId: row.Acid,
    transferredToName: row.accountName || '',
    description: row.Narration || '',
    chequeNo: row.Cheque || '',
    dueDate: row.duedate ? new Date(row.duedate).toISOString().slice(0, 10) : '',
    amount: row.Debit > 0 ? row.Debit : (row.Credit > 0 ? row.Credit : 0),
    transferStatus: row.status === 1 ? 'Cash' : 'Pending',
    sourceLedgerId: row.Invoice != null ? row.Invoice : null,
  };
}

async function fetchPendingCheques(filter = 'received', search = '') {
  const pool = await getPool();
  const request = pool.request();
  let typeFilter = '';
  if (filter === 'received') {
    typeFilter = `AND l.Type IN ('${RECEIVED_CHEQUE_TYPES.join("','")}')`;
  } else if (filter === 'paid') {
    typeFilter = `AND l.Type IN ('${PAID_CHEQUE_TYPES.join("','")}')`;
  } else {
    typeFilter = `AND l.Type IN ('${[...RECEIVED_CHEQUE_TYPES, ...PAID_CHEQUE_TYPES].join("','")}')`;
  }

  let searchFilter = '';
  if (search && search.trim()) {
    request.input('search', sql.NVarChar, `%${search.trim()}%`);
    searchFilter = `
      AND (
        l.Cheque LIKE @search
        OR l.Narration LIKE @search
        OR c.Subsidary LIKE @search
        OR CAST(l.Debit AS NVARCHAR(50)) LIKE @search
      )
    `;
  }

  const result = await request.query(`
    SELECT l.Id, l.Doc, l.Type, l.Date, l.Acid, l.Narration, l.Cheque, l.Debit, l.Credit, l.duedate,
      c.Subsidary AS accountName
    FROM Ledgers l
    LEFT JOIN COA c ON l.Acid = c.Id
    WHERE l.Cheque IS NOT NULL AND LTRIM(RTRIM(l.Cheque)) <> ''
      AND (l.status IS NULL OR l.status = 0)
      ${typeFilter}
      ${searchFilter}
    ORDER BY l.duedate ASC, l.Id DESC
  `);
  return result.recordset.map((row, i) => mapPendingChequeRow(row, i));
}

async function getNextChequeTransferDoc() {
  const pool = await getPool();
  const result = await pool.request().query(
    `SELECT ISNULL(MAX(Doc), 0) + 1 AS nextDoc FROM Ledgers WHERE Type = '${CHEQUE_TRANSFER_TYPE}'`,
  );
  return result.recordset[0].nextDoc;
}

async function fetchChequeTransferByDoc(doc) {
  const pool = await getPool();
  const result = await pool.request()
    .input('doc', sql.Int, Number(doc))
    .query(`
      SELECT l.Id, l.Doc, l.Date, l.Acid, l.Narration, l.Cheque, l.Debit, l.Credit, l.duedate, l.status, l.Invoice,
        c.Subsidary AS accountName
      FROM Ledgers l
      LEFT JOIN COA c ON l.Acid = c.Id
      WHERE l.Doc = @doc AND l.Type = '${CHEQUE_TRANSFER_TYPE}'
      ORDER BY l.Id ASC
    `);
  const row = result.recordset[0];
  return row ? mapChequeTransferRow(row) : null;
}

async function fetchChequeTransferById(id) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, Number(id))
    .query(`
      SELECT l.Id, l.Doc, l.Date, l.Acid, l.Narration, l.Cheque, l.Debit, l.Credit, l.duedate, l.status, l.Invoice,
        c.Subsidary AS accountName
      FROM Ledgers l
      LEFT JOIN COA c ON l.Acid = c.Id
      WHERE l.Id = @id AND l.Type = '${CHEQUE_TRANSFER_TYPE}'
    `);
  const row = result.recordset[0];
  return row ? mapChequeTransferRow(row) : null;
}

async function createChequeTransfer(data) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const sourceId = data.sourceLedgerId ? Number(data.sourceLedgerId) : null;
    if (!sourceId) {
      throw new Error('Select a cheque from the pending list first.');
    }
    if (!data.transferredToId) {
      throw new Error('Select Transferred to account.');
    }
    if (!data.chequeNo) {
      throw new Error('Cheque number is required.');
    }

    const sourceCheck = await new sql.Request(transaction)
      .input('id', sql.Int, sourceId)
      .query(`
        SELECT Id, Cheque, Debit, Credit, duedate, Narration, status
        FROM Ledgers WHERE Id = @id
      `);
    const source = sourceCheck.recordset[0];
    if (!source) {
      throw new Error('Source cheque record not found.');
    }
    if (source.status === 1) {
      throw new Error('This cheque has already been transferred.');
    }

    let docNo = data.docNumber;
    if (!docNo) {
      const maxResult = await new sql.Request(transaction).query(
        `SELECT ISNULL(MAX(Doc), 0) + 1 AS nextDoc FROM Ledgers WHERE Type = '${CHEQUE_TRANSFER_TYPE}'`,
      );
      docNo = maxResult.recordset[0].nextDoc;
    }

    let transferDate = new Date();
    if (data.transferDate) {
      const parsed = Date.parse(data.transferDate);
      if (!Number.isNaN(parsed)) transferDate = new Date(parsed);
    }

    let dueDate = null;
    if (data.dueDate) {
      const parsedDue = Date.parse(data.dueDate);
      if (!Number.isNaN(parsedDue)) dueDate = new Date(parsedDue);
    } else if (source.duedate) {
      dueDate = source.duedate;
    }

    const amount = parseFloat(data.amount) || source.Debit || source.Credit || 0;
    const transferStatusVal = data.transferStatus === 'Cash' ? 1 : 0;

    const idResult = await new sql.Request(transaction).query(
      'SELECT ISNULL(MAX(Id), 0) + 1 AS nextId FROM Ledgers',
    );
    const nextId = idResult.recordset[0].nextId;

    await new sql.Request(transaction)
      .input('id', sql.Int, nextId)
      .input('doc', sql.Int, Number(docNo))
      .input('type', sql.NVarChar, CHEQUE_TRANSFER_TYPE)
      .input('date', sql.DateTime, transferDate)
      .input('acid', sql.Int, Number(data.transferredToId))
      .input('narration', sql.NVarChar, data.description || source.Narration || '')
      .input('cheque', sql.NVarChar, data.chequeNo || source.Cheque || '')
      .input('debit', sql.Float, amount)
      .input('credit', sql.Float, 0)
      .input('duedate', sql.DateTime, dueDate)
      .input('status', sql.Int, transferStatusVal)
      .input('invoice', sql.Int, sourceId)
      .query(`
        INSERT INTO Ledgers (Id, Doc, Type, Date, Acid, Narration, Cheque, Debit, Credit, duedate, status, Invoice)
        VALUES (@id, @doc, @type, @date, @acid, @narration, @cheque, @debit, @credit, @duedate, @status, @invoice)
      `);

    await new sql.Request(transaction)
      .input('id', sql.Int, sourceId)
      .query('UPDATE Ledgers SET status = 1 WHERE Id = @id');

    await transaction.commit();
    return {
      id: nextId,
      doc: Number(docNo),
      message: 'Cheque transfer saved successfully',
    };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function updateChequeTransferById(id, data) {
  const pool = await getPool();
  const existing = await fetchChequeTransferById(id);
  if (!existing) {
    throw new Error('Cheque transfer not found.');
  }

  let transferDate = new Date();
  if (data.transferDate) {
    const parsed = Date.parse(data.transferDate);
    if (!Number.isNaN(parsed)) transferDate = new Date(parsed);
  }

  let dueDate = null;
  if (data.dueDate) {
    const parsedDue = Date.parse(data.dueDate);
    if (!Number.isNaN(parsedDue)) dueDate = new Date(parsedDue);
  }

  const transferStatusVal = data.transferStatus === 'Cash' ? 1 : 0;

  await pool.request()
    .input('id', sql.Int, Number(id))
    .input('date', sql.DateTime, transferDate)
    .input('acid', sql.Int, Number(data.transferredToId))
    .input('narration', sql.NVarChar, data.description || '')
    .input('cheque', sql.NVarChar, data.chequeNo || '')
    .input('debit', sql.Float, parseFloat(data.amount) || 0)
    .input('duedate', sql.DateTime, dueDate)
    .input('status', sql.Int, transferStatusVal)
    .query(`
      UPDATE Ledgers
      SET Date = @date, Acid = @acid, Narration = @narration, Cheque = @cheque,
          Debit = @debit, duedate = @duedate, status = @status
      WHERE Id = @id AND Type = '${CHEQUE_TRANSFER_TYPE}'
    `);

  return { message: 'Cheque transfer updated successfully' };
}

async function deleteChequeTransferById(id) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const row = await new sql.Request(transaction)
      .input('id', sql.Int, Number(id))
      .query(`SELECT Id, Invoice FROM Ledgers WHERE Id = @id AND Type = '${CHEQUE_TRANSFER_TYPE}'`);
    const transfer = row.recordset[0];
    if (!transfer) {
      throw new Error('Cheque transfer not found.');
    }

    if (transfer.Invoice) {
      await new sql.Request(transaction)
        .input('srcId', sql.Int, transfer.Invoice)
        .query('UPDATE Ledgers SET status = 0 WHERE Id = @srcId');
    }

    await new sql.Request(transaction)
      .input('id', sql.Int, Number(id))
      .query(`DELETE FROM Ledgers WHERE Id = @id AND Type = '${CHEQUE_TRANSFER_TYPE}'`);

    await transaction.commit();
    return { message: 'Cheque transfer deleted successfully' };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function fetchCashPayments(fromDate, toDate) {
  const pool = await getPool();
  const request = pool.request();
  let dateFilter = '';
  if (fromDate) {
    request.input('fromDate', sql.DateTime, new Date(fromDate));
    dateFilter += ' AND l.Date >= @fromDate';
  }
  if (toDate) {
    request.input('toDate', sql.DateTime, new Date(toDate + 'T23:59:59'));
    dateFilter += ' AND l.Date <= @toDate';
  }

  const result = await request.query(`
    SELECT l.*, c.Subsidary AS accountName, c.code AS accountCode
    FROM Ledgers l
    LEFT JOIN COA c ON l.Acid = c.Id
    WHERE l.Type = 'CPV' ${dateFilter}
    ORDER BY l.Doc DESC, l.Id ASC
  `);
  return result.recordset.map((row, i) => ({
    id: row.Id,
    sr: i + 1,
    date: row.Date ? new Date(row.Date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '',
    cpvNumber: row.Doc,
    accountTitle: row.accountName || '',
    accountCode: row.accountCode != null ? String(row.accountCode) : '',
    accountId: row.Acid,
    description: row.Narration || '',
    invoice: row.Invoice != null ? String(row.Invoice) : '',
    amount: row.Debit ?? 0,
  }));
}

async function fetchCashPaymentsByCPV(cpvNo) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('doc', sql.Int, Number(cpvNo))
    .query(`
      SELECT l.*, c.Subsidary AS accountName, c.code AS accountCode
      FROM Ledgers l
      LEFT JOIN COA c ON l.Acid = c.Id
      WHERE l.Doc = @doc AND l.Type = 'CPV'
      ORDER BY l.Id ASC
    `);
  return result.recordset.map((row, i) => ({
    id: row.Id,
    sr: i + 1,
    date: row.Date ? new Date(row.Date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '',
    cpvNumber: row.Doc,
    accountTitle: row.accountName || '',
    accountCode: row.accountCode != null ? String(row.accountCode) : '',
    accountId: row.Acid,
    description: row.Narration || '',
    invoice: row.Invoice != null ? String(row.Invoice) : '',
    amount: row.Debit ?? 0,
  }));
}

async function createCashPayment(data) {
  const pool = await getPool();
  let docNo = data.cpvNumber;
  if (!docNo) {
    const maxResult = await pool.request().query(
      `SELECT ISNULL(MAX(Doc), 0) + 1 AS nextDoc FROM Ledgers WHERE Type = 'CPV'`
    );
    docNo = maxResult.recordset[0].nextDoc;
  }

  let acid = null;
  if (data.accountId) {
    acid = Number(data.accountId);
  } else if (data.code) {
    const codeResult = await pool.request()
      .input('code', sql.NVarChar, String(data.code))
      .query(`SELECT TOP 1 Id FROM COA WHERE code = @code`);
    if (codeResult.recordset.length > 0) acid = codeResult.recordset[0].Id;
  }

  let paymentDate = new Date();
  if (data.date) {
    const parsed = Date.parse(data.date);
    if (!isNaN(parsed)) paymentDate = new Date(parsed);
  }

  const invoiceVal = data.invoice && !isNaN(Number(data.invoice)) ? Number(data.invoice) : null;
  const idResult = await pool.request().query(`SELECT ISNULL(MAX(Id), 0) + 1 AS nextId FROM Ledgers`);
  const nextId = idResult.recordset[0].nextId;

  await pool.request()
    .input('id', sql.Int, nextId)
    .input('doc', sql.Int, Number(docNo))
    .input('type', sql.NVarChar, 'CPV')
    .input('date', sql.DateTime, paymentDate)
    .input('acid', sql.Int, acid)
    .input('narration', sql.NVarChar, data.description || '')
    .input('invoice', sql.Int, invoiceVal)
    .input('debit', sql.Float, parseFloat(data.amount) || 0)
    .input('credit', sql.Float, 0)
    .query(`
      INSERT INTO Ledgers (Id, Doc, Type, Date, Acid, Narration, Invoice, Debit, Credit)
      VALUES (@id, @doc, @type, @date, @acid, @narration, @invoice, @debit, @credit)
    `);

  return { id: nextId, doc: Number(docNo), message: 'Cash payment saved successfully' };
}

async function updateCashPaymentById(id, data) {
  const pool = await getPool();
  let acid = null;
  if (data.accountId) {
    acid = Number(data.accountId);
  }

  let paymentDate = new Date();
  if (data.date) {
    const parsed = Date.parse(data.date);
    if (!isNaN(parsed)) paymentDate = new Date(parsed);
  }

  const invoiceVal = data.invoice && !isNaN(Number(data.invoice)) ? Number(data.invoice) : null;

  await pool.request()
    .input('id', sql.Int, Number(id))
    .input('date', sql.DateTime, paymentDate)
    .input('acid', sql.Int, acid)
    .input('narration', sql.NVarChar, data.description || '')
    .input('invoice', sql.Int, invoiceVal)
    .input('debit', sql.Float, parseFloat(data.amount) || 0)
    .query(`
      UPDATE Ledgers SET Date = @date, Acid = @acid, Narration = @narration, Invoice = @invoice, Debit = @debit
      WHERE Id = @id AND Type = 'CPV'
    `);

  return { message: 'Cash payment updated successfully' };
}

async function deleteCashPaymentById(id) {
  const pool = await getPool();
  await pool.request()
    .input('id', sql.Int, Number(id))
    .query(`DELETE FROM Ledgers WHERE Id = @id AND Type = 'CPV'`);
  return { message: 'Cash payment deleted successfully' };
}

async function getNextCPVNumber() {
  const pool = await getPool();
  const result = await pool.request().query(
    `SELECT ISNULL(MAX(Doc), 0) + 1 AS nextDoc FROM Ledgers WHERE Type = 'CPV'`
  );
  return result.recordset[0].nextDoc;
}

async function fetchTrialBalance(fromDate, toDate) {
  const pool = await getPool();
  const request = pool.request();

  let dateFilter = '';
  if (fromDate) {
    request.input('fromDate', sql.DateTime, new Date(fromDate));
    dateFilter += ' AND l.Date >= @fromDate';
  }
  if (toDate) {
    request.input('toDate', sql.DateTime, new Date(toDate + 'T23:59:59'));
    dateFilter += ' AND l.Date <= @toDate';
  }

  const result = await request.query(`
    SELECT 
      c.Id, c.code, c.Subsidary AS accountTitle, c.Main AS category, c.Control AS subCategory,
      ISNULL(SUM(l.Debit), 0) AS totalDebit,
      ISNULL(SUM(l.Credit), 0) AS totalCredit
    FROM COA c
    LEFT JOIN Ledgers l ON c.Id = l.Acid ${dateFilter}
    WHERE c.Subsidary IS NOT NULL AND LTRIM(RTRIM(c.Subsidary)) <> '' AND c.Subsidary <> 'N/A'
      AND (c.isactive IS NULL OR c.isactive = 1)
    GROUP BY c.Id, c.code, c.Subsidary, c.Main, c.Control
    HAVING ISNULL(SUM(l.Debit), 0) <> 0 OR ISNULL(SUM(l.Credit), 0) <> 0
    ORDER BY c.Main, c.Control, c.Subsidary
  `);

  const catResult = await pool.request().query(`
    SELECT DISTINCT Main AS category
    FROM COA
    WHERE Main IS NOT NULL AND LTRIM(RTRIM(Main)) <> ''
      AND (isactive IS NULL OR isactive = 1)
    ORDER BY Main
  `);

  const allCategories = catResult.recordset.map(r => r.category);

  return {
    accounts: result.recordset.map(row => ({
      id: row.Id,
      code: row.code != null ? String(row.code) : '',
      accountTitle: row.accountTitle || '',
      category: row.category || 'Others',
      subCategory: row.subCategory || '',
      debit: row.totalDebit,
      credit: row.totalCredit,
    })),
    allCategories,
  };
}

async function fetchCustomerBalance(customerId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('acid', sql.Int, Number(customerId))
    .query(`
      SELECT ISNULL(SUM(ISNULL(Debit, 0) - ISNULL(Credit, 0)), 0) AS balance
      FROM Ledgers
      WHERE Acid = @acid
    `);
  return result.recordset[0]?.balance ?? 0;
}

async function createSale(data) {
  const pool = await getPool();
  const transaction = pool.transaction();
  await transaction.begin();

  try {
    const docResult = await transaction.request().query(
      `SELECT ISNULL(MAX(Doc), 0) + 1 AS nextDoc FROM PSDetail WHERE Type = 'Sale'`
    );
    const newDoc = docResult.recordset[0].nextDoc;

    let acid = null;
    let customerName = '';
    if (data.customerCode) {
      const custResult = await transaction
        .request()
        .input('custId', sql.Int, Number(data.customerCode))
        .query(`SELECT TOP 1 Id, Subsidary FROM COA WHERE Id = @custId`);
      if (custResult.recordset.length > 0) {
        acid = custResult.recordset[0].Id;
        customerName = custResult.recordset[0].Subsidary || '';
      }
    }

    const totalAmount = (data.products || []).reduce(
      (sum, p) => sum + (parseFloat(p.net) || 0), 0
    );

    let saleDate = new Date();
    if (data.date) {
      const parsed = Date.parse(data.date);
      if (!isNaN(parsed)) saleDate = new Date(parsed);
    }

    let dueDate = saleDate;
    if (data.dueDate) {
      const parsed = Date.parse(data.dueDate);
      if (!isNaN(parsed)) dueDate = new Date(parsed);
    }

    const invoiceNo = data.invoiceNo || String(newDoc);

    await transaction
      .request()
      .input('doc', sql.Int, newDoc)
      .input('type', sql.NVarChar, 'Sale')
      .input('date', sql.DateTime, saleDate)
      .input('acid', sql.Int, acid)
      .input('invoice', sql.NVarChar, invoiceNo)
      .input('term', sql.NVarChar, data.paymentType || 'Cash')
      .input('creditDays', sql.Int, parseInt(data.creditDays) || 0)
      .input('dueDate', sql.DateTime, dueDate)
      .input('amount', sql.Float, totalAmount)
      .input('discount', sql.Float, parseFloat(data.discPercentFooter) || 0)
      .input('extraDiscount', sql.Float, parseFloat(data.extraDiscount) || 0)
      .input('pbalance', sql.Float, parseFloat(data.previousBalance) || 0)
      .input('received', sql.Float, parseFloat(data.cashPaid) || 0)
      .input('description', sql.NVarChar, data.description || '')
      .query(`
        INSERT INTO PSDetail (
          Doc, Type, Date, Acid, invoice, Term, CreditDays, DueDate,
          Amount, Discount, ExtraDiscount, PBalance, Received, Description
        ) VALUES (
          @doc, @type, @date, @acid, @invoice, @term, @creditDays, @dueDate,
          @amount, @discount, @extraDiscount, @pbalance, @received, @description
        )
      `);

    for (const product of (data.products || [])) {
      let prid = null;
      if (product.productCode) {
        const prodResult = await transaction
          .request()
          .input('pcode', sql.NVarChar, String(product.productCode))
          .query(`SELECT TOP 1 ID FROM Products WHERE code = @pcode`);
        if (prodResult.recordset.length > 0) {
          prid = prodResult.recordset[0].ID;
        }
      }
      if (!prid && product.product) {
        prid = Number(product.product) || null;
      }

      await transaction
        .request()
        .input('doc', sql.Int, newDoc)
        .input('type', sql.NVarChar, 'Sale')
        .input('prid', sql.Int, prid)
        .input('qty', sql.Float, parseFloat(product.pcs) || 0)
        .input('rate', sql.Float, parseFloat(product.rate) || 0)
        .input('vest', sql.Float, parseFloat(product.amount) || 0)
        .input('discount', sql.Float, parseFloat(product.discount) || 0)
        .input('discP', sql.Float, parseFloat(product.discPercent) || 0)
        .input('vist', sql.Float, parseFloat(product.net) || 0)
        .input('packet', sql.NVarChar, product.packing || '')
        .input('comments', sql.NVarChar, product.remarks || '')
        .query(`
          INSERT INTO PSProduct (
            Doc, Type, Prid, Qty, Rate, VEST, Discount, DiscP, VIST, Packet, comments
          ) VALUES (
            @doc, @type, @prid, @qty, @rate, @vest, @discount, @discP, @vist, @packet, @comments
          )
        `);
    }

    await writeSaleLedgerEntries(transaction, {
      doc: newDoc,
      saleDate,
      customerId: acid,
      customerName,
      totalAmount,
      invoiceNo: invoiceNo,
      received: (() => {
        const paid = parseFloat(data.cashPaid) || 0;
        if (paid > 0) return paid;
        return (data.paymentType || '').toLowerCase() === 'cash' ? totalAmount : 0;
      })(),
    });

    await transaction.commit();
    return {
      doc: newDoc,
      invoiceNo: data.invoiceNo || String(newDoc),
      message: 'Sale saved successfully! Invoice, stock & ledger updated.',
    };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

module.exports = {
  fetchCoaAccounts,
  fetchCoaAccountById,
  searchCoaAccounts,
  fetchCoaAccountsByType,
  fetchSuppliers,
  fetchSupplierById,
  searchSuppliers,
  fetchCustomers,
  fetchCustomerById,
  searchCustomers,
  fetchProducts,
  fetchProductById,
  searchProducts,
  fetchItems,
  fetchItemById,
  fetchStock,
  fetchProductHistory,
  fetchLedgerEntries,
  fetchPurchaseHeaders,
  fetchPurchaseByDoc,
  fetchLatestPurchase,
  createPurchase,
  updatePurchase,
  deletePurchase,
  fetchNextPurchaseDoc,
  fetchSupplierBalance,
  fetchProductPurchaseHistory,
  fetchPurchaseReturnHeaders,
  fetchPurchaseReturnByDoc,
  fetchLatestPurchaseReturn,
  createPurchaseReturn,
  updatePurchaseReturn,
  deletePurchaseReturn,
  fetchNextPurchaseReturnDoc,
  fetchProductPurchaseReturnHistory,
  fetchClaimOutHeaders,
  fetchClaimOutByDoc,
  fetchLatestClaimOut,
  createClaimOut,
  updateClaimOut,
  deleteClaimOut,
  fetchNextClaimOutDoc,
  fetchClaimInHeaders,
  fetchClaimInByDoc,
  fetchLatestClaimIn,
  createClaimIn,
  updateClaimIn,
  deleteClaimIn,
  fetchNextClaimInDoc,
  fetchSaleReturnHeaders,
  fetchSaleReturnByDoc,
  fetchLatestSaleReturn,
  createSaleReturn,
  updateSaleReturn,
  deleteSaleReturn,
  fetchNextSaleReturnDoc,
  createSale,
  updateSale,
  deleteSale,
  searchSaleByInvoice,
  fetchCustomerBalance,
  fetchCashReceiptsByCRV,
  createCashReceipt,
  deleteCashReceiptById,
  getNextCRVNumber,
  fetchBankReceiptsList,
  fetchBankReceiptByBRV,
  fetchBankReceiptById,
  createBankReceipt,
  updateBankReceiptById,
  deleteBankReceiptById,
  getNextBRVNumber,
  fetchBankPaymentsList,
  fetchBankPaymentByBPV,
  fetchBankPaymentById,
  createBankPayment,
  updateBankPaymentById,
  deleteBankPaymentById,
  getNextBPVNumber,
  fetchPendingCheques,
  getNextChequeTransferDoc,
  fetchChequeTransferByDoc,
  fetchChequeTransferById,
  createChequeTransfer,
  updateChequeTransferById,
  deleteChequeTransferById,
  fetchCashPayments,
  fetchCashPaymentsByCPV,
  createCashPayment,
  updateCashPaymentById,
  deleteCashPaymentById,
  getNextCPVNumber,
  fetchTrialBalance,
  fetchSaleHeaders,
  fetchSaleByDoc,
  fetchLatestSale,
  fetchProductOnHand,
  fetchSalesByCustomer,
  fetchProductSoldHistory,
};
