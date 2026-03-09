import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiArrowRight,
  FiTag, FiShield, FiTruck, FiMapPin, FiPlus as FiPlusIcon,
  FiCheck, FiX, FiCreditCard, FiPackage, FiCalendar,
} from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';

const COUPONS = { 'CARTIFY50': 50, 'SAVE20': 20, 'FIRST10': 10 };
const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh'];

function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function getEstimatedDelivery() {
  let count = 0;
  let cur = new Date();
  while (count < 5) {
    cur.setDate(cur.getDate() + 1);
    if (cur.getDay() !== 0 && cur.getDay() !== 6) count++;
  }
  const min = cur.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const max = new Date(cur); max.setDate(max.getDate() + 2);
  return `${min} – ${max.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
}

const emptyAddr = { name:'', phone:'', line1:'', line2:'', city:'', state:'', pincode:'', isDefault:false };

export default function CartPage() {
  // ✅ clearCart (backend + UI) — clearCartUI hataya
  const { cart, totalItems, totalAmount, updateQty, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const [payMethod, setPayMethod] = useState('Razorpay');
  const [addresses, setAddresses] = useState([]);
  const [selectedAddr, setSelectedAddr] = useState(null);
  const [showAddrModal, setShowAddrModal] = useState(false);
  const [addrForm, setAddrForm] = useState(emptyAddr);
  const [savingAddr, setSavingAddr] = useState(false);
  const [addrErrors, setAddrErrors] = useState({});

  const estDelivery = getEstimatedDelivery();

  useEffect(() => { if (user) fetchAddresses(); }, [user]);

  const fetchAddresses = async () => {
    try {
      const { data } = await API.get('/addresses');
      setAddresses(data.addresses || []);
      const def = data.addresses?.find(a => a.isDefault) || data.addresses?.[0];
      if (def) setSelectedAddr(def._id);
    } catch {}
  };

  const applyCoupon = () => {
    const disc = COUPONS[coupon.toUpperCase()];
    if (disc) { setDiscount(disc); setAppliedCoupon(coupon.toUpperCase()); toast.success(`${disc}% off applied! 🎉`); }
    else toast.error('Invalid coupon code');
  };

  const discountAmt = Math.round(totalAmount * discount / 100);
  const afterDiscount = totalAmount - discountAmt;
  const delivery = afterDiscount > 299 ? 0 : 49;
  const grandTotal = afterDiscount + delivery;

  const validateAddr = () => {
    const e = {};
    if (!addrForm.name.trim()) e.name = 'Required';
    if (!addrForm.phone.trim() || !/^[6-9]\d{9}$/.test(addrForm.phone)) e.phone = 'Valid 10-digit mobile required';
    if (!addrForm.line1.trim()) e.line1 = 'Required';
    if (!addrForm.city.trim()) e.city = 'Required';
    if (!addrForm.state) e.state = 'Required';
    if (!addrForm.pincode.trim() || !/^\d{6}$/.test(addrForm.pincode)) e.pincode = 'Valid 6-digit pincode required';
    return e;
  };

  const saveAddress = async () => {
    const e = validateAddr();
    if (Object.keys(e).length) { setAddrErrors(e); return; }
    try {
      setSavingAddr(true);
      const { data } = await API.post('/addresses', addrForm);
      await fetchAddresses();
      setSelectedAddr(data.address._id);
      setShowAddrModal(false);
      setAddrForm(emptyAddr);
      setAddrErrors({});
      toast.success('Address saved! ✅');
    } catch { toast.error('Failed to save address'); }
    finally { setSavingAddr(false); }
  };

  const deleteAddress = async (id) => {
    await API.delete(`/addresses/${id}`);
    await fetchAddresses();
    if (selectedAddr === id) setSelectedAddr(null);
    toast.success('Address removed');
  };

  const handleCheckout = async () => {
    if (!user) { navigate('/login'); return; }
    if (!cart?.items?.length) { toast.error('Cart is empty'); return; }
    if (!selectedAddr) { toast.error('Please add a delivery address'); return; }
    const address = addresses.find(a => a._id === selectedAddr);

    const orderItems = cart.items.map(({ product, qty }) => ({
      product: product._id,
      qty,
      price: product.price,
    }));

    // ── COD ──────────────────────────────────────────────────────
    if (payMethod === 'COD') {
      try {
        setCheckingOut(true);
        await API.post('/orders', {
          paymentMethod: 'COD',
          shippingAddress: address,
          items: orderItems,
          totalAmount: grandTotal,
        });
        await clearCart();
        setCheckingOut(false);
        toast.success('Order placed! Cash on Delivery 🎉');
        navigate('/orders');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Order failed');
      } finally {
        setCheckingOut(false);
      }
      return;
    }

    // ── Razorpay ─────────────────────────────────────────────────
    try {
      setCheckingOut(true);
      const loaded = await loadRazorpay();
      if (!loaded) { toast.error('Payment service unavailable'); setCheckingOut(false); return; }

      const { data: payRes } = await API.post('/payment/create-order', { amount: grandTotal, orderId: 'pay_' + Date.now() });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SOG90d3avXsFnE',
        amount: payRes.amount,
        currency: payRes.currency || 'INR',
        name: 'Cartify',
        description: `Order (${totalItems} items)`,
        order_id: payRes.id,
        handler: async (response) => {
          try {
            const { data: orderData } = await API.post('/orders', {
              paymentMethod: 'Razorpay',
              shippingAddress: address,
              items: orderItems,
              totalAmount: grandTotal,
            });
            await API.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderData.order._id,
            });
            // ✅ Sirf success pe cart clear hogi
            await clearCart();
            toast.success('Payment successful! 🎉');
            navigate('/orders');
          } catch {
            // ✅ Failure pe cart clear NAHI hogi — user dobara try kar sake
            toast.error('Payment verification failed. Please contact support.');
            setCheckingOut(false);
          }
        },
        prefill: { name: user.name, email: user.email, contact: address?.phone },
        theme: { color: '#f97316' },
        modal: { ondismiss: () => { setCheckingOut(false); toast('Payment cancelled', { icon: 'ℹ️' }); } },
      };
      new window.Razorpay(options).open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed');
      setCheckingOut(false);
    }
  };

  if (!cart?.items?.length) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <div className="text-8xl mb-5">🛒</div>
          <h2 className="font-display text-3xl font-bold text-white mb-2">Cart is empty</h2>
          <p className="text-white/40 mb-7">Add some products to get started</p>
          <Link to="/products" className="btn-primary inline-flex items-center gap-2"><FiShoppingBag className="w-5 h-5" /> Start Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-4xl font-bold text-white mb-1">Shopping Cart</h1>
        <p className="text-white/40 mb-8">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map(({ product, qty }) => product && (
              <div key={product._id} className="card p-4 flex gap-4 group">
                <Link to={`/product/${product._id}`} className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-white/5">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover"
                      onError={e => { e.target.src = `https://picsum.photos/seed/${product._id}/200/200`; }} />
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <Link to={`/product/${product._id}`}>
                      <p className="font-medium text-white hover:text-primary-300 transition-colors line-clamp-2 text-sm">{product.name}</p>
                    </Link>
                    <button onClick={() => removeFromCart(product._id)} className="flex-shrink-0 p-1.5 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {product.category && <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded mt-1 inline-block">{product.category}</span>}
                  <div className="flex items-center gap-1 mt-1">
                    <FiCalendar className="w-3 h-3 text-primary-400/60" />
                    <span className="text-xs text-white/25">Delivery by {estDelivery}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                    <div>
                      <span className="text-lg font-bold text-white">₹{(product.price * qty).toLocaleString()}</span>
                      <span className="text-xs text-white/30 ml-1.5">₹{product.price?.toLocaleString()} each</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                      <button onClick={() => qty > 1 ? updateQty(product._id, qty-1) : removeFromCart(product._id)}
                        className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                        <FiMinus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center text-white font-bold text-sm">{qty}</span>
                      <button onClick={() => updateQty(product._id, qty+1)}
                        className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                        <FiPlus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <FiMapPin className="w-4 h-4 text-primary-400" /> Delivery Address
                </h3>
                <button onClick={() => { setAddrForm(emptyAddr); setAddrErrors({}); setShowAddrModal(true); }}
                  className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 bg-primary-500/10 border border-primary-500/20 px-3 py-1.5 rounded-lg transition-all">
                  <FiPlusIcon className="w-3.5 h-3.5" /> Add New
                </button>
              </div>
              {addresses.length === 0 ? (
                <button onClick={() => { setAddrForm(emptyAddr); setShowAddrModal(true); }}
                  className="w-full border-2 border-dashed border-white/10 hover:border-primary-500/40 rounded-xl p-6 text-center transition-all group">
                  <FiMapPin className="w-8 h-8 text-white/20 group-hover:text-primary-400 mx-auto mb-2 transition-colors" />
                  <p className="text-white/40 text-sm group-hover:text-white/60 transition-colors">Add a delivery address to continue</p>
                </button>
              ) : (
                <div className="space-y-3">
                  {addresses.map(addr => (
                    <div key={addr._id} onClick={() => setSelectedAddr(addr._id)}
                      className={`relative flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedAddr === addr._id ? 'border-primary-500/60 bg-primary-500/8' : 'border-white/8 hover:border-white/15'
                      }`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                        selectedAddr === addr._id ? 'border-primary-500 bg-primary-500' : 'border-white/20'
                      }`}>
                        {selectedAddr === addr._id && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-white text-sm">{addr.name}</p>
                          <p className="text-white/40 text-xs">{addr.phone}</p>
                          {addr.isDefault && <span className="text-[10px] bg-primary-500/20 text-primary-400 border border-primary-500/30 px-1.5 py-0.5 rounded font-semibold">DEFAULT</span>}
                        </div>
                        <p className="text-white/50 text-xs leading-relaxed">
                          {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); deleteAddress(addr._id); }}
                        className="flex-shrink-0 p-1 text-white/20 hover:text-red-400 rounded transition-colors">
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-5">
              <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
                <FiCreditCard className="w-4 h-4 text-primary-400" /> Payment Method
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setPayMethod('Razorpay')}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${payMethod === 'Razorpay' ? 'border-primary-500/60 bg-primary-500/8' : 'border-white/8 hover:border-white/15'}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${payMethod === 'Razorpay' ? 'border-primary-500 bg-primary-500' : 'border-white/20'}`}>
                    {payMethod === 'Razorpay' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                  <div className="text-left">
                    <p className="text-white font-semibold text-sm">Online Payment</p>
                    <p className="text-white/30 text-xs">UPI, Cards, NetBanking</p>
                  </div>
                </button>
                <button onClick={() => setPayMethod('COD')}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${payMethod === 'COD' ? 'border-green-500/60 bg-green-500/8' : 'border-white/8 hover:border-white/15'}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${payMethod === 'COD' ? 'border-green-500 bg-green-500' : 'border-white/20'}`}>
                    {payMethod === 'COD' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                  <div className="text-left">
                    <p className="text-white font-semibold text-sm">Cash on Delivery</p>
                    <p className="text-white/30 text-xs">Pay when delivered</p>
                  </div>
                </button>
              </div>
              {payMethod === 'COD' && (
                <div className="mt-3 flex items-center gap-2 bg-green-500/8 border border-green-500/20 rounded-xl px-4 py-2.5">
                  <FiPackage className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <p className="text-green-400 text-sm">Pay cash when your order is delivered at your door.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-4 border border-primary-500/15 bg-primary-500/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FiCalendar className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <p className="text-white/50 text-xs">Estimated Delivery</p>
                  <p className="text-white font-bold">{estDelivery}</p>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <FiTag className="w-4 h-4 text-primary-400" /> Coupon Code
              </h3>
              <div className="flex gap-2">
                <input type="text" value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())}
                  placeholder="Enter code" onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                  className="input-field flex-1 py-2.5 text-sm font-mono" />
                <button onClick={applyCoupon} className="btn-primary py-2.5 px-4 text-sm">Apply</button>
              </div>
              {appliedCoupon
                ? <p className="text-green-400 text-xs mt-2 flex items-center gap-1"><FiCheck className="w-3 h-3" /> "{appliedCoupon}" — {discount}% off</p>
                : <p className="text-white/20 text-xs mt-1.5">Try: CARTIFY50 · SAVE20 · FIRST10</p>
              }
            </div>

            <div className="card p-5">
              <h3 className="font-display text-xl font-bold text-white mb-5">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/50">Subtotal ({totalItems} items)</span>
                  <span className="text-white">₹{totalAmount.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-green-400">Discount ({discount}%)</span>
                    <span className="text-green-400 font-medium">−₹{discountAmt.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-white/50">Delivery</span>
                  {delivery === 0
                    ? <span className="text-green-400 font-medium">🎉 FREE</span>
                    : <div className="text-right">
                        <span className="text-white">₹{delivery}</span>
                        <p className="text-white/20 text-xs">Free above ₹299</p>
                      </div>
                  }
                </div>
                {payMethod === 'COD' && (
                  <div className="flex justify-between">
                    <span className="text-white/50">Payment</span>
                    <span className="text-green-400 font-medium text-xs bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-lg">Cash on Delivery</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-white/50 flex items-center gap-1"><FiCalendar className="w-3 h-3" /> Est. Delivery</span>
                  <span className="text-primary-400 font-semibold text-xs">{estDelivery}</span>
                </div>
              </div>
              <div className="border-t border-white/8 mt-4 pt-4 flex justify-between items-center">
                <span className="font-bold text-white">Total</span>
                <span className="font-black text-2xl text-primary-400">₹{grandTotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="mt-3 bg-green-500/8 border border-green-500/20 rounded-xl px-3 py-2 text-center">
                  <p className="text-green-400 text-sm font-semibold">You save ₹{discountAmt.toLocaleString()} 🎉</p>
                </div>
              )}
              <button onClick={handleCheckout} disabled={checkingOut || !selectedAddr}
                className={`w-full mt-5 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all
                  ${!selectedAddr ? 'bg-white/5 text-white/20 cursor-not-allowed' :
                    payMethod === 'COD' ? 'bg-green-500 hover:bg-green-600 text-white' : 'btn-primary'}`}>
                {checkingOut
                  ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Processing...</>
                  : payMethod === 'COD'
                    ? <><FiPackage className="w-5 h-5" /> Place Order (COD)</>
                    : <><span>Pay ₹{grandTotal.toLocaleString()}</span><FiArrowRight className="w-5 h-5" /></>
                }
              </button>
              {!selectedAddr && (
                <p className="text-center text-yellow-400/70 text-xs mt-2">⚠ Add a delivery address first</p>
              )}
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-white/15">
                <span className="flex items-center gap-1"><FiShield className="w-3 h-3" /> Secure</span>
                <span>•</span>
                <span className="flex items-center gap-1"><FiTruck className="w-3 h-3" /> Fast Delivery</span>
              </div>
            </div>
            <Link to="/products" className="block text-center text-sm text-primary-400/70 hover:text-primary-400 transition-colors py-1">
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      {showAddrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm" onClick={() => setShowAddrModal(false)}></div>
          <div className="relative bg-dark-800 border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-xl font-bold text-white">Add Delivery Address</h3>
              <button onClick={() => setShowAddrModal(false)} className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block font-medium">Full Name *</label>
                  <input type="text" value={addrForm.name} onChange={e => setAddrForm(f => ({...f, name: e.target.value}))}
                    placeholder="Rahul Sharma" className={`input-field text-sm ${addrErrors.name ? 'border-red-500/50' : ''}`} />
                  {addrErrors.name && <p className="text-red-400 text-xs mt-1">{addrErrors.name}</p>}
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block font-medium">Mobile Number *</label>
                  <input type="tel" value={addrForm.phone} onChange={e => setAddrForm(f => ({...f, phone: e.target.value}))}
                    placeholder="9876543210" maxLength={10} className={`input-field text-sm ${addrErrors.phone ? 'border-red-500/50' : ''}`} />
                  {addrErrors.phone && <p className="text-red-400 text-xs mt-1">{addrErrors.phone}</p>}
                </div>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block font-medium">Address Line 1 *</label>
                <input type="text" value={addrForm.line1} onChange={e => setAddrForm(f => ({...f, line1: e.target.value}))}
                  placeholder="House no, Street, Area" className={`input-field text-sm ${addrErrors.line1 ? 'border-red-500/50' : ''}`} />
                {addrErrors.line1 && <p className="text-red-400 text-xs mt-1">{addrErrors.line1}</p>}
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block font-medium">Address Line 2 <span className="text-white/20">(optional)</span></label>
                <input type="text" value={addrForm.line2} onChange={e => setAddrForm(f => ({...f, line2: e.target.value}))}
                  placeholder="Landmark, Nearby" className="input-field text-sm" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block font-medium">City *</label>
                  <input type="text" value={addrForm.city} onChange={e => setAddrForm(f => ({...f, city: e.target.value}))}
                    placeholder="Mumbai" className={`input-field text-sm ${addrErrors.city ? 'border-red-500/50' : ''}`} />
                  {addrErrors.city && <p className="text-red-400 text-xs mt-1">{addrErrors.city}</p>}
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block font-medium">State *</label>
                  <select value={addrForm.state} onChange={e => setAddrForm(f => ({...f, state: e.target.value}))}
                    className={`input-field text-sm appearance-none ${addrErrors.state ? 'border-red-500/50' : ''}`}>
                    <option value="">Select</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {addrErrors.state && <p className="text-red-400 text-xs mt-1">{addrErrors.state}</p>}
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block font-medium">Pincode *</label>
                  <input type="text" value={addrForm.pincode} onChange={e => setAddrForm(f => ({...f, pincode: e.target.value}))}
                    placeholder="400001" maxLength={6} className={`input-field text-sm ${addrErrors.pincode ? 'border-red-500/50' : ''}`} />
                  {addrErrors.pincode && <p className="text-red-400 text-xs mt-1">{addrErrors.pincode}</p>}
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div onClick={() => setAddrForm(f => ({...f, isDefault: !f.isDefault}))}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${addrForm.isDefault ? 'bg-primary-500 border-primary-500' : 'border-white/20 group-hover:border-white/40'}`}>
                  {addrForm.isDefault && <FiCheck className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">Set as default address</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={saveAddress} disabled={savingAddr}
                className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                {savingAddr ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Saving...</> : 'Save Address'}
              </button>
              <button onClick={() => setShowAddrModal(false)} className="btn-ghost px-6 py-3 border border-white/10">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}