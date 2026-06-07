import React from 'react';
import DataTablePage from '../components/modules/DataTablePage';

const transformResponse = (data) => data?.entries || [];

const StockModule = () => (
  <DataTablePage
    title="Stock (Temp)"
    subtitle="dbo.Temp_Stock — empty columns hidden automatically"
    apiPath="/temp-stock"
    dynamicColumns
    transformResponse={transformResponse}
    searchPlaceholder="Search product, narration, doc, party..."
  />
);

export default StockModule;
