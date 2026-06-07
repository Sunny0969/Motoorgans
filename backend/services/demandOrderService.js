const { connectDB, sql } = require('../config/mssqlconfig');
const { fetchProductOnHand } = require('../utils/mssqlRepository');

let tablesReady = false;

async function ensureDemandOrderTables() {
  if (tablesReady) return;
  const pool = await connectDB();
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'DemandOrderHeader')
    BEGIN
      CREATE TABLE DemandOrderHeader (
        Doc INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        DODate DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
        Description NVARCHAR(500) NULL,
        TotalPackets FLOAT NOT NULL DEFAULT 0,
        TotalPcs FLOAT NOT NULL DEFAULT 0,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME NULL
      );
    END;

    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'DemandOrderDetail')
    BEGIN
      CREATE TABLE DemandOrderDetail (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Doc INT NOT NULL,
        LineNum INT NOT NULL,
        ProductId INT NOT NULL,
        Description NVARCHAR(500) NULL,
        Packing FLOAT NOT NULL DEFAULT 0,
        Packets FLOAT NOT NULL DEFAULT 0,
        Pcs FLOAT NOT NULL DEFAULT 0,
        TotalQty FLOAT NOT NULL DEFAULT 0,
        CONSTRAINT FK_DemandOrderDetail_Header FOREIGN KEY (Doc)
          REFERENCES DemandOrderHeader(Doc) ON DELETE CASCADE
      );
      CREATE INDEX IX_DemandOrderDetail_Doc ON DemandOrderDetail(Doc);
    END;
  `);
  tablesReady = true;
}

function mapHeaderRow(row, items = []) {
  return {
    doc: row.Doc,
    demandNumber: String(row.Doc),
    date: row.DODate,
    description: row.Description || '',
    totalPackets: row.TotalPackets ?? 0,
    totalPcs: row.TotalPcs ?? 0,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
    items,
  };
}

function mapDetailRow(row) {
  return {
    lineNo: row.LineNum,
    productId: row.ProductId,
    productCode: row.ProductCode || '',
    productName: row.ProductName || row.Description || '',
    description: row.Description || row.ProductName || '',
    packing: row.Packing ?? 0,
    packingSize: row.ProductPacking ?? row.Packing ?? 0,
    packets: row.Packets ?? 0,
    pcs: row.Pcs ?? 0,
    totalQty: row.TotalQty ?? 0,
    minQty: row.ReOrder ?? 0,
    availableStock: row.AvailableStock ?? 0,
  };
}

async function fetchDemandOrderDetails(pool, doc) {
  const result = await pool.request()
    .input('doc', sql.Int, doc)
    .query(`
      SELECT d.LineNum, d.ProductId, d.Description, d.Packing, d.Packets, d.Pcs, d.TotalQty,
        p.code AS ProductCode, p.Name AS ProductName, p.Packing AS ProductPacking, p.ReOrder,
        ISNULL(t.os, ISNULL(p.OQty, 0)) AS AvailableStock
      FROM DemandOrderDetail d
      INNER JOIN Products p ON p.ID = d.ProductId
      LEFT JOIN tempstock t ON p.ID = t.PRID
      WHERE d.Doc = @doc
      ORDER BY d.LineNum
    `);
  return result.recordset.map(mapDetailRow);
}

async function getNextDemandOrderNumber() {
  await ensureDemandOrderTables();
  const pool = await connectDB();
  const result = await pool.request().query(
    'SELECT ISNULL(MAX(Doc), 0) + 1 AS nextNumber FROM DemandOrderHeader',
  );
  return result.recordset[0].nextNumber;
}

async function getLatestDemandOrder() {
  await ensureDemandOrderTables();
  const pool = await connectDB();
  const header = await pool.request().query(`
    SELECT TOP 1 Doc, DODate, Description, TotalPackets, TotalPcs, CreatedAt, UpdatedAt
    FROM DemandOrderHeader
    ORDER BY Doc DESC
  `);
  const row = header.recordset[0];
  if (!row) return null;
  const items = await fetchDemandOrderDetails(pool, row.Doc);
  return mapHeaderRow(row, items);
}

async function getDemandOrderByDoc(doc) {
  await ensureDemandOrderTables();
  const pool = await connectDB();
  const header = await pool.request()
    .input('doc', sql.Int, Number(doc))
    .query(`
      SELECT Doc, DODate, Description, TotalPackets, TotalPcs, CreatedAt, UpdatedAt
      FROM DemandOrderHeader WHERE Doc = @doc
    `);
  const row = header.recordset[0];
  if (!row) return null;
  const items = await fetchDemandOrderDetails(pool, row.Doc);
  return mapHeaderRow(row, items);
}

async function listDemandOrders(limit = 50) {
  await ensureDemandOrderTables();
  const pool = await connectDB();
  const result = await pool.request()
    .input('limit', sql.Int, limit)
    .query(`
      SELECT TOP (@limit) Doc, DODate, Description, TotalPackets, TotalPcs, CreatedAt
      FROM DemandOrderHeader
      ORDER BY Doc DESC
    `);
  return result.recordset.map((r) => mapHeaderRow(r, []));
}

async function fetchProductStockStatus(search = '') {
  const pool = await connectDB();
  const request = pool.request();
  let where = 'WHERE ISNULL(p.isactive, 1) = 1';
  if (search && String(search).trim()) {
    request.input('search', sql.NVarChar, `%${String(search).trim()}%`);
    where += ' AND (p.Name LIKE @search OR p.code LIKE @search)';
  }
  const result = await request.query(`
    SELECT p.ID AS productId, p.code AS productCode, p.Name AS description,
      p.Packing AS packingSize, p.ReOrder AS minQty,
      ISNULL(t.os, ISNULL(p.OQty, 0)) AS available
    FROM Products p
    LEFT JOIN tempstock t ON p.ID = t.PRID
    ${where}
    ORDER BY p.Name
  `);
  return result.recordset.map((r, i) => ({
    sr: i + 1,
    productId: r.productId,
    productCode: r.productCode,
    description: r.description,
    packingSize: r.packingSize ?? 0,
    minQty: r.minQty ?? 0,
    available: r.available ?? 0,
  }));
}

function calcLineTotals(item) {
  const packingSize = parseFloat(item.packingSize) || parseFloat(item.packing) || 0;
  const packets = parseFloat(item.packets) || 0;
  const pcs = parseFloat(item.pcs) || 0;
  const totalQty = packingSize > 0 ? packets * packingSize + pcs : pcs;
  return { packingSize, packets, pcs, totalQty };
}

function summarizeItems(items) {
  let totalPackets = 0;
  let totalPcs = 0;
  items.forEach((item) => {
    totalPackets += parseFloat(item.packets) || 0;
    totalPcs += parseFloat(item.pcs) || 0;
  });
  return { totalPackets, totalPcs };
}

async function saveDemandOrder(payload, existingDoc = null) {
  await ensureDemandOrderTables();
  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const items = (payload.items || []).map((item, idx) => {
      const { packingSize, packets, pcs, totalQty } = calcLineTotals(item);
      return {
        lineNo: idx + 1,
        productId: Number(item.productId),
        description: item.description || item.productName || '',
        packing: packingSize,
        packets,
        pcs,
        totalQty,
      };
    });

    if (!items.length) {
      throw new Error('Add at least one product line before saving.');
    }

    const { totalPackets, totalPcs } = summarizeItems(items);
    const description = payload.description || '';
    const doDate = payload.date ? new Date(payload.date) : new Date();

    let doc = existingDoc ? Number(existingDoc) : null;

    if (doc) {
      const check = await new sql.Request(transaction)
        .input('doc', sql.Int, doc)
        .query('SELECT Doc FROM DemandOrderHeader WHERE Doc = @doc');
      if (!check.recordset[0]) {
        throw new Error(`Demand order #${doc} not found.`);
      }

      await new sql.Request(transaction)
        .input('doc', sql.Int, doc)
        .input('doDate', sql.Date, doDate)
        .input('description', sql.NVarChar, description)
        .input('totalPackets', sql.Float, totalPackets)
        .input('totalPcs', sql.Float, totalPcs)
        .query(`
          UPDATE DemandOrderHeader
          SET DODate = @doDate, Description = @description,
              TotalPackets = @totalPackets, TotalPcs = @totalPcs, UpdatedAt = GETDATE()
          WHERE Doc = @doc
        `);

      await new sql.Request(transaction)
        .input('doc', sql.Int, doc)
        .query('DELETE FROM DemandOrderDetail WHERE Doc = @doc');
    } else {
      const ins = await new sql.Request(transaction)
        .input('doDate', sql.Date, doDate)
        .input('description', sql.NVarChar, description)
        .input('totalPackets', sql.Float, totalPackets)
        .input('totalPcs', sql.Float, totalPcs)
        .query(`
          INSERT INTO DemandOrderHeader (DODate, Description, TotalPackets, TotalPcs)
          OUTPUT INSERTED.Doc
          VALUES (@doDate, @description, @totalPackets, @totalPcs)
        `);
      doc = ins.recordset[0].Doc;
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
          INSERT INTO DemandOrderDetail
            (Doc, LineNum, ProductId, Description, Packing, Packets, Pcs, TotalQty)
          VALUES
            (@doc, @lineNum, @productId, @description, @packing, @packets, @pcs, @totalQty)
        `);
    }

    await transaction.commit();
    return getDemandOrderByDoc(doc);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function deleteDemandOrder(doc) {
  await ensureDemandOrderTables();
  const pool = await connectDB();
  const result = await pool.request()
    .input('doc', sql.Int, Number(doc))
    .query('DELETE FROM DemandOrderHeader WHERE Doc = @doc');
  if (result.rowsAffected[0] === 0) {
    throw new Error(`Demand order #${doc} not found.`);
  }
  return { success: true };
}

async function getProductStockInfo(productId) {
  const pool = await connectDB();
  const result = await pool.request()
    .input('id', sql.Int, Number(productId))
    .query(`
      SELECT p.ID, p.code, p.Name, p.Packing, p.Size AS unit, p.ReOrder,
        ISNULL(t.os, ISNULL(p.OQty, 0)) AS onHandQty
      FROM Products p
      LEFT JOIN tempstock t ON p.ID = t.PRID
      WHERE p.ID = @id
    `);
  const row = result.recordset[0];
  if (!row) return null;
  return {
    productId: row.ID,
    productCode: row.code,
    productName: row.Name,
    packingSize: row.Packing ?? 0,
    uom: row.unit || 'PCS',
    minQty: row.ReOrder ?? 0,
    availableStock: row.onHandQty ?? 0,
  };
}

module.exports = {
  ensureDemandOrderTables,
  getNextDemandOrderNumber,
  getLatestDemandOrder,
  getDemandOrderByDoc,
  listDemandOrders,
  fetchProductStockStatus,
  saveDemandOrder,
  deleteDemandOrder,
  getProductStockInfo,
  fetchProductOnHand,
};
