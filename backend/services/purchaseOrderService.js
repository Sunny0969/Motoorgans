const { connectDB, sql } = require('../config/mssqlconfig');
const { fetchProductOnHand, fetchSuppliers } = require('../utils/mssqlRepository');

const PO_TYPE = 'Purchase Order';

let tablesReady = false;

async function ensurePurchaseOrderTables() {
  if (tablesReady) return;
  const pool = await connectDB();
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'PurchaseOrderHeader')
    BEGIN
      CREATE TABLE PurchaseOrderHeader (
        Doc INT NOT NULL PRIMARY KEY,
        PODate DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
        SupplierId INT NULL,
        SupplierCode NVARCHAR(50) NULL,
        AccountTitle NVARCHAR(255) NULL,
        Description NVARCHAR(500) NULL,
        TotalPackets FLOAT NOT NULL DEFAULT 0,
        TotalPcs FLOAT NOT NULL DEFAULT 0,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME NULL
      );
    END;

    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'PurchaseOrderDetail')
    BEGIN
      CREATE TABLE PurchaseOrderDetail (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Doc INT NOT NULL,
        LineNum INT NOT NULL,
        ProductId INT NOT NULL,
        Description NVARCHAR(500) NULL,
        Packing FLOAT NOT NULL DEFAULT 0,
        Packets FLOAT NOT NULL DEFAULT 0,
        Pcs FLOAT NOT NULL DEFAULT 0,
        TotalQty FLOAT NOT NULL DEFAULT 0,
        CONSTRAINT FK_PurchaseOrderDetail_Header FOREIGN KEY (Doc)
          REFERENCES PurchaseOrderHeader(Doc) ON DELETE CASCADE
      );
      CREATE INDEX IX_PurchaseOrderDetail_Doc ON PurchaseOrderDetail(Doc);
    END;
  `);
  tablesReady = true;
}

function mapHeader(row, items = []) {
  return {
    doc: row.Doc,
    poNumber: String(row.Doc),
    invoiceNo: String(row.Doc),
    date: row.PODate,
    supplierId: row.SupplierId,
    supplierCode: row.SupplierCode || '',
    accountTitle: row.AccountTitle || '',
    description: row.Description || '',
    totalPackets: row.TotalPackets ?? 0,
    totalPcs: row.TotalPcs ?? 0,
    items,
  };
}

function mapDetailRow(row) {
  const packingSize = row.ProductPacking ?? 0;
  const packets = row.Packing ?? 0;
  const packingDisplay = packingSize > 0 && packets > 0
    ? `${packets} x ${packingSize}`
    : (packets > 0 ? String(packets) : '-');
  return {
    lineNo: row.LineNum,
    productId: row.ProductId,
    productCode: row.ProductCode != null ? String(row.ProductCode) : '',
    productName: row.ProductName || row.Description || '',
    description: row.Description || row.ProductName || '',
    uom: row.Unit || 'PCS',
    packing: packets,
    packingSize,
    packingDisplay,
    packets,
    pcs: row.Pcs ?? 0,
    totalQty: row.TotalQty ?? 0,
  };
}

function calcLineTotals(item) {
  const packingSize = parseFloat(item.packingSize) || 0;
  const packets = parseFloat(item.packets) ?? parseFloat(item.packing) ?? 0;
  const pcs = parseFloat(item.pcs) || 0;
  const totalQty = packingSize > 0 ? packets * packingSize + pcs : (packets > 0 ? packets : pcs);
  return { packingSize, packets, pcs, totalQty };
}

async function fetchDetails(pool, doc) {
  const result = await pool.request()
    .input('doc', sql.Int, doc)
    .query(`
      SELECT d.LineNum, d.ProductId, d.Description, d.Packing, d.Packets, d.Pcs, d.TotalQty,
        p.code AS ProductCode, p.Name AS ProductName, p.Packing AS ProductPacking, p.Size AS Unit
      FROM PurchaseOrderDetail d
      INNER JOIN Products p ON p.ID = d.ProductId
      WHERE d.Doc = @doc
      ORDER BY d.LineNum
    `);
  return result.recordset.map(mapDetailRow);
}

async function getNextDocNumber() {
  await ensurePurchaseOrderTables();
  const pool = await connectDB();
  const [h, ps] = await Promise.all([
    pool.request().query('SELECT ISNULL(MAX(Doc), 0) + 1 AS n FROM PurchaseOrderHeader'),
    pool.request().query(`SELECT ISNULL(MAX(Doc), 0) + 1 AS n FROM PSDetail WHERE Type = '${PO_TYPE}'`),
  ]);
  return Math.max(h.recordset[0].n, ps.recordset[0].n, 1);
}

async function getLatestPurchaseOrder() {
  await ensurePurchaseOrderTables();
  const pool = await connectDB();
  const header = await pool.request().query(`
    SELECT TOP 1 Doc, PODate, SupplierId, SupplierCode, AccountTitle, Description, TotalPackets, TotalPcs
    FROM PurchaseOrderHeader ORDER BY Doc DESC
  `);
  const row = header.recordset[0];
  if (!row) return null;
  const items = await fetchDetails(pool, row.Doc);
  return mapHeader(row, items);
}

async function getPurchaseOrderByDoc(doc) {
  await ensurePurchaseOrderTables();
  const pool = await connectDB();
  const header = await pool.request()
    .input('doc', sql.Int, Number(doc))
    .query(`
      SELECT Doc, PODate, SupplierId, SupplierCode, AccountTitle, Description, TotalPackets, TotalPcs
      FROM PurchaseOrderHeader WHERE Doc = @doc
    `);
  const row = header.recordset[0];
  if (!row) return null;
  const items = await fetchDetails(pool, row.Doc);
  return mapHeader(row, items);
}

async function listPurchaseOrders(limit = 50) {
  await ensurePurchaseOrderTables();
  const pool = await connectDB();
  const result = await pool.request()
    .input('limit', sql.Int, limit)
    .query(`
      SELECT TOP (@limit) Doc, PODate, SupplierCode, AccountTitle, Description, TotalPackets, TotalPcs
      FROM PurchaseOrderHeader ORDER BY Doc DESC
    `);
  return result.recordset.map((r) => mapHeader(r, []));
}

async function getProductInfo(productId) {
  const pool = await connectDB();
  const result = await pool.request()
    .input('id', sql.Int, Number(productId))
    .query(`
      SELECT p.ID, p.code, p.Name, p.Packing, p.Size AS unit, p.PurchaseRate
      FROM Products p WHERE p.ID = @id
    `);
  const row = result.recordset[0];
  if (!row) return null;
  const onHand = await fetchProductOnHand(productId);
  return {
    productId: row.ID,
    productCode: row.code != null ? String(row.code) : '',
    productName: row.Name,
    packingSize: row.Packing ?? 0,
    uom: row.unit || 'PCS',
    purchaseRate: row.PurchaseRate ?? 0,
    availableStock: onHand,
  };
}

async function syncPsDetail(transaction, doc, header, items) {
  const poDate = header.date ? new Date(header.date) : new Date();
  const amount = items.reduce((s, line) => {
    const rate = line.purchaseRate || 0;
    return s + line.totalQty * rate;
  }, 0);

  await new sql.Request(transaction)
    .input('doc', sql.Int, doc)
    .query(`DELETE FROM PSProduct WHERE Doc = @doc AND Type = '${PO_TYPE}'`);

  await new sql.Request(transaction)
    .input('doc', sql.Int, doc)
    .query(`DELETE FROM PSDetail WHERE Doc = @doc AND Type = '${PO_TYPE}'`);

  await new sql.Request(transaction)
    .input('doc', sql.Int, doc)
    .input('type', sql.NVarChar, PO_TYPE)
    .input('date', sql.DateTime, poDate)
    .input('acid', sql.Int, header.supplierId || 0)
    .input('invoice', sql.NVarChar, String(doc))
    .input('amount', sql.Float, amount)
    .input('description', sql.NVarChar, header.description || '')
    .query(`
      INSERT INTO PSDetail (Doc, Type, Date, Acid, invoice, Amount, Description, Term)
      VALUES (@doc, @type, @date, @acid, @invoice, @amount, @description, 'Credit')
    `);

  for (const line of items) {
    const rate = line.purchaseRate || 0;
    const vest = line.totalQty * rate;
    await new sql.Request(transaction)
      .input('doc', sql.Int, doc)
      .input('type', sql.NVarChar, PO_TYPE)
      .input('prid', sql.Int, line.productId)
      .input('qty', sql.Float, line.totalQty)
      .input('rate', sql.Float, rate)
      .input('vest', sql.Float, vest)
      .input('vist', sql.Float, vest)
      .input('packet', sql.NVarChar, line.packing > 0 ? String(line.packing) : '')
      .query(`
        INSERT INTO PSProduct (Doc, Type, Prid, Qty, Rate, VEST, VIST, Packet)
        VALUES (@doc, @type, @prid, @qty, @rate, @vest, @vist, @packet)
      `);
  }
}

async function savePurchaseOrder(payload, existingDoc = null) {
  await ensurePurchaseOrderTables();
  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const items = [];
    for (let idx = 0; idx < (payload.items || []).length; idx += 1) {
      const item = payload.items[idx];
      const { packingSize, packets, pcs, totalQty } = calcLineTotals(item);
      const prod = await pool.request()
        .input('id', sql.Int, Number(item.productId))
        .query('SELECT PurchaseRate FROM Products WHERE ID = @id');
      items.push({
        lineNo: idx + 1,
        productId: Number(item.productId),
        description: item.description || item.productName || '',
        packing: packets,
        packets,
        pcs,
        totalQty,
        packingSize,
        purchaseRate: parseFloat(item.purchaseRate) || prod.recordset[0]?.PurchaseRate || 0,
      });
    }

    if (!items.length) {
      throw new Error('Add at least one product line before saving.');
    }

    const totalPackets = items.reduce((s, i) => s + i.packets, 0);
    const totalPcs = items.reduce((s, i) => s + i.pcs, 0);
    const poDate = payload.date ? new Date(payload.date) : new Date();
    const supplierId = payload.supplierId ? Number(payload.supplierId) : null;
    const supplierCode = payload.supplierCode || '';
    const accountTitle = payload.accountTitle || '';
    const description = payload.description || '';

    let doc = existingDoc ? Number(existingDoc) : null;

    if (!doc) {
      doc = await getNextDocNumber();
    }

    const headerPayload = {
      date: poDate,
      supplierId,
      description,
    };

    if (existingDoc) {
      const check = await new sql.Request(transaction)
        .input('doc', sql.Int, doc)
        .query('SELECT Doc FROM PurchaseOrderHeader WHERE Doc = @doc');
      if (!check.recordset[0]) {
        throw new Error(`Purchase order #${doc} not found.`);
      }
      await new sql.Request(transaction)
        .input('doc', sql.Int, doc)
        .input('poDate', sql.Date, poDate)
        .input('supplierId', sql.Int, supplierId)
        .input('supplierCode', sql.NVarChar, supplierCode)
        .input('accountTitle', sql.NVarChar, accountTitle)
        .input('description', sql.NVarChar, description)
        .input('totalPackets', sql.Float, totalPackets)
        .input('totalPcs', sql.Float, totalPcs)
        .query(`
          UPDATE PurchaseOrderHeader
          SET PODate = @poDate, SupplierId = @supplierId, SupplierCode = @supplierCode,
              AccountTitle = @accountTitle, Description = @description,
              TotalPackets = @totalPackets, TotalPcs = @totalPcs, UpdatedAt = GETDATE()
          WHERE Doc = @doc
        `);
      await new sql.Request(transaction)
        .input('doc', sql.Int, doc)
        .query('DELETE FROM PurchaseOrderDetail WHERE Doc = @doc');
    } else {
      await new sql.Request(transaction)
        .input('doc', sql.Int, doc)
        .input('poDate', sql.Date, poDate)
        .input('supplierId', sql.Int, supplierId)
        .input('supplierCode', sql.NVarChar, supplierCode)
        .input('accountTitle', sql.NVarChar, accountTitle)
        .input('description', sql.NVarChar, description)
        .input('totalPackets', sql.Float, totalPackets)
        .input('totalPcs', sql.Float, totalPcs)
        .query(`
          INSERT INTO PurchaseOrderHeader
            (Doc, PODate, SupplierId, SupplierCode, AccountTitle, Description, TotalPackets, TotalPcs)
          VALUES
            (@doc, @poDate, @supplierId, @supplierCode, @accountTitle, @description, @totalPackets, @totalPcs)
        `);
    }

    for (const line of items) {
      await new sql.Request(transaction)
        .input('doc', sql.Int, doc)
        .input('lineNum', sql.Int, line.lineNo)
        .input('productId', sql.Int, line.productId)
        .input('description', sql.NVarChar, line.description)
        .input('packing', sql.Float, line.packing)
        .input('packets', sql.Float, line.packets)
        .input('pcs', sql.Float, line.pcs)
        .input('totalQty', sql.Float, line.totalQty)
        .query(`
          INSERT INTO PurchaseOrderDetail
            (Doc, LineNum, ProductId, Description, Packing, Packets, Pcs, TotalQty)
          VALUES (@doc, @lineNum, @productId, @description, @packing, @packets, @pcs, @totalQty)
        `);
    }

    await syncPsDetail(transaction, doc, headerPayload, items);

    await transaction.commit();
    return getPurchaseOrderByDoc(doc);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function deletePurchaseOrder(doc) {
  await ensurePurchaseOrderTables();
  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const docNum = Number(doc);
    await new sql.Request(transaction)
      .input('doc', sql.Int, docNum)
      .query(`DELETE FROM PSProduct WHERE Doc = @doc AND Type = '${PO_TYPE}'`);
    await new sql.Request(transaction)
      .input('doc', sql.Int, docNum)
      .query(`DELETE FROM PSDetail WHERE Doc = @doc AND Type = '${PO_TYPE}'`);
    const del = await new sql.Request(transaction)
      .input('doc', sql.Int, docNum)
      .query('DELETE FROM PurchaseOrderHeader WHERE Doc = @doc');
    if (del.rowsAffected[0] === 0) {
      throw new Error(`Purchase order #${doc} not found.`);
    }
    await transaction.commit();
    return { success: true };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

module.exports = {
  ensurePurchaseOrderTables,
  fetchSuppliers,
  getNextDocNumber,
  getLatestPurchaseOrder,
  getPurchaseOrderByDoc,
  listPurchaseOrders,
  getProductInfo,
  savePurchaseOrder,
  deletePurchaseOrder,
};
