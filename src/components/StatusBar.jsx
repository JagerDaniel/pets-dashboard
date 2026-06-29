export function StatusBar({ status, pets, total }) {
  const lost  = pets.filter(p => (p.findLost ?? '').toLowerCase() === 'lost').length;
  const found = pets.filter(p => (p.findLost ?? '').toLowerCase() === 'found').length;
  const dogs  = pets.filter(p => (p.catDog ?? '').toLowerCase() === 'dog').length;
  const cats  = pets.filter(p => (p.catDog ?? '').toLowerCase() === 'cat').length;
  const isFiltered = pets.length !== total;

  return (
    <div style={bar}>
      {/* Title */}
      <div style={title}>Ellensburg Pets, Lost and Found</div>

      {status === 'loading' && <div style={pill()}>Loading…</div>}
      {status === 'error'   && <div style={pill()}>Failed to load data</div>}
      {status === 'ready'   && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Showing X of Y — only when filtered */}
          {isFiltered && (
            <div style={pill()}>
              {pets.length} of {total}
            </div>
          )}
          <div style={pill()}>{lost} missing</div>
          <div style={pill()}>{found} found</div>
          <div style={pill()}>{dogs} dogs</div>
          <div style={pill()}>{cats} cats</div>
        </div>
      )}
    </div>
  );
}

const bar = {
  background: '#DC143C',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 20px',
  gap: 12,
  flexWrap: 'wrap',
  flexShrink: 0,
};

const title = {
  fontFamily: 'Calibri, Candara, Segoe, sans-serif',
  fontWeight: 700,
  fontSize: 22,
  color: '#fff',
  letterSpacing: '0.01em',
};

function pill() {
  return {
    background: 'rgba(255,255,255,0.2)',
    border: '1px solid rgba(255,255,255,0.4)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    padding: '3px 12px',
    borderRadius: 12,
  };
}
