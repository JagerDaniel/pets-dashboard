import { useEffect, useRef } from 'react';
import { PetCard } from './PetCard.jsx';

export function CardList({ pets, activePetId, onCardClick, embedded = false }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (!activePetId || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-id="${activePetId}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activePetId]);

  if (pets.length === 0) {
    return (
      <div style={{
        padding: '24px 14px',
        textAlign: 'center',
        color: '#777',
        fontSize: 13,
      }}>
        No reports match your filters.
      </div>
    );
  }

  return (
    <div ref={listRef} style={embedded ? undefined : { overflowY: 'auto', flex: 1 }}>
      {pets.map(pet => (
        <div key={pet.objectid} data-id={pet.objectid}>
          <PetCard
            pet={pet}
            isActive={pet.objectid === activePetId}
            onClick={() => onCardClick(pet)}
          />
        </div>
      ))}
    </div>
  );
}
