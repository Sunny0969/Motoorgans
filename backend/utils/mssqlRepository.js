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

async function fetchProducts(search = '', limit = 5000) {
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
  if (search) request.input('search', sql.NVarChar, `%${search}%`);

  const result = await request.query(`
    SELECT TOP (@limit)
      ID, Company, Category, category2, Size, Name, UrduName,
      Packing, PurchaseRate, SaleRate, SaleRate2, SaleRate3, SaleRate4,
      OQty, Batch, ODate, code, SchRate, SchPc, ReOrder, location, isactive
    FROM Products
    WHERE (isactive IS NULL OR isactive = 1)
      ${searchClause}
    ORDER BY Name
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

    let acid = null;
    if (data.supplierCode) {
      const supplierResult = await transaction
        .request()
        .input('code', sql.NVarChar, String(data.supplierCode))
        .query(`SELECT TOP 1 Id FROM COA WHERE code = @code`);
      if (supplierResult.recordset.length > 0) {
        acid = supplierResult.recordset[0].Id;
      }
    }

    const totalAmount = (data.products || []).reduce(
      (sum, p) => sum + (parseFloat(p.net) || 0), 0
    );

    let purchaseDate = new Date();
    if (data.date) {
      const parsed = Date.parse(data.date);
      if (!isNaN(parsed)) purchaseDate = new Date(parsed);
    }

    await transaction
      .request()
      .input('doc', sql.Int, newDoc)
      .input('type', sql.NVarChar, 'Purchase')
      .input('date', sql.DateTime, purchaseDate)
      .input('acid', sql.Int, acid)
      .input('invoice', sql.NVarChar, data.invoiceNo || String(newDoc))
      .input('term', sql.NVarChar, data.paymentType || 'Cash')
      .input('creditDays', sql.Int, parseInt(data.creditDays) || 0)
      .input('dueDate', sql.DateTime, data.dueDate ? new Date(Date.parse(data.dueDate) || Date.now()) : purchaseDate)
      .input('amount', sql.Float, totalAmount)
      .input('discount', sql.Float, parseFloat(data.discPercentFooter) || 0)
      .input('extraDiscount', sql.Float, parseFloat(data.extraDiscount) || 0)
      .input('pbalance', sql.Float, parseFloat(data.previousBalance) || 0)
      .input('received', sql.Float, parseFloat(data.cashPaid) || 0)
      .input('goods', sql.NVarChar, data.transporter || '')
      .input('builty', sql.NVarChar, data.builtyNo || '')
      .input('description', sql.NVarChar, data.description || '')
      .query(`
        INSERT INTO PSDetail (
          Doc, Type, Date, Acid, invoice, Term, CreditDays, DueDate,
          Amount, Discount, ExtraDiscount, PBalance, Received,
          goods, builty, Description
        ) VALUES (
          @doc, @type, @date, @acid, @invoice, @term, @creditDays, @dueDate,
          @amount, @discount, @extraDiscount, @pbalance, @received,
          @goods, @builty, @description
        )
      `);

    for (const product of (data.products || [])) {
      let prid = null;
      if (product.productCode) {
        const prodResult = await transaction
          .request()
          .input('code', sql.NVarChar, String(product.productCode))
          .query(`SELECT TOP 1 ID FROM Products WHERE code = @code`);
        if (prodResult.recordset.length > 0) {
          prid = prodResult.recordset[0].ID;
        }
      }

      await transaction
        .request()
        .input('doc', sql.Int, newDoc)
        .input('type', sql.NVarChar, 'Purchase')
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

    await transaction.commit();
    return fetchPurchaseByDoc(newDoc);
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
        pr.code AS productCode,
        pr.Size AS uom
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
    invoiceNo: row.invoice != null ? String(row.invoice) : String(row.Doc),
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
      WHERE Type = 'Sale' AND (invoice = @invoice OR CAST(Doc AS NVARCHAR(50)) = @invoice)
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
    if (data.customerCode) {
      const custResult = await transaction
        .request()
        .input('custId', sql.Int, Number(data.customerCode))
        .query(`SELECT TOP 1 Id FROM COA WHERE Id = @custId`);
      if (custResult.recordset.length > 0) {
        acid = custResult.recordset[0].Id;
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

    await transaction.commit();
    return { doc, message: 'Sale updated successfully' };
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

  return result.recordset.map(row => ({
    id: row.Id,
    code: row.code != null ? String(row.code) : '',
    accountTitle: row.accountTitle || '',
    category: row.category || 'Others',
    subCategory: row.subCategory || '',
    debit: row.totalDebit,
    credit: row.totalCredit,
  }));
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
    if (data.customerCode) {
      const custResult = await transaction
        .request()
        .input('custId', sql.Int, Number(data.customerCode))
        .query(`SELECT TOP 1 Id FROM COA WHERE Id = @custId`);
      if (custResult.recordset.length > 0) {
        acid = custResult.recordset[0].Id;
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
      .input('doc', sql.Int, newDoc)
      .input('type', sql.NVarChar, 'Sale')
      .input('date', sql.DateTime, saleDate)
      .input('acid', sql.Int, acid)
      .input('invoice', sql.NVarChar, data.invoiceNo || String(newDoc))
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

    await transaction.commit();
    return { doc: newDoc, invoiceNo: data.invoiceNo || String(newDoc), message: 'Sale saved successfully' };
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
  createSale,
  updateSale,
  deleteSale,
  searchSaleByInvoice,
  fetchCustomerBalance,
  fetchCashReceiptsByCRV,
  createCashReceipt,
  deleteCashReceiptById,
  getNextCRVNumber,
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
  fetchSalesByCustomer,
  fetchProductSoldHistory,
};
