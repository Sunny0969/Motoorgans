import React from 'react';
import DataTablePage from '../components/modules/DataTablePage';

const columns = [
  { key: 'Id', label: 'ID' },
  { key: 'customerName', label: 'Customer Name' },
  { key: 'contactPerson', label: 'Contact Person' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'phone', label: 'Phone' },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'area', label: 'Area' },
  { key: 'email', label: 'Email' },
  { key: 'acType', label: 'AC Type' },
  { key: 'date', label: 'Date' },
];

const CustomerDetails = () => (
  <DataTablePage
    title="Customer Details"
    subtitle="Live data from dbo.COA (TMSLatestNew)"
    apiPath="/customers"
    columns={columns}
    searchPlaceholder="Search by name, mobile, city, email..."
  />
);

export default CustomerDetails;
