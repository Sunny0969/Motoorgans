const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const AC_TYPE_TO_LABEL = {
  1: 'Assets',
  2: 'Intangible Assets',
  5: 'Debtors, Buyers, Customers, Clients',
  10: 'Cash & Bank',
  11: 'Capital / Share Holders',
  15: 'Creditors, Suppliers, Vendors',
  25: 'Wages, Salaries and Benefits',
  29: 'Expenses',
  31: 'Liabilities',
};

const LABEL_TO_AC_TYPE = {
  'Debtors, Buyers, Customers, Clients': 5,
  'Creditors, Suppliers, Vendors': 15,
  'Assets': 1,
  'Intangible Assets': 2,
  'Cash & Bank': 10,
  'Capital / Share Holders': 11,
  'Wages, Salaries and Benefits': 25,
  'Expenses': 29,
  'Liabilities': 31,
};

function formatDisplayDate(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${date.getDate()}-${MONTHS[date.getMonth()]}-${String(date.getFullYear()).slice(-2)}`;
}

function resolveSaleInvoiceNo(row) {
  const inv = row.invoice != null ? String(row.invoice).trim() : '';
  if (!inv || inv === '0') return String(row.Doc);
  return inv;
}

function buildAccountTitle(row) {
  if (row.Subsidary && row.Subsidary !== 'N/A') return row.Subsidary;
  return [row.Main, row.Control, row.Subsidary].filter(Boolean).join(' - ') || '';
}

function mapAcTypeToLabel(acType) {
  return AC_TYPE_TO_LABEL[acType] || `Account Type ${acType}`;
}

function mapCoaRowToAccount(row) {
  const accountId = String(row.Id);
  const balanceType =
    row.Status === 'Credit' ? 'Payable' : row.Status === 'Debit' ? 'Receivable' : 'Receivable';

  return {
    _id: accountId,
    accountId,
    code: row.code != null ? String(row.code) : '',
    accountTitle: buildAccountTitle(row),
    urduTitle: row.UrduName || '',
    accountType: mapAcTypeToLabel(row.ACType),
    ledgerNo: row.ledgerno || '',
    discountPercent: row.discount ?? 0,
    creditLimit: row.creditlimit ?? 0,
    creditDays: row.creditdays ?? 0,
    priceList: row.pricelist || 'Whole Sale',
    office: row.department || row.route || 'Home',
    contactPerson: row.ContactPerson || '',
    phoneNo: row.OPhone || '',
    cellNo: row.OCell || row.Cell || '',
    address: row.OAddress || '',
    area: row.Area || '',
    city: row.City || '',
    email: row.EMail || '',
    openingBalance: row.Balance ?? 0,
    balanceDate: formatDisplayDate(row.Balance_Date),
    balanceType,
    isActive: row.isactive === null || row.isactive === undefined ? true : Boolean(row.isactive),
    name: buildAccountTitle(row),
  };
}

function mapCoaRowToSupplier(row) {
  return {
    _id: String(row.Id),
    id: row.Id,
    code: row.code != null ? String(row.code) : String(row.Id),
    name: buildAccountTitle(row),
    address: row.OAddress || '',
    phone: row.OCell || row.OPhone || '',
    email: row.EMail || '',
    creditDays: row.creditdays ?? 0,
    balance: row.Balance ?? 0,
    isActive: row.isactive === null || row.isactive === undefined ? true : Boolean(row.isactive),
  };
}

function toInputDate(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

function mapProductRowToApi(row) {
  return {
    _id: String(row.ID),
    id: row.ID,
    code: row.code != null ? String(row.code) : String(row.ID),
    name: row.Name || '',
    urduName: row.UrduName || '',
    company: row.Company || '',
    category: row.Category || '',
    category2: row.category2 || '',
    country: row.country || '',
    unit: row.Size || 'PCS',
    uom: row.Size || 'PCS',
    packing: row.Packing ?? 0,
    purchaseRate: row.PurchaseRate ?? 0,
    saleRate: row.SaleRate ?? 0,
    saleRate2: row.SaleRate2 ?? 0,
    saleRate3: row.SaleRate3 ?? 0,
    saleRate4: row.SaleRate4 ?? 0,
    openingQty: row.OQty ?? 0,
    batch: row.Batch || '',
    openingDate: formatDisplayDate(row.ODate),
    openingDateInput: toInputDate(row.ODate),
    schRate: row.SchRate ?? 0,
    schPc: row.SchPc ?? 0,
    price: row.SaleRate ?? row.PurchaseRate ?? 0,
    cost: row.PurchaseRate ?? 0,
    stock: row.OQty ?? 0,
    location: row.location || '',
    reorderLevel: row.ReOrder ?? 0,
    discount: row.discount ?? 0,
    openingCost: row.openingrate ?? row.PurchaseRate ?? 0,
    isActive: row.isactive === null || row.isactive === undefined ? true : Boolean(row.isactive),
  };
}

function mapProductBodyToDb(body) {
  let oDate = new Date();
  if (body.openingDate) {
    const parsed = Date.parse(body.openingDate);
    if (!Number.isNaN(parsed)) oDate = new Date(parsed);
  }

  return {
    Company: (body.company || '').trim(),
    Category: (body.category || '').trim(),
    category2: (body.category2 || '').trim(),
    country: (body.country || '').trim(),
    Name: (body.name || '').trim(),
    UrduName: (body.urduName || '').trim(),
    Size: (body.unit || body.uom || 'PCS').trim() || 'PCS',
    Packing: Number(body.packing) || 0,
    PurchaseRate: Number(body.purchaseRate) || 0,
    SaleRate: Number(body.saleRate) || 0,
    SaleRate2: Number(body.saleRate2) || 0,
    SaleRate3: Number(body.saleRate3) || 0,
    SaleRate4: Number(body.saleRate4) || 0,
    OQty: Number(body.openingQty) || 0,
    Batch: body.batch || '',
    ODate: oDate,
    code: body.code != null ? String(body.code).trim() : '',
    SchRate: Number(body.schRate) || 0,
    SchPc: Number(body.schPc) || 0,
    ReOrder: Number(body.reorderLevel) || 0,
    discount: Number(body.discount) || 0,
    location: body.location || '',
    openingrate: Number(body.openingCost) || Number(body.purchaseRate) || 0,
    isactive:
      body.isActive === false || body.isActive === 'false' || body.isActive === 0 ? 0 : 1,
  };
}

function mapPurchaseHeader(row, supplier) {
  const supplierCode = supplier?.code || '';
  const supplierName = supplier?.name || '';
  const supplierLabel =
    supplierCode && supplierName ? `${supplierCode} - ${supplierName}` : supplierName || supplierCode;

  return {
    _id: String(row.Doc),
    id: row.Doc,
    invoiceNo: row.invoice != null ? String(row.invoice) : String(row.Doc),
    date: formatDisplayDate(row.Date),
    paymentType: row.Term === 'Credit' ? 'Credit' : 'Cash',
    supplier: supplierLabel,
    supplierId: row.Acid != null ? row.Acid : null,
    supplierCode,
    supplierName,
    creditDays: row.CreditDays != null ? String(row.CreditDays) : '',
    dueDate: formatDisplayDate(row.DueDate),
    previousBalance: row.PBalance ?? '',
    cashPaid: row.Received ?? '',
    discPercentFooter: row.Discount ?? '',
    extraDiscount: row.ExtraDiscount ?? 0,
    transporter: row.goods || '',
    builtyNo: row.builty || '',
    description: row.Description || '',
    sendSMS: false,
    printPreBalance: false,
    totalPcsFooter: 0,
    netAmountFooter: row.Amount ?? 0,
    billAmount: row.Amount ?? 0,
    netPayable: row.Amount ?? 0,
    products: [],
  };
}

function mapPurchaseLineRow(row) {
  const qty = parseFloat(row.Qty) || 0;
  const rate = parseFloat(row.Rate) || 0;
  const amount = parseFloat(row.VEST) || qty * rate;
  const discount = parseFloat(row.Discount) || 0;
  const net = parseFloat(row.VIST) || amount - discount;

  return {
    productId: row.Prid != null ? row.Prid : null,
    productCode: row.productCode != null ? String(row.productCode) : String(row.Prid),
    productName: row.productName || `Product ${row.Prid}`,
    remarks: row.comments || row.remarks || '',
    location: row.locationName || '',
    packing: row.Packet != null ? String(row.Packet) : '',
    pcs: qty,
    rate,
    amount: amount.toFixed(2),
    discPercent: row.DiscP != null ? String(row.DiscP) : '',
    discount: discount.toFixed(2),
    net: net.toFixed(2),
    uom: row.uom || 'PCS',
    builty: '',
  };
}

function parseBalanceDate(dateStr) {
  if (!dateStr) return new Date();
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  const parts = dateStr.match(/(\d+)-(\w+)-(\d+)/);
  if (parts) {
    const day = parseInt(parts[1]);
    const monthIdx = MONTHS.findIndex(m => m.toLowerCase() === parts[2].toLowerCase());
    let year = parseInt(parts[3]);
    if (year < 100) year += 2000;
    if (monthIdx >= 0) return new Date(year, monthIdx, day);
  }
  return new Date();
}

function mapAccountBodyToCoa(body) {
  const balanceType = body.balanceType === 'Payable' ? 'Credit' : 'Debit';
  return {
    Subsidary: body.accountTitle,
    UrduName: body.urduTitle || '',
    code: body.code || '',
    ACType: LABEL_TO_AC_TYPE[body.accountType] ?? 5,
    ledgerno: body.ledgerNo || '',
    discount: Number(body.discountPercent) || 0,
    creditlimit: Number(body.creditLimit) || 0,
    creditdays: Number(body.creditDays) || 0,
    pricelist: body.priceList || 'Whole Sale',
    ContactPerson: body.contactPerson || '',
    OPhone: body.phoneNo || '',
    OCell: body.cellNo || '',
    OAddress: body.address || '',
    Area: body.area || '',
    City: body.city || '',
    EMail: body.email || '',
    Balance: Number(body.openingBalance) || 0,
    Balance_Date: parseBalanceDate(body.balanceDate),
    Status: balanceType,
    isactive: body.isActive === false || body.isActive === 'false' ? 0 : 1,
  };
}

function mapCoaRowToCustomer(row) {
  const name = buildAccountTitle(row);
  return {
    _id: String(row.Id),
    id: row.Id,
    code: row.code != null ? String(row.code) : String(row.Id),
    name,
    customerName: name,
    urduName: row.UrduName || '',
    contactPerson: row.ContactPerson || '',
    phone: row.OCell || row.OPhone || '',
    phoneNo: row.OPhone || '',
    cellNo: row.OCell || '',
    address: row.OAddress || '',
    area: row.Area || '',
    city: row.City || '',
    email: row.EMail || '',
    creditLimit: row.creditlimit ?? 0,
    creditDays: row.creditdays ?? 0,
    discount: row.discount ?? 0,
    priceList: row.pricelist || 'Whole Sale',
    balance: row.Balance ?? 0,
    balanceType: row.Status === 'Credit' ? 'Payable' : 'Receivable',
    balanceDate: formatDisplayDate(row.Balance_Date),
    isActive: row.isactive === null || row.isactive === undefined ? true : Boolean(row.isactive),
  };
}

function mapProductRowToItem(row) {
  const base = mapProductRowToApi(row);
  return {
    ...base,
    productId: String(row.ID),
    country: row.country || '',
    company: row.Company || '',
    category: row.Category || '',
    category2: row.category2 || '',
    description: row.Name || '',
    fullDesc: [row.Name, row.Category, row.Company].filter(Boolean).join(' '),
    descUrdu: row.UrduName || '',
    costUnit: row.PurchaseRate ?? 0,
    uom: row.Size || 'PCS',
    wSale: row.SaleRate ?? 0,
    retail: row.SaleRate2 ?? 0,
    supply: row.SaleRate3 ?? 0,
    cash: row.SaleRate4 ?? 0,
    packing: row.Packing ?? 0,
    disc: row.discount ?? 0,
    minLevel: row.Min ?? 0,
    openingQty: row.OQty ?? 0,
    date: formatDisplayDate(row.ODate),
    oCost: row.openingrate ?? row.PurchaseRate ?? 0,
    location: row.location || '',
    reorderQty: row.ReOrder ?? 0,
    batch: row.Batch || '',
    isActive: row.isactive === null || row.isactive === undefined ? true : Boolean(row.isactive),
  };
}

function mapStockRow(row) {
  const opening = parseFloat(row.OQty) || 0;
  const onHand = row.os != null ? parseFloat(row.os) : opening;
  return {
    _id: String(row.ID),
    id: row.ID,
    productId: row.ID,
    code: row.code != null ? String(row.code) : String(row.ID),
    name: row.Name || '',
    company: row.Company || '',
    category: row.Category || '',
    uom: row.Size || 'PCS',
    openingStock: opening,
    onHandQty: onHand,
    purchaseQty: row.purchase ?? 0,
    purchaseReturnQty: row.purchasereturn ?? 0,
    saleQty: row.sale ?? 0,
    saleReturnQty: row.salereturn ?? 0,
    purchaseRate: row.PurchaseRate ?? 0,
    saleRate: row.SaleRate ?? 0,
    location: row.location || '',
    reorderLevel: row.ReOrder ?? 0,
    status: onHand <= (row.ReOrder ?? 0) ? 'Low Stock' : 'In Stock',
  };
}

function mapProductHistoryRow(row) {
  const qtyIn = row.Type2 === 'In' ? parseFloat(row.Qty) || 0 : 0;
  const qtyOut = row.Type2 === 'Out' ? parseFloat(row.Qty) || 0 : 0;
  return {
    _id: String(row.ID),
    id: row.ID,
    date: formatDisplayDate(row.Date),
    docNo: row.Doc,
    transactionType: row.Type || '',
    movementType: row.Type2 || '',
    productId: row.Prid,
    productCode: row.productCode != null ? String(row.productCode) : String(row.Prid),
    productName: row.productName || '',
    partyId: row.Acid,
    partyName: row.partyName || '',
    qty: parseFloat(row.Qty) || 0,
    qtyIn,
    qtyOut,
    rate: row.Rate ?? 0,
    amount: row.VEST ?? 0,
    discount: row.Discount ?? 0,
    netAmount: row.VIST ?? 0,
    remarks: row.comments || row.remarks || '',
  };
}

function mapLedgerRow(row) {
  return {
    _id: String(row.Id),
    id: row.Id,
    date: formatDisplayDate(row.Date),
    accountId: row.Acid,
    accountCode: row.accountCode != null ? String(row.accountCode) : '',
    accountName: row.accountName || '',
    docNo: row.Doc,
    type: row.Type || '',
    narration: row.Narration || '',
    invoice: row.Invoice,
    cheque: row.Cheque || '',
    debit: row.Debit ?? 0,
    credit: row.Credit ?? 0,
    balance: row.remainingamount ?? 0,
    dueDate: formatDisplayDate(row.duedate),
    status: row.status,
  };
}

function mapSaleHeader(row, customer = null) {
  const customerCode = customer?.code || '';
  const customerName = customer?.name || '';
  const customerLabel =
    customerCode && customerName ? `${customerCode} - ${customerName}` : customerName || customerCode;

  return {
    _id: String(row.Doc),
    id: row.Doc,
    customerId: row.Acid != null ? String(row.Acid) : '',
    invoiceNumber: resolveSaleInvoiceNo(row),
    invoiceNo: resolveSaleInvoiceNo(row),
    date: formatDisplayDate(row.Date),
    paymentType: row.Term === 'Credit' ? 'Credit' : 'Cash',
    selectBuyer: customer?.id != null ? String(customer.id) : '',
    customer: customerLabel,
    customerCode,
    customerName,
    creditDays: row.CreditDays != null ? String(row.CreditDays) : '',
    crDays: row.CreditDays != null ? String(row.CreditDays) : '',
    dueDate: formatDisplayDate(row.DueDate),
    previousBalance: row.PBalance ?? '',
    cashReceived: row.Received ?? '',
    discPercentFooter: row.Discount ?? '',
    extraDiscount: row.ExtraDiscount ?? 0,
    transporter: row.goods || '',
    builtyNo: row.builty || '',
    description: row.Description || '',
    billAmount: row.Amount ?? 0,
    netReceivable: row.Amount ?? 0,
    products: [],
  };
}

function mapSaleLineRow(row) {
  const qty = parseFloat(row.Qty) || 0;
  const rate = parseFloat(row.Rate) || 0;
  const amount = parseFloat(row.VEST) || qty * rate;
  const discount = parseFloat(row.Discount) || 0;
  const net = parseFloat(row.VIST) || amount - discount;

  return {
    sr: 0,
    productId: String(row.Prid),
    productCode: row.productCode != null ? String(row.productCode) : String(row.Prid),
    productName: row.productName || `Product ${row.Prid}`,
    urduName: row.urduName || row.UrduName || '',
    uom: row.uom || 'PCS',
    pcs: String(qty),
    rate: String(rate),
    amount: amount.toFixed(2),
    discPercent: row.DiscP != null ? String(row.DiscP) : '',
    discount: discount.toFixed(2),
    netAmount: net.toFixed(2),
    purchaseRate: row.purchaseRate != null ? String(row.purchaseRate) : (row.PurchaseRate != null ? String(row.PurchaseRate) : '0'),
    packingSize: row.packingSize != null && row.packingSize !== ''
      ? String(row.packingSize)
      : (row.Packing != null && row.Packing !== '' ? String(row.Packing) : ''),
    packQty: row.Packet != null ? String(row.Packet) : '',
    packing: row.Packet != null ? String(row.Packet) : '',
    availableStock: row.stock ?? 0,
    remarks: row.comments || '',
  };
}

module.exports = {
  formatDisplayDate,
  mapCoaRowToAccount,
  mapCoaRowToSupplier,
  mapCoaRowToCustomer,
  mapProductRowToApi,
  mapProductBodyToDb,
  mapProductRowToItem,
  mapStockRow,
  mapProductHistoryRow,
  mapLedgerRow,
  mapPurchaseHeader,
  mapPurchaseLineRow,
  mapSaleHeader,
  mapSaleLineRow,
  resolveSaleInvoiceNo,
  mapAccountBodyToCoa,
  SUPPLIER_AC_TYPE: 15,
  CUSTOMER_AC_TYPE: 5,
};
