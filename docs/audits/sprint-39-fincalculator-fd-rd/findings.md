# Sprint 39 competitive audit — fincalculator.in FD & RD calculators

Captured via Playwright (Chromium, 1440×900 viewport, full-page screenshots) on
2026-07-24. Both pages are client-rendered SPAs; a `waitForFunction` gate on
the "Loading calculator..." placeholder text was used before capture, plus a
2s settle delay for chart animation. Screenshots:

- [`fd-calculator.png`](./fd-calculator.png)
- [`rd-calculator.png`](./rd-calculator.png)

## Input layout pattern

- Sliders only — each input (deposit amount, interest rate, time period) is a
  single native range slider with the current value shown as a large bold
  number above it and the min/max bounds printed below the track. There is
  **no separate editable number field** — the slider is the only way to set a
  precise value, so entering an exact off-slider figure (e.g. "₹1,23,456") is
  not possible without dragging to the nearest pixel.
- No preset/quick-amount chips, no unit toggle (RD tenure is years-only; FD
  has no month-vs-year switch).
- Left column is a single flat `Card`-equivalent with no section header
  ("Deposit details" etc.) — just the three sliders stacked with generous
  whitespace and a lot of unused vertical space below them.

## Chart type and placement

- **Donut**: two-tone only (grey = invested, blue = interest), placed
  directly right of the hero result card, with a `label / value` legend
  list beside it plus a computed callout line ("Interest is 29.3% of final
  value") that we don't currently render.
- **Year-by-year table**: always visible (not collapsed), directly below the
  result row. Columns: Year, Contributed, Total contributed, Interest
  earned, Value — for RD this makes the per-period contribution visible in
  its own column, which our schedule folds into "Yearly growth" instead.
- **"Growth over time" chart**: a filled **line/area chart** (two lines —
  "Total invested" and "Value with compounding" — with the gap between them
  shaded), not a stacked bar chart. It reads well for the smooth compounding
  curve but doesn't call out any single year's principal-vs-interest split
  the way a stacked bar does.

## Result block structure

- Hero panel leads with a **multiplier framing** — "YOUR MONEY BECOMES 1.4×
  of what you put in over 5 years" — in large type, with the ₹ final value
  as a secondary line beneath it, on a purple/blue gradient card.
- No worked-example section and no FAQ accordion. Explanatory content
  ("About the FD/RD Calculator", formula block, tax notes, references) is
  static prose under permanently-open `h2`/`h3` headings, not collapsible.
- Single result block, no duplication — consistent with our own constraint.

## Worth adopting vs. explicitly avoiding

**Worth adopting (noted for a future, separately-scoped polish pass — no
code changed this sprint):**
- The "interest as % of final value" callout next to the donut is a cheap,
  legible addition our donut summary lacks.
- The multiplier framing ("1.4× of what you put in") is a good at-a-glance
  hook that our maturity-amount-first hero card doesn't have.

**Explicitly avoid:**
- Slider-only input with no paired number field. Our
  `PairedNumberSliderInput` (number entry + slider kept in sync) is more
  precise and more accessible (keyboard-editable, screen-reader-labelled
  value) than a bare range input with no text alternative — this is a
  regression fincalculator.in has, not a pattern to copy.
- Collapsing nothing: with no accordion at all, their page is a long,
  undifferentiated scroll of always-rendered content. Our
  `CollapsibleSection` usage for the maturity schedule keeps the page
  shorter by default while still making the same content reachable.

## Influence on this sprint

None of the above changed any FD/RD code this sprint. Before writing
component code, we discovered FD and RD had already been migrated to the
four target components (`PairedNumberSliderInput`, `YearlyBarChart`,
`SimpleDonutChart` with `ringClass`, `CollapsibleSection`) in prior commits
`c3ff5c9` ("Migrate FD and RD calculators to new design system (Batch 1)")
and `2fe04fd` ("Roll out redesigned components to remaining 14
calculators"), both already ancestors of this branch's HEAD — confirmed by
reading `features/calculators/fd/fd-calculator.tsx` and
`features/calculators/rd/rd-calculator.tsx` directly. So this sprint's
scope narrowed, by user decision, to running this audit only. The findings
above are recorded for whoever picks up the separately-scoped polish
backlog item (interest-% callout, multiplier framing) rather than acted on
here.
