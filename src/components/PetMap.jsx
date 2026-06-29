import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { PetMarker } from './PetMarker.jsx';

const CENTER = [47.0001, -120.5478];
const ZOOM = 13;
const TILE_URL = 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// Inner component so we can access the Leaflet map instance
function MapController({ flyToPet }) {
  const map = useMap();
  const prevPetRef = useRef(null);

  useEffect(() => {
    if (!flyToPet) return;
    if (prevPetRef.current?.objectid === flyToPet.objectid) return;
    prevPetRef.current = flyToPet;
    map.flyTo(flyToPet.latlng, Math.max(map.getZoom(), 15), { duration: 0.8 });
  }, [flyToPet, map]);

  return null;
}

export function PetMap({ pets, activePetId, flyToPet, onMarkerClick }) {
  return (
    <MapContainer
      center={CENTER}
      zoom={ZOOM}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={20} />
      <MapController flyToPet={flyToPet} />
      {pets.map(pet => (
        <PetMarker
          key={pet.objectid}
          pet={pet}
          isActive={pet.objectid === activePetId}
          onClick={() => onMarkerClick(pet)}
        />
      ))}
    </MapContainer>
  );
}
