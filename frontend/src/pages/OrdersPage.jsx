import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPackage, FiChevronDown, FiChevronUp, FiX, FiTruck,
  FiClock, FiCheckCircle, FiAlertCircle, FiEdit2,
  FiRefreshCw, FiArrowLeft
} from 'react-icons/fi';
import API from '../utils/api';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  Pending:    { color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30',  icon: FiClock,       step: 0 },
  Paid:       { color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    icon: FiCheckCircle, step: 1 },
  Processing: { color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  icon: FiPackage,     step: 2 },
  Shipped:    { color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/30',  icon: FiTruck,       step: 3 },
  Delivered:  { color: 'text-green-400',   bg: 'bg-green-500/10',   border: 'border-green-500/30',   icon: FiCheckCircle, step: 4 },
  Cancelled:  { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     icon: FiAlertCircle, step: -1 },
};

// Return flow steps for progress display
const RETURN_STEPS_REFUND = ['Requested', 'Approved', 'Pickup Scheduled', 'Picked Up', 'Received by Company', 'Refund Processed'];
const RETURN_STEPS_EXCHANGE = ['Requested', 'Approved', 'Pickup Scheduled', 'Picked Up', 'Received by Company', 'Exchange Processing', 'Exchange Shipped', 'Exchange Delivered'];

const RETURN_STATUS_CONFIG = {
  Requested:              { color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30',  label: 'Return Requested' },
  Approved:               { color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    label: 'Approved' },
  Rejected:               { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     label: 'Rejected' },
  'Pickup Scheduled':     { color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/30',  label: 'Pickup Scheduled' },
  'Picked Up':            { color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  label: 'Picked Up' },
  'Received by Company':  { color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/30',    label: 'Received by Company' },
  'Refund Processed':     { color: 'text-green-400',   bg: 'bg-green-500/10',   border: 'border-green-500/30',   label: 'Refund Processed ✓' },
  'Exchange Processing':  { color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  label: 'Exchange Processing' },
  'Exchange Shipped':     { color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/30',  label: 'Exchange Shipped' },
  'Exchange Delivered':   { color: 'text-green-400',   bg: 'bg-green-500/10',   border: 'border-green-500/30',   label: 'Exchange Delivered ✓' },
};

const RETURN_REASONS = [
  'Product damaged / defective',
  'Wrong product received',
  'Product not as described',
  'Size/color mismatch',
  'Changed my mind',
  'Missing parts/accessories',
  'Other',
];

const PROGRESS_STEPS = ['Pending', 'Processing', 'Shipped', 'Delivered'];

const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];

const RETURN_WINDOW_DAYS = 10;

function getDaysSinceDelivery(order) {
  const entry = [...(order.statusHistory || [])].reverse().find(h => h.status === 'Delivered');
  if (!entry) return 0;
  return (Date.now() - new Date(entry.timestamp)) / (1000 * 60 * 60 * 24);
}

export default function OrdersPage() {
  const [orders, setOrders]     = useState([]);
  const [returns, setReturns]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [cancelId, setCancelId] = useState(null);
  const [addressModal, setAddressModal] = useState(null);
  const [addressForm, setAddressForm]   = useState({});
  const [saving, setSaving]     = useState(false);

  // Return modal
  const [returnModal, setReturnModal]       = useState(null);
  const [returnStep, setReturnStep]         = useState(1);
  const [returnForm, setReturnForm]         = useState({ type: '', items: [], reason: '', description: '' });
  const [submittingReturn, setSubmittingReturn] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [ordersRes, returnsRes] = await Promise.all([
        API.get('/orders/my'),
        API.get('/returns/my'),
      ]);
      setOrders(ordersRes.data.orders || []);
      setReturns(returnsRes.data.returns || []);
      if (ordersRes.data.orders?.length > 0) setExpanded(ordersRes.data.orders[0]._id);
    } catch {
      toast.error('Failed to load orders');
    } finally { setLoading(false); }
  };

  const handleCancel = (id) => {
    // Optimistic - turant UI update karo
    setOrders(prev => prev.map(o => o._id === id ? { ...o, status: 'Cancelled' } : o));
    setCancelId(null);
    toast.success('Order cancelled');
    // Background mein API call
    API.put(`/orders/${id}/cancel`).catch(err => {
      console.error('Cancel failed:', err);
    });
  };

  const openAddressModal = (order) => {
    setAddressForm({ ...order.shippingAddress });
    setAddressModal(order._id);
  };

  const handleAddressUpdate = async () => {
    setSaving(true);
    try {
      await API.put(`/orders/${addressModal}/address`, { shippingAddress: addressForm });
      toast.success('Address updated!');
      setAddressModal(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const openReturnModal = (order) => {
    const items = order.items.map(i => ({
      product: i.product?._id || i.product,
      productName: i.product?.name,
      productImage: i.product?.images?.[0],
      qty: i.qty,
      selected: true,
      exchangeSize: '',
      exchangeColor: '',
    }));
    setReturnForm({ type: '', items, reason: '', description: '' });
    setReturnStep(1);
    setReturnModal(order);
  };

  const handleReturnSubmit = async () => {
    if (!returnForm.type)   { toast.error('Select return type'); return; }
    if (!returnForm.reason) { toast.error('Select a reason'); return; }
    const selectedItems = returnForm.items.filter(i => i.selected);
    if (!selectedItems.length) { toast.error('Select at least one item'); return; }

    setSubmittingReturn(true);
    try {
      await API.post('/returns', {
        orderId: returnModal._id,
        type: returnForm.type,
        reason: returnForm.reason,
        description: returnForm.description,
        items: selectedItems.map(i => ({
          product: i.product,
          qty: i.qty,
          exchangeSize: i.exchangeSize,
          exchangeColor: i.exchangeColor,
        })),
      });
      toast.success('Return request submitted! ✅');
      setReturnModal(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally { setSubmittingReturn(false); }
  };

  const getReturnForOrder = (orderId) =>
    returns.find(r => (r.order?._id || r.order)?.toString() === orderId?.toString() && r.status !== 'Rejected');

  const formatDate     = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatDateTime = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  if (loading) return (
    <div className="min-h-screen pt-32 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!orders.length) return (
    <div className="min-h-screen pt-32 flex items-center justify-center text-center px-4">
      <div>
        <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <FiPackage className="w-12 h-12 text-white/20" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">No orders yet</h2>
        <p className="text-white/40 mb-6">You haven't placed any orders.</p>
        <Link to="/products" className="btn-primary inline-flex">Start Shopping</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-32 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-white/40 hover:text-primary-400 transition-colors text-sm mb-4">
          ← Back to Home
        </Link>
        <h1 className="font-display text-3xl font-bold text-white mb-6">My Orders</h1>

        <div className="space-y-4">
          {orders.map(order => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.Pending;
            const StatusIcon = cfg.icon;
            const isExpanded = expanded === order._id;
            const currentStep = PROGRESS_STEPS.indexOf(order.status);
            const isCancelled = order.status === 'Cancelled';
            const isDelivered = order.status === 'Delivered';
            const daysSince   = getDaysSinceDelivery(order);
            const canReturn   = isDelivered && daysSince <= RETURN_WINDOW_DAYS;
            const existingReturn = getReturnForOrder(order._id);

            // Return progress steps
            const returnSteps = existingReturn?.type === 'Exchange' ? RETURN_STEPS_EXCHANGE : RETURN_STEPS_REFUND;
            const returnStepIdx = existingReturn ? returnSteps.indexOf(existingReturn.status) : -1;

            return (
              <div key={order._id} className="bg-dark-800/60 border border-white/8 rounded-2xl overflow-hidden">

                {/* Header */}
                <button onClick={() => setExpanded(isExpanded ? null : order._id)}
                  className="w-full flex items-center gap-4 p-5 hover:bg-white/3 transition-colors text-left">
                  <div className={`w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0`}>
                    <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold text-sm font-mono">
                        #{order._id.slice(-8).toUpperCase()}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                        {order.status}
                      </span>
                      {existingReturn && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${RETURN_STATUS_CONFIG[existingReturn.status]?.bg} ${RETURN_STATUS_CONFIG[existingReturn.status]?.border} ${RETURN_STATUS_CONFIG[existingReturn.status]?.color}`}>
                          {RETURN_STATUS_CONFIG[existingReturn.status]?.label}
                        </span>
                      )}
                    </div>
                    <p className="text-white/40 text-xs mt-0.5">
                      {formatDate(order.createdAt)} · {order.items?.length} item{order.items?.length !== 1 ? 's' : ''} · ₹{order.totalAmount?.toLocaleString()}
                    </p>
                    {order.estimatedDelivery && !isCancelled && (
                      <p className="text-primary-400 text-xs mt-0.5">📅 Est. {order.estimatedDelivery}</p>
                    )}
                    {canReturn && !existingReturn && (
                      <p className="text-orange-400 text-xs mt-0.5">
                        ↩ Return/Exchange eligible · {Math.ceil(RETURN_WINDOW_DAYS - daysSince)} days left
                      </p>
                    )}
                  </div>
                  {isExpanded ? <FiChevronUp className="w-5 h-5 text-white/30 flex-shrink-0" /> : <FiChevronDown className="w-5 h-5 text-white/30 flex-shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-white/8 px-5 pb-5">

                    {/* Order progress bar */}
                    {!isCancelled && !existingReturn && (
                      <div className="py-5">
                        <div className="flex items-center justify-between relative">
                          <div className="absolute left-0 right-0 top-4 h-0.5 bg-white/10 -z-0"></div>
                          <div className="absolute left-0 top-4 h-0.5 bg-primary-500 -z-0 transition-all duration-700"
                            style={{ width: `${Math.max(0, (currentStep / (PROGRESS_STEPS.length - 1)) * 100)}%` }}></div>
                          {PROGRESS_STEPS.map((s, i) => (
                            <div key={s} className="flex flex-col items-center gap-1.5 z-10 flex-1">
                              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                                i <= currentStep ? 'bg-primary-500 border-primary-500 text-white' : 'bg-dark-800 border-white/20 text-white/30'
                              }`}>
                                {i < currentStep ? '✓' : i + 1}
                              </div>
                              <span className={`text-[10px] font-medium ${i <= currentStep ? 'text-white/70' : 'text-white/25'}`}>{s}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── RETURN STATUS SECTION ── */}
                    {existingReturn && (
                      <div className="mt-4 mb-4">
                        {/* Return type header */}
                        <div className={`rounded-xl p-4 border mb-4 ${
                          existingReturn.status === 'Rejected'
                            ? 'bg-red-500/10 border-red-500/25'
                            : existingReturn.status === 'Refund Processed' || existingReturn.status === 'Exchange Delivered'
                            ? 'bg-green-500/10 border-green-500/25'
                            : 'bg-white/3 border-white/10'
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <p className={`text-sm font-bold ${RETURN_STATUS_CONFIG[existingReturn.status]?.color}`}>
                              {existingReturn.type === 'Refund' ? '💰 Return & Refund' : '🔄 Exchange'} · {RETURN_STATUS_CONFIG[existingReturn.status]?.label}
                            </p>
                            <FiRefreshCw className={`w-4 h-4 ${RETURN_STATUS_CONFIG[existingReturn.status]?.color}`} />
                          </div>

                          {/* Return progress steps */}
                          {existingReturn.status !== 'Rejected' && (
                            <div className="relative">
                              <div className="flex items-start gap-0 overflow-x-auto pb-1">
                                {returnSteps.map((step, i) => {
                                  const done = i <= returnStepIdx;
                                  const current = i === returnStepIdx;
                                  return (
                                    <div key={step} className="flex flex-col items-center flex-1 min-w-0">
                                      <div className="flex items-center w-full">
                                        {i > 0 && <div className={`flex-1 h-0.5 ${i <= returnStepIdx ? 'bg-primary-500' : 'bg-white/10'}`} />}
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                                          done ? 'bg-primary-500 border-primary-500 text-white' : 'bg-dark-800 border-white/20 text-white/30'
                                        }`}>
                                          {i < returnStepIdx ? '✓' : i + 1}
                                        </div>
                                        {i < returnSteps.length - 1 && <div className={`flex-1 h-0.5 ${i < returnStepIdx ? 'bg-primary-500' : 'bg-white/10'}`} />}
                                      </div>
                                      <span className={`text-[8px] font-medium text-center mt-1 leading-tight px-0.5 ${done ? 'text-white/60' : 'text-white/20'}`}>
                                        {step.replace('by Company', '').replace('Processing', 'Processing').replace('Exchange ', '')}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Rejection note */}
                          {existingReturn.status === 'Rejected' && existingReturn.adminNote && (
                            <p className="text-red-300 text-xs mt-2">Reason: {existingReturn.adminNote}</p>
                          )}
                        </div>

                        {/* Pickup details */}
                        {existingReturn.pickupDate && (
                          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 mb-3">
                            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1.5">Pickup Details</p>
                            <p className="text-purple-300 text-sm font-semibold">📅 {existingReturn.pickupDate}</p>
                            {existingReturn.pickupTimeSlot && (
                              <p className="text-purple-400 text-xs mt-0.5">🕐 {existingReturn.pickupTimeSlot}</p>
                            )}
                            <p className="text-white/30 text-xs mt-1">Please keep the item ready at your delivery address.</p>
                          </div>
                        )}

                        {/* Exchange tracking */}
                        {existingReturn.exchangeTrackingNumber && (
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-3 flex items-center gap-3">
                            <FiTruck className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            <div>
                              <p className="text-white/40 text-xs">Exchange Tracking Number</p>
                              <p className="text-blue-300 font-mono font-bold tracking-widest text-sm">{existingReturn.exchangeTrackingNumber}</p>
                            </div>
                          </div>
                        )}

                        {/* Refund info */}
                        {existingReturn.refundAmount && existingReturn.status === 'Refund Processed' && (
                          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 mb-3">
                            <p className="text-green-400 text-sm font-bold">✅ ₹{existingReturn.refundAmount?.toLocaleString()} Refunded</p>
                            <p className="text-white/40 text-xs mt-0.5">
                              {order.paymentMethod === 'Razorpay'
                                ? 'Refund will reflect in your account within 5-7 business days.'
                                : 'Refund will be transferred to your bank account.'}
                            </p>
                            {existingReturn.refundId && (
                              <p className="text-white/25 text-xs font-mono mt-1">{existingReturn.refundId}</p>
                            )}
                          </div>
                        )}

                        {/* Return timeline */}
                        {existingReturn.statusHistory?.length > 0 && (
                          <div className="mt-3">
                            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Return Timeline</p>
                            <div className="space-y-0">
                              {[...existingReturn.statusHistory].reverse().map((h, i) => {
                                const hCfg = RETURN_STATUS_CONFIG[h.status];
                                return (
                                  <div key={i} className="flex gap-3 items-start">
                                    <div className="flex flex-col items-center">
                                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${i === 0 ? 'bg-primary-500' : 'bg-white/20'}`} />
                                      {i < existingReturn.statusHistory.length - 1 && <div className="w-px h-5 bg-white/10 my-0.5" />}
                                    </div>
                                    <div className="pb-2">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-xs font-semibold ${hCfg?.color || 'text-white'}`}>{h.status}</span>
                                        <span className="text-white/25 text-xs">{formatDateTime(h.timestamp)}</span>
                                      </div>
                                      {h.message && <p className="text-white/40 text-xs mt-0.5">{h.message}</p>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tracking number */}
                    {order.trackingNumber && !existingReturn && (
                      <div className="mb-4 bg-purple-500/10 border border-purple-500/25 rounded-xl px-4 py-3 flex items-center gap-3">
                        <FiTruck className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <div>
                          <p className="text-white/40 text-xs">Tracking Number</p>
                          <p className="text-purple-300 font-mono font-bold tracking-widest text-sm">{order.trackingNumber}</p>
                        </div>
                      </div>
                    )}

                    {/* Items */}
                    <div className="space-y-3 mb-4">
                      {order.items?.map((item, i) => (
                        <Link to={`/product/${item.product?._id}`} key={i}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/6 transition-colors">
                          <img src={item.product?.images?.[0] || '/placeholder.png'}
                            alt={item.product?.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{item.product?.name}</p>
                            <p className="text-white/40 text-xs">Qty: {item.qty}</p>
                          </div>
                          <p className="text-primary-400 font-semibold text-sm">₹{(item.price * item.qty).toLocaleString()}</p>
                        </Link>
                      ))}
                    </div>

                    {/* Order Timeline */}
                    {order.statusHistory?.length > 0 && (
                      <div className="mb-4">
                        <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">Order Timeline</p>
                        <div className="space-y-0">
                          {[...order.statusHistory].reverse().map((h, i) => {
                            const hCfg = STATUS_CONFIG[h.status] || STATUS_CONFIG.Pending;
                            return (
                              <div key={i} className="flex gap-3 items-start">
                                <div className="flex flex-col items-center">
                                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${i === 0 ? 'bg-primary-500' : 'bg-white/20'}`} />
                                  {i < order.statusHistory.length - 1 && <div className="w-px h-6 bg-white/10 my-0.5" />}
                                </div>
                                <div className="pb-3">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-semibold ${hCfg.color}`}>{h.status}</span>
                                    <span className="text-white/25 text-xs">{formatDateTime(h.timestamp)}</span>
                                  </div>
                                  {h.message && <p className="text-white/40 text-xs mt-0.5">{h.message}</p>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Shipping Address */}
                    {order.shippingAddress && (
                      <div className="mb-4 bg-white/3 border border-white/8 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">Shipping Address</p>
                          {!['Shipped', 'Delivered', 'Cancelled'].includes(order.status) && (
                            <button onClick={() => openAddressModal(order)}
                              className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors">
                              <FiEdit2 className="w-3 h-3" /> Change
                            </button>
                          )}
                        </div>
                        <p className="text-white text-sm font-semibold">{order.shippingAddress.name}</p>
                        <p className="text-white/50 text-xs leading-relaxed">
                          {order.shippingAddress.line1}{order.shippingAddress.line2 ? ', ' + order.shippingAddress.line2 : ''}<br />
                          {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}<br />
                          📞 {order.shippingAddress.phone}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 flex-wrap">
                      {!['Shipped', 'Delivered', 'Cancelled'].includes(order.status) && (
                        <button onClick={() => setCancelId(order._id)}
                          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 px-4 py-2 rounded-xl transition-all">
                          <FiX className="w-4 h-4" /> Cancel Order
                        </button>
                      )}
                      {canReturn && !existingReturn && (
                        <button onClick={() => openReturnModal(order)}
                          className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 border border-orange-500/20 hover:border-orange-500/40 px-4 py-2 rounded-xl transition-all">
                          <FiRefreshCw className="w-4 h-4" /> Return / Exchange
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Cancel Modal ── */}
      {cancelId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-white/10 rounded-2xl p-6 max-w-sm w-full">
            <div className="w-12 h-12 bg-red-500/15 rounded-xl flex items-center justify-center mx-auto mb-4">
              <FiAlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-white font-bold text-lg text-center mb-2">Cancel Order?</h3>
            <p className="text-white/40 text-sm text-center mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setCancelId(null)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white transition-all text-sm font-medium">
                Keep Order
              </button>
              <button onClick={() => handleCancel(cancelId)}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all">
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Address Modal ── */}
      {addressModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-white/10 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg">Change Address</h3>
              <button onClick={() => setAddressModal(null)} className="text-white/40 hover:text-white transition-colors">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {[['name','Full Name'],['phone','Phone Number'],['line1','Address Line 1'],['line2','Address Line 2 (Optional)'],['city','City'],['pincode','Pincode']].map(([k, label]) => (
                <div key={k}>
                  <label className="text-white/50 text-xs mb-1 block">{label}</label>
                  <input value={addressForm[k] || ''} onChange={e => setAddressForm(p => ({ ...p, [k]: e.target.value }))}
                    className="input-field w-full text-sm" placeholder={label} />
                </div>
              ))}
              <div>
                <label className="text-white/50 text-xs mb-1 block">State</label>
                <select value={addressForm.state || ''} onChange={e => setAddressForm(p => ({ ...p, state: e.target.value }))}
                  className="input-field w-full text-sm">
                  <option value="">Select State</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setAddressModal(null)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-medium hover:text-white transition-all">
                Cancel
              </button>
              <button onClick={handleAddressUpdate} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm transition-all disabled:opacity-50">
                {saving ? 'Saving...' : 'Update Address'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Return Modal ── */}
      {returnModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-white/10 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-white font-bold text-lg">Return / Exchange</h3>
              <button onClick={() => setReturnModal(null)} className="text-white/40 hover:text-white transition-colors">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <p className="text-white/30 text-xs mb-5">Order #{returnModal._id.slice(-8).toUpperCase()}</p>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              {[1,2,3].map(s => (
                <div key={s} className={`flex-1 h-1 rounded-full transition-all ${returnStep >= s ? 'bg-primary-500' : 'bg-white/10'}`} />
              ))}
            </div>

            {/* Step 1: Type */}
            {returnStep === 1 && (
              <div className="space-y-3">
                <p className="text-white/60 text-sm mb-4">What would you like to do?</p>
                {['Refund', 'Exchange'].map(type => (
                  <button key={type} onClick={() => setReturnForm(p => ({ ...p, type }))}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      returnForm.type === type ? 'border-primary-500/60 bg-primary-500/10' : 'border-white/10 bg-white/3 hover:border-white/25'
                    }`}>
                    <p className="text-white font-semibold text-sm">
                      {type === 'Refund' ? '💰 Return & Refund' : '🔄 Exchange'}
                    </p>
                    <p className="text-white/40 text-xs mt-1">
                      {type === 'Refund'
                        ? 'Return the product and get your money back'
                        : 'Exchange for same product in different size/color'}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Items + Reason */}
            {returnStep === 2 && (
              <div className="space-y-4">
                <div>
                  <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Select Items</p>
                  <div className="space-y-2">
                    {returnForm.items.map((item, idx) => (
                      <div key={idx} className={`rounded-xl border p-3 transition-all ${item.selected ? 'border-primary-500/40 bg-primary-500/5' : 'border-white/10 bg-white/3'}`}>
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={item.selected}
                            onChange={e => {
                              const updated = [...returnForm.items];
                              updated[idx].selected = e.target.checked;
                              setReturnForm(p => ({ ...p, items: updated }));
                            }}
                            className="w-4 h-4 accent-primary-500" />
                          <img src={item.productImage || '/placeholder.png'} alt=""
                            className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-medium truncate">{item.productName}</p>
                            <p className="text-white/40 text-xs">Qty: {item.qty}</p>
                          </div>
                        </div>
                        {item.selected && returnForm.type === 'Exchange' && (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-white/40 text-xs mb-1 block">New Size</label>
                              <input value={item.exchangeSize}
                                onChange={e => {
                                  const updated = [...returnForm.items];
                                  updated[idx].exchangeSize = e.target.value;
                                  setReturnForm(p => ({ ...p, items: updated }));
                                }}
                                placeholder="e.g. M, L, XL" className="input-field w-full text-xs py-1.5" />
                            </div>
                            <div>
                              <label className="text-white/40 text-xs mb-1 block">New Color</label>
                              <input value={item.exchangeColor}
                                onChange={e => {
                                  const updated = [...returnForm.items];
                                  updated[idx].exchangeColor = e.target.value;
                                  setReturnForm(p => ({ ...p, items: updated }));
                                }}
                                placeholder="e.g. Red, Blue" className="input-field w-full text-xs py-1.5" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2 block">Reason</label>
                  <div className="space-y-1.5">
                    {RETURN_REASONS.map(r => (
                      <button key={r} onClick={() => setReturnForm(p => ({ ...p, reason: r }))}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition-all ${
                          returnForm.reason === r ? 'border-primary-500/50 bg-primary-500/10 text-white' : 'border-white/8 bg-white/3 text-white/50 hover:text-white/80'
                        }`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Additional Details (Optional)</label>
                  <textarea value={returnForm.description}
                    onChange={e => setReturnForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Describe the issue..." rows={3}
                    className="input-field w-full text-sm resize-none" />
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {returnStep === 3 && (
              <div className="space-y-4">
                <div className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Type</span>
                    <span className="text-white font-semibold">{returnForm.type === 'Refund' ? '💰 Return & Refund' : '🔄 Exchange'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Items</span>
                    <span className="text-white font-semibold">{returnForm.items.filter(i => i.selected).length} item(s)</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Reason</span>
                    <span className="text-white font-semibold text-right max-w-[60%]">{returnForm.reason}</span>
                  </div>
                  {returnForm.type === 'Refund' && (
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Refund Amount</span>
                      <span className="text-green-400 font-bold">₹{returnModal.totalAmount?.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <div className="bg-orange-500/10 border border-orange-500/25 rounded-xl p-3">
                  <p className="text-orange-300 text-xs">
                    📦 After approval, our team will schedule a pickup with date & time slot.
                    {returnForm.type === 'Refund'
                      ? ' Refund will be processed within 5-7 business days after item is received.'
                      : ' Exchange item will be shipped after your item is received by us.'}
                  </p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-6">
              {returnStep > 1 ? (
                <button onClick={() => setReturnStep(s => s - 1)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-medium hover:text-white transition-all flex items-center justify-center gap-2">
                  <FiArrowLeft className="w-4 h-4" /> Back
                </button>
              ) : (
                <button onClick={() => setReturnModal(null)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-medium hover:text-white transition-all">
                  Cancel
                </button>
              )}
              {returnStep < 3 ? (
                <button onClick={() => {
                  if (returnStep === 1 && !returnForm.type) { toast.error('Select type'); return; }
                  if (returnStep === 2 && !returnForm.reason) { toast.error('Select a reason'); return; }
                  if (returnStep === 2 && !returnForm.items.some(i => i.selected)) { toast.error('Select at least one item'); return; }
                  setReturnStep(s => s + 1);
                }}
                  className="flex-1 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm transition-all">
                  Continue →
                </button>
              ) : (
                <button onClick={handleReturnSubmit} disabled={submittingReturn}
                  className="flex-1 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm transition-all disabled:opacity-50">
                  {submittingReturn ? 'Submitting...' : 'Submit Request ✅'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}