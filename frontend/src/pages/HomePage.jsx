import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight, FiShoppingBag, FiTruck, FiShield,
  FiRefreshCw, FiGift, FiChevronRight, FiZap, FiStar,
  FiPackage, FiHeadphones, FiBox
} from 'react-icons/fi';
import API from '../utils/api';
import ProductCard from '../components/product/ProductCard';
import { ProductSkeleton } from '../components/common/Skeleton';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { name: 'Electronics', icon: '💻', color: '#3b82f6' },
  { name: 'Fashion', icon: '👗', color: '#ec4899' },
  { name: 'Home & Garden', icon: '🏡', color: '#22c55e' },
  { name: 'Sports', icon: '⚽', color: '#f59e0b' },
  { name: 'Books', icon: '📚', color: '#a855f7' },
  { name: 'Beauty', icon: '✨', color: '#ef4444' },
];

export default function HomePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [byCategory, setByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    API.get('/products').then(({ data }) => {
      const prods = Array.isArray(data) ? data : data.products || [];
      setProducts(prods);
      const grouped = {};
      prods.forEach(p => {
        if (!grouped[p.category]) grouped[p.category] = [];
        grouped[p.category].push(p);
      });
      setByCategory(grouped);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  // Auto rotate hero product
  useEffect(() => {
    if (products.length === 0) return;
    const t = setInterval(() => setHeroIdx(i => (i + 1) % Math.min(products.length, 5)), 3500);
    return () => clearInterval(t);
  }, [products]);

  const displayed = activeTab === 'All' ? products.slice(0, 8) : (byCategory[activeTab] || []).slice(0, 8);
  const heroProduct = products[heroIdx];

  return (
    <div className="min-h-screen bg-[#080c14]">

      {/* ══════════════════════════════════════════════════
          HERO — Split layout with animated product
      ══════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">

        {/* Animated background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full"
            style={{background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)'}}></div>
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full"
            style={{background: 'radial-gradient(circle, rgba(234,88,12,0.06) 0%, transparent 70%)'}}></div>
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize:'80px 80px'}}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center py-20">

            {/* LEFT */}
            <div>
              {/* Tag */}
              <div className="inline-flex items-center gap-2 mb-6" style={{background:'rgba(249,115,22,0.1)', border:'1px solid rgba(249,115,22,0.25)', borderRadius:100, padding:'6px 16px'}}>
                <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse"></span>
                <span className="text-xs text-primary-300 font-bold tracking-widest uppercase">New Season Sale</span>
              </div>

              {/* Headline */}
              <div className="mb-6">
                <h1 className="font-display font-black leading-[0.95] tracking-tight">
                  <span className="block text-white" style={{fontSize:'clamp(52px,7vw,88px)'}}>Find Your</span>
                  <span className="block" style={{fontSize:'clamp(52px,7vw,88px)', WebkitTextStroke:'2px #f97316', color:'transparent'}}>Perfect</span>
                  <span className="block text-white" style={{fontSize:'clamp(52px,7vw,88px)'}}>Product.</span>
                </h1>
              </div>

              <p className="text-white/40 text-lg leading-relaxed mb-8 max-w-md">
                Shop from 16+ premium products across 6 categories. Electronics, Fashion, Books & more — curated just for you.
              </p>

              {/* ── CTA Buttons ── */}
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <Link to="/products"
                  className="flex items-center gap-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold px-7 py-4 rounded-2xl transition-all hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] active:scale-95 text-sm">
                  <FiShoppingBag className="w-4 h-4" />
                  Explore Store
                  <FiArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/products?category=Electronics"
                  className="flex items-center gap-2 text-white/50 hover:text-white border border-white/10 hover:border-white/20 px-7 py-4 rounded-2xl transition-all text-sm font-medium">
                  View Deals
                </Link>
              </div>



              {/* Stats row */}
              <div className="flex items-center gap-0 divide-x divide-white/5">
                {[
                  { num: '16+', label: 'Products' },
                  { num: '50K+', label: 'Customers' },
                  { num: '6', label: 'Categories' },
                  { num: '4.8', label: 'Rating ★' },
                ].map(({ num, label }) => (
                  <div key={label} className="px-5 first:pl-0">
                    <p className="text-2xl font-black text-white font-display">{num}</p>
                    <p className="text-xs text-white/25 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — Hero product card */}
            <div className="relative flex justify-center items-center">

              {/* Floating product */}
              {!loading && heroProduct && (
                <div className="relative w-full max-w-sm">
                  {/* Glow */}
                  <div className="absolute inset-0 rounded-3xl blur-2xl opacity-30"
                    style={{background:'linear-gradient(135deg, #f97316, #ea580c)', transform:'scale(0.9) translateY(20px)'}}></div>

                  {/* Card */}
                  <Link to={`/product/${heroProduct._id}`}
                    className="relative block bg-[#111827] border border-white/8 rounded-3xl overflow-hidden hover:border-primary-500/40 transition-all duration-500 group">
                    <div className="aspect-square overflow-hidden">
                      <img src={heroProduct.image} alt={heroProduct.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        onError={e => { e.target.src = `https://picsum.photos/seed/${heroProduct._id}/500/500`; }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent"></div>
                    </div>
                    <div className="p-5">
                      <p className="text-xs text-primary-400 font-semibold uppercase tracking-wider mb-1">{heroProduct.category}</p>
                      <p className="text-white font-bold text-lg line-clamp-1 mb-1">{heroProduct.name}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-black text-white">₹{heroProduct.price?.toLocaleString()}</p>
                        <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-2.5 py-1">
                          <FiStar className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-yellow-300 font-bold">{heroProduct.rating || 4.5}</span>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Dot indicators */}
                  <div className="flex justify-center gap-1.5 mt-4">
                    {products.slice(0,5).map((_, i) => (
                      <button key={i} onClick={() => setHeroIdx(i)}
                        className={`rounded-full transition-all ${i === heroIdx ? 'w-6 h-2 bg-primary-500' : 'w-2 h-2 bg-white/20 hover:bg-white/40'}`} />
                    ))}
                  </div>

                  {/* Floating badges */}
                  <div className="absolute -top-4 -left-4 bg-[#111827] border border-white/10 rounded-2xl px-4 py-2.5 shadow-2xl">
                    <p className="text-xs text-white/40">Today's Deal</p>
                    <p className="text-base font-black text-primary-400">50% OFF</p>
                  </div>
                  <div className="absolute -bottom-4 -right-4 bg-[#111827] border border-green-500/20 rounded-2xl px-4 py-2.5 shadow-2xl">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                      <p className="text-xs text-green-400 font-semibold">In Stock</p>
                    </div>
                  </div>
                </div>
              )}

              {loading && <div className="w-full max-w-sm aspect-square skeleton rounded-3xl"></div>}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FEATURES STRIP
      ══════════════════════════════════════════════════ */}
      <div style={{background:'#0d1117', borderTop:'1px solid rgba(255,255,255,0.04)', borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: FiTruck, title: 'Free Delivery', sub: 'Orders above ₹499', c: '#3b82f6' },
              { icon: FiShield, title: 'Secure Payment', sub: '100% encrypted', c: '#22c55e' },
              { icon: FiRefreshCw, title: 'Easy Returns', sub: '7-day policy', c: '#f97316' },
              { icon: FiGift, title: 'Member Offers', sub: 'Exclusive discounts', c: '#f59e0b' },
            ].map(({ icon: Icon, title, sub, c }) => (
              <div key={title} className="flex items-center gap-3 group">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                  style={{background:`${c}15`, border:`1px solid ${c}30`}}>
                  <Icon className="w-5 h-5" style={{color: c}} />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{title}</p>
                  <p className="text-white/25 text-xs">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>



      {/* ══════════════════════════════════════════════════
          CATEGORIES
      ══════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-primary-500 text-xs font-black uppercase tracking-[0.2em] mb-1">Browse</p>
            <h2 className="font-display text-3xl font-black text-white">Shop by Category</h2>
          </div>
          <Link to="/products" className="text-sm text-white/30 hover:text-primary-400 flex items-center gap-1 transition-colors font-medium">
            All categories <FiChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {CATEGORIES.map(({ name, icon, color }) => (
            <Link key={name} to={`/products?category=${name}`}
              className="group relative flex flex-col items-center gap-3 p-5 rounded-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer"
              style={{background:'#0d1117', border:`1px solid rgba(255,255,255,0.06)`}}
              onMouseEnter={e => { e.currentTarget.style.borderColor = color + '50'; e.currentTarget.style.boxShadow = `0 10px 40px ${color}15`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <span className="text-3xl group-hover:scale-125 transition-transform duration-300">{icon}</span>
              <span className="text-xs font-bold text-white/70 group-hover:text-white transition-colors text-center leading-tight">{name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          MARQUEE BANNER
      ══════════════════════════════════════════════════ */}
      <div className="overflow-hidden py-3 mb-8" style={{background:'linear-gradient(90deg, #f97316, #ea580c, #dc2626, #ea580c, #f97316)'}}>
        <div className="flex gap-12 animate-[marquee_20s_linear_infinite] whitespace-nowrap">
          {Array(6).fill(['⚡ Flash Sale 50% OFF', '🚚 Free Delivery Above ₹499', '🎁 Use Code CARTIFY50', '⭐ Premium Products', '🔒 Secure Checkout']).flat().map((text, i) => (
            <span key={i} className="text-white font-bold text-sm">{text}</span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          FEATURED PRODUCTS
      ══════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-primary-500 text-xs font-black uppercase tracking-[0.2em] mb-1">Handpicked</p>
            <h2 className="font-display text-3xl font-black text-white">Featured Products</h2>
          </div>
          <Link to="/products" className="text-sm text-white/30 hover:text-primary-400 flex items-center gap-1 transition-colors font-medium">
            View all <FiChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
          {['All', ...Object.keys(byCategory)].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={activeTab === tab
                ? {background:'#f97316', color:'white', boxShadow:'0 0 20px rgba(249,115,22,0.4)'}
                : {background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.4)', border:'1px solid rgba(255,255,255,0.06)'}}>
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading
            ? Array(8).fill(0).map((_,i) => <ProductSkeleton key={i} />)
            : displayed.map(p => <ProductCard key={p._id} product={p} />)
          }
        </div>

        {!loading && products.length > 0 && (
          <div className="text-center mt-10">
            <Link to="/products"
              className="inline-flex items-center gap-2 border border-white/10 hover:border-primary-500/50 text-white/60 hover:text-white px-8 py-3.5 rounded-2xl transition-all text-sm font-semibold">
              See All {products.length} Products <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════
          PROMO BANNER
      ══════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative overflow-hidden rounded-3xl p-10 md:p-14"
          style={{background:'linear-gradient(135deg, #111827 0%, #1c1033 50%, #111827 100%)', border:'1px solid rgba(255,255,255,0.06)'}}>
          {/* Glow orbs */}
          <div className="absolute top-0 left-1/3 w-64 h-64 rounded-full blur-3xl opacity-20"
            style={{background:'radial-gradient(circle, #f97316, transparent)'}}></div>
          <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full blur-2xl opacity-15"
            style={{background:'radial-gradient(circle, #7c3aed, transparent)'}}></div>

          <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 mb-3 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-1.5">
                <FiZap className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-xs text-primary-300 font-black uppercase tracking-wider">Limited Time Offer</span>
              </div>
              <h3 className="font-display text-4xl md:text-5xl font-black text-white mb-3">
                Get <span className="text-gradient">50% Off</span><br />Your First Order
              </h3>
              <p className="text-white/40">
                Use code{' '}
                <span className="font-mono font-black text-white bg-white/10 border border-white/15 px-2.5 py-1 rounded-lg">CARTIFY50</span>
                {' '}at checkout
              </p>
            </div>
            <Link to="/products"
              className="flex-shrink-0 flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-black px-8 py-4 rounded-2xl transition-all hover:shadow-[0_0_40px_rgba(249,115,22,0.5)] text-base">
              Shop Now <FiArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}