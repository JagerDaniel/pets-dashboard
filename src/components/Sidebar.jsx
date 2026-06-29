import { FilterPanel } from './FilterPanel.jsx';
import { CardList } from './CardList.jsx';

export function Sidebar({ filters, onFilterChange, allPets, filteredPets, activePetId, onCardClick }) {
  return (
    <div style={{
      width: 320,
      flexShrink: 0,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#f5f5dc',
      borderRight: '1px solid rgba(144,30,30,0.15)',
      overflow: 'hidden',
    }}>
      <FilterPanel
        filters={filters}
        onChange={onFilterChange}
      />
      <CardList
        pets={filteredPets}
        activePetId={activePetId}
        onCardClick={onCardClick}
      />
    </div>
  );
}
