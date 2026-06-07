import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../utils/api';
import { vbColorToHex, hexToVbColor, companyKey, companyColorStyle, textColorForBg } from '../utils/companyColor';

const todayInput = () => new Date().toISOString().split('T')[0];

const initialFormData = {
  id: '',
  code: '',
  country: '',
  company: '',
  companyColorHex: '#ffffff',
  category: '',
  category2: '',
  name: '',
  urduName: '',
  unit: 'PCS',
  packing: '0',
  purchaseRate: '0',
  saleRate: '0',
  saleRate2: '0',
  saleRate3: '0',
  saleRate4: '0',
  discount: '0',
  reorderLevel: '0',
  schRate: '0',
  schPc: '0',
  openingQty: '0',
  openingDate: todayInput(),
  openingCost: '0',
  batch: '',
  location: '',
  isActive: true,
};

const UOM_OPTIONS = ['PCS', 'SET', 'KG', 'PAIR', 'DOZ', 'BOX', 'LTR', 'MTR'];

const styles = {
  container: { fontFamily: 'Segoe UI, Tahoma, sans-serif', backgroundColor: '#f0f0f0', minHeight: 'calc(100vh - 80px)' },
  header: {
    backgroundColor: '#2d5016', color: '#fff', padding: '14px 24px', fontSize: '26px',
    fontWeight: 'bold', textAlign: 'center', borderBottom: '3px solid #1a3009',
  },
  panel: { backgroundColor: '#fff', border: '2px solid #999', margin: '10px', padding: '12px' },
  sectionTitle: { fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#333' },
  label: { fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '2px' },
  input: { width: '100%', padding: '4px 6px', border: '1px solid #999', fontSize: '12px', boxSizing: 'border-box' },
  btn: {
    padding: '6px 14px', border: '1px solid #666', backgroundColor: '#e8e8e8',
    cursor: 'pointer', fontSize: '12px', marginRight: '6px',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '11px' },
  th: { border: '1px solid #999', padding: '4px', backgroundColor: '#d0d0d0', textAlign: 'left' },
  td: { border: '1px solid #999', padding: '4px' },
};

function ProductsPage() {
  const [formData, setFormData] = useState(initialFormData);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [companyRecords, setCompanyRecords] = useState([]);

  const loadCompanyColors = useCallback(async () => {
    try {
      const res = await api.get('/companies', { params: { limit: 5000 } });
      setCompanyRecords(Array.isArray(res.data?.entries) ? res.data.entries : []);
    } catch {
      setCompanyRecords([]);
    }
  }, []);

  const companyColorMap = useMemo(() => {
    const map = {};
    companyRecords.forEach((c) => {
      const key = companyKey(c.name);
      if (key) map[key] = c.color;
    });
    return map;
  }, [companyRecords]);

  const getCompanyColorHex = useCallback((companyName) => {
    const vb = companyColorMap[companyKey(companyName)];
    return vb != null ? vbColorToHex(vb) : '#ffffff';
  }, [companyColorMap]);

  const loadProducts = useCallback(async (searchTerm = '') => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/products', {
        params: { all: '1', limit: 10000, search: searchTerm || undefined },
      });
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadNextId = useCallback(async () => {
    try {
      const res = await api.get('/products/next-id');
      setFormData((prev) => ({
        ...initialFormData,
        id: String(res.data.nextId),
        code: res.data.suggestedCode || String(res.data.nextId),
        openingDate: todayInput(),
      }));
      setSelectedId(null);
    } catch {
      setFormData({ ...initialFormData, openingDate: todayInput() });
      setSelectedId(null);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadNextId();
    loadCompanyColors();
  }, [loadProducts, loadNextId, loadCompanyColors]);

  const companies = useMemo(() => {
    const names = new Set([
      ...companyRecords.map((c) => (c.name || '').trim()).filter(Boolean),
      ...products.map((p) => (p.company || '').trim()).filter(Boolean),
    ]);
    return [...names].sort();
  }, [products, companyRecords]);
  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(),
    [products],
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'company') {
      const colorHex = getCompanyColorHex(value);
      setFormData((prev) => ({
        ...prev,
        company: value,
        companyColorHex: companyColorMap[companyKey(value)] != null ? colorHex : prev.companyColorHex,
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const applyProductToForm = useCallback((p) => {
    setFormData({
      id: String(p.id || p._id || ''),
      code: p.code || '',
      country: p.country || '',
      company: p.company || '',
      companyColorHex: getCompanyColorHex(p.company),
      category: p.category || '',
      category2: p.category2 || '',
      name: p.name || '',
      urduName: p.urduName || '',
      unit: p.unit || p.uom || 'PCS',
      packing: String(p.packing ?? 0),
      purchaseRate: String(p.purchaseRate ?? 0),
      saleRate: String(p.saleRate ?? 0),
      saleRate2: String(p.saleRate2 ?? 0),
      saleRate3: String(p.saleRate3 ?? 0),
      saleRate4: String(p.saleRate4 ?? 0),
      discount: String(p.discount ?? 0),
      reorderLevel: String(p.reorderLevel ?? 0),
      schRate: String(p.schRate ?? 0),
      schPc: String(p.schPc ?? 0),
      openingQty: String(p.openingQty ?? 0),
      openingDate: p.openingDateInput || todayInput(),
      openingCost: String(p.openingCost ?? p.purchaseRate ?? 0),
      batch: p.batch || '',
      location: p.location || '',
      isActive: p.isActive !== false,
    });
  }, [getCompanyColorHex]);

  const loadProductForEdit = useCallback(async (id) => {
    try {
      const res = await api.get(`/products/${id}`);
      setSelectedId(String(id));
      applyProductToForm(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load product.');
    }
  }, [applyProductToForm]);

  const findProductByCode = useCallback(async (code) => {
    const trimmed = (code || '').trim();
    if (!trimmed) return;
    try {
      const res = await api.get(`/products/search/${encodeURIComponent(trimmed)}`);
      const list = Array.isArray(res.data) ? res.data : [];
      const exact = list.find((p) => String(p.code).trim() === trimmed)
        || list.find((p) => String(p.id) === trimmed);
      if (exact) {
        await loadProductForEdit(exact.id);
        return;
      }
      if (list.length === 1) {
        await loadProductForEdit(list[0].id);
        return;
      }
      if (list.length === 0) {
        alert('Product not found.');
        return;
      }
      setSearch(trimmed);
      await loadProducts(trimmed);
      alert('Multiple products found. Click one from the list below.');
    } catch (err) {
      alert(err.response?.data?.message || 'Search failed.');
    }
  }, [loadProductForEdit, loadProducts]);

  const handleCodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      findProductByCode(formData.code);
    }
  };

  const handleRowClick = (p) => {
    const id = String(p.id || p._id);
    if (selectedId === id) {
      setSelectedId(null);
      loadNextId();
      return;
    }
    loadProductForEdit(id);
  };

  const buildPayload = () => ({
    code: formData.code,
    country: formData.country,
    company: formData.company,
    companyColor: hexToVbColor(formData.companyColorHex),
    category: formData.category,
    category2: formData.category2,
    name: formData.name,
    urduName: formData.urduName,
    unit: formData.unit,
    packing: Number(formData.packing) || 0,
    purchaseRate: Number(formData.purchaseRate) || 0,
    saleRate: Number(formData.saleRate) || 0,
    saleRate2: Number(formData.saleRate2) || 0,
    saleRate3: Number(formData.saleRate3) || 0,
    saleRate4: Number(formData.saleRate4) || 0,
    discount: Number(formData.discount) || 0,
    reorderLevel: Number(formData.reorderLevel) || 0,
    schRate: Number(formData.schRate) || 0,
    schPc: Number(formData.schPc) || 0,
    openingQty: Number(formData.openingQty) || 0,
    openingDate: formData.openingDate,
    openingCost: Number(formData.openingCost) || 0,
    batch: formData.batch,
    location: formData.location,
    isActive: formData.isActive,
  });

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Please enter product description (Name).');
      return;
    }
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await api.post('/products', buildPayload());
      alert('Product saved successfully!');
      await loadProducts(search);
      await loadCompanyColors();
      await loadNextId();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Save failed';
      setError(msg);
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedId) {
      alert('Select a product from the list first.');
      return;
    }
    if (!formData.name.trim()) {
      alert('Please enter product description (Name).');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.put(`/products/${selectedId}`, buildPayload());
      alert('Product updated successfully!');
      await loadProducts(search);
      await loadCompanyColors();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Update failed';
      setError(msg);
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) {
      alert('Select a product first.');
      return;
    }
    if (!window.confirm('Delete this product? (It will be marked inactive)')) return;
    setSaving(true);
    try {
      await api.delete(`/products/${selectedId}`);
      alert('Product deleted.');
      await loadProducts(search);
      await loadNextId();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const term = search.trim();
    await loadProducts(term);
    if (term) {
      try {
        const res = await api.get(`/products/search/${encodeURIComponent(term)}`);
        const list = Array.isArray(res.data) ? res.data : [];
        const exact = list.find((p) => String(p.code).trim() === term)
          || list.find((p) => String(p.id) === term);
        if (exact) {
          await loadProductForEdit(exact.id);
        } else if (list.length === 1) {
          await loadProductForEdit(list[0].id);
        }
      } catch {
        // list already filtered below
      }
    }
  };

  const Field = ({ label, name, type = 'text', readOnly = false, list, width = '100%' }) => (
    <div style={{ minWidth: width === '100%' ? 0 : width }}>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        readOnly={readOnly}
        list={list}
        style={{
          ...styles.input,
          width,
          backgroundColor: readOnly ? '#f0f0f0' : '#fff',
        }}
      />
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>Define Products</div>

      {error && (
        <div style={{ margin: '10px', padding: '8px', background: '#ffebee', color: '#c62828' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '0 10px' }}>
        <div style={{ ...styles.panel, flex: '1 1 680px' }}>
          <div style={styles.sectionTitle}>Enter Product Information</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginBottom: '10px' }}>
            <Field label="Product ID" name="id" readOnly />
            <div>
              <label style={styles.label}>Code</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                onKeyDown={handleCodeKeyDown}
                style={styles.input}
                title="Type code and press Enter to load product for edit"
              />
            </div>
            <Field label="Country" name="country" list="countries-list" />
            <div>
              <label style={styles.label}>Company</label>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  list="companies-list"
                  style={{ ...styles.input, flex: 1 }}
                />
                <div style={{ position: 'relative', width: 34, height: 28, flexShrink: 0 }}>
                  <input
                    type="color"
                    id="company-color-picker"
                    value={formData.companyColorHex}
                    onChange={(e) => setFormData((prev) => ({ ...prev, companyColorHex: e.target.value }))}
                    title="Pick company color"
                    style={{
                      position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%',
                      cursor: 'pointer', border: 'none', padding: 0,
                    }}
                  />
                  <label
                    htmlFor="company-color-picker"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 34, height: 28, border: '1px solid #999', boxSizing: 'border-box',
                      backgroundColor: formData.companyColorHex,
                      color: textColorForBg(formData.companyColorHex),
                      cursor: 'pointer', fontSize: '20px', fontWeight: 'bold', lineHeight: 1,
                      userSelect: 'none',
                    }}
                  >
                    +
                  </label>
                </div>
              </div>
            </div>
            <Field label="Category" name="category" list="categories-list" />
            <Field label="Category 2" name="category2" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginBottom: '10px' }}>
            <Field label="Description" name="name" />
            <Field label="Desc. Urdu" name="urduName" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginBottom: '10px' }}>
            <Field label="Cost/Unit" name="purchaseRate" type="number" />
            <div>
              <label style={styles.label}>U.O.M</label>
              <select name="unit" value={formData.unit} onChange={handleChange} style={styles.input}>
                {UOM_OPTIONS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <Field label="W.Sale" name="saleRate" type="number" />
            <Field label="Retail" name="saleRate2" type="number" />
            <Field label="Supply" name="saleRate3" type="number" />
            <Field label="Cash" name="saleRate4" type="number" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            <Field label="Packing (Pcs)" name="packing" type="number" />
            <Field label="Disc.%" name="discount" type="number" />
            <Field label="Min. Level" name="reorderLevel" type="number" />
            <Field label="Sch. Rate" name="schRate" type="number" />
          </div>
        </div>

        <div style={{ ...styles.panel, flex: '0 1 260px' }}>
          <div style={styles.sectionTitle}>Opening Stock</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            <Field label="Opening Qty" name="openingQty" type="number" />
            <Field label="Date" name="openingDate" type="date" />
            <Field label="O.Cost" name="openingCost" type="number" />
            <Field label="Location" name="location" />
            <Field label="Batch" name="batch" />
          </div>
          <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} />
            Product is active
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <button type="button" style={styles.btn} onClick={loadNextId}>New / Refresh</button>
            <button type="button" style={{ ...styles.btn, backgroundColor: '#90EE90' }} onClick={handleSave} disabled={saving || !!selectedId}>
              Save
            </button>
            <button type="button" style={{ ...styles.btn, backgroundColor: '#87CEEB' }} onClick={handleUpdate} disabled={saving || !selectedId}>Update</button>
            <button type="button" style={{ ...styles.btn, backgroundColor: '#ffb3b3' }} onClick={handleDelete} disabled={!selectedId}>Delete</button>
          </div>
        </div>
      </div>

      <div style={styles.panel}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, code, company, category..."
            style={{ ...styles.input, maxWidth: '320px' }}
          />
          <button type="submit" style={styles.btn}>Search</button>
          <button type="button" style={styles.btn} onClick={() => { setSearch(''); loadProducts(''); }}>Show All</button>
          <span style={{ fontSize: '12px', color: '#555' }}>
            {loading ? 'Loading...' : `${products.length} products`}
          </span>
        </form>

        <div style={{ maxHeight: '340px', overflow: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Code</th>
                <th style={styles.th}>Company</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Urdu Desc.</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Cost</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>W.Sale</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Retail</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Packing</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ ...styles.td, textAlign: 'center', color: '#888' }}>
                    {loading ? 'Loading products...' : 'No products found'}
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const id = String(p.id || p._id);
                  const selected = selectedId === id;
                  return (
                    <tr
                      key={id}
                      onClick={() => handleRowClick(p)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: selected ? '#e6f7ff' : p.isActive === false ? '#f5f5f5' : '#fff',
                        opacity: p.isActive === false ? 0.7 : 1,
                      }}
                    >
                      <td style={styles.td}>{p.id}</td>
                      <td style={styles.td}>{p.code}</td>
                      <td style={{
                        ...styles.td,
                        ...(companyColorStyle(p.company, companyColorMap) || {}),
                      }}>
                        {p.company}
                      </td>
                      <td style={styles.td}>{p.category}</td>
                      <td style={styles.td}>{p.name}</td>
                      <td style={{ ...styles.td, direction: 'rtl', textAlign: 'right' }}>{p.urduName}</td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>{Number(p.purchaseRate || 0).toFixed(2)}</td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>{Number(p.saleRate || 0).toFixed(0)}</td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>{Number(p.saleRate2 || 0).toFixed(0)}</td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>{p.packing ?? 0}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <datalist id="companies-list">
        {companies.map((c) => <option key={c} value={c} />)}
      </datalist>
      <datalist id="categories-list">
        {categories.map((c) => <option key={c} value={c} />)}
      </datalist>
    </div>
  );
}

export default ProductsPage;
