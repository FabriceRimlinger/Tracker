function KpiTrio({ rows }) {
  // total valuation
  const total = rows.reduce((s, r) => s + (r.parts * r.liquidative), 0);
  // intraday delta
  const dayPrev = rows.reduce((s, r) => s + (r.parts * r.prev_close), 0);
  const dayDelta = total - dayPrev;
  const dayPct = dayPrev ? (dayDelta / dayPrev) * 100 : 0;
  // PV latente vs PRU
  const cost = rows.reduce((s, r) => s + (r.parts * r.pru), 0);
  const pv = total - cost;
  const pvPct = cost ? (pv / cost) * 100 : 0;

  const cardStyle = {
    padding: 20,
    border: '1px solid var(--border)',
    borderRadius: 8,
    background: 'var(--bg-alt)',
    transition: 'border-color 0.12s ease',
  };
  const labelStyle = {
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--text-muted)',
    marginBottom: 10,
  };
  const numStyle = {
    fontSize: 36,
    fontWeight: 600,
    letterSpacing: '-0.005em',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1,
    color: 'var(--text)',
  };
  const subStyle = (positive) => ({
    marginTop: 10,
    fontSize: 13,
    fontVariantNumeric: 'tabular-nums',
    color: positive ? 'var(--success)' : 'var(--danger)',
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      <div style={cardStyle}>
        <div style={labelStyle}>Valorisation totale</div>
        <div style={numStyle}>{fmt0(total)}&nbsp;€</div>
        <div style={subStyle(dayDelta >= 0)}>
          {signStr(dayDelta)}{absFmt0(dayDelta)}&nbsp;€&nbsp;<span style={{color:'var(--text-muted)'}}>aujourd'hui ({signStr(dayPct)}{Math.abs(dayPct).toFixed(2)}%)</span>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>+/− value latente</div>
        <div style={{ ...numStyle, color: pv >= 0 ? 'var(--success)' : 'var(--danger)' }}>
          {signStr(pv)}{absFmt0(pv)}&nbsp;€
        </div>
        <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
          {signStr(pvPct)}{Math.abs(pvPct).toFixed(2)}% vs. PRU&nbsp;· {fmt0(cost)}&nbsp;€ investis
        </div>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>Lignes actives</div>
        <div style={numStyle}>{rows.length}</div>
        <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-muted)' }}>
          {new Set(rows.map(r => r.compte)).size} comptes&nbsp;· {new Set(rows.map(r => r.isin)).size} tickers
        </div>
      </div>
    </div>
  );
}

window.KpiTrio = KpiTrio;
