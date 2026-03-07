import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cartify_wishlist') || '[]');
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('cartify_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const toggleWishlist = (product) => {
    const exists = wishlist.find(p => p._id === product._id);
    if (exists) {
      setWishlist(prev => prev.filter(p => p._id !== product._id));
      toast.success('Removed from wishlist');
    } else {
      setWishlist(prev => [...prev, product]);
      toast.success('Added to wishlist ❤️');
    }
  };

  const isInWishlist = (productId) => wishlist.some(p => p._id === productId);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
