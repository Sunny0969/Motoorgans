import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';

const defaultTransformResponse = (data) =>
  Array.isArray(data) ? data : data?.entries || [];

const formatCell = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') return Number.isInteger(value) ? value : value.toFixed(2);
  return value;
};

const buildDynamicColumns = (apiColumns = []) =>
  apiColumns.map((col) => ({
    key: col.key,
    label: col.label || col.key,
    align: col.align || (col.type === 'number' ? 'end' : undefined),
  }));

const DataTablePage = ({
  title,
  subtitle,
  apiPath,
  columns: staticColumns = [],
  dynamicColumns = false,
  searchPlaceholder = 'Search records...',
  transformResponse = defaultTransformResponse,
}) => {
  const [rows, setRows] = useState([]);
  const [tableColumns, setTableColumns] = useState(staticColumns);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [summary, setSummary] = useState(null);

  const loadData = useCallback(async (searchTerm = '') => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(apiPath, {
        params: searchTerm ? { search: searchTerm } : {},
      });
      const data = response.data;
      if (dynamicColumns && data?.columns?.length) {
        setTableColumns(buildDynamicColumns(data.columns));
      } else if (!dynamicColumns) {
        setTableColumns(staticColumns);
      }
      if (data?.summary) {
        setSummary(data.summary);
        setRows(transformResponse(data));
      } else {
        setSummary(null);
        setRows(transformResponse(data));
      }
    } catch (err) {
      let msg = err.response?.data?.message || err.message || 'Request failed';
      if (err.response?.status === 404) {
        msg =
          'API route not found. Stop the backend terminal (Ctrl+C), run "npm start" in the backend folder, then refresh this page.';
      }
      setError(msg);
      setRows([]);
      setSummary(null);
      console.error(`${apiPath} error:`, err);
    } finally {
      setLoading(false);
    }
  }, [apiPath, transformResponse, dynamicColumns, staticColumns]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadData(search.trim());
  };

  return (
    <div className="container-fluid py-4" style={{ maxWidth: '100%' }}>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div>
          <h2 className="h4 mb-1 text-primary fw-bold">{title}</h2>
          {subtitle && <p className="text-muted mb-0 small">{subtitle}</p>}
        </div>
        <span className="badge bg-secondary">{rows.length} records</span>
      </div>

      <form className="row g-2 mb-3" onSubmit={handleSearch}>
        <div className="col-md-8 col-lg-6">
          <input
            type="text"
            className="form-control"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-auto">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            Search
          </button>
        </div>
        <div className="col-auto">
          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={loading}
            onClick={() => {
              setSearch('');
              loadData('');
            }}
          >
            Reset
          </button>
        </div>
      </form>

      {loading && (
        <div className="d-flex align-items-center gap-2 p-4 bg-light border rounded mb-3">
          <div className="spinner-border spinner-border-sm text-primary" role="status" />
          <span>Loading data from database...</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          <strong>Failed to load data.</strong> {error}
          <div className="small mt-1">API: {apiPath}</div>
        </div>
      )}

      {!loading && !error && summary && (
        <div className="row g-2 mb-3">
          {summary.totalDebit != null && (
            <div className="col-auto">
              <span className="badge bg-light text-dark border">
                Total Debit: {formatCell(summary.totalDebit)}
              </span>
            </div>
          )}
          {summary.totalCredit != null && (
            <div className="col-auto">
              <span className="badge bg-light text-dark border">
                Total Credit: {formatCell(summary.totalCredit)}
              </span>
            </div>
          )}
          {summary.totalIn != null && (
            <div className="col-auto">
              <span className="badge bg-light text-dark border">
                Total In: {formatCell(summary.totalIn)}
              </span>
            </div>
          )}
          {summary.totalOut != null && (
            <div className="col-auto">
              <span className="badge bg-light text-dark border">
                Total Out: {formatCell(summary.totalOut)}
              </span>
            </div>
          )}
          {summary.closingBalance != null && (
            <div className="col-auto">
              <span className="badge bg-light text-dark border">
                Balance: {formatCell(summary.closingBalance)}
              </span>
            </div>
          )}
          {summary.totalValue != null && (
            <div className="col-auto">
              <span className="badge bg-light text-dark border">
                Total Value: {formatCell(summary.totalValue)}
              </span>
            </div>
          )}
          {summary.netProfit != null && (
            <div className="col-auto">
              <span className="badge bg-light text-dark border">
                Net Profit: {formatCell(summary.netProfit)}
              </span>
            </div>
          )}
        </div>
      )}

      {!loading && !error && (
        <div className="table-responsive border rounded shadow-sm bg-white" style={{ maxHeight: '70vh' }}>
          <table className="table table-sm table-hover table-striped mb-0 align-middle">
            <thead className="table-dark sticky-top">
              <tr>
                <th className="text-center" style={{ width: 50 }}>#</th>
                {tableColumns.map((col) => (
                  <th key={col.key} className={col.align === 'end' ? 'text-end' : ''}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={tableColumns.length + 1} className="text-center text-muted py-5">
                    No records found.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={row.id ?? row.productId ?? index}>
                    <td className="text-center text-muted">{index + 1}</td>
                    {tableColumns.map((col) => (
                      <td
                        key={col.key}
                        className={col.align === 'end' ? 'text-end' : ''}
                      >
                        {col.render ? col.render(row) : formatCell(row[col.key])}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DataTablePage;

