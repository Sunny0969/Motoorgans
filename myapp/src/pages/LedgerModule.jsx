import React from 'react';
import DataTablePage from '../components/modules/DataTablePage';

const ledgerTransform = (data) => data?.entries || [];

const formatMoney = (row, key) => {
  const val = row[key];
  if (val === null || val === undefined || val === '' || val === 0) return '—';
  return Number(val).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const columns = [
  { key: 'id', label: 'Id' },
  { key: 'accountId', label: 'Acid' },
  { key: 'accountName', label: 'Account' },
  { key: 'date', label: 'Date' },
  { key: 'docNo', label: 'Doc' },
  { key: 'type', label: 'Type' },
  { key: 'narration', label: 'Narration' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'cheque', label: 'Cheque' },
  { key: 'debit', label: 'Debit', align: 'end', render: (row) => formatMoney(row, 'debit') },
  { key: 'credit', label: 'Credit', align: 'end', render: (row) => formatMoney(row, 'credit') },
  { key: 'cellIn', label: 'Cell In', align: 'end', render: (row) => formatMoney(row, 'cellIn') },
  { key: 'cellOut', label: 'Cell Out', align: 'end', render: (row) => formatMoney(row, 'cellOut') },
  { key: 'crateIn', label: 'Crate In', align: 'end', render: (row) => formatMoney(row, 'crateIn') },
  { key: 'crateOut', label: 'Crate Out', align: 'end', render: (row) => formatMoney(row, 'crateOut') },
  { key: 'discount', label: 'Discount', align: 'end', render: (row) => formatMoney(row, 'discount') },
  { key: 'counter', label: 'Counter', align: 'end' },
  { key: 'remainingAmount', label: 'Remaining', align: 'end', render: (row) => formatMoney(row, 'remainingAmount') },
  { key: 'status', label: 'Status' },
  { key: 'dueDate', label: 'Due Date' },
];

const LedgerModule = () => (
  <DataTablePage
    title="Ledger"
    subtitle="dbo.Ledgers — all columns from TMSLatestNew"
    apiPath="/ledger"
    columns={columns}
    transformResponse={ledgerTransform}
    searchPlaceholder="Search narration, type, doc, account, invoice..."
  />
);

export default LedgerModule;
