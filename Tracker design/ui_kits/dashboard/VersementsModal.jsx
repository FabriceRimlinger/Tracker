function VersementsModal({ onClose }) {
  const seed = [
    { compte: 'CTO',     versements: 48300,  frais: 0 },
    { compte: 'PEA',     versements: 77800,  frais: 0 },
    { compte: 'A. Vie',  versements: 94920,  frais: 0 },
    { compte: 'AMZ RSU', versements: 452831, frais: 0 },
    { compte: 'Yomoni',  versements: 73800,  frais: 0 },
    { compte: 'Bourso Epargne', versements: 103000, frais: 0 },
    { compte: 'Crowdfunding immo', versements: 35000, frais: 0 },
    { compte: 'Lendosphère', versements: 13036, frais: 0 },
    { compte: 'Linxéa A Vie', versements: 50500, frais: 0 },
    { compte: 'Immobilier', versements: 675000, frais: 0 },
  ];
  const [rows, setRows] = React.useState(seed);

  const setRow = (i, k, v) => setRows(r => {
    const c = r.slice(); c[i] = { ...c[i], [k]: v }; return c;
  });

  const totalV = rows.reduce((s, r) => s + (+r.versements || 0), 0);
  const totalF = rows.reduce((s, r) => s + (+r.frais || 0), 0);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15,15,20,0.40)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: 24,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 640, maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Versements & frais</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Cumul net par compte. Sert au calcul de la performance.
            </div>
          </div>
          <button className="tk-btn tk-btn--ghost tk-btn--sm" onClick={onClose} aria-label="Fermer">
            <i data-lucide="x" style={{ width: 14, height: 14 }}></i>
          </button>
        </div>

        <div style={{ overflow: 'auto', flex: 1 }}>
          <table className="tk-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Compte</th>
                <th style={{ textAlign: 'right' }}>Versements&nbsp;(€)</th>
                <th style={{ textAlign: 'right' }}>Frais&nbsp;(€)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{r.compte}</td>
                  <td style={{ padding: '6px 12px' }}>
                    <input
                      className="tk-input"
                      type="number"
                      value={r.versements}
                      onChange={e => setRow(i, 'versements', e.target.value)}
                      style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', padding: '6px 8px' }}
                    />
                  </td>
                  <td style={{ padding: '6px 12px' }}>
                    <input
                      className="tk-input"
                      type="number"
                      value={r.frais}
                      onChange={e => setRow(i, 'frais', e.target.value)}
                      style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', padding: '6px 8px' }}
                    />
                  </td>
                </tr>
              ))}
              <tr style={{ background: 'var(--surface)' }}>
                <td style={{ fontWeight: 600 }}>Total</td>
                <td className="num" style={{ fontWeight: 600 }}>{fmt0(totalV)}&nbsp;€</td>
                <td className="num" style={{ fontWeight: 600 }}>{fmt0(totalF)}&nbsp;€</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'flex-end', gap: 8,
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 11, color: 'var(--text-dim)', marginRight: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span className="tk-kbd">Esc</span> pour fermer
          </span>
          <button className="tk-btn tk-btn--secondary tk-btn--sm" onClick={onClose}>Annuler</button>
          <button className="tk-btn tk-btn--primary tk-btn--sm" onClick={onClose}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

window.VersementsModal = VersementsModal;
