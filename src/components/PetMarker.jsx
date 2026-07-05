import { useEffect, useState, useRef } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getCachedSprite } from '../utils/tintSprite.js';

export function PetMarker({ pet, isActive, onClick }) {
  const [icon, setIcon] = useState(null);
  const markerRef = useRef(null);
  const map = useMap();

  useEffect(() => {
    let cancelled = false;
    // Active markers get a slightly larger size and white ring effect via a second canvas draw
    const size = isActive ? Math.round(pet.sizePx * 1.2) : pet.sizePx;
    // Pad the tappable hit area up to 44x44 without enlarging the visible
    // sprite: the image sits flush to the bottom-center of a bigger
    // invisible box, so the geo anchor point and popup position don't shift.
    const hitSize = Math.max(44, size);
    getCachedSprite(pet.icon, pet.markerColor, size).then(dataUrl => {
      if (cancelled) return;
      setIcon(L.divIcon({
        html: `<div style="width:100%;height:100%;display:flex;align-items:flex-end;justify-content:center;">`
          + `<img src="${dataUrl}" width="${size}" height="${size}" style="display:block;" /></div>`,
        iconSize: [hitSize, hitSize],
        iconAnchor: [hitSize / 2, hitSize],
        popupAnchor: [0, -size],
        className: `pet-marker-icon${isActive ? ' pet-marker-active' : ''}`,
      }));
    });
    return () => { cancelled = true; };
  }, [pet.icon, pet.markerColor, pet.sizePx, isActive]);

  if (!icon) return null;

  const occurStr = pet.occur
    ? pet.occur.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Unknown date';

  const isLost = (pet.findLost ?? '').toLowerCase() === 'lost';
  const isDog  = (pet.catDog ?? '').toLowerCase() === 'dog';
  const sizeOrAge = isDog ? (pet.dog_size ?? '—') : (pet.cat_age ?? '—');
  const patternOrHair = isDog
    ? (pet.dog_pattern ?? '—')
    : `${pet.cat_hair ?? '—'} hair · ${pet.cat_pattern ?? '—'}`;
  const colorList = pet.allColors?.length > 0
    ? pet.allColors.join(', ')
    : '—';

  return (
    <Marker
      position={pet.latlng}
      icon={icon}
      ref={markerRef}
      eventHandlers={{ click: onClick }}
      zIndexOffset={isActive ? 1000 : 0}
    >
      <Popup>
        <div style={{ fontFamily: 'sans-serif', minWidth: 170 }}>
          <div style={{
            fontWeight: 700, fontSize: 14, marginBottom: 3,
            color: isLost ? '#D85A30' : '#1D9E75',
          }}>
            {isLost ? 'MISSING' : 'FOUND'} {(pet.catDog ?? '').toUpperCase()}
          </div>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>{occurStr}</div>
          <table style={{ fontSize: 12, borderCollapse: 'collapse', width: '100%' }}>
            <tbody>
              <tr><td style={tdL}>Size / age</td><td style={tdR}>{sizeOrAge}</td></tr>
              <tr><td style={tdL}>Color(s)</td><td style={tdR}>{colorList}</td></tr>
              <tr><td style={tdL}>Pattern</td><td style={tdR}>{patternOrHair}</td></tr>
            </tbody>
          </table>
        </div>
      </Popup>
    </Marker>
  );
}

const tdL = { color: '#888', paddingRight: 8, paddingBottom: 4, verticalAlign: 'top', textTransform: 'capitalize' };
const tdR = { color: '#2C2C2A', paddingBottom: 4, textTransform: 'capitalize' };
