export function PetCard({ pet, isActive, onClick }) {
  const occurStr = pet.occur
    ? pet.occur.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Unknown date';

  const isLost = (pet.findLost ?? '').toLowerCase() === 'lost';
  const isDog  = (pet.catDog ?? '').toLowerCase() === 'dog';

  const sizeOrAge = isDog ? (pet.dog_size ?? '—') : (pet.cat_age ?? '—');
  const colorList = pet.allColors?.length > 0 ? pet.allColors.join(', ') : '—';

  return (
    <div
      onClick={onClick}
      style={{
        padding: '14px 18px',
        borderBottom: '1px solid rgba(144,30,30,0.15)',
        cursor: 'pointer',
        background: isActive ? '#f0d8d8' : '#f5f5dc',
        borderLeft: isActive ? '4px solid #901e1e' : '4px solid transparent',
        transition: 'background 0.15s',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            padding: '3px 9px',
            borderRadius: 10,
            background: isLost ? 'rgba(144,30,30,0.12)' : 'rgba(29,158,117,0.12)',
            color: isLost ? '#901e1e' : '#0F7A57',
          }}>
            {isLost ? 'MISSING' : 'FOUND'}
          </span>
          {pet.isTest && (
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.06em',
              padding: '3px 9px',
              borderRadius: 10,
              background: 'rgba(90,90,90,0.1)',
              border: '1px dashed #999',
              color: '#666',
            }}>
              EXAMPLE
            </span>
          )}
          <span style={{ fontSize: 13, color: '#444' }}>
            {isDog ? '🐕' : '🐈'} {pet.catDog ?? '—'}
          </span>
        </div>
        <span style={{ fontSize: 12, color: '#777' }}>{occurStr}</span>
      </div>

      {/* Detail row */}
      <div style={{ display: 'flex', gap: 14, fontSize: 13, color: '#555' }}>
        <span style={{ textTransform: 'capitalize' }}>{sizeOrAge}</span>
        <span style={{ textTransform: 'capitalize' }}>{colorList}</span>
      </div>
    </div>
  );
}
