function FilterPills({ categories, rows, selected, onSelect }) {
  const counts = React.useMemo(() => {
    const c = { ALL: rows.length };
    for (const r of rows) c[r.compte] = (c[r.compte] || 0) + 1;
    return c;
  }, [rows]);

  const pillStyle = (active) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: 'var(--font-sans)',
    fontSize: 13,
    fontWeight: active ? 600 : 500,
    color: active ? 'var(--text)' : 'var(--text-muted)',
    background: 'var(--bg)',
    border: `1px solid ${active ? 'var(--text)' : 'var(--border)'}`,
    borderRadius: 6,
    padding: '6px 10px',
    cursor: 'pointer',
    lineHeight: 1,
    transition: 'border-color 0.12s ease, color 0.12s ease',
  });

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
      <button style={pillStyle(selected === 'ALL')} onClick={() => onSelect('ALL')}>
        Tous
        <span style={{ color: 'var(--text-dim)', fontWeight: 500 }}>·&nbsp;{counts.ALL}</span>
      </button>
      {categories.map(c => (
        <button key={c.name} style={pillStyle(selected === c.name)} onClick={() => onSelect(c.name)}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: c.color, display: 'inline-block' }}></span>
          {c.name}
          <span style={{ color: 'var(--text-dim)', fontWeight: 500 }}>·&nbsp;{counts[c.name] || 0}</span>
        </button>
      ))}
    </div>
  );
}

window.FilterPills = FilterPills;
