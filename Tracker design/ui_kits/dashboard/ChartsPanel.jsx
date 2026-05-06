function ChartsPanel({ rows, categories }) {
  const [tab, setTab] = React.useState('evolution');

  const TabBtn = ({ id, children }) => (
    <button
      onClick={() => setTab(id)}
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        fontWeight: tab === id ? 600 : 500,
        color: tab === id ? 'var(--text)' : 'var(--text-muted)',
        background: 'transparent',
        border: 'none',
        borderBottom: tab === id ? '2px solid var(--accent)' : '2px solid transparent',
        padding: '10px 0',
        marginBottom: -1,
        cursor: 'pointer',
        transition: 'color 0.12s ease',
      }}
    >{children}</button>
  );

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 8,
      background: 'var(--bg-alt)',
    }}>
      <div style={{
        display: 'flex', gap: 24, padding: '0 20px',
        borderBottom: '1px solid var(--border)',
      }}>
        <TabBtn id="evolution">Évolution</TabBtn>
        <TabBtn id="allocation">Allocation</TabBtn>
        <TabBtn id="perf">Performance</TabBtn>
      </div>
      <div style={{ padding: 20 }}>
        {tab === 'evolution' && <EvolutionChart />}
        {tab === 'allocation' && <AllocationChart rows={rows} categories={categories} />}
        {tab === 'perf' && <PerfChart rows={rows} categories={categories} />}
      </div>
    </div>
  );
}

function EvolutionChart() {
  // 12 months synthetic
  const points = React.useMemo(() => {
    let v = 620000;
    const out = [];
    for (let i = 0; i < 36; i++) {
      v = v * (1 + (Math.sin(i / 4) * 0.012) + (Math.random() - 0.45) * 0.014);
      out.push(v);
    }
    return out;
  }, []);
  const min = Math.min(...points), max = Math.max(...points);
  const W = 1100, H = 220, pad = 8;
  const x = (i) => pad + (i / (points.length - 1)) * (W - pad * 2);
  const y = (v) => pad + (1 - (v - min) / (max - min)) * (H - pad * 2);
  const path = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const fill = `${path} L${x(points.length-1).toFixed(1)},${H-pad} L${x(0).toFixed(1)},${H-pad} Z`;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.005em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          {fmt0(points[points.length-1])}&nbsp;€
        </div>
        <div style={{ fontSize: 13, color: 'var(--success)', fontVariantNumeric: 'tabular-nums' }}>
          +{(((points[points.length-1]/points[0])-1)*100).toFixed(2)}%&nbsp;
          <span style={{ color: 'var(--text-muted)' }}>sur 36 mois</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 220, display: 'block' }}>
        <path d={fill} fill="var(--accent-fade)" />
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
        <span>2023-05</span><span>2024-05</span><span>2025-05</span><span>2026-05</span>
      </div>
    </div>
  );
}

function AllocationChart({ rows, categories }) {
  const totals = {};
  for (const r of rows) {
    const v = r.parts * r.liquidative;
    totals[r.compte] = (totals[r.compte] || 0) + v;
  }
  const grand = Object.values(totals).reduce((a, b) => a + b, 0);
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  // donut
  const R = 90, r = 60, cx = 110, cy = 110;
  let acc = 0;
  const arcs = entries.map(([name, v]) => {
    const cat = categories.find(c => c.name === name);
    const color = cat ? cat.color : 'var(--text-dim)';
    const start = acc / grand * Math.PI * 2 - Math.PI / 2;
    acc += v;
    const end = acc / grand * Math.PI * 2 - Math.PI / 2;
    const large = end - start > Math.PI ? 1 : 0;
    const x1 = cx + R * Math.cos(start), y1 = cy + R * Math.sin(start);
    const x2 = cx + R * Math.cos(end),   y2 = cy + R * Math.sin(end);
    const x3 = cx + r * Math.cos(end),   y3 = cy + r * Math.sin(end);
    const x4 = cx + r * Math.cos(start), y4 = cy + r * Math.sin(start);
    const d = `M${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${r},${r} 0 ${large} 0 ${x4},${y4} Z`;
    return { d, color, name, v };
  });

  return (
    <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
      <svg width="220" height="220" viewBox="0 0 220 220" style={{ flexShrink: 0 }}>
        {arcs.map((a, i) => <path key={i} d={a.d} fill={a.color} />)}
        <text x={cx} y={cy - 4} textAnchor="middle" style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fill: 'var(--text-muted)', fontWeight: 500 }}>Total</text>
        <text x={cx} y={cy + 16} textAnchor="middle" style={{ fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 600, fill: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
          {fmt0(grand)}&nbsp;€
        </text>
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {arcs.map((a, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '12px 1fr auto auto',
            gap: 10, alignItems: 'center',
            padding: '8px 0',
            borderBottom: i < arcs.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: a.color, justifySelf: 'center' }}></span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{a.name}</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
              {((a.v / grand) * 100).toFixed(1)}%
            </span>
            <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', minWidth: 100, textAlign: 'right' }}>
              {fmt0(a.v)}&nbsp;€
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PerfChart({ rows, categories }) {
  const byCat = {};
  for (const r of rows) {
    const cur = (r.parts * r.liquidative);
    const cost = (r.parts * r.pru);
    if (!byCat[r.compte]) byCat[r.compte] = { cur: 0, cost: 0 };
    byCat[r.compte].cur += cur;
    byCat[r.compte].cost += cost;
  }
  const entries = Object.entries(byCat).map(([name, v]) => {
    const pct = v.cost ? ((v.cur - v.cost) / v.cost) * 100 : 0;
    const cat = categories.find(c => c.name === name);
    return { name, pct, abs: v.cur - v.cost, color: cat ? cat.color : 'var(--text-dim)' };
  }).sort((a, b) => b.pct - a.pct);

  const maxAbs = Math.max(...entries.map(e => Math.abs(e.pct)), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {entries.map((e, i) => {
        const w = (Math.abs(e.pct) / maxAbs) * 50;
        const positive = e.pct >= 0;
        return (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr 110px',
            gap: 12, alignItems: 'center',
            fontSize: 13,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: e.color }}></span>
              <span style={{ fontWeight: 500 }}>{e.name}</span>
            </div>
            <div style={{ position: 'relative', height: 18, background: 'var(--surface)', borderRadius: 4 }}>
              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'var(--border-strong)' }}></div>
              <div style={{
                position: 'absolute',
                top: 2, bottom: 2,
                ...(positive
                  ? { left: '50%', width: `${w}%`, background: 'var(--success)' }
                  : { right: '50%', width: `${w}%`, background: 'var(--danger)' }),
                borderRadius: 2,
              }}></div>
            </div>
            <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: positive ? 'var(--success)' : 'var(--danger)', fontWeight: 500 }}>
              {signStr(e.pct)}{Math.abs(e.pct).toFixed(2)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

window.ChartsPanel = ChartsPanel;
