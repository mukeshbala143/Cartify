import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiStar } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const wishlisted = isInWishlist(product._id);

  return (
    <div className="product-card card group relative overflow-hidden">
      {/* Entire card is a link */}
      <Link to={`/product/${product._id}`} className="block">
        {/* Image */}
        <div className="relative overflow-hidden bg-white/5 aspect-square">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={e => { e.target.src = `https://picsum.photos/seed/${product._id}/400/400`; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>

          {/* Stock badge */}
          {product.countInStock <= 0 && (
            <div className="absolute top-3 left-3 bg-red-500/90 text-white text-xs font-semibold px-2.5 py-1 rounded-lg">Out of Stock</div>
          )}
          {product.countInStock > 0 && product.countInStock <= 5 && (
            <div className="absolute top-3 left-3 bg-orange-500/90 text-white text-xs font-semibold px-2.5 py-1 rounded-lg">Only {product.countInStock} left</div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {product.category && (
            <span className="text-xs text-white/30 uppercase tracking-wider">{product.category}</span>
          )}
          <h3 className="font-medium text-white text-sm leading-snug line-clamp-2 mt-1 mb-3 group-hover:text-primary-300 transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-white">₹{product.price?.toLocaleString()}</span>
            <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-2 py-1">
              <FiStar className="w-3 h-3 text-yellow-400 fill-current" />
              <span className="text-xs text-yellow-400 font-medium">{product.rating ? product.rating.toFixed(1) : '4.5'}</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Wishlist button — outside Link to prevent navigation */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product); }}
        className={`absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-lg z-10
          ${wishlisted ? 'bg-red-500 text-white' : 'bg-dark-900/70 text-white/60 hover:bg-red-500/20 hover:text-red-400'}`}
      >
        <FiHeart className={`w-4 h-4 ${wishlisted ? 'fill-current' : ''}`} />
      </button>

      {/* Add to Cart button — outside Link */}
      <div className="px-4 pb-4 -mt-1">
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (product.countInStock > 0) addToCart(product._id); }}
          disabled={product.countInStock <= 0}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all
            ${product.countInStock > 0
              ? 'bg-primary-500/10 hover:bg-primary-500 border border-primary-500/30 hover:border-primary-500 text-primary-400 hover:text-white'
              : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'}`}
        >
          <FiShoppingCart className="w-4 h-4" />
          {product.countInStock > 0 ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}