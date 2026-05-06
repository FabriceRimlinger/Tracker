function PositionsTable({ rows, categories, onEdit, onDelete }) {
  const [sortKey, setSortKey] = React.useState('montant');
  const [sortDir, setSortDir] = React.useState('desc');

  const colorOf = (compte) => {
    const c = categories.find(c => c.name === compte);
    return c ? c.color : 'var(--text-dim)';
  };

  const enriched = rows.map(r => {
    const montant = r.parts * r.liquidative;
    const pvAbs = (r.liquidative - r.pru) * r.parts;
    const pvPct = r.pru ? ((r.liquidative - r.pru) / r.pru) * 100 : 0;
    const dayPct = r.prev_close ? ((r.liquidative - r.prev_close) / r.prev_close) * 100 : 0;
    return { ...r, montant, pvAbs, pvPct, dayPct };
  });

  enriched.sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey];
    if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  const totalMontant = enriched.reduce((s, r) => s + r.montant, 0);
  const totalPv = enriched.reduce((s, r) => s + r.pvAbs, 0);

  const setSort = (k) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('desc'); }
  };

  const Th = ({ k, children, align }) => (
    <th
      onClick={() => setSort(k)}
      style={{
        textAlign: align || 'left',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {children}
        {sortKey === k && (
          <i data-lucide={sortDir === 'asc' ? 'chevron-up' : 'chevron-down'}
             style={{ width: 11, height: 11, color: 'var(--text)' }}></i>
        )}
      </span>
    </th>
  );

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 8,
      overflow: 'hidden',
      background: 'var(--bg)',
    }}>
      <table className="tk-table" style={{ width: '100%' }}>
        <thead>
          <tr>
            <Th k="libelle">Libellé</Th>
            <Th k="compte">Compte</Th>
            <Th k="parts" align="right">Qté</Th>
            <Th k="pru" align="right">PRU</Th>
            <Th k="liquidative" align="right">Cours</Th>
            <Th k="dayPct" align="right">Δ jour</Th>
            <Th k="pvPct" align="right">PV %</Th>
            <Th k="montant" align="right">Montant</Th>
            <th style={{ width: 64, textAlign: 'right' }}></th>
          </tr>
        </thead>
        <tbody>
          {enriched.map((r, i) => (
            <tr key={i}>
              <td>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontWeight: 500 }}>{r.libelle}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>{r.isin || '—'}</span>
                </div>
              </td>
              <td>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: colorOf(r.compte), display: 'inline-block' }}></span>
                  {r.compte}
                </span>
              </td>
              <td className="num" style={{ fontFamily: 'var(--font-mono)' }}>{fmt(r.parts)}</td>
              <td className="num" style={{ fontFamily: 'var(--font-mono)' }}>{fmt(r.pru)}</td>
              <td className="num" style={{ fontFamily: 'var(--font-mono)' }}>{fmt(r.liquidative)}</td>
              <td className="num" style={{ color: r.dayPct >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {signStr(r.dayPct)}{Math.abs(r.dayPct).toFixed(2)}%
              </td>
              <td className="num" style={{ color: r.pvPct >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {signStr(r.pvPct)}{Math.abs(r.pvPct).toFixed(2)}%
              </td>
              <td className="num" style={{ fontWeight: 500 }}>{fmt0(r.montant)}&nbsp;€</td>
              <td style={{ textAlign: 'right' }}>
                <span style={{ display: 'inline-flex', gap: 2 }}>
                  <button className="tk-btn tk-btn--ghost tk-btn--sm" onClick={() => onEdit(r)} aria-label="Edit">
                    <i data-lucide="pencil" style={{ width: 13, height: 13 }}></i>
                  </button>
                  <button className="tk-btn tk-btn--ghost tk-btn--sm" onClick={() => onDelete(r)} aria-label="Delete">
                    <i data-lucide="trash-2" style={{ width: 13, height: 13 }}></i>
                  </button>
                </span>
              </td>
            </tr>
          ))}
          <tr style={{ background: 'var(--surface)' }}>
            <td style={{ fontWeight: 600 }}>Total</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td className="num" style={{ fontWeight: 600, color: totalPv >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {signStr(totalPv)}{absFmt0(totalPv)}&nbsp;€
            </td>
            <td className="num" style={{ fontWeight: 600 }}>{fmt0(totalMontant)}&nbsp;€</td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

window.PositionsTable = PositionsTable;
