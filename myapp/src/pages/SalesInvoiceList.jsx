import React from 'react';
import DataTablePage from '../components/modules/DataTablePage';

const columns = [
  { key: 'invoiceNumber', label: 'Invoice #' },
  { key: 'date', label: 'Date' },
  { key: 'customerName', label: 'Customer' },
  { key: 'itemCount', label: 'Items', align: 'end' },
  { key: 'totalQty', label: 'Total Qty', align: 'end' },
  { key: 'totalAmount', label: 'Amount', align: 'end' },
  { key: 'received', label: 'Received', align: 'end' },
  { key: 'status', label: 'Status' },
  { key: 'dueDate', label: 'Due Date' },
];

const SalesInvoiceList = () => (
  <DataTablePage
    title="Sales Invoices"
    subtitle="Sales from dbo.PSDetail (Type = Sale) — not dbo.SPO"
    apiPath="/sales-invoice"
    columns={columns}
    searchPlaceholder="Search invoice #, customer, doc..."
  />
);

export default SalesInvoiceList;
