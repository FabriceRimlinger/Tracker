function EditPositionModal({ row, onClose, onSave }) {
  const [draft, setDraft] = React.useState(row || { compte: 'CTO', isin: '', libelle: '', parts: 0, pru: 0, liquidative: 0, prev_close: 0 });
  if (!row) return null;

  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15,15,20,0.40)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: 24,
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 460,
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          padding: 0,
        }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            {draft.libelle ? 'Modifier la ligne' : 'Ajouter une valeur'}
          </div>
          <button className="tk-btn tk-btn--ghost tk-btn--sm" onClick={onClose} aria-label="Close">
            <i data-lucide="x" style={{ width: 14, height: 14 }}></i>
          </button>
        </div>

        <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Libellé" span={2}>
            <input className="tk-input" value={draft.libelle} onChange={e => set('libelle', e.target.value)} placeholder="ex. AIR LIQUIDE" />
          </Field>
          <Field label="Compte">
            <select className="tk-input" value={draft.compte} onChange={e => set('compte', e.target.value)}>
              <option>CTO</option><option>PEA</option><option>A. Vie</option><option>AMZ RSU</option>
            </select>
          </Field>
          <Field label="ISIN / Ticker">
            <input className="tk-input" value={draft.isin} onChange={e => set('isin', e.target.value)} placeholder="VIE.PA" />
          </Field>
          <Field label="Quantité">
            <input className="tk-input" type="number" step="0.0001" value={draft.parts} onChange={e => set('parts', +e.target.value)} />
          </Field>
          <Field label="PRU">
            <input className="tk-input" type="number" step="0.01" value={draft.pru} onChange={e => set('pru', +e.target.value)} />
          </Field>
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
          <button className="tk-btn tk-btn--primary tk-btn--sm" onClick={() => onSave(draft)}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, span }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: span ? `span ${span}` : 'auto' }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{label}</span>
      {children}
    </label>
  );
}

window.EditPositionModal = EditPositionModal;
