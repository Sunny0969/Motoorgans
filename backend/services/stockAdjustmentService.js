const { connectDB, sql } = require('../config/mssqlconfig');

const STOCK_ADJ_TYPE = 'Stock Adjustment';

let tablesReady = false;

async function ensureStockAdjustmentTables() {
  if (tablesReady) return;
  const pool = await connectDB();
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'StockAdjustmentHeader')
    BEGIN
      CREATE TABLE StockAdjustmentHeader (
        Doc INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        AdjDate DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
        Description NVARCHAR(500) NULL,
        TotalPcs FLOAT NOT NULL DEFAULT 0,
        TotalDifference FLOAT NOT NULL DEFAULT 0,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME NULL
      );
    END;

    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'StockAdjustmentDetail')
    BEGIN
      CREATE TABLE StockAdjustmentDetail (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Doc INT NOT NULL,
        LineNum INT NOT NULL,
        ProductId INT NOT NULL,
        Packing FLOAT NOT NULL DEFAULT 0,
        Pcs FLOAT NOT NULL DEFAULT 0,
        TotalPcs FLOAT NOT NULL DEFAULT 0,
        Difference FLOAT NOT NULL DEFAULT 0,
        AvailableBefore FLOAT NOT NULL DEFAULT 0,
        LocationId INT NULL,
        LocationName NVARCHAR(100) NULL,
        CONSTRAINT FK_StockAdjustmentDetail_Header FOREIGN KEY (Doc)
          REFERENCES StockAdjustmentHeader(Doc) ON DELETE CASCADE
      );
      CREATE INDEX IX_StockAdjustmentDetail_Doc ON StockAdjustmentDetail(Doc);
    END;
  `);
  tablesReady = true;
}

function mapHeader(row, items = []) {
  return {
    doc: row.Doc,
    invoiceNo: String(row.Doc),
    date: row.AdjDate,
    description: row.Description || '',
    totalPcs: row.TotalPcs ?? 0,
    totalDifference: row.TotalDifference ?? 0,
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
    difference: row.Difference ?? 0,
    availableBefore: row.AvailableBefore ?? 0,
    locationId: row.LocationId,
    locationName: row.LocationName || '',
  };
}

function calcLineTotals(item) {
  const packingSize = parseFloat(item.packingSize) || 0;
  const packets = parseFloat(item.packets) ?? parseFloat(item.packing) ?? 0;
  const pcs = parseFloat(item.pcs) || 0;
  const totalPcs = packingSize > 0 ? packets * packingSize + pcs : (packets > 0 ? packets : pcs);
  const availableBefore = parseFloat(item.availableBefore) ?? parseFloat(item.availableStock) ?? 0;
  const difference = item.difference != null && item.difference !== ''
    ? parseFloat(item.difference)
    : totalPcs - availableBefore;
  return { packingSize, packets, pcs, totalPcs, availableBefore, difference };
}

async function fetchDetails(pool, doc) {
  const result = await pool.request()
    .input('doc', sql.Int, doc)
    .query(`
      SELECT d.LineNum, d.ProductId, d.Packing, d.Pcs, d.TotalPcs, d.Difference, d.AvailableBefore,
        d.LocationId, d.LocationName,
        p.code AS ProductCode, p.Name AS ProductName, p.Packing AS ProductPacking, p.Size AS Unit
      FROM StockAdjustmentDetail d
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
            WHEN Type IN ('In', 'Purchase', 'Opening', 'Transfer In') THEN ISNULL(Qty, 0)
            WHEN Type IN ('Out', 'Sale', 'Transfer Out') THEN -ISNULL(Qty, 0)
            WHEN Type = '${STOCK_ADJ_TYPE}' THEN ISNULL(Qty, 0)
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

async function syncTempStock(request, productId, difference) {
  const exists = await request
    .input('prid', sql.Int, productId)
    .query('SELECT PRID, os FROM tempstock WHERE PRID = @prid');
  if (exists.recordset[0]) {
    const newOs = (parseFloat(exists.recordset[0].os) || 0) + difference;
    await request
      .input('qty', sql.Float, newOs)
      .query('UPDATE tempstock SET os = @qty WHERE PRID = @prid');
  } else {
    const avail = await fetchAvailableStock(productId, null);
    await request
      .input('qty', sql.Float, avail + difference)
      .query('INSERT INTO tempstock (PRID, os) VALUES (@prid, @qty)');
  }
}

async function getNextInvoiceNumber() {
  await ensureStockAdjustmentTables();
  const pool = await connectDB();
  const result = await pool.request().query(
    'SELECT ISNULL(MAX(Doc), 0) + 1 AS nextNumber FROM StockAdjustmentHeader',
  );
  return result.recordset[0].nextNumber;
}

async function getLatestStockAdjustment() {
  await ensureStockAdjustmentTables();
  const pool = await connectDB();
  const header = await pool.request().query(`
    SELECT TOP 1 Doc, AdjDate, Description, TotalPcs, TotalDifference
    FROM StockAdjustmentHeader ORDER BY Doc DESC
  `);
  const row = header.recordset[0];
  if (!row) return null;
  const items = await fetchDetails(pool, row.Doc);
  return mapHeader(row, items);
}

async function getStockAdjustmentByDoc(doc) {
  await ensureStockAdjustmentTables();
  const pool = await connectDB();
  const header = await pool.request()
    .input('doc', sql.Int, Number(doc))
    .query(`
      SELECT Doc, AdjDate, Description, TotalPcs, TotalDifference
      FROM StockAdjustmentHeader WHERE Doc = @doc
    `);
  const row = header.recordset[0];
  if (!row) return null;
  const items = await fetchDetails(pool, row.Doc);
  return mapHeader(row, items);
}

async function listStockAdjustments(limit = 50) {
  await ensureStockAdjustmentTables();
  const pool = await connectDB();
  const result = await pool.request()
    .input('limit', sql.Int, limit)
    .query(`
      SELECT TOP (@limit) Doc, AdjDate, Description, TotalPcs, TotalDifference
      FROM StockAdjustmentHeader ORDER BY Doc DESC
    `);
  return result.recordset.map((r) => mapHeader(r, []));
}

async function getProductInfo(productId, locationId) {
  const pool = await connectDB();
  const result = await pool.request()
    .input('id', sql.Int, Number(productId))
    .query(`
      SELECT p.ID, p.code, p.Name, p.Packing, p.Size AS unit, p.PurchaseRate
      FROM Products p WHERE p.ID = @id
    `);
  const row = result.recordset[0];
  if (!row) return null;
  const availableStock = await fetchAvailableStock(productId, locationId);
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
    .query(`DELETE FROM Stock WHERE Doc = @doc AND Type = '${STOCK_ADJ_TYPE}'`);
}

async function saveStockAdjustment(payload, existingDoc = null) {
  await ensureStockAdjustmentTables();
  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const items = [];
    for (let idx = 0; idx < (payload.items || []).length; idx += 1) {
      const item = payload.items[idx];
      const availableBefore = await fetchAvailableStock(
        item.productId,
        item.locationId,
      );
      const line = calcLineTotals({
        ...item,
        availableBefore,
        availableStock: availableBefore,
      });
      if (line.difference === 0 && line.totalPcs === availableBefore) {
        throw new Error(`Line ${idx + 1}: No difference to adjust (physical qty equals available stock).`);
      }
      items.push({
        lineNo: idx + 1,
        productId: Number(item.productId),
        packing: line.packets,
        pcs: line.pcs,
        totalPcs: line.totalPcs,
        difference: line.difference,
        availableBefore,
        locationId: item.locationId != null && item.locationId !== '' ? Number(item.locationId) : null,
        locationName: item.locationName || '',
      });
    }

    if (!items.length) {
      throw new Error('Add at least one product line before saving.');
    }

    const totalPcs = items.reduce((s, i) => s + i.totalPcs, 0);
    const totalDifference = items.reduce((s, i) => s + i.difference, 0);
    const adjDate = payload.date ? new Date(payload.date) : new Date();
    const description = payload.description || '';
    let doc = existingDoc ? Number(existingDoc) : null;

    if (doc) {
      const check = await new sql.Request(transaction)
        .input('doc', sql.Int, doc)
        .query('SELECT Doc FROM StockAdjustmentHeader WHERE Doc = @doc');
      if (!check.recordset[0]) {
        throw new Error(`Stock adjustment #${doc} not found.`);
      }

      const oldLines = await new sql.Request(transaction)
        .input('doc', sql.Int, doc)
        .query(`
          SELECT ProductId, Difference FROM StockAdjustmentDetail WHERE Doc = @doc
        `);
      for (const old of oldLines.recordset) {
        const reqRev = new sql.Request(transaction);
        await syncTempStock(reqRev, old.ProductId, -(old.Difference || 0));
      }

      await deleteStockMovementsForDoc(new sql.Request(transaction), doc);

      await new sql.Request(transaction)
        .input('doc', sql.Int, doc)
        .input('adjDate', sql.Date, adjDate)
        .input('description', sql.NVarChar, description)
        .input('totalPcs', sql.Float, totalPcs)
        .input('totalDifference', sql.Float, totalDifference)
        .query(`
          UPDATE StockAdjustmentHeader
          SET AdjDate = @adjDate, Description = @description,
              TotalPcs = @totalPcs, TotalDifference = @totalDifference, UpdatedAt = GETDATE()
          WHERE Doc = @doc
        `);

      await new sql.Request(transaction)
        .input('doc', sql.Int, doc)
        .query('DELETE FROM StockAdjustmentDetail WHERE Doc = @doc');
    } else {
      const ins = await new sql.Request(transaction)
        .input('adjDate', sql.Date, adjDate)
        .input('description', sql.NVarChar, description)
        .input('totalPcs', sql.Float, totalPcs)
        .input('totalDifference', sql.Float, totalDifference)
        .query(`
          INSERT INTO StockAdjustmentHeader (AdjDate, Description, TotalPcs, TotalDifference)
          OUTPUT INSERTED.Doc
          VALUES (@adjDate, @description, @totalPcs, @totalDifference)
        `);
      doc = ins.recordset[0].Doc;
    }

    for (const line of items) {
      const prod = await new sql.Request(transaction)
        .input('id', sql.Int, line.productId)
        .query('SELECT PurchaseRate FROM Products WHERE ID = @id');
      const rate = prod.recordset[0]?.PurchaseRate || 0;
      const amount = Math.abs(line.difference) * rate;

      await new sql.Request(transaction)
        .input('doc', sql.Int, doc)
        .input('lineNum', sql.Int, line.lineNo)
        .input('productId', sql.Int, line.productId)
        .input('packing', sql.Float, line.packing)
        .input('pcs', sql.Float, line.pcs)
        .input('totalPcs', sql.Float, line.totalPcs)
        .input('difference', sql.Float, line.difference)
        .input('availableBefore', sql.Float, line.availableBefore)
        .input('locationId', sql.Int, line.locationId)
        .input('locationName', sql.NVarChar, line.locationName)
        .query(`
          INSERT INTO StockAdjustmentDetail
            (Doc, LineNum, ProductId, Packing, Pcs, TotalPcs, Difference, AvailableBefore,
             LocationId, LocationName)
          VALUES
            (@doc, @lineNum, @productId, @packing, @pcs, @totalPcs, @difference, @availableBefore,
             @locationId, @locationName)
        `);

      if (line.difference !== 0) {
        await new sql.Request(transaction)
          .input('doc', sql.Int, doc)
          .input('date', sql.SmallDateTime, adjDate)
          .input('prid', sql.Int, line.productId)
          .input('qty', sql.Float, line.difference)
          .input('rate', sql.Float, rate)
          .input('amount', sql.Float, amount)
          .input('locationId', sql.Int, line.locationId ?? 0)
          .query(`
            INSERT INTO Stock (Doc, Type, Date, Prid, Qty, Rate, Amount, locationid, Department)
            VALUES (@doc, '${STOCK_ADJ_TYPE}', @date, @prid, @qty, @rate, @amount, @locationId, 'Adjustment')
          `);
      }

      const reqTemp = new sql.Request(transaction);
      await syncTempStock(reqTemp, line.productId, line.difference);
    }

    await transaction.commit();
    return getStockAdjustmentByDoc(doc);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function deleteStockAdjustment(doc) {
  await ensureStockAdjustmentTables();
  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const docNum = Number(doc);
    const lines = await new sql.Request(transaction)
      .input('doc', sql.Int, docNum)
      .query('SELECT ProductId, Difference FROM StockAdjustmentDetail WHERE Doc = @doc');

    for (const line of lines.recordset) {
      const reqRev = new sql.Request(transaction);
      await syncTempStock(reqRev, line.ProductId, -(line.Difference || 0));
    }

    await deleteStockMovementsForDoc(new sql.Request(transaction), docNum);
    const del = await new sql.Request(transaction)
      .input('doc', sql.Int, docNum)
      .query('DELETE FROM StockAdjustmentHeader WHERE Doc = @doc');
    if (del.rowsAffected[0] === 0) {
      throw new Error(`Stock adjustment #${doc} not found.`);
    }
    await transaction.commit();
    return { success: true };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

module.exports = {
  ensureStockAdjustmentTables,
  fetchLocations,
  fetchAvailableStock,
  getNextInvoiceNumber,
  getLatestStockAdjustment,
  getStockAdjustmentByDoc,
  listStockAdjustments,
  getProductInfo,
  saveStockAdjustment,
  deleteStockAdjustment,
};
