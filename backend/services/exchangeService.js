const { connectDB, sql } = require('../config/mssqlconfig');
const { fetchCustomers } = require('../utils/mssqlRepository');

const EXCHANGE_STOCK_TYPE = 'Exchange';

let tablesReady = false;

async function ensureExchangeTables() {
  if (tablesReady) return;
  const pool = await connectDB();
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ExchangeHeader')
    BEGIN
      CREATE TABLE ExchangeHeader (
        Doc INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        ExchangeDate DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
        CustomerId INT NULL,
        CustomerCode NVARCHAR(50) NULL,
        CustomerName NVARCHAR(255) NULL,
        Description NVARCHAR(500) NULL,
        TotalPcs FLOAT NOT NULL DEFAULT 0,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME NULL
      );
    END;

    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ExchangeDetail')
    BEGIN
      CREATE TABLE ExchangeDetail (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Doc INT NOT NULL,
        LineNum INT NOT NULL,
        ProductId INT NOT NULL,
        Packing FLOAT NOT NULL DEFAULT 0,
        Pcs FLOAT NOT NULL DEFAULT 0,
        TotalPcs FLOAT NOT NULL DEFAULT 0,
        LocationId INT NULL,
        LocationName NVARCHAR(100) NULL,
        CONSTRAINT FK_ExchangeDetail_Header FOREIGN KEY (Doc)
          REFERENCES ExchangeHeader(Doc) ON DELETE CASCADE
      );
      CREATE INDEX IX_ExchangeDetail_Doc ON ExchangeDetail(Doc);
    END;
  `);
  tablesReady = true;
}

function mapHeader(row, items = []) {
  return {
    doc: row.Doc,
    invoiceNo: String(row.Doc),
    date: row.ExchangeDate,
    customerId: row.CustomerId,
    customerCode: row.CustomerCode || '',
    customerName: row.CustomerName || '',
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
      FROM ExchangeDetail d
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
            WHEN Type IN ('In', 'Purchase', 'Opening', 'Transfer In')
              THEN ISNULL(Qty, 0)
            WHEN Type IN ('Out', 'Sale', 'Transfer Out', '${EXCHANGE_STOCK_TYPE}')
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
  await ensureExchangeTables();
  const pool = await connectDB();
  const result = await pool.request().query(
    'SELECT ISNULL(MAX(Doc), 0) + 1 AS nextNumber FROM ExchangeHeader',
  );
  return result.recordset[0].nextNumber;
}

async function getLatestExchange() {
  await ensureExchangeTables();
  const pool = await connectDB();
  const header = await pool.request().query(`
    SELECT TOP 1 Doc, ExchangeDate, CustomerId, CustomerCode, CustomerName, Description, TotalPcs
    FROM ExchangeHeader ORDER BY Doc DESC
  `);
  const row = header.recordset[0];
  if (!row) return null;
  const items = await fetchDetails(pool, row.Doc);
  return mapHeader(row, items);
}

async function getExchangeByDoc(doc) {
  await ensureExchangeTables();
  const pool = await connectDB();
  const header = await pool.request()
    .input('doc', sql.Int, Number(doc))
    .query(`
      SELECT Doc, ExchangeDate, CustomerId, CustomerCode, CustomerName, Description, TotalPcs
      FROM ExchangeHeader WHERE Doc = @doc
    `);
  const row = header.recordset[0];
  if (!row) return null;
  const items = await fetchDetails(pool, row.Doc);
  return mapHeader(row, items);
}

async function listExchanges(limit = 50) {
  await ensureExchangeTables();
  const pool = await connectDB();
  const result = await pool.request()
    .input('limit', sql.Int, limit)
    .query(`
      SELECT TOP (@limit) Doc, ExchangeDate, CustomerId, CustomerCode, CustomerName, Description, TotalPcs
      FROM ExchangeHeader ORDER BY Doc DESC
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

async function getCustomerInfo(customerId) {
  const customers = await fetchCustomers();
  const c = customers.find((x) => String(x.id) === String(customerId));
  if (!c) return null;
  return {
    id: c.id,
    code: c.code,
    name: c.name || c.customerName,
    address: c.address || '',
    phone: c.phone || '',
  };
}

async function deleteStockMovementsForDoc(request, doc) {
  await request
    .input('doc', sql.Int, doc)
    .query(`DELETE FROM Stock WHERE Doc = @doc AND Type = '${EXCHANGE_STOCK_TYPE}'`);
}

async function saveExchange(payload, existingDoc = null) {
  await ensureExchangeTables();
  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const customerId = payload.customerId != null && payload.customerId !== ''
      ? Number(payload.customerId) : null;
    if (!customerId) {
      throw new Error('Select a buyer (customer) before saving.');
    }

    const items = (payload.items || []).map((item, idx) => {
      const { packingSize, packets, pcs, totalPcs } = calcLineTotals(item);
      const locId = item.locationId != null && item.locationId !== ''
        ? Number(item.locationId) : null;
      if (locId == null) {
        throw new Error('Each line must have a From Location.');
      }
      return {
        lineNo: idx + 1,
        productId: Number(item.productId),
        packing: packets,
        pcs,
        totalPcs,
        packingSize,
        locationId: locId,
        locationName: item.locationName || '',
      };
    });

    if (!items.length) {
      throw new Error('Add at least one product line before saving.');
    }

    const totalPcs = items.reduce((s, i) => s + i.totalPcs, 0);
    const exchangeDate = payload.date ? new Date(payload.date) : new Date();
    const description = payload.description || '';
    const customerCode = payload.customerCode || '';
    const customerName = payload.customerName || '';
    let doc = existingDoc ? Number(existingDoc) : null;

    if (doc) {
      const check = await new sql.Request(transaction)
        .input('doc', sql.Int, doc)
        .query('SELECT Doc FROM ExchangeHeader WHERE Doc = @doc');
      if (!check.recordset[0]) {
        throw new Error(`Exchange #${doc} not found.`);
      }
      await deleteStockMovementsForDoc(new sql.Request(transaction), doc);
      await new sql.Request(transaction)
        .input('doc', sql.Int, doc)
        .input('exchangeDate', sql.Date, exchangeDate)
        .input('customerId', sql.Int, customerId)
        .input('customerCode', sql.NVarChar, customerCode)
        .input('customerName', sql.NVarChar, customerName)
        .input('description', sql.NVarChar, description)
        .input('totalPcs', sql.Float, totalPcs)
        .query(`
          UPDATE ExchangeHeader
          SET ExchangeDate = @exchangeDate, CustomerId = @customerId,
              CustomerCode = @customerCode, CustomerName = @customerName,
              Description = @description, TotalPcs = @totalPcs, UpdatedAt = GETDATE()
          WHERE Doc = @doc
        `);
      await new sql.Request(transaction)
        .input('doc', sql.Int, doc)
        .query('DELETE FROM ExchangeDetail WHERE Doc = @doc');
    } else {
      const ins = await new sql.Request(transaction)
        .input('exchangeDate', sql.Date, exchangeDate)
        .input('customerId', sql.Int, customerId)
        .input('customerCode', sql.NVarChar, customerCode)
        .input('customerName', sql.NVarChar, customerName)
        .input('description', sql.NVarChar, description)
        .input('totalPcs', sql.Float, totalPcs)
        .query(`
          INSERT INTO ExchangeHeader
            (ExchangeDate, CustomerId, CustomerCode, CustomerName, Description, TotalPcs)
          OUTPUT INSERTED.Doc
          VALUES (@exchangeDate, @customerId, @customerCode, @customerName, @description, @totalPcs)
        `);
      doc = ins.recordset[0].Doc;
    }

    for (const line of items) {
      const available = await fetchAvailableStock(line.productId, line.locationId);
      if (line.totalPcs > available) {
        throw new Error(
          `Insufficient stock for ${line.locationName || 'location'}. `
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
        .input('locationId', sql.Int, line.locationId)
        .input('locationName', sql.NVarChar, line.locationName)
        .query(`
          INSERT INTO ExchangeDetail
            (Doc, LineNum, ProductId, Packing, Pcs, TotalPcs, LocationId, LocationName)
          VALUES
            (@doc, @lineNum, @productId, @packing, @pcs, @totalPcs, @locationId, @locationName)
        `);

      await new sql.Request(transaction)
        .input('doc', sql.Int, doc)
        .input('date', sql.SmallDateTime, exchangeDate)
        .input('prid', sql.Int, line.productId)
        .input('qty', sql.Float, line.totalPcs)
        .input('rate', sql.Float, rate)
        .input('amount', sql.Float, amount)
        .input('locId', sql.Int, line.locationId)
        .query(`
          INSERT INTO Stock (Doc, Type, Date, Prid, Qty, Rate, Amount, locationid, Department)
          VALUES (@doc, '${EXCHANGE_STOCK_TYPE}', @date, @prid, @qty, @rate, @amount, @locId, 'Exchange')
        `);
    }

    await transaction.commit();
    return getExchangeByDoc(doc);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function deleteExchange(doc) {
  await ensureExchangeTables();
  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const docNum = Number(doc);
    await deleteStockMovementsForDoc(new sql.Request(transaction), docNum);
    const del = await new sql.Request(transaction)
      .input('doc', sql.Int, docNum)
      .query('DELETE FROM ExchangeHeader WHERE Doc = @doc');
    if (del.rowsAffected[0] === 0) {
      throw new Error(`Exchange #${doc} not found.`);
    }
    await transaction.commit();
    return { success: true };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

module.exports = {
  ensureExchangeTables,
  fetchLocations,
  fetchAvailableStock,
  getNextInvoiceNumber,
  getLatestExchange,
  getExchangeByDoc,
  listExchanges,
  getProductInfo,
  getCustomerInfo,
  saveExchange,
  deleteExchange,
  fetchCustomers,
};
