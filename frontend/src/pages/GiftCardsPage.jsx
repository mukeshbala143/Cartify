import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiGift, FiCopy, FiCheck, FiPlus, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';

const GIFT_CARD_AMOUNTS = [250, 500, 1000, 2000, 5000];
const SAMPLE_CARDS = [
  { code: 'CARTIFY-GIFT-A1B2', amount: 500, balance: 500, expiry: '2026-12-31', color: 'from-orange-500 to-pink-500' },
  { code: 'CARTIFY-GIFT-C3D4', amount: 1000, balance: 750, expiry: '2026-06-30', color: 'from-blue-500 to-purple-500' },
];

export default function GiftCardsPage() {
  const [tab, setTab] = useState('my');
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [copied, setCopied] = useState(null);
  const [selectedAmount, setSelectedAmount] = useState(500);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [purchasing, setPurchasing] = useState(false);

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    toast.success('Code copied!');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) { toast.error('Enter a gift card code'); return; }
    setRedeeming(true);
    setTimeout(() => { toast.success('Gift card redeemed! ₹500 added to your wallet.'); setRedeemCode(''); setRedeeming(false); }, 1500);
  };

  const handlePurchase = async () => {
    if (!recipientEmail.trim()) { toast.error('Enter recipient email'); return; }
    setPurchasing(true);
    setTimeout(() => { toast.success(`Gift card of ₹${selectedAmount} sent to ${recipientEmail}!`); setRecipientEmail(''); setMessage(''); setPurchasing(false); }, 1500);
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-6 text-sm">
          <FiArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="mb-8">
          <h1 className="font-display text-3xl font-black text-white mb-1">🎁 Gift Cards</h1>
          <p className="text-white/30 text-sm">Send joy, redeem rewards</p>
        </div>
        <div className="flex gap-2 mb-6">
          {[{ key: 'my', label: 'My Cards' }, { key: 'redeem', label: 'Redeem Code' }, { key: 'buy', label: 'Buy Gift Card' }].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === key ? 'bg-primary-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/5'}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'my' && (
          <div className="space-y-4">
            {SAMPLE_CARDS.map(card => (
              <div key={card.code} className="rounded-2xl overflow-hidden shadow-2xl">
                <div className={`bg-gradient-to-br ${card.color} p-6`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white/70 text-xs font-medium mb-1">CARTIFY GIFT CARD</p>
                      <p className="text-white font-black text-3xl">₹{card.balance.toLocaleString()}</p>
                      <p className="text-white/60 text-xs mt-1">of ₹{card.amount} · Expires {card.expiry}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                      <FiGift className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-white font-mono text-sm tracking-widest">{card.code}</p>
                    <button onClick={() => copyCode(card.code)} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all">
                      {copied === card.code ? <FiCheck className="w-4 h-4 text-white" /> : <FiCopy className="w-4 h-4 text-white" />}
                    </button>
                  </div>
                  <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full" style={{ width: `${(card.balance / card.amount) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'redeem' && (
          <div className="card p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-500/10 border border-primary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FiGift className="w-8 h-8 text-primary-400" />
              </div>
              <h3 className="font-display text-xl font-bold text-white">Redeem a Gift Card</h3>
              <p className="text-white/40 text-sm mt-1">Enter your gift card code to add balance</p>
            </div>
            <div className="space-y-4">
              <input type="text" value={redeemCode} onChange={e => setRedeemCode(e.target.value.toUpperCase())}
                placeholder="CARTIFY-GIFT-XXXX" className="input-field text-center font-mono tracking-widest text-lg" />
              <button onClick={handleRedeem} disabled={redeeming} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
                {redeeming ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Redeeming...</> : <><FiCheck className="w-4 h-4" /> Redeem Now</>}
              </button>
            </div>
          </div>
        )}

        {tab === 'buy' && (
          <div className="card p-6">
            <h3 className="font-display text-xl font-bold text-white mb-5">Send a Gift Card</h3>
            <div className="space-y-5">
              <div>
                <label className="text-xs text-white/40 mb-2 block font-medium">Select Amount *</label>
                <div className="grid grid-cols-5 gap-2">
                  {GIFT_CARD_AMOUNTS.map(amount => (
                    <button key={amount} onClick={() => setSelectedAmount(amount)}
                      className={`py-3 rounded-xl text-sm font-bold transition-all ${selectedAmount === amount ? 'bg-primary-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/5'}`}>
                      ₹{amount >= 1000 ? `${amount / 1000}K` : amount}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 p-5">
                <p className="text-white/70 text-xs mb-1">CARTIFY GIFT CARD</p>
                <p className="text-white font-black text-2xl">₹{selectedAmount.toLocaleString()}</p>
                <p className="text-white/60 text-xs mt-1">Valid for 1 year from purchase</p>
              </div>
              <input type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} placeholder="Recipient email *" className="input-field" />
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Personal message (optional)" rows={3} className="input-field resize-none" />
              <div className="flex items-center justify-between p-4 bg-white/3 rounded-xl border border-white/5">
                <span className="text-white/50 text-sm">Total to pay</span>
                <span className="text-white font-black text-xl">₹{selectedAmount.toLocaleString()}</span>
              </div>
              <button onClick={handlePurchase} disabled={purchasing} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
                {purchasing ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Processing...</> : <><FiGift className="w-4 h-4" /> Send Gift Card · ₹{selectedAmount.toLocaleString()}</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}