import { useEffect, useState } from 'react';
import api from '../api/axios';
import ProductCard from '../components/pos/ProductCard';
import CartPanel from '../components/pos/CartPanel';
import styles from './POS.module.css';

export default function POS() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [p, c] = await Promise.all([api.get('/products'), api.get('/products/categories')]);
      setProducts(p.data);
      setCategories(c.data);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = products.filter((p) => {
    const matchCat = activeCat === 'all' || String(p.category_id) === activeCat;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch && p.available;
  });

  return (
    <div className={styles.posLayout}>
      <div className={styles.mainArea}>
        <div className={styles.searchRow}>
          <input
            className={styles.searchInput}
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className={styles.cartToggleBtn} onClick={() => setCartOpen((v) => !v)}>
            <i className="fa-solid fa-cart-shopping" /> Carrito
          </button>
        </div>

        <div className={styles.catBar}>
          <button
            className={`${styles.catBtn} ${activeCat === 'all' ? styles.catActive : ''}`}
            onClick={() => setActiveCat('all')}
          >
            Todos
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={`${styles.catBtn} ${activeCat === String(c.id) ? styles.catActive : ''}`}
              onClick={() => setActiveCat(String(c.id))}
            >
              {c.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.loading}>Cargando productos...</div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
            {!filtered.length && (
              <div className={styles.empty}>No se encontraron productos</div>
            )}
          </div>
        )}
      </div>

      <div className={`${styles.cartArea} ${cartOpen ? styles.cartVisible : ''}`}>
        <CartPanel />
      </div>
    </div>
  );
}
