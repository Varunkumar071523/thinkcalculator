# Sprint 40 competitive audit — fincalculator.in SIP, Lumpsum, PPF calculators

Captured via Playwright (Chromium, 1440×900 viewport, full-page screenshots) on
2026-07-24. Pages are client-rendered; a `waitForFunction` gate on the
"Loading calculator" placeholder text was used before capture (SIP/PPF hit
this gate; Lumpsum's page never showed the string, so the script fell
through to a fixed 2s settle delay on all three). Screenshots:

- [`sip-calculator.png`](./sip-calculator.png)
- [`lumpsum-calculator.png`](./lumpsum-calculator.png)
- [`ppf-calculator.png`](./ppf-calculator.png)

Step-up SIP has no direct fincalculator.in equivalent (confirmed by
checking their Investment & Savings nav: SIP, Goal SIP, Step-Up SIP
Calculator, Lumpsum, Compounding, CAGR, SWP, Inflation, Simple Interest —
their "Step-Up SIP Calculator" link was not audited since the sprint scope
named only SIP/Lumpsum/PPF as in-scope competitors).

## Input layout pattern

- **SIP** breaks from the FD/RD pattern audited in Sprint 39: each input
  (Monthly Investment, Interest Rate, Number of Years) is a paired
  editable-number-field + slider, not slider-only — closer to our own
  `PairedNumberSliderInput` than what Sprint 39 found on FD/RD. A
  "max value" hint is printed below each slider instead of full min/max
  bounds.
- **Lumpsum and PPF** revert to the Sprint-39 slider-only pattern: current
  value shown as large bold text above the track, min/max bounds printed
  below, no editable number field. Same accessibility gap noted last
  sprint (no keyboard-precise text alternative).
- All three keep inputs in a single flat card with no section header, and
  on Lumpsum/PPF a large unused whitespace block below the three sliders
  (input card is much taller than its content).
- SIP page also has a frequency tab strip (Daily/Weekly/Monthly/Quarterly/
  Yearly) above the calculator — out of scope for us since our SIP is
  monthly-only by design, noted only for completeness.

## Chart type and placement

- **Donut**: consistent across all three — two-tone (grey/dark = invested,
  blue = interest or returns), with a `label / value` legend list beside it
  and a computed callout line ("Interest is 67.8% of final value" / "Interest
  is 44.7% of final value") that we don't currently render. SIP's version
  additionally colors returns gold/orange rather than blue and shows
  percentage labels directly on the donut slices.
- **Year-by-year table**: always visible (not collapsed) directly below the
  result row on all three, same as FD/RD in Sprint 39. Columns: Year,
  (Total) Contributed/Investment, Interest/Est. Returns earned, Value/Total
  Value. On Lumpsum this table redundantly repeats "Contributed = ₹0" every
  row after year 1 (a one-time investment has no further contributions),
  which reads as a display bug rather than a pattern worth adopting.
- **"Growth over time" chart**: filled line/area chart, two lines ("Total
  invested" and "Value with compounding") with the gap shaded — same family
  as our `GrowthLineChart`. PPF's rendered correctly in the capture;
  Lumpsum's rendered as an empty axes grid with no visible lines/fill in
  this capture (likely a lazy-render-on-scroll or animation-timing quirk
  on their end, not a pattern to evaluate either way). SIP's page has no
  equivalent line chart at all — it relies on the donut + table only.

## Result block structure

- Lumpsum and PPF: hero panel leads with the same **multiplier framing**
  Sprint 39 found on FD/RD — "YOUR MONEY BECOMES 3.1× / 1.8× of what you put
  in" — in large type on a purple/blue gradient card, with ₹ final value as
  a secondary line.
- SIP: no multiplier framing — hero is a plain white "Investment Summary"
  card with Invested Amount / Est. Returns / Total Value as three stacked
  line items plus the donut, no gradient treatment. Inconsistent with their
  own Lumpsum/PPF pattern.
- No worked-example section and no FAQ accordion on any of the three.
  Explanatory content ("About the Calculator", formula block, comparison
  tables, references) is static prose under permanently-open headings, not
  collapsible — same as Sprint 39's finding.
- Single result block on each page, no duplication.

## Worth adopting vs. explicitly avoiding

**Worth adopting (noted for a future, separately-scoped polish pass — no
code changed this sprint):**
- The "interest as % of final value" callout beside the donut — same note
  as Sprint 39, reconfirmed here across three more calculators.
- SIP's "Frequency Comparison" content block (advantages/limitations of
  daily vs weekly vs monthly vs quarterly vs yearly SIPs) is a genuinely
  useful, calculator-specific educational addition — a candidate for our
  own SIP page's collapsible educational content if not already covered.

**Explicitly avoid:**
- Slider-only input on Lumpsum/PPF with no paired number field — same
  regression flagged in Sprint 39; our `PairedNumberSliderInput` is already
  better on all four of our calculators (confirmed in verification step).
- The Lumpsum year-by-year table's "Contributed = ₹0" repeated row is a
  display bug from reusing a SIP-shaped table for a one-time investment —
  not something to replicate.
- Inconsistent hero treatment between SIP (plain) and Lumpsum/PPF
  (gradient multiplier card) on the same site — a UX inconsistency, not a
  pattern worth copying.

## Influence on this sprint

None of the above changed any code this sprint. Before writing any restyle
code, verification (git log + grep, see sprint report) confirmed SIP,
Step-up SIP, Lumpsum, and PPF were already migrated to
`PairedNumberSliderInput`, `CollapsibleSection`, and `GrowthLineChart` with
current design tokens in commits `aa028e0` ("Migrate SIP, Lumpsum, Step-up
SIP, CAGR, SWP to new design system (Batch 2)") and `1fee75d` ("Migrate
PPF, Inflation, Retirement Corpus to new design system (Batch 3)"), both
already ancestors of this branch's HEAD. So this sprint's scope narrowed
to running this audit only. The findings above (donut % callout, SIP
frequency-comparison content) are recorded for a future, separately-scoped
polish backlog item rather than acted on here.
