import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Check, X } from 'lucide-react';
import api from '../lib/api';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

const RULES = [
  { id: 'len',   label: 'At least 8 characters',          test: p => p.length >= 8 },
  { id: 'upper', label: 'One uppercase letter (A–Z)',      test: p => /[A-Z]/.test(p) },
  { id: 'lower', label: 'One lowercase letter (a–z)',      test: p => /[a-z]/.test(p) },
  { id: 'num',   label: 'One number (0–9)',                test: p => /\d/.test(p) },
  { id: 'spec',  label: 'One special character (!@#$…)',   test: p => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

export default function Register() {
  const navigate = useNavigate();
  const { setAuth } = useStore();
  const [form, setForm]   = useState({ name: '', email: '', password: '', monthly_salary: '', city: '' });
  const [show, setShow]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const s = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const passed  = RULES.filter(r => r.test(form.password));
  const allPass = passed.length === RULES.length;
  const strength = passed.length; // 0–5

  const strengthColor = strength <= 1 ? '#ef4444' : strength <= 3 ? '#f59e0b' : strength === 4 ? '#3b82f6' : '#10b981';
  const strengthLabel = ['', 'Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!allPass) return toast.error('Password does not meet requirements');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { ...form, monthly_salary: parseFloat(form.monthly_salary) || 0 });
      setAuth(data.user, data.token);
      toast.success(`Welcome ${data.user.name}! 🎉`);
      navigate('/onboarding');
    } catch (err) { toast.error(err.response?.data?.error || 'Registration failed'); }
    finally { setLoading(false); }
  };

  const inp = 'w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/30 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition-all';

  return (
    <div className="auth-bg auth-pattern min-h-screen flex flex-col items-center justify-center p-5">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
        <div className="text-4xl mb-2">💎</div>
        <h1 className="text-2xl font-black text-white">BeRich</h1>
        <p className="text-orange-300 text-xs mt-1">Nishmitha's Grow 🌱</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="w-full max-w-sm">
        <div className="glass-card rounded-3xl p-6">
          <h2 className="text-xl font-extrabold text-white mb-1">Create Account 🚀</h2>
          <p className="text-white/50 text-sm mb-5">Start your financial journey today</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="text" required value={form.name} onChange={s('name')} className={inp} placeholder="Your full name" />
            <input type="email" required value={form.email} onChange={s('email')} className={inp} placeholder="Email address" />

            {/* Password field */}
            <div className="space-y-2">
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => { s('password')(e); setTouched(true); }}
                  className={`${inp} pr-10`}
                  placeholder="Password"
                />
                <button type="button" onClick={() => setShow(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Strength bar */}
              {form.password.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                        style={{ background: i <= strength ? strengthColor : 'rgba(255,255,255,0.15)' }} />
                    ))}
                  </div>
                  <p className="text-xs font-bold" style={{ color: strengthColor }}>{strengthLabel}</p>
                </div>
              )}

              {/* Rules checklist — show when touched */}
              {touched && (
                <div className="rounded-xl p-3 space-y-1.5" style={{ background: 'rgba(0,0,0,0.25)' }}>
                  {RULES.map(r => {
                    const ok = r.test(form.password);
                    return (
                      <div key={r.id} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${ok ? 'bg-emerald-500' : 'bg-white/20'}`}>
                          {ok ? <Check size={10} className="text-white" strokeWidth={3} /> : <X size={10} className="text-white/50" strokeWidth={3} />}
                        </div>
                        <span className={`text-xs font-medium transition-colors ${ok ? 'text-emerald-400' : 'text-white/50'}`}>{r.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 font-bold text-sm">₹</span>
              <input type="number" value={form.monthly_salary} onChange={s('monthly_salary')} className={`${inp} pl-7`} placeholder="Expected monthly income (optional)" />
            </div>
            <input type="text" value={form.city} onChange={s('city')} className={inp} placeholder="City (e.g. Bangalore)" />

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-2xl font-extrabold text-white flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#FF9933,#FF6600)', boxShadow: '0 4px 20px rgba(255,153,51,0.4)' }}>
              {loading ? 'Creating...' : <><span>Create Account</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-white/40 text-sm mt-4">
            Already have account? <Link to="/login" className="text-orange-400 font-bold hover:text-orange-300">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
