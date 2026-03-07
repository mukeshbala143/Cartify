import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiMail, FiLock, FiEye, FiEyeOff, FiShoppingCart,
  FiArrowLeft, FiRefreshCw, FiCheck, FiShield
} from 'react-icons/fi';
import API from '../utils/api';
import toast from 'react-hot-toast';

// step: 'email' → 'otp' → 'reset' → 'done'
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);

  // Resend countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  // Auto-focus first OTP box
  useEffect(() => {
    if (step === 'otp') setTimeout(() => otpRefs.current[0]?.focus(), 300);
  }, [step]);

  // ── Step 1: Send OTP ──
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) { toast.error('Enter your email'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { toast.error('Invalid email'); return; }
    try {
      setLoading(true);
      await API.post('/auth/forgot-password/send-otp', { email });
      setStep('otp');
      setResendTimer(60);
      toast.success(`OTP sent to ${email} 📧`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  // ── OTP input handling ──
  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val.slice(-1);
    setOtp(newOtp);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) { setOtp(paste.split('')); otpRefs.current[5]?.focus(); }
  };

  // ── Step 2: Verify OTP ──
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpStr = otp.join('');
    if (otpStr.length !== 6) { toast.error('Enter all 6 digits'); return; }
    try {
      setLoading(true);
      await API.post('/auth/forgot-password/verify-otp', { email, otp: otpStr });
      setStep('reset');
      toast.success('OTP verified! ✅');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  // ── Resend OTP ──
  const handleResend = async () => {
    try {
      await API.post('/auth/forgot-password/send-otp', { email });
      setResendTimer(60);
      setOtp(['', '', '', '', '', '']);
      toast.success('New OTP sent! 📧');
    } catch (err) {
      toast.error('Failed to resend OTP');
    }
  };

  // ── Step 3: Reset Password ──
  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    try {
      setLoading(true);
      await API.post('/auth/forgot-password/reset', { email, otp: otp.join(''), newPassword });
      setStep('done');
      toast.success('Password reset successfully! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally { setLoading(false); }
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
  const strength = pwStrength(newPassword);
  const strengthColors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  // ── Step indicator ──
  const steps = ['Email', 'OTP', 'New Password'];
  const stepIdx = { email: 0, otp: 1, reset: 2, done: 2 };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-primary-500/8 rounded-full blur-2xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-dark-800/80 backdrop-blur-xl border border-white/8 rounded-3xl p-8 md:p-10 shadow-2xl">

          {/* Logo */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
              <FiShield className="w-7 h-7 text-white" />
            </div>
            <h1 className="font-display text-3xl font-bold text-white mb-1">Forgot Password</h1>
            <p className="text-white/40 text-sm">Reset your Cartify account password</p>
          </div>

          {/* Step indicator */}
          {step !== 'done' && (
            <div className="flex items-center justify-center gap-2 mb-8">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    i === stepIdx[step]
                      ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-400'
                      : i < stepIdx[step]
                        ? 'bg-green-500/15 border border-green-500/30 text-green-400'
                        : 'bg-white/5 border border-white/10 text-white/30'
                  }`}>
                    {i < stepIdx[step] ? <FiCheck className="w-3 h-3" /> : <span>{i + 1}</span>}
                    {s}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-6 h-px ${i < stepIdx[step] ? 'bg-green-500/40' : 'bg-white/10'}`}></div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── STEP 1: Email ── */}
          {step === 'email' && (
            <>
              <p className="text-white/50 text-sm text-center mb-6">
                Enter your registered email and we'll send you an OTP to reset your password.
              </p>
              <form onSubmit={handleSendOTP} className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-white/60 mb-1.5 block">Email Address</label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com" className="input-field pl-11" autoFocus />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white' }}>
                  {loading
                    ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Sending OTP...</>
                    : <><FiMail className="w-5 h-5" /> Send Reset OTP</>
                  }
                </button>
              </form>
              <p className="text-center text-white/40 text-sm mt-6">
                Remember password?{' '}
                <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Sign in</Link>
              </p>
            </>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === 'otp' && (
            <>
              <button onClick={() => setStep('email')}
                className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-4 text-sm">
                <FiArrowLeft className="w-4 h-4" /> Back
              </button>

              <div className="text-center mb-6">
                <p className="text-white/50 text-sm">OTP sent to</p>
                <p className="text-indigo-400 font-semibold">{email}</p>
              </div>

              <form onSubmit={handleVerifyOTP}>
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
                        ${digit ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 focus:border-indigo-500/60'}`}
                    />
                  ))}
                </div>

                <button type="submit" disabled={loading || otp.join('').length !== 6}
                  className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 mb-4 disabled:opacity-50 transition-all"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white' }}>
                  {loading
                    ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Verifying...</>
                    : <><FiCheck className="w-5 h-5" /> Verify OTP</>
                  }
                </button>
              </form>

              <div className="text-center mt-2">
                {resendTimer > 0
                  ? <p className="text-white/30 text-sm">Resend in <span className="text-indigo-400 font-semibold">{resendTimer}s</span></p>
                  : <button onClick={handleResend}
                      className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors text-sm mx-auto">
                      <FiRefreshCw className="w-4 h-4" /> Resend OTP
                    </button>
                }
              </div>
              <div className="mt-4 bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-center">
                <p className="text-white/30 text-xs">⏱ OTP valid for <span className="text-white/50 font-semibold">10 minutes</span></p>
              </div>
            </>
          )}

          {/* ── STEP 3: New Password ── */}
          {step === 'reset' && (
            <>
              <p className="text-white/50 text-sm text-center mb-6">
                Create a strong new password for your account.
              </p>
              <form onSubmit={handleReset} className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-white/60 mb-1.5 block">New Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
                    <input type={showPass ? 'text' : 'password'} value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Create new password" className="input-field pl-11 pr-12" autoFocus />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                      {showPass ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex gap-1 flex-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColors[strength] : 'bg-white/10'}`}></div>
                        ))}
                      </div>
                      <span className={`text-xs ${strengthColors[strength].replace('bg-', 'text-')}`}>{strengthLabels[strength]}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-white/60 mb-1.5 block">Confirm New Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
                    <input type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className={`input-field pl-11 pr-12 ${
                        confirmPassword && newPassword === confirmPassword ? 'border-green-500/50' :
                        confirmPassword && newPassword !== confirmPassword ? 'border-red-500/50' : ''
                      }`} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                      {showConfirm ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                    {confirmPassword && newPassword === confirmPassword && (
                      <FiCheck className="absolute right-10 top-1/2 -translate-y-1/2 text-green-400 w-4 h-4" />
                    )}
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                  )}
                </div>

                <button type="submit" disabled={loading || !newPassword || newPassword !== confirmPassword}
                  className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white' }}>
                  {loading
                    ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Resetting...</>
                    : <><FiShield className="w-5 h-5" /> Reset Password</>
                  }
                </button>
              </form>
            </>
          )}

          {/* ── DONE ── */}
          {step === 'done' && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-500/15 border-2 border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
                <FiCheck className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="font-display text-2xl font-bold text-white mb-2">Password Reset! 🎉</h2>
              <p className="text-white/40 text-sm mb-8">
                Your password has been successfully reset. You can now login with your new password.
              </p>
              <button onClick={() => navigate('/login')}
                className="w-full py-4 rounded-xl font-bold text-base transition-all"
                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white' }}>
                Go to Login
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}