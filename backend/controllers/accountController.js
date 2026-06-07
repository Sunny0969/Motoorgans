const { connectDB, sql } = require('../config/mssqlconfig');
const {
  fetchCoaAccounts,
  fetchCoaAccountById,
  searchCoaAccounts,
  fetchCoaAccountsByType,
} = require('../utils/mssqlRepository');
const { mapAccountBodyToCoa } = require('../utils/mssqlMappers');

exports.getAccounts = async (req, res) => {
  try {
    const accounts = await fetchCoaAccounts();
    res.json(accounts);
  } catch (err) {
    console.error('Error fetching accounts:', err);
    res.status(500).json({ message: 'Server error fetching accounts' });
  }
};

exports.getAccount = async (req, res) => {
  try {
    const account = await fetchCoaAccountById(req.params.id);
    if (!account) return res.status(404).json({ message: 'Account not found' });
    res.json(account);
  } catch (err) {
    console.error('Error fetching account:', err);
    res.status(500).json({ message: 'Server error fetching account' });
  }
};

exports.createAccount = async (req, res) => {
  try {
    const pool = await connectDB();
    const fields = mapAccountBodyToCoa(req.body);

    if (!fields.Subsidary || fields.Subsidary.trim() === '') {
      return res.status(400).json({ message: 'Account Title is required' });
    }

    if (fields.code && fields.code.trim() !== '') {
      const duplicate = await pool
        .request()
        .input('code', sql.NVarChar, fields.code)
        .query('SELECT Id FROM COA WHERE code = @code');

      if (duplicate.recordset.length > 0) {
        return res.status(400).json({ message: 'Account with this code already exists' });
      }
    }

    const nextIdResult = await pool.request().query('SELECT ISNULL(MAX(Id), 0) + 1 AS nextId FROM COA');
    const nextId = nextIdResult.recordset[0].nextId;

    if (!fields.code || fields.code.trim() === '') {
      fields.code = String(nextId);
    }

    await pool
      .request()
      .input('id', sql.Int, nextId)
      .input('date', sql.DateTime, new Date())
      .input('acType', sql.Int, fields.ACType)
      .input('subsidary', sql.NVarChar, fields.Subsidary)
      .input('code', sql.NVarChar, fields.code)
      .input('urduName', sql.NVarChar, fields.UrduName)
      .input('ledgerNo', sql.NVarChar, fields.ledgerno)
      .input('discount', sql.Float, fields.discount)
      .input('creditLimit', sql.Float, fields.creditlimit)
      .input('creditDays', sql.Int, fields.creditdays)
      .input('priceList', sql.NVarChar, fields.pricelist)
      .input('contactPerson', sql.NVarChar, fields.ContactPerson)
      .input('oPhone', sql.NVarChar, fields.OPhone)
      .input('oCell', sql.NVarChar, fields.OCell)
      .input('oAddress', sql.NVarChar, fields.OAddress)
      .input('area', sql.NVarChar, fields.Area)
      .input('city', sql.NVarChar, fields.City)
      .input('email', sql.NVarChar, fields.EMail)
      .input('balance', sql.Float, fields.Balance)
      .input('balanceDate', sql.DateTime, fields.Balance_Date)
      .input('status', sql.NVarChar, fields.Status)
      .input('isActive', sql.Int, fields.isactive)
      .query(`
        INSERT INTO COA (
          Id, Date, ACType, Subsidary, code, UrduName, ledgerno, discount,
          creditlimit, creditdays, pricelist, ContactPerson, OPhone, OCell,
          OAddress, Area, City, EMail, Balance, Balance_Date, Status, isactive
        ) VALUES (
          @id, @date, @acType, @subsidary, @code, @urduName, @ledgerNo, @discount,
          @creditLimit, @creditDays, @priceList, @contactPerson, @oPhone, @oCell,
          @oAddress, @area, @city, @email, @balance, @balanceDate, @status, @isActive
        )
      `);

    const account = await fetchCoaAccountById(nextId);
    res.status(201).json(account);
  } catch (err) {
    console.error('Error creating account:', err);
    res.status(500).json({ message: 'Server error creating account' });
  }
};

exports.updateAccount = async (req, res) => {
  try {
    const pool = await connectDB();
    const id = Number(req.params.id);
    const existing = await fetchCoaAccountById(id);
    if (!existing) return res.status(404).json({ message: 'Account not found' });

    const fields = mapAccountBodyToCoa(req.body);

    await pool
      .request()
      .input('id', sql.Int, id)
      .input('acType', sql.Int, fields.ACType)
      .input('subsidary', sql.NVarChar, fields.Subsidary)
      .input('code', sql.NVarChar, fields.code)
      .input('urduName', sql.NVarChar, fields.UrduName)
      .input('ledgerNo', sql.NVarChar, fields.ledgerno)
      .input('discount', sql.Float, fields.discount)
      .input('creditLimit', sql.Float, fields.creditlimit)
      .input('creditDays', sql.Int, fields.creditdays)
      .input('priceList', sql.NVarChar, fields.pricelist)
      .input('contactPerson', sql.NVarChar, fields.ContactPerson)
      .input('oPhone', sql.NVarChar, fields.OPhone)
      .input('oCell', sql.NVarChar, fields.OCell)
      .input('oAddress', sql.NVarChar, fields.OAddress)
      .input('area', sql.NVarChar, fields.Area)
      .input('city', sql.NVarChar, fields.City)
      .input('email', sql.NVarChar, fields.EMail)
      .input('balance', sql.Float, fields.Balance)
      .input('balanceDate', sql.DateTime, fields.Balance_Date)
      .input('status', sql.NVarChar, fields.Status)
      .input('isActive', sql.Int, fields.isactive)
      .query(`
        UPDATE COA SET
          ACType = @acType,
          Subsidary = @subsidary,
          code = @code,
          UrduName = @urduName,
          ledgerno = @ledgerNo,
          discount = @discount,
          creditlimit = @creditLimit,
          creditdays = @creditDays,
          pricelist = @priceList,
          ContactPerson = @contactPerson,
          OPhone = @oPhone,
          OCell = @oCell,
          OAddress = @oAddress,
          Area = @area,
          City = @city,
          EMail = @email,
          Balance = @balance,
          Balance_Date = @balanceDate,
          Status = @status,
          isactive = @isActive
        WHERE Id = @id
      `);

    const account = await fetchCoaAccountById(id);
    res.json(account);
  } catch (err) {
    console.error('Error updating account:', err);
    res.status(500).json({ message: 'Server error updating account' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const pool = await connectDB();
    const id = Number(req.params.id);
    const existing = await fetchCoaAccountById(id);
    if (!existing) return res.status(404).json({ message: 'Account not found' });

    await pool
      .request()
      .input('id', sql.Int, id)
      .query('UPDATE COA SET isactive = 0 WHERE Id = @id');

    res.json({ message: 'Account deleted' });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ message: 'Server error deleting account' });
  }
};

exports.searchAccounts = async (req, res) => {
  try {
    const accounts = await searchCoaAccounts(req.params.query);
    res.json(accounts);
  } catch (err) {
    console.error('Error searching accounts:', err);
    res.status(500).json({ message: 'Server error searching accounts' });
  }
};

exports.getAccountsByType = async (req, res) => {
  try {
    const accounts = await fetchCoaAccountsByType(req.params.type);
    res.json(accounts);
  } catch (err) {
    console.error('Error getting accounts by type:', err);
    res.status(500).json({ message: 'Server error getting accounts by type' });
  }
};
