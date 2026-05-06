# Tracker Design System — Linear Editorial Minimalism

A design system for **Tracker** — a personal portfolio-management web app by Fabrice Rimlinger — repainted in the **Linear editorial-minimalist** direction. Every pixel earns its place. Late-90s Swiss graphic design meets modern SaaS: precise, fast, quietly confident.

## Source

- **Codebase**: [FabriceRimlinger/Tracker](https://github.com/FabriceRimlinger/Tracker) (`main`)
  - `portfolio_master.html` — the entire UI (Bootstrap 5.3 + Font Awesome, ~68 KB)
  - `manager.py` — `http.server` backend (`/data`, `/markets`, `/save`, `/update_prices`, `/versements`, `/history`)
  - `portfolio.json`, `versements.json`, `history.json` — JSON-on-disk persistence
- **Style direction**: `uploads/linear.md` — Linear editorial minimalism guide

## Product context

Single-user, locally-hosted French dashboard ("Mon Portefeuille") for net-worth tracking across heterogeneous accounts: CTO, PEA, Assurance Vie, AMZ RSU, cash livrets, Yomoni, real estate, real-estate crowdfunding (Lendosphère). Live prices via Yahoo / Stooq.

The user is an investor pro — terse French, comma-decimal, trailing €, dense table. The Linear direction reinforces that: pro-tool aesthetic, no marketing fluff, keyboard-first.

## Surfaces

One product surface — the desktop web dashboard. (Bootstrap responsive utilities give passable mobile, but the design target is wide-screen.)

## Index

```
README.md                      ← this file
SKILL.md                       ← agent skill manifest
colors_and_type.css            ← all design tokens (Inter + zinc + purple)
preview/                       ← cards rendered in the Design System tab
ui_kits/
  dashboard/                   ← UI kit recreating the portfolio dashboard
    index.html                 ← interactive recreation
    Header.jsx, KpiTrio.jsx, MarketsStrip.jsx,
    FilterPills.jsx, PositionsTable.jsx, EditPositionModal.jsx
    data.js                    ← sample positions + categories + markets
uploads/linear.md              ← style brief
```

---

## VISUAL FOUNDATIONS

### Atmosphere
Editorial minimalism. Surgical. Understated. Late-90s Swiss × modern SaaS. **Mood: precise, fast, quietly confident.**

### Color
- **Surfaces (light)** — `--bg #ffffff`, `--bg-alt #fafafa`, `--surface #f4f4f5`
- **Surfaces (dark)** — `--bg #0f0f14`, `--bg-alt #15151b`, `--surface #1a1a20`
- **Text** — `--text #0f0f14`, `--text-muted #6b6b76`, `--text-dim #a0a0ab`
- **Borders** — `--border #e4e4e7`, `--border-strong #d4d4d8` (hover)
- **Accent** — `#5e6ad2` (Linear purple). **Used only on**: primary action fill, link underline, focus ring. **Never on backgrounds.**
- **Semantic** — desaturated: success `#1f9d55`, danger `#c8312b`, warning `#b97a00`
- **Categories** — single muted hue per account (CTO `#b97a00`, PEA `#1f9d55`, A. Vie `#2563a6`, RSU `#8b5cf6`, Cash `#6b6b76`, Immo `#c8312b`, Crowd `#0e7490`). Used as 6px dots beside the category name. **No filled badges.**

### Type
- **Family** — `Inter` (Google Fonts), weight 400/500/600/700; mono `JetBrains Mono`.
- **Scale** — 11 / 13 / 14 / 16 / 18 / 22 / 28 / 36 / 48 / 64.
- **Default body** — 14px / 400 / line-height 1.5.
- **UI labels** — 13px / 500.
- **Headlines** — 600 weight with `letter-spacing: -0.005em` (`-0.5%`) at sizes ≥18.
- **No serif. No italics for emphasis — use weight 600.**
- **Numbers** always tabular (`font-variant-numeric: tabular-nums`). French locale, comma decimal, narrow-no-break-space thousands, trailing €. Big numbers drop cents.

### Layout & spacing
- **Container** — 1200px max, 24px gutter, 12-column.
- **Base unit** — 4px. Scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.
- **Density** — high. Information per pixel is the goal.

### Borders & radii
- **Radii** — `4px` (kbd, chips), `6px` (buttons, inputs), `8px` (cards). **Never beyond 8px.** Pill radius reserved for status dots only.
- **Borders** — 1px everywhere. Card hover = border darkens to `--border-strong`. No shadows on cards.

### Elevation
**Flat.** Border-based depth. Single shadow exists for popovers/dropdowns: `0 2px 8px rgba(0,0,0,0.04)`. Buttons and cards never get shadows.

### Backgrounds
**No imagery, no textures, no illustrations, no gradients on anything.** The only surface variation is the zinc neutral scale (bg → bg-alt → surface).

### Animation
Minimal. 120 ms ease transitions on `border-color`, `background`, `color`. No fades, no slides, no choreography. The refresh icon spins (`tk-spin`) while syncing. Buttons get no press-shrink — Linear is too poised for that.

### Hover & press states
- **Buttons** — `--accent-hover #4e5acb` (primary), border darkens (secondary), surface tint (ghost).
- **Cards** — border `#e4e4e7 → #d4d4d8`. No fill change, no lift.
- **Filter pills** — selected = dark border + 600 weight. Unselected = light border + 500 + muted text. **No filled state.**
- **Table rows** — `background: var(--surface)` on hover.
- **Inputs** — focus ring is a 2px white offset + 2px purple ring (`--accent-ring`).

### Transparency & blur
None. Modal scrim is a flat `rgba(15,15,20,0.40)`. No `backdrop-filter`.

### Layout rules
- Sticky table header (`position: sticky; top: 0`).
- KPIs in a 3-column grid, no media queries inside the kit (1200px target).
- Filter pills wrap horizontally.
- All keyboard hints surfaced via `<kbd>` (e.g. `⌘K`, `/`, `Esc`).

### Cards
Single variant: `--bg-alt` background, 1px `--border`, `8px` radius, `24px` padding. **No shadow ever.** Hover darkens border one step.

---

## CONTENT FUNDAMENTALS

**Language**: French (Metropolitan). The user voice is informal **tu** ("Astuce : tu peux créer une catégorie…"), terse and finance-pro.

**Tone**: precise, understated, no marketing. The Linear direction sharpens this further — **fewer words**, **more keyboard hints**, no exclamations, no filler.

**Casing**:
- Buttons & section titles: **Sentence case** ("Actualiser", "Ajouter", "Versements").
- Labels in cards: 11px / 500 muted ("Valorisation totale", "+/− value latente"). **No more ALL-CAPS labels** — that was the Bootstrap-era treatment; Linear avoids them.
- Tickers/ISINs: monospace, original case.

**Numbers** (unchanged from source):
- Currency: `1 234,56 €` (`fr-FR`, comma decimal, narrow no-break space, trailing €). Big numbers drop cents: `797 521 €`.
- Percentages: `+12,34%`, no space before %, sign always shown for deltas, ASCII `−` for negatives.
- Always tabular nums.

**Microcopy examples**:
- Buttons: `Actualiser`, `Catégories`, `Versements`, `Ajouter`, `Annuler`, `Enregistrer`.
- Empty/help: `Astuce : tu peux créer une catégorie via "Catégories".`
- Errors: blunt — `Cette catégorie existe déjà.`, `Impossible de charger les données.`

**Emoji**: only in *server-side* console logs (`🚀`, `📊`, `✅`, `❌`). **None in the UI.**

**Keyboard hints in copy**: surface them. Pair labels with `<kbd>` chips (`⌘K` for command palette, `/` for search, `Esc` to dismiss).

---

## ICONOGRAPHY

**System**: **[Lucide](https://lucide.dev)** — 16px stroke, weight 1.5, color inherits from text.

```html
<script src="https://unpkg.com/lucide@0.469.0/dist/umd/lucide.min.js"></script>
```

**Substitution flag**: the source repo uses **Font Awesome 6 Solid**. We swapped to **Lucide outline** because its stroke-based geometry is the canonical Linear-style icon set — flat, consistent, no fills. Tell us if you'd prefer to keep FA.

**Used icons (Lucide names)**:

| Source FA           | Lucide        | Usage                              |
|---------------------|---------------|------------------------------------|
| `fa-wallet`         | `wallet`      | (only in icon specimen — no logo)  |
| `fa-sync-alt`       | `refresh-cw`  | Actualiser                         |
| `fa-spinner`        | `loader`      | Sync in flight                     |
| `fa-chart-area/bar` | `bar-chart-3` | Graphiques                         |
| `fa-tags`           | `tags`        | Catégories                         |
| `fa-sliders-h`      | `sliders-horizontal` | Versements                  |
| `fa-plus`           | `plus`        | Ajouter                            |
| `fa-moon`/`fa-sun`  | `moon`/`sun`  | Theme toggle                       |
| `fa-edit`           | `pencil`      | Edit row                           |
| `fa-trash`          | `trash-2`     | Delete row                         |
| `fa-search`         | `search`      | Filter                             |
| `fa-times`          | `x`           | Close modal                        |
| `fa-sort`           | `chevron-up`/`chevron-down` | Sort indicator       |

**Conventions**:
- Always **before** the text label, separated by `gap: 8px` on the parent flex.
- Always 14px in buttons, 16px in standalone use.
- Color = `currentColor` (inherit).
- No emoji in UI.

---

## DO's & DON'Ts

**Do**
- Use Linear purple as **punctuation**, not paragraph.
- Keep UI density high — users are pros.
- Ship keyboard shortcuts. Surface them with `<kbd>`.
- Use weight 600 for emphasis. Tabular nums for any number.

**Don't**
- Round corners beyond 8px.
- Use drop shadows on cards or buttons.
- Introduce a second accent color.
- Apply gradients to anything (no more navy header band).
- Emoji in UI. Italics. Filled category badges.

---

## Caveats & open questions

- **Icons** — substituted Font Awesome → Lucide. Tell us if you want FA back.
- **Charts** — `portfolio_master.html` references Chart.js for Évolution / Allocation / Perf charts; the kit omits this panel. Want me to add it?
- **Logo** — Tracker has no logo. Wordmark "Mon Portefeuille" is the brand. We did not invent one.
- **Backend** — `manager.py` endpoints are documented but not reimplemented; the kit ships sample data inline.
- **Versements / Frais modal** — not yet recreated. Easy to add if useful.
