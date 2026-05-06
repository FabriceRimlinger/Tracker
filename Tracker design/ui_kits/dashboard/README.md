# Tracker — Dashboard UI Kit

A high-fidelity recreation of the **Mon Portefeuille** dashboard from `portfolio_master.html`.

## Surfaces covered
- Header band (navy gradient + actions)
- KPI trio (Valorisation / Marchés / Performance)
- Filter pills row
- Positions card (totals row + sortable header + zebra body)
- Edit-position modal (live opens from row actions)

## Components
- `Header.jsx` — gradient header with H1 + 6 action buttons
- `KpiTrio.jsx` — 3 cards (Valorisation Totale, Marchés intraday, Performance & PV latente)
- `FilterPills.jsx` — multi-select category filter
- `PositionsTable.jsx` — totals row + sortable header + body with badges, mono ISINs, +/- pills
- `EditPositionModal.jsx` — Bootstrap modal recreation
- `data.js` — sample positions extracted from `portfolio.json`

## Stack
React 18 (UMD) + Babel standalone, Bootstrap 5.3 CSS, Font Awesome 6.4. No build step.

Open `index.html`.
