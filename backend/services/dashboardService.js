const { connectDB, sql } = require('../config/mssqlconfig');

async function getPool() {
  return connectDB();
}

function sumByTypeTerm(rows, type, termMatch) {
  return rows
    .filter((r) => r.Type === type && termMatch(r.Term))
    .reduce((s, r) => s + (parseFloat(r.total) || 0), 0);
}

const isCash = (term) => (term || '').toLowerCase().includes('cash');
const isCredit = (term) => !isCash(term);

async function fetchDashboardData(activityDate) {
  const pool = await getPool();
  const dateVal = activityDate || new Date().toISOString().split('T')[0];
  const req = pool.request().input('activityDate', sql.Date, new Date(`${dateVal}T12:00:00`));

  const psRes = await req.query(`
    SELECT Type, LTRIM(RTRIM(ISNULL(Term, ''))) AS Term, SUM(ISNULL(Amount, 0)) AS total
    FROM PSDetail WITH (NOLOCK)
    WHERE CAST(Date AS DATE) = @activityDate
      AND Type IN ('Purchase', 'Purchase Return', 'Sale', 'Sale Return')
    GROUP BY Type, LTRIM(RTRIM(ISNULL(Term, '')))
  `);

  const psRows = psRes.recordset;
  const cashPurchase = sumByTypeTerm(psRows, 'Purchase', isCash);
  const creditPurchase = sumByTypeTerm(psRows, 'Purchase', isCredit);
  const purchaseReturn = sumByTypeTerm(psRows, 'Purchase Return', () => true);
  const totalPurchase = cashPurchase + creditPurchase;
  const netPurchase = totalPurchase - purchaseReturn;

  const cashSale = sumByTypeTerm(psRows, 'Sale', isCash);
  const creditSale = sumByTypeTerm(psRows, 'Sale', isCredit);
  const saleReturn = sumByTypeTerm(psRows, 'Sale Return', () => true);
  const totalSale = cashSale + creditSale;
  const netSale = totalSale - saleReturn;

  const cashAcctRes = await pool.request()
    .input('activityDate', sql.Date, new Date(`${dateVal}T12:00:00`))
    .query(`
      SELECT
        ISNULL(SUM(CASE WHEN CAST(l.Date AS DATE) < @activityDate THEN ISNULL(l.Debit, 0) - ISNULL(l.Credit, 0) ELSE 0 END), 0) AS openingCash,
        ISNULL(SUM(CASE WHEN CAST(l.Date AS DATE) = @activityDate THEN ISNULL(l.Debit, 0) ELSE 0 END), 0) AS cashReceived,
        ISNULL(SUM(CASE WHEN CAST(l.Date AS DATE) = @activityDate THEN ISNULL(l.Credit, 0) ELSE 0 END), 0) AS cashPaid
      FROM Ledgers l WITH (NOLOCK)
      WHERE l.Acid = 1
    `);

  const cashRow = cashAcctRes.recordset[0] || {};
  const openingCash = parseFloat(cashRow.openingCash) || 0;
  const cashReceived = parseFloat(cashRow.cashReceived) || 0;
  const cashPaid = parseFloat(cashRow.cashPaid) || 0;
  const otherIncomes = 0;
  const expenses = 0;
  const closingCash = openingCash + cashReceived - cashPaid;

  const bankRes = await pool.request()
    .input('activityDate', sql.Date, new Date(`${dateVal}T12:00:00`))
    .query(`
      SELECT
        ISNULL(SUM(CASE WHEN CAST(l.Date AS DATE) < @activityDate THEN ISNULL(l.Debit, 0) - ISNULL(l.Credit, 0) ELSE 0 END), 0) AS openingBank,
        ISNULL(SUM(CASE WHEN CAST(l.Date AS DATE) = @activityDate THEN ISNULL(l.Debit, 0) ELSE 0 END), 0) AS bankReceived,
        ISNULL(SUM(CASE WHEN CAST(l.Date AS DATE) = @activityDate THEN ISNULL(l.Credit, 0) ELSE 0 END), 0) AS bankPaid
      FROM Ledgers l WITH (NOLOCK)
      INNER JOIN COA c WITH (NOLOCK) ON c.Id = l.Acid
      WHERE UPPER(c.Subsidary) LIKE '%BANK%'
    `);

  const bankRow = bankRes.recordset[0] || {};
  const openingBank = parseFloat(bankRow.openingBank) || 0;
  const bankReceived = parseFloat(bankRow.bankReceived) || 0;
  const bankPaid = parseFloat(bankRow.bankPaid) || 0;
  const closingBank = openingBank + bankReceived - bankPaid;

  const stockRes = await pool.request().query(`
    SELECT
      SUM(CASE WHEN ISNULL(t.os, pr.OQty) <= ISNULL(pr.ReOrder, 0) AND ISNULL(t.os, pr.OQty) > 0 THEN 1 ELSE 0 END) AS shortProducts,
      SUM(CASE WHEN ISNULL(t.os, pr.OQty) <= 0 THEN 1 ELSE 0 END) AS zeroStock,
      ISNULL(SUM(ISNULL(t.os, pr.OQty) * ISNULL(pr.PurchaseRate, 0)), 0) AS stockValue
    FROM Products pr WITH (NOLOCK)
    LEFT JOIN tempstock t WITH (NOLOCK) ON pr.ID = t.PRID
    WHERE pr.isactive IS NULL OR pr.isactive = 1
  `);

  const stockRow = stockRes.recordset[0] || {};

  const pendingRes = await pool.request().query(`
    SELECT
      (SELECT COUNT(DISTINCT Doc) FROM PSDetail WITH (NOLOCK) WHERE Type = 'Sale Order') AS pendingSaleOrders,
      (SELECT COUNT(DISTINCT Doc) FROM PSDetail WITH (NOLOCK) WHERE Type = 'Purchase Order') AS pendingPurchaseOrders
  `);

  const pendingRow = pendingRes.recordset[0] || {};

  const balanceRes = await pool.request().query(`
    SELECT
      c.Id,
      c.code,
      c.Subsidary AS name,
      c.ACType,
      ISNULL(SUM(ISNULL(l.Debit, 0) - ISNULL(l.Credit, 0)), 0) AS balance
    FROM COA c WITH (NOLOCK)
    LEFT JOIN Ledgers l WITH (NOLOCK) ON l.Acid = c.Id
    WHERE c.Subsidary IS NOT NULL AND LTRIM(RTRIM(c.Subsidary)) <> ''
    GROUP BY c.Id, c.code, c.Subsidary, c.ACType
  `);

  const balances = balanceRes.recordset;
  const findBalance = (predicate) => balances
    .filter(predicate)
    .reduce((s, r) => s + (parseFloat(r.balance) || 0), 0);

  const cashInHand = findBalance((r) => String(r.code) === '1' || (r.name || '').toUpperCase().includes('CASH IN HAND'));
  const cashAtBank = findBalance((r) => (r.name || '').toUpperCase().includes('BANK'));
  const accountReceivable = findBalance((r) => r.ACType === 5 && (parseFloat(r.balance) || 0) > 0);
  const accountPayable = Math.abs(findBalance((r) => r.ACType === 15 && (parseFloat(r.balance) || 0) < 0)
    + findBalance((r) => r.ACType === 15 && (parseFloat(r.balance) || 0) > 0));
  const stockInTrade = parseFloat(stockRow.stockValue) || 0;
  const taxation = findBalance((r) => (r.name || '').toUpperCase().includes('TAX'));
  const ownersEquity = findBalance((r) => (r.name || '').toUpperCase().includes('EQUITY')
    || (r.name || '').toUpperCase().includes('CAPITAL'));

  const totalReceivables = accountReceivable;
  const totalPayables = accountPayable;

  const assets = [
    { label: 'Cash in Hand', amount: cashInHand },
    { label: 'Cash at Bank', amount: cashAtBank },
    { label: 'Account Receivable', amount: accountReceivable },
    { label: 'Stock in Trade/Inventory', amount: stockInTrade },
    { label: 'Taxation', amount: taxation },
  ];
  const liabilities = [
    { label: 'Account Payable', amount: accountPayable },
    { label: 'Owner\'s Equity', amount: Math.abs(ownersEquity) },
  ];

  const totalAssets = assets.reduce((s, a) => s + a.amount, 0);
  const totalLiabilities = liabilities.reduce((s, a) => s + a.amount, 0);

  return {
    activityDate: dateVal,
    clock: new Date().toLocaleTimeString('en-US'),
    displayDate: new Date(`${dateVal}T12:00:00`).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: '2-digit',
    }),
    stock: {
      shortProducts: parseInt(stockRow.shortProducts, 10) || 0,
      zeroStock: parseInt(stockRow.zeroStock, 10) || 0,
      stockValue: parseFloat(stockRow.stockValue) || 0,
      pendingOrders: (parseInt(pendingRow.pendingSaleOrders, 10) || 0)
        + (parseInt(pendingRow.pendingPurchaseOrders, 10) || 0),
    },
    accounts: {
      muteAccounts: 0,
      receivablePendingCheques: 0,
      payablePendingCheques: 0,
      totalReceivables,
      totalPayables,
    },
    dailyActivity: {
      purchase: {
        cashPurchase,
        creditPurchase,
        totalPurchase,
        purchaseReturn,
        netPurchase,
      },
      sale: {
        cashSale,
        creditSale,
        totalSale,
        saleReturn,
        netSale,
      },
      cash: {
        openingCash,
        cashReceived,
        otherIncomes,
        cashPaid,
        expenses,
        closingCash,
      },
      bank: {
        openingBank,
        bankReceived,
        bankPaid,
        closingBank,
      },
    },
    financialPosition: {
      assets,
      liabilities,
      totalAssets,
      totalLiabilities,
    },
  };
}

module.exports = { fetchDashboardData };
