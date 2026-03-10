import { useState, useEffect } from 'react';
import { FiPackage, FiShoppingBag, FiDollarSign, FiEdit2, FiTrash2, FiPlus, FiCheck, FiX, FiAlertTriangle, FiClock, FiChevronDown, FiChevronUp, FiShoppingCart, FiRefreshCw, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import API from '../utils/api';
import toast from 'react-hot-toast';
import ImageUploader from '../components/common/ImageUploader';
import AdminOrders from '../components/admin/AdminOrders';
import AdminReturns from '../components/admin/AdminReturns';

const FiStore = FiShoppingBag;
const CATEGORIES = ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books', 'Beauty', 'Other'];
const emptyForm = { name: '', description: '', price: '', countInStock: '', images: [], category: 'Other' };

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('products');
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [pendingSellers, setPendingSellers] = useState([]);
  const [approvedSellers, setApprovedSellers] = useState([]);
  const [sellersLoading, setSellersLoading] = useState(false);
  const [expandedSeller, setExpandedSeller] = useState(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalReturns, setTotalReturns] = useState(0);
  const [shopRequests, setShopRequests] = useState([]);

  useEffect(() => {
    if (!user?.isAdmin) { navigate('/'); return; }
    fetchProducts();
    fetchPendingSellers();
    fetchApprovedSellers();
    fetchOrderCount();
    fetchReturnCount();
    fetchShopRequests();
  }, [user]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/products');
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch {}
    finally { setLoading(false); }
  };

  const fetchPendingSellers = async () => {
    try {
      const { data } = await API.get('/seller/pending');
      setPendingSellers(data.sellers || []);
    } catch {}
  };

  const fetchApprovedSellers = async () => {
    try {
      setSellersLoading(true);
      const { data } = await API.get('/seller/all');
      setApprovedSellers(data.sellers || []);
    } catch {}
    finally { setSellersLoading(false); }
  };
  const fetchShopRequests = async () => {
    try {
      const { data } = await API.get('/seller/shop-requests');
      setShopRequests(data.sellers || []);
    } catch {}
  };

  const fetchOrderCount = async () => {
    try {
      const { data } = await API.get('/orders/admin/stats');
      setTotalOrders(data.total || 0);
    } catch {}
  };

  const fetchReturnCount = async () => {
    try {
      const { data } = await API.get('/returns/admin/all?status=Requested');
      setTotalReturns(data.returns?.length || 0);
    } catch {}
  };

  const approveSeller = async (id) => {
    try {
      await API.put(`/seller/approve/${id}`);
      toast.success('Seller approved! ✅');
      fetchPendingSellers();
      fetchApprovedSellers();
    } catch { toast.error('Failed'); }
  };

  const rejectSeller = async (id) => {
    try {
      await API.put(`/seller/reject/${id}`);
      toast.success('Seller rejected');
      fetchPendingSellers();
    } catch { toast.error('Failed'); }
  };

  const saveProduct = async () => {
    if (!form.name || !form.price) { toast.error('Name and price required'); return; }
    try {
      setSaving(true);
      const payload = { ...form, image: form.images[0] || '', images: form.images, price: Number(form.price), countInStock: Number(form.countInStock) };
      if (editId) {
        await API.put(`/products/${editId}`, payload);
        toast.success('Product updated!');
      } else {
        await API.post('/products', payload);
        toast.success('Product added!');
      }
      setForm(emptyForm); setEditId(null); setTab('products');
      fetchProducts(); fetchApprovedSellers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const deleteProduct = async (id) => {
    try {
      await API.delete(`/products/${id}`);
      toast.success('Product deleted');
      setDeleteConfirm(null);
      fetchProducts(); fetchApprovedSellers();
    } catch { toast.error('Delete failed'); }
  };

  const startEdit = (p) => {
    setForm({ name: p.name, description: p.description || '', price: p.price, countInStock: p.countInStock, images: p.images?.length ? p.images : (p.image ? [p.image] : []), category: p.category || 'Other' });
    setEditId(p._id);
    setTab('add');
  };

  const stats = [
    { label: 'Total Products', value: products.length, icon: FiPackage, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Total Value', value: `₹${products.reduce((s, p) => s + p.price, 0).toLocaleString()}`, icon: FiDollarSign, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
    { label: 'Total Orders', value: totalOrders, icon: FiShoppingCart, color: 'text-primary-400', bg: 'bg-primary-500/10 border-primary-500/20' },
    { label: 'Active Sellers', value: approvedSellers.length, icon: FiStore, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    { label: 'Pending Sellers', value: pendingSellers.length, icon: FiClock, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  ];

  return (
    <div className="min-h-screen pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-sm mb-4"><FiArrowLeft className="w-4 h-4" /> Back to Home</Link>
          <h1 className="font-display text-4xl font-black text-white mb-1">Admin Panel</h1>
          <p className="text-white/30">Manage products, orders, sellers and approvals</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`card p-5 border ${bg}`}>
              <div className="flex items-center gap-3">
                <Icon className={`w-6 h-6 ${color}`} />
                <div>
                  <p className="text-xl font-black text-white">{value}</p>
                  <p className="text-white/30 text-xs">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: 'products',    label: 'All Products',   icon: FiPackage },
            { key: 'add',         label: editId ? 'Edit Product' : 'Add Product', icon: FiPlus },
            { key: 'orders',      label: `Orders (${totalOrders})`, icon: FiShoppingCart },
            { key: 'returns',     label: `Returns${totalReturns > 0 ? ` (${totalReturns})` : ''}`, icon: FiRefreshCw },
            { key: 'sellers',     label: `Approve Sellers${pendingSellers.length > 0 ? ` (${pendingSellers.length})` : ''}`, icon: FiClock },
            { key: 'sellershops', label: `Seller Shops (${approvedSellers.length})`, icon: FiStore },
            { key: 'shopreqs', label: `Shop Requests${shopRequests.length > 0 ? ` (${shopRequests.length})` : ''}`, icon: FiClock },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key}
              onClick={() => { setTab(key); if (key === 'products') { setEditId(null); setForm(emptyForm); } }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === key ? 'bg-primary-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/5'
              }`}>
              <Icon className="w-4 h-4" /> {label}
              {key === 'returns' && totalReturns > 0 && (
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
              )}
            </button>
          ))}
        </div>

        {/* ── ALL PRODUCTS ── */}
        {tab === 'products' && (
          <div>
            {loading ? (
              <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : products.length === 0 ? (
              <div className="card p-16 text-center">
                <p className="text-white/30 mb-4">No products yet</p>
                <button onClick={() => setTab('add')} className="btn-primary inline-flex items-center gap-2"><FiPlus className="w-4 h-4" /> Add First Product</button>
              </div>
            ) : (
              <div className="space-y-2">
                {products.map(p => (
                  <div key={p._id} className="card p-4 flex items-center gap-4 hover:border-white/10 transition-all">
                    <div className="flex gap-1 flex-shrink-0">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/5">
                        <img src={p.images?.[0] || p.image} alt={p.name} className="w-full h-full object-cover"
                          onError={e => { e.target.src = `https://picsum.photos/seed/${p._id}/100/100`; }} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-white text-sm line-clamp-1">{p.name}</p>
                        {p.seller && <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-semibold">SELLER</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded">{p.category}</span>
                        <span className="text-primary-400 font-bold text-sm">₹{p.price?.toLocaleString()}</span>
                        <span className={`text-xs font-semibold ${p.countInStock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {p.countInStock > 0 ? `${p.countInStock} in stock` : 'Out of stock'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => startEdit(p)} className="p-2.5 text-white/30 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all"><FiEdit2 className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteConfirm(p)} className="p-2.5 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"><FiTrash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ADD/EDIT PRODUCT ── */}
        {tab === 'add' && (
          <div className="card p-6 max-w-2xl">
            <h3 className="font-display text-xl font-bold text-white mb-6">{editId ? '✏️ Edit Product' : '📦 Add New Product'}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block font-medium">Product Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Apple iPhone 15 Pro Max" className="input-field" />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block font-medium">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Product description..." rows={3} className="input-field resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block font-medium">Price (₹) *</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="999" className="input-field" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block font-medium">Stock</label>
                  <input type="number" value={form.countInStock} onChange={e => setForm(f => ({ ...f, countInStock: e.target.value }))} placeholder="10" className="input-field" />
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
                <button onClick={saveProduct} disabled={saving} className="btn-primary flex-1 py-3.5 flex items-center justify-center gap-2">
                  {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Saving...</> : <><FiCheck className="w-4 h-4" /> {editId ? 'Update Product' : 'Add Product'}</>}
                </button>
                <button onClick={() => { setForm(emptyForm); setEditId(null); setTab('products'); }} className="btn-ghost px-6 py-3.5 border border-white/10">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ── ORDERS ── */}
        {tab === 'orders' && <AdminOrders />}

        {/* ── RETURNS ── */}
        {tab === 'returns' && <AdminReturns />}

        {/* ── APPROVE SELLERS ── */}
        {tab === 'sellers' && (
          <div>
            {pendingSellers.length === 0 ? (
              <div className="card p-16 text-center">
                <FiCheck className="w-12 h-12 text-green-400/30 mx-auto mb-3" />
                <p className="text-white/40">No pending seller requests 🎉</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingSellers.map(s => (
                  <div key={s._id} className="card p-4 flex flex-wrap sm:flex-nowrap items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
                      <FiStore className="w-6 h-6 text-primary-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-white">{s.sellerInfo?.shopName}</p>
                        <span className="text-xs bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">Pending</span>
                      </div>
                      <p className="text-white/40 text-sm">{s.name} · {s.email}</p>
                      <p className="text-white/25 text-xs">📞 {s.sellerInfo?.countryCode} {s.sellerInfo?.phone}</p>
                      {s.sellerInfo?.shopDescription && <p className="text-white/25 text-xs mt-0.5 line-clamp-1">{s.sellerInfo.shopDescription}</p>}
                    </div>
                    <div className="flex gap-2 flex-wrap mt-2 sm:mt-0">
                      <button onClick={() => approveSeller(s._id)} className="flex items-center gap-1.5 bg-green-500/10 hover:bg-green-500 border border-green-500/30 hover:border-green-500 text-green-400 hover:text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                        <FiCheck className="w-4 h-4" /> Approve
                      </button>
                      <button onClick={() => rejectSeller(s._id)} className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                        <FiX className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SELLER SHOPS ── */}
        {tab === 'shopreqs' && (
          <div className="space-y-3">
            {shopRequests.length === 0 ? (
              <div className="text-center py-12 text-white/30">No pending shop requests</div>
            ) : shopRequests.map(s => (
              <div key={s._id} className="card p-4 flex items-center gap-4 flex-wrap">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <FiStore className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white">{s.sellerInfo?.shopName}</p>
                  <p className="text-white/40 text-sm">{s.name} · {s.email}</p>
                  <p className="text-xs mt-1">
                    Current: <span className={s.sellerInfo?.active !== false ? 'text-green-400' : 'text-red-400'}>{s.sellerInfo?.active !== false ? '🟢 Open' : '🔴 Closed'}</span>
                    {' → '}
                    Requested: <span className={s.sellerInfo?.shopRequest === 'open' ? 'text-green-400' : 'text-red-400'}>{s.sellerInfo?.shopRequest === 'open' ? '🟢 Open' : '🔴 Closed'}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={async () => {
                    await API.put('/seller/approve-shop-request/' + s._id);
                    setShopRequests(prev => prev.filter(r => r._id !== s._id));
                    setApprovedSellers(prev => prev.map(a => a._id === s._id ? { ...a, sellerInfo: { ...a.sellerInfo, active: s.sellerInfo?.shopRequest === 'open', shopRequest: null } } : a));
                    toast.success('Request approved!');
                  }} className="px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500 hover:text-white rounded-xl text-sm font-semibold transition-all">
                    ✅ Approve
                  </button>
                  <button onClick={async () => {
                    await API.put('/seller/admin-toggle/' + s._id, { active: s.sellerInfo?.active });
                    setShopRequests(prev => prev.filter(r => r._id !== s._id));
                    toast.success('Request rejected!');
                  }} className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white rounded-xl text-sm font-semibold transition-all">
                    ❌ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'sellershops' && (
          <div>
            {sellersLoading ? (
              <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : approvedSellers.length === 0 ? (
              <div className="card p-16 text-center">
                <FiStore className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-white/40">No approved sellers yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {approvedSellers.map(seller => (
                  <div key={seller._id} className="card overflow-hidden">
                    <div className="p-5 flex items-center gap-4 cursor-pointer hover:bg-white/2 transition-all"
                      onClick={() => setExpandedSeller(expandedSeller === seller._id ? null : seller._id)}>
                      <div className="w-12 h-12 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
                        <FiStore className="w-6 h-6 text-primary-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-white text-lg">{seller.sellerInfo?.shopName}</p>
                          <span className="text-xs bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded-full">✓ Approved</span>
                          <div className="flex items-center gap-1 rounded-full border border-white/10 p-0.5 bg-white/5">
                            <button onClick={async (e) => { e.stopPropagation(); await API.put('/seller/admin-toggle/' + seller._id, { active: true }); setApprovedSellers(prev => prev.map(s => s._id === seller._id ? { ...s, sellerInfo: { ...s.sellerInfo, active: true } } : s)); }} className={`text-xs px-2 py-0.5 rounded-full font-semibold transition-all ${seller.sellerInfo?.active !== false ? 'bg-green-500 text-white' : 'text-white/40 hover:text-white'}`}>🟢 Open</button>
                            <button onClick={async (e) => { e.stopPropagation(); await API.put('/seller/admin-toggle/' + seller._id, { active: false }); setApprovedSellers(prev => prev.map(s => s._id === seller._id ? { ...s, sellerInfo: { ...s.sellerInfo, active: false } } : s)); }} className={`text-xs px-2 py-0.5 rounded-full font-semibold transition-all ${seller.sellerInfo?.active === false ? 'bg-red-500 text-white' : 'text-white/40 hover:text-white'}`}>🔴 Closed</button>
                          </div>
                        </div>
                        <p className="text-white/40 text-sm">{seller.name} · {seller.email}</p>
                        <p className="text-white/25 text-xs">📞 {seller.sellerInfo?.countryCode} {seller.sellerInfo?.phone} · {seller.products?.length || 0} products</p>
                      </div>
                      <div className="flex-shrink-0 text-white/30">
                        {expandedSeller === seller._id ? <FiChevronUp className="w-5 h-5" /> : <FiChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                    {expandedSeller === seller._id && (
                      <div className="border-t border-white/5 p-4">
                        {seller.products?.length === 0 ? (
                          <p className="text-white/30 text-sm text-center py-4">No products listed by this seller</p>
                        ) : (
                          <div className="space-y-2">
                            {seller.products.map(p => (
                              <div key={p._id} className="flex items-center gap-3 p-3 bg-white/3 rounded-xl hover:bg-white/5 transition-all">
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                                  <img src={p.images?.[0] || p.image} alt={p.name} className="w-full h-full object-cover"
                                    onError={e => { e.target.src = `https://picsum.photos/seed/${p._id}/100/100`; }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-white text-sm line-clamp-1">{p.name}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-white/30">{p.category}</span>
                                    <span className="text-primary-400 font-bold text-xs">₹{p.price?.toLocaleString()}</span>
                                    <span className={`text-xs font-semibold ${p.countInStock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                      {p.countInStock > 0 ? `${p.countInStock} in stock` : 'Out of stock'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button onClick={() => startEdit(p)} className="p-2 text-white/30 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all">
                                    <FiEdit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => setDeleteConfirm(p)} className="p-2 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                                    <FiTrash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* DELETE MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}></div>
          <div className="relative bg-dark-800 border border-red-500/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center">
                <FiAlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Delete Product?</h3>
                <p className="text-white/40 text-sm">This cannot be undone</p>
              </div>
            </div>
            <p className="text-white/60 text-sm mb-5 bg-white/5 rounded-xl px-3 py-2 line-clamp-2">{deleteConfirm.name}</p>
            <div className="flex gap-3">
              <button onClick={() => deleteProduct(deleteConfirm._id)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2">
                <FiTrash2 className="w-4 h-4" /> Delete
              </button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-xl transition-all border border-white/10">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}