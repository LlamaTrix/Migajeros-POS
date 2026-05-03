import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import QRModal from './QRModal';
import styles from './CartPanel.module.css';

export default function CartPanel() {
  const { items, dispatch, total } = useCart();
  const [qrOpen, setQrOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('qr');

  const handleCheckout = () => {
    if (!items.length) return;
    setQrOpen(true);
  };

  const handleOrderDone = () => {
    dispatch({ type: 'CLEAR_CART' });
    setQrOpen(false);
    setNotes('');
  };

  return (
    <>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <i className="fa-solid fa-receipt" /> Orden
          </h2>
          {items.length > 0 && (
            <button className={styles.clearBtn} onClick={() => dispatch({ type: 'CLEAR_CART' })}>
              <i className="fa-solid fa-trash-can" /> Limpiar
            </button>
          )}
        </div>

        <div className={styles.items}>
          {!items.length && (
            <div className={styles.empty}>
              <i className="fa-solid fa-bag-shopping" className={styles.emptyIcon} />
              <p>Agrega productos para comenzar una orden</p>
            </div>
          )}
          {items.map((item) => (
            <div key={item.product_id} className={styles.item}>
              <div className={styles.itemImg}>
                {item.image_url
                  ? <img src={item.image_url} alt={item.name} />
                  : <i className="fa-solid fa-utensils" />}
              </div>
              <div className={styles.itemInfo}>
                <div className={styles.itemName}>{item.name}</div>
                <div className={styles.itemPrice}>Bs. {Number(item.price).toFixed(2)}</div>
              </div>
              <div className={styles.qtyControl}>
                <button onClick={() => item.quantity === 1
                  ? dispatch({ type: 'REMOVE_ITEM', product_id: item.product_id })
                  : dispatch({ type: 'UPDATE_QTY', product_id: item.product_id, quantity: item.quantity - 1 })
                }>−</button>
                <span>{item.quantity}</span>
                <button onClick={() => dispatch({ type: 'UPDATE_QTY', product_id: item.product_id, quantity: item.quantity + 1 })}>+</button>
              </div>
              <div className={styles.itemSubtotal}>
                Bs. {(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className={styles.footer}>
            <textarea
              className={styles.notes}
              placeholder="Notas de la orden..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
            <div className={styles.paymentSelect}>
              <label>Método de pago:</label>
              <div className={styles.paymentBtns}>
                <button
                  className={`${styles.payBtn} ${paymentMethod === 'qr' ? styles.payBtnActive : ''}`}
                  onClick={() => setPaymentMethod('qr')}
                >
                  <i className="fa-solid fa-qrcode" /> QR
                </button>
                <button
                  className={`${styles.payBtn} ${paymentMethod === 'cash' ? styles.payBtnActive : ''}`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <i className="fa-solid fa-money-bill-wave" /> Efectivo
                </button>
              </div>
            </div>
            <div className={styles.totalRow}>
              <span>Total</span>
              <span className={styles.totalAmount}>Bs. {total.toFixed(2)}</span>
            </div>
            <button className={styles.checkoutBtn} onClick={handleCheckout}>
              <i className="fa-solid fa-cash-register" /> Cobrar · Bs. {total.toFixed(2)}
            </button>
          </div>
        )}
      </div>

      <QRModal
        open={qrOpen}
        items={items}
        total={total}
        notes={notes}
        paymentMethod={paymentMethod}
        onClose={() => setQrOpen(false)}
        onDone={handleOrderDone}
      />
    </>
  );
}
