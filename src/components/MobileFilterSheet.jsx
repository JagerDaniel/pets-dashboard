import { useLayoutEffect, useRef, useState } from 'react';
import { FilterPanel } from './FilterPanel.jsx';
import { CardList } from './CardList.jsx';
import { countActiveFilters } from '../utils/filters.js';
import { useSwipeSheet } from '../hooks/useSwipeSheet.js';

const HEADER_HEIGHT = 44;

export function MobileFilterSheet({ filters, onFilterChange, filteredPets, activePetId, onCardClick }) {
  const [expanded, setExpanded] = useState(false);
  const [closedOffset, setClosedOffset] = useState(0);
  const sheetRef = useRef(null);

  // Measure the sheet's natural (max-height-capped) height so the collapsed
  // translateY leaves exactly the header visible. Re-measures on viewport
  // resize / content-height changes via ResizeObserver.
  useLayoutEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const measure = () => setClosedOffset(Math.max(0, el.offsetHeight - HEADER_HEIGHT));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { style, grabHandlers } = useSwipeSheet({
    axis: 'y',
    open: expanded,
    onOpenChange: setExpanded,
    closedOffset,
    closeDirection: 1,
    tapToggles: true,
  });

  const count = countActiveFilters(filters);

  return (
    <div
      ref={sheetRef}
      className="mobile-filter-sheet sheet-max-height"
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 850,
        flexDirection: 'column',
        background: '#f5f5dc',
        borderTop: '2px solid #901e1e',
        borderRadius: '10px 10px 0 0',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.2)',
        ...style,
      }}
    >
      <div
        {...grabHandlers}
        style={{
          height: HEADER_HEIGHT, flexShrink: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 4, cursor: 'pointer', touchAction: 'none', userSelect: 'none',
        }}
      >
        <div className="grab-handle" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#901e1e' }}>
          <span>Filters{count > 0 ? ` · ${count}` : ''}</span>
          <span style={{ fontSize: 11 }}>{expanded ? '▾' : '▴'}</span>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <FilterPanel filters={filters} onChange={onFilterChange} />
        <CardList pets={filteredPets} activePetId={activePetId} onCardClick={onCardClick} embedded />
      </div>
    </div>
  );
}
