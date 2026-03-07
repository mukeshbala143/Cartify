import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiX, FiSend, FiShoppingCart, FiPackage, FiTag, FiHelpCircle, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';

// ── Bot brain ────────────────────────────────────────────────────
const BOT_NAME = 'Carty';

const QUICK_REPLIES = [
  { label: '🛍️ Product recommend', value: 'recommend products' },
  { label: '📦 My orders', value: 'my orders' },
  { label: '🏷️ Coupons', value: 'coupons' },
  { label: '🚚 Delivery info', value: 'delivery info' },
  { label: '❓ Help', value: 'help' },
];

const COUPONS_INFO = [
  { code: 'CARTIFY50', desc: '50% off on all products' },
  { code: 'SAVE20', desc: '20% off on your order' },
  { code: 'FIRST10', desc: '10% off for first-time buyers' },
];

const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Beauty', 'Toys', 'Food'];

function getBotReply(input, user, orders, products) {
  const msg = input.toLowerCase().trim();

  // ── Greetings ──
  if (/^(hi|hello|hey|helo|hii|namaste|namaskar|sup|yo)/.test(msg)) {
    return {
      text: `Hey${user ? ` **${user.name.split(' ')[0]}**` : ''}! 👋 I'm **Carty**, your Cartify shopping assistant.\n\nHow can I help you today?`,
      quickReplies: QUICK_REPLIES,
    };
  }

  // ── Who are you ──
  if (/who are you|what are you|your name|kaun ho|kya ho/.test(msg)) {
    return {
      text: `I'm **Carty** 🤖 — Cartify's smart shopping assistant!\n\nI can help you with:\n• Product recommendations\n• Order tracking\n• Coupons & deals\n• Delivery info\n• Shopping support`,
      quickReplies: QUICK_REPLIES,
    };
  }

  // ── Coupons ──
  if (/coupon|discount|offer|promo|code|deal|sale/.test(msg)) {
    const couponList = COUPONS_INFO.map(c => `🏷️ **${c.code}** — ${c.desc}`).join('\n');
    return {
      text: `Here are your available coupons! 🎉\n\n${couponList}\n\nApply these in your cart at checkout!`,
      action: { label: 'Go to Cart', path: '/cart' },
    };
  }

  // ── Orders ──
  if (/order|my order|track|delivery status|where is|shipped|delivered/.test(msg)) {
    if (!user) {
      return {
        text: `Please **login** first to check your orders! 🔐`,
        action: { label: 'Login', path: '/login' },
      };
    }
    if (!orders || orders.length === 0) {
      return {
        text: `You don't have any orders yet, ${user.name.split(' ')[0]}! 😊\n\nShall I help you find something to buy?`,
        action: { label: 'Shop Now', path: '/products' },
      };
    }
    const latest = orders[0];
    const statusEmoji = {
      Pending: '⏳', Processing: '⚙️', Shipped: '🚚', Delivered: '✅', Cancelled: '❌'
    };
    return {
      text: `Your latest order:\n\n📦 **#${latest._id.slice(-8).toUpperCase()}**\n${statusEmoji[latest.status] || '📦'} Status: **${latest.status}**\n💰 Amount: **₹${latest.totalAmount?.toLocaleString()}**\n🛍️ Items: ${latest.items?.length}\n\nYou have **${orders.length}** total order${orders.length > 1 ? 's' : ''}.`,
      action: { label: 'View All Orders', path: '/orders' },
    };
  }

  // ── Budget-based recommendation ──
  if (/under|below|budget|less than|cheap|affordable|₹|rs\.?|rupee/.test(msg)) {
    const budgetMatch = msg.match(/(\d+)/);
    const budget = budgetMatch ? parseInt(budgetMatch[1]) : null;
    if (budget && products?.length) {
      const affordable = products.filter(p => p.price <= budget).slice(0, 3);
      if (affordable.length === 0) {
        return { text: `No products found under ₹${budget}. Try a higher budget! 💡` };
      }
      const list = affordable.map(p => `• **${p.name}** — ₹${p.price?.toLocaleString()}`).join('\n');
      return {
        text: `Great picks under ₹${budget}! 🎯\n\n${list}`,
        action: { label: 'Browse All', path: '/products' },
      };
    }
    return {
      text: `What's your budget? Tell me like:\n**"Show products under ₹500"** 💰`,
    };
  }

  // ── Category-based recommendation ──
  const matchedCategory = CATEGORIES.find(cat => msg.includes(cat.toLowerCase()));
  if (matchedCategory || /recommend|suggest|show me|find|search|product|buy|purchase|khareedna/.test(msg)) {
    if (matchedCategory && products?.length) {
      const catProducts = products.filter(p =>
        p.category?.toLowerCase().includes(matchedCategory.toLowerCase())
      ).slice(0, 3);
      if (catProducts.length > 0) {
        const list = catProducts.map(p => `• **${p.name}** — ₹${p.price?.toLocaleString()}`).join('\n');
        return {
          text: `Top ${matchedCategory} picks for you! ✨\n\n${list}`,
          action: { label: `Browse ${matchedCategory}`, path: `/products?category=${matchedCategory}` },
        };
      }
    }
    return {
      text: `I can recommend products! Tell me:\n\n• **Category** (Electronics, Clothing, etc.)\n• **Budget** (under ₹500)\n• **What you need** (gift, daily use, etc.)\n\nWhat are you looking for? 🛍️`,
      quickReplies: CATEGORIES.slice(0, 4).map(c => ({ label: c, value: `show ${c} products` })),
    };
  }

  // ── Delivery info ──
  if (/deliver|shipping|ship|dispatch|days|time|fast|express|free delivery/.test(msg)) {
    return {
      text: `📦 **Delivery Information:**\n\n🚚 Standard: **5–7 business days**\n⚡ Express: **2–3 business days**\n🎉 **Free delivery** on orders above ₹299\n💳 ₹49 delivery charge below ₹299\n\nAll orders are tracked and insured!`,
      action: { label: 'Shop Now', path: '/products' },
    };
  }

  // ── Return / refund ──
  if (/return|refund|exchange|cancel|wrong|damage|broken/.test(msg)) {
    return {
      text: `↩️ **Return & Refund Policy:**\n\n✅ Easy returns within **7 days**\n✅ Full refund for damaged items\n✅ Free return pickup\n✅ Refund in **3–5 business days**\n\nFor help, contact our support team!`,
    };
  }

  // ── Payment ──
  if (/payment|pay|upi|card|cod|cash|razorpay|online/.test(msg)) {
    return {
      text: `💳 **Payment Options:**\n\n📱 **UPI** (PhonePe, GPay, Paytm)\n💳 **Credit / Debit Cards**\n🌐 **Net Banking**\n💵 **Cash on Delivery (COD)**\n\nAll payments are 100% secure & encrypted! 🔒`,
    };
  }

  // ── Account / login ──
  if (/account|login|register|signup|sign up|profile|password/.test(msg)) {
    if (user) {
      return {
        text: `You're logged in as **${user.name}** ✅\n📧 ${user.email}\n\nWhat else can I help you with?`,
        quickReplies: QUICK_REPLIES,
      };
    }
    return {
      text: `You're not logged in. Login to access orders, wishlist & more! 🔐`,
      action: { label: 'Login / Register', path: '/login' },
    };
  }

  // ── Help ──
  if (/help|support|problem|issue|contact|assistance/.test(msg)) {
    return {
      text: `I'm here to help! 💪 Here's what I can do:\n\n🛍️ **Product recommendations**\n📦 **Track your orders**\n🏷️ **Coupon codes**\n🚚 **Delivery info**\n↩️ **Returns & refunds**\n💳 **Payment help**\n\nJust ask me anything!`,
      quickReplies: QUICK_REPLIES,
    };
  }

  // ── Thanks ──
  if (/thank|thanks|thx|shukriya|dhanyavaad/.test(msg)) {
    return {
      text: `You're welcome! 😊 Happy shopping on Cartify! 🛒✨`,
      quickReplies: QUICK_REPLIES,
    };
  }

  // ── Bye ──
  if (/bye|goodbye|alvida|ok bye|see you/.test(msg)) {
    return { text: `Goodbye${user ? ` ${user.name.split(' ')[0]}` : ''}! 👋 Happy shopping! 🛒` };
  }

  // ── Fallback ──
  return {
    text: `Hmm, I'm not sure about that 🤔\n\nTry asking me about:\n• Products or recommendations\n• Your orders\n• Coupons & deals\n• Delivery or payment`,
    quickReplies: QUICK_REPLIES,
  };
}

// ── Message renderer ─────────────────────────────────────────────
function MessageText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>
          : <span key={i}>{part}</span>
      )}
    </span>
  );
}

// ── Main Component ───────────────────────────────────────────────
export default function AIAssistant() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [unread, setUnread] = useState(1);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Load data
  useEffect(() => {
    API.get('/products').then(({ data }) => {
      const prods = Array.isArray(data) ? data : data.products || [];
      setProducts(prods);
    }).catch(() => {});

    if (user) {
      API.get('/orders/my').then(({ data }) => {
        setOrders(data.orders || []);
      }).catch(() => {});
    }
  }, [user]);

  // Welcome message on open
  useEffect(() => {
    if (open && messages.length === 0) {
      setUnread(0);
      const welcome = {
        id: Date.now(),
        from: 'bot',
        text: `Hey${user ? ` **${user.name.split(' ')[0]}**` : ''}! 👋 I'm **Carty**, your Cartify shopping assistant.\n\nHow can I help you today?`,
        quickReplies: QUICK_REPLIES,
        time: new Date(),
      };
      setTimeout(() => setMessages([welcome]), 300);
    }
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed) return;

    const userMsg = { id: Date.now(), from: 'user', text: trimmed, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const reply = getBotReply(trimmed, user, orders, products);
      const botMsg = { id: Date.now() + 1, from: 'bot', ...reply, time: new Date() };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 800 + Math.random() * 400);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatTime = (date) =>
    date?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      {/* ── Floating Button ── */}
      <div className="fixed bottom-6 right-6 z-50">
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="relative w-14 h-14 bg-gradient-to-br from-primary-500 to-orange-600 rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 group"
            style={{ boxShadow: '0 8px 32px rgba(249,115,22,0.45)' }}
          >
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="7" width="16" height="11" rx="2.5"/><circle cx="9" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none"/><path d="M9 15.5 Q12 17.5 15 15.5" strokeWidth="1.5" fill="none"/><line x1="12" y1="7" x2="12" y2="4"/><circle cx="12" cy="3.5" r="1" fill="currentColor" stroke="none"/><line x1="4" y1="11.5" x2="2" y2="11.5"/><line x1="20" y1="11.5" x2="22" y2="11.5"/></svg>
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center animate-bounce">
                {unread}
              </span>
            )}
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-2xl bg-primary-500/40 animate-ping"></span>
          </button>
        )}
      </div>

      {/* ── Chat Window ── */}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-50 flex flex-col"
          style={{
            width: '360px',
            height: '560px',
            background: 'linear-gradient(145deg, #1a1a2e, #0f0f1a)',
            border: '1px solid rgba(249,115,22,0.2)',
            borderRadius: '24px',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <FiShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm leading-none">{BOT_NAME}</p>
              <p className="text-white/70 text-xs mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block"></span>
                Always online
              </p>
            </div>
            <button onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all">
              <FiX className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${msg.from === 'user' ? '' : 'flex gap-2 items-start'}`}>

                  {msg.from === 'bot' && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-orange-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FiShoppingCart className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}

                  <div>
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                        msg.from === 'user'
                          ? 'bg-gradient-to-br from-primary-500 to-orange-600 text-white rounded-tr-sm'
                          : 'text-white/80 rounded-tl-sm'
                      }`}
                      style={msg.from === 'bot' ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' } : {}}
                    >
                      <MessageText text={msg.text} />
                    </div>

                    {/* Action button */}
                    {msg.action && (
                      <Link to={msg.action.path}
                        onClick={() => setOpen(false)}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 bg-primary-500/10 border border-primary-500/20 hover:border-primary-500/40 px-3 py-1.5 rounded-lg transition-all">
                        {msg.action.label} <FiChevronRight className="w-3 h-3" />
                      </Link>
                    )}

                    {/* Quick replies */}
                    {msg.quickReplies && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {msg.quickReplies.map((qr, i) => (
                          <button key={i} onClick={() => sendMessage(qr.value)}
                            className="text-xs px-2.5 py-1 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-primary-500/50 hover:bg-primary-500/10 transition-all">
                            {qr.label}
                          </button>
                        ))}
                      </div>
                    )}

                    <p className="text-white/20 text-[10px] mt-1 px-1">{formatTime(msg.time)}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                  <FiShoppingCart className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}></span>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/25"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim()}
                className="w-8 h-8 rounded-lg bg-primary-500 hover:bg-primary-400 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all flex-shrink-0"
              >
                <FiSend className="w-4 h-4 text-white" />
              </button>
            </div>
            <p className="text-white/15 text-[10px] text-center mt-2">Powered by Cartify AI ✨</p>
          </div>
        </div>
      )}
    </>
  );
}