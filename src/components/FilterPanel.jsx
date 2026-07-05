import { useState, useEffect } from 'react';
import { COLOR_OPTIONS, countActiveFilters } from '../utils/filters.js';

const BORDER_COLOR = 'rgba(144,30,30,0.25)';
const ACTIVE_COLOR = '#901e1e';

function DateRangeSlider({ dateFrom, dateTo, onChange }) {
  const today   = new Date();
  today.setHours(23, 59, 59, 999);
  const minDate = new Date(today);
  minDate.setFullYear(minDate.getFullYear() - 1);
  minDate.setHours(0, 0, 0, 0);

  const toSlider = date => {
    if (!date) return null;
    const clamped = Math.max(minDate.getTime(), Math.min(today.getTime(), date.getTime()));
    return Math.round(((clamped - minDate.getTime()) / (today.getTime() - minDate.getTime())) * 100);
  };

  const fromSlider = pct =>
    new Date(minDate.getTime() + (pct / 100) * (today.getTime() - minDate.getTime()));

  const [fromPct, setFromPct] = useState(toSlider(dateFrom) ?? 0);
  const [toPct,   setToPct]   = useState(toSlider(dateTo)   ?? 100);

  useEffect(() => { setFromPct(toSlider(dateFrom) ?? 0);   }, [dateFrom]);
  useEffect(() => { setToPct(toSlider(dateTo)     ?? 100); }, [dateTo]);

  const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });

  const handleFrom = e => {
    const val = Math.min(Number(e.target.value), toPct - 1);
    setFromPct(val);
    onChange(fromSlider(val), dateTo ?? today);
  };

  const handleTo = e => {
    const val = Math.max(Number(e.target.value), fromPct + 1);
    setToPct(val);
    onChange(dateFrom ?? minDate, fromSlider(val));
  };

  const handleClear = () => {
    setFromPct(0);
    setToPct(100);
    onChange(null, null);
  };

  const isActive = fromPct > 0 || toPct < 100;

  return (
    <div>
      <div style={{ position: 'relative', height: 28, marginBottom: 4 }}>
        <div style={{
          position: 'absolute', top: '50%', transform: 'translateY(-50%)',
          left: 0, right: 0, height: 4,
          background: BORDER_COLOR, borderRadius: 2, pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '50%', transform: 'translateY(-50%)',
          left: `${fromPct}%`, width: `${toPct - fromPct}%`, height: 4,
          background: ACTIVE_COLOR, borderRadius: 2, pointerEvents: 'none', zIndex: 1,
        }} />
        <input type="range" min={0} max={100} value={fromPct} onChange={handleFrom} style={sliderStyle} />
        <input type="range" min={0} max={100} value={toPct}   onChange={handleTo}   style={sliderStyle} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666', marginBottom: 4 }}>
        <span>{fmt(fromSlider(fromPct))}</span>
        <span>{fmt(fromSlider(toPct))}</span>
      </div>
      {isActive && (
        <button onClick={handleClear} style={{
          background: 'none', border: 'none', color: ACTIVE_COLOR,
          fontSize: 11, cursor: 'pointer', padding: 0, textDecoration: 'underline',
        }}>
          Clear dates
        </button>
      )}
    </div>
  );
}

const sliderStyle = {
  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
  left: 0, width: '100%',
  appearance: 'none', WebkitAppearance: 'none',
  background: 'transparent', height: 20,
  outline: 'none', cursor: 'pointer', zIndex: 2,
};

const s = {
  panel: {
    padding: '12px 14px',
    borderBottom: `2px solid ${ACTIVE_COLOR}`,
  },
  label: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: ACTIVE_COLOR,
    marginBottom: 6, display: 'block',
  },
  group: { marginBottom: 14 },
  toggleRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  toggle: (active) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '5px 12px', borderRadius: 7,
    border: `2px solid ${active ? ACTIVE_COLOR : BORDER_COLOR}`,
    background: active ? ACTIVE_COLOR : 'transparent',
    color: active ? '#fff' : ACTIVE_COLOR,
    fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
  }),
  colorGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 5 },
  colorBtn: (active) => ({
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '5px 8px', borderRadius: 7,
    border: `2px solid ${active ? ACTIVE_COLOR : BORDER_COLOR}`,
    background: active ? 'rgba(144,30,30,0.08)' : 'transparent',
    color: active ? ACTIVE_COLOR : '#444',
    fontSize: 12, fontWeight: active ? 600 : 400,
    cursor: 'pointer', transition: 'all 0.15s',
  }),
  swatch: (hex) => ({
    width: 12, height: 12, borderRadius: '50%',
    background: hex, flexShrink: 0,
    border: '1px solid rgba(0,0,0,0.15)',
  }),
  clearBtn: {
    width: '100%', padding: '7px', marginTop: 4,
    background: 'transparent', border: `2px solid ${ACTIVE_COLOR}`,
    borderRadius: 7, color: ACTIVE_COLOR,
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
};

export function FilterPanel({ filters, onChange }) {
  function set(key, value) {
    onChange({ ...filters, [key]: value });
  }

  function toggleColor(val) {
    const next = filters.colors.includes(val)
      ? filters.colors.filter(c => c !== val)
      : [...filters.colors, val];
    set('colors', next);
  }

  function clearAll() {
    onChange({ status: 'all', animalType: 'all', dateFrom: null, dateTo: null, colors: [] });
  }

  const isFiltered = countActiveFilters(filters) > 0;

  return (
    <div style={s.panel}>

      {/* Status */}
      <div style={s.group}>
        <span style={s.label}>Status</span>
        <div style={s.toggleRow}>
          {[['all', 'All'], ['lost', 'Missing'], ['found', 'Found']].map(([val, lbl]) => (
            <button key={val} className="filter-toggle" style={s.toggle(filters.status === val)}
              onClick={() => set('status', val)}>{lbl}</button>
          ))}
        </div>
      </div>

      {/* Animal type */}
      <div style={s.group}>
        <span style={s.label}>Animal</span>
        <div style={s.toggleRow}>
          {[['all', 'All'], ['dog', 'Dogs'], ['cat', 'Cats']].map(([val, lbl]) => (
            <button key={val} className="filter-toggle" style={s.toggle(filters.animalType === val)}
              onClick={() => set('animalType', val)}>{lbl}</button>
          ))}
        </div>
      </div>

      {/* Date range slider */}
      <div style={s.group}>
        <span style={s.label}>Date range</span>
        <DateRangeSlider
          dateFrom={filters.dateFrom}
          dateTo={filters.dateTo}
          onChange={(from, to) => onChange({ ...filters, dateFrom: from, dateTo: to })}
        />
      </div>

      {/* Colors */}
      <div style={s.group}>
        <span style={s.label}>Color</span>
        <div style={s.colorGrid}>
          {COLOR_OPTIONS.map(({ value, label, hex }) => (
            <button key={value} className="color-chip" style={s.colorBtn(filters.colors.includes(value))}
              onClick={() => toggleColor(value)}>
              <div style={s.swatch(hex)} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {isFiltered && (
        <button style={s.clearBtn} onClick={clearAll}>✕ Clear all filters</button>
      )}

      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px; height: 16px; border-radius: 50%;
          background: #901e1e; border: 2px solid #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.25); cursor: pointer;
        }
        input[type=range]::-moz-range-thumb {
          width: 16px; height: 16px; border-radius: 50%;
          background: #901e1e; border: 2px solid #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.25); cursor: pointer;
        }
      `}</style>
    </div>
  );
}
