import React from 'react';
import DataTablePage from '../components/modules/DataTablePage';

const psDetailTransform = (data) => data?.entries || data || [];

const formatMoney = (row, key) => {
  const val = row[key];
  if (val === null || val === undefined || val === '' || val === 0) return '—';
  return Number(val).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const columns = [
  { key: 'doc', label: 'Doc' },
  { key: 'date', label: 'Date' },
  { key: 'type', label: 'Type' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'accountId', label: 'Acid' },
  { key: 'partyName', label: 'Party / Account' },
  { key: 'doNumber', label: 'DO' },
  { key: 'poNumber', label: 'PO' },
  { key: 'dcNumber', label: 'DC' },
  { key: 'description', label: 'Description' },
  { key: 'amount', label: 'Amount', align: 'end', render: (row) => formatMoney(row, 'amount') },
  { key: 'received', label: 'Received', align: 'end', render: (row) => formatMoney(row, 'received') },
  { key: 'discount', label: 'Discount', align: 'end', render: (row) => formatMoney(row, 'discount') },
  { key: 'extraDiscount', label: 'Extra Disc', align: 'end', render: (row) => formatMoney(row, 'extraDiscount') },
  { key: 'freight', label: 'Freight', align: 'end', render: (row) => formatMoney(row, 'freight') },
  { key: 'previousBalance', label: 'P. Balance', align: 'end', render: (row) => formatMoney(row, 'previousBalance') },
  { key: 'term', label: 'Term' },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'creditDays', label: 'Credit Days', align: 'end' },
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'driver', label: 'Driver' },
  { key: 'goods', label: 'Goods' },
  { key: 'builty', label: 'Builty' },
];

const PSDetailPage = () => (
  <DataTablePage
    title="Purchase / Sale Detail (PSDetail)"
    subtitle="dbo.PSDetail — Sale & Purchase transactions from TMSLatestNew"
    apiPath="/ps-detail"
    columns={columns}
    transformResponse={psDetailTransform}
    searchPlaceholder="Search doc, type, party, invoice, description..."
  />
);

export default PSDetailPage;
