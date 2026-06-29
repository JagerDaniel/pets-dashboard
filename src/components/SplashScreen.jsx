const CRIMSON = '#901e1e';
const GREEN   = '#1D9E75';
const BEIGE   = '#f5f5dc';

export function SplashScreen({ onDismiss }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(30, 20, 20, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: BEIGE,
          border: `2px solid ${CRIMSON}`,
          borderRadius: 8,
          maxWidth: 520,
          width: '90%',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        }}
      >
        <div style={{ background: CRIMSON, padding: '16px 24px', borderRadius: '8px 8px 0 0' }}>
          <h1 style={{ color: '#fff', fontSize: 22, margin: 0 }}>
            Ellensburg Lost &amp; Found Pets
          </h1>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <h2 style={{ fontSize: 15, color: CRIMSON, margin: '0 0 8px' }}>How to use this dashboard</h2>
          <ul style={{ fontSize: 13.5, color: '#1e1e1e', lineHeight: 1.6, margin: '0 0 18px', paddingLeft: 20 }}>
            <li>Browse map markers or the card list on the left — each pin is the approximate area where a pet was lost or found.</li>
            <li>Use the filters to narrow by status, species, date range, or color.</li>
            <li>Click a marker, card, or photo to open the details panel with photos and a printable poster.</li>
            <li>Pins show a general area only (not an exact address) to protect privacy.</li>
          </ul>

          <div
            style={{
              background: '#fff',
              border: `1px solid ${CRIMSON}`,
              borderRadius: 6,
              padding: '12px 14px',
              fontSize: 12.5,
              color: '#444',
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: CRIMSON }}>Disclaimer:</strong> All reports on this dashboard are submitted
            directly by the public and have not been verified or reviewed for accuracy. Use your own judgment,
            and contact the Ellensburg Animal Shelter or Animal Control directly to confirm any details before
            acting on them.
          </div>

          <button
            onClick={onDismiss}
            style={{
              display: 'block',
              width: '100%',
              marginTop: 18,
              padding: '10px 0',
              background: GREEN,
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Got it — view the dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
