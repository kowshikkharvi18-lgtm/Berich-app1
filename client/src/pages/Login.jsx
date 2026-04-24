import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, ChevronLeft, Wallet, TrendingUp, PiggyBank, ShieldCheck, Check, X } from 'lucide-react';
import api from '../lib/api';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

const FEATURES = [
  { icon: Wallet,      color: '#FF9933', label: 'Track Every Rupee'   },
  { icon: TrendingUp,  color: '#10b981', label: 'Smart Insights'      },
  { icon: PiggyBank,   color: '#3b82f6', label: 'Savings Goals'       },
  { icon: ShieldCheck, color: '#8b5cf6', label: 'Secure & Private'    },
];

const PWD_RULES = [
  { id: 'len',   label: 'At least 8 characters',        test: p => p.length >= 8 },
  { id: 'upper', label: 'One uppercase letter (A–Z)',    test: p => /[A-Z]/.test(p) },
  { id: 'lower', label: 'One lowercase letter (a–z)',    test: p => /[a-z]/.test(p) },
  { id: 'num',   label: 'One number (0–9)',              test: p => /\d/.test(p) },
  { id: 'spec',  label: 'One special character (!@#$…)', test: p => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

function PwdChecklist({ password }) {
  if (!password) return null;
  return (
    <div className="rounded-xl p-3 space-y-1.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.06]">
      {PWD_RULES.map(r => {
        const ok = r.test(password);
        return (
          <div key={r.id} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${ok ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-white/10'}`}>
              {ok ? <Check size={10} className="text-white" strokeWidth={3} /> : <X size={10} className="text-slate-400 dark:text-white/30" strokeWidth={3} />}
            </div>
            <span className={`text-xs font-medium transition-colors ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>{r.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useStore();
  const [form, setForm]         = useState({ email: '', password: '' });
  const [show, setShow]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken]   = useState('');
  const [newPwd, setNewPwd]     = useState('');
  const [showNew, setShowNew]   = useState(false);
  const [step, setStep]         = useState('login'); // login | forgot | reset

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      setAuth(data.user, data.token);
      toast.success(`Welcome back ${data.user.name}! 💎`);
      navigate('/');
    } catch (err) { toast.error(err.response?.data?.error || 'Login failed'); }
    finally { setLoading(false); }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: forgotEmail });
      if (data.resetToken) { setResetToken(data.resetToken); setStep('reset'); toast.success('Token ready!'); }
      else toast.success(data.message);
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    const allPass = PWD_RULES.every(r => r.test(newPwd));
    if (!allPass) return toast.error('Password does not meet requirements');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { resetToken, newPassword: newPwd });
      toast.success('Password reset! Login now 🎉');
      setStep('login');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const inp = `w-full px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200
    bg-slate-50 dark:bg-white/[0.06]
    text-slate-900 dark:text-white
    placeholder-slate-400 dark:placeholder-white/30
    border border-slate-200 dark:border-white/10
    focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400`;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Left panel (branding) ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#0A0A14 0%,#1a0a2e 50%,#0d1a0d 100%)' }}>
        {/* Glow blobs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle,#FF9933,transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle,#10b981,transparent)' }} />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="relative z-10 text-center">
          <div className="text-7xl mb-6">💎</div>
          <h1 className="text-5xl font-black text-white mb-3 tracking-tight">BeRich</h1>
          <p className="text-orange-300 text-lg font-medium mb-2">Nishmitha's Grow 🌱</p>
          <p className="text-white/40 text-sm mb-12">Your Smart Money Companion</p>

          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
            {FEATURES.map(({ icon: Icon, color, label }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-2xl"
                style={{ background: color + '15', border: `1px solid ${color}30` }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: color + '25' }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <span className="text-white/70 text-xs font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Indian flag strip */}
        <div className="absolute bottom-8 flex gap-0 rounded-full overflow-hidden opacity-30">
          <div className="w-10 h-1.5 bg-orange-500" />
          <div className="w-10 h-1.5 bg-white" />
          <div className="w-10 h-1.5 bg-green-600" />
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-orange-50 dark:bg-[#0A0A14] min-h-screen lg:min-h-0">

        {/* Mobile logo */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="lg:hidden text-center mb-8">
          <div className="text-5xl mb-2">💎</div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">BeRich</h1>
          <p className="text-orange-500 text-sm mt-1 font-medium">Nishmitha's Grow 🌱</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="w-full max-w-md">

          <AnimatePresence mode="wait">

            {/* ── Login ── */}
            {step === 'login' && (
              <motion.div key="login" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <div className="card p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Welcome back 👋</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Sign in to your account</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="label">Email Address</label>
                      <input type="email" required value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        className={inp} placeholder="you@example.com" />
                    </div>

                    <div>
                      <label className="label">Password</label>
                      <div className="relative">
                        <input type={show ? 'text' : 'password'} required value={form.password}
                          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                          className={`${inp} pr-12`} placeholder="Enter your password" />
                        <button type="button" onClick={() => setShow(v => !v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                          {show ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button type="button" onClick={() => setStep('forgot')}
                        className="text-xs text-orange-500 font-bold hover:text-orange-600 transition-colors">
                        Forgot password?
                      </button>
                    </div>

                    <button type="submit" disabled={loading}
                      className="w-full py-4 rounded-2xl font-extrabold text-white text-base flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg,#FF9933,#FF6600)', boxShadow: '0 4px 20px rgba(255,153,51,0.4)' }}>
                      {loading
                        ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Signing in...</>
                        : <><span>Sign In</span><ArrowRight size={17} /></>}
                    </button>
                  </form>

                  <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/[0.06] text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Don't have an account?{' '}
                      <Link to="/register" className="text-orange-500 font-bold hover:text-orange-600 transition-colors">
                        Create one free →
                      </Link>
                    </p>
                  </div>
                </div>

                {/* Feature pills — mobile only */}
                <div className="lg:hidden grid grid-cols-2 gap-2 mt-4">
                  {FEATURES.map(({ icon: Icon, color, label }) => (
                    <div key={label} className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.06]">
                      <Icon size={14} style={{ color }} />
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Forgot password ── */}
            {step === 'forgot' && (
              <motion.div key="forgot" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <div className="card p-8">
                  <button onClick={() => setStep('login')}
                    className="flex items-center gap-1 text-sm font-bold text-orange-500 hover:text-orange-600 mb-5 transition-colors">
                    <ChevronLeft size={16} /> Back to login
                  </button>
                  <div className="mb-6">
                    <div className="w-12 h-12 rounded-2xl g-saffron flex items-center justify-center text-2xl mb-4">🔑</div>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Reset Password</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Enter your email to receive a reset token</p>
                  </div>
                  <form onSubmit={handleForgot} className="space-y-4">
                    <div>
                      <label className="label">Email Address</label>
                      <input type="email" required value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        className={inp} placeholder="you@example.com" />
                    </div>
                    <button type="submit" disabled={loading}
                      className="w-full py-4 rounded-2xl font-extrabold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg,#FF9933,#FF6600)', boxShadow: '0 4px 20px rgba(255,153,51,0.35)' }}>
                      {loading
                        ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Sending...</>
                        : 'Send Reset Token'}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* ── Reset password ── */}
            {step === 'reset' && (
              <motion.div key="reset" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <div className="card p-8">
                  <div className="mb-6">
                    <div className="w-12 h-12 rounded-2xl g-saffron flex items-center justify-center text-2xl mb-4">🔒</div>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">New Password</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Choose a strong password</p>
                  </div>
                  <form onSubmit={handleReset} className="space-y-4">
                    <div className="space-y-2">
                      <label className="label">New Password</label>
                      <div className="relative">
                        <input type={showNew ? 'text' : 'password'} required value={newPwd}
                          onChange={e => setNewPwd(e.target.value)}
                          className={`${inp} pr-12`} placeholder="New password" />
                        <button type="button" onClick={() => setShowNew(v => !v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                          {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <PwdChecklist password={newPwd} />
                    </div>
                    <button type="submit" disabled={loading}
                      className="w-full py-4 rounded-2xl font-extrabold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg,#FF9933,#FF6600)', boxShadow: '0 4px 20px rgba(255,153,51,0.35)' }}>
                      {loading
                        ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Resetting...</>
                        : 'Reset Password 🎉'}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>

        <p className="mt-6 text-xs text-slate-400 dark:text-slate-600">BeRich v1.0 · Nishmitha's Grow 🌱</p>
      </div>
    </div>
  );
}
