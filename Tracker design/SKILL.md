---
name: tracker-design
description: Use this skill to generate well-branded interfaces and assets for Tracker (a personal portfolio-management dashboard) in the Linear editorial-minimalist direction — Inter, zinc neutrals, single purple accent, 1px borders, no shadows, no gradients. For production code or throwaway prototypes/mocks/decks.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files (colors_and_type.css for tokens; preview/ for component specimens; ui_kits/dashboard/ for a full interactive recreation).

If creating visual artifacts (slides, mocks, throwaway prototypes), copy `colors_and_type.css` and the relevant `ui_kits/dashboard/*.jsx` components into your output directory and write static HTML that imports them. If working on production code, lift the tokens and patterns directly.

Hard rules from the Linear direction:
- Inter everywhere. JetBrains Mono for ISINs / numerics where helpful.
- One purple accent (`#5e6ad2`). Use it only on primary action fill, link underlines, focus rings. **Never on backgrounds.**
- 1px borders, never shadows on cards or buttons. Single popover shadow allowed.
- Radii: 4 / 6 / 8 max. Pills only for status dots.
- High density. Tabular nums on every number. French locale (`1 234,56 €`).
- No emoji, no italics, no gradients, no hero illustrations.
- Surface keyboard shortcuts with `<kbd>` styled chips.

If the user invokes this skill without other guidance, ask them what they want to build, ask a few targeted questions about scope/surface/data, and act as an expert designer who outputs HTML artifacts or production code, depending on the need.
