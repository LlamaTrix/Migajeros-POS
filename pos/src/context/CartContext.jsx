import { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext(null);

const INIT = () => {
  try {
    const stored = sessionStorage.getItem('pos_cart');
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.find((i) => i.product_id === action.product.id);
      if (existing) {
        return state.map((i) =>
          i.product_id === action.product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...state, { product_id: action.product.id, name: action.product.name, price: action.product.price, image_url: action.product.image_url, quantity: 1 }];
    }
    case 'REMOVE_ITEM':
      return state.filter((i) => i.product_id !== action.product_id);
    case 'UPDATE_QTY':
      return state.map((i) =>
        i.product_id === action.product_id ? { ...i, quantity: Math.max(1, action.quantity) } : i
      );
    case 'CLEAR_CART':
      return [];
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, null, INIT);

  useEffect(() => {
    sessionStorage.setItem('pos_cart', JSON.stringify(items));
  }, [items]);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, dispatch, total }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
