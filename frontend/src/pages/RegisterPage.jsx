import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiMail, FiLock, FiUser, FiEye, FiEyeOff,
  FiShoppingCart, FiCheck, FiArrowLeft, FiRefreshCw
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';

const GOOGLE_CLIENT_ID = '251077057530-81afds7ddur93is5q7lh4b3s36k2tc1j.apps.googleusercontent.com';

export default function RegisterPage() {
  const { googleAuth } = useAuth();
  const navigate = useNavigate();
  const hiddenGoogleRef = useRef(null);

  // Step: 'form' | 'otp'
  const [step, setStep] = useState('form');
  const [registeredEmail, setRegisteredEmail] = useState('');

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [errors, setErrors] = useState({});

  // Resend countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  // Google init
  const handleGoogleResponse = async (response) => {
    try {
      setGoogleLoading(true);
      await googleAuth(response.credential);
      toast.success('Account created with Google! 🎉');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google sign-up failed');
    } finally { setGoogleLoading(false); }
  };

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

  const handleGoogleClick = () => {
    const innerBtn = hiddenGoogleRef.current?.querySelector('div[role=button]');
    if (innerBtn) innerBtn.click();
    else toast.error('Google Sign-In loading... try again');
  };

  const pwStrength = (pw) => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  const strength = pwStrength(form.password);
  const strengthColors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'At least 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    return e;
  };

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      setLoading(true);
      setErrors({});
      await API.post('/auth/register/send-otp', {
        name: form.name, email: form.email, password: form.password,
      });
      setRegisteredEmail(form.email);
      setStep('otp');
      setResendTimer(60);
      toast.success(`OTP sent to ${form.email} 📧`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP';
      toast.error(msg);
      setErrors({ general: msg });
    } finally { setLoading(false); }
  };

  // OTP input handling
  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val.slice(-1);
    setOtp(newOtp);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpStr = otp.join('');
    if (otpStr.length !== 6) { toast.error('Enter all 6 digits'); return; }
    try {
      setLoading(true);
      await API.post('/auth/register/verify-otp', { email: registeredEmail, otp: otpStr });
      toast.success('Account created! Please login 🎉');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  // Resend OTP
  const handleResend = async () => {
    try {
      await API.post('/auth/register/resend-otp', { email: registeredEmail });
      setResendTimer(60);
      setOtp(['', '', '', '', '', '']);
      toast.success('New OTP sent! 📧');
    } catch (err) {
      toast.error('Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-orange-500/8 rounded-full blur-2xl"></div>
      </div>

      {/* Hidden Google SDK */}
      <div ref={hiddenGoogleRef} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -1 }}></div>

      <div className="relative w-full max-w-md">
        <div className="bg-dark-800/80 backdrop-blur-xl border border-white/8 rounded-3xl p-8 md:p-10 shadow-2xl">

          {/* ── STEP 1: Registration Form ── */}
          {step === 'form' && (
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
                  <FiShoppingCart className="w-7 h-7 text-white" />
                </div>
                <h1 className="font-display text-3xl font-bold text-white mb-1">Create Account</h1>
                <p className="text-white/40">Join Cartify and start shopping</p>
              </div>

              {errors.general && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6 text-red-400 text-sm">
                  {errors.general}
                </div>
              )}

              {/* Google Button */}
              <button onClick={handleGoogleClick} disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all mb-5 group disabled:opacity-60">
                {googleLoading
                  ? <span className="w-5 h-5 border-2 border-white/20 border-t-white/70 rounded-full animate-spin"></span>
                  : <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                }
                <span className="text-white/80 group-hover:text-white font-medium text-sm transition-colors">
                  {googleLoading ? 'Creating account...' : 'Sign up with Google'}
                </span>
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-white/8"></div>
                <span className="text-white/25 text-xs font-medium">or register with email</span>
                <div className="flex-1 h-px bg-white/8"></div>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-white/60 mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
                    <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Your full name" className={`input-field pl-11 ${errors.name ? 'border-red-500/50' : ''}`} />
                  </div>
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-white/60 mb-1.5 block">Email Address</label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="you@example.com" className={`input-field pl-11 ${errors.email ? 'border-red-500/50' : ''}`} />
                  </div>
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-white/60 mb-1.5 block">Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
                    <input type={showPass ? 'text' : 'password'} value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Create a password" className={`input-field pl-11 pr-12 ${errors.password ? 'border-red-500/50' : ''}`} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                      {showPass ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex gap-1 flex-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColors[strength] : 'bg-white/10'}`}></div>
                        ))}
                      </div>
                      <span className={`text-xs ${strengthColors[strength].replace('bg-', 'text-')}`}>{strengthLabels[strength]}</span>
                    </div>
                  )}
                  {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-white/60 mb-1.5 block">Confirm Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
                    <input type="password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                      placeholder="Repeat password"
                      className={`input-field pl-11 ${errors.confirm ? 'border-red-500/50' : form.confirm && form.password === form.confirm ? 'border-green-500/50' : ''}`} />
                    {form.confirm && form.password === form.confirm && (
                      <FiCheck className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400 w-4 h-4" />
                    )}
                  </div>
                  {errors.confirm && <p className="text-red-400 text-xs mt-1">{errors.confirm}</p>}
                </div>

                <button type="submit" disabled={loading}
                  className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2">
                  {loading
                    ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Sending OTP...</>
                    : <><FiMail className="w-5 h-5" /> Send OTP to Email</>
                  }
                </button>
              </form>

              <p className="text-center text-white/40 text-sm mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">Sign in</Link>
              </p>
            </>
          )}

          {/* ── STEP 2: OTP Verification ── */}
          {step === 'otp' && (
            <>
              <button onClick={() => setStep('form')}
                className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-6 text-sm">
                <FiArrowLeft className="w-4 h-4" /> Back
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary-500/15 border-2 border-primary-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FiMail className="w-8 h-8 text-primary-400" />
                </div>
                <h1 className="font-display text-3xl font-bold text-white mb-2">Check Your Email</h1>
                <p className="text-white/40 text-sm">We sent a 6-digit OTP to</p>
                <p className="text-primary-400 font-semibold mt-1">{registeredEmail}</p>
              </div>

              <form onSubmit={handleVerifyOTP}>
                {/* 6-digit OTP input boxes */}
                <div className="flex gap-3 justify-center mb-6" onPaste={handleOtpPaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => otpRefs.current[idx] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(e.target.value, idx)}
                      onKeyDown={e => handleOtpKeyDown(e, idx)}
                      className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-white/5 text-white outline-none transition-all
                        ${digit ? 'border-primary-500 bg-primary-500/10' : 'border-white/10 focus:border-primary-500/60'}`}
                    />
                  ))}
                </div>

                <button type="submit" disabled={loading || otp.join('').length !== 6}
                  className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 mb-4 disabled:opacity-50">
                  {loading
                    ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Verifying...</>
                    : <><FiCheck className="w-5 h-5" /> Verify & Create Account</>
                  }
                </button>
              </form>

              {/* Resend */}
              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-white/30 text-sm">
                    Resend OTP in <span className="text-primary-400 font-semibold">{resendTimer}s</span>
                  </p>
                ) : (
                  <button onClick={handleResend}
                    className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors text-sm mx-auto">
                    <FiRefreshCw className="w-4 h-4" /> Resend OTP
                  </button>
                )}
              </div>

              <div className="mt-5 bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-center">
                <p className="text-white/30 text-xs">⏱ OTP is valid for <span className="text-white/50 font-semibold">10 minutes</span></p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}