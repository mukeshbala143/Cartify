import { useEffect, useState } from 'react';
import {
  FiRefreshCw, FiX, FiChevronDown, FiChevronUp,
  FiDollarSign, FiCalendar, FiTruck, FiPackage
} from 'react-icons/fi';
import API from '../../utils/api';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  Requested:              { color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30' },
  Approved:               { color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30' },
  Rejected:               { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30' },
  'Pickup Scheduled':     { color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/30' },
  'Picked Up':            { color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30' },
  'Received by Company':  { color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/30' },
  'Refund Processed':     { color: 'text-green-400',   bg: 'bg-green-500/10',   border: 'border-green-500/30' },
  'Exchange Processing':  { color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30' },
  'Exchange Shipped':     { color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/30' },
  'Exchange Delivered':   { color: 'text-green-400',   bg: 'bg-green-500/10',   border: 'border-green-500/30' },
};

// Next actions based on current status + type
const getNextActions = (status, type) => {
  const map = {
    Requested:              ['Approved', 'Rejected'],
    Approved:               ['Pickup Scheduled'],
    'Pickup Scheduled':     ['Picked Up'],
    'Picked Up':            ['Received by Company'],
    'Received by Company':  type === 'Refund' ? ['Refund Processed'] : ['Exchange Processing'],
    'Exchange Processing':  ['Exchange Shipped'],
    'Exchange Shipped':     ['Exchange Delivered'],
  };
  return map[status] || [];
};

const ACTION_LABELS = {
  Approved:              { emoji: '✅', label: 'Approve' },
  Rejected:              { emoji: '❌', label: 'Reject' },
  'Pickup Scheduled':    { emoji: '📅', label: 'Schedule Pickup' },
  'Picked Up':           { emoji: '📦', label: 'Mark Picked Up' },
  'Received by Company': { emoji: '🏭', label: 'Mark Received' },
  'Refund Processed':    { emoji: '💰', label: 'Process Refund' },
  'Exchange Processing': { emoji: '⚙️', label: 'Start Exchange' },
  'Exchange Shipped':    { emoji: '🚚', label: 'Mark Shipped' },
  'Exchange Delivered':  { emoji: '✅', label: 'Mark Delivered' },
};

const TIME_SLOTS = [
  '9:00 AM - 11:00 AM',
  '11:00 AM - 1:00 PM',
  '1:00 PM - 3:00 PM',
  '3:00 PM - 5:00 PM',
  '5:00 PM - 7:00 PM',
];

const STAT_STATUSES = ['Requested', 'Approved', 'Pickup Scheduled', 'Received by Company', 'Refund Processed', 'Rejected'];

export default function AdminReturns() {
  const [returns, setReturns]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState('All');
  const [expanded, setExpanded]       = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [actionForm, setActionForm]   = useState({
    adminNote: '', pickupDate: '', pickupTimeSlot: '', refundAmount: '', exchangeTrackingNumber: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchReturns(); }, [filter]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const params = filter !== 'All' ? `?status=${encodeURIComponent(filter)}` : '';
      const { data } = await API.get(`/returns/admin/all${params}`);
      setReturns(data.returns || []);
    } catch {
      toast.error('Failed to load returns');
    } finally { setLoading(false); }
  };

  const openAction = (returnItem, nextStatus) => {
    setActionForm({
      adminNote: '',
      pickupDate: '',
      pickupTimeSlot: '',
      refundAmount: returnItem.order?.totalAmount || '',
      exchangeTrackingNumber: '',
    });
    setActionModal({ returnItem, nextStatus });
  };

  const handleAction = async () => {
    const { nextStatus, returnItem } = actionModal;
    if (nextStatus === 'Pickup Scheduled' && !actionForm.pickupDate) {
      toast.error('Pickup date required'); return;
    }
    if (nextStatus === 'Pickup Scheduled' && !actionForm.pickupTimeSlot) {
      toast.error('Time slot required'); return;
    }
    if (nextStatus === 'Rejected' && !actionForm.adminNote) {
      toast.error('Rejection reason required'); return;
    }

    setSaving(true);
    try {
      const payload = {
        status: nextStatus,
        adminNote: actionForm.adminNote,
        pickupDate: actionForm.pickupDate,
        pickupTimeSlot: actionForm.pickupTimeSlot,
        exchangeTrackingNumber: actionForm.exchangeTrackingNumber,
      };
      if (actionForm.refundAmount) payload.refundAmount = Number(actionForm.refundAmount);

      await API.put(`/returns/admin/${returnItem._id}/status`, payload);
      toast.success(`Updated to "${nextStatus}" ✅`);
      setActionModal(null);
      fetchReturns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const formatDate     = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatDateTime = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {STAT_STATUSES.map(s => (
          <div key={s} className="bg-white/3 border border-white/8 rounded-xl p-3 text-center">
            <p className={`text-lg font-bold ${STATUS_CONFIG[s]?.color}`}>
              {returns.filter(r => r.status === s).length}
            </p>
            <p className="text-white/35 text-xs mt-0.5 leading-tight">{s}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['All', 'Requested', 'Approved', 'Pickup Scheduled', 'Picked Up', 'Received by Company', 'Refund Processed', 'Exchange Processing', 'Exchange Shipped', 'Rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              filter === s
                ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                : 'bg-white/3 border-white/10 text-white/40 hover:text-white/70'
            }`}>
            {s}
          </button>
        ))}
        <button onClick={fetchReturns} className="p-1.5 rounded-xl bg-white/3 border border-white/10 text-white/40 hover:text-white transition-colors">
          <FiRefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : returns.length === 0 ? (
        <div className="text-center py-16">
          <FiRefreshCw className="w-12 h-12 text-white/15 mx-auto mb-3" />
          <p className="text-white/30">No return requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {returns.map(r => {
            const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.Requested;
            const isExpanded = expanded === r._id;
            const nextActions = getNextActions(r.status, r.type);

            return (
              <div key={r._id} className="bg-dark-800/60 border border-white/8 rounded-2xl overflow-hidden">

                {/* Row */}
                <div className="flex items-center gap-4 p-4">
                  <button onClick={() => setExpanded(isExpanded ? null : r._id)}
                    className="flex-1 flex items-center gap-4 text-left min-w-0">
                    <div className={`w-9 h-9 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0`}>
                      <FiRefreshCw className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-semibold text-sm font-mono">
                          #{(r.order?._id || r.order)?.toString().slice(-8).toUpperCase()}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                          {r.status}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${
                          r.type === 'Refund'
                            ? 'bg-green-500/10 border-green-500/30 text-green-400'
                            : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                        }`}>
                          {r.type === 'Refund' ? '💰 Refund' : '🔄 Exchange'}
                        </span>
                      </div>
                      <p className="text-white/35 text-xs mt-0.5 truncate">
                        {r.user?.name} · {r.user?.email} · {formatDate(r.createdAt)}
                      </p>
                      <p className="text-white/25 text-xs truncate">{r.reason}</p>
                    </div>
                  </button>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {nextActions.map(action => {
                      const a = ACTION_LABELS[action] || { emoji: '→', label: action };
                      return (
                        <button key={action} onClick={() => openAction(r, action)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all whitespace-nowrap ${
                            action === 'Rejected'
                              ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                              : action === 'Refund Processed'
                              ? 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                              : 'border-primary-500/30 text-primary-400 hover:bg-primary-500/10'
                          }`}>
                          {a.emoji} {a.label}
                        </button>
                      );
                    })}
                    <button onClick={() => setExpanded(isExpanded ? null : r._id)}
                      className="p-1.5 text-white/30 hover:text-white transition-colors">
                      {isExpanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-white/8 px-4 pb-4 pt-3 grid sm:grid-cols-2 gap-4">

                    {/* Items */}
                    <div>
                      <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Return Items</p>
                      <div className="space-y-2">
                        {r.items?.map((item, i) => (
                          <div key={i} className="flex items-center gap-3 bg-white/3 rounded-xl p-2.5">
                            <img src={item.product?.images?.[0] || '/placeholder.png'} alt=""
                              className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-xs font-medium truncate">{item.product?.name}</p>
                              <p className="text-white/35 text-xs">Qty: {item.qty}</p>
                              {item.exchangeSize  && <p className="text-blue-400 text-xs">New Size: {item.exchangeSize}</p>}
                              {item.exchangeColor && <p className="text-blue-400 text-xs">New Color: {item.exchangeColor}</p>}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Reason */}
                      <div className="mt-3 bg-white/3 rounded-xl p-3">
                        <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">Reason</p>
                        <p className="text-white text-xs font-medium">{r.reason}</p>
                        {r.description && <p className="text-white/40 text-xs mt-1">{r.description}</p>}
                      </div>
                    </div>

                    {/* Status details */}
                    <div className="space-y-3">

                      {/* Pickup info */}
                      {r.pickupDate && (
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
                          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1.5">Pickup Details</p>
                          <div className="flex items-center gap-2 text-purple-300 text-xs">
                            <FiCalendar className="w-3.5 h-3.5" />
                            <span className="font-semibold">{r.pickupDate}</span>
                          </div>
                          {r.pickupTimeSlot && (
                            <p className="text-purple-400 text-xs mt-1">🕐 {r.pickupTimeSlot}</p>
                          )}
                        </div>
                      )}

                      {/* Exchange tracking */}
                      {r.exchangeTrackingNumber && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                          <p className="text-white/40 text-xs mb-1">Exchange Tracking</p>
                          <p className="text-blue-300 font-mono font-bold text-sm tracking-widest">{r.exchangeTrackingNumber}</p>
                        </div>
                      )}

                      {/* Refund info */}
                      {r.refundAmount && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                          <div className="flex items-center gap-2">
                            <FiDollarSign className="w-4 h-4 text-green-400" />
                            <div>
                              <p className="text-white/40 text-xs">Refund</p>
                              <p className="text-green-400 font-bold text-sm">₹{r.refundAmount?.toLocaleString()}</p>
                              {r.refundId && <p className="text-white/30 text-xs font-mono">{r.refundId}</p>}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Admin note */}
                      {r.adminNote && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                          <p className="text-white/40 text-xs mb-1">Admin Note</p>
                          <p className="text-white/70 text-xs">{r.adminNote}</p>
                        </div>
                      )}

                      {/* Timeline */}
                      {r.statusHistory?.length > 0 && (
                        <div>
                          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Timeline</p>
                          <div className="space-y-1">
                            {[...r.statusHistory].reverse().map((h, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${i === 0 ? 'bg-primary-500' : 'bg-white/20'}`} />
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
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Action Modal ── */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-white/10 rounded-2xl p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">
                {ACTION_LABELS[actionModal.nextStatus]?.emoji} {ACTION_LABELS[actionModal.nextStatus]?.label}
              </h3>
              <button onClick={() => setActionModal(null)} className="text-white/40 hover:text-white">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <p className="text-white/40 text-xs mb-4">
              Order #{(actionModal.returnItem.order?._id || actionModal.returnItem.order)?.toString().slice(-8).toUpperCase()} ·
              <span className={`ml-1 font-bold ${actionModal.returnItem.type === 'Refund' ? 'text-green-400' : 'text-blue-400'}`}>
                {actionModal.returnItem.type}
              </span>
            </p>

            <div className="space-y-4">

              {/* Pickup date + time slot */}
              {actionModal.nextStatus === 'Pickup Scheduled' && (
                <>
                  <div>
                    <label className="text-white/50 text-xs mb-1.5 block">Pickup Date *</label>
                    <input type="date" value={actionForm.pickupDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setActionForm(p => ({ ...p, pickupDate: e.target.value }))}
                      className="input-field w-full text-sm" />
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1.5 block">Time Slot *</label>
                    <div className="grid grid-cols-1 gap-1.5">
                      {TIME_SLOTS.map(slot => (
                        <button key={slot} type="button"
                          onClick={() => setActionForm(p => ({ ...p, pickupTimeSlot: slot }))}
                          className={`px-3 py-2 rounded-lg text-xs border text-left transition-all ${
                            actionForm.pickupTimeSlot === slot
                              ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                              : 'bg-white/3 border-white/10 text-white/50 hover:text-white/80'
                          }`}>
                          🕐 {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Refund amount */}
              {actionModal.nextStatus === 'Refund Processed' && (
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Refund Amount (₹)</label>
                  <input type="number" value={actionForm.refundAmount}
                    onChange={e => setActionForm(p => ({ ...p, refundAmount: e.target.value }))}
                    className="input-field w-full text-sm" />
                  {actionModal.returnItem.order?.paymentMethod === 'Razorpay' ? (
                    <p className="text-blue-400 text-xs mt-1">⚡ Razorpay auto-refund will be triggered</p>
                  ) : (
                    <p className="text-orange-400 text-xs mt-1">💵 COD — process refund manually</p>
                  )}
                </div>
              )}

              {/* Exchange tracking */}
              {actionModal.nextStatus === 'Exchange Shipped' && (
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Tracking Number *</label>
                  <input value={actionForm.exchangeTrackingNumber}
                    onChange={e => setActionForm(p => ({ ...p, exchangeTrackingNumber: e.target.value }))}
                    placeholder="e.g. IND123456789"
                    className="input-field w-full text-sm" />
                </div>
              )}

              {/* Note / rejection reason */}
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">
                  {actionModal.nextStatus === 'Rejected' ? 'Rejection Reason *' : 'Note for Customer (Optional)'}
                </label>
                <input value={actionForm.adminNote}
                  onChange={e => setActionForm(p => ({ ...p, adminNote: e.target.value }))}
                  placeholder={actionModal.nextStatus === 'Rejected' ? 'Why is this request rejected?' : 'Optional message...'}
                  className="input-field w-full text-sm" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setActionModal(null)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-medium hover:text-white transition-all">
                Cancel
              </button>
              <button onClick={handleAction} disabled={saving}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 text-white ${
                  actionModal.nextStatus === 'Rejected' ? 'bg-red-500 hover:bg-red-600' : 'bg-primary-500 hover:bg-primary-600'
                }`}>
                {saving ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}