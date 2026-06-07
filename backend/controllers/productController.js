const { connectDB, sql } = require('../config/mssqlconfig');
const {
  fetchProducts,
  fetchProductById,
  searchProducts,
} = require('../utils/mssqlRepository');
const { mapProductBodyToDb } = require('../utils/mssqlMappers');
const { upsertCompanyColor } = require('../services/tmsModulesService');

const getProducts = async (req, res) => {
  try {
    const search = req.query.search || '';
    const limit = req.query.limit ? Number(req.query.limit) : 5000;
    const includeInactive = req.query.all === 'true' || req.query.all === '1';
    const products = await fetchProducts(search, limit, { includeInactive });
    res.json(products);
  } catch (error) {
    console.error('GET /api/products error:', error);
    res.status(500).json({ message: error.message });
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await fetchProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getNextProductId = async (req, res) => {
  try {
    const pool = await connectDB();
    const result = await pool.request().query(
      'SELECT ISNULL(MAX(ID), 0) + 1 AS nextId FROM Products',
    );
    const nextId = result.recordset[0].nextId;
    res.json({ nextId, suggestedCode: String(nextId) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const bindProductInputs = (request, fields, id = null) => {
  if (id != null) request.input('id', sql.Int, id);
  request
    .input('company', sql.NVarChar, fields.Company)
    .input('category', sql.NVarChar, fields.Category)
    .input('category2', sql.NVarChar, fields.category2)
    .input('country', sql.NVarChar, fields.country)
    .input('name', sql.NVarChar, fields.Name)
    .input('urduName', sql.NVarChar, fields.UrduName)
    .input('size', sql.NVarChar, fields.Size)
    .input('packing', sql.Float, fields.Packing)
    .input('purchaseRate', sql.Float, fields.PurchaseRate)
    .input('saleRate', sql.Float, fields.SaleRate)
    .input('saleRate2', sql.Float, fields.SaleRate2)
    .input('saleRate3', sql.Float, fields.SaleRate3)
    .input('saleRate4', sql.Float, fields.SaleRate4)
    .input('oQty', sql.Float, fields.OQty)
    .input('batch', sql.NVarChar, fields.Batch)
    .input('oDate', sql.DateTime, fields.ODate)
    .input('code', sql.NVarChar, fields.code)
    .input('schRate', sql.Float, fields.SchRate)
    .input('schPc', sql.Float, fields.SchPc)
    .input('reOrder', sql.Float, fields.ReOrder)
    .input('discount', sql.Float, fields.discount)
    .input('location', sql.NVarChar, fields.location)
    .input('openingRate', sql.Float, fields.openingrate)
    .input('isActive', sql.Int, fields.isactive);
};

const createProduct = async (req, res) => {
  try {
    const fields = mapProductBodyToDb(req.body);
    if (!fields.Name) {
      return res.status(400).json({ message: 'Product description (Name) is required.' });
    }

    const pool = await connectDB();
    const nextIdResult = await pool.request().query(
      'SELECT ISNULL(MAX(ID), 0) + 1 AS nextId FROM Products',
    );
    const nextId = nextIdResult.recordset[0].nextId;

    if (!fields.code) {
      fields.code = String(nextId);
    }

    const dup = await pool
      .request()
      .input('code', sql.NVarChar, fields.code)
      .query('SELECT ID FROM Products WHERE code = @code');
    if (dup.recordset.length > 0) {
      return res.status(400).json({ message: `Product code "${fields.code}" already exists.` });
    }

    const request = pool.request();
    bindProductInputs(request, fields, nextId);
    await request.query(`
      INSERT INTO Products (
        ID, Company, Category, category2, country, Name, UrduName, Size,
        Packing, PurchaseRate, SaleRate, SaleRate2, SaleRate3, SaleRate4,
        OQty, Batch, ODate, code, SchRate, SchPc, ReOrder, discount,
        location, openingrate, isactive
      ) VALUES (
        @id, @company, @category, @category2, @country, @name, @urduName, @size,
        @packing, @purchaseRate, @saleRate, @saleRate2, @saleRate3, @saleRate4,
        @oQty, @batch, @oDate, @code, @schRate, @schPc, @reOrder, @discount,
        @location, @openingRate, @isActive
      )
    `);

    if (fields.Company && req.body.companyColor != null && req.body.companyColor !== '') {
      await upsertCompanyColor(fields.Company, req.body.companyColor);
    }

    const product = await fetchProductById(nextId);
    res.status(201).json(product);
  } catch (error) {
    console.error('POST /api/products error:', error);
    res.status(500).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await fetchProductById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const fields = mapProductBodyToDb(req.body);
    if (!fields.Name) {
      return res.status(400).json({ message: 'Product description (Name) is required.' });
    }
    if (!fields.code) {
      fields.code = String(id);
    }

    const pool = await connectDB();
    const dup = await pool
      .request()
      .input('code', sql.NVarChar, fields.code)
      .input('id', sql.Int, id)
      .query('SELECT ID FROM Products WHERE code = @code AND ID <> @id');
    if (dup.recordset.length > 0) {
      return res.status(400).json({ message: `Product code "${fields.code}" already exists.` });
    }

    const request = pool.request();
    bindProductInputs(request, fields, id);
    await request.query(`
      UPDATE Products SET
        Company = @company,
        Category = @category,
        category2 = @category2,
        country = @country,
        Name = @name,
        UrduName = @urduName,
        Size = @size,
        Packing = @packing,
        PurchaseRate = @purchaseRate,
        SaleRate = @saleRate,
        SaleRate2 = @saleRate2,
        SaleRate3 = @saleRate3,
        SaleRate4 = @saleRate4,
        OQty = @oQty,
        Batch = @batch,
        ODate = @oDate,
        code = @code,
        SchRate = @schRate,
        SchPc = @schPc,
        ReOrder = @reOrder,
        discount = @discount,
        location = @location,
        openingrate = @openingRate,
        isactive = @isActive
      WHERE ID = @id
    `);

    if (fields.Company && req.body.companyColor != null && req.body.companyColor !== '') {
      await upsertCompanyColor(fields.Company, req.body.companyColor);
    }

    const product = await fetchProductById(id);
    res.json(product);
  } catch (error) {
    console.error('PUT /api/products error:', error);
    res.status(500).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await fetchProductById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const pool = await connectDB();
    await pool
      .request()
      .input('id', sql.Int, id)
      .query('UPDATE Products SET isactive = 0 WHERE ID = @id');

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/products error:', error);
    res.status(500).json({ message: error.message });
  }
};

const searchProductsHandler = async (req, res) => {
  try {
    const products = await searchProducts(req.params.query);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateStock = async (req, res) => {
  res.status(501).json({ message: 'Update stock is not implemented for SQL Server yet.' });
};

module.exports = {
  getProducts,
  getProduct,
  getNextProductId,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts: searchProductsHandler,
  updateStock,
};
