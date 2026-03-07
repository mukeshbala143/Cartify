import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FiMapPin, FiPlus, FiEdit2, FiTrash2, FiCheck, FiArrowLeft } from 'react-icons/fi';
import API from '../utils/api';
import toast from 'react-hot-toast';

const emptyForm = { name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: false };
const INDIAN_STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh','Puducherry'];

export default function AddressesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchAddresses();
  }, [user]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/addresses');
      setAddresses(data.addresses || data || []);
    } catch { toast.error('Failed to load addresses'); }
    finally { setLoading(false); }
  };

  const saveAddress = async () => {
    if (!form.name || !form.phone || !form.line1 || !form.city || !form.state || !form.pincode) { toast.error('Please fill all required fields'); return; }
    if (!/^\d{6}$/.test(form.pincode)) { toast.error('Pincode must be 6 digits'); return; }
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) { toast.error('Phone must be 10 digits'); return; }
    try {
      setSaving(true);
      if (editId) { await API.put(`/addresses/${editId}`, form); toast.success('Address updated!'); }
      else { await API.post('/addresses', form); toast.success('Address saved!'); }
      setForm(emptyForm); setEditId(null); setShowForm(false);
      fetchAddresses();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const deleteAddress = async (id) => {
    try {
      await API.delete(`/addresses/${id}`);
      toast.success('Address deleted');
      setDeleteConfirm(null);
      fetchAddresses();
    } catch { toast.error('Failed to delete'); }
  };

  const startEdit = (addr) => {
    setForm({ name: addr.name, phone: addr.phone, line1: addr.line1, line2: addr.line2 || '', city: addr.city, state: addr.state, pincode: addr.pincode, isDefault: addr.isDefault });
    setEditId(addr._id); setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setAsDefault = async (id) => {
    try { await API.put(`/addresses/${id}`, { isDefault: true }); toast.success('Default address updated!'); fetchAddresses(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* Back Button */}
        <Link to="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-6 text-sm">
          <FiArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-black text-white mb-1">Saved Addresses</h1>
            <p className="text-white/30 text-sm">{addresses.length} address{addresses.length !== 1 ? 'es' : ''} saved</p>
          </div>
          {!showForm && (
            <button onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }} className="btn-primary flex items-center gap-2">
              <FiPlus className="w-4 h-4" /> Add Address
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="card p-6 mb-6">
            <h3 className="font-display text-lg font-bold text-white mb-5">{editId ? '✏️ Edit Address' : '📍 Add New Address'}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block font-medium">Full Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Mukesh Bala" className="input-field" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block font-medium">Phone *</label>
                  <input type="tel" value={form.phone} onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 10) setForm(f => ({ ...f, phone: v })); }} placeholder="10 digit number" className="input-field" />
                </div>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block font-medium">Address Line 1 *</label>
                <input type="text" value={form.line1} onChange={e => setForm(f => ({ ...f, line1: e.target.value }))} placeholder="House no., Street, Area" className="input-field" />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block font-medium">Address Line 2</label>
                <input type="text" value={form.line2} onChange={e => setForm(f => ({ ...f, line2: e.target.value }))} placeholder="Landmark (optional)" className="input-field" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block font-medium">City *</label>
                  <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="City" className="input-field" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block font-medium">State *</label>
                  <select value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="input-field appearance-none">
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block font-medium">Pincode *</label>
                  <input type="text" value={form.pincode} onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 6) setForm(f => ({ ...f, pincode: v })); }} placeholder="6 digits" className="input-field" />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setForm(f => ({ ...f, isDefault: !f.isDefault }))}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${form.isDefault ? 'bg-primary-500 border-primary-500' : 'border-white/20'}`}>
                  {form.isDefault && <FiCheck className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm text-white/60">Set as default address</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button onClick={saveAddress} disabled={saving} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                  {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Saving...</> : <><FiCheck className="w-4 h-4" /> {editId ? 'Update Address' : 'Save Address'}</>}
                </button>
                <button onClick={() => { setShowForm(false); setForm(emptyForm); setEditId(null); }} className="btn-ghost px-6 py-3 border border-white/10">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : addresses.length === 0 ? (
          <div className="card p-16 text-center">
            <FiMapPin className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-white/40 mb-4">No saved addresses yet</p>
            <button onClick={() => setShowForm(true)} className="btn-primary inline-flex items-center gap-2"><FiPlus className="w-4 h-4" /> Add Your First Address</button>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map(addr => (
              <div key={addr._id} className={`card p-5 border transition-all ${addr.isDefault ? 'border-primary-500/40 bg-primary-500/5' : 'border-white/5'}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${addr.isDefault ? 'bg-primary-500/20 border border-primary-500/30' : 'bg-white/5 border border-white/10'}`}>
                    <FiMapPin className={`w-5 h-5 ${addr.isDefault ? 'text-primary-400' : 'text-white/40'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-white">{addr.name}</p>
                      {addr.isDefault && <span className="text-xs bg-primary-500/15 border border-primary-500/25 text-primary-400 px-2 py-0.5 rounded-full font-semibold">Default</span>}
                    </div>
                    <p className="text-white/50 text-sm">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                    <p className="text-white/50 text-sm">{addr.city}, {addr.state} - {addr.pincode}</p>
                    <p className="text-white/30 text-xs mt-1">📞 {addr.phone}</p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => startEdit(addr)} className="p-2 text-white/30 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"><FiEdit2 className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteConfirm(addr)} className="p-2 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"><FiTrash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                {!addr.isDefault && (
                  <button onClick={() => setAsDefault(addr._id)} className="mt-3 text-xs text-white/30 hover:text-primary-400 transition-colors">Set as default →</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}></div>
          <div className="relative bg-dark-800 border border-red-500/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-white mb-2">Delete Address?</h3>
            <p className="text-white/40 text-sm mb-5">{deleteConfirm.line1}, {deleteConfirm.city}</p>
            <div className="flex gap-3">
              <button onClick={() => deleteAddress(deleteConfirm._id)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"><FiTrash2 className="w-4 h-4" /> Delete</button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-xl transition-all border border-white/10">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}