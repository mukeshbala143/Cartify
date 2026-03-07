import { Link } from 'react-router-dom';
import { FiShoppingCart, FiMail, FiPhone, FiMapPin, FiTwitter, FiInstagram, FiGithub } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-dark-900 border-t border-white/5 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-orange-400 rounded-xl flex items-center justify-center">
                <FiShoppingCart className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold">
                <span className="text-gradient">Cart</span><span className="text-white">ify</span>
              </span>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed">
              Premium shopping experience with the best products curated for you. Quality, trust, and convenience.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {[FiTwitter, FiInstagram, FiGithub].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 bg-white/5 hover:bg-primary-500/20 hover:border-primary-500/50 border border-white/10 rounded-xl flex items-center justify-center transition-all group">
                  <Icon className="w-4 h-4 text-white/40 group-hover:text-primary-400 transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Home', to: '/' },
                { label: 'All Products', to: '/products' },
                { label: 'My Cart', to: '/cart' },
                { label: 'My Orders', to: '/orders' },
                { label: 'Wishlist', to: '/wishlist' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-white/40 hover:text-primary-400 transition-colors flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-white mb-4">Categories</h4>
            <ul className="space-y-2.5">
              {['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books', 'Beauty'].map(cat => (
                <li key={cat}>
                  <Link to={`/products?category=${cat}`} className="text-sm text-white/40 hover:text-primary-400 transition-colors flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contact Us</h4>
            <ul className="space-y-3">
              {[
                { Icon: FiMail, text: 'support@cartify.in' },
                { Icon: FiPhone, text: '+91 9999999999' },
                { Icon: FiMapPin, text: 'Mumbai, Maharashtra, India' },
              ].map(({ Icon, text }, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-white/40">
                  <Icon className="w-4 h-4 text-primary-500 flex-shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/30">© 2025 Cartify. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm text-white/30">
            <a href="#" className="hover:text-white/60 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white/60 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white/60 transition-colors">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
