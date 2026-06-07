const { connectDB, sql } = require('../config/mssqlconfig');

const STOCK_OUT_TYPE = 'Transfer Out';
const STOCK_IN_TYPE = 'Transfer In';

let tablesReady = false;

async function ensureStockTransferTables() {
  if (tablesReady) return;
  const pool = await connectDB();
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'StockTransferHeader')
    BEGIN
      CREATE TABLE StockTransferHeader (
        Doc INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        TransferDate DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
        Description NVARCHAR(500) NULL,
        TotalPcs FLOAT NOT NULL DEFAULT 0,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME NULL
      );
    END;

    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'StockTransferDetail')
    BEGIN
      CREATE TABLE StockTransferDetail (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Doc INT NOT NULL,
        LineNum INT NOT NULL,
        ProductId INT NOT NULL,
        Packing FLOAT NOT NULL DEFAULT 0,
        Pcs FLOAT NOT NULL DEFAULT 0,
        TotalPcs FLOAT NOT NULL DEFAULT 0,
        FromLocationId INT NULL,
        FromLocationName NVARCHAR(100) NULL,
        ToLocationId INT NULL,
        ToLocationName NVARCHAR(100) NULL,
        CONSTRAINT FK_StockTransferDetail_Header FOREIGN KEY (Doc)
          REFERENCES StockTransferHeader(Doc) ON DELETE CASCADE
      );
      CREATE INDEX IX_StockTransferDetail_Doc ON StockTransferDetail(Doc);
    END;
  `);
  tablesReady = true;
}

function mapHeader(row, items = []) {
  return {
    doc: row.Doc,
    invoiceNo: String(row.Doc),
    date: row.TransferDate,
    description: row.Description || '',
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
    productName: row.ProductName || '',
    uom: row.Unit || 'PCS',
    packing: packets,
    packingSize,
    packingDisplay,
    pcs: row.Pcs ?? 0,
    totalPcs: row.TotalPcs ?? 0,
    fromLocationId: row.FromLocationId,
    fromLocationName: row.FromLocationName || '',
    toLocationId: row.ToLocationId,
    toLocationName: row.ToLocationName || '',
  };
}

function calcLineTotals(item) {
  const packingSize = parseFloat(item.packingSize) || 0;
  const packets = parseFloat(item.packets) ?? parseFloat(item.packing) ?? 0;
  const pcs = parseFloat(item.pcs) || 0;
  const totalPcs = packingSize > 0 ? packets * packingSize + pcs : (packets > 0 ? packets : pcs);
  return { packingSize, packets, pcs, totalPcs };
}

async function fetchDetails(pool, doc) {
  const result = await pool.request()
    .input('doc', sql.Int, doc)
    .query(`
      SELECT d.LineNum, d.ProductId, d.Packing, d.Pcs, d.TotalPcs,
        d.FromLocationId, d.FromLocationName, d.ToLocationId, d.ToLocationName,
        p.code AS ProductCode, p.Name AS ProductName, p.Packing AS ProductPacking, p.Size AS Unit
      FROM StockTransferDetail d
      INNER JOIN Products p ON p.ID = d.ProductId
      WHERE d.Doc = @doc
      ORDER BY d.LineNum
    `);
  return result.recordset.map(mapDetailRow);
}

async function fetchLocations() {
  const pool = await connectDB();
  const result = await pool.request().query(`
    SELECT id, name, description FROM Locations ORDER BY id
  `);
  return result.recordset.map((r) => ({
    id: r.id,
    name: r.name || '',
    description: r.description || '',
  }));
}

async function fetchAvailableStock(productId, locationId) {
  const pool = await connectDB();
  const prid = Number(productId);
  const loc = locationId != null && locationId !== '' ? Number(locationId) : null;

  if (loc != null && !Number.isNaN(loc)) {
    const byLoc = await pool.request()
      .input('prid', sql.Int, prid)
      .input('loc', sql.Int, loc)
      .query(`
        SELECT ISNULL(SUM(
          CASE
            WHEN Type IN ('In', 'Purchase', 'Opening', '${STOCK_IN_TYPE}')
              THEN ISNULL(Qty, 0)
            WHEN Type IN ('Out', 'Sale', '${STOCK_OUT_TYPE}')
              THEN -ISNULL(Qty, 0)
            ELSE 0
          END
        ), 0) AS onHand
        FROM Stock
        WHERE Prid = @prid AND locationid = @loc
      `);
    const locQty = byLoc.recordset[0]?.onHand ?? 0;
    if (locQty !== 0) return locQty;
  }

  const global = await pool.request()
    .input('id', sql.Int, prid)
    .query(`
      SELECT ISNULL(t.os, ISNULL(p.OQty, 0)) AS onHand
      FROM Products p
      LEFT JOIN tempstock t ON p.ID = t.PRID
      WHERE p.ID = @id
    `);
  return global.recordset[0]?.onHand ?? 0;
}

async function getNextInvoiceNumber() {
  await ensureStockTransferTables();
  const pool = await connectDB();
  const result = await pool.request().query(
    'SELECT ISNULL(MAX(Doc), 0) + 1 AS nextNumber FROM StockTransferHeader',
  );
  return result.recordset[0].nextNumber;
}

async function getLatestStockTransfer() {
  await ensureStockTransferTables();
  const pool = await connectDB();
  const header = await pool.request().query(`
    SELECT TOP 1 Doc, TransferDate, Description, TotalPcs
    FROM StockTransferHeader ORDER BY Doc DESC
  `);
  const row = header.recordset[0];
  if (!row) return null;
  const items = await fetchDetails(pool, row.Doc);
  return mapHeader(row, items);
}

async function getStockTransferByDoc(doc) {
  await ensureStockTransferTables();
  const pool = await connectDB();
  const header = await pool.request()
    .input('doc', sql.Int, Number(doc))
    .query(`
      SELECT Doc, TransferDate, Description, TotalPcs
      FROM StockTransferHeader WHERE Doc = @doc
    `);
  const row = header.recordset[0];
  if (!row) return null;
  const items = await fetchDetails(pool, row.Doc);
  return mapHeader(row, items);
}

async function listStockTransfers(limit = 50) {
  await ensureStockTransferTables();
  const pool = await connectDB();
  const result = await pool.request()
    .input('limit', sql.Int, limit)
    .query(`
      SELECT TOP (@limit) Doc, TransferDate, Description, TotalPcs
      FROM StockTransferHeader ORDER BY Doc DESC
    `);
  return result.recordset.map((r) => mapHeader(r, []));
}

async function getProductInfo(productId, fromLocationId) {
  const pool = await connectDB();
  const result = await pool.request()
    .input('id', sql.Int, Number(productId))
    .query(`
      SELECT p.ID, p.code, p.Name, p.Packing, p.Size AS unit, p.PurchaseRate
      FROM Products p WHERE p.ID = @id
    `);
  const row = result.recordset[0];
  if (!row) return null;
  const availableStock = await fetchAvailableStock(productId, fromLocationId);
  return {
    productId: row.ID,
    productCode: row.code != null ? String(row.code) : '',
    productName: row.Name,
    packingSize: row.Packing ?? 0,
    uom: row.unit || 'PCS',
    purchaseRate: row.PurchaseRate ?? 0,
    availableStock,
  };
}

async function deleteStockMovementsForDoc(request, doc) {
  await request
    .input('doc', sql.Int, doc)
    .query(`
      DELETE FROM Stock
      WHERE Doc = @doc AND Type IN ('${STOCK_OUT_TYPE}', '${STOCK_IN_TYPE}')
    `);
}

async function saveStockTransfer(payload, existingDoc = null) {
  await ensureStockTransferTables();
  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const items = (payload.items || []).map((item, idx) => {
      const { packingSize, packets, pcs, totalPcs } = calcLineTotals(item);
      const fromId = item.fromLocationId != null && item.fromLocationId !== ''
        ? Number(item.fromLocationId) : null;
      const toId = item.toLocationId != null && item.toLocationId !== ''
        ? Number(item.toLocationId) : null;
      if (fromId == null || toId == null) {
        throw new Error('Each line must have From and To location.');
      }
      if (fromId === toId) {
        throw new Error('From and To location cannot be the same.');
      }
      return {
        lineNo: idx + 1,
        productId: Number(item.productId),
        packing: packets,
        pcs,
        totalPcs,
        packingSize,
        fromLocationId: fromId,
        fromLocationName: item.fromLocationName || '',
        toLocationId: toId,
        toLocationName: item.toLocationName || '',
      };
    });

    if (!items.length) {
      throw new Error('Add at least one product line before saving.');
    }

    const totalPcs = items.reduce((s, i) => s + i.totalPcs, 0);
    const transferDate = payload.date ? new Date(payload.date) : new Date();
    const description = payload.description || '';
    let doc = existingDoc ? Number(existingDoc) : null;

    if (doc) {
      const check = await new sql.Request(transaction)
        .input('doc', sql.Int, doc)
        .query('SELECT Doc FROM StockTransferHeader WHERE Doc = @doc');
      if (!check.recordset[0]) {
        throw new Error(`Stock transfer #${doc} not found.`);
      }
      await deleteStockMovementsForDoc(new sql.Request(transaction), doc);
      await new sql.Request(transaction)
        .input('doc', sql.Int, doc)
        .input('transferDate', sql.Date, transferDate)
        .input('description', sql.NVarChar, description)
        .input('totalPcs', sql.Float, totalPcs)
        .query(`
          UPDATE StockTransferHeader
          SET TransferDate = @transferDate, Description = @description,
              TotalPcs = @totalPcs, UpdatedAt = GETDATE()
          WHERE Doc = @doc
        `);
      await new sql.Request(transaction)
        .input('doc', sql.Int, doc)
        .query('DELETE FROM StockTransferDetail WHERE Doc = @doc');
    } else {
      const ins = await new sql.Request(transaction)
        .input('transferDate', sql.Date, transferDate)
        .input('description', sql.NVarChar, description)
        .input('totalPcs', sql.Float, totalPcs)
        .query(`
          INSERT INTO StockTransferHeader (TransferDate, Description, TotalPcs)
          OUTPUT INSERTED.Doc
          VALUES (@transferDate, @description, @totalPcs)
        `);
      doc = ins.recordset[0].Doc;
    }

    for (const line of items) {
      const available = await fetchAvailableStock(line.productId, line.fromLocationId);
      if (line.totalPcs > available) {
        throw new Error(
          `Insufficient stock for product #${line.productId} at ${line.fromLocationName}. `
          + `Available: ${available}, requested: ${line.totalPcs}`,
        );
      }

      const prod = await new sql.Request(transaction)
        .input('id', sql.Int, line.productId)
        .query('SELECT PurchaseRate FROM Products WHERE ID = @id');
      const rate = prod.recordset[0]?.PurchaseRate || 0;
      const amount = line.totalPcs * rate;

      await new sql.Request(transaction)
        .input('doc', sql.Int, doc)
        .input('lineNum', sql.Int, line.lineNo)
        .input('productId', sql.Int, line.productId)
        .input('packing', sql.Float, line.packing)
        .input('pcs', sql.Float, line.pcs)
        .input('totalPcs', sql.Float, line.totalPcs)
        .input('fromId', sql.Int, line.fromLocationId)
        .input('fromName', sql.NVarChar, line.fromLocationName)
        .input('toId', sql.Int, line.toLocationId)
        .input('toName', sql.NVarChar, line.toLocationName)
        .query(`
          INSERT INTO StockTransferDetail
            (Doc, LineNum, ProductId, Packing, Pcs, TotalPcs,
             FromLocationId, FromLocationName, ToLocationId, ToLocationName)
          VALUES
            (@doc, @lineNum, @productId, @packing, @pcs, @totalPcs,
             @fromId, @fromName, @toId, @toName)
        `);

      await new sql.Request(transaction)
        .input('doc', sql.Int, doc)
        .input('date', sql.SmallDateTime, transferDate)
        .input('prid', sql.Int, line.productId)
        .input('qty', sql.Float, line.totalPcs)
        .input('rate', sql.Float, rate)
        .input('amount', sql.Float, amount)
        .input('fromId', sql.Int, line.fromLocationId)
        .query(`
          INSERT INTO Stock (Doc, Type, Date, Prid, Qty, Rate, Amount, locationid, Department)
          VALUES (@doc, '${STOCK_OUT_TYPE}', @date, @prid, @qty, @rate, @amount, @fromId, 'Stock Transfer')
        `);

      await new sql.Request(transaction)
        .input('doc', sql.Int, doc)
        .input('date', sql.SmallDateTime, transferDate)
        .input('prid', sql.Int, line.productId)
        .input('qty', sql.Float, line.totalPcs)
        .input('rate', sql.Float, rate)
        .input('amount', sql.Float, amount)
        .input('toId', sql.Int, line.toLocationId)
        .query(`
          INSERT INTO Stock (Doc, Type, Date, Prid, Qty, Rate, Amount, locationid, Department)
          VALUES (@doc, '${STOCK_IN_TYPE}', @date, @prid, @qty, @rate, @amount, @toId, 'Stock Transfer')
        `);
    }

    await transaction.commit();
    return getStockTransferByDoc(doc);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function deleteStockTransfer(doc) {
  await ensureStockTransferTables();
  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const docNum = Number(doc);
    await deleteStockMovementsForDoc(new sql.Request(transaction), docNum);
    const del = await new sql.Request(transaction)
      .input('doc', sql.Int, docNum)
      .query('DELETE FROM StockTransferHeader WHERE Doc = @doc');
    if (del.rowsAffected[0] === 0) {
      throw new Error(`Stock transfer #${doc} not found.`);
    }
    await transaction.commit();
    return { success: true };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

module.exports = {
  ensureStockTransferTables,
  fetchLocations,
  fetchAvailableStock,
  getNextInvoiceNumber,
  getLatestStockTransfer,
  getStockTransferByDoc,
  listStockTransfers,
  getProductInfo,
  saveStockTransfer,
  deleteStockTransfer,
};
