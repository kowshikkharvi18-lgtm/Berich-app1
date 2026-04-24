import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Delete, ChevronLeft, Plus, Check } from 'lucide-react';
import api from '../lib/api';
import useStore from '../store/useStore';
import DatePicker from './DatePicker';
import { PAYMENT_METHODS, COLORS } from '../lib/utils';
import { useT } from '../i18n/translations';
import toast from 'react-hot-toast';

const CAT_ICONS = ['🛒','🍔','🚗','🏠','💊','📱','⚡','🎬','👗','✈️','🎁','📚','💪','🐾','🧴','☕','🍕','🎮','🏥','🔧','🎓','💈','🌿','🧹'];
const TYPE_OPTIONS = [
  { value: 'need', label: 'Need', color: '#ef4444' },
  { value: 'want', label: 'Want', color: '#f97316' },
];

export default function AddExpenseSheet({ open, onClose, onSaved, editData = null }) {
  const { lang, isDark } = useStore();
  const t = useT(lang);
  const [step, setStep] = useState('amount');
  const [amount, setAmount] = useState('');
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ category_id:'', date: new Date().toISOString().split('T')[0], payment_method:'upi', note:'', is_split:false });
  const [saving, setSaving] = useState(false);

  // New category inline form
  const [addingCat, setAddingCat] = useState(false);
  const [newCat, setNewCat] = useState({ name_en:'', type:'want', color: COLORS[0], icon:'🛒' });
  const [savingCat, setSavingCat] = useState(false);

  const loadCategories = () =>
    Promise.all([api.get('/categories?type=need'), api.get('/categories?type=want')])
      .then(([r1, r2]) => setCategories([...r1.data, ...r2.data]))
      .catch(() => toast.error('Could not load categories'));

  useEffect(() => {
    if (!open) return;
    loadCategories();
    if (editData) {
      setAmount(String(editData.amount));
      setForm({ category_id: String(editData.category_id), date: editData.date, payment_method: editData.payment_method || 'upi', note: editData.notes || '', is_split: !!editData.is_split });
      setStep('category');
    } else {
      setAmount('');
      setForm({ category_id:'', date: new Date().toISOString().split('T')[0], payment_method:'upi', note:'', is_split:false });
      setStep('amount');
    }
    setAddingCat(false);
    setNewCat({ name_en:'', type:'want', color: COLORS[0], icon:'🛒' });
  }, [open]);

  const tap = (v) => {
    if (v === 'del') { setAmount(a => a.slice(0,-1)); return; }
    if (v === '.' && amount.includes('.')) return;
    if (amount.replace('.','').length >= 7) return;
    setAmount(a => a + v);
  };

  const handleAddCategory = async () => {
    if (!newCat.name_en.trim()) return toast.error('Enter a category name');
    setSavingCat(true);
    try {
      const res = await api.post('/categories', {
        name_en: newCat.name_en.trim(),
        name_kn: newCat.name_en.trim(),
        type: newCat.type,
        color: newCat.color,
        icon: newCat.icon,
      });
      await loadCategories();
      setForm(f => ({ ...f, category_id: String(res.data.id) }));
      setAddingCat(false);
      setNewCat({ name_en:'', type:'want', color: COLORS[0], icon:'🛒' });
      toast.success('Category added! 🏷️');
      setStep('details');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add category');
    } finally { setSavingCat(false); }
  };

  const submit = async () => {
    if (!form.category_id) return toast.error('Select a category');
    if (!amount || parseFloat(amount) <= 0) return toast.error('Enter amount');
    setSaving(true);
    try {
      const payload = {
        category_id:    form.category_id,
        date:           form.date,
        payment_method: form.payment_method,
        notes:          form.note || null,
        is_split:       form.is_split,
        amount:         parseFloat(amount),
      };
      if (editData) { await api.patch(`/expenses/${editData.id}`, payload); toast.success('Updated! ✅'); }
      else { await api.post('/expenses', payload); toast.success('Added! 💸'); }
      onSaved?.(); onClose();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const bg      = isDark ? '#16162a' : '#fff';
  const txt     = isDark ? '#f8fafc' : '#0f172a';
  const muted   = isDark ? '#94a3b8' : '#64748b';
  const ibg     = isDark ? 'rgba(255,255,255,0.07)' : '#f8fafc';
  const iborder = isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-40" style={{ background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)' }}
            onClick={onClose} />

          <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
            transition={{ type:'spring', damping:32, stiffness:320 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl"
            style={{ background:bg, boxShadow:'0 -8px 40px rgba(0,0,0,0.2)', maxHeight:'92vh', overflowY:'auto' }}
            onClick={e => e.stopPropagation()}>

            <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1" style={{ background: isDark ? 'rgba(255,255,255,0.15)' : '#e2e8f0' }} />

            <div className="flex items-center justify-between px-5 py-3">
              <h2 className="text-lg font-extrabold" style={{ color:txt }}>{editData ? 'Edit Expense' : 'Add Expense'}</h2>
              <button type="button" onClick={onClose} className="p-2 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }}>
                <X size={18} style={{ color:muted }} />
              </button>
            </div>

            {/* ── Step: Amount ── */}
            {step === 'amount' && (
              <div className="px-5 pb-8">
                <div className="text-center py-5">
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:muted }}>Enter Amount</p>
                  <div className="text-5xl font-black" style={{ color:txt, fontFamily:'Poppins,sans-serif' }}>₹{amount || '0'}</div>
                  {amount && parseFloat(amount) > 0 && (
                    <p className="text-sm mt-1" style={{ color:muted }}>
                      {new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(parseFloat(amount))}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {['1','2','3','4','5','6','7','8','9','.','0','del'].map(k => (
                    <button key={k} type="button" onClick={() => tap(k)}
                      className="flex items-center justify-center h-14 rounded-2xl text-xl font-bold transition-colors"
                      style={{ background: k==='del' ? (isDark?'rgba(239,68,68,0.15)':'#fef2f2') : ibg, color: k==='del'?'#ef4444':txt }}>
                      {k === 'del' ? <Delete size={20} /> : k}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => { if (parseFloat(amount) > 0) setStep('category'); else toast.error('Enter amount first'); }}
                  className="w-full py-4 rounded-2xl font-extrabold text-white text-base"
                  style={{ background:'linear-gradient(135deg,#FF9933,#FF6600)', boxShadow:'0 4px 16px rgba(255,153,51,0.4)' }}>
                  Next — Choose Category →
                </button>
              </div>
            )}

            {/* ── Step: Category ── */}
            {step === 'category' && !addingCat && (
              <div className="px-5 pb-8">
                <div className="flex items-center justify-between mb-3">
                  <button type="button" onClick={() => setStep('amount')} className="flex items-center gap-1 text-sm font-bold text-orange-500">
                    <ChevronLeft size={16} /> ₹{amount}
                  </button>
                  <p className="text-sm font-bold" style={{ color:muted }}>Select Category</p>
                </div>

                {categories.length === 0 ? (
                  <div className="text-center py-8" style={{ color:muted }}>
                    <p className="text-4xl mb-2">🏷️</p><p>Loading...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto pb-2">
                    {categories.map(cat => {
                      const sel = form.category_id === String(cat.id);
                      return (
                        <button key={cat.id} type="button"
                          onClick={() => { setForm(f => ({ ...f, category_id: String(cat.id) })); setStep('details'); }}
                          className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border-2 transition-all"
                          style={{ borderColor: sel?'#FF9933':'transparent', background: sel?'rgba(255,153,51,0.1)':ibg }}>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-bold" style={{ background:cat.color }}>
                            {cat.name_en[0]}
                          </div>
                          <span className="text-[10px] font-bold text-center leading-tight" style={{ color: sel?'#FF9933':muted }}>
                            {lang==='kn' ? cat.name_kn : cat.name_en}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Add new category button */}
                <button type="button" onClick={() => setAddingCat(true)}
                  className="mt-4 w-full py-3 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 font-bold text-sm transition-colors"
                  style={{ borderColor: isDark ? 'rgba(255,153,51,0.4)' : '#FF993360', color:'#FF9933', background: isDark ? 'rgba(255,153,51,0.06)' : 'rgba(255,153,51,0.04)' }}>
                  <Plus size={16} /> Add New Category
                </button>
              </div>
            )}

            {/* ── Inline: Add New Category ── */}
            {step === 'category' && addingCat && (
              <div className="px-5 pb-8 space-y-4">
                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => setAddingCat(false)} className="flex items-center gap-1 text-sm font-bold text-orange-500">
                    <ChevronLeft size={16} /> Back
                  </button>
                  <p className="text-sm font-extrabold" style={{ color:txt }}>New Category</p>
                </div>

                {/* Name */}
                <div>
                  <label className="label">Category Name</label>
                  <input
                    type="text"
                    value={newCat.name_en}
                    onChange={e => setNewCat(c => ({ ...c, name_en: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium"
                    style={{ background:ibg, border:`1.5px solid ${iborder}`, color:txt }}
                    placeholder="e.g. Petrol, Medicine, Haircut..."
                    autoFocus
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="label">Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TYPE_OPTIONS.map(tp => (
                      <button key={tp.value} type="button"
                        onClick={() => setNewCat(c => ({ ...c, type: tp.value }))}
                        className="py-2.5 rounded-xl font-bold text-sm border-2 transition-all"
                        style={{
                          borderColor: newCat.type === tp.value ? tp.color : iborder,
                          background:  newCat.type === tp.value ? tp.color + '20' : ibg,
                          color:       newCat.type === tp.value ? tp.color : muted,
                        }}>
                        {tp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="label">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map(c => (
                      <button key={c} type="button"
                        onClick={() => setNewCat(n => ({ ...n, color: c }))}
                        className="w-8 h-8 rounded-xl transition-all flex items-center justify-center"
                        style={{ background: c, transform: newCat.color === c ? 'scale(1.2)' : 'scale(1)', boxShadow: newCat.color === c ? `0 0 0 3px ${c}55` : 'none' }}>
                        {newCat.color === c && <Check size={14} className="text-white" strokeWidth={3} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Icon */}
                <div>
                  <label className="label">Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {CAT_ICONS.map(ic => (
                      <button key={ic} type="button"
                        onClick={() => setNewCat(n => ({ ...n, icon: ic }))}
                        className="w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all"
                        style={{
                          background: newCat.icon === ic ? newCat.color + '30' : ibg,
                          border: `2px solid ${newCat.icon === ic ? newCat.color : 'transparent'}`,
                          transform: newCat.icon === ic ? 'scale(1.15)' : 'scale(1)',
                        }}>
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: newCat.color + '15', border: `1px solid ${newCat.color}30` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: newCat.color }}>
                    {newCat.icon}
                  </div>
                  <div>
                    <p className="font-extrabold text-sm" style={{ color: txt }}>{newCat.name_en || 'Category Name'}</p>
                    <p className="text-xs font-bold" style={{ color: newCat.color }}>
                      {TYPE_OPTIONS.find(t => t.value === newCat.type)?.label}
                    </p>
                  </div>
                </div>

                <button type="button" onClick={handleAddCategory} disabled={savingCat || !newCat.name_en.trim()}
                  className="w-full py-4 rounded-2xl font-extrabold text-white text-base disabled:opacity-50"
                  style={{ background:'linear-gradient(135deg,#FF9933,#FF6600)', boxShadow:'0 4px 16px rgba(255,153,51,0.4)' }}>
                  {savingCat ? 'Adding...' : 'Add Category 🏷️'}
                </button>
              </div>
            )}

            {/* ── Step: Details ── */}
            {step === 'details' && (
              <div className="px-5 pb-8 space-y-4">
                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => setStep('category')} className="flex items-center gap-1 text-sm font-bold text-orange-500">
                    <ChevronLeft size={16} /> Back
                  </button>
                  <p className="text-sm font-bold" style={{ color:muted }}>
                    ₹{amount} · {categories.find(c => String(c.id)===form.category_id)?.[lang==='kn'?'name_kn':'name_en']}
                  </p>
                </div>

                <div>
                  <label className="label">Date</label>
                  <DatePicker
                    value={form.date}
                    onChange={val => setForm(f => ({ ...f, date: val || new Date().toISOString().split('T')[0] }))}
                  />
                </div>

                <div>
                  <label className="label">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PAYMENT_METHODS.map(pm => {
                      const sel = form.payment_method === pm.value;
                      return (
                        <button key={pm.value} type="button" onClick={() => setForm(f => ({ ...f, payment_method:pm.value }))}
                          className="flex items-center gap-1.5 px-2 py-2.5 rounded-xl border-2 text-xs font-bold transition-colors"
                          style={{ borderColor: sel?'#FF9933':iborder, background: sel?'rgba(255,153,51,0.1)':ibg, color: sel?'#FF9933':muted }}>
                          <span>{pm.emoji}</span> {pm.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="label">Note (optional)</label>
                  <input type="text" value={form.note} onChange={e => setForm(f => ({ ...f, note:e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium"
                    style={{ background:ibg, border:`1.5px solid ${iborder}`, color:txt }}
                    placeholder="e.g. Swiggy, Ola, Grocery..." />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl" style={{ background:ibg }}>
                  <span className="text-sm font-bold" style={{ color:txt }}>🤝 Split this bill?</span>
                  <button type="button" onClick={() => setForm(f => ({ ...f, is_split:!f.is_split }))}
                    className="relative flex-shrink-0" style={{ width:44, height:24 }}>
                    <div className="absolute inset-0 rounded-full transition-colors" style={{ background: form.is_split?'#FF9933':'#d1d5db' }} />
                    <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform"
                      style={{ transform: form.is_split?'translateX(20px)':'translateX(2px)' }} />
                  </button>
                </div>

                <button type="button" onClick={submit} disabled={saving}
                  className="w-full py-4 rounded-2xl font-extrabold text-white text-base transition-opacity"
                  style={{ background:'linear-gradient(135deg,#FF9933,#FF6600)', boxShadow:'0 4px 16px rgba(255,153,51,0.4)', opacity: saving?0.7:1 }}>
                  {saving ? 'Saving...' : editData ? 'Update ✅' : `Add ₹${amount} 💸`}
                </button>
              </div>
            )}

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
