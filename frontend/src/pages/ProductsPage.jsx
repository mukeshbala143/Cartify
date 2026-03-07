import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiSearch, FiFilter, FiX, FiGrid, FiList, FiChevronDown, FiHome, FiChevronRight } from 'react-icons/fi';
import API from '../utils/api';
import ProductCard from '../components/product/ProductCard';
import { ProductSkeleton } from '../components/common/Skeleton';

const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books', 'Beauty', 'Other'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [sort, setSort] = useState('newest');
  const [maxPrice, setMaxPrice] = useState(200000);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  // Fetch all products once
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const { data } = await API.get('/products');
        const prods = Array.isArray(data) ? data : data.products || [];
        setProducts(prods);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  // Sync category from URL params on mount
  useEffect(() => {
    const urlCategory = searchParams.get('category');
    const urlSearch = searchParams.get('search');
    if (urlCategory) setCategory(urlCategory);
    if (urlSearch) setSearch(urlSearch);
  }, []);

  // Filter/sort whenever products or filters change
  useEffect(() => {
    let result = [...products];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }

    // Category filter — case-insensitive match
    if (category && category !== 'All') {
      result = result.filter(p =>
        p.category?.toLowerCase() === category.toLowerCase()
      );
    }

    // Price filter
    result = result.filter(p => p.price <= maxPrice);

    // Sort
    if (sort === 'price_asc') result.sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc') result.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setFiltered(result);
  }, [products, search, category, sort, maxPrice]);

  const handleCategoryClick = (cat) => {
    setCategory(cat);
    const params = {};
    if (cat !== 'All') params.category = cat;
    if (search) params.search = search;
    setSearchParams(params);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (search) params.search = search;
    if (category !== 'All') params.category = category;
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearch(''); setCategory('All'); setSort('newest'); setMaxPrice(200000);
    setSearchParams({});
  };

  const hasActiveFilters = search || category !== 'All' || maxPrice < 200000;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-5 text-sm">
          <Link to="/" className="flex items-center gap-1.5 text-white/40 hover:text-primary-400 transition-colors">
            <FiHome className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <FiChevronRight className="w-3.5 h-3.5 text-white/20" />
          <span className="text-white/60">All Products</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-white mb-1">All Products</h1>
          <p className="text-white/40">{loading ? 'Loading...' : `${filtered.length} products found`}</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-5">
          <div className="relative flex gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search products, categories..."
                className="input-field pl-12 py-4 text-base" />
            </div>
            <button type="submit" className="btn-primary px-8">Search</button>
            <button type="button" onClick={() => setShowFilters(!showFilters)}
              className={`btn-ghost flex items-center gap-2 px-5 border ${showFilters ? 'border-primary-500/50 text-primary-400 bg-primary-500/10' : 'border-white/10'}`}>
              <FiFilter className="w-4 h-4" />
              Filters
              {hasActiveFilters && <span className="w-2 h-2 bg-primary-500 rounded-full"></span>}
            </button>
          </div>
        </form>

        {/* Filters Panel */}
        {showFilters && (
          <div className="card p-6 mb-5 animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-white/50 mb-3 block">Max Price: <span className="text-primary-400">₹{maxPrice.toLocaleString()}</span></label>
                <input type="range" min="0" max="200000" step="1000" value={maxPrice}
                  onChange={e => setMaxPrice(parseInt(e.target.value))}
                  className="w-full accent-primary-500" />
                <div className="flex justify-between text-xs text-white/20 mt-1"><span>₹0</span><span>₹2,00,000</span></div>
              </div>
              <div>
                <label className="text-sm font-medium text-white/50 mb-3 block">Sort By</label>
                <div className="relative">
                  <select value={sort} onChange={e => setSort(e.target.value)} className="input-field appearance-none pr-10 cursor-pointer">
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4 pointer-events-none" />
                </div>
              </div>
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-4 flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors">
                <FiX className="w-4 h-4" /> Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => handleCategoryClick(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                category === cat
                  ? 'bg-primary-500 text-white shadow-glow'
                  : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/5'
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-white/40 text-sm">
            Showing <span className="text-white font-semibold">{filtered.length}</span> results
            {category !== 'All' && <span> in <span className="text-primary-400">{category}</span></span>}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary-500/20 text-primary-400' : 'text-white/30 hover:text-white'}`}>
              <FiGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary-500/20 text-primary-400' : 'text-white/30 hover:text-white'}`}>
              <FiList className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className={`grid gap-4 md:gap-5 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {Array(8).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-7xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-white mb-2">No products found</h3>
            <p className="text-white/40 mb-6">Try adjusting your search or filters</p>
            <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
          </div>
        ) : (
          <div className={`grid gap-4 md:gap-5 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {filtered.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}