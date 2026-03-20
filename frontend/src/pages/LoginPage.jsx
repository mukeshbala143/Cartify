import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiPhone, FiShoppingCart } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import toast from 'react-hot-toast';
import API from '../utils/api';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function LoginPage() {
  const { googleAuth, login: authLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const hiddenGoogleRef = useRef(null);
  const recaptchaRef = useRef(null);

  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // phone | otp
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    const initGoogle = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false,
      });
      if (hiddenGoogleRef.current) {
        window.google.accounts.id.renderButton(hiddenGoogleRef.current, {
          type: 'standard', theme: 'outline', size: 'large', width: 400,
        });
      }
    };
    if (window.google) { initGoogle(); return; }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true; script.defer = true;
    script.onload = initGoogle;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timer]);

  const handleGoogleResponse = async (response) => {
    try {
      setGoogleLoading(true);
      await googleAuth(response.credential);
      toast.success('Welcome! Signed in with Google 🎉');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google sign-in failed');
    } finally { setGoogleLoading(false); }
  };

  const handleGoogleClick = () => {
    const innerBtn = hiddenGoogleRef.current?.querySelector('div[role=button]');
    if (innerBtn) innerBtn.click();
    else toast.error('Google Sign-In loading... try again');
  };

  const setupRecaptcha = () => {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {},
      });
    }
    return recaptchaRef.current;
  };

  const sendOTP = async () => {
    if (!phone || phone.length < 7) { toast.error('Valid phone number enter karo'); return; }
    try {
      setLoading(true);
      const appVerifier = setupRecaptcha();
      const fullPhone = `${countryCode}${phone}`;
      const result = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
      setConfirmation(result);
      setStep('otp');
      setTimer(30);
      toast.success('OTP bheja gaya! 📱');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'OTP send failed');
      recaptchaRef.current = null;
    } finally { setLoading(false); }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) { toast.error('6 digit OTP enter karo'); return; }
    try {
      setLoading(true);
      const result = await confirmation.confirm(otp);
      const firebaseToken = await result.user.getIdToken();
      const fullPhone = `${countryCode}${phone}`;
      const { data } = await API.post('/auth/phone-login', { firebaseToken, phone: fullPhone });
      authLogin(data.token, data.user);
      toast.success('Welcome! 🎉');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-orange-500/8 rounded-full blur-2xl"></div>
      </div>

      <div ref={hiddenGoogleRef} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -1 }}></div>
      <div id="recaptcha-container"></div>

      <div className="relative w-full max-w-md">
        <div className="bg-dark-800/80 backdrop-blur-xl border border-white/8 rounded-3xl p-8 md:p-10 shadow-2xl">

          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
              <FiShoppingCart className="w-7 h-7 text-white" />
            </div>
            <h1 className="font-display text-3xl font-bold text-white mb-1">Welcome Back</h1>
            <p className="text-white/40">Sign in to your Cartify account</p>
          </div>

          {/* Google Button */}
          <button onClick={handleGoogleClick} disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all mb-5 group disabled:opacity-60">
            {googleLoading ? (
              <span className="w-5 h-5 border-2 border-white/20 border-t-white/70 rounded-full animate-spin"></span>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <span className="text-white/80 group-hover:text-white font-medium text-sm transition-colors">
              {googleLoading ? 'Signing in...' : 'Continue with Google'}
            </span>
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/8"></div>
            <span className="text-white/25 text-xs font-medium">or sign in with phone</span>
            <div className="flex-1 h-px bg-white/8"></div>
          </div>

          {step === 'phone' ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white/60 mb-1.5 block">Phone Number</label>
                <div className="flex gap-2">
                  <select value={countryCode} onChange={e => setCountryCode(e.target.value)}
                    className="input-field w-24 text-sm px-2">
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+61">🇦🇺 +61</option>
                    <option value="+971">🇦🇪 +971</option>
                  </select>
                  <div className="relative flex-1">
                    <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210" className="input-field pl-11 w-full" maxLength={12} />
                  </div>
                </div>
              </div>
              <button onClick={sendOTP} disabled={loading}
                className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2">
                {loading ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Sending...</> : '📱 Send OTP'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white/60 mb-1.5 block">
                  OTP sent to {countryCode}{phone}
                  <button onClick={() => setStep('phone')} className="ml-2 text-primary-400 text-xs hover:underline">Change</button>
                </label>
                <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="6 digit OTP" className="input-field w-full text-center text-2xl tracking-widest" maxLength={6} />
              </div>
              <button onClick={verifyOTP} disabled={loading}
                className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2">
                {loading ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Verifying...</> : '✅ Verify OTP'}
              </button>
              <button onClick={sendOTP} disabled={timer > 0 || loading}
                className="w-full text-sm text-white/40 hover:text-white/70 transition-colors disabled:opacity-40">
                {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
              </button>
            </div>
          )}

          <p className="text-center text-white/40 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
