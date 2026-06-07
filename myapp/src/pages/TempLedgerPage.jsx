import React from 'react';
import DataTablePage from '../components/modules/DataTablePage';

const transformResponse = (data) => data?.entries || [];

const formatMoney = (row, key) => {
  const val = row[key];
  if (val === null || val === undefined || val === '') return '—';
  if (val === 0) return '0';
  return Number(val).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const formatText = (row, key) => {
  const val = row[key];
  if (val === null || val === undefined || val === '') return '—';
  return val;
};

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'accountId', label: 'Acid' },
  { key: 'accountCode', label: 'Code' },
  { key: 'accountName', label: 'Account' },
  { key: 'date', label: 'Date' },
  { key: 'doc', label: 'Doc' },
  { key: 'type', label: 'Type' },
  { key: 'narration', label: 'Narration' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'debit', label: 'Debit', align: 'end', render: (row) => formatMoney(row, 'debit') },
  { key: 'credit', label: 'Credit', align: 'end', render: (row) => formatMoney(row, 'credit') },
  { key: 'balance', label: 'Balance', align: 'end', render: (row) => formatMoney(row, 'balance') },
  { key: 'status', label: 'Status' },
  { key: 'cellIn', label: 'Cell In', align: 'end', render: (row) => formatMoney(row, 'cellIn') },
  { key: 'cellOut', label: 'Cell Out', align: 'end', render: (row) => formatMoney(row, 'cellOut') },
  { key: 'crateIn', label: 'Crate In', align: 'end', render: (row) => formatMoney(row, 'crateIn') },
  { key: 'crateOut', label: 'Crate Out', align: 'end', render: (row) => formatMoney(row, 'crateOut') },
  { key: 'bf', label: 'BF', align: 'end', render: (row) => formatMoney(row, 'bf') },
  { key: 'dr', label: 'Dr', align: 'end', render: (row) => formatMoney(row, 'dr') },
  { key: 'cr', label: 'Cr', align: 'end', render: (row) => formatMoney(row, 'cr') },
  { key: 'product', label: 'Product' },
  { key: 'qty', label: 'Qty', align: 'end', render: (row) => formatMoney(row, 'qty') },
  { key: 'rate', label: 'Rate', align: 'end', render: (row) => formatMoney(row, 'rate') },
  { key: 'amount', label: 'Amount', align: 'end', render: (row) => formatMoney(row, 'amount') },
  { key: 'transporter', label: 'Transporter' },
  { key: 'builty', label: 'Builty' },
  { key: 'isTele', label: 'Is Tele', render: (row) => formatText(row, 'isTele') },
];

const TempLedgerPage = () => (
  <DataTablePage
    title="General Ledger (Temp)"
    subtitle="dbo.Temp_Ledger — all columns from TMSLatestNew"
    apiPath="/temp-ledger"
    columns={columns}
    transformResponse={transformResponse}
    searchPlaceholder="Search narration, type, doc, account, invoice, product..."
  />
);

export default TempLedgerPage;
