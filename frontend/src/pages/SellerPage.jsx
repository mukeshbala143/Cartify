import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiPackage, FiPlus, FiEdit2, FiTrash2, FiCheck, FiX,
  FiShoppingBag, FiAlertCircle, FiClock, FiArrowLeft,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import ImageUploader from '../components/common/ImageUploader';
import toast from 'react-hot-toast';

const FiStore = FiShoppingBag;

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', digits: 10 },
  { code: '+1', country: 'US/CA', digits: 10 },
  { code: '+44', country: 'UK', digits: 10 },
  { code: '+61', country: 'AU', digits: 9 },
  { code: '+971', country: 'UAE', digits: 9 },
  { code: '+65', country: 'SG', digits: 8 },
  { code: '+60', country: 'MY', digits: 9 },
  { code: '+880', country: 'BD', digits: 10 },
  { code: '+92', country: 'PK', digits: 10 },
  { code: '+86', country: 'CN', digits: 11 },
];

const CATEGORIES = ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books', 'Beauty', 'Other'];
const emptyForm = { name: '', description: '', price: '', countInStock: '', images: [], category: 'Other' };


function ToggleShopBtn({ sellerStatus, setSellerStatus }) {
  const [toggling, setToggling] = useState(false);
  const isOpen = sellerStatus.sellerInfo?.active !== false;

  const setShopStatus = async (newActive) => {
    if (toggling || isOpen === newActive) return;
    setToggling(true);
    // Optimistic update - turant UI change karo
    setSellerStatus(prev => ({ ...prev, sellerInfo: { ...prev.sellerInfo, active: newActive } }));
    try {
      await API.put('/seller/toggle-shop', { active: newActive });
      toast.success(newActive ? 'Shop is now Active' : 'Shop is now Inactive');
    } catch(e) {
      // Revert on error
      setSellerStatus(prev => ({ ...prev, sellerInfo: { ...prev.sellerInfo, active: !newActive } }));
      toast.error('Failed to update shop status');
    }
    finally { setToggling(false); }
  };

  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 p-0.5 bg-white/5">
      <button
        onClick={() => setShopStatus(true)}
        disabled={toggling}
        className={`text-xs px-3 py-1 rounded-full font-semibold transition-all disabled:opacity-50 ${
          isOpen
            ? 'bg-green-500 text-white shadow'
            : 'text-white/40 hover:text-white'
        }`}>
        🟢 Open
      </button>
      <button
        onClick={() => setShopStatus(false)}
        disabled={toggling}
        className={`text-xs px-3 py-1 rounded-full font-semibold transition-all disabled:opacity-50 ${
          !isOpen
            ? 'bg-red-500 text-white shadow'
            : 'text-white/40 hover:text-white'
        }`}>
        🔴 Closed
      </button>
    </div>
  );
}

export default function SellerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sellerStatus, setSellerStatus] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('products');
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [regForm, setRegForm] = useState({ shopName: '', shopDescription: '', phone: '', countryCode: '+91' });
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchStatus();
  }, [user]);

  const fetchStatus = async () => {
    try {
      const { data } = await API.get('/seller/status?t=' + Date.now());
      setSellerStatus(data);
      if (data.isSeller && data.sellerInfo?.approved) fetchProducts();
    } catch {}
    finally { setLoading(false); }
  };

  const fetchProducts = async () => {
    const { data } = await API.get('/seller/products');
    setProducts(data.products || []);
  };

  const getExpectedDigits = () => {
    const found = COUNTRY_CODES.find(c => c.code === regForm.countryCode);
    return found ? found.digits : 10;
  };

  const registerAsSeller = async () => {
    if (!regForm.shopName.trim()) { toast.error('Shop name required'); return; }
    if (!regForm.phone.trim()) { toast.error('Phone number required'); return; }
    const digits = regForm.phone.replace(/\D/g, '');
    const expected = getExpectedDigits();
    if (digits.length !== expected) {
      toast.error(`Phone number must be ${expected} digits for ${regForm.countryCode}`);
      return;
    }
    try {
      setRegistering(true);
      await API.post('/seller/register', regForm);
      toast.success('Registration submitted! Waiting for admin approval.');
      fetchStatus();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setRegistering(false); }
  };

  const saveProduct = async () => {
    if (!form.name || !form.price) { toast.error('Name and price required'); return; }
    try {
      setSaving(true);
      if (editId) {
        await API.put(`/seller/products/${editId}`, form);
        toast.success('Product updated!');
      } else {
        await API.post('/seller/products', form);
        toast.success('Product listed! 🎉');
      }
      setForm(emptyForm); setEditId(null); setTab('products');
      fetchProducts();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await API.delete(`/seller/products/${id}`);
    toast.success('Product deleted');
    fetchProducts();
  };

  const startEdit = (p) => {
    setForm({ name: p.name, description: p.description || '', price: p.price, countInStock: p.countInStock, images: p.images?.length ? p.images : (p.image ? [p.image] : []), category: p.category || 'Other' });
    setEditId(p._id); setTab('add');
  };

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  // ── NOT A SELLER YET ──
  if (!sellerStatus?.isSeller) return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4">

        <Link to="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-6 text-sm">
          <FiArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary-500/10 border border-primary-500/20 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <FiStore className="w-10 h-10 text-primary-400" />
          </div>
          <h1 className="font-display text-4xl font-black text-white mb-3">Become a Seller</h1>
          <p className="text-white/40 text-lg">List your products and reach thousands of customers on Cartify</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: '🏪', title: 'Your Own Shop', desc: 'Custom shop name and brand' },
            { icon: '📦', title: 'Easy Listings', desc: 'Add products in minutes' },
            { icon: '💰', title: 'Earn More', desc: 'Reach 50K+ customers' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="card p-4 text-center">
              <div className="text-3xl mb-2">{icon}</div>
              <p className="text-white font-semibold text-sm mb-1">{title}</p>
              <p className="text-white/30 text-xs">{desc}</p>
            </div>
          ))}
        </div>

        <div className="card p-6">
          <h3 className="font-display text-xl font-bold text-white mb-5">Register Your Shop</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/40 mb-1.5 block font-medium">Your Name</label>
              <input type="text" value={user?.name || ''} disabled className="input-field opacity-50 cursor-not-allowed" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block font-medium">Shop Name *</label>
              <input type="text" value={regForm.shopName} onChange={e => setRegForm(f => ({ ...f, shopName: e.target.value }))}
                placeholder="e.g. Rahul's Electronics" className="input-field" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block font-medium">Shop Description</label>
              <textarea value={regForm.shopDescription} onChange={e => setRegForm(f => ({ ...f, shopDescription: e.target.value }))}
                placeholder="Tell customers about your shop..." rows={3} className="input-field resize-none" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block font-medium">Phone Number *</label>
              <div className="flex gap-2">
                <select value={regForm.countryCode} onChange={e => setRegForm(f => ({ ...f, countryCode: e.target.value, phone: '' }))}
                  className="input-field w-32 appearance-none">
                  {COUNTRY_CODES.map(c => (
                    <option key={c.code} value={c.code}>{c.code} {c.country}</option>
                  ))}
                </select>
                <input type="tel" value={regForm.phone}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    const max = getExpectedDigits();
                    if (val.length <= max) setRegForm(f => ({ ...f, phone: val }));
                  }}
                  placeholder={`${getExpectedDigits()} digits`}
                  className="input-field flex-1" />
              </div>
              <p className="text-white/20 text-xs mt-1">{regForm.phone.length}/{getExpectedDigits()} digits</p>
            </div>
            <button onClick={registerAsSeller} disabled={registering}
              className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
              {registering
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Submitting...</>
                : <><FiStore className="w-4 h-4" /> Submit for Approval</>}
            </button>
          </div>
          <p className="text-white/20 text-xs text-center mt-3">Admin will review and approve your request</p>
        </div>
      </div>
    </div>
  );

  // ── PENDING APPROVAL ──
  if (sellerStatus?.isSeller && !sellerStatus?.sellerInfo?.approved) return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-sm mx-auto px-4">
        <Link to="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-6 text-sm">
          <FiArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="text-center">
          <div className="w-20 h-20 bg-yellow-500/10 border border-yellow-500/20 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <FiClock className="w-10 h-10 text-yellow-400" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-2">Pending Approval</h2>
          <p className="text-white/40 mb-2">Your seller account <span className="text-yellow-400 font-semibold">"{sellerStatus.sellerInfo?.shopName}"</span> is under review.</p>
          <div className="card p-4 mt-4 text-left space-y-2">
            <p className="text-white/50 text-sm"><span className="text-white/30">Shop:</span> {sellerStatus.sellerInfo?.shopName}</p>
            <p className="text-white/50 text-sm"><span className="text-white/30">Phone:</span> {sellerStatus.sellerInfo?.countryCode} {sellerStatus.sellerInfo?.phone}</p>
            <p className="text-white/50 text-sm"><span className="text-white/30">Seller:</span> {user?.name}</p>
          </div>
          <p className="text-white/25 text-sm mt-4">Admin will approve it soon. You'll be able to list products after approval.</p>
        </div>
      </div>
    </div>
  );

  // ── APPROVED SELLER DASHBOARD ──
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back Button */}
        <Link to="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-4 text-sm">
          <FiArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <FiStore className="w-5 h-5 text-primary-400" />
              <h1 className="font-display text-3xl font-black text-white">{sellerStatus.sellerInfo?.shopName}</h1>
              <span className="text-xs bg-green-500/15 border border-green-500/25 text-green-400 px-2 py-0.5 rounded-full font-semibold">✓ Approved</span>
              <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${
                sellerStatus.sellerInfo?.active !== false
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                {sellerStatus.sellerInfo?.active !== false ? '🟢 Shop Open' : '🔴 Shop Closed'}
              </span>
              {sellerStatus.sellerInfo?.shopRequest ? (
                <span className="text-xs px-3 py-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 font-semibold">
                  ⏳ Request Pending: {sellerStatus.sellerInfo.shopRequest === 'open' ? 'Open' : 'Close'}
                </span>
              ) : (
                <button onClick={async () => {
                  const requestType = sellerStatus.sellerInfo?.active !== false ? 'close' : 'open';
                  try {
                    await API.put('/seller/request-shop', { requestType });
                    toast.success('Request sent to admin!');
                    setSellerStatus(prev => ({ ...prev, sellerInfo: { ...prev.sellerInfo, shopRequest: requestType } }));
                  } catch(e) { toast.error('Failed to send request'); }
                }} className="text-xs px-3 py-1 rounded-full border border-white/20 text-white/50 hover:text-white hover:border-white/40 font-semibold transition-all">
                  {sellerStatus.sellerInfo?.active !== false ? '📩 Request Close' : '📩 Request Open'}
                </button>
              )}
            </div>
            <p className="text-white/30 text-sm">Seller: {user?.name} · {sellerStatus.sellerInfo?.countryCode} {sellerStatus.sellerInfo?.phone}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Products', value: products.length, icon: FiPackage, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
            { label: 'In Stock', value: products.filter(p => p.countInStock > 0).length, icon: FiCheck, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
            { label: 'Out of Stock', value: products.filter(p => p.countInStock === 0).length, icon: FiAlertCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`card p-5 border ${bg}`}>
              <div className="flex items-center gap-3">
                <Icon className={`w-6 h-6 ${color}`} />
                <div>
                  <p className="text-2xl font-black text-white">{value}</p>
                  <p className="text-white/40 text-xs">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { key: 'products', label: 'My Products', icon: FiPackage },
            { key: 'add', label: editId ? 'Edit Product' : 'Add Product', icon: FiPlus },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => { setTab(key); if (key === 'products') { setEditId(null); setForm(emptyForm); } }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === key ? 'bg-primary-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/5'}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {tab === 'products' && (
          <div>
            {products.length === 0 ? (
              <div className="card p-16 text-center">
                <FiPackage className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-white/40 mb-4">No products listed yet</p>
                <button onClick={() => setTab('add')} className="btn-primary inline-flex items-center gap-2">
                  <FiPlus className="w-4 h-4" /> Add Your First Product
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {products.map(p => (
                  <div key={p._id} className="card p-4 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover"
                        onError={e => { e.target.src = `https://picsum.photos/seed/${p._id}/100/100`; }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white line-clamp-1">{p.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded">{p.category}</span>
                        <span className="text-primary-400 font-bold text-sm">₹{p.price?.toLocaleString()}</span>
                        <span className={`text-xs font-semibold ${p.countInStock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {p.countInStock > 0 ? `${p.countInStock} in stock` : 'Out of stock'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => startEdit(p)} className="p-2.5 text-white/40 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all">
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteProduct(p._id)} className="p-2.5 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'add' && (
          <div className="card p-6 max-w-2xl">
            <h3 className="font-display text-xl font-bold text-white mb-6">
              {editId ? '✏️ Edit Product' : '📦 List New Product'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block font-medium">Product Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. iPhone 15 Pro Max 256GB" className="input-field" />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block font-medium">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe your product..." rows={3} className="input-field resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block font-medium">Price (₹) *</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="999" className="input-field" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block font-medium">Stock Quantity *</label>
                  <input type="number" value={form.countInStock} onChange={e => setForm(f => ({ ...f, countInStock: e.target.value }))}
                    placeholder="10" className="input-field" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block font-medium">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input-field appearance-none">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <ImageUploader images={form.images} onChange={imgs => setForm(f => ({ ...f, images: imgs }))} />
              <div className="flex gap-3 pt-2">
                <button onClick={saveProduct} disabled={saving}
                  className="btn-primary flex-1 py-3.5 flex items-center justify-center gap-2">
                  {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Saving...</>
                    : <><FiCheck className="w-4 h-4" /> {editId ? 'Update Product' : 'List Product'}</>}
                </button>
                <button onClick={() => { setForm(emptyForm); setEditId(null); setTab('products'); }}
                  className="btn-ghost px-6 py-3.5 border border-white/10">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}