import { useEffect, useState, useCallback, useLayoutEffect, useRef } from 'react';
import { fetchAttachments } from '../utils/attachments.js';
import { generatePoster } from '../utils/generatePoster.js';
import { buildShareText } from '../utils/generateShareText.js';
import { useSwipeSheet } from '../hooks/useSwipeSheet.js';

const BORDER = '2px solid #901e1e';

export function DetailPanel({ pet, onClose }) {
  const [photos, setPhotos]         = useState([]);
  const [activePhoto, setActivePhoto] = useState(0);
  const [loading, setLoading]       = useState(false);
  const [exporting, setExporting]   = useState(false);
  const [copied, setCopied]         = useState(false);
  const [closedOffset, setClosedOffset] = useState(0);
  const panelRef = useRef(null);
  const scrollRef = useRef(null);
  const isOpen = !!pet;

  useEffect(() => {
    setCopied(false);
    if (!pet) { setPhotos([]); setActivePhoto(0); return; }
    setLoading(true);
    setPhotos([]);
    setActivePhoto(0);
    fetchAttachments(pet.objectid).then(results => {
      setPhotos(results.filter(a => a.contentType?.startsWith('image/')));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [pet?.objectid]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Measure the panel's rendered width for the swipe-dismiss travel distance.
  // The panel fully unmounts on close (`if (!pet) return null` below), so this
  // remeasures fresh on every open — including after an orientation change.
  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const measure = () => setClosedOffset(el.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pet?.objectid]);

  const handleOpenChange = useCallback(next => {
    if (!next) onClose();
  }, [onClose]);

  const { style: dragStyle, handlers, grabHandlers, reducedMotion } = useSwipeSheet({
    axis: 'x',
    open: isOpen,
    onOpenChange: handleOpenChange,
    closedOffset,
    closeDirection: 1,
    scrollRef,
  });

  const handleExport = useCallback(async () => {
    if (!pet || exporting) return;
    setExporting(true);
    try {
      const photoUrl = photos[activePhoto]?.url ?? null;
      await generatePoster(pet, photoUrl);
    } catch (err) {
      console.error('Poster export failed:', err);
    } finally {
      setExporting(false);
    }
  }, [pet, photos, activePhoto, exporting]);

  const handleCopyShareText = useCallback(async () => {
    if (!pet) return;
    try {
      await navigator.clipboard.writeText(buildShareText(pet));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
    }
  }, [pet]);

  if (!pet) return null;

  const isLost      = (pet.findLost ?? '').toLowerCase() === 'lost';
  const isDog       = (pet.catDog ?? '').toLowerCase() === 'dog';
  const statusColor = isLost ? '#901e1e' : '#1D9E75';

  const occurStr = pet.occur
    ? pet.occur.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : 'Unknown date';

  const attributes = isDog ? [
    { label: 'Size',    value: pet.dog_size },
    { label: 'Color',   value: pet.allColors?.join(', ') },
    { label: 'Pattern', value: pet.dog_pattern },
  ] : [
    { label: 'Age',     value: pet.cat_age },
    { label: 'Color',   value: pet.allColors?.join(', ') },
    { label: 'Hair',    value: pet.cat_hair },
    { label: 'Pattern', value: pet.cat_pattern },
  ];

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, zIndex: 900,
        background: 'rgba(0,0,0,0.25)',
        animation: reducedMotion ? 'none' : 'fadeIn 0.2s ease',
      }} />

      {/* Slide-in panel */}
      <div
        ref={panelRef}
        className="detail-panel"
        style={{
          position: 'absolute', top: 0, right: 0, bottom: 0,
          width: 'min(360px, 100%)', zIndex: 901,
          background: '#f5f5dc',
          borderLeft: BORDER,
          display: 'flex', flexDirection: 'column',
          animation: reducedMotion ? 'none' : 'slideIn 0.25s ease',
          ...dragStyle,
        }}
      >

        {/* Header (non-scrolling, always draggable) */}
        <div
          {...grabHandlers}
          className="detail-panel-header"
          style={{
            flexShrink: 0,
            padding: '10px 16px 14px',
            borderBottom: BORDER,
            background: '#f5f5dc',
            touchAction: 'none',
          }}
        >
          <div className="grab-handle" style={{ marginBottom: 8 }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '0.03em', color: statusColor }}>
                {isLost ? 'MISSING' : 'FOUND'}
              </div>
              <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>
                {isDog ? '🐕' : '🐈'} {pet.catDog}
              </div>
            </div>
            <button onClick={onClose} className="close-btn" style={{
              background: 'transparent', border: BORDER, borderRadius: 6,
              cursor: 'pointer',
              fontSize: 16, color: '#901e1e',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
            }}>✕</button>
          </div>
        </div>

        {/* Scrollable content (dismiss gated by scrollTop === 0) */}
        <div ref={scrollRef} {...handlers} style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>

          {/* Photo */}
          <div style={{
            width: '100%', aspectRatio: '4/3',
            background: '#e8e8c8', position: 'relative',
            flexShrink: 0, borderBottom: BORDER,
          }}>
            {loading && (
              <div style={centered}>
                <span style={{ color: '#888', fontSize: 13 }}>Loading photo…</span>
              </div>
            )}
            {!loading && photos.length === 0 && (
              <div style={centered}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>{isDog ? '🐕' : '🐈'}</div>
                <span style={{ color: '#888', fontSize: 13 }}>No photo submitted</span>
              </div>
            )}
            {!loading && photos.length > 0 && (
              <>
                <img src={photos[activePhoto].url} alt="Pet photo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                {photos.length > 1 && (
                  <div style={{
                    position: 'absolute', bottom: 8, left: 0, right: 0,
                    display: 'flex', justifyContent: 'center', gap: 6, padding: '0 8px',
                  }}>
                    {photos.map((p, i) => (
                      <div key={p.id} onClick={() => setActivePhoto(i)} style={{
                        width: 40, height: 40, borderRadius: 4, overflow: 'hidden',
                        cursor: 'pointer',
                        border: i === activePhoto ? '2px solid #901e1e' : '2px solid rgba(255,255,255,0.6)',
                        flexShrink: 0,
                      }}>
                        <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Details */}
          <div style={{ padding: '16px' }}>

            {/* Date */}
            <div style={{
              fontSize: 12, color: '#777', marginBottom: 16,
              paddingBottom: 12, borderBottom: '1px solid rgba(144,30,30,0.2)',
            }}>
              📅 {occurStr}
            </div>

            {/* Attributes */}
            <div style={{ marginBottom: 16 }}>
              {attributes.map(({ label, value }) => value ? (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '7px 0', borderBottom: '1px solid rgba(144,30,30,0.12)',
                  fontSize: 13,
                }}>
                  <span style={{ color: '#777', fontWeight: 500 }}>{label}</span>
                  <span style={{ color: '#111', textTransform: 'capitalize', textAlign: 'right', maxWidth: '60%' }}>
                    {value}
                  </span>
                </div>
              ) : null)}
            </div>

            {/* Area note */}
            <div style={{
              background: '#e8e8c8', border: '1px solid rgba(144,30,30,0.2)',
              borderRadius: 6, padding: '10px 12px',
              fontSize: 12, color: '#555', lineHeight: 1.5, marginBottom: 20,
            }}>
              📍 Location shown is the general census block area only — not an exact address.
            </div>

            {/* Export button */}
            <button
              onClick={handleExport}
              disabled={exporting}
              className="export-btn"
              style={{
                width: '100%',
                background: exporting ? '#ccc' : '#901e1e',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                cursor: exporting ? 'not-allowed' : 'pointer',
                letterSpacing: '0.03em',
                transition: 'background 0.15s',
              }}
            >
              {exporting ? '⏳ Generating poster…' : '🖨 Download Missing Pet Poster'}
            </button>

            {/* Copy shareable Facebook post button */}
            <button
              onClick={handleCopyShareText}
              className="copy-share-btn"
              style={{
                width: '100%',
                marginTop: 10,
                background: copied ? '#1D9E75' : 'transparent',
                border: `2px solid ${copied ? '#1D9E75' : '#901e1e'}`,
                borderRadius: 8,
                color: copied ? '#fff' : '#901e1e',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.03em',
                transition: 'background 0.15s, color 0.15s, border-color 0.15s',
              }}
            >
              {copied ? '✅ Copied! Paste into Facebook' : '📋 Copy Facebook Post + Map Link'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  );
}

const centered = {
  position: 'absolute', inset: 0,
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
};
