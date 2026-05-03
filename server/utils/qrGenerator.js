const QRCode = require('qrcode');

const generateOrderQR = async (order) => {
  const content = `MIGAJEROS|ORDER:${String(order.id).padStart(5, '0')}|TOTAL:${order.total}|LOCAL:${order.local_name || order.local_id}`;
  const dataUrl = await QRCode.toDataURL(content, {
    errorCorrectionLevel: 'M',
    width: 300,
    margin: 2,
    color: { dark: '#d21f17', light: '#F1FAEE' },
  });
  return dataUrl;
};

module.exports = { generateOrderQR };
