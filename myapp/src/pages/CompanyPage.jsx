import React from 'react';
import DataTablePage from '../components/modules/DataTablePage';

const transformResponse = (data) => data?.entries || [];

const CompanyPage = () => (
  <DataTablePage
    title="Companies"
    subtitle="dbo.Company — TMSLatestNew"
    apiPath="/companies"
    dynamicColumns
    transformResponse={transformResponse}
    searchPlaceholder="Search company name, id, color..."
  />
);

export default CompanyPage;
