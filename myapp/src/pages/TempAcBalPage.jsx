import React from 'react';
import DataTablePage from '../components/modules/DataTablePage';

const transformResponse = (data) => data?.entries || [];

const formatMoney = (row, key) => {
  const val = row[key];
  if (val === null || val === undefined || val === '' || val === 0) return '—';
  return Number(val).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const columns = [
  { key: 'accountId', label: 'Acid' },
  { key: 'accountCode', label: 'Code' },
  { key: 'accountName', label: 'Account' },
  { key: 'date', label: 'Date' },
  { key: 'doc', label: 'Doc' },
  { key: 'type', label: 'Type' },
  { key: 'debit', label: 'Debit', align: 'end', render: (row) => formatMoney(row, 'debit') },
  { key: 'dr', label: 'Dr', align: 'end', render: (row) => formatMoney(row, 'dr') },
  { key: 'credit', label: 'Credit', align: 'end', render: (row) => formatMoney(row, 'credit') },
  { key: 'balance', label: 'Balance', align: 'end', render: (row) => formatMoney(row, 'balance') },
];

const TempAcBalPage = () => (
  <DataTablePage
    title="Account Balance (Trial)"
    subtitle="dbo.temp_acbal — TMSLatestNew"
    apiPath="/temp-acbal"
    columns={columns}
    transformResponse={transformResponse}
    searchPlaceholder="Search account, type, doc, acid..."
  />
);

export default TempAcBalPage;
