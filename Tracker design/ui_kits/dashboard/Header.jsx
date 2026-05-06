function Header({ onRefresh, refreshing, dark, onToggleDark, onVersements }) {
  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg)',
      padding: '14px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: '-0.005em',
          color: 'var(--text)',
        }}>Mon Portefeuille</span>
        <span style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          fontWeight: 500,
          padding: '2px 8px',
          border: '1px solid var(--border)',
          borderRadius: 4,
        }}>v2.4</span>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          className="tk-btn tk-btn--ghost tk-btn--sm"
          onClick={onToggleDark}
          aria-label="Theme"
        >
          <i data-lucide={dark ? 'sun' : 'moon'} style={{ width: 14, height: 14 }}></i>
        </button>
        <button className="tk-btn tk-btn--secondary tk-btn--sm">
          <i data-lucide="tags" style={{ width: 14, height: 14 }}></i>
          Catégories
        </button>
        <button className="tk-btn tk-btn--secondary tk-btn--sm" onClick={onVersements}>
          <i data-lucide="sliders-horizontal" style={{ width: 14, height: 14 }}></i>
          Versements
        </button>
        <button
          className="tk-btn tk-btn--primary tk-btn--sm"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <i data-lucide={refreshing ? 'loader' : 'refresh-cw'}
             style={{ width: 14, height: 14, animation: refreshing ? 'tk-spin 0.9s linear infinite' : 'none' }}></i>
          {refreshing ? 'Synchronisation…' : 'Actualiser'}
        </button>
      </div>
    </header>
  );
}

window.Header = Header;
