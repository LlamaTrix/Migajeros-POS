import { useState, useEffect } from 'react';
import api from '../../api/axios';
import qrImage from '../../assets/qr.jpeg';
import styles from './QRModal.module.css';

export default function QRModal({ open, items, total, notes, paymentMethod, onClose, onDone }) {
  const [step, setStep] = useState('qr'); // qr | confirming | done | error
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState('');

  // Reset al abrir/cerrar
  useEffect(() => {
    if (open) { setStep('qr'); setInvoice(null); setError(''); }
  }, [open]);

  const confirmPayment = async () => {
    setStep('confirming');
    try {
      // Crear la orden y confirmar en un solo paso
      const { data: order } = await api.post('/orders', {
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        payment_method: paymentMethod,
        notes,
      });
      const { data: confirmed } = await api.patch(`/orders/${order.id}/confirm`, {
        payment_method: paymentMethod,
      });
      setInvoice(confirmed.invoice);
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar el pago');
      setStep('error');
    }
  };

  if (!open) return null;

  return (
    <div className={styles.backdrop} onClick={(e) => {
      if (e.target === e.currentTarget && step === 'qr') onClose();
    }}>
      <div className={styles.modal}>

        {/* Pantalla principal: QR para que el cliente escanee */}
        {step === 'qr' && (
          <>
            <div className={styles.header}>
              <div className={styles.orderTitle}>
                <i className="fa-solid fa-qrcode" /> Cobro
              </div>
              <button className={styles.closeBtn} onClick={onClose}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className={styles.qrSection}>
              <p className={styles.qrInstructions}>
                {paymentMethod === 'qr'
                  ? 'Muestra este QR al cliente para realizar el pago'
                  : 'Recibe el efectivo del cliente'}
              </p>
              {paymentMethod === 'qr' && (
                <img src={qrImage} alt="QR de pago" className={styles.qrImg} />
              )}
              {paymentMethod === 'cash' && (
                <div className={styles.cashIcon}>
                  <i className="fa-solid fa-money-bill-wave" />
                </div>
              )}
              <div className={styles.totalDisplay}>
                <span className={styles.totalLabel}>Total a cobrar</span>
                <span className={styles.totalAmount}>Bs. {Number(total).toFixed(2)}</span>
              </div>
            </div>

            <div className={styles.itemsPreview}>
              {items.map((item) => (
                <div key={item.product_id} className={styles.previewItem}>
                  <span>{item.quantity}× {item.name}</span>
                  <span>Bs. {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className={styles.previewTotal}>
                <span>TOTAL</span>
                <span>Bs. {Number(total).toFixed(2)}</span>
              </div>
            </div>

            <button className={styles.confirmBtn} onClick={confirmPayment}>
              <i className="fa-solid fa-check" /> Confirmar pago recibido
            </button>
          </>
        )}

        {/* Procesando */}
        {step === 'confirming' && (
          <div className={styles.center}>
            <div className={styles.spinner} />
            <p>Procesando pago...</p>
          </div>
        )}

        {/* Éxito */}
        {step === 'done' && invoice && (
          <div className={styles.doneSection}>
            <div className={styles.successIcon}>
              <i className="fa-solid fa-circle-check" />
            </div>
            <h2 className={styles.successTitle}>Pago Confirmado</h2>
            <div className={styles.invoiceInfo}>
              <div className={styles.invoiceNum}>{invoice.invoice_number}</div>
              <p>Factura generada</p>
              {invoice.pdf_url && (
                <a href={invoice.pdf_url} target="_blank" rel="noopener noreferrer" className={styles.pdfLink}>
                  <i className="fa-solid fa-file-pdf" /> Ver factura
                </a>
              )}
            </div>
            <button className={styles.doneBtn} onClick={onDone}>
              <i className="fa-solid fa-plus" /> Nueva orden
            </button>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className={styles.center}>
            <div className={styles.errorIcon}>
              <i className="fa-solid fa-triangle-exclamation" />
            </div>
            <p className={styles.errorMsg}>{error}</p>
            <div className={styles.errorBtns}>
              <button className={styles.retryBtn} onClick={() => setStep('qr')}>Volver</button>
              <button className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
