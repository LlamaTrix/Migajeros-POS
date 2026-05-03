import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import styles from './ProductCard.module.css';

export default function ProductCard({ product }) {
  const { dispatch } = useCart();
  const [adding, setAdding] = useState(false);

  const handleAdd = () => {
    dispatch({ type: 'ADD_ITEM', product });
    setAdding(true);
    setTimeout(() => setAdding(false), 300);
  };

  return (
    <div className={`${styles.card} ${!product.available ? styles.unavailable : ''}`}>
      <div className={styles.imgWrap}>
        {product.image_url
          ? <img src={product.image_url} alt={product.name} />
          : <div className={styles.imgPlaceholder}><i className="fa-solid fa-utensils" /></div>}
        {!product.available && <div className={styles.unavailableBadge}>No disponible</div>}
      </div>
      <div className={styles.body}>
        <div className={styles.catTag}>{product.category_name || ''}</div>
        <h3 className={styles.name}>{product.name}</h3>
        {product.description && <p className={styles.desc}>{product.description}</p>}
        <div className={styles.footer}>
          <span className={styles.price}>Bs. {Number(product.price).toFixed(2)}</span>
          <button
            className={`${styles.addBtn} ${adding ? styles.added : ''}`}
            onClick={handleAdd}
            disabled={!product.available}
          >
            {adding
              ? <i className="fa-solid fa-check" />
              : <i className="fa-solid fa-plus" />}
          </button>
        </div>
      </div>
    </div>
  );
}
