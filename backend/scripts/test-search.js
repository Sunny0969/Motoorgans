require('dotenv').config();
const { searchSaleByInvoice, fetchLatestSale, fetchSaleByDoc } = require('../utils/mssqlRepository');

(async () => {
  try {
    const latest = await fetchLatestSale();
    console.log('fetchLatestSale invoice:', latest?.invoiceNo || latest?.invoiceNumber);
    console.log('fetchLatestSale doc:', latest?.id);
    console.log('products count:', latest?.products?.length);

    for (const inv of ['100002', '100001', '100000', '9812', '48-121', '0']) {
      const sale = await searchSaleByInvoice(inv);
      console.log(`search "${inv}":`, sale ? `found doc ${sale.id} inv ${sale.invoiceNo}` : 'NOT FOUND');
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
