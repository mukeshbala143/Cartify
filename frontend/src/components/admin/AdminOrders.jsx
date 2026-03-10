import { useEffect, useState } from 'react';
import {
  FiPackage, FiSearch, FiChevronDown, FiChevronUp,
  FiX, FiRefreshCw, FiDollarSign
} from 'react-icons/fi';
import API from '../../utils/api';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['All', 'Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const UPDATE_STATUS_OPTIONS = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
const STAT_STATUS_OPTIONS = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const STATUS_CONFIG = {
  Pending:    { color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30' },
  Paid:       { color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30' },
  Processing: { color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30' },
  Shipped:    { color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/30' },
  Delivered:  { color: 'text-green-400',   bg: 'bg-green-500/10',   border: 'border-green-500/30' },
  Cancelled:  { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30' },
};

const NEXT_STATUSES = {
  Pending:    ['Processing', 'Cancelled'],
  Paid:       ['Processing', 'Cancelled'],
  Processing: ['Shipped', 'Cancelled'],
  Shipped:    ['Delivered'],
  Delivered:  [],
  Cancelled:  [],
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ total: 0, totalRevenue: 0, stats: [], paidCount: 0, unpaidCount: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [expanded, setExpanded] = useState(null);
  const [updateModal, setUpdateModal] = useState(null);
  const [updateForm, setUpdateForm] = useState({ status: '', trackingNumber: '', message: '' });
  const [saving, setSaving] = useState(false);
  const [codPayment, setCodPayment] = useState({});
  const [savingPayment, setSavingPayment] = useState(null);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [filterStatus]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = filterStatus !== 'All' ? `?status=${filterStatus}` : '';
      const { data } = await API.get(`/orders/admin/all${params}`);
      setOrders(data.orders || []);
      const payState = {};
      (data.orders || []).forEach(o => {
        if (o.paymentMethod === 'COD') {
          payState[o._id] = o.paymentStatus || 'Unpaid';
        }
      });
      setCodPayment(payState);
    } catch {
      toast.error('Failed to load orders');
    } finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const { data } = await API.get('/orders/admin/stats');
      setStats(data);
    } catch {}
  };

  const openUpdateModal = (order) => {
    const next = NEXT_STATUSES[order.status]?.[0] || order.status;
    setUpdateForm({ status: next, trackingNumber: order.trackingNumber || '', message: '' });
    setUpdateModal(order);
  };

  const handleStatusUpdate = async () => {
    if (!updateForm.status) { toast.error('Select a status'); return; }
    setSaving(true);
    try {
      await API.put(`/orders/admin/${updateModal._id}/status`, updateForm);
      toast.success(`Order updated to ${updateForm.status} ✅`);
      setUpdateModal(null);
      fetchOrders();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const handleCodPaymentToggle = async (orderId, newStatus) => {
    setSavingPayment(orderId);
    try {
      await API.put(`/orders/admin/${orderId}/payment-status`, { paymentStatus: newStatus });
      setCodPayment(p => ({ ...p, [orderId]: newStatus }));
      toast.success(`Payment marked as ${newStatus} 💰`);
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSavingPayment(null); }
  };

  const filteredOrders = orders.filter(o => {
    if (!search) return true;
    const s = search.toLowerCase();
    return o._id.includes(s) || o.user?.name?.toLowerCase().includes(s) || o.user?.email?.toLowerCase().includes(s);
  });

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatDateTime = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  const statCards = [
    { label: 'Total Orders', value: stats.total, color: 'text-white' },
    { label: 'Revenue', value: `₹${(stats.totalRevenue || 0).toLocaleString()}`, color: 'text-primary-400' },
    { label: 'Paid', value: stats.paidCount || 0, color: 'text-green-400' },
    { label: 'Unpaid', value: stats.unpaidCount || 0, color: 'text-red-400' },
    ...STAT_STATUS_OPTIONS.map(s => {
      const found = stats.stats?.find(st => st._id === s);
      return { label: s, value: found?.count || 0, color: STATUS_CONFIG[s]?.color || 'text-white' };
    }),
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-3">
        {statCards.map(s => (
          <div key={s.label} className="bg-white/3 border border-white/8 rounded-xl p-3 text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-white/35 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by order ID, customer name or email..."
            className="input-field w-full pl-11 text-sm" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                filterStatus === s
                  ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                  : 'bg-white/3 border-white/10 text-white/40 hover:text-white/70'
              }`}>
              {s}
            </button>
          ))}
          <button onClick={fetchOrders} className="p-2 rounded-xl bg-white/3 border border-white/10 text-white/40 hover:text-white transition-colors">
            <FiRefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16">
          <FiPackage className="w-12 h-12 text-white/15 mx-auto mb-3" />
          <p className="text-white/30">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map(order => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.Pending;
            const isExpanded = expanded === order._id;
            const nextStatuses = NEXT_STATUSES[order.status] || [];
            const isCOD = order.paymentMethod === 'COD';
            const isDelivered = order.status === 'Delivered';
            const currentCodPayment = codPayment[order._id] || order.paymentStatus || 'Unpaid';

            return (
              <div key={order._id} className="bg-dark-800/60 border border-white/8 rounded-2xl overflow-hidden">
                <div className="p-4">
                  {/* Top row - icon, id, status, amount, expand */}
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <FiPackage className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-white font-semibold text-sm font-mono">
                          #{order._id.slice(-8).toUpperCase()}
                        </span>
                        <div className="flex items-center gap-2">
                          <p className="text-primary-400 font-bold text-sm">₹{order.totalAmount?.toLocaleString()}</p>
                          <button onClick={() => setExpanded(isExpanded ? null : order._id)}
                            className="p-1.5 text-white/30 hover:text-white transition-colors">
                            {isExpanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                          {order.status}
                        </span>
                        {isCOD ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${
                            currentCodPayment === 'Paid'
                              ? 'bg-green-500/10 border-green-500/30 text-green-400'
                              : 'bg-white/5 border-white/15 text-white/40'
                          }`}>
                            COD · {currentCodPayment}
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full border font-semibold bg-blue-500/10 border-blue-500/30 text-blue-400">
                            Online · Paid
                          </span>
                        )}
                        <span className="text-white/30 text-xs">{order.items?.length} items</span>
                      </div>
                      <p className="text-white/35 text-xs mt-1 truncate">
                        {order.user?.name} · {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  {/* Action buttons - full width on mobile */}
                  {nextStatuses.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {nextStatuses.map(ns => (
                        <button key={ns} onClick={() => {
                          setUpdateForm({ status: ns, trackingNumber: order.trackingNumber || '', message: '' });
                          setUpdateModal(order);
                        }}
                          className={`flex-1 text-xs px-3 py-2 rounded-lg border font-semibold transition-all ${
                            ns === 'Cancelled' ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-primary-500/30 text-primary-400 hover:bg-primary-500/10'
                          }`}>
                          {ns === 'Shipped' ? '🚚' : ns === 'Delivered' ? '✅' : ns === 'Processing' ? '⚙️' : '❌'} {ns}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="border-t border-white/8 px-4 pb-4 pt-3 grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Items</p>
                      <div className="space-y-2">
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex items-center gap-3 bg-white/3 rounded-xl p-2.5">
                            <img src={item.product?.images?.[0] || '/placeholder.png'}
                              alt="" className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-xs font-medium truncate">{item.product?.name}</p>
                              <p className="text-white/35 text-xs">Qty: {item.qty} · ₹{item.price?.toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {order.shippingAddress && (
                        <div className="bg-white/3 rounded-xl p-3">
                          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1.5">Ship To</p>
                          <p className="text-white text-xs font-semibold">{order.shippingAddress.name}</p>
                          <p className="text-white/40 text-xs leading-relaxed">
                            {order.shippingAddress.line1}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}<br />
                            📞 {order.shippingAddress.phone}
                          </p>
                        </div>
                      )}

                      {order.trackingNumber && (
                        <div className="bg-purple-500/10 border border-purple-500/25 rounded-xl p-3">
                          <p className="text-white/40 text-xs mb-1">Tracking #</p>
                          <p className="text-purple-300 font-mono font-bold tracking-widest text-sm">{order.trackingNumber}</p>
                        </div>
                      )}

                      {order.statusHistory?.length > 0 && (
                        <div>
                          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Timeline</p>
                          <div className="space-y-1">
                            {[...order.statusHistory].reverse().map((h, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${i === 0 ? 'bg-primary-500' : 'bg-white/20'}`}></div>
                                <div>
                                  <span className={`text-xs font-semibold ${STATUS_CONFIG[h.status]?.color || 'text-white'}`}>{h.status}</span>
                                  <span className="text-white/25 text-xs ml-2">{formatDateTime(h.timestamp)}</span>
                                  {h.message && <p className="text-white/35 text-xs">{h.message}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="sm:col-span-2 flex flex-col sm:flex-row gap-3">
                      {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                        <button onClick={() => openUpdateModal(order)}
                          className="flex-1 py-2.5 rounded-xl border border-primary-500/30 text-primary-400 hover:bg-primary-500/10 text-sm font-semibold transition-all flex items-center justify-center gap-2">
                          <FiEdit className="w-4 h-4" /> Update Status / Add Tracking
                        </button>
                      )}

                      {isCOD && isDelivered && (
                        <div className="flex-1 flex items-center gap-3 bg-white/3 border border-white/10 rounded-xl px-4 py-2.5">
                          <FiDollarSign className="w-4 h-4 text-white/40 flex-shrink-0" />
                          <span className="text-white/50 text-xs font-medium flex-1">COD Payment</span>
                          <div className="flex gap-2">
                            <button
                              disabled={savingPayment === order._id}
                              onClick={() => handleCodPaymentToggle(order._id, 'Paid')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                currentCodPayment === 'Paid'
                                  ? 'bg-green-500 border-green-500 text-white'
                                  : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                              }`}>
                              ✓ Paid
                            </button>
                            <button
                              disabled={savingPayment === order._id}
                              onClick={() => handleCodPaymentToggle(order._id, 'Unpaid')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                currentCodPayment === 'Unpaid'
                                  ? 'bg-red-500 border-red-500 text-white'
                                  : 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                              }`}>
                              ✗ Unpaid
                            </button>
                          </div>
                          {savingPayment === order._id && (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0"></span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Update Modal */}
      {updateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-white/10 rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg">Update Order</h3>
              <button onClick={() => setUpdateModal(null)} className="text-white/40 hover:text-white transition-colors">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <p className="text-white/40 text-sm mb-4">
              Order <span className="text-primary-400 font-mono font-bold">#{updateModal._id.slice(-8).toUpperCase()}</span>
              <span className="ml-2 text-xs text-white/25">Current: {updateModal.status}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">New Status</label>
                <select value={updateForm.status} onChange={e => setUpdateForm(p => ({ ...p, status: e.target.value }))}
                  className="input-field w-full text-sm">
                  {UPDATE_STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {updateForm.status === 'Shipped' && (
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Tracking Number</label>
                  <input value={updateForm.trackingNumber} onChange={e => setUpdateForm(p => ({ ...p, trackingNumber: e.target.value }))}
                    placeholder="e.g. IND123456789" className="input-field w-full text-sm" />
                </div>
              )}

              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Message (Optional)</label>
                <input value={updateForm.message} onChange={e => setUpdateForm(p => ({ ...p, message: e.target.value }))}
                  placeholder="Custom message to customer..." className="input-field w-full text-sm" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setUpdateModal(null)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-medium hover:text-white transition-all">
                Cancel
              </button>
              <button onClick={handleStatusUpdate} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm transition-all disabled:opacity-50">
                {saving ? 'Updating...' : 'Update Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FiEdit({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}