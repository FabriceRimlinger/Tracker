function MarketsStrip({ markets }) {
  return (
    <div style={{
      display: 'flex',
      gap: 0,
      border: '1px solid var(--border)',
      borderRadius: 8,
      overflow: 'hidden',
      background: 'var(--bg-alt)',
    }}>
      {markets.map((m, i) => {
        const positive = m.changePct >= 0;
        return (
          <div key={m.label} style={{
            flex: 1,
            padding: '14px 16px',
            borderLeft: i === 0 ? 'none' : '1px solid var(--border)',
          }}>
            <div style={{
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--text-muted)',
              marginBottom: 6,
            }}>{m.label}</div>
            <div style={{
              fontSize: 18,
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.005em',
              color: 'var(--text)',
              lineHeight: 1.1,
            }}>
              {m.value.toLocaleString('fr-FR', { minimumFractionDigits: m.value < 5 ? 4 : 1, maximumFractionDigits: m.value < 5 ? 4 : 1 })}
            </div>
            <div style={{
              marginTop: 4,
              fontSize: 12,
              fontVariantNumeric: 'tabular-nums',
              color: positive ? 'var(--success)' : 'var(--danger)',
            }}>
              {signStr(m.changePct)}{Math.abs(m.changePct).toFixed(2)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

window.MarketsStrip = MarketsStrip;
