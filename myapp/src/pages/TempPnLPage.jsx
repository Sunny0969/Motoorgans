import React from 'react';
import DataTablePage from '../components/modules/DataTablePage';

const transformResponse = (data) => data?.entries || [];

const TempPnLPage = () => (
  <DataTablePage
    title="Profit & Loss (Temp)"
    subtitle="dbo.TempPnL — TMSLatestNew"
    apiPath="/temp-pnl"
    dynamicColumns
    transformResponse={transformResponse}
    searchPlaceholder="Search head, description, head id..."
  />
);

export default TempPnLPage;
