import { useEffect, useState, useCallback } from 'react';
import { PetMap } from './components/PetMap.jsx';
import { StatusBar } from './components/StatusBar.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { PhotoGallery } from './components/PhotoGallery.jsx';
import { DetailPanel } from './components/DetailPanel.jsx';
import { SplashScreen } from './components/SplashScreen.jsx';
import { fetchPets } from './utils/featureService.js';
import { applyFilters, DEFAULT_FILTERS } from './utils/filters.js';

const BORDER = '2px solid #901e1e';
const SPLASH_SEEN_KEY = 'ellensburgPets.splashSeen';

export default function App() {
  const [allPets, setAllPets]         = useState([]);
  const [status, setStatus]           = useState('loading');
  const [filters, setFilters]         = useState(DEFAULT_FILTERS);
  const [activePetId, setActivePetId] = useState(null);
  const [flyToPet, setFlyToPet]       = useState(null);
  const [detailPet, setDetailPet]     = useState(null);
  const [showSplash, setShowSplash]   = useState(() => !sessionStorage.getItem(SPLASH_SEEN_KEY));

  const dismissSplash = useCallback(() => {
    sessionStorage.setItem(SPLASH_SEEN_KEY, '1');
    setShowSplash(false);
  }, []);

  useEffect(() => {
    fetchPets()
      .then(data => { setAllPets(data); setStatus('ready'); })
      .catch(err  => { console.error(err); setStatus('error'); });
  }, []);

  const filteredPets = applyFilters(allPets, filters);

  const isFiltered =
    filters.status !== 'all' ||
    filters.animalType !== 'all' ||
    filters.dateFrom !== null ||
    filters.dateTo !== null ||
    filters.colors.length > 0;

  const openDetail = useCallback(pet => {
    setActivePetId(pet.objectid);
    setDetailPet(pet);
  }, []);

  const handleCardClick = useCallback(pet => {
    setActivePetId(pet.objectid);
    setFlyToPet(pet);
    openDetail(pet);
  }, [openDetail]);

  const handleMarkerClick = useCallback(pet => {
    setActivePetId(pet.objectid);
    setFlyToPet(null);
    openDetail(pet);
  }, [openDetail]);

  const handlePhotoClick = useCallback(pet => {
    setActivePetId(pet.objectid);
    setFlyToPet(pet);
    openDetail(pet);
  }, [openDetail]);

  const handleCloseDetail = useCallback(() => {
    setDetailPet(null);
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      padding: 8,
      gap: 8,
      background: '#e8e8c8',
    }}>
      {showSplash && <SplashScreen onDismiss={dismissSplash} />}

      {/* Status bar */}
      <div style={{ border: BORDER, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
        <StatusBar status={status} pets={filteredPets} total={allPets.length} />
      </div>

      {/* Main content row */}
      <div style={{ display: 'flex', flex: 1, gap: 8, overflow: 'hidden' }}>

        {/* Sidebar */}
        <div style={{ border: BORDER, borderRadius: 6, overflow: 'hidden', flexShrink: 0, display: 'flex' }}>
          <Sidebar
            filters={filters}
            onFilterChange={setFilters}
            allPets={allPets}
            filteredPets={filteredPets}
            activePetId={activePetId}
            onCardClick={handleCardClick}
          />
        </div>

        {/* Map + gallery column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>

          {/* Map — detail panel slides in over this */}
          <div style={{ flex: 1, border: BORDER, borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
            <PetMap
              pets={filteredPets}
              activePetId={activePetId}
              flyToPet={flyToPet}
              onMarkerClick={handleMarkerClick}
            />
            <DetailPanel
              pet={detailPet}
              onClose={handleCloseDetail}
            />
          </div>

          {/* Photo gallery */}
          <div style={{ border: BORDER, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
            <PhotoGallery
              filteredPets={filteredPets}
              allPets={allPets}
              isFiltered={isFiltered}
              activePetId={activePetId}
              onPhotoClick={handlePhotoClick}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
