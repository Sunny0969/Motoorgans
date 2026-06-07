const { connectDB, sql } = require('../config/mssqlconfig');

let tablesReady = false;

async function ensureOpeningStockTables() {
  if (tablesReady) return;
  const pool = await connectDB();
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'OpeningStockHeader')
    BEGIN
      CREATE TABLE OpeningStockHeader (
        Doc INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        InvDate DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
        Description NVARCHAR(500) NULL,
        TotalPcs FLOAT NOT NULL DEFAULT 0,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME NULL
      );
    END;

    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'OpeningStockDetail')
    BEGIN
      CREATE TABLE OpeningStockDetail (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Doc INT NOT NULL,
        LineNum INT NOT NULL,
        ProductId INT NOT NULL,
        Packing FLOAT NOT NULL DEFAULT 0,
        Pcs FLOAT NOT NULL DEFAULT 0,
        TotalPcs FLOAT NOT NULL DEFAULT 0,
        LocationId INT NULL,
        LocationName NVARCHAR(100) NULL,
        CONSTRAINT FK_OpeningStockDetail_Header FOREIGN KEY (Doc)
          REFERENCES OpeningStockHeader(Doc) ON DELETE CASCADE
      );
      CREATE INDEX IX_OpeningStockDetail_Doc ON OpeningStockDetail(Doc);
    END;
  `);
  tablesReady = true;
}

function mapHeader(row, items = []) {
  return {
    doc: row.Doc,
    invoiceNo: String(row.Doc),
    date: row.InvDate,
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
    : (packets > 0 ? String(packets) : (packingSize > 0 ? String(packingSize) : '-'));
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
    locationId: row.LocationId,
    locationName: row.LocationName || '',
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
        d.LocationId, d.LocationName,
        p.code AS ProductCode, p.Name AS ProductName, p.Packing AS ProductPacking, p.Size AS Unit
      FROM OpeningStockDetail d
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

async function getNextInvoiceNumber() {
  await ensureOpeningStockTables();
  const pool = await connectDB();
  const result = await pool.request().query(
    'SELECT ISNULL(MAX(Doc), 0) + 1 AS nextNumber FROM OpeningStockHeader',
  );
  return result.recordset[0].nextNumber;
}

async function getLatestOpeningStock() {
  await ensureOpeningStockTables();
  const pool = await connectDB();
  const header = await pool.request().query(`
    SELECT TOP 1 Doc, InvDate, Description, TotalPcs
    FROM OpeningStockHeader ORDER BY Doc DESC
  `);
  const row = header.recordset[0];
  if (!row) return null;
  const items = await fetchDetails(pool, row.Doc);
  return mapHeader(row, items);
}

async function getOpeningStockByDoc(doc) {
  await ensureOpeningStockTables();
  const pool = await connectDB();
  const header = await pool.request()
    .input('doc', sql.Int, Number(doc))
    .query(`
      SELECT Doc, InvDate, Description, TotalPcs FROM OpeningStockHeader WHERE Doc = @doc
    `);
  const row = header.recordset[0];
  if (!row) return null;
  const items = await fetchDetails(pool, row.Doc);
  return mapHeader(row, items);
}

async function listOpeningStocks(limit = 50) {
  await ensureOpeningStockTables();
  const pool = await connectDB();
  const result = await pool.request()
    .input('limit', sql.Int, limit)
    .query(`
      SELECT TOP (@limit) Doc, InvDate, Description, TotalPcs
      FROM OpeningStockHeader ORDER BY Doc DESC
    `);
  return result.recordset.map((r) => mapHeader(r, []));
}

async function getProductInfo(productId) {
  const pool = await connectDB();
  const result = await pool.request()
    .input('id', sql.Int, Number(productId))
    .query(`
      SELECT p.ID, p.code, p.Name, p.Packing, p.Size AS unit, p.PurchaseRate,
        ISNULL(t.os, ISNULL(p.OQty, 0)) AS onHandQty
      FROM Products p
      LEFT JOIN tempstock t ON p.ID = t.PRID
      WHERE p.ID = @id
    `);
  const row = result.recordset[0];
  if (!row) return null;
  return {
    productId: row.ID,
    productCode: row.code != null ? String(row.code) : '',
    productName: row.Name,
    packingSize: row.Packing ?? 0,
    uom: row.unit || 'PCS',
    purchaseRate: row.PurchaseRate ?? 0,
    availableStock: row.onHandQty ?? 0,
  };
}

async function syncTempStock(request, productId, qty) {
  const exists = await request
    .input('prid', sql.Int, productId)
    .query('SELECT PRID FROM tempstock WHERE PRID = @prid');
  if (exists.recordset[0]) {
    await request
      .input('qty', sql.Float, qty)
      .query('UPDATE tempstock SET os = @qty WHERE PRID = @prid');
  } else {
    await request
      .input('qty', sql.Float, qty)
      .query('INSERT INTO tempstock (PRID, os) VALUES (@prid, @qty)');
  }
}

async function saveOpeningStock(payload, existingDoc = null) {
  await ensureOpeningStockTables();
  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const items = (payload.items || []).map((item, idx) => {
      const { packingSize, packets, pcs, totalPcs } = calcLineTotals(item);
      return {
        lineNo: idx + 1,
        productId: Number(item.productId),
        packing: packets,
        pcs,
        totalPcs,
        packingSize,
        locationId: item.locationId != null && item.locationId !== '' ? Number(item.locationId) : null,
        locationName: item.locationName || '',
        purchaseRate: parseFloat(item.purchaseRate) || 0,
      };
    });

    if (!items.length) {
      throw new Error('Add at least one product before saving.');
    }

    const totalPcs = items.reduce((s, i) => s + i.totalPcs, 0);
    const invDate = payload.date ? new Date(payload.date) : new Date();
    const description = payload.description || '';
    let doc = existingDoc ? Number(existingDoc) : null;

    if (doc) {
      const check = await new sql.Request(transaction)
        .input('doc', sql.Int, doc)
        .query('SELECT Doc FROM OpeningStockHeader WHERE Doc = @doc');
      if (!check.recordset[0]) {
        throw new Error(`Opening stock invoice #${doc} not found.`);
      }

      await new sql.Request(transaction)
        .input('doc', sql.Int, doc)
        .query(`DELETE FROM Stock WHERE Doc = @doc AND Type = 'Opening'`);

      await new sql.Request(transaction)
        .input('doc', sql.Int, doc)
        .input('invDate', sql.Date, invDate)
        .input('description', sql.NVarChar, description)
        .input('totalPcs', sql.Float, totalPcs)
        .query(`
          UPDATE OpeningStockHeader
          SET InvDate = @invDate, Description = @description, TotalPcs = @totalPcs, UpdatedAt = GETDATE()
          WHERE Doc = @doc
        `);

      await new sql.Request(transaction)
        .input('doc', sql.Int, doc)
        .query('DELETE FROM OpeningStockDetail WHERE Doc = @doc');
    } else {
      const ins = await new sql.Request(transaction)
        .input('invDate', sql.Date, invDate)
        .input('description', sql.NVarChar, description)
        .input('totalPcs', sql.Float, totalPcs)
        .query(`
          INSERT INTO OpeningStockHeader (InvDate, Description, TotalPcs)
          OUTPUT INSERTED.Doc VALUES (@invDate, @description, @totalPcs)
        `);
      doc = ins.recordset[0].Doc;
    }

    for (const line of items) {
      const prod = await new sql.Request(transaction)
        .input('id', sql.Int, line.productId)
        .query('SELECT PurchaseRate FROM Products WHERE ID = @id');
      const rate = line.purchaseRate || prod.recordset[0]?.PurchaseRate || 0;

      await new sql.Request(transaction)
        .input('doc', sql.Int, doc)
        .input('lineNum', sql.Int, line.lineNo)
        .input('productId', sql.Int, line.productId)
        .input('packing', sql.Float, line.packing)
        .input('pcs', sql.Float, line.pcs)
        .input('totalPcs', sql.Float, line.totalPcs)
        .input('locationId', sql.Int, line.locationId)
        .input('locationName', sql.NVarChar, line.locationName)
        .query(`
          INSERT INTO OpeningStockDetail
            (Doc, LineNum, ProductId, Packing, Pcs, TotalPcs, LocationId, LocationName)
          VALUES (@doc, @lineNum, @productId, @packing, @pcs, @totalPcs, @locationId, @locationName)
        `);

      await new sql.Request(transaction)
        .input('id', sql.Int, line.productId)
        .input('oQty', sql.Float, line.totalPcs)
        .input('oDate', sql.DateTime, invDate)
        .input('location', sql.NVarChar, line.locationName)
        .input('openingRate', sql.Float, rate)
        .query(`
          UPDATE Products
          SET OQty = @oQty, ODate = @oDate, location = @location, openingrate = @openingRate
          WHERE ID = @id
        `);

      await new sql.Request(transaction)
        .input('doc', sql.Int, doc)
        .input('date', sql.SmallDateTime, invDate)
        .input('prid', sql.Int, line.productId)
        .input('qty', sql.Float, line.totalPcs)
        .input('rate', sql.Float, rate)
        .input('amount', sql.Float, line.totalPcs * rate)
        .input('locationId', sql.Int, line.locationId ?? 0)
        .query(`
          INSERT INTO Stock (Doc, Type, Date, Prid, Qty, Rate, Amount, locationid)
          VALUES (@doc, 'Opening', @date, @prid, @qty, @rate, @amount, @locationId)
        `);

      const reqTemp = new sql.Request(transaction);
      await syncTempStock(reqTemp, line.productId, line.totalPcs);
    }

    await transaction.commit();
    return getOpeningStockByDoc(doc);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function deleteOpeningStock(doc) {
  await ensureOpeningStockTables();
  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const docNum = Number(doc);
    await new sql.Request(transaction)
      .input('doc', sql.Int, docNum)
      .query(`DELETE FROM Stock WHERE Doc = @doc AND Type = 'Opening'`);
    const del = await new sql.Request(transaction)
      .input('doc', sql.Int, docNum)
      .query('DELETE FROM OpeningStockHeader WHERE Doc = @doc');
    if (del.rowsAffected[0] === 0) {
      throw new Error(`Opening stock #${doc} not found.`);
    }
    await transaction.commit();
    return { success: true };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

module.exports = {
  ensureOpeningStockTables,
  fetchLocations,
  getNextInvoiceNumber,
  getLatestOpeningStock,
  getOpeningStockByDoc,
  listOpeningStocks,
  getProductInfo,
  saveOpeningStock,
  deleteOpeningStock,
};
