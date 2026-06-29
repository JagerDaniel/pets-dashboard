import { useEffect, useState, useRef } from 'react';
import { fetchAttachmentsForPets } from '../utils/attachments.js';

const GALLERY_HEIGHT = 160;
const MAX_UNFILTERED = 10;

export function PhotoGallery({ filteredPets, allPets, isFiltered, activePetId, onPhotoClick }) {
  const [isOpen, setIsOpen]   = useState(true);
  const [photos, setPhotos]   = useState([]);
  const [loading, setLoading] = useState(false);
  const stripRef              = useRef(null);
  const abortRef              = useRef(null);

  const petsToLoad = isFiltered ? filteredPets : filteredPets.slice(0, MAX_UNFILTERED);

  useEffect(() => {
    if (!isOpen) return;
    if (abortRef.current) abortRef.current = false;
    const token = { alive: true };
    abortRef.current = token;

    setPhotos([]);
    if (petsToLoad.length === 0) return;

    setLoading(true);
    fetchAttachmentsForPets(petsToLoad).then(results => {
      if (!token.alive) return;
      setPhotos(results);
      setLoading(false);
    }).catch(() => {
      if (!token.alive) return;
      setLoading(false);
    });

    return () => { token.alive = false; };
  }, [petsToLoad.map(p => p.objectid).join(','), isOpen]);

  useEffect(() => {
    if (!activePetId || !stripRef.current) return;
    const el = stripRef.current.querySelector(`[data-petid="${activePetId}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activePetId]);

  const photoCount = photos.length;

  return (
    <div style={{
      flexShrink: 0,
      borderTop: '1px solid rgba(0,0,0,0.1)',
      background: '#f5f5dc',
      transition: 'height 0.25s ease',
      height: isOpen ? GALLERY_HEIGHT + 36 : 36,
      overflow: 'hidden',
    }}>
      {/* Header / toggle bar */}
      <div
        onClick={() => setIsOpen(o => !o)}
        style={{
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 14px',
          cursor: 'pointer',
          userSelect: 'none',
          borderBottom: isOpen ? '1px solid rgba(0,0,0,0.08)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#777' }}>
            Photos
          </span>
          {loading && (
            <span style={{ fontSize: 10, color: '#999' }}>loading…</span>
          )}
          {!loading && photoCount > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 600,
              background: 'rgba(0,0,0,0.08)',
              color: '#555',
              padding: '1px 6px', borderRadius: 8,
            }}>{photoCount}</span>
          )}
          {!isFiltered && (
            <span style={{ fontSize: 10, color: '#999', fontStyle: 'italic' }}>
              showing {Math.min(filteredPets.length, MAX_UNFILTERED)} most recent
            </span>
          )}
        </div>
        <span style={{ fontSize: 14, color: '#999', lineHeight: 1 }}>
          {isOpen ? '▾' : '▴'}
        </span>
      </div>

      {/* Photo strip */}
      <div
        ref={stripRef}
        style={{
          height: GALLERY_HEIGHT,
          overflowX: 'auto',
          overflowY: 'hidden',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0,0,0,0.15) transparent',
        }}
      >
        {!loading && photoCount === 0 && (
          <div style={{ color: '#999', fontSize: 12, whiteSpace: 'nowrap' }}>
            No photos for current results.
          </div>
        )}

        {photos.map(photo => {
          const isActive = photo.pet.objectid === activePetId;
          const isLost = (photo.pet.findLost ?? '').toLowerCase() === 'lost';
          return (
            <div
              key={`${photo.objectid}-${photo.id}`}
              data-petid={photo.pet.objectid}
              onClick={() => onPhotoClick(photo.pet)}
              style={{
                flexShrink: 0,
                width: 120,
                height: 140,
                borderRadius: 8,
                overflow: 'hidden',
                cursor: 'pointer',
                position: 'relative',
                border: isActive ? '2px solid #1D9E75' : '2px solid rgba(0,0,0,0.1)',
                transition: 'border-color 0.15s, transform 0.15s',
                transform: isActive ? 'scale(1.04)' : 'scale(1)',
              }}
            >
              <img
                src={photo.url}
                alt={photo.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                loading="lazy"
              />
              <div style={{
                position: 'absolute',
                bottom: 0, left: 0, right: 0,
                padding: '16px 6px 5px',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
                  padding: '1px 5px', borderRadius: 4,
                  background: isLost ? 'rgba(216,90,48,0.9)' : 'rgba(29,158,117,0.9)',
                  color: '#fff',
                }}>
                  {isLost ? 'MISSING' : 'FOUND'}
                </span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.85)', textTransform: 'capitalize' }}>
                  {photo.pet.catDog}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
