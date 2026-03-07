import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../utils/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [] });
  const [totalItems, setTotalItems] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) { setCart({ items: [] }); setTotalItems(0); setTotalAmount(0); return; }
    try {
      setLoading(true);
      const { data } = await API.get('/cart');
      setCart(data.cart || { items: [] });
      setTotalItems(data.totalItems || 0);
      setTotalAmount(data.totalAmount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, qty = 1) => {
    if (!user) { toast.error('Please login to add items to cart'); return; }
    try {
      const { data } = await API.post('/cart', { productId, qty });
      setCart(data.cart);
      await fetchCart();
      toast.success('Added to cart! 🛒');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  const updateQty = async (productId, qty) => {
    try {
      const { data } = await API.put('/cart', { productId, qty });
      setCart(data.cart);
      setTotalItems(data.totalItems);
      setTotalAmount(data.totalAmount);
    } catch (err) {
      toast.error('Failed to update cart');
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const { data } = await API.delete(`/cart/${productId}`);
      setCart(data.cart);
      await fetchCart();
      toast.success('Removed from cart');
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  // ✅ Backend bhi clear karta hai + local state bhi
  const clearCart = async () => {
    try {
      await API.delete('/cart');
    } catch (err) {
      console.error('Cart clear failed on backend:', err);
    }
    // Backend fail ho ya na ho, UI zaroor clear hogi
    setCart({ items: [] });
    setTotalItems(0);
    setTotalAmount(0);
  };

  return (
    <CartContext.Provider value={{
      cart, totalItems, totalAmount, loading,
      addToCart, updateQty, removeFromCart, fetchCart, clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);