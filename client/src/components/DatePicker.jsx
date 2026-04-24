import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

// Converts "YYYY-MM-DD" → { day, month, year }
function parseDate(val) {
  if (!val) return { day: '', month: '', year: '' };
  const [y, m, d] = val.split('-');
  return { day: String(parseInt(d)), month: String(parseInt(m)), year: y };
}

// Converts { day, month, year } → "YYYY-MM-DD" or ""
function buildDate({ day, month, year }) {
  if (!day || !month || !year) return '';
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

function daysInMonth(month, year) {
  if (!month || !year) return 31;
  return new Date(parseInt(year), parseInt(month), 0).getDate();
}

const sel = `flex-1 px-3 py-3 rounded-xl text-sm font-semibold transition-all
  bg-white dark:bg-[#1e1e2e]
  text-slate-900 dark:text-white
  border border-slate-200 dark:border-white/[0.12]
  focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400
  appearance-none cursor-pointer`;

export default function DatePicker({ value, onChange, placeholder = 'Select date', required = false, minToday = false }) {
  const [parts, setParts] = useState(() => parseDate(value));

  // Sync external value changes (e.g. edit mode)
  useEffect(() => { setParts(parseDate(value)); }, [value]);

  const update = (key, val) => {
    const next = { ...parts, [key]: val };
    // Clamp day if it exceeds days in new month/year
    if (next.day && next.month && next.year) {
      const max = daysInMonth(next.month, next.year);
      if (parseInt(next.day) > max) next.day = String(max);
    }
    setParts(next);
    onChange(buildDate(next));
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear + i); // current year + 10 future years
  const maxDay = daysInMonth(parts.month, parts.year || currentYear);

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2 items-center">
        {/* Day */}
        <div className="relative flex-1">
          <select
            value={parts.day}
            onChange={e => update('day', e.target.value)}
            required={required}
            className={sel}
          >
            <option value="">Day</option>
            {Array.from({ length: maxDay }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Month */}
        <div className="relative flex-[2]">
          <select
            value={parts.month}
            onChange={e => update('month', e.target.value)}
            required={required}
            className={sel}
          >
            <option value="">Month</option>
            {MONTHS.map((m, i) => (
              <option key={i+1} value={i+1}>{m}</option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div className="relative flex-[1.5]">
          <select
            value={parts.year}
            onChange={e => update('year', e.target.value)}
            required={required}
            className={sel}
          >
            <option value="">Year</option>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected date display */}
      {parts.day && parts.month && parts.year && (
        <p className="text-xs font-bold text-orange-500 flex items-center gap-1.5 pl-1">
          <Calendar size={11} />
          {parts.day} {MONTHS[parseInt(parts.month)-1]} {parts.year}
        </p>
      )}
    </div>
  );
}
