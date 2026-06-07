const { connectDB, sql } = require('../config/mssqlconfig');
const { formatDisplayDate } = require('../utils/mssqlMappers');

const DEFAULT_LIMIT = 5000;

const TEMP_STOCK_LABELS = {
  id: 'ID',
  productId: 'Prid',
  productCode: 'Code',
  productName: 'Product',
  doc: 'Doc',
  date: 'Date',
  partyId: 'Party',
  partyName: 'Party Name',
  narration: 'Narration',
  rate: 'Rate',
  amount: 'Amount',
  qtyIn: 'In',
  qtyOut: 'Out',
  balance: 'Balance',
};

const TEMP_STOCK_NUMERIC_KEYS = new Set([
  'productId',
  'doc',
  'partyId',
  'rate',
  'amount',
  'qtyIn',
  'qtyOut',
  'balance',
]);

function hasDisplayValue(value) {
  return value !== null && value !== undefined && value !== '';
}

function filterAllNullColumns(rows, labels = {}, numericKeys = new Set()) {
  if (!rows.length) {
    return { entries: [], columns: [] };
  }
  const keys = Object.keys(rows[0]);
  const visibleKeys = keys.filter((key) => rows.some((row) => hasDisplayValue(row[key])));
  const entries = rows.map((row) => {
    const trimmed = {};
    visibleKeys.forEach((key) => {
      trimmed[key] = row[key];
    });
    return trimmed;
  });
  const columns = visibleKeys.map((key) => ({
    key,
    label: labels[key] || key,
    align: numericKeys.has(key) ? 'end' : undefined,
    type: numericKeys.has(key) ? 'number' : 'text',
  }));
  return { entries, columns };
}

async function getPool() {
  return connectDB();
}

function buildSearchClause(fields, paramName = 'search') {
  if (!fields.length) return { clause: '', hasSearch: false };
  const conditions = fields.map((f) => `${f} LIKE @${paramName}`);
  return {
    clause: `AND (${conditions.join(' OR ')})`,
    hasSearch: true,
  };
}

async function fetchCustomerDetails(search = '', limit = DEFAULT_LIMIT) {
  const pool = await getPool();
  const request = pool.request().input('limit', sql.Int, limit);
  const { clause } = buildSearchClause(
    [
      'CAST(Id AS NVARCHAR(50))',
      'Subsidary',
      'ContactPerson',
      'OCell',
      'OPhone',
      'OAddress',
      'City',
      'Area',
      'EMail',
    ],
    'search'
  );

  if (search) request.input('search', sql.NVarChar, `%${search}%`);

  const result = await request.query(`
    SELECT TOP (@limit)
      Id,
      Subsidary,
      ContactPerson,
      OCell,
      OPhone,
      OAddress,
      City,
      Area,
      EMail,
      ACType,
      Date
    FROM COA
    WHERE Subsidary IS NOT NULL
      AND LTRIM(RTRIM(Subsidary)) <> ''
      AND Subsidary <> 'N/A'
      ${search ? clause : ''}
    ORDER BY Subsidary
  `);

  return result.recordset.map((row) => ({
    Id: row.Id,
    customerName: row.Subsidary || '',
    contactPerson: row.ContactPerson || '',
    mobile: row.OCell || '',
    phone: row.OPhone || '',
    address: row.OAddress || '',
    city: row.City || '',
    area: row.Area || '',
    email: row.EMail || '',
    acType: row.ACType,
    date: formatDisplayDate(row.Date),
  }));
}

async function fetchItems(search = '', limit = DEFAULT_LIMIT) {
  const pool = await getPool();
  const request = pool.request().input('limit', sql.Int, limit);
  const { clause } = buildSearchClause(
    ['CAST(ID AS NVARCHAR(50))', 'Name', 'code', 'Company', 'Category', 'CAST(Size AS NVARCHAR(50))'],
    'search'
  );
  if (search) request.input('search', sql.NVarChar, `%${search}%`);

  const result = await request.query(`
    SELECT TOP (@limit) *
    FROM Products
    WHERE (isactive IS NULL OR isactive = 1)
      ${search ? clause : ''}
    ORDER BY Name
  `);

  return result.recordset.map((row) => ({
    id: row.ID,
    code: row.code != null ? String(row.code) : String(row.ID),
    name: row.Name || '',
    company: row.Company || '',
    category: row.Category || '',
    category2: row.category2 || '',
    unit: row.Size || 'PCS',
    purchaseRate: row.PurchaseRate ?? 0,
    saleRate: row.SaleRate ?? 0,
    saleRate2: row.SaleRate2 ?? 0,
    openingQty: row.OQty ?? 0,
    packing: row.Packing ?? 0,
    reorderLevel: row.ReOrder ?? 0,
    location: row.location || '',
    urduName: row.UrduName || '',
    isActive: row.isactive === null || row.isactive === undefined ? true : Boolean(row.isactive),
  }));
}

async function fetchStock(search = '', limit = DEFAULT_LIMIT) {
  const pool = await getPool();
  const countResult = await pool.request().query('SELECT COUNT(*) AS cnt FROM Stock');
  const stockHasRows = (countResult.recordset[0]?.cnt || 0) > 0;

  const request = pool.request().input('limit', sql.Int, limit);
  if (search) request.input('search', sql.NVarChar, `%${search}%`);
  const searchClause = search
    ? `AND (pr.Name LIKE @search OR CAST(pr.code AS NVARCHAR(50)) LIKE @search OR pr.Category LIKE @search)`
    : '';

  if (stockHasRows) {
    const result = await request.query(`
      SELECT TOP (@limit)
        pr.ID AS productId,
        pr.code AS productCode,
        pr.Name AS productName,
        pr.Company,
        pr.Category,
        pr.Size AS unit,
        SUM(CASE WHEN s.Type IN ('In', 'Purchase', 'Opening') THEN ISNULL(s.Qty, 0) ELSE 0 END) AS qtyIn,
        SUM(CASE WHEN s.Type IN ('Out', 'Sale') THEN ISNULL(s.Qty, 0) ELSE 0 END) AS qtyOut,
        MAX(s.Date) AS lastMovementDate
      FROM Stock s
      INNER JOIN Products pr ON s.Prid = pr.ID
      WHERE 1 = 1
        ${searchClause}
      GROUP BY pr.ID, pr.code, pr.Name, pr.Company, pr.Category, pr.Size
      ORDER BY pr.Name
    `);

    return result.recordset.map((row) => ({
      productId: row.productId,
      productCode: row.productCode != null ? String(row.productCode) : '',
      productName: row.productName || '',
      company: row.Company || '',
      category: row.Category || '',
      unit: row.unit || 'PCS',
      qtyIn: row.qtyIn ?? 0,
      qtyOut: row.qtyOut ?? 0,
      onHandQty: (row.qtyIn ?? 0) - (row.qtyOut ?? 0),
      lastMovementDate: formatDisplayDate(row.lastMovementDate),
      source: 'Stock',
    }));
  }

  const result = await request.query(`
    SELECT TOP (@limit)
      pr.ID AS productId,
      pr.code AS productCode,
      pr.Name AS productName,
      pr.Company,
      pr.Category,
      pr.Size AS unit,
      pr.OQty AS openingQty,
      ISNULL(t.os, pr.OQty) AS onHandQty,
      ISNULL(t.purchase, 0) AS purchaseQty,
      ISNULL(t.sale, 0) AS saleQty,
      ISNULL(t.purchasereturn, 0) AS purchaseReturnQty,
      ISNULL(t.salereturn, 0) AS saleReturnQty
    FROM Products pr
    LEFT JOIN tempstock t ON pr.ID = t.PRID
    WHERE (pr.isactive IS NULL OR pr.isactive = 1)
      ${searchClause}
    ORDER BY pr.Name
  `);

  return result.recordset.map((row) => ({
    productId: row.productId,
    productCode: row.productCode != null ? String(row.productCode) : '',
    productName: row.productName || '',
    company: row.Company || '',
    category: row.Category || '',
    unit: row.unit || 'PCS',
    openingQty: row.openingQty ?? 0,
    onHandQty: row.onHandQty ?? 0,
    purchaseQty: row.purchaseQty ?? 0,
    saleQty: row.saleQty ?? 0,
    purchaseReturnQty: row.purchaseReturnQty ?? 0,
    saleReturnQty: row.saleReturnQty ?? 0,
    source: 'Products+tempstock',
  }));
}

function mapPSDetailRow(row) {
  return {
    doc: row.Doc,
    date: formatDisplayDate(row.Date),
    type: row.Type || '',
    doNumber: row.DO ?? '',
    poNumber: row.PO ?? '',
    dcNumber: row.DC ?? '',
    accountId: row.Acid,
    partyCode: row.partyCode != null ? String(row.partyCode) : '',
    partyName: row.partyName || '',
    description: row.Description || '',
    discount: row.Discount ?? 0,
    extraDiscountPercent: row.ExtraDiscountP ?? 0,
    extraDiscount: row.ExtraDiscount ?? 0,
    freight: row.Freight ?? 0,
    received: row.Received ?? 0,
    emptyPc: row.EmptyPc ?? 0,
    amount: row.Amount ?? 0,
    dueDate: formatDisplayDate(row.DueDate),
    previousBalance: row.PBalance ?? 0,
    term: row.Term || '',
    returnFlag: row.Return ?? '',
    going: row.Going ?? '',
    vehicle: row.Vehicle || '',
    driver: row.Driver || '',
    salesMan: row.SalesMan || '',
    goods: row.goods || '',
    builty: row.builty || '',
    counter: row.Counter ?? 0,
    creditDays: row.CreditDays ?? 0,
    priceList: row.PriceList || '',
    invoice: row.invoice != null && row.invoice !== '' ? String(row.invoice) : '',
    reference: row.reference || '',
    saleType: row.saletype || '',
    locationId: row.LocationID ?? '',
  };
}

async function fetchPSDetail(search = '', limit = 500, filters = {}) {
  const pool = await getPool();
  const { type, accountId, fromDate, toDate } = filters;
  const request = pool.request().input('limit', sql.Int, limit);

  let filterClause = '';
  if (type) {
    request.input('type', sql.NVarChar, type);
    filterClause += ' AND d.Type = @type';
  }
  if (accountId) {
    request.input('acid', sql.Int, Number(accountId));
    filterClause += ' AND d.Acid = @acid';
  }
  if (fromDate) {
    request.input('fromDate', sql.DateTime, new Date(`${fromDate}T00:00:00`));
    filterClause += ' AND d.Date >= @fromDate';
  }
  if (toDate) {
    request.input('toDate', sql.DateTime, new Date(`${toDate}T23:59:59`));
    filterClause += ' AND d.Date <= @toDate';
  }

  if (search) request.input('search', sql.NVarChar, `%${search}%`);
  const searchClause = search
    ? `AND (
        d.Type LIKE @search OR d.Description LIKE @search
        OR CAST(d.Doc AS NVARCHAR(50)) LIKE @search
        OR CAST(d.invoice AS NVARCHAR(50)) LIKE @search
        OR c.Subsidary LIKE @search OR CAST(d.Acid AS NVARCHAR(50)) LIKE @search
      )`
    : '';

  const result = await request.query(`
    SELECT TOP (@limit)
      d.Doc, d.Date, d.Type, d.DO, d.PO, d.DC, d.Acid,
      d.Description, d.Discount, d.ExtraDiscountP, d.ExtraDiscount,
      d.Freight, d.Received, d.EmptyPc, d.Amount, d.DueDate, d.PBalance,
      d.Term, d.[Return], d.Going, d.Vehicle, d.Driver, d.SalesMan,
      d.goods, d.builty, d.Counter, d.CreditDays, d.PriceList,
      d.invoice, d.reference, d.saletype, d.LocationID,
      c.Subsidary AS partyName,
      c.code AS partyCode
    FROM PSDetail d WITH (NOLOCK)
    LEFT JOIN COA c WITH (NOLOCK) ON d.Acid = c.Id
    WHERE 1 = 1
      ${filterClause}
      ${searchClause}
    ORDER BY d.Doc DESC
  `);

  return result.recordset.map(mapPSDetailRow);
}

async function fetchProductHistory(search = '', limit = DEFAULT_LIMIT, filters = {}) {
  const pool = await getPool();
  const { type, accountId, fromDate, toDate } = filters;
  const request = pool.request().input('limit', sql.Int, Math.min(limit, 2000));

  let filterClause = '';
  if (type) {
    request.input('type', sql.NVarChar, type);
    filterClause += ' AND d.Type = @type';
  }
  if (accountId) {
    request.input('acid', sql.Int, Number(accountId));
    filterClause += ' AND d.Acid = @acid';
  }
  if (fromDate) {
    request.input('fromDate', sql.DateTime, new Date(`${fromDate}T00:00:00`));
    filterClause += ' AND d.Date >= @fromDate';
  }
  if (toDate) {
    request.input('toDate', sql.DateTime, new Date(`${toDate}T23:59:59`));
    filterClause += ' AND d.Date <= @toDate';
  }

  if (search) request.input('search', sql.NVarChar, `%${search}%`);
  const searchClause = search
    ? `AND (
        pr.Name LIKE @search OR CAST(pr.code AS NVARCHAR(50)) LIKE @search
        OR d.Type LIKE @search OR c.Subsidary LIKE @search
        OR CAST(d.Doc AS NVARCHAR(50)) LIKE @search
      )`
    : '';

  const result = await request.query(`
    SELECT TOP (@limit)
      d.Doc,
      d.Date,
      d.Type,
      d.Amount AS headerAmount,
      d.Term,
      d.invoice,
      p.Prid,
      pr.Name AS productName,
      pr.code AS productCode,
      p.Qty,
      p.Rate,
      p.VEST AS lineAmount,
      p.VIST AS netAmount,
      p.Discount,
      c.Subsidary AS partyName,
      c.code AS partyCode
    FROM PSDetail d WITH (NOLOCK)
    INNER JOIN PSProduct p WITH (NOLOCK) ON d.Doc = p.Doc AND d.Type = p.Type
    LEFT JOIN Products pr WITH (NOLOCK) ON p.Prid = pr.ID
    LEFT JOIN COA c WITH (NOLOCK) ON d.Acid = c.Id
    WHERE 1 = 1
      ${filterClause}
      ${searchClause}
    ORDER BY d.Doc DESC, p.ID DESC
  `);

  return result.recordset.map((row) => ({
    docNo: row.Doc,
    date: formatDisplayDate(row.Date),
    transactionType: row.Type || '',
    partyName: row.partyName || '',
    partyCode: row.partyCode != null ? String(row.partyCode) : '',
    productId: row.Prid,
    productCode: row.productCode != null ? String(row.productCode) : String(row.Prid),
    productName: row.productName || '',
    quantity: row.Qty ?? 0,
    rate: row.Rate ?? 0,
    amount: row.lineAmount ?? row.headerAmount ?? 0,
    discount: row.Discount ?? 0,
    netAmount: row.netAmount ?? 0,
    paymentTerm: row.Term || '',
    invoice: row.invoice != null && row.invoice !== '' ? String(row.invoice) : '',
  }));
}

async function fetchProductHistoryLedger({ productId, partyId, fromDate, toDate }) {
  const resolveLineQty = (qty, rate, amount) => {
    const q = parseFloat(qty) || 0;
    if (q > 0) return q;
    const r = parseFloat(rate) || 0;
    const a = parseFloat(amount) || 0;
    if (r > 0 && a > 0) return Math.round((a / r) * 1000) / 1000;
    return 0;
  };

  const effectiveQtySql = `
    CASE
      WHEN ISNULL(p.Qty, 0) > 0 THEN p.Qty
      WHEN ISNULL(p.Rate, 0) > 0 THEN ISNULL(p.VEST, 0) / p.Rate
      ELSE 0
    END
  `;

  const emptySummary = {
    lastPurchaseRate: 0,
    lastSaleRate: 0,
    totalIn: 0,
    totalOut: 0,
    stockBalance: 0,
    broughtForwardQty: 0,
  };
  if (!productId) {
    return { summary: emptySummary, rows: [] };
  }

  const pool = await getPool();
  const pid = Number(productId);
  const partyClause = partyId ? ' AND d.Acid = @partyId' : '';
  const typeFilter = `d.Type IN ('Sale', 'Purchase', 'Sale Return', 'Purchase Return')`;

  const bindBase = (request) => {
    request.input('productId', sql.Int, pid);
    if (partyId) request.input('partyId', sql.Int, Number(partyId));
    return request;
  };

  let bfIn = 0;
  let bfOut = 0;
  if (fromDate) {
    const bfRes = await bindBase(pool.request())
      .input('fromDate', sql.DateTime, new Date(`${fromDate}T00:00:00`))
      .query(`
        SELECT
          SUM(CASE WHEN d.Type IN ('Purchase','Sale Return') THEN ${effectiveQtySql} ELSE 0 END) AS totalIn,
          SUM(CASE WHEN d.Type IN ('Sale','Purchase Return') THEN ${effectiveQtySql} ELSE 0 END) AS totalOut
        FROM PSProduct p WITH (NOLOCK)
        INNER JOIN PSDetail d WITH (NOLOCK) ON p.Doc = d.Doc AND p.Type = d.Type
        WHERE p.Prid = @productId AND ${typeFilter} AND d.Date < @fromDate ${partyClause}
      `);
    bfIn = parseFloat(bfRes.recordset[0]?.totalIn) || 0;
    bfOut = parseFloat(bfRes.recordset[0]?.totalOut) || 0;
  }

  const broughtForwardQty = bfIn - bfOut;

  const lastPurRes = await bindBase(pool.request()).query(`
    SELECT TOP 1 p.Rate
    FROM PSProduct p WITH (NOLOCK)
    INNER JOIN PSDetail d WITH (NOLOCK) ON p.Doc = d.Doc AND p.Type = d.Type
    WHERE p.Prid = @productId AND d.Type = 'Purchase' AND ISNULL(p.Rate, 0) > 0
    ORDER BY d.Date DESC, d.Doc DESC
  `);

  const lastSaleRes = await bindBase(pool.request()).query(`
    SELECT TOP 1 p.Rate
    FROM PSProduct p WITH (NOLOCK)
    INNER JOIN PSDetail d WITH (NOLOCK) ON p.Doc = d.Doc AND p.Type = d.Type
    WHERE p.Prid = @productId AND d.Type = 'Sale' AND ISNULL(p.Rate, 0) > 0
    ORDER BY d.Date DESC, d.Doc DESC
  `);

  let dateClause = '';
  const txReq = bindBase(pool.request());
  if (fromDate) {
    txReq.input('fromDate', sql.DateTime, new Date(`${fromDate}T00:00:00`));
    dateClause += ' AND d.Date >= @fromDate';
  }
  if (toDate) {
    txReq.input('toDate', sql.DateTime, new Date(`${toDate}T23:59:59`));
    dateClause += ' AND d.Date <= @toDate';
  }

  const txRes = await txReq.query(`
    SELECT
      d.Date,
      d.Doc,
      d.Type,
      p.Qty,
      p.Rate,
      p.VEST AS amount,
      c.Subsidary AS partyName
    FROM PSProduct p WITH (NOLOCK)
    INNER JOIN PSDetail d WITH (NOLOCK) ON p.Doc = d.Doc AND p.Type = d.Type
    LEFT JOIN COA c WITH (NOLOCK) ON d.Acid = c.Id
    WHERE p.Prid = @productId AND ${typeFilter} ${dateClause} ${partyClause}
    ORDER BY d.Date ASC, d.Doc ASC
  `);

  const rows = [];
  let balance = broughtForwardQty;
  let periodIn = 0;
  let periodOut = 0;

  if (fromDate) {
    rows.push({
      sr: 1,
      date: formatDisplayDate(new Date(`${fromDate}T00:00:00`)),
      docNo: '',
      type: 'Brought Forward',
      qtyIn: '',
      qtyOut: '',
      rate: '',
      amount: '',
      balanceQty: broughtForwardQty,
      partyName: 'N/A',
      rowKind: 'brought-forward',
    });
  }

  txRes.recordset.forEach((row) => {
    const rate = parseFloat(row.Rate) || 0;
    const amount = parseFloat(row.amount) || 0;
    const qty = resolveLineQty(row.Qty, rate, amount);
    const isIn = row.Type === 'Purchase' || row.Type === 'Sale Return';
    const isOut = row.Type === 'Sale' || row.Type === 'Purchase Return';
    const qtyIn = isIn ? qty : 0;
    const qtyOut = isOut ? qty : 0;
    periodIn += qtyIn;
    periodOut += qtyOut;
    balance += qtyIn - qtyOut;

    rows.push({
      sr: rows.length + 1,
      date: formatDisplayDate(row.Date),
      docNo: row.Doc,
      type: row.Type,
      qtyIn: qtyIn || '',
      qtyOut: qtyOut || '',
      rate,
      amount: amount || qty * rate,
      balanceQty: balance,
      partyName: row.partyName || '',
      rowKind: isOut ? 'sale' : 'purchase',
    });
  });

  rows.forEach((row, index) => {
    row.sr = index + 1;
  });

  return {
    summary: {
      lastPurchaseRate: parseFloat(lastPurRes.recordset[0]?.Rate) || 0,
      lastSaleRate: parseFloat(lastSaleRes.recordset[0]?.Rate) || 0,
      totalIn: periodIn,
      totalOut: periodOut,
      stockBalance: balance,
      broughtForwardQty,
    },
    rows,
  };
}

function mapLedgerRow(row) {
  return {
    id: row.Id,
    accountId: row.Acid,
    accountCode: row.accountCode != null ? String(row.accountCode) : '',
    accountName: row.accountName || '',
    date: formatDisplayDate(row.Date),
    docNo: row.Doc,
    type: row.Type || '',
    narration: row.Narration || '',
    invoice: row.Invoice != null && row.Invoice !== '' ? row.Invoice : '',
    cheque: row.Cheque != null && row.Cheque !== '' ? row.Cheque : '',
    debit: row.Debit ?? 0,
    credit: row.Credit ?? 0,
    cellIn: row.CellIn ?? 0,
    cellOut: row.CellOut ?? 0,
    crateIn: row.CrateIn ?? 0,
    crateOut: row.CrateOut ?? 0,
    discount: row.Discount ?? 0,
    counter: row.Counter ?? 0,
    remainingAmount: row.remainingamount ?? 0,
    balance: row.remainingamount ?? 0,
    status: row.status != null && row.status !== '' ? row.status : '',
    dueDate: formatDisplayDate(row.duedate),
  };
}

async function fetchLedgerOpeningBalance(accountId, beforeDate) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('acid', sql.Int, Number(accountId))
    .input('beforeDate', sql.DateTime, new Date(`${beforeDate}T00:00:00`))
    .query(`
      SELECT ISNULL(SUM(ISNULL(l.Debit, 0) - ISNULL(l.Credit, 0)), 0) AS openingBalance
      FROM Ledgers l WITH (NOLOCK)
      WHERE l.Acid = @acid AND l.Date < @beforeDate
    `);
  return result.recordset[0]?.openingBalance ?? 0;
}

async function fetchLedger(search = '', limit = DEFAULT_LIMIT, filters = {}) {
  const pool = await getPool();
  const { accountId, fromDate, toDate } = filters;
  const request = pool.request().input('limit', sql.Int, limit);

  let filterClause = '';
  if (accountId) {
    request.input('acid', sql.Int, Number(accountId));
    filterClause += ' AND l.Acid = @acid';
  }
  if (fromDate) {
    request.input('fromDate', sql.DateTime, new Date(`${fromDate}T00:00:00`));
    filterClause += ' AND l.Date >= @fromDate';
  }
  if (toDate) {
    request.input('toDate', sql.DateTime, new Date(`${toDate}T23:59:59`));
    filterClause += ' AND l.Date <= @toDate';
  }

  if (search) request.input('search', sql.NVarChar, `%${search}%`);
  const searchClause = search
    ? `AND (
        l.Narration LIKE @search OR l.Type LIKE @search
        OR CAST(l.Doc AS NVARCHAR(50)) LIKE @search
        OR c.Subsidary LIKE @search OR CAST(l.Invoice AS NVARCHAR(50)) LIKE @search
        OR CAST(l.Acid AS NVARCHAR(50)) LIKE @search
      )`
    : '';

  const orderClause = accountId
    ? 'ORDER BY l.Date ASC, l.Id ASC'
    : 'ORDER BY l.Id DESC';

  const result = await request.query(`
    SELECT TOP (@limit)
      l.Id,
      l.Acid,
      l.Date,
      l.Doc,
      l.Type,
      l.Narration,
      l.Invoice,
      l.Cheque,
      l.Debit,
      l.Credit,
      l.CellIn,
      l.CellOut,
      l.CrateIn,
      l.CrateOut,
      l.Discount,
      l.Counter,
      l.remainingamount,
      l.status,
      l.duedate,
      c.Subsidary AS accountName,
      c.code AS accountCode
    FROM Ledgers l WITH (NOLOCK)
    LEFT JOIN COA c WITH (NOLOCK) ON l.Acid = c.Id
    WHERE 1 = 1
      ${filterClause}
      ${searchClause}
    ${orderClause}
  `);

  const rows = result.recordset.map(mapLedgerRow);
  return accountId ? rows : rows.reverse();

}

function mapTempStockRow(row) {
  return {
    id: row.ID ?? null,
    productId: row.Prid ?? null,
    productCode: row.productCode != null ? String(row.productCode) : '',
    productName: row.productName || '',
    doc: row.doc ?? null,
    date: row.Date ? formatDisplayDate(row.Date) : '',
    partyId: row.Party ?? null,
    partyName: row.partyName || '',
    narration: row.Narration || '',
    rate: row.Rate,
    discp: row.discp,
    amount: row.Amount,
    qtyIn: row.qtyIn,
    qtyOut: row.Out,
    balance: row.Balance,
  };
}

async function fetchTempStock(search = '', limit = DEFAULT_LIMIT, filters = {}) {
  const pool = await getPool();
  const { productId, fromDate, toDate } = filters;
  const request = pool.request().input('limit', sql.Int, limit);

  let filterClause = '';
  if (productId) {
    request.input('prid', sql.Int, Number(productId));
    filterClause += ' AND s.Prid = @prid';
  }
  if (fromDate) {
    request.input('fromDate', sql.DateTime, new Date(`${fromDate}T00:00:00`));
    filterClause += ' AND s.Date >= @fromDate';
  }
  if (toDate) {
    request.input('toDate', sql.DateTime, new Date(`${toDate}T23:59:59`));
    filterClause += ' AND s.Date <= @toDate';
  }

  if (search) request.input('search', sql.NVarChar, `%${search}%`);
  const searchClause = search
    ? `AND (
        s.Narration LIKE @search OR CAST(s.doc AS NVARCHAR(50)) LIKE @search
        OR CAST(s.Prid AS NVARCHAR(50)) LIKE @search
        OR pr.Name LIKE @search OR CAST(pr.code AS NVARCHAR(50)) LIKE @search
        OR c.Subsidary LIKE @search
      )`
    : '';

  const result = await request.query(`
    SELECT TOP (@limit)
      s.ID,
      s.Prid,
      s.doc,
      s.Date,
      s.Party,
      s.Narration,
      s.Rate,
      s.discp,
      s.Amount,
      s.[In] AS qtyIn,
      s.[Out],
      s.Balance,
      pr.Name AS productName,
      pr.code AS productCode,
      c.Subsidary AS partyName
    FROM dbo.Temp_Stock s WITH (NOLOCK)
    LEFT JOIN Products pr WITH (NOLOCK) ON s.Prid = pr.ID
    LEFT JOIN COA c WITH (NOLOCK) ON s.Party = c.Id
    WHERE 1 = 1
      ${filterClause}
      ${searchClause}
    ORDER BY s.Prid ASC, s.Date ASC, s.ID ASC
  `);

  const mapped = result.recordset.map(mapTempStockRow);
  return filterAllNullColumns(mapped, TEMP_STOCK_LABELS, TEMP_STOCK_NUMERIC_KEYS);
}

const TEMP_PNL_LABELS = {
  id: 'ID',
  head: 'Head',
  description: 'Description',
  value: 'Value',
  headId: 'Head ID',
};

const TEMP_PNL_NUMERIC_KEYS = new Set(['id', 'value', 'headId']);

function mapTempPnLRow(row) {
  return {
    id: row.id,
    head: row.Head || '',
    description: row.description || '',
    value: row.value,
    headId: row.Headid,
  };
}

async function fetchTempPnL(search = '', limit = DEFAULT_LIMIT, filters = {}) {
  const pool = await getPool();
  const { headId, head } = filters;
  const request = pool.request().input('limit', sql.Int, limit);

  let filterClause = '';
  if (headId !== '' && headId != null) {
    request.input('headId', sql.Int, Number(headId));
    filterClause += ' AND p.Headid = @headId';
  }
  if (head) {
    request.input('head', sql.NVarChar, head);
    filterClause += ' AND p.Head = @head';
  }

  if (search) request.input('search', sql.NVarChar, `%${search}%`);
  const searchClause = search
    ? `AND (p.Head LIKE @search OR p.description LIKE @search OR CAST(p.Headid AS NVARCHAR(50)) LIKE @search)`
    : '';

  const result = await request.query(`
    SELECT TOP (@limit)
      p.id,
      p.Head,
      p.description,
      p.value,
      p.Headid
    FROM dbo.TempPnL p WITH (NOLOCK)
    WHERE 1 = 1
      ${filterClause}
      ${searchClause}
    ORDER BY p.Headid ASC, p.id ASC
  `);

  const mapped = result.recordset.map(mapTempPnLRow);
  return filterAllNullColumns(mapped, TEMP_PNL_LABELS, TEMP_PNL_NUMERIC_KEYS);
}

const COMPANY_LABELS = {
  id: 'ID',
  name: 'Name',
  color: 'Color',
};

const COMPANY_NUMERIC_KEYS = new Set(['id', 'color']);

function mapCompanyRow(row) {
  return {
    id: row.id,
    name: row.name || '',
    color: row.color,
  };
}

async function fetchCompanies(search = '', limit = DEFAULT_LIMIT) {
  const pool = await getPool();
  const request = pool.request().input('limit', sql.Int, limit);

  if (search) request.input('search', sql.NVarChar, `%${search}%`);
  const searchClause = search
    ? `AND (
        c.name LIKE @search
        OR CAST(c.id AS NVARCHAR(50)) LIKE @search
        OR CAST(c.color AS NVARCHAR(50)) LIKE @search
      )`
    : '';

  const result = await request.query(`
    SELECT TOP (@limit)
      c.id,
      c.name,
      c.color
    FROM dbo.Company c WITH (NOLOCK)
    WHERE 1 = 1
      ${searchClause}
    ORDER BY c.name ASC, c.id ASC
  `);

  const mapped = result.recordset.map(mapCompanyRow);
  return filterAllNullColumns(mapped, COMPANY_LABELS, COMPANY_NUMERIC_KEYS);
}

async function upsertCompanyColor(name, color) {
  const pool = await getPool();
  const trimmed = (name || '').trim();
  if (!trimmed) return null;

  const colorStr = String(color);

  const existing = await pool
    .request()
    .input('name', sql.NVarChar, trimmed)
    .query(`
      SELECT TOP 1 id, name FROM Company
      WHERE LTRIM(RTRIM(name)) = @name
    `);

  if (existing.recordset.length > 0) {
    await pool
      .request()
      .input('id', sql.Int, existing.recordset[0].id)
      .input('color', sql.NVarChar, colorStr)
      .query(`UPDATE Company SET color = @color WHERE id = @id`);
    return existing.recordset[0].id;
  }

  const nextIdResult = await pool.request().query(
    `SELECT ISNULL(MAX(id), 0) + 1 AS nextId FROM Company`,
  );
  const nextId = nextIdResult.recordset[0].nextId;
  await pool
    .request()
    .input('id', sql.Int, nextId)
    .input('name', sql.NVarChar, trimmed)
    .input('color', sql.NVarChar, colorStr)
    .query(`INSERT INTO Company (id, name, color) VALUES (@id, @name, @color)`);
  return nextId;
}

function mapTempLedgerRow(row) {
  return {
    id: row.ID ?? null,
    accountId: row.Acid ?? null,
    accountCode: row.accountCode != null ? String(row.accountCode) : '',
    accountName: row.accountName || '',
    date: row.Date ? formatDisplayDate(row.Date) : '',
    doc: row.Doc ?? null,
    type: row.Type || '',
    narration: row.Narration || '',
    invoice: row.Invoice != null && row.Invoice !== '' ? String(row.Invoice) : '',
    debit: row.Debit,
    credit: row.Credit,
    balance: row.Balance,
    status: row.Status || '',
    cellIn: row.CellIn,
    cellOut: row.CellOut,
    crateIn: row.CrateIn,
    crateOut: row.CrateOut,
    bf: row.bf,
    dr: row.dr,
    cr: row.cr,
    product: row.product || '',
    qty: row.qty,
    rate: row.rate,
    amount: row.amount,
    transporter: row.transporter || '',
    builty: row.builty || '',
    isTele: row.isTele,
  };
}

async function fetchTempLedger(search = '', limit = DEFAULT_LIMIT, filters = {}) {
  const pool = await getPool();
  const { accountId, fromDate, toDate, type } = filters;
  const request = pool.request().input('limit', sql.Int, limit);

  let filterClause = '';
  if (accountId) {
    request.input('acid', sql.Int, Number(accountId));
    filterClause += ' AND l.Acid = @acid';
  }
  if (fromDate) {
    request.input('fromDate', sql.DateTime, new Date(`${fromDate}T00:00:00`));
    filterClause += ' AND l.Date >= @fromDate';
  }
  if (toDate) {
    request.input('toDate', sql.DateTime, new Date(`${toDate}T23:59:59`));
    filterClause += ' AND l.Date <= @toDate';
  }
  if (type) {
    request.input('type', sql.NVarChar, type);
    filterClause += ' AND l.Type = @type';
  }

  if (search) request.input('search', sql.NVarChar, `%${search}%`);
  const searchClause = search
    ? `AND (
        l.Narration LIKE @search OR l.Type LIKE @search OR l.Invoice LIKE @search
        OR l.product LIKE @search OR l.transporter LIKE @search OR l.builty LIKE @search
        OR CAST(l.Doc AS NVARCHAR(50)) LIKE @search
        OR CAST(l.Acid AS NVARCHAR(50)) LIKE @search
        OR c.Subsidary LIKE @search
      )`
    : '';

  const result = await request.query(`
    SELECT TOP (@limit)
      l.ID,
      l.Acid,
      l.Date,
      l.Doc,
      l.Type,
      l.Narration,
      l.Invoice,
      l.Debit,
      l.Credit,
      l.Balance,
      l.Status,
      l.CellIn,
      l.CellOut,
      l.CrateIn,
      l.CrateOut,
      l.bf,
      l.dr,
      l.cr,
      l.product,
      l.qty,
      l.rate,
      l.amount,
      l.transporter,
      l.builty,
      l.isTele,
      c.Subsidary AS accountName,
      c.code AS accountCode
    FROM dbo.Temp_Ledger l WITH (NOLOCK)
    LEFT JOIN COA c WITH (NOLOCK) ON l.Acid = c.Id
    WHERE 1 = 1
      ${filterClause}
      ${searchClause}
    ORDER BY l.Acid ASC, l.Date ASC, l.ID ASC
  `);

  return result.recordset.map(mapTempLedgerRow);
}

async function fetchTempAcBal(search = '', limit = DEFAULT_LIMIT, filters = {}) {
  const pool = await getPool();
  const { accountId, fromDate, toDate, type } = filters;
  const request = pool.request().input('limit', sql.Int, limit);

  let filterClause = '';
  if (accountId) {
    request.input('acid', sql.Int, Number(accountId));
    filterClause += ' AND t.acid = @acid';
  }
  if (fromDate) {
    request.input('fromDate', sql.DateTime, new Date(`${fromDate}T00:00:00`));
    filterClause += ' AND t.date >= @fromDate';
  }
  if (toDate) {
    request.input('toDate', sql.DateTime, new Date(`${toDate}T23:59:59`));
    filterClause += ' AND t.date <= @toDate';
  }
  if (type) {
    request.input('type', sql.NVarChar, type);
    filterClause += ' AND t.type = @type';
  }

  if (search) request.input('search', sql.NVarChar, `%${search}%`);
  const searchClause = search
    ? `AND (
        t.type LIKE @search OR CAST(t.doc AS NVARCHAR(50)) LIKE @search
        OR CAST(t.acid AS NVARCHAR(50)) LIKE @search
        OR c.Subsidary LIKE @search
      )`
    : '';

  const result = await request.query(`
    SELECT TOP (@limit)
      t.acid,
      t.date,
      t.doc,
      t.type,
      t.debit,
      t.dr,
      t.credit,
      t.balance,
      c.Subsidary AS accountName,
      c.code AS accountCode
    FROM dbo.temp_acbal t WITH (NOLOCK)
    LEFT JOIN COA c WITH (NOLOCK) ON t.acid = c.Id
    WHERE 1 = 1
      ${filterClause}
      ${searchClause}
    ORDER BY t.acid ASC, t.date ASC, t.doc ASC
  `);

  return result.recordset.map((row) => ({
    accountId: row.acid,
    accountCode: row.accountCode != null ? String(row.accountCode) : '',
    accountName: row.accountName || '',
    date: formatDisplayDate(row.date),
    doc: row.doc ?? 0,
    type: row.type || '',
    debit: row.debit,
    dr: row.dr,
    credit: row.credit,
    balance: row.balance,
  }));
}

async function fetchSalesInvoices(search = '', limit = 500) {
  const pool = await getPool();
  const request = pool.request().input('limit', sql.Int, limit);
  if (search) request.input('search', sql.NVarChar, `%${search}%`);
  const searchClause = search
    ? `AND (
        CAST(d.invoice AS NVARCHAR(50)) LIKE @search
        OR CAST(d.Doc AS NVARCHAR(50)) LIKE @search
        OR c.Subsidary LIKE @search OR d.Type LIKE @search
      )`
    : '';

  const result = await request.query(`
    SELECT TOP (@limit)
      d.Doc AS invoiceId,
      d.invoice AS invoiceNumber,
      d.Date,
      d.Type,
      d.Term AS status,
      d.Amount AS totalAmount,
      d.Received,
      d.CreditDays,
      d.DueDate,
      d.Description,
      d.Acid,
      c.Subsidary AS customerName,
      c.code AS customerCode,
      (SELECT COUNT(*) FROM PSProduct p WHERE p.Doc = d.Doc AND p.Type = d.Type) AS itemCount,
      (SELECT SUM(ISNULL(p.Qty, 0)) FROM PSProduct p WHERE p.Doc = d.Doc AND p.Type = d.Type) AS totalQty
    FROM PSDetail d
    LEFT JOIN COA c ON d.Acid = c.Id
    WHERE d.Type = 'Sale'
      ${searchClause}
    ORDER BY d.Date DESC, d.Doc DESC
  `);

  return result.recordset.map((row) => ({
    invoiceId: row.invoiceId,
    invoiceNumber: row.invoiceNumber != null ? String(row.invoiceNumber) : String(row.invoiceId),
    date: formatDisplayDate(row.Date),
    type: row.Type || 'Sale',
    customerId: row.Acid,
    customerCode: row.customerCode != null ? String(row.customerCode) : '',
    customerName: row.customerName || '',
    totalAmount: row.totalAmount ?? 0,
    received: row.Received ?? 0,
    creditDays: row.CreditDays ?? 0,
    dueDate: formatDisplayDate(row.DueDate),
    description: row.Description || '',
    status: row.status || '',
    itemCount: row.itemCount ?? 0,
    totalQty: row.totalQty ?? 0,
    source: 'PSDetail',
  }));
}

async function fetchSalesInvoiceById(doc) {
  const pool = await getPool();
  const headerResult = await pool
    .request()
    .input('doc', sql.Int, Number(doc))
    .query(`
      SELECT d.*, c.Subsidary AS customerName, c.code AS customerCode
      FROM PSDetail d
      LEFT JOIN COA c ON d.Acid = c.Id
      WHERE d.Doc = @doc AND d.Type = 'Sale'
    `);

  const header = headerResult.recordset[0];
  if (!header) return null;

  const linesResult = await pool
    .request()
    .input('doc', sql.Int, Number(doc))
    .input('lineLimit', sql.Int, 200)
    .query(`
      SELECT TOP (@lineLimit)
        p.*,
        pr.Name AS productName,
        pr.code AS productCode,
        pr.Size AS unit
      FROM PSProduct p
      LEFT JOIN Products pr ON p.Prid = pr.ID
      WHERE p.Doc = @doc AND p.Type = 'Sale'
      ORDER BY p.ID
    `);

  return {
    invoiceId: header.Doc,
    invoiceNumber: header.invoice != null ? String(header.invoice) : String(header.Doc),
    date: formatDisplayDate(header.Date),
    customerName: header.customerName || '',
    customerCode: header.customerCode != null ? String(header.customerCode) : '',
    totalAmount: header.Amount ?? 0,
    received: header.Received ?? 0,
    status: header.Term || '',
    description: header.Description || '',
    items: linesResult.recordset.map((row) => ({
      productCode: row.productCode != null ? String(row.productCode) : String(row.Prid),
      productName: row.productName || '',
      unit: row.unit || 'PCS',
      quantity: row.Qty ?? 0,
      rate: row.Rate ?? 0,
      amount: row.VEST ?? 0,
      discount: row.Discount ?? 0,
      netAmount: row.VIST ?? 0,
    })),
  };
}

module.exports = {
  fetchCustomerDetails,
  fetchItems,
  fetchStock,
  fetchProductHistory,
  fetchProductHistoryLedger,
  fetchPSDetail,
  fetchLedger,
  fetchLedgerOpeningBalance,
  fetchTempAcBal,
  fetchTempLedger,
  fetchTempStock,
  fetchTempPnL,
  fetchCompanies,
  upsertCompanyColor,
  fetchSalesInvoices,
  fetchSalesInvoiceById,
};
