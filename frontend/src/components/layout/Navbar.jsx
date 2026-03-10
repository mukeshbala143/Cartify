import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import {
  FiShoppingCart, FiHeart, FiSearch, FiMenu, FiX,
  FiLogOut, FiPackage, FiSettings, FiChevronDown,
  FiMapPin, FiGift, FiUser
} from 'react-icons/fi';
import API from '../../utils/api';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const { wishlist } = useWishlist();
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const suggRef = useRef(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const handleClick = (e) => {
      if (suggRef.current && !suggRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = async (val) => {
    setSearch(val);
    if (val.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    try {
      const { data } = await API.get(`/products?search=${val}&limit=5`);
      const products = Array.isArray(data) ? data : data.products || [];
      setSuggestions(products.slice(0, 5));
      setShowSuggestions(true);
    } catch { setSuggestions([]); }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (product) => {
    setSearch('');
    setShowSuggestions(false);
    navigate(`/product/${product._id}`);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-dark-900/95 backdrop-blur-md shadow-2xl border-b border-white/5' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-primary-500 to-orange-400 rounded-xl flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-all duration-300">
              <FiShoppingCart className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <span className="font-display text-xl md:text-2xl font-bold">
              <span className="text-white">Cart</span>
              <span className="text-gradient">ify</span>
            </span>
          </Link>

          {/* Search - Desktop */}
          <div ref={suggRef} className="hidden md:flex flex-1 max-w-lg mx-8 relative">
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary-500 transition-all"
                />
              </div>
            </form>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-dark-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                {suggestions.map((p) => (
                  <button key={p._id} onClick={() => selectSuggestion(p)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left">
                    <img src={p.image} alt={p.name} className="w-8 h-8 rounded-lg object-cover bg-white/5"
                      onError={e => e.target.src = 'https://picsum.photos/32'} />
                    <div>
                      <p className="text-sm text-white font-medium line-clamp-1">{p.name}</p>
                      <p className="text-xs text-primary-400">₹{p.price?.toLocaleString()}</p>
                    </div>
                  </button>
                ))}
                <button onClick={handleSearchSubmit}
                  className="w-full px-4 py-2.5 text-sm text-primary-400 hover:bg-white/5 transition-colors border-t border-white/5">
                  See all results for "{search}" →
                </button>
              </div>
            )}
          </div>

          {/* Right Icons - NO orders icon here */}
          <div className="flex items-center gap-1 md:gap-2">
            <Link to="/wishlist" className="relative p-2.5 hover:bg-white/5 rounded-xl transition-colors group">
              <FiHeart className="w-5 h-5 text-white/70 group-hover:text-red-400 transition-colors" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <Link to="/cart" className="relative p-2.5 hover:bg-white/5 rounded-xl transition-colors group">
              <FiShoppingCart className="w-5 h-5 text-white/70 group-hover:text-primary-400 transition-colors" />
              {totalItems > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-primary-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold animate-bounce">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-xl transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-orange-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <FiChevronDown className={`w-4 h-4 text-white/50 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-60 bg-dark-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="font-semibold text-white text-sm">{user.name}</p>
                      <p className="text-xs text-white/40 truncate">{user.email}</p>
                    </div>

                    <div className="py-1">
                      {/* My Orders */}
                      <Link to="/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                        <FiPackage className="w-4 h-4" /> My Orders
                      </Link>

                      {/* Wishlist */}
                      <Link to="/wishlist" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                        <FiHeart className="w-4 h-4" /> Wishlist
                      </Link>

                      {/* Saved Addresses */}
                      <Link to="/addresses" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                        <FiMapPin className="w-4 h-4" /> Saved Addresses
                      </Link>

                      {/* Gift Cards */}
                      <Link to="/gift-cards" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                        <FiGift className="w-4 h-4" /> Gift Cards
                      </Link>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-white/5 py-1">
                      {/* Seller Dashboard - only non-admin */}
                      {!isAdmin && (
                        <Link to="/seller" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                          <span>🏪</span> Seller Dashboard
                        </Link>
                      )}

                      {/* Admin Panel */}
                      {isAdmin && (
                        <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-primary-400 hover:bg-white/5 transition-colors">
                          <FiSettings className="w-4 h-4" /> Admin Panel
                        </Link>
                      )}

                      {/* Logout */}
                      <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                        <FiLogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2 ml-2">
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">Login</Link>
                <Link to="/register" className="px-4 py-2 text-sm font-semibold bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-all hover:shadow-glow">Sign Up</Link>
              </div>
            )}

            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2.5 hover:bg-white/5 rounded-xl transition-colors ml-1">
              {mobileOpen ? <FiX className="w-5 h-5 text-white" /> : <FiMenu className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
            <input type="text" value={search} onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search products..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary-500 transition-all" />
          </form>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-white/5 pt-4 animate-fade-in bg-dark-900/98 backdrop-blur-md">
            <div className="flex flex-col gap-1">
              <Link to="/products" className="px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">All Products</Link>
              <Link to="/orders" className="px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">📦 My Orders</Link>
              <Link to="/addresses" className="px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">📍 Saved Addresses</Link>
              <Link to="/gift-cards" className="px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">🎁 Gift Cards</Link>
              {user && !isAdmin && <Link to="/seller" className="px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">🏪 Seller Dashboard</Link>}
              {isAdmin && <Link to="/admin" className="px-4 py-3 text-primary-400 hover:bg-white/5 rounded-xl transition-colors">⚙️ Admin Panel</Link>}
              {!user && <>
                <Link to="/login" className="px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl">Login</Link>
                <Link to="/register" className="px-4 py-3 text-primary-400 font-semibold">Sign Up</Link>
              </>}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}