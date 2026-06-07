import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../utils/api';
import { usePageStatePersistence } from '../hooks/usePageStatePersistence';
import ProductSearchModal from '../components/ProductSearchModal';
import SupplierSearchModal from '../components/SupplierSearchModal';
import PaperSizeSelector from '../components/PaperSizeSelector';
import { getPaperStyle, getWindowSize, getScaledFontSize } from '../utils/printHelper';
import html2canvas from 'html2canvas';
import WhatsAppModal from '../components/WhatsAppModal';
import { buildInvoiceText, sendWhatsAppImage, formatPhoneForWhatsApp } from '../utils/whatsappHelper';

const PAGE_KEY = 'sale-invoice';

const defaultProductEntry = {
  location: '',
  productId: '',
  productName: '',
  urduName: '',
  productCode: '',
  purchaseRate: '',
  availableStock: 0,
  remarks: '',
  packing: '',
  packQty: '',
  packingSize: '',
  pcs: '',
  rate: '',
  amount: '',
  discPercent: '',
  discount: '',
  netAmount: '',
  schPc: '',
  uom: '',
};

const defaultBottomData = {
  stPercent: '0.000',
  totalSt: '0.00',
  totalDiscount: '0.00',
  netAmount: '0.00',
  cashReceived: '0.00',
  disc2: '0.00',
  exDisc: '0.00',
  billAmount: '0.00',
  previousBalance: '0.00',
  netReceivable: '0.00',
};

const calcLineCommission = (line) => {
  const pcs = parseFloat(line.pcs) || 0;
  const purchaseRate = parseFloat(line.purchaseRate) || 0;
  if (pcs <= 0 || purchaseRate <= 0) return 0;

  const net = parseFloat(line.netAmount);
  if (!Number.isNaN(net) && line.netAmount !== '') {
    return net - purchaseRate * pcs;
  }

  const rate = parseFloat(line.rate) || 0;
  const discPercent = parseFloat(line.discPercent) || 0;
  const amount = pcs * rate;
  const discount = (amount * discPercent) / 100;
  return amount - discount - purchaseRate * pcs;
};

/** St.% = (Sell - Buy) / Buy × 100 — markup on purchase rate */
const calcLineStPercent = (line) => {
  const purchaseRate = parseFloat(line.purchaseRate) || 0;
  if (purchaseRate <= 0) return 0;

  const pcs = parseFloat(line.pcs) || 0;
  const totalCost = purchaseRate * pcs;

  if (totalCost > 0 && line.netAmount !== '' && line.netAmount != null) {
    return (calcLineCommission(line) / totalCost) * 100;
  }

  const rate = parseFloat(line.rate) || 0;
  const discPercent = parseFloat(line.discPercent) || 0;
  const effectiveRate = rate * (1 - discPercent / 100);
  return ((effectiveRate - purchaseRate) / purchaseRate) * 100;
};

const computeTotalsFromProducts = (productsList, prev = {}) => {
  const totalDiscount = productsList.reduce((sum, p) => sum + (parseFloat(p.discount) || 0), 0);
  const netAmount = productsList.reduce((sum, p) => sum + (parseFloat(p.netAmount) || 0), 0);
  const totalCommission = productsList.reduce((sum, p) => sum + calcLineCommission(p), 0);
  const totalCost = productsList.reduce(
    (sum, p) => sum + (parseFloat(p.purchaseRate) || 0) * (parseFloat(p.pcs) || 0),
    0,
  );
  const stPercent = totalCost > 0 ? (totalCommission / totalCost) * 100 : 0;
  const prevBal = parseFloat(prev.previousBalance) || 0;
  const exDisc = parseFloat(prev.exDisc) || 0;
  const billAmount = netAmount - exDisc;

  return {
    stPercent: stPercent.toFixed(3),
    totalSt: totalCommission.toFixed(2),
    totalDiscount: totalDiscount.toFixed(2),
    netAmount: netAmount.toFixed(2),
    billAmount: billAmount.toFixed(2),
    netReceivable: (billAmount + prevBal).toFixed(2),
  };
};

const calcPcsFromPackQty = (packQty, packingSize) => {
  const pq = parseFloat(packQty) || 0;
  const ps = parseFloat(packingSize) || 0;
  if (ps <= 0 || pq <= 0) return '';
  return String(pq * ps);
};

const hasProductPacking = (entry) => (parseFloat(entry?.packingSize) || 0) > 0;

const recalcEntryAmounts = (entry) => {
  const pcs = parseFloat(entry.pcs) || 0;
  const rate = parseFloat(entry.rate) || 0;
  const discPercent = parseFloat(entry.discPercent) || 0;
  const amount = pcs * rate;
  const discount = (amount * discPercent) / 100;
  return {
    ...entry,
    amount: amount.toFixed(2),
    discount: discount.toFixed(2),
    netAmount: (amount - discount).toFixed(2),
  };
};

const formatLinePackingDisplay = (line) => {
  const packingSize = parseFloat(line.packingSize) || 0;
  const packQty = line.packQty || line.packing;
  if (packingSize > 0 && packQty) return `${packQty} x ${packingSize}`;
  if (packQty) return String(packQty);
  return '-';
};

const SaleInvoice = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: '85-03',
    date: new Date().toLocaleDateString('en-GB'),
    soNumber: '',
    paymentType: 'Cash',
    selectBuyer: '',
    priceList: 'Whole Sal',
    crDays: '',
    dueDate: new Date().toLocaleDateString('en-GB')
  });

  // --- 2. Product Entry State (The input row) ---
  const [productEntry, setProductEntry] = useState({ ...defaultProductEntry });

  // --- 3. Products List State (The main table data) ---
  const [products, setProducts] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProductModal, setSelectedProductModal] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomerModal, setSelectedCustomerModal] = useState(null);
  const [savedDoc, setSavedDoc] = useState(null);
  const [paperSize, setPaperSize] = useState('A5');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // --- 4. Bottom Totalizers State ---
  const [bottomData, setBottomData] = useState({
    stPercent: '0.000',
    totalSt: '0.00',
    totalDiscount: '0.00',
    netAmount: '0.00',
    cashReceived: '0.00',
    disc2: '0.00',
    exDisc: '0.00',
    billAmount: '0.00',
    previousBalance: '0.00',
    netReceivable: '0.00'
  });

  const applySaleToForm = (sale) => {
    if (!sale) return;
    const displayName = sale.customerName || sale.customer || sale.selectBuyer || '';

    setInvoiceData((prev) => ({
      ...prev,
      invoiceNumber: sale.invoiceNumber || sale.invoiceNo || prev.invoiceNumber,
      date: sale.date || prev.date,
      paymentType: sale.paymentType || prev.paymentType,
      selectBuyer: displayName,
      crDays: sale.crDays || sale.creditDays || '',
      dueDate: sale.dueDate || prev.dueDate,
    }));

    if (sale.customerId) {
      setSelectedCustomerModal({
        Id: sale.customerId,
        id: sale.customerId,
        customerName: displayName,
        name: displayName,
      });
    }

    if (sale.products?.length) {
      setProducts(sale.products);
    }

    setBottomData((prev) => ({
      ...prev,
      ...computeTotalsFromProducts(sale.products || [], prev),
      previousBalance: String(sale.previousBalance || prev.previousBalance || 0),
      cashReceived: String(sale.cashReceived || prev.cashReceived || 0),
    }));
  };

  const loadSaleFromSearch = async (invoiceNo) => {
    if (!invoiceNo) return;
    try {
      const res = await api.get(`/sales/search-invoice/${encodeURIComponent(invoiceNo)}`);
      const sale = res.data;
      setSavedDoc(sale.id || sale._id);
      applySaleToForm(sale);
      if (sale.customerId) {
        api.get(`/sales/customer-history/${sale.customerId}`)
          .then(r => setCustomerHistory(Array.isArray(r.data) ? r.data : []))
          .catch(() => setCustomerHistory([]));
      }
    } catch (error) {
      if (error.response?.status === 404) {
        alert('Invoice not found.');
      } else {
        alert('Error searching: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const fetchProductStock = async (productId) => {
    if (!productId) return 0;
    try {
      const res = await api.get(`/stock/product/${productId}`);
      return res.data?.onHandQty ?? 0;
    } catch {
      return 0;
    }
  };

  const loadLatestSale = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const invoiceRes = await api.get('/sales/latest');
      if (invoiceRes.data) {
        applySaleToForm(invoiceRes.data);
        setSavedDoc(invoiceRes.data.id || invoiceRes.data._id || null);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        console.warn('Latest sale not loaded:', err.response?.data?.message || err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setProductEntry(prev => recalcEntryAmounts(prev));
  }, [productEntry.pcs, productEntry.rate, productEntry.discPercent, productEntry.packQty]);

  const formatProductPrintCell = (product) => {
    const name = product.productName || '';
    const urdu = product.urduName || '';
    const packing = product.packing ? ` (${product.packing})` : '';
    const urduBlock = urdu ? `<div class="prod-urdu">${urdu}</div>` : '';
    return `<div class="prod-name">${name}${packing}</div>${urduBlock}`;
  };

  const formatProductDisplay = (product) => {
    const name = product.productName || product.name || '';
    const urdu = product.urduName || product.descUrdu || '';
    if (name && urdu) return `${name} / ${urdu}`;
    return name || urdu;
  };

  const handleProductSelectFromModal = async (product) => {
    setSelectedProductModal(product);
    const prodId = product._id || product.id;
    const packingSizeNum = parseFloat(product.packing) || 0;
    const packingSize = packingSizeNum > 0 ? String(packingSizeNum) : '';
    setProductEntry(prev => ({
      ...prev,
      productId: String(prodId),
      productCode: product.code || '',
      productName: product.name || '',
      urduName: product.urduName || product.descUrdu || '',
      uom: product.uom || 'PCS',
      rate: product.saleRate != null ? String(product.saleRate) : '',
      purchaseRate: product.purchaseRate != null ? String(product.purchaseRate) : '0',
      packingSize,
      packQty: '',
      packing: '',
      pcs: '',
      availableStock: 0,
    }));
    setShowProductModal(false);

    const stock = await fetchProductStock(prodId);
    setProductEntry(prev => ({
      ...prev,
      availableStock: stock,
    }));

    const custId = selectedCustomerModal?.Id || selectedCustomerModal?._id || selectedCustomerModal?.id;
    if (custId && prodId) {
      api.get(`/sales/product-sold-history/${custId}/${prodId}`)
        .then(res => setProductSoldHistory(Array.isArray(res.data) ? res.data : []))
        .catch(() => setProductSoldHistory([]));
    }
  };

  const [customerHistory, setCustomerHistory] = useState([]);
  const [productSoldHistory, setProductSoldHistory] = useState([]);

  const pageSnapshot = useMemo(() => ({
    invoiceData,
    productEntry,
    products,
    editIndex,
    selectedProductModal,
    selectedCustomerModal,
    savedDoc,
    paperSize,
    bottomData,
    customerHistory,
    productSoldHistory,
  }), [
    invoiceData, productEntry, products, editIndex,
    selectedProductModal, selectedCustomerModal, savedDoc,
    paperSize, bottomData, customerHistory, productSoldHistory,
  ]);

  const restorePageState = useCallback((cached) => {
    if (cached.invoiceData) setInvoiceData(cached.invoiceData);
    if (cached.productEntry) setProductEntry(cached.productEntry);
    if (cached.products) setProducts(cached.products);
    if (cached.editIndex !== undefined) setEditIndex(cached.editIndex);
    if (cached.selectedProductModal !== undefined) setSelectedProductModal(cached.selectedProductModal);
    if (cached.selectedCustomerModal !== undefined) setSelectedCustomerModal(cached.selectedCustomerModal);
    if (cached.savedDoc !== undefined) setSavedDoc(cached.savedDoc);
    if (cached.paperSize) setPaperSize(cached.paperSize);
    if (cached.bottomData) setBottomData(cached.bottomData);
    if (cached.customerHistory) setCustomerHistory(cached.customerHistory);
    if (cached.productSoldHistory) setProductSoldHistory(cached.productSoldHistory);
    setLoading(false);
  }, []);

  const { clearPersistedState } = usePageStatePersistence(
    PAGE_KEY,
    pageSnapshot,
    restorePageState,
    { onFirstMount: loadLatestSale },
  );

  const resetToNewInvoice = useCallback(() => {
    clearPersistedState();
    setSavedDoc(null);
    setProducts([]);
    setEditIndex(null);
    setSelectedProductModal(null);
    setSelectedCustomerModal(null);
    setCustomerHistory([]);
    setProductSoldHistory([]);
    setInvoiceData({
      invoiceNumber: '',
      date: new Date().toLocaleDateString('en-GB'),
      soNumber: '',
      paymentType: 'Cash',
      selectBuyer: '',
      priceList: 'Whole Sal',
      crDays: '',
      dueDate: new Date().toLocaleDateString('en-GB'),
    });
    setBottomData({ ...defaultBottomData });
    setProductEntry({ ...defaultProductEntry });
    setLoading(false);
  }, [clearPersistedState]);

  const handleCustomerSelectFromModal = (customer) => {
    setSelectedCustomerModal(customer);
    const displayName = customer.customerName || customer.accountTitle || customer.name || '';
    setInvoiceData(prev => ({
      ...prev,
      selectBuyer: displayName,
    }));
    setShowCustomerModal(false);

    const custId = customer.Id || customer._id || customer.id;
    if (custId) {
      api.get(`/sales/customer-history/${custId}`)
        .then(res => setCustomerHistory(Array.isArray(res.data) ? res.data : []))
        .catch(() => setCustomerHistory([]));

      api.get(`/sales/customer-balance/${custId}`)
        .then(res => {
          const bal = parseFloat(res.data?.balance) || 0;
          setBottomData(prev => ({
            ...prev,
            previousBalance: bal.toFixed(2),
            ...computeTotalsFromProducts(products, { ...prev, previousBalance: bal.toFixed(2) }),
          }));
        })
        .catch(() => {});
    }
  };

  // --- Handlers for Top Section ---
  const handleInvoiceChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // --- Handlers for Product Entry (with auto-calculation) ---
  const handleProductEntryChange = (e) => {
    const { name, value } = e.target;

    setProductEntry(prev => {
      let updated = { ...prev, [name]: value };

      if (name === 'productId' && value) {
        fetchProductStock(value).then((stock) => {
          setProductEntry(cur => ({ ...cur, availableStock: stock }));
        });
      }

      if (name === 'packQty' && hasProductPacking(updated)) {
        updated.packing = value;
        updated.pcs = calcPcsFromPackQty(value, updated.packingSize);
      } else if (name === 'pcs' && !hasProductPacking(updated)) {
        updated.packing = '';
        updated.packQty = '';
      }

      return recalcEntryAmounts(updated);
    });
  };

  // --- Calculate Totals for Bottom Panel ---
  const calculateTotals = (productsList) => {
    setBottomData(prev => ({
      ...prev,
      ...computeTotalsFromProducts(productsList, prev),
    }));
  };

  // --- Main Action Handlers ---

  const handleAdd = () => {
    if (!productEntry.productId || !productEntry.rate) {
      alert('Please select a product and enter rate.');
      return;
    }
    if (hasProductPacking(productEntry)) {
      if (!productEntry.packQty || parseFloat(productEntry.packQty) <= 0) {
        alert('Please enter packing (number of packets).');
        return;
      }
    } else if (!productEntry.pcs || parseFloat(productEntry.pcs) <= 0) {
      alert('Please enter quantity (Pc(s)).');
      return;
    }

    const newProduct = {
      sr: products.length + 1,
      ...productEntry,
      packing: hasProductPacking(productEntry) ? productEntry.packQty : '',
    };

    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    calculateTotals(updatedProducts);
    resetProductEntry();
  };

  const handleUpdateRow = () => {
    if (editIndex === null) {
      alert('Please select a product to update.');
      return;
    }
    if (hasProductPacking(productEntry)) {
      if (!productEntry.packQty || parseFloat(productEntry.packQty) <= 0) {
        alert('Please enter packing (number of packets).');
        return;
      }
    } else if (!productEntry.pcs || parseFloat(productEntry.pcs) <= 0) {
      alert('Please enter quantity (Pc(s)).');
      return;
    }

    const updatedProducts = [...products];
    updatedProducts[editIndex] = {
      ...updatedProducts[editIndex],
      ...productEntry,
      packing: hasProductPacking(productEntry) ? productEntry.packQty : '',
    };

    setProducts(updatedProducts);
    calculateTotals(updatedProducts);
    resetProductEntry();
    setEditIndex(null);
  };

  const handleRemove = () => {
    if (editIndex === null) {
      alert('Please select a product to remove.');
      return;
    }

    const updatedProducts = products.filter((_, index) => index !== editIndex);
    // Renumber the Sr# after removal
    const reNumbered = updatedProducts.map((p, idx) => ({ ...p, sr: idx + 1 }));

    setProducts(reNumbered);
    calculateTotals(reNumbered);
    resetProductEntry();
    setEditIndex(null);
  };

  const handleRowClick = (index) => {
    // If the same row is clicked twice, unselect it
    if (editIndex === index) {
      setEditIndex(null);
      resetProductEntry();
    } else {
      setEditIndex(index);
      const row = products[index];
      setProductEntry({
        ...row,
        packQty: row.packQty || row.packing || '',
      });
    }
  };

  const resetProductEntry = () => {
    setProductEntry({ ...defaultProductEntry });
  };

  const entryCommission = calcLineCommission(productEntry);
  const entryStPercent = calcLineStPercent(productEntry);

  const buildSalePayload = () => {
    const custId = selectedCustomerModal?.Id || selectedCustomerModal?._id || selectedCustomerModal?.id;
    return {
        invoiceNo: invoiceData.invoiceNumber,
        date: invoiceData.date,
        paymentType: invoiceData.paymentType,
      customerCode: String(custId || ''),
        creditDays: invoiceData.crDays,
        dueDate: invoiceData.dueDate,
        products: products.map(product => ({
        product: product.productId,
          productName: product.productName,
        productCode: product.productCode || product.productId,
        productId: product.productId,
        remarks: product.remarks || '',
        packing: product.packQty || product.packing || '',
          pcs: product.pcs,
          rate: product.rate,
          amount: product.amount,
          discPercent: product.discPercent,
          discount: product.discount,
          net: product.netAmount,
          uom: product.uom
        })),
        previousBalance: bottomData.previousBalance,
        cashPaid: bottomData.cashReceived,
      discPercentFooter: '0',
        extraDiscount: bottomData.exDisc,
      description: '',
    };
  };

  const handleSave = async () => {
    if (products.length === 0) {
      alert('Please add at least one product before saving the invoice.');
      return;
    }
    const custId = selectedCustomerModal?.Id || selectedCustomerModal?._id || selectedCustomerModal?.id;
    if (!custId) {
      alert('Please select a customer/buyer first.');
      return;
    }

    try {
      const saleData = buildSalePayload();
      const response = await api.post('/sales', saleData);
      const docNo = response.data.doc;
      setSavedDoc(docNo);
      if (response.data.invoiceNo) {
        setInvoiceData((prev) => ({ ...prev, invoiceNumber: String(response.data.invoiceNo) }));
      }
      alert('Sale saved successfully! Invoice, stock & ledger updated.');
      const confirmed = window.confirm('Do you want to print?');
      if (confirmed) {
        openReceipt(true);
        resetToNewInvoice();
      }
    } catch (error) {
      console.error('Error saving sale:', error);
      alert('Error saving sale: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdate = async () => {
    if (!savedDoc) {
      alert('No saved invoice to update. Please search for an invoice first.');
      return;
    }
    if (products.length === 0) {
      alert('Please add at least one product.');
      return;
    }
    try {
      const saleData = buildSalePayload();
      const response = await api.put(`/sales/${savedDoc}`, saleData);
      alert(response.data?.message || 'Sale updated successfully! Invoice, stock & ledger updated.');
    } catch (error) {
      console.error('Error updating sale:', error);
      alert('Error updating sale: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async () => {
    if (!savedDoc) {
      alert('No saved invoice to delete. Please search for an invoice first.');
      return;
    }
    const confirmed = window.confirm(`Are you sure you want to DELETE invoice #${invoiceData.invoiceNumber}? This will permanently remove it from the database.`);
    if (!confirmed) return;

    try {
      await api.delete(`/sales/${savedDoc}`);
      alert('Invoice deleted successfully!');
      setSavedDoc(null);
      handleClear();
    } catch (error) {
      console.error('Error deleting sale:', error);
      alert('Error deleting sale: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSearchInvoice = async () => {
    const invoiceNo = prompt('Enter Invoice # to search:');
    if (!invoiceNo) return;
    await loadSaleFromSearch(invoiceNo.trim());
  };

  const handleWhatsAppSend = async () => {
    const customerPhone = selectedCustomerModal?.phone || selectedCustomerModal?.cellNo || selectedCustomerModal?.contact || '';
    if (!customerPhone) {
      alert('Customer phone number not available.');
      setShowWhatsAppModal(false);
      return;
    }

    setShowWhatsAppModal(false);

    const receiptHtml = buildReceiptHtml();
    const container = document.createElement('div');
    container.innerHTML = receiptHtml;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '600px';
    container.style.background = '#fff';
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      document.body.removeChild(container);

      canvas.toBlob(async (blob) => {
        if (!blob) { alert('Failed to generate image.'); return; }
        const caption = `Invoice #${invoiceData.invoiceNumber} - ${invoiceData.selectBuyer} - Rs.${bottomData.billAmount}`;
        await sendWhatsAppImage(customerPhone, blob, caption);
      }, 'image/png');
    } catch (err) {
      document.body.removeChild(container);
      console.error('Error capturing receipt:', err);
      alert('Error generating receipt image. Sending text instead.');
      const messageText = buildInvoiceText({
        businessName: 'Moto Organs Traders',
        invoiceNo: invoiceData.invoiceNumber,
        date: invoiceData.date,
        customerName: invoiceData.selectBuyer,
        products, totalAmount: bottomData.netAmount,
        discount: bottomData.totalDiscount, billAmount: bottomData.billAmount,
        previousBalance: bottomData.previousBalance, netReceivable: bottomData.netReceivable,
        cashReceived: bottomData.cashReceived,
      });
      const phone = formatPhoneForWhatsApp(customerPhone);
      const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(messageText)}`;
      window.open(url, '_blank');
    }
  };

  const buildReceiptHtml = () => {
    const custName = invoiceData.selectBuyer || '';
    const invoiceNo = invoiceData.invoiceNumber || '';
    const printDate = invoiceData.date || '';
    const prevBal = bottomData.previousBalance;
    const netRecv = bottomData.netReceivable;
    const received = bottomData.cashReceived;
    const totalQty = products.reduce((sum, p) => sum + (parseFloat(p.pcs) || 0), 0);

    return `
      <div style="font-family:'Segoe UI',Arial,sans-serif; padding:20px; font-size:12px; color:#333; background:#fff;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px;">
          <div>
            <h1 style="font-size:16px; font-weight:bold; margin:0 0 5px;">Moto Organs Traders</h1>
            <p style="font-size:10px; color:#555; margin:2px 0;">Address: Qasim Abad, Hyderabad, Sindh</p>
            <p style="font-size:10px; color:#555; margin:2px 0;">Mobile: 0335-8088935/0343-3257062</p>
          </div>
          <table style="border:2px solid #333; border-collapse:collapse;">
            <tr><td style="padding:5px 10px; border:1px solid #333; font-weight:bold; background:#333; color:#fff; font-size:10px;">Invoice #</td><td style="padding:5px 10px; border:1px solid #333; font-weight:bold; background:#333; color:#fff; font-size:10px;">Date</td></tr>
            <tr><td style="padding:5px 10px; border:1px solid #333; font-size:10px; text-align:center;">${invoiceNo}</td><td style="padding:5px 10px; border:1px solid #333; font-size:10px; text-align:center;">${printDate}</td></tr>
          </table>
        </div>
        <div style="border:2px solid #333; padding:10px; margin-bottom:10px;">
          <div style="text-align:center; font-weight:bold; background:#333; color:#fff; padding:5px; margin:-10px -10px 8px -10px;">Bill to</div>
          <div style="font-size:11px;"><strong>Name:</strong> ${custName}</div>
          <div style="font-size:11px;"><strong>Contact:</strong> ${selectedCustomerModal?.phone || selectedCustomerModal?.cellNo || ''}</div>
          <div style="font-size:11px;"><strong>Address:</strong> ${selectedCustomerModal?.address || ''}</div>
        </div>
        <table style="width:100%; border-collapse:collapse; margin-bottom:10px; table-layout:fixed;">
          <colgroup>
            <col style="width:6%" />
            <col style="width:8%" />
            <col style="width:46%" />
            <col style="width:14%" />
            <col style="width:14%" />
          </colgroup>
          <thead>
            <tr style="background:#e8e8e8;">
              <th style="border:1px solid #333; padding:4px; font-size:10px;">Sr.#</th>
              <th style="border:1px solid #333; padding:4px; font-size:10px;">Qty.</th>
              <th style="border:1px solid #333; padding:4px; font-size:10px; text-align:left;">Product</th>
              <th style="border:1px solid #333; padding:4px; font-size:10px;">Rate</th>
              <th style="border:1px solid #333; padding:4px; font-size:10px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${products.map((p, i) => `
              <tr>
                <td style="border:1px solid #333; padding:3px; font-size:10px; text-align:center;">${i + 1}</td>
                <td style="border:1px solid #333; padding:3px; font-size:10px; text-align:center;">${p.pcs}</td>
                <td style="border:1px solid #333; padding:3px; font-size:10px; vertical-align:top;">
                  <div>${p.productName}${p.packing ? ' (' + p.packing + ')' : ''}</div>
                  ${p.urduName ? `<div style="font-family:'Segoe UI','Jameel Noori Nastaleeq','Noto Nastaliq Urdu',sans-serif; direction:rtl; text-align:right; font-size:10px; margin-top:2px;">${p.urduName}</div>` : ''}
                </td>
                <td style="border:1px solid #333; padding:3px; font-size:10px; text-align:right;">${parseFloat(p.rate).toFixed(2)}</td>
                <td style="border:1px solid #333; padding:3px; font-size:10px; text-align:right;">${parseFloat(p.netAmount).toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr style="font-weight:bold;">
              <td style="border:1px solid #333; padding:3px; font-size:10px;"></td>
              <td style="border:1px solid #333; padding:3px; font-size:10px; text-align:center;">${totalQty}</td>
              <td colspan="3" style="border:1px solid #333; padding:3px;"></td>
            </tr>
          </tbody>
        </table>
        <div style="text-align:right; font-size:11px;">
          <div><strong>Total:</strong> ${bottomData.netAmount}</div>
          <div><strong>Discount:</strong> ${bottomData.totalDiscount}</div>
          <div style="font-size:12px;"><strong>Bill Amount: ${bottomData.billAmount}</strong></div>
          <div>Previous Balance: ${parseFloat(prevBal).toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
          <div>Received: ${parseFloat(received || 0).toFixed(2)}</div>
          <div style="font-size:12px;"><strong>Balance: ${parseFloat(netRecv).toLocaleString('en-US', {minimumFractionDigits: 2})}</strong></div>
        </div>
      </div>
    `;
  };

  const openReceipt = (autoPrint = false) => {
    const custName = invoiceData.selectBuyer || '';
    const invoiceNo = invoiceData.invoiceNumber || '';
    const printDate = invoiceData.date || '';
    const prevBal = bottomData.previousBalance;
    const netRecv = bottomData.netReceivable;
    const received = bottomData.cashReceived;
    const totalQty = products.reduce((sum, p) => sum + (parseFloat(p.pcs) || 0), 0);
    const ps = paperSize;
    const isThermal = ps === 'Thermal';
    const titleSize = isThermal ? '12px' : '16px';

    const printWindow = window.open('', '_blank', getWindowSize(ps));
    printWindow.document.write(`
      <html>
      <head>
        <title>Sale Invoice - ${invoiceNo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
          ${getPaperStyle(ps)}
          .receipt { max-width: 100%; margin: 0 auto; }
          .header { display: ${isThermal ? 'block' : 'flex'}; justify-content: space-between; align-items: flex-start; margin-bottom: ${isThermal ? '8px' : '15px'}; ${isThermal ? 'text-align:center;' : ''} }
          .company-info h1 { font-size: ${titleSize}; font-weight: bold; margin-bottom: ${isThermal ? '2px' : '5px'}; }
          .company-info p { font-size: ${getScaledFontSize(ps, 11)}; color: #555; line-height: 1.4; }
          .invoice-box { border: 2px solid #333; ${isThermal ? 'margin:5px auto; font-size:8px;' : ''} }
          .invoice-box td { padding: ${isThermal ? '2px 4px' : '5px 10px'}; border: 1px solid #333; font-size: ${getScaledFontSize(ps, 11)}; text-align: center; }
          .invoice-box .label { font-weight: bold; background: #333; color: #fff; }
          .bill-to { border: ${isThermal ? '1px dashed #333' : '2px solid #333'}; padding: ${isThermal ? '5px' : '10px'}; margin: ${isThermal ? '8px 0' : '15px 0'}; }
          .bill-to-header { text-align: center; font-weight: bold; font-size: ${getScaledFontSize(ps, 14)}; background-color: #333; color: #fff; padding: 5px; margin: -10px -10px 8px -10px; }
          .bill-to-row { display: flex; margin: 3px 0; font-size: ${getScaledFontSize(ps, 12)}; }
          .bill-to-row .lbl { font-weight: bold; width: ${isThermal ? '50px' : '70px'}; }
          .products-table { width: 100%; border-collapse: collapse; margin: ${isThermal ? '5px 0' : '15px 0'}; table-layout: fixed; }
          .products-table col.col-sr { width: ${isThermal ? '8%' : '6%'}; }
          .products-table col.col-qty { width: ${isThermal ? '10%' : '8%'}; }
          .products-table col.col-product { width: ${isThermal ? '42%' : '46%'}; }
          .products-table col.col-uom { width: 8%; }
          .products-table col.col-rate { width: ${isThermal ? '18%' : '14%'}; }
          .products-table col.col-amount { width: ${isThermal ? '22%' : '14%'}; }
          .products-table th, .products-table td { border: 1px solid #333; padding: ${isThermal ? '2px 3px' : '6px 8px'}; font-size: ${getScaledFontSize(ps, 11)}; }
          .products-table th { background: #e8e8e8; font-weight: bold; text-align: center; }
          .products-table td { text-align: center; vertical-align: top; }
          .products-table td.left { text-align: left; }
          .products-table td.right { text-align: right; }
          .products-table .prod-name { line-height: 1.3; word-break: break-word; }
          .products-table .prod-urdu { font-family: 'Segoe UI', 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', sans-serif; direction: rtl; text-align: right; font-size: ${getScaledFontSize(ps, 10)}; margin-top: 2px; line-height: 1.4; word-break: break-word; }
          .footer-section { display: ${isThermal ? 'block' : 'flex'}; justify-content: space-between; margin-top: ${isThermal ? '5px' : '10px'}; }
          .totals-table { border-collapse: collapse; ${isThermal ? 'width:100%;' : ''} }
          .totals-table td { padding: ${isThermal ? '1px 4px' : '3px 10px'}; font-size: ${getScaledFontSize(ps, 12)}; }
          .totals-table .amount { text-align: right; font-weight: bold; }
          .totals-table .highlight { font-size: ${getScaledFontSize(ps, 13)}; font-weight: bold; }
          .note { font-size: ${getScaledFontSize(ps, 12)}; max-width: ${isThermal ? '100%' : '280px'}; margin-top: ${isThermal ? '5px' : '10px'}; font-style: italic; }
          .signature { margin-top: ${isThermal ? '15px' : '30px'}; text-align: left; font-weight: bold; border-top: 1px solid #333; padding-top: 5px; width: 150px; }
          .dev-footer { text-align: center; margin-top: ${isThermal ? '8px' : '20px'}; font-size: ${getScaledFontSize(ps, 10)}; color: #888; border-top: 1px solid #ddd; padding-top: 5px; }
          .no-print { display: none; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="company-info">
              <h1>Moto Organs Traders</h1>
              <p>Address: Qasim Abad, Hyderabad, Sindh</p>
              <p>Mobile: 0335-8088935/0343-3257062</p>
              ${isThermal ? '' : '<p>Email: motoorgans@gmail.com</p>'}
            </div>
            <table class="invoice-box">
              <tr><td class="label">Invoice #</td><td class="label">Date</td></tr>
              <tr><td>${invoiceNo}</td><td>${printDate}</td></tr>
              ${isThermal ? '' : `<tr><td class="label">Term</td><td class="label">Due Date</td></tr><tr><td>${invoiceData.paymentType}</td><td>${invoiceData.dueDate || printDate}</td></tr>`}
            </table>
          </div>

          <div class="bill-to">
            <div class="bill-to-header">Bill to</div>
            <div class="bill-to-row"><span class="lbl">Name:</span><span>${custName}</span></div>
            <div class="bill-to-row"><span class="lbl">Contact:</span><span>${selectedCustomerModal?.phone || selectedCustomerModal?.cellNo || selectedCustomerModal?.contact || ''}</span></div>
            <div class="bill-to-row"><span class="lbl">Address:</span><span>${selectedCustomerModal?.address || ''}</span></div>
          </div>

          <table class="products-table">
            <colgroup>
              <col class="col-sr" />
              <col class="col-qty" />
              <col class="col-product" />
              ${isThermal ? '' : '<col class="col-uom" />'}
              <col class="col-rate" />
              <col class="col-amount" />
            </colgroup>
            <thead>
              <tr>
                <th>Sr.#</th>
                <th>Qty.</th>
                <th>Product</th>
                ${isThermal ? '' : '<th>U.O.M</th>'}
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${products.map((p, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${p.pcs}</td>
                  <td class="left">${formatProductPrintCell(p)}</td>
                  ${isThermal ? '' : `<td>${p.uom || 'PCS'}</td>`}
                  <td class="right">${parseFloat(p.rate).toFixed(2)}</td>
                  <td class="right">${parseFloat(p.netAmount).toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr style="font-weight:bold">
                <td></td>
                <td>${totalQty}</td>
                <td colspan="${isThermal ? '3' : '4'}"></td>
              </tr>
            </tbody>
          </table>

          <div class="footer-section">
            ${isThermal ? '' : `<div class="note"><p><strong>اس انوائس کا مال اچھی طرح چیک کر لیں۔ کمی بیشی کی صورت میں دو دن کے اندر اوپر دیے گئے نمبر پر رابطہ کریں۔پلاسٹک آئٹم کے ٹوٹ پھوٹ کا کلیم نہیں۔ شکریہ</strong></p><div class="signature">Signature</div></div>`}
            <table class="totals-table">
              <tr><td>Total:</td><td class="amount">${bottomData.netAmount}</td></tr>
              <tr><td>Discount:</td><td class="amount">${bottomData.totalDiscount}</td></tr>
              <tr><td><strong>Bill Amount:</strong></td><td class="amount highlight">${bottomData.billAmount}</td></tr>
              <tr><td>Previous Balance:</td><td class="amount">${parseFloat(prevBal).toLocaleString('en-US', {minimumFractionDigits: 2})}</td></tr>
              <tr><td>Received:</td><td class="amount">${parseFloat(received || 0).toFixed(2)}</td></tr>
              <tr><td><strong>Balance:</strong></td><td class="amount highlight">${parseFloat(netRecv).toLocaleString('en-US', {minimumFractionDigits: 2})}</td></tr>
            </table>
          </div>

          <div class="dev-footer">Software developed by: Rathisoft / www.rathisoft.com</div>
        </div>
        ${autoPrint ? '<script>setTimeout(function(){ window.print(); }, 400);</script>' : ''}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  };

  const handleClear = () => {
    resetToNewInvoice();
    alert('Invoice form has been cleared.');
  };

  // --- Inline Styles (Simulating Desktop App Look) ---
  const styles = {
    container: {
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh',
      margin: 0,
      padding: '0',
      userSelect: 'none',
      border: '1px solid #999'
    },
    headerBar: {
      backgroundColor: '#4a4a4a',
      color: '#ffffff',
      padding: '15px 30px',
      fontSize: '28px',
      textAlign: 'center',
      borderBottom: '3px solid #333',
      flexShrink: 0
    },
    topSection: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      alignItems: 'center',
      padding: '8px',
      backgroundColor: '#e8e8e8',
      borderBottom: '2px solid #999',
      fontSize: '11px',
    },
    inputGroup: {
      display: 'flex',
      gap: '4px',
      alignItems: 'center',
    },
    label: {
      fontSize: '11px',
      fontWeight: '500',
      whiteSpace: 'nowrap',
    },
    input: {
      padding: '2px 4px',
      border: '1px solid #999',
      fontSize: '11px',
      backgroundColor: 'white',
      height: '22px'
    },
    select: {
      padding: '2px 4px',
      border: '1px solid #999',
      fontSize: '11px',
      backgroundColor: 'white',
      height: '22px'
    },
    radioGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    mainLayout: {
      display: 'flex',
      minHeight: 'calc(100vh - 150px)', // Adjust height based on header/footer
    },
    leftPanel: {
      flex: 1,
      minWidth: '500px',
      display: 'flex',
      flexDirection: 'column',
    },
    rightPanel: {
      width: '280px',
      minWidth: '280px',
      borderLeft: '2px solid #999',
      backgroundColor: '#f5f5f5',
      padding: '10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    },
    entryBar: {
      padding: '8px',
      backgroundColor: '#e8e8e8',
      borderBottom: '1px solid #999',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
    },
    stockBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      padding: '6px 8px',
      backgroundColor: '#d0d0d0',
      borderBottom: '1px solid #999',
      fontSize: '11px',
      fontWeight: 'bold'
    },
    tableContainer: {
      flex: 1,
      overflowY: 'auto',
      maxHeight: '300px', // Set max height for scrollable table
    },
    table: {
      width: '100%',
      minWidth: '800px',
      borderCollapse: 'collapse',
      fontSize: '10px',
      backgroundColor: 'white'
    },
    th: {
      backgroundColor: '#c0c0c0',
      border: '1px solid #999',
      padding: '4px 2px',
      textAlign: 'center',
      fontWeight: 'bold',
      position: 'sticky',
      top: 0,
      zIndex: 10
    },
    td: {
      border: '1px solid #e0e0e0',
      padding: '4px 2px',
      textAlign: 'center',
      fontSize: '10px',
      cursor: 'pointer'
    },
    tdLeft: {
      border: '1px solid #e0e0e0',
      padding: '4px 2px',
      textAlign: 'left',
      fontSize: '10px',
      cursor: 'pointer'
    },
    selectedRow: {
      backgroundColor: '#b3d9ff'
    },
    actionRow: {
      display: 'flex',
      gap: '8px',
      padding: '8px',
      borderTop: '1px solid #999',
      borderBottom: '1px solid #999'
    },
    actionBtn: {
      padding: '4px 10px',
      border: '1px solid #666',
      backgroundColor: '#e0e0e0',
      cursor: 'pointer',
      fontSize: '11px',
      whiteSpace: 'nowrap'
    },
    // Bottom Total Panel
    bottomPanel: {
      display: 'flex',
      borderTop: '2px solid #999',
      backgroundColor: '#e8e8e8',
      padding: '8px',
      gap: '20px'
    },
    totalGroup: {
      display: 'grid',
      gridTemplateColumns: 'auto 80px',
      gap: '5px 10px',
      fontSize: '11px',
    },
    totalLabel: {
      textAlign: 'right',
      fontWeight: 'bold',
      whiteSpace: 'nowrap'
    },
    totalValue: {
      backgroundColor: 'white',
      border: '1px solid #999',
      padding: '2px 4px',
      textAlign: 'right',
      fontWeight: 'bold'
    },
    bottomInfo: {
      flex: 1,
      minWidth: '200px',
      borderRight: '1px solid #999',
      paddingRight: '10px'
    },
    // Footer Action Bar
    footerBar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '6px 10px',
      backgroundColor: '#4a4a4a',
      borderTop: '2px solid #333',
      flexWrap: 'wrap'
    },
    footerBtn: {
      padding: '5px 10px',
      border: '1px solid #666',
      backgroundColor: '#6a6a6a',
      color: 'white',
      cursor: 'pointer',
      fontSize: '11px',
    },
    rightBoxStyle: {
      padding: '8px',
      backgroundColor: 'white',
      border: '1px solid #ccc'
    },
    boxTitle: {
      fontSize: '12px',
      fontWeight: 'bold',
      marginBottom: '6px',
      textAlign: 'center',
      paddingBottom: '4px',
      borderBottom: '1px solid #ccc'
    }
  };

  return (
    <div style={styles.container}>
      {loading && (
        <div style={{ padding: '8px', background: '#e7f3ff', textAlign: 'center' }}>Loading sales invoice...</div>
      )}
      {error && (
        <div style={{ padding: '8px', background: '#ffebee', color: '#c62828', textAlign: 'center' }}>{error}</div>
      )}
      {/* Top Header/Menu Placeholder */}
      <div style={styles.headerBar}>
        <span>Sales Invoice</span>
        {/* Top Buttons (Cash Receipt, Cash Payment etc.) */}
      </div>

      {/* --- Top Invoice Details Section --- */}
      <div style={styles.topSection}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Invoice #</label>
          <input
            type="text"
            name="invoiceNumber"
            value={invoiceData.invoiceNumber}
            onChange={handleInvoiceChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (invoiceData.invoiceNumber) {
                  loadSaleFromSearch(invoiceData.invoiceNumber.trim());
                }
              }
            }}
            style={{ ...styles.input, width: '60px' }}
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Date</label>
          <input type="text" name="date" value={invoiceData.date} onChange={handleInvoiceChange} style={{ ...styles.input, width: '80px' }} />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>SO #</label>
          <input type="text" name="soNumber" value={invoiceData.soNumber} onChange={handleInvoiceChange} style={{ ...styles.input, width: '60px' }} />
        </div>
        <div style={styles.radioGroup}>
          <label style={styles.label}>
            <input type="radio" name="paymentType" value="Cash" checked={invoiceData.paymentType === 'Cash'} onChange={handleInvoiceChange} /> Cash
          </label>
          <label style={styles.label}>
            <input type="radio" name="paymentType" value="Credit" checked={invoiceData.paymentType === 'Credit'} onChange={handleInvoiceChange} /> Credit
          </label>
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Select Buyer</label>
          <div style={{ display: 'flex', gap: '3px' }}>
            <input type="text" value={invoiceData.selectBuyer} readOnly onClick={() => setShowCustomerModal(true)} style={{ ...styles.input, width: '120px', cursor: 'pointer' }} placeholder="(Select)" />
            <button onClick={() => setShowCustomerModal(true)} style={{ padding: '2px 6px', border: '1px solid #999', backgroundColor: '#f0f0f0', fontSize: '12px', cursor: 'pointer' }}>...</button>
          </div>
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Price List</label>
          <select name="priceList" value={invoiceData.priceList} onChange={handleInvoiceChange} style={{ ...styles.select, width: '80px' }}>
            <option value="Whole Sal">Whole Sal</option>
            <option value="Retail">Retail</option>
          </select>
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Cr. Days</label>
          <input type="text" name="crDays" value={invoiceData.crDays} onChange={handleInvoiceChange} style={{ ...styles.input, width: '40px' }} />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Due Date</label>
          <input type="text" name="dueDate" value={invoiceData.dueDate} onChange={handleInvoiceChange} style={{ ...styles.input, width: '80px' }} />
        </div>
      </div>

      {/* --- Main Body Layout --- */}
      <div style={styles.mainLayout}>
        {/* --- Left Panel (Product/Table) --- */}
        <div style={styles.leftPanel}>
          {/* Product Selection Section - Like Purchase Form */}
          <div style={{ backgroundColor: '#ffffff', border: '2px solid #999', padding: '12px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'flex-end', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Select Product</label>
                <div style={{ display: 'flex', gap: '3px' }}>
                  <input type="text" value={formatProductDisplay(productEntry)} readOnly onClick={() => setShowProductModal(true)} style={{ width: '240px', padding: '4px 6px', border: '1px solid #999', fontSize: '12px', cursor: 'pointer' }} placeholder="Click to select" />
                  <button onClick={() => setShowProductModal(true)} style={{ padding: '4px 6px', border: '1px solid #999', backgroundColor: '#f0f0f0', fontSize: '12px', cursor: 'pointer' }}>...</button>
            </div>
            </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Remarks</label>
                <input type="text" name="remarks" value={productEntry.remarks} onChange={handleProductEntryChange} style={{ width: '100px', padding: '4px 6px', border: '1px solid #999', fontSize: '12px' }} />
            </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>
                  {hasProductPacking(productEntry) ? 'Packing (Pkts)' : 'Packing'}
                </label>
                {hasProductPacking(productEntry) ? (
                  <input
                    type="number"
                    name="packQty"
                    min="0"
                    step="1"
                    value={productEntry.packQty}
                    onChange={handleProductEntryChange}
                    placeholder="Pkts"
                    style={{ width: '60px', padding: '4px 6px', border: '1px solid #999', fontSize: '12px' }}
                  />
                ) : (
                  <input
                    type="text"
                    readOnly
                    value="-"
                    style={{ width: '60px', padding: '4px 6px', border: '1px solid #999', fontSize: '12px', backgroundColor: '#f0f0f0', color: '#888', textAlign: 'center' }}
                  />
                )}
                {hasProductPacking(productEntry) ? (
                  <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>
                    1 pkt = {productEntry.packingSize} pcs
                  </div>
                ) : null}
            </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Pc(s)</label>
                <input
                  type="number"
                  name="pcs"
                  value={productEntry.pcs}
                  onChange={handleProductEntryChange}
                  readOnly={hasProductPacking(productEntry)}
                  style={{
                    width: '60px', padding: '4px 6px', border: '1px solid #999', fontSize: '12px',
                    backgroundColor: hasProductPacking(productEntry) ? '#f0f0f0' : '#fff',
                  }}
                />
            </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Rate</label>
                <input type="number" name="rate" value={productEntry.rate} onChange={handleProductEntryChange} style={{ width: '70px', padding: '4px 6px', border: '1px solid #999', fontSize: '12px' }} />
          </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Amount</label>
                <input type="text" value={productEntry.amount} readOnly style={{ width: '80px', padding: '4px 6px', border: '1px solid #999', fontSize: '12px', backgroundColor: '#f0f0f0' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Disc.%</label>
                <input type="number" name="discPercent" value={productEntry.discPercent} onChange={handleProductEntryChange} style={{ width: '50px', padding: '4px 6px', border: '1px solid #999', fontSize: '12px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Discount</label>
                <input type="text" value={productEntry.discount} readOnly style={{ width: '70px', padding: '4px 6px', border: '1px solid #999', fontSize: '12px', backgroundColor: '#f0f0f0' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Net</label>
                <input type="text" value={productEntry.netAmount} readOnly style={{ width: '80px', padding: '4px 6px', border: '1px solid #999', fontSize: '12px', backgroundColor: '#f0f0f0' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'flex-end', marginBottom: '8px', paddingTop: '6px', borderTop: '1px dashed #bbb' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Pur. Rate</label>
                <input
                  type="text"
                  readOnly
                  value={productEntry.purchaseRate !== '' ? parseFloat(productEntry.purchaseRate || 0).toFixed(2) : '0.00'}
                  style={{ width: '80px', padding: '4px 6px', border: '1px solid #999', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>St.</label>
                <input
                  type="text"
                  readOnly
                  value={entryCommission.toFixed(2)}
                  style={{ width: '80px', padding: '4px 6px', border: '1px solid #999', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>St.%</label>
                <input
                  type="text"
                  readOnly
                  value={entryStPercent.toFixed(3)}
                  style={{ width: '70px', padding: '4px 6px', border: '1px solid #999', fontSize: '12px', backgroundColor: '#f0f0f0' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Available Stock: <strong style={{ fontSize: '14px', color: (productEntry.availableStock - products.filter(p => p.productId === productEntry.productId).reduce((sum, p) => sum + (parseFloat(p.pcs) || 0), 0)) > 0 ? '#2e7d32' : '#c00' }}>{productEntry.availableStock - products.filter(p => p.productId === productEntry.productId).reduce((sum, p) => sum + (parseFloat(p.pcs) || 0), 0)}</strong></span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={resetProductEntry} style={{ padding: '5px 16px', border: '1px solid #999', backgroundColor: '#f0f0f0', fontSize: '12px', cursor: 'pointer' }}>Reset</button>
                <button onClick={handleAdd} style={{ padding: '5px 16px', border: '1px solid #999', backgroundColor: '#f0f0f0', fontSize: '12px', cursor: 'pointer' }}>Add</button>
                <button onClick={handleUpdateRow} disabled={editIndex === null} style={{ padding: '5px 16px', border: '1px solid #999', backgroundColor: '#f0f0f0', fontSize: '12px', cursor: editIndex === null ? 'not-allowed' : 'pointer', opacity: editIndex === null ? 0.5 : 1 }}>Update</button>
                <button onClick={handleRemove} disabled={editIndex === null} style={{ padding: '5px 16px', border: '1px solid #999', backgroundColor: '#f0f0f0', fontSize: '12px', cursor: editIndex === null ? 'not-allowed' : 'pointer', opacity: editIndex === null ? 0.5 : 1 }}>Remove</button>
              </div>
            </div>
          </div>

          {/* Sold Product(s) Information Table */}
          <div style={{ backgroundColor: '#ffffff', border: '2px solid #999', padding: '12px', marginBottom: '10px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>Sold Product(s) Information</label>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#e0e0e0' }}>
                  <th style={{ border: '1px solid #999', padding: '4px' }}>Sr.#</th>
                  <th style={{ border: '1px solid #999', padding: '4px', minWidth: '220px' }}>Product</th>
                  <th style={{ border: '1px solid #999', padding: '4px' }}>U.O.M</th>
                  <th style={{ border: '1px solid #999', padding: '4px' }}>Packing</th>
                  <th style={{ border: '1px solid #999', padding: '4px' }}>Pc(s)</th>
                  <th style={{ border: '1px solid #999', padding: '4px' }}>Rate</th>
                  <th style={{ border: '1px solid #999', padding: '4px' }}>Amount</th>
                  <th style={{ border: '1px solid #999', padding: '4px' }}>Disc.%</th>
                  <th style={{ border: '1px solid #999', padding: '4px' }}>Discount</th>
                  <th style={{ border: '1px solid #999', padding: '4px' }}>Net</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan="10" style={{ border: '1px solid #999', padding: '8px', textAlign: 'center', color: '#999' }}>No products added</td></tr>
                ) : (
                  products.map((product, index) => (
                  <tr
                    key={index}
                    onClick={() => handleRowClick(index)}
                      style={{ cursor: 'pointer', backgroundColor: editIndex === index ? '#e6f7ff' : 'transparent' }}
                    >
                      <td style={{ border: '1px solid #999', padding: '4px', textAlign: 'center' }}>{product.sr}</td>
                      <td style={{ border: '1px solid #999', padding: '4px', minWidth: '220px' }}>
                        <div>{product.productName}{product.packing ? ` (${product.packing})` : ''}</div>
                        {product.urduName ? (
                          <div style={{
                            fontFamily: "'Segoe UI', 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', sans-serif",
                            direction: 'rtl', textAlign: 'right', fontSize: '11px', color: '#444', marginTop: '2px',
                          }}>{product.urduName}</div>
                        ) : null}
                      </td>
                      <td style={{ border: '1px solid #999', padding: '4px' }}>{product.uom}</td>
                      <td style={{ border: '1px solid #999', padding: '4px', textAlign: 'center' }}>{formatLinePackingDisplay(product)}</td>
                      <td style={{ border: '1px solid #999', padding: '4px', textAlign: 'right' }}>{product.pcs}</td>
                      <td style={{ border: '1px solid #999', padding: '4px', textAlign: 'right' }}>{product.rate}</td>
                      <td style={{ border: '1px solid #999', padding: '4px', textAlign: 'right' }}>{product.amount}</td>
                      <td style={{ border: '1px solid #999', padding: '4px', textAlign: 'center' }}>{product.discPercent}</td>
                      <td style={{ border: '1px solid #999', padding: '4px', textAlign: 'right' }}>{product.discount}</td>
                      <td style={{ border: '1px solid #999', padding: '4px', textAlign: 'right' }}>{product.netAmount}</td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Total/Info Panel */}
          <div style={styles.bottomPanel}>
            <div style={styles.bottomInfo}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Cash Received</label>
                <input type="text" name="cashReceived" value={bottomData.cashReceived} onChange={(e) => setBottomData({...bottomData, cashReceived: e.target.value})} style={{ ...styles.input, width: '80px', marginRight: '10px' }} />
                <label style={styles.label}>Disc-2</label>
                <input type="text" name="disc2" value={bottomData.disc2} onChange={(e) => setBottomData({...bottomData, disc2: e.target.value})} style={{ ...styles.input, width: '40px', marginRight: '10px' }} />
                <label style={styles.label}>Ex Disc</label>
                <input
                  type="text"
                  name="exDisc"
                  value={bottomData.exDisc}
                  onChange={(e) => {
                    const exDisc = e.target.value;
                    setBottomData(prev => ({
                      ...prev,
                      exDisc,
                      ...computeTotalsFromProducts(products, { ...prev, exDisc }),
                    }));
                  }}
                  style={{ ...styles.input, width: '40px' }}
                />
              </div>
              <div style={{...styles.inputGroup, marginTop: '8px'}}>
                <label style={styles.label}>Bill #</label>
                <input type="text" style={{...styles.input, width: '80px'}} readOnly />
                <label style={styles.label}>Description</label>
                <input type="text" style={{...styles.input, width: '150px'}} />
              </div>
              <div style={{...styles.inputGroup, marginTop: '8px'}}>
                <button style={styles.actionBtn}>Show Image</button>
                <button style={styles.actionBtn}>Take Image</button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>St. %</label>
                  <input type="text" readOnly value={bottomData.stPercent} style={{ width: '72px', padding: '3px 6px', border: '1px inset #999', fontSize: '11px', backgroundColor: '#f0f0f0', textAlign: 'right' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Total St.</label>
                  <input type="text" readOnly value={bottomData.totalSt} style={{ width: '72px', padding: '3px 6px', border: '1px inset #999', fontSize: '11px', backgroundColor: '#f0f0f0', textAlign: 'right' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Total Discount</label>
                  <input type="text" readOnly value={bottomData.totalDiscount} style={{ width: '72px', padding: '3px 6px', border: '1px inset #999', fontSize: '11px', backgroundColor: '#f0f0f0', textAlign: 'right' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Net Amount</label>
                  <input type="text" readOnly value={bottomData.netAmount} style={{ width: '80px', padding: '3px 6px', border: '1px inset #999', fontSize: '11px', backgroundColor: '#f0f0f0', textAlign: 'right', fontWeight: 'bold' }} />
                </div>
              </div>

              <div style={{ width: '200px' }}>
                <div style={styles.totalGroup}>
                  <span style={styles.totalLabel}>Bill Amount</span><span style={styles.totalValue}>{bottomData.billAmount}</span>
                  <span style={styles.totalLabel}>Previous Balance</span><span style={{...styles.totalValue, fontWeight: 'normal'}}>{bottomData.previousBalance}</span>
                  <span style={styles.totalLabel}>Net Receivable</span><span style={styles.totalValue}>{bottomData.netReceivable}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- Right Panel (History/Aging) --- */}
        <div style={styles.rightPanel}>
          <div style={styles.rightBoxStyle}>
            <div style={styles.boxTitle}>Party Aging</div>
            <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
              <table style={{...styles.table, minWidth: 'unset'}}>
                <thead>
                  <tr>
                    <th style={{...styles.th, fontSize: '10px', padding: '3px'}}>Sr#</th>
                    <th style={{...styles.th, fontSize: '10px', padding: '3px'}}>Bill#</th>
                    <th style={{...styles.th, fontSize: '10px', padding: '3px'}}>Date</th>
                    <th style={{...styles.th, fontSize: '10px', padding: '3px'}}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {customerHistory.length === 0 ? (
                    <tr><td colSpan="4" style={{...styles.td, fontSize: '10px', textAlign: 'center', color: '#999'}}>No history</td></tr>
                  ) : (
                    customerHistory.map((h, i) => (
                      <tr key={i}>
                        <td style={{...styles.td, fontSize: '10px', padding: '3px'}}>{i + 1}</td>
                        <td style={{...styles.td, fontSize: '10px', padding: '3px'}}>{h.invoiceNo}</td>
                        <td style={{...styles.td, fontSize: '10px', padding: '3px'}}>{h.date}</td>
                        <td style={{...styles.td, fontSize: '10px', padding: '3px', textAlign: 'right'}}>{h.amount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div style={styles.rightBoxStyle}>
            <div style={styles.boxTitle}>Product Sold History</div>
            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
              <table style={{...styles.table, minWidth: 'unset'}}>
                <thead>
                  <tr>
                    <th style={{...styles.th, fontSize: '10px', padding: '3px'}}>Date</th>
                    <th style={{...styles.th, fontSize: '10px', padding: '3px'}}>Qty</th>
                    <th style={{...styles.th, fontSize: '10px', padding: '3px'}}>Rate</th>
                    <th style={{...styles.th, fontSize: '10px', padding: '3px'}}>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {productSoldHistory.length === 0 ? (
                    <tr><td colSpan="4" style={{...styles.td, fontSize: '10px', textAlign: 'center', color: '#999'}}>No history</td></tr>
                  ) : (
                    productSoldHistory.map((h, i) => (
                      <tr key={i}>
                        <td style={{...styles.td, fontSize: '10px', padding: '3px'}}>{h.date}</td>
                        <td style={{...styles.td, fontSize: '10px', padding: '3px', textAlign: 'right'}}>{h.qty}</td>
                        <td style={{...styles.td, fontSize: '10px', padding: '3px', textAlign: 'right'}}>{h.rate}</td>
                        <td style={{...styles.td, fontSize: '10px', padding: '3px', textAlign: 'right'}}>{h.net}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div style={styles.rightBoxStyle}>
            <div style={styles.boxTitle}>Hold Bills</div>
            <button style={{ ...styles.actionBtn, width: '100%', marginBottom: '5px' }}>Hold Current Bill</button>
            <table style={{...styles.table, minWidth: 'unset'}}>
              <thead><tr><th style={styles.th}>Sr#</th><th style={styles.th}>Doc</th><th style={styles.th}>Party</th><th style={styles.th}>Date</th></tr></thead>
              <tbody><tr><td style={styles.td}>1</td><td style={styles.td}></td><td style={styles.td}></td><td style={styles.td}></td></tr></tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- Footer Action Bar --- */}
      <div style={styles.footerBar}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={styles.footerBtn} onClick={handleSearchInvoice}>Refresh</button>
          <button style={{ ...styles.footerBtn, backgroundColor: '#007bff' }} onClick={handleSave}>Save</button>
          <button style={{ ...styles.footerBtn, backgroundColor: '#17a2b8' }} onClick={handleUpdate}>Update</button>
          <button style={{ ...styles.footerBtn, backgroundColor: '#dc3545' }} onClick={handleDelete}>Delete</button>
          <button style={styles.footerBtn} onClick={() => { openReceipt(true); setShowWhatsAppModal(true); }}>Preview</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <PaperSizeSelector value={paperSize} onChange={setPaperSize} />
          <button style={{ ...styles.footerBtn, backgroundColor: '#dc3545' }} onClick={handleClear}>X Close</button>
        </div>
      </div>

      <ProductSearchModal isOpen={showProductModal} onClose={() => setShowProductModal(false)} onSelectProduct={handleProductSelectFromModal} selectedProduct={selectedProductModal} rateType="sale" />
      <SupplierSearchModal isOpen={showCustomerModal} onClose={() => setShowCustomerModal(false)} onSelectSupplier={handleCustomerSelectFromModal} selectedSupplier={selectedCustomerModal} type="customer" />
      <WhatsAppModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        onYes={handleWhatsAppSend}
        onNo={() => setShowWhatsAppModal(false)}
      />
    </div>
  );
};

export default SaleInvoice;