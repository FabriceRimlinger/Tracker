// ----------------------------
// État global
// ----------------------------
let rawData = [];
let displayData = [];
let sortCol = 'montant';
let sortAsc = false;

let selectedCats = new Set();

let currentChartTab = 'evolution';
let chartEvolution = null, chartAllocation = null, chartPerf = null;

const COL_DEFS = [
  { key: 'compte',      label: 'Compte',         align: 'left',   width: 90,  sortable: true  },
  { key: 'libelle',     label: 'Libellé / ISIN',  align: 'left',   width: 260, sortable: true  },
  { key: 'parts',       label: 'Qté',             align: 'right',  width: 90,  sortable: true  },
  { key: 'liquidative', label: 'Cours',            align: 'right',  width: 95,  sortable: true  },
  { key: 'intradayP',   label: 'Intraday (J‑1)',  align: 'right',  width: 130, sortable: true  },
  { key: 'datevl',      label: 'Date VL',          align: 'center', width: 95,  sortable: true  },
  { key: 'pru',         label: 'PRU',              align: 'right',  width: 90,  sortable: true  },
  { key: 'pl',          label: '+/- Value',        align: 'right',  width: 120, sortable: true  },
  { key: 'montant',     label: 'Montant / %',      align: 'right',  width: 125, sortable: true  },
  { key: 'actions',     label: 'Actions',          align: 'center', width: 85,  sortable: false },
];

let colOrder  = loadColOrder();
let colWidths = loadColWidths();

function loadColOrder() {
  try {
    const s = JSON.parse(localStorage.getItem('colOrder'));
    if (s && s.length === COL_DEFS.length) return s;
  } catch {}
  return COL_DEFS.map((_, i) => i);
}
function saveColOrder() { localStorage.setItem('colOrder', JSON.stringify(colOrder)); }

function loadColWidths() {
  try {
    const s = JSON.parse(localStorage.getItem('colWidths'));
    if (s && s.length === COL_DEFS.length) return s;
  } catch {}
  return COL_DEFS.map(c => c.width);
}
function saveColWidths() { localStorage.setItem('colWidths', JSON.stringify(colWidths)); }

// ----------------------------
// Catégories dynamiques
// ----------------------------
const DEFAULT_CATS = [
  { name: 'CTO',    color: '#b97a00' },
  { name: 'PEA',    color: '#1f9d55' },
  { name: 'A. Vie', color: '#2563a6' },
];

function loadCategories() {
  try {
    const saved = JSON.parse(localStorage.getItem('categories'));
    if (Array.isArray(saved) && saved.length > 0) return saved;
  } catch {}
  localStorage.setItem('categories', JSON.stringify(DEFAULT_CATS));
  return DEFAULT_CATS;
}

let categories = loadCategories();
function saveCategories() { localStorage.setItem('categories', JSON.stringify(categories)); }
function getCatNames() { return categories.map(c => c.name); }
function findCat(name) { return categories.find(c => c.name === name); }

function selectAllCats() {
  selectedCats = new Set(categories.map(c => c.name));
}

function updateFilterLabel() {
  const all = categories.map(c => c.name);
  const sel = Array.from(selectedCats);
  document.getElementById('filter-label').innerText =
    (sel.length === all.length) ? '' : `— ${sel.join(', ')}`;
}

// ----------------------------
// Versements / frais
// ----------------------------
function loadVersements() {
  let v = null;
  try { v = JSON.parse(localStorage.getItem('versements')); } catch {}
  if (!v || typeof v !== 'object') v = {};
  categories.forEach(c => {
    if (!v[c.name]) v[c.name] = { versements: 0, frais: 0 };
  });
  return v;
}

let versements = loadVersements();

async function loadVersementsFromBackend() {
  try {
    const res = await fetch('/versements');
    if (!res.ok) return;
    const data = await res.json();
    if (data && typeof data === 'object' && Object.keys(data).length > 0) {
      Object.assign(versements, data);
      categories.forEach(c => {
        if (!versements[c.name]) versements[c.name] = { versements: 0, frais: 0 };
      });
    } else {
      await saveVersementsToBackend();
    }
  } catch (e) {
    console.warn('Versements backend inaccessible, localStorage utilisé:', e);
  }
}

async function saveVersementsToBackend() {
  try {
    await fetch('/versements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(versements)
    });
  } catch (e) {
    console.warn('Impossible de sauvegarder versements vers backend:', e);
  }
  localStorage.setItem('versements', JSON.stringify(versements));
}

function saveVersementsToStorage() {
  localStorage.setItem('versements', JSON.stringify(versements));
  saveVersementsToBackend();
}

// ----------------------------
// Format
// ----------------------------
function parseFRFloat(val) {
  if (val == null) return 0;
  const s = String(val).trim().replace(/\s+/g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

const fmt  = (n) => (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt0 = (n) => Math.round(n || 0).toLocaleString('fr-FR');
const fmt4 = (n) => (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
const signStr = (v) => v >= 0 ? '+' : '';

function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

// ----------------------------
// Modals (custom, sans Bootstrap)
// ----------------------------
function showModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = 'flex';
    lucide.createIcons();
  }
}

function hideModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

function handleOverlayClick(e, id) {
  if (e.target.id === id) hideModal(id);
}

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  ['editModal-overlay', 'versementsModal-overlay', 'categoriesModal-overlay'].forEach(id => {
    const el = document.getElementById(id);
    if (el && el.style.display !== 'none') hideModal(id);
  });
});

// ----------------------------
// Init
// ----------------------------
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.dataset.theme = savedTheme;
  updateThemeIcon(savedTheme);

  selectAllCats();
  renderFilters();
  renderCompteSelect();
  updateMarketCard();
  setInterval(updateMarketCard, 60000);
  initNotesCounter();
  loadData();
  loadVersementsFromBackend();

  lucide.createIcons();
});

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.innerHTML = `<i data-lucide="${theme === 'dark' ? 'sun' : 'moon'}" style="width:14px;height:14px;"></i>`;
}

function initNotesCounter() {
  const ta = document.getElementById('edit-notes');
  const cnt = document.getElementById('edit-notes-count');
  if (!ta || !cnt) return;
  const upd = () => { cnt.textContent = String((ta.value || '').length); };
  ta.addEventListener('input', upd);
  upd();
}

// ----------------------------
// Filtres dynamiques (multi)
// ----------------------------
function renderFilters() {
  const el = document.getElementById('filters');
  el.innerHTML = '';

  const allSelected = (selectedCats.size === categories.length);
  const allCount = rawData.length;

  const btnAll = document.createElement('button');
  btnAll.className = 'filter-pill' + (allSelected ? ' is-selected' : '');
  btnAll.innerHTML = `Tous <span class="pill-count">· ${allCount}</span>`;
  btnAll.onclick = () => { selectAllCats(); renderFilters(); applyFilterAndSort(); };
  el.appendChild(btnAll);

  categories.forEach(cat => {
    const b = document.createElement('button');
    const isSel = allSelected || selectedCats.has(cat.name);
    b.className = 'filter-pill' + (isSel ? ' is-selected' : '');
    const count = rawData.filter(p => p.compte === cat.name).length;
    b.innerHTML = `<span class="cat-dot" style="background:${escapeHtml(cat.color)};"></span>${escapeHtml(cat.name)}<span class="pill-count"> · ${count}</span>`;
    b.onclick = () => {
      const allSelectedNow = (selectedCats.size === categories.length);
      if (allSelectedNow) {
        selectedCats = new Set([cat.name]);
      } else {
        if (selectedCats.has(cat.name)) selectedCats.delete(cat.name);
        else selectedCats.add(cat.name);
        if (selectedCats.size === 0) selectAllCats();
      }
      renderFilters();
      applyFilterAndSort();
    };
    el.appendChild(b);
  });
}

// ----------------------------
// Select "Compte" dynamique
// ----------------------------
function renderCompteSelect(selected = null) {
  const sel = document.getElementById('edit-compte');
  sel.innerHTML = '';
  categories.forEach(c => {
    const o = document.createElement('option');
    o.value = c.name;
    o.textContent = c.name;
    sel.appendChild(o);
  });

  const o2 = document.createElement('option');
  o2.value = '__NEW__';
  o2.textContent = '+ Nouvelle catégorie…';
  sel.appendChild(o2);

  if (selected && getCatNames().includes(selected)) sel.value = selected;
  else sel.value = categories[0]?.name || '';

  sel.onchange = () => {
    if (sel.value === '__NEW__') {
      const name = prompt('Nom de la nouvelle catégorie ?');
      if (!name) { sel.value = categories[0]?.name || ''; return; }
      const clean = name.trim();
      if (!clean) { sel.value = categories[0]?.name || ''; return; }
      if (getCatNames().includes(clean)) { alert('Cette catégorie existe déjà.'); sel.value = clean; return; }

      categories.push({ name: clean, color: '#5e6ad2' });
      saveCategories();
      categories = loadCategories();
      versements = loadVersements();
      selectAllCats();
      renderFilters();
      renderCompteSelect(clean);
      applyFilterAndSort();
    }
  };
}

// ----------------------------
// Data load / save
// ----------------------------
async function loadData() {
  try {
    const res = await fetch('/data');
    if (!res.ok) throw new Error('Erreur réseau ' + res.status);
    rawData = await res.json();

    rawData.forEach((p, idx) => {
      p._id = idx;
      p.parts = parseFRFloat(p.parts);
      p.pru = parseFRFloat(p.pru);
      p.liquidative = parseFRFloat(p.liquidative);
      p.prevclose = parseFRFloat(p.prev_close ?? p.prevclose);
      p.datevl = p.date_vl || p.datevl || '-';
      p.notes = (p.notes || '').slice(0, 1000);

      p.montant = p.parts * p.liquidative;
      p.investi = p.parts * p.pru;
      p.pl = p.montant - p.investi;
      p.plP = p.investi > 0 ? (p.pl / p.investi) * 100 : 0;

      p.intraday = 0;
      p.intradayP = 0;
      if (p.prevclose > 0 && p.liquidative > 0) {
        p.intraday = p.liquidative - p.prevclose;
        p.intradayP = (p.intraday / p.prevclose) * 100;
      }
    });

    applyFilterAndSort();
    ensureChartJs(() => {
      if (currentChartTab === 'evolution') renderEvolutionChart();
      else if (currentChartTab === 'allocation') renderAllocationChart();
      else if (currentChartTab === 'perf') renderPerfChart();
    });
  } catch (e) {
    console.error(e);
    alert('Impossible de charger les données.\n\n' + e.message);
  }
}

async function saveData() {
  const toSave = rawData.map(p => ({
    compte: p.compte,
    isin: p.isin,
    libelle: p.libelle,
    parts: p.parts,
    pru: p.pru,
    notes: (p.notes || '').slice(0, 1000),
    liquidative: p.liquidative,
    prev_close: p.prevclose || 0,
    date_vl: p.datevl || '-'
  }));

  try {
    await fetch('/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toSave)
    });
    loadData();
  } catch (e) {
    alert('Erreur de sauvegarde !');
  }
}

async function updatePrices() {
  const btn = document.getElementById('btn-refresh');
  const content = document.getElementById('refresh-btn-content');
  btn.disabled = true;
  btn.classList.add('is-loading');
  content.innerHTML = '<i data-lucide="loader" style="width:14px;height:14px;" class="tk-spin"></i> Synchronisation…';
  lucide.createIcons();

  const readBodySmart = async (res) => {
    const text = await res.text();
    if (!text) return { data: null, text: '' };
    try { return { data: JSON.parse(text), text }; }
    catch { return { data: null, text }; }
  };

  try {
    const res = await fetch('/update_prices', { method: 'POST' });
    const { data, text } = await readBodySmart(res);
    const message =
      (data && typeof data === 'object' && data.message) ? data.message :
      (text ? text.slice(0, 300) : `HTTP ${res.status}`);

    if (!res.ok) throw new Error(message);

    if (data && data.status === 'success') {
      await loadData();
      updateMarketCard();
      alert(`Succès : ${data.count} prix mis à jour (${data.errors} erreurs).`);
    } else {
      alert('Erreur : ' + (message || 'inconnue'));
    }
  } catch (e) {
    alert('Erreur : ' + (e?.message || 'serveur.'));
  } finally {
    btn.disabled = false;
    btn.classList.remove('is-loading');
    content.innerHTML = '<i data-lucide="refresh-cw" style="width:14px;height:14px;"></i> Actualiser';
    lucide.createIcons();
  }
}

// ----------------------------
// Tri + filtre
// ----------------------------
function sortTable(col) {
  if (sortCol === col) sortAsc = !sortAsc;
  else {
    sortCol = col;
    sortAsc = ['montant','pl','parts','liquidative','intradayP'].includes(col) ? false : true;
  }
  applyFilterAndSort();
}

function applyFilterAndSort() {
  displayData = rawData.filter(p => selectedCats.has(p.compte));
  const totalValo = displayData.reduce((s, p) => s + p.montant, 0);
  displayData.forEach(p => p.poids = totalValo > 0 ? (p.montant / totalValo) * 100 : 0);

  displayData.sort((a, b) => {
    let vA = a[sortCol], vB = b[sortCol];
    if (typeof vA === 'string') {
      vA = (vA || '').toLowerCase(); vB = (vB || '').toLowerCase();
      return sortAsc ? vA.localeCompare(vB) : vB.localeCompare(vA);
    }
    return sortAsc ? (vA - vB) : (vB - vA);
  });

  updateFilterLabel();
  renderHeaders();
  render(totalValo);
  updateKpis();
}

// ----------------------------
// Marchés strip
// ----------------------------
async function updateMarketCard() {
  const strip = document.getElementById('markets-strip');
  const upd = document.getElementById('kpi-markets-updated');
  if (!strip) return;

  try {
    const res = await fetch('/markets?_=' + Date.now());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    strip.innerHTML = data.items.map(it => {
      if (it.value == null) {
        return `<div class="markets-cell">
          <div class="markets-lbl">${escapeHtml(it.label)}</div>
          <div class="markets-val" style="color:var(--text-dim);">—</div>
        </div>`;
      }
      const ch = it.change ?? 0;
      const chColor = ch >= 0 ? 'var(--success)' : 'var(--danger)';
      const chAbs = Math.abs(ch);
      const chStr = `${signStr(ch)}${fmt4(chAbs)}`;
      const pctStr = (it.changePct != null) ? ` (${signStr(it.changePct)}${fmt(Math.abs(it.changePct))}%)` : '';
      return `<div class="markets-cell">
        <div class="markets-lbl">${escapeHtml(it.label)}</div>
        <div class="markets-val">${fmt4(it.value)}</div>
        <div class="markets-chg" style="color:${chColor};">${chStr}${pctStr}</div>
      </div>`;
    }).join('');

    const stooqDate = data.updated ? ` · ${data.updated}` : '';
    upd.textContent = `Actualisé à ${timeStr}${stooqDate}`;
  } catch (e) {
    strip.innerHTML = `<div class="markets-cell" style="color:var(--danger);font-size:var(--fs-13);">Erreur de chargement marchés</div>`;
    upd.textContent = '';
  }
}

// ----------------------------
// En-têtes (resize + DnD)
// ----------------------------
function renderHeaders() {
  const orderedCols = colOrder.map(i => COL_DEFS[i]);

  const totRow = document.getElementById('totals-row');
  totRow.innerHTML = '';
  orderedCols.forEach((col, visIdx) => {
    const th = document.createElement('th');
    th.style.width = colWidths[colOrder[visIdx]] + 'px';
    th.id = `tot-${col.key}`;
    if (col.align === 'right') th.classList.add('num');
    else if (col.align === 'center') th.style.textAlign = 'center';
    totRow.appendChild(th);
  });

  const hdrRow = document.getElementById('header-row');
  hdrRow.innerHTML = '';
  orderedCols.forEach((col, visIdx) => {
    const th = document.createElement('th');
    th.style.width = colWidths[colOrder[visIdx]] + 'px';
    th.style.position = 'relative';
    th.dataset.visIdx = visIdx;

    if (col.align === 'right') th.style.textAlign = 'right';
    else if (col.align === 'center') th.style.textAlign = 'center';

    if (col.sortable) {
      th.classList.add('sortable');
      const sortIcon = sortCol === col.key
        ? `<i data-lucide="${sortAsc ? 'chevron-up' : 'chevron-down'}" style="width:11px;height:11px;margin-left:3px;vertical-align:-1px;"></i>`
        : '';
      th.innerHTML = `<span style="display:inline-flex;align-items:center;">${escapeHtml(col.label)}${sortIcon}</span>`;
      th.onclick = () => sortTable(col.key);
    } else {
      th.textContent = col.label;
    }

    const resizer = document.createElement('div');
    resizer.className = 'resizer';
    resizer.addEventListener('mousedown', (e) => startResize(e, colOrder[visIdx], th));
    th.appendChild(resizer);

    th.draggable = true;
    th.addEventListener('dragstart', onDragStart);
    th.addEventListener('dragover', onDragOver);
    th.addEventListener('drop', onDrop);
    th.addEventListener('dragend', onDragEnd);

    hdrRow.appendChild(th);
  });

  lucide.createIcons();
}

function render(totalValo) {
  const tbody = document.getElementById('table-body');
  tbody.innerHTML = '';

  let totPL = 0;
  const orderedCols = colOrder.map(i => COL_DEFS[i]);

  displayData.forEach(p => {
    totPL += p.pl;

    const posColor  = p.pl >= 0 ? 'var(--success)' : 'var(--danger)';
    const idayColor = p.intraday >= 0 ? 'var(--success)' : 'var(--danger)';
    const yahooUrl  = `https://finance.yahoo.com/quote/${encodeURIComponent(p.isin || '')}`;

    const cat = findCat(p.compte);
    const dotColor = cat ? escapeHtml(cat.color) : 'var(--text-dim)';

    const cellMap = {
      compte: `<span style="display:inline-flex;align-items:center;gap:6px;font-size:var(--fs-13);">
        <span class="cat-dot" style="background:${dotColor};"></span>${escapeHtml(p.compte)}
      </span>`,
      libelle: `<div style="font-weight:500;"><a href="${yahooUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(p.libelle)}</a></div>
        <div style="font-family:var(--font-mono);font-size:var(--fs-11);color:var(--text-dim);">${escapeHtml(p.isin || '')}</div>`,
      parts: `<span style="font-family:var(--font-mono);font-size:var(--fs-13);">${fmt4(p.parts)}</span>`,
      liquidative: `<span style="font-weight:500;font-variant-numeric:tabular-nums;">${fmt(p.liquidative)} €</span>`,
      intradayP: p.prevclose > 0
        ? `<div style="color:${idayColor};font-weight:500;font-size:var(--fs-13);font-variant-numeric:tabular-nums;">${signStr(p.intraday)}${fmt(p.intraday)} €</div>
           <div style="font-size:var(--fs-13);color:${idayColor};font-variant-numeric:tabular-nums;">${signStr(p.intradayP)}${fmt(p.intradayP)}%</div>`
        : `<span style="color:var(--text-dim);">—</span>`,
      datevl: `<span style="font-size:var(--fs-13);color:var(--text-muted);">${escapeHtml(p.datevl || '—')}</span>`,
      pru: `<span style="color:var(--text-muted);font-size:var(--fs-13);font-variant-numeric:tabular-nums;">${fmt(p.pru)} €</span>`,
      pl: `<div style="color:${posColor};font-weight:500;font-size:var(--fs-13);font-variant-numeric:tabular-nums;">${signStr(p.pl)}${fmt0(p.pl)} €</div>
           <div style="font-size:var(--fs-13);color:${posColor};font-variant-numeric:tabular-nums;">${signStr(p.plP)}${fmt(p.plP)}%</div>`,
      montant: `<div style="font-weight:500;font-variant-numeric:tabular-nums;">${fmt0(p.montant)} €</div>
                <div style="font-size:var(--fs-13);color:var(--text-muted);font-variant-numeric:tabular-nums;">${fmt(p.poids)}%</div>`,
      actions: `<span style="display:inline-flex;gap:2px;">
        <button class="tk-btn tk-btn--ghost tk-btn--sm" onclick="openModal(${p._id})" title="Éditer" style="padding:4px 6px;">
          <i data-lucide="pencil" style="width:13px;height:13px;"></i>
        </button>
        <button class="tk-btn tk-btn--ghost tk-btn--sm" onclick="deleteRow(${p._id})" title="Supprimer" style="padding:4px 6px;color:var(--danger);">
          <i data-lucide="trash-2" style="width:13px;height:13px;"></i>
        </button>
      </span>`
    };

    const tr = document.createElement('tr');
    orderedCols.forEach((col, visIdx) => {
      const td = document.createElement('td');
      td.style.width = colWidths[colOrder[visIdx]] + 'px';
      td.innerHTML = cellMap[col.key] || '';
      if (col.align === 'right') td.classList.add('num');
      else if (col.align === 'center') td.style.textAlign = 'center';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  const totalsMap = {
    compte:  `<span style="font-size:var(--fs-13);color:var(--text-muted);">Total</span>`,
    libelle: `<span style="font-size:var(--fs-13);color:var(--text-muted);">${displayData.length} lignes</span>`,
    pl:      `<div style="color:${totPL >= 0 ? 'var(--success)' : 'var(--danger)'};font-weight:600;font-size:var(--fs-13);font-variant-numeric:tabular-nums;">${signStr(totPL)}${fmt0(totPL)} €</div>`,
    montant: `<div style="font-weight:600;font-variant-numeric:tabular-nums;">${fmt0(totalValo)} €</div><div style="font-size:var(--fs-13);color:var(--text-muted);">100%</div>`,
    actions: ''
  };

  colOrder.map(i => COL_DEFS[i]).forEach(col => {
    const th = document.getElementById(`tot-${col.key}`);
    if (th) th.innerHTML = totalsMap[col.key] || '';
  });

  lucide.createIcons();
}

// ----------------------------
// KPIs
// ----------------------------
function computePerfForCat(catName) {
  const valo = rawData.filter(p => p.compte === catName).reduce((s, p) => s + p.montant, 0);
  const v = (versements[catName]?.versements || 0);
  const f = (versements[catName]?.frais || 0);
  const nets = v - f;
  const plAbs = valo - nets;
  const plPct = nets > 0 ? (plAbs / nets) * 100 : null;
  return { valo, versements: v, frais: f, nets, plAbs, plPct };
}

function updateKpis() {
  const selValo = displayData.reduce((s, p) => s + p.montant, 0);

  // Carte 1 : Valorisation totale
  document.getElementById('kpi-total').textContent = fmt0(selValo) + ' €';

  // Sous-ligne : delta jour (positions sélectionnées avec prevclose disponible)
  const dayDeltaAbs = displayData.reduce((s, p) => s + (p.prevclose > 0 ? p.parts * p.intraday : 0), 0);
  const dayDeltaPrev = displayData.reduce((s, p) => s + (p.prevclose > 0 ? p.parts * p.prevclose : 0), 0);
  const dayDeltaPct = dayDeltaPrev > 0 ? (dayDeltaAbs / dayDeltaPrev) * 100 : 0;
  const kpiDayEl = document.getElementById('kpi-day-delta');
  if (dayDeltaPrev > 0) {
    const c = dayDeltaAbs >= 0 ? 'var(--success)' : 'var(--danger)';
    kpiDayEl.innerHTML = `<span style="color:${c};">${signStr(dayDeltaAbs)}${fmt0(dayDeltaAbs)} € aujourd'hui</span>` +
      ` <span style="color:var(--text-muted);">(${dayDeltaPct >= 0 ? '+' : ''}${fmt(dayDeltaPct)}%)</span>`;
  } else {
    kpiDayEl.innerHTML = '';
  }

  // Carte 2 : +/- value latente (PRU)
  const totPL = displayData.reduce((s, p) => s + p.pl, 0);
  const totInvesti = displayData.reduce((s, p) => s + p.investi, 0);
  const pvPct = totInvesti > 0 ? (totPL / totInvesti) * 100 : 0;
  const pvColor = totPL >= 0 ? 'var(--success)' : 'var(--danger)';
  const kpiPvEl = document.getElementById('kpi-pv');
  kpiPvEl.textContent = (totPL >= 0 ? '+' : '') + fmt0(totPL) + ' €';
  kpiPvEl.style.color = pvColor;
  document.getElementById('kpi-pv-detail').innerHTML =
    `<span style="color:${pvColor};">${pvPct >= 0 ? '+' : ''}${fmt(pvPct)}%</span>` +
    ` vs. PRU · ${fmt0(totInvesti)} € investis`;

  // Carte 3 : Performance vs versements (toutes catégories)
  const allValo = rawData.reduce((s, p) => s + p.montant, 0);
  let totalNets = 0;
  categories.forEach(c => {
    totalNets += (versements[c.name]?.versements || 0) - (versements[c.name]?.frais || 0);
  });
  const totalPlAbs = allValo - totalNets;
  const totalPlPct = totalNets > 0 ? (totalPlAbs / totalNets) * 100 : null;
  const perfColor = totalPlAbs >= 0 ? 'var(--success)' : 'var(--danger)';
  const kpiPerfEl = document.getElementById('kpi-perf');
  if (totalPlPct !== null) {
    kpiPerfEl.textContent = (totalPlPct >= 0 ? '+' : '') + fmt(totalPlPct) + '%';
    kpiPerfEl.style.color = perfColor;
  } else {
    kpiPerfEl.textContent = '—';
    kpiPerfEl.style.color = 'var(--text)';
  }
  document.getElementById('kpi-versements-info').textContent =
    totalNets > 0 ? `Versements nets : ${fmt0(totalNets)} €` : 'Versements non renseignés';
}

// ----------------------------
// Modal Versements
// ----------------------------
function refreshVersementsTotals() {
  let tvTot = 0, tfTot = 0;
  categories.forEach(c => {
    tvTot += (versements[c.name]?.versements || 0);
    tfTot += (versements[c.name]?.frais || 0);
  });
  const tvEl = document.getElementById('v-total-versements');
  const tfEl = document.getElementById('v-total-frais');
  if (tvEl) tvEl.textContent = fmt0(tvTot) + ' €';
  if (tfEl) tfEl.textContent = fmt0(tfTot) + ' €';
}

function openVersementsModal() {
  const tbody = document.getElementById('versements-tbody');
  tbody.innerHTML = '';

  categories.forEach(c => {
    const cat = c.name;
    const v = (versements[cat]?.versements || 0);
    const f = (versements[cat]?.frais || 0);
    const sid = cat.replaceAll(' ', '-');

    tbody.innerHTML += `
      <tr>
        <td style="font-weight:500;">
          <span style="display:inline-flex;align-items:center;gap:8px;">
            <span class="cat-dot" style="background:${escapeHtml(c.color)};"></span>
            ${escapeHtml(cat)}
          </span>
        </td>
        <td style="padding:6px 12px;">
          <input type="number" class="tk-input" id="v-${escapeHtml(sid)}-versements" value="${v}"
            min="0" step="100"
            style="text-align:right;font-family:var(--font-mono);font-variant-numeric:tabular-nums;padding:6px 8px;"
            oninput="refreshVersementsRow('${escapeHtml(cat)}')">
        </td>
        <td style="padding:6px 12px;">
          <input type="number" class="tk-input" id="v-${escapeHtml(sid)}-frais" value="${f}"
            min="0" step="100"
            style="text-align:right;font-family:var(--font-mono);font-variant-numeric:tabular-nums;padding:6px 8px;"
            oninput="refreshVersementsRow('${escapeHtml(cat)}')">
        </td>
      </tr>`;
  });

  refreshVersementsTotals();
  showModal('versementsModal-overlay');
}
window.openVersementsModal = openVersementsModal;

window.refreshVersementsRow = function(catName) {
  const sid = catName.replaceAll(' ', '-');
  const v = parseFRFloat(document.getElementById(`v-${sid}-versements`)?.value || '0');
  const f = parseFRFloat(document.getElementById(`v-${sid}-frais`)?.value || '0');
  versements[catName] = { versements: v, frais: f };
  refreshVersementsTotals();
};

async function saveVersements() {
  categories.forEach(c => {
    const cat = c.name;
    const sid = cat.replaceAll(' ', '-');
    const v = parseFRFloat(document.getElementById(`v-${sid}-versements`)?.value || '0');
    const f = parseFRFloat(document.getElementById(`v-${sid}-frais`)?.value || '0');
    versements[cat] = { versements: v, frais: f };
  });
  await saveVersementsToBackend();
  hideModal('versementsModal-overlay');
  applyFilterAndSort();
}
window.saveVersements = saveVersements;

// ----------------------------
// Modal Catégories
// ----------------------------
function openCategoriesModal() {
  refreshCategoriesTable();
  showModal('categoriesModal-overlay');
}
window.openCategoriesModal = openCategoriesModal;

function refreshCategoriesTable() {
  const tbody = document.getElementById('cats-tbody');
  tbody.innerHTML = '';
  categories.forEach((c, idx) => {
    tbody.innerHTML += `
      <tr>
        <td style="font-weight:500;">
          <span style="display:inline-flex;align-items:center;gap:8px;">
            <span class="cat-dot" style="background:${escapeHtml(c.color)};"></span>
            ${escapeHtml(c.name)}
          </span>
        </td>
        <td>
          <input type="color" class="tk-input" style="height:32px;padding:2px 4px;cursor:pointer;width:80px;"
            value="${escapeHtml(c.color)}"
            onchange="updateCatColor(${idx}, this.value)">
        </td>
        <td style="text-align:right;">
          <button class="tk-btn tk-btn--ghost tk-btn--sm" onclick="deleteCategory(${idx})" title="Supprimer" style="padding:4px 6px;color:var(--danger);">
            <i data-lucide="trash-2" style="width:13px;height:13px;"></i>
          </button>
        </td>
      </tr>`;
  });
  lucide.createIcons();
}

function addCategory() {
  const name = (document.getElementById('new-cat-name').value || '').trim();
  const color = document.getElementById('new-cat-color').value || '#5e6ad2';
  if (!name) { alert('Nom de catégorie obligatoire.'); return; }
  if (getCatNames().includes(name)) { alert('Cette catégorie existe déjà.'); return; }

  categories.push({ name, color });
  saveCategories();
  categories = loadCategories();
  versements = loadVersements();
  selectAllCats();
  document.getElementById('new-cat-name').value = '';
  renderFilters();
  renderCompteSelect(name);
  refreshCategoriesTable();
  applyFilterAndSort();
}
window.addCategory = addCategory;

window.updateCatColor = function(idx, color) {
  categories[idx].color = color;
  saveCategories();
  categories = loadCategories();
  renderFilters();
  renderCompteSelect(document.getElementById('edit-compte')?.value);
  refreshCategoriesTable();
  applyFilterAndSort();
};

window.deleteCategory = function(idx) {
  const name = categories[idx].name;
  if (!confirm(`Supprimer la catégorie "${name}" ?`)) return;

  categories.splice(idx, 1);
  if (categories.length === 0) categories = [...DEFAULT_CATS];
  saveCategories();
  categories = loadCategories();
  versements = loadVersements();

  selectedCats.delete(name);
  if (selectedCats.size === 0) selectAllCats();

  renderFilters();
  renderCompteSelect();
  refreshCategoriesTable();
  applyFilterAndSort();
};

// ----------------------------
// Resize colonnes
// ----------------------------
let resizeData = null;
function startResize(e, colDefIdx, th) {
  e.preventDefault(); e.stopPropagation();
  resizeData = { colDefIdx, startX: e.clientX, startW: colWidths[colDefIdx] };
  document.addEventListener('mousemove', doResize);
  document.addEventListener('mouseup', stopResize);
  th.querySelector('.resizer').classList.add('resizing');
}
function doResize(e) {
  if (!resizeData) return;
  colWidths[resizeData.colDefIdx] = Math.max(50, resizeData.startW + (e.clientX - resizeData.startX));
  renderHeaders();
  render(displayData.reduce((s, p) => s + p.montant, 0));
}
function stopResize() {
  if (!resizeData) return;
  saveColWidths(); resizeData = null;
  document.removeEventListener('mousemove', doResize);
  document.removeEventListener('mouseup', stopResize);
}

// ----------------------------
// Drag&drop colonnes
// ----------------------------
let dragSrcVisIdx = null;
function onDragStart(e) {
  dragSrcVisIdx = parseInt(e.currentTarget.dataset.visIdx);
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}
function onDragOver(e) {
  e.preventDefault();
  document.querySelectorAll('#header-row th').forEach(th => th.classList.remove('drag-over'));
  e.currentTarget.classList.add('drag-over');
}
function onDrop(e) {
  e.preventDefault();
  const dropVisIdx = parseInt(e.currentTarget.dataset.visIdx);
  if (dragSrcVisIdx === null || dragSrcVisIdx === dropVisIdx) return;
  const moved = colOrder.splice(dragSrcVisIdx, 1)[0];
  colOrder.splice(dropVisIdx, 0, moved);
  saveColOrder();
  renderHeaders();
  render(displayData.reduce((s, p) => s + p.montant, 0));
}
function onDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  document.querySelectorAll('#header-row th').forEach(th => th.classList.remove('drag-over'));
  dragSrcVisIdx = null;
}

// ----------------------------
// Modal positions (CRUD)
// ----------------------------
function openModal(id = null) {
  const isEdit = id !== null;
  document.getElementById('modalTitle').innerText = isEdit ? 'Éditer la position' : 'Nouvelle position';
  document.getElementById('edit-index').value = isEdit ? id : -1;

  const toFRInput = (x) => {
    if (x === null || x === undefined || x === '') return '';
    if (x === 0) return '0';
    return String(x).replace('.', ',');
  };

  if (isEdit) {
    const item = rawData[id];
    renderCompteSelect(item.compte);
    document.getElementById('edit-isin').value = item.isin || '';
    document.getElementById('edit-libelle').value = item.libelle || '';
    const notesEl = document.getElementById('edit-notes');
    notesEl.value = (item.notes || '').slice(0, 1000);
    document.getElementById('edit-notes-count').textContent = String(notesEl.value.length);
    document.getElementById('edit-parts').value = toFRInput(item.parts);
    document.getElementById('edit-pru').value = toFRInput(item.pru);
    document.getElementById('edit-price').value = toFRInput(item.liquidative);
  } else {
    renderCompteSelect(categories[0]?.name || '');
    document.getElementById('edit-notes').value = '';
    document.getElementById('edit-notes-count').textContent = '0';
    document.getElementById('edit-isin').value = '';
    document.getElementById('edit-libelle').value = '';
    document.getElementById('edit-parts').value = '';
    document.getElementById('edit-pru').value = '';
    document.getElementById('edit-price').value = '';
  }

  showModal('editModal-overlay');
}
window.openModal = openModal;

function saveModal() {
  const id = parseInt(document.getElementById('edit-index').value);
  const compte = document.getElementById('edit-compte').value;
  const manualPrice = document.getElementById('edit-price').value;

  const newItem = {
    compte,
    isin: (document.getElementById('edit-isin').value || '').trim(),
    libelle: (document.getElementById('edit-libelle').value || '').trim(),
    parts: parseFRFloat(document.getElementById('edit-parts').value),
    pru: parseFRFloat(document.getElementById('edit-pru').value),
    notes: ((document.getElementById('edit-notes').value || '').trim()).slice(0, 1000)
  };

  if (id >= 0) {
    const old = rawData[id];
    newItem.liquidative = manualPrice ? parseFRFloat(manualPrice) : (old.liquidative || 0);
    newItem.prevclose = old.prevclose || 0;
    newItem.datevl = old.datevl || '-';
    newItem.prev_close = newItem.prevclose;
    newItem.date_vl = newItem.datevl;
    rawData[id] = { ...old, ...newItem };
  } else {
    newItem.liquidative = manualPrice ? parseFRFloat(manualPrice) : 0;
    newItem.prevclose = 0;
    newItem.datevl = '-';
    newItem.prev_close = 0;
    newItem.date_vl = '-';
    rawData.push(newItem);
  }

  saveData();
  hideModal('editModal-overlay');
}
window.saveModal = saveModal;

function deleteRow(id) {
  if (confirm('Supprimer cette ligne définitivement ?')) {
    rawData.splice(id, 1);
    saveData();
  }
}
window.deleteRow = deleteRow;

// ----------------------------
// Thème sombre/clair
// ----------------------------
function toggleTheme() {
  const isDark = document.documentElement.dataset.theme === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  document.documentElement.dataset.theme = newTheme;
  updateThemeIcon(newTheme);
  lucide.createIcons();
  localStorage.setItem('theme', newTheme);

  ensureChartJs(() => {
    if (currentChartTab === 'evolution') renderEvolutionChart();
    else if (currentChartTab === 'allocation') renderAllocationChart();
    else if (currentChartTab === 'perf') renderPerfChart();
  });
}
window.toggleTheme = toggleTheme;

function getChartThemeColors() {
  const s = getComputedStyle(document.documentElement);
  return {
    text:       s.getPropertyValue('--text').trim()        || '#0f0f14',
    muted:      s.getPropertyValue('--text-muted').trim()  || '#6b6b76',
    border:     s.getPropertyValue('--border').trim()      || '#e4e4e7',
    accent:     s.getPropertyValue('--accent').trim()      || '#5e6ad2',
    accentFade: s.getPropertyValue('--accent-fade').trim() || 'rgba(94,106,210,0.08)',
    success:    s.getPropertyValue('--success').trim()     || '#1f9d55',
    danger:     s.getPropertyValue('--danger').trim()      || '#c8312b',
    bg:         s.getPropertyValue('--bg').trim()          || '#ffffff',
  };
}

// ----------------------------
// Graphiques (Chart.js lazy)
// ----------------------------
function ensureChartJs(callback) {
  if (window.Chart) { callback(); return; }
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
  s.onload = callback;
  document.head.appendChild(s);
}

function switchChartTab(tab) {
  currentChartTab = tab;
  document.querySelectorAll('.chart-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.chart-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === `pane-${tab}`);
  });
  ensureChartJs(() => {
    if (tab === 'evolution') renderEvolutionChart();
    else if (tab === 'allocation') renderAllocationChart();
    else if (tab === 'perf') renderPerfChart();
  });
}

async function renderEvolutionChart() {
  const container = document.getElementById('chart-evolution-container');
  try {
    const res = await fetch('/history');
    const history = await res.json();
    const entries = Object.entries(history).sort((a, b) => a[0].localeCompare(b[0]));
    if (!entries.length) {
      container.innerHTML = `<div style="text-align:center;padding:48px 0;color:var(--text-dim);">
        <div style="font-size:var(--fs-13);">Pas encore de données historiques.</div>
        <div style="font-size:var(--fs-13);margin-top:4px;">Actualisez les prix pour démarrer le suivi.</div>
      </div>`;
      return;
    }
    container.innerHTML = `<canvas id="chart-evolution" style="height:320px;"></canvas>`;
    const labels = entries.map(e => e[0]);
    const totals = entries.map(e => e[1].total);
    if (chartEvolution) chartEvolution.destroy();
    const theme = getChartThemeColors();
    chartEvolution = new Chart(document.getElementById('chart-evolution'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Valorisation (€)',
          data: totals,
          borderColor: theme.accent,
          backgroundColor: theme.accentFade,
          fill: true,
          tension: 0.3,
          pointRadius: entries.length > 60 ? 0 : 3,
          borderWidth: 1.5,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: ctx => fmt0(ctx.parsed.y) + ' €' },
            titleColor: theme.text,
            bodyColor: theme.text,
            backgroundColor: 'rgba(15,15,20,0.92)'
          }
        },
        scales: {
          x: { ticks: { color: theme.muted, font: { size: 11 } }, grid: { color: theme.border } },
          y: { ticks: { color: theme.muted, callback: v => fmt0(v) + ' €', font: { size: 11 } }, grid: { color: theme.border } }
        }
      }
    });
  } catch (e) {
    container.innerHTML = `<div style="text-align:center;padding:32px;color:var(--danger);font-size:var(--fs-13);">Erreur chargement historique.</div>`;
  }
}

function renderAllocationChart() {
  const container = document.getElementById('chart-allocation-container');
  container.innerHTML = `<canvas id="chart-allocation" style="height:320px;"></canvas>`;
  const byCat = {};
  rawData.forEach(p => {
    if (p.montant > 0) byCat[p.compte] = (byCat[p.compte] || 0) + p.montant;
  });
  const cats = Object.keys(byCat).sort((a, b) => byCat[b] - byCat[a]);
  const total = cats.reduce((s, c) => s + byCat[c], 0);
  const colors = cats.map(n => { const c = findCat(n); return c ? c.color : '#6b6b76'; });
  if (chartAllocation) chartAllocation.destroy();
  const theme = getChartThemeColors();
  chartAllocation = new Chart(document.getElementById('chart-allocation'), {
    type: 'bar',
    data: {
      labels: ['Allocation'],
      datasets: cats.map((cat, i) => ({
        label: cat,
        data: [Math.round(byCat[cat])],
        backgroundColor: colors[i],
        borderWidth: 0
      }))
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { stacked: true, ticks: { color: theme.muted, callback: v => fmt0(v) + ' €', font: { size: 11 } }, grid: { color: theme.border } },
        y: { stacked: true, display: false, grid: { color: theme.border } }
      },
      plugins: {
        legend: { position: 'right', labels: { color: theme.text, font: { size: 12 } } },
        tooltip: {
          callbacks: {
            label: ctx => {
              const v = ctx.parsed.x;
              const pct = total > 0 ? (v / total * 100).toFixed(1) : 0;
              return `${ctx.dataset.label} : ${fmt0(v)} € (${pct}%)`;
            }
          },
          titleColor: theme.text,
          bodyColor: theme.text,
          backgroundColor: 'rgba(15,15,20,0.92)'
        }
      }
    }
  });
}

async function renderPerfChart() {
  try {
    const res = await fetch('/history');
    const history = await res.json();
    const entries = Object.entries(history).sort((a, b) => a[0].localeCompare(b[0]));
    if (!entries.length) {
      document.getElementById('chart-perf-container').innerHTML =
        `<div style="text-align:center;padding:48px 0;color:var(--text-dim);font-size:var(--fs-13);">Pas encore de données historiques.</div>`;
      return;
    }
    const labels = entries.map(e => e[0]);
    const totals = entries.map(e => e[1].total);
    const nets = entries.map(e => {
      const v = e[1].versements || {};
      return Object.values(v).reduce((s, cv) => s + (cv.versements || 0) - (cv.frais || 0), 0);
    });
    const pContainer = document.getElementById('chart-perf-container');
    pContainer.innerHTML = `<canvas id="chart-perf" style="height:320px;"></canvas>`;
    if (chartPerf) chartPerf.destroy();
    const theme = getChartThemeColors();
    chartPerf = new Chart(document.getElementById('chart-perf'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Valeur portefeuille',
            data: totals,
            borderColor: theme.success,
            backgroundColor: theme.success + '12',
            fill: true,
            tension: 0.3,
            borderWidth: 1.5,
          },
          {
            label: 'Versements nets',
            data: nets,
            borderColor: theme.danger,
            backgroundColor: theme.danger + '12',
            fill: true,
            tension: 0.3,
            borderWidth: 1.5,
            borderDash: [5, 3]
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: { label: ctx => `${ctx.dataset.label} : ${fmt0(ctx.parsed.y)} €` },
            titleColor: theme.text,
            bodyColor: theme.text,
            backgroundColor: 'rgba(15,15,20,0.92)'
          }
        },
        scales: {
          x: { ticks: { color: theme.muted, font: { size: 11 } }, grid: { color: theme.border } },
          y: { ticks: { color: theme.muted, callback: v => fmt0(v) + ' €', font: { size: 11 } }, grid: { color: theme.border } }
        }
      }
    });
  } catch (e) {
    console.error('Erreur graphique perf:', e);
  }
}
