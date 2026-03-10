import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingBag, FiArrowLeft } from 'react-icons/fi';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/product/ProductCard';

export default function WishlistPage() {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (wishlist.length === 0) return (
    <div className="min-h-screen pt-32 flex items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="text-8xl mb-6">❤️</div>
        <h2 className="font-display text-3xl font-bold text-white mb-3">Wishlist is empty</h2>
        <p className="text-white/40 mb-8">Save products you love by clicking the heart icon</p>
        <Link to="/products" className="btn-primary inline-flex items-center gap-2">
          <FiShoppingBag className="w-5 h-5" /> Explore Products
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back Button */}
        <Link to="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-6 text-sm">
          <FiArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold text-white flex items-center gap-3">
              <FiHeart className="text-red-400 fill-current" />
              My Wishlist
            </h1>
            <p className="text-white/40 mt-1">{wishlist.length} saved items</p>
          </div>
          <button onClick={() => { wishlist.forEach(p => addToCart(p._id)); }}
            className="btn-primary flex items-center gap-2">
            Add All to Cart
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {wishlist.map(product => <ProductCard key={product._id} product={product} />)}
        </div>

      </div>
    </div>
  );
}