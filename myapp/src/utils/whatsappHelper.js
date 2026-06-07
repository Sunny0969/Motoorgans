const BUSINESS_PHONE = '923315268690';

export function formatPhoneForWhatsApp(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '92' + cleaned.substring(1);
  }
  if (!cleaned.startsWith('92') && cleaned.length === 10) {
    cleaned = '92' + cleaned;
  }
  return cleaned;
}

export function buildInvoiceText({ businessName, invoiceNo, date, customerName, products, totalAmount, discount, billAmount, previousBalance, netReceivable, cashReceived }) {
  let msg = '';
  msg += `*${businessName || 'Moto Organs Traders'}*\n`;
  msg += `Qasim Abad, Hyderabad, Sindh\n`;
  msg += `📞 0335-8088935 / 0343-3257062\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `*Invoice #:* ${invoiceNo}\n`;
  msg += `*Date:* ${date}\n`;
  msg += `*Customer:* ${customerName}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `*Items:*\n`;

  if (products && products.length > 0) {
    products.forEach((p, i) => {
      const name = p.productName || p.name || '';
      const qty = p.pcs || p.qty || 0;
      const rate = parseFloat(p.rate) || 0;
      const net = parseFloat(p.netAmount) || 0;
      msg += `${i + 1}. ${name}\n`;
      msg += `   Qty: ${qty} × Rs.${rate.toFixed(0)} = Rs.${net.toFixed(0)}\n`;
    });
  }

  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  if (totalAmount) msg += `*Total:* Rs.${parseFloat(totalAmount).toLocaleString()}\n`;
  if (discount && parseFloat(discount) > 0) msg += `*Discount:* Rs.${parseFloat(discount).toLocaleString()}\n`;
  if (billAmount) msg += `*Bill Amount:* Rs.${parseFloat(billAmount).toLocaleString()}\n`;
  if (previousBalance && parseFloat(previousBalance) !== 0) msg += `*Previous Balance:* Rs.${parseFloat(previousBalance).toLocaleString()}\n`;
  if (netReceivable) msg += `*Net Receivable:* Rs.${parseFloat(netReceivable).toLocaleString()}\n`;
  if (cashReceived && parseFloat(cashReceived) > 0) msg += `*Cash Received:* Rs.${parseFloat(cashReceived).toLocaleString()}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `Thank you for your business! 🙏\n`;
  msg += `_Moto Organs Traders_`;

  return msg;
}

export function sendWhatsAppMessage(customerPhone, messageText) {
  const phone = formatPhoneForWhatsApp(customerPhone);
  if (!phone) {
    alert('Customer phone number not available.');
    return false;
  }
  const encodedText = encodeURIComponent(messageText);
  const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodedText}`;
  window.open(url, '_blank');
  return true;
}

export async function sendWhatsAppImage(customerPhone, imageBlob, caption) {
  const phone = formatPhoneForWhatsApp(customerPhone);
  if (!phone) {
    alert('Customer phone number not available.');
    return false;
  }

  const file = new File([imageBlob], 'invoice.png', { type: 'image/png' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: caption || 'Invoice',
        text: `Invoice for ${phone}`,
      });
      return true;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  }

  const encodedText = encodeURIComponent(caption || 'Please find the attached invoice.');
  const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodedText}`;
  window.open(url, '_blank');

  const link = document.createElement('a');
  link.href = URL.createObjectURL(imageBlob);
  link.download = `invoice_${Date.now()}.png`;
  link.click();
  URL.revokeObjectURL(link.href);

  alert('Invoice image downloaded. Please attach it in the WhatsApp chat that just opened.');
  return true;
}

export { BUSINESS_PHONE };
