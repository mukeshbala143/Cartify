import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiShoppingCart, FiHeart, FiStar, FiTruck, FiShield,
  FiArrowLeft, FiMinus, FiPlus, FiPackage, FiShare2
} from 'react-icons/fi';
import API from '../utils/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/product/ProductCard';
import { StarDisplay, StarInput } from '../components/common/StarRating';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const { data } = await API.get(`/products/${id}`);
        setProduct(data);
        
        // Fetch reviews
        try {
          const revRes = await API.get(`/reviews/${id}`);
          setReviews(revRes.data || []);
        } catch {}
        
        // Related products
        const { data: all } = await API.get('/products');
        const prods = Array.isArray(all) ? all : all.products || [];
        setRelated(prods.filter(p => p._id !== id && p.category === data.category).slice(0, 4));
      } catch (err) {
        toast.error('Product not found');
        navigate('/products');
      } finally { setLoading(false); }
    };
    fetch();
    window.scrollTo(0, 0);
  }, [id]);

  const handleAddToCart = () => {
    if (!user) { toast.error('Please login first'); navigate('/login'); return; }
    addToCart(product._id, qty);
  };

  const handleBuyNow = () => {
    if (!user) { navigate('/login'); return; }
    addToCart(product._id, qty);
    navigate('/cart');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Login to submit a review'); return; }
    if (!reviewComment.trim()) { toast.error('Please write a review'); return; }
    try {
      setSubmittingReview(true);
      await API.post(`/reviews/${id}`, { rating: reviewRating, comment: reviewComment });
      setReviews(prev => [{
        user: { name: user.name },
        rating: reviewRating,
        comment: reviewComment,
        createdAt: new Date().toISOString()
      }, ...prev]);
      setReviewComment('');
      setReviewRating(5);
      toast.success('Review submitted! ⭐');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally { setSubmittingReview(false); }
  };

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white/40">Loading product...</p>
      </div>
    </div>
  );

  if (!product) return null;

  const avgRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 4.5;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8 group">
          <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Products
        </button>

        {/* Product Main */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
          
          {/* Image Gallery */}
          <div className="relative">
            {/* Main image */}
            <div className="aspect-square rounded-3xl overflow-hidden bg-white/5 border border-white/5 mb-3">
              <img
                src={(product.images?.length ? product.images[activeImg] : product.image) || product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-300"
                onError={e => { e.target.src = `https://picsum.photos/seed/${product._id}/600/600`; }}
              />
            </div>
            {/* Thumbnails */}
            {product.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === activeImg ? 'border-primary-500' : 'border-white/10 hover:border-white/30'}`}>
                    <img src={img} alt={`view-${i}`} className="w-full h-full object-cover"
                      onError={e => { e.target.src = `https://picsum.photos/seed/${i}/100/100`; }} />
                  </button>
                ))}
              </div>
            )}
            {product.countInStock <= 0 && (
              <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-xl">
                Out of Stock
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            {product.category && (
              <span className="text-primary-400 text-sm font-semibold uppercase tracking-wider mb-2">{product.category}</span>
            )}
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-6">
              <StarDisplay rating={avgRating} count={reviews.length} />
              <span className="text-white/30 text-sm">|</span>
              <span className={`text-sm font-medium ${product.countInStock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {product.countInStock > 0 ? `✓ In Stock (${product.countInStock} left)` : '✗ Out of Stock'}
              </span>
            </div>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-bold text-white">₹{product.price?.toLocaleString()}</span>
              <span className="text-white/30 line-through text-lg">₹{Math.round(product.price * 1.3).toLocaleString()}</span>
              <span className="text-green-400 text-sm font-semibold bg-green-400/10 px-2 py-0.5 rounded-lg">23% OFF</span>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-white/60 text-sm">Quantity:</span>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="text-white/60 hover:text-white transition-colors">
                  <FiMinus className="w-4 h-4" />
                </button>
                <span className="text-white font-semibold w-6 text-center">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.countInStock, q + 1))} className="text-white/60 hover:text-white transition-colors">
                  <FiPlus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-8">
              <button onClick={handleAddToCart} disabled={product.countInStock <= 0}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-all ${
                  product.countInStock > 0 ? 'btn-primary' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}>
                <FiShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
              <button onClick={handleBuyNow} disabled={product.countInStock <= 0}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-all ${
                  product.countInStock > 0 ? 'btn-secondary' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}>
                Buy Now
              </button>
              <button onClick={() => toggleWishlist(product)}
                className={`w-14 h-14 rounded-xl border flex items-center justify-center transition-all ${
                  isInWishlist(product._id) ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-white/5 border-white/10 text-white/50 hover:border-red-500/50 hover:text-red-400'
                }`}>
                <FiHeart className={`w-5 h-5 ${isInWishlist(product._id) ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: FiTruck, text: 'Free Delivery' },
                { icon: FiShield, text: 'Secure Payment' },
                { icon: FiPackage, text: 'Easy Returns' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex flex-col items-center gap-2 p-3 bg-white/3 rounded-xl text-center">
                  <Icon className="w-5 h-5 text-primary-400" />
                  <span className="text-xs text-white/50">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit">
            {['description', 'reviews'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium capitalize transition-all ${
                  activeTab === tab ? 'bg-primary-500 text-white shadow-glow' : 'text-white/50 hover:text-white'
                }`}>
                {tab} {tab === 'reviews' && `(${reviews.length})`}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'description' && (
          <div className="card p-6 md:p-8 mb-12">
            <h3 className="font-display text-xl font-bold text-white mb-4">Product Description</h3>
            <p className="text-white/60 leading-relaxed">{product.description}</p>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6 mb-12">
            {/* Review Form */}
            {user && (
              <div className="card p-6">
                <h3 className="font-semibold text-white mb-4">Write a Review</h3>
                <form onSubmit={handleReviewSubmit}>
                  <div className="mb-4">
                    <label className="text-sm text-white/40 mb-2 block">Your Rating</label>
                    <StarInput value={reviewRating} onChange={setReviewRating} />
                  </div>
                  <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)}
                    placeholder="Share your experience with this product..."
                    rows={3} className="input-field resize-none mb-4" />
                  <button type="submit" disabled={submittingReview} className="btn-primary">
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-white/30">No reviews yet. Be the first to review!</p>
              </div>
            ) : reviews.map((rev, i) => (
              <div key={i} className="card p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-orange-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {rev.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{rev.user?.name || 'Anonymous'}</p>
                      <p className="text-xs text-white/30">{new Date(rev.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                  <StarDisplay rating={rev.rating} />
                </div>
                <p className="text-white/60 text-sm">{rev.comment}</p>
              </div>
            ))}
          </div>
        )}

        {/* Related Products */}
        {related.length > 0 && (
          <div>
            <h2 className="section-title mb-6">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
              {related.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}