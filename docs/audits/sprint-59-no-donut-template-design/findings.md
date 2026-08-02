# Sprint 59: No-donut above-the-fold template investigation and design

Investigation and design only. No component, page, calculation, or shared
file was modified. See "Confirmation of no source changes" at the end of
this report.

Pilot calculator: CAGR. Also checked against EPS Pension per the site
owner's request to fold it into this investigation. Gratuity, HRA, Income
Tax, Inflation, and EPF were spot-checked only for the generalization note
in section 4 — not designed.

## 1. CAGR's current above-the-fold result display

`features/calculators/cagr/cagr-calculator.tsx:210-236`:

```tsx
<Card className="bg-gradient-to-b from-cat-invest-soft to-card to-55%" data-testid="calculator-result-card" data-print-summary aria-live="polite">
  <CardContent>
    <div className="border-b border-line pb-5 text-center">
      <p className="mb-1.5 text-[13px] text-muted-foreground">Compound annual growth rate</p>
      <p className="font-mono text-[42px] leading-none font-bold text-cat-invest">{formatCAGRPercentageForDisplay(result.cagrPercentage)}</p>
      <p className="mt-2 text-[12.5px] text-muted-foreground">from {formatIndianCurrency(liveInput.beginningValue)} to {formatIndianCurrency(liveInput.endingValue)} over {formatIndianNumber(liveInput.investmentPeriodYears)} years</p>
    </div>

    <div className="mt-5 grid grid-cols-2 gap-3">
      <div className="rounded-lg border border-line bg-card p-3.5">
        <p className="mb-1 text-xs text-muted-foreground">{gainLossLabel}</p>
        <p className="font-mono text-lg font-semibold">{formatIndianCurrency(normaliseCAGRDisplayZero(result.absoluteGainLoss))}</p>
      </div>
      <div className="rounded-lg border border-line bg-card p-3.5">
        <p className="mb-1 text-xs text-muted-foreground">Total return</p>
        <p className="font-mono text-lg font-semibold">{formatPercentage(normaliseCAGRDisplayZero(result.totalReturnPercentage))}</p>
      </div>
      <div className="rounded-lg border border-line bg-card p-3.5 col-span-2">
        <p className="mb-1 text-xs text-muted-foreground">Growth multiple</p>
        <p className="font-mono text-lg font-semibold">{formatIndianNumber(normaliseCAGRDisplayZero(result.growthMultiple))}×</p>
      </div>
    </div>

    <div className="mt-5">
      <CalculatorActions resultText={resultText} shareUrl={shareUrl} calculatorType="cagr" category="investments" />
    </div>
  </CardContent>
</Card>
```

**What's shown above the fold, no chart at all**:

| Data point | Role |
|---|---|
| CAGR percentage (`formatCAGRPercentageForDisplay(result.cagrPercentage)`) | primary headline figure |
| Subtitle — beginning value, ending value, years | context for the headline |
| Absolute gain/loss (label swaps between "Absolute gain"/"Absolute loss") | stat card 1 |
| Total return % | stat card 2 |
| Growth multiple (e.g. "2.5×") | stat card 3, spans both columns |

Below the fold, a separate card (`cagr-calculator.tsx:240-251`) repeats
beginning/ending value as a plain `<dl>`:

```tsx
<div className="mt-6">
  <Card>
    <CardHeader><CardTitle className="text-lg">Beginning versus ending value</CardTitle></CardHeader>
    <CardContent>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-muted/30 p-4"><dt className="text-sm text-muted-foreground">Beginning value</dt><dd className="mt-1 break-words text-xl font-semibold">{formatIndianCurrency(result.beginningValue)}</dd></div>
        <div className="rounded-lg border bg-muted/30 p-4"><dt className="text-sm text-muted-foreground">Ending value</dt><dd className="mt-1 break-words text-xl font-semibold">{formatIndianCurrency(result.endingValue)}</dd></div>
      </dl>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">This comparison shows only the endpoints. CAGR smooths the change and does not show the actual path between them.</p>
    </CardContent>
  </Card>
</div>
```

There is no chart anywhere on the page — CAGR has no `SimpleDonutChart`,
`GrowthLineChart`, `YearlyBarChart`, or any other import from
`components/calculators/*chart*` (confirmed by reading the full file's
import list, `cagr-calculator.tsx:1-17`).

**Conditional/branching result states**: grepped `cagr-calculator.tsx` for
ternaries and ` ? ` in the result JSX — the only branch is
`getCAGRGainLossLabel` (`:72-74`), which swaps the *label word* ("Absolute
gain" vs "Absolute loss") based on sign, not the layout shape. The headline
figure, subtitle, and stat-card grid render unconditionally, one fixed
structure. **CAGR is a single fixed output, not a branching one** — unlike
EPS Pension (section 2) or SWP.

## 2. EPS Pension's current state post-Sprint-58

`features/calculators/eps-pension/eps-pension-calculator.tsx:151-194`:

```tsx
<Card className="bg-gradient-to-b from-cat-savings-soft to-card to-55%" data-testid="calculator-result-card" data-print-summary aria-live="polite">
  <CardContent>
    {result.isEligible ? (
      <div className="border-b border-line pb-5 text-center">
        <p className="mb-1.5 text-[13px] text-muted-foreground">{isEarly ? `Monthly pension from age ${result.earlyPensionAge}` : "Monthly pension"}</p>
        <p className="font-mono text-[42px] leading-none font-bold text-cat-savings">{formatIndianCurrency(result.monthlyPension)}</p>
        <p className="mt-2 text-[12.5px] text-muted-foreground">
          {isEarly
            ? `Standard-age pension ${formatIndianCurrency(result.standardMonthlyPension)}, reduced ${formatIndianNumber(result.earlyPensionReductionPercent)}%`
            : result.isFloorBinding
              ? `Minimum-pension floor applied — formula alone gave ${formatIndianCurrency(result.formulaPension)}`
              : "Based on the EPS 2026 formula"}
        </p>
      </div>
    ) : (
      <div className="border-b border-line pb-5 text-center">
        <p className="mb-1.5 text-[13px] text-muted-foreground">Monthly pension</p>
        <p className="font-mono text-[42px] leading-none font-bold text-destructive">Not eligible</p>
        <p className="mt-2 text-[12.5px] text-muted-foreground">{`${formatIndianNumber(liveInput.yearsOfPensionableService)} years is short of the ${EPS_PENSION_MIN_ELIGIBLE_SERVICE_YEARS}-year minimum for a monthly EPS pension.`}</p>
      </div>
    )}

    <div className="mt-5 grid grid-cols-2 gap-3">
      <div className="rounded-lg border border-line bg-card p-3.5">
        <p className="mb-1 text-xs text-muted-foreground">Pensionable salary used</p>
        <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.pensionableSalaryUsed)}</p>
        {result.isWageCeilingBinding ? <p className="mt-1 text-xs text-muted-foreground">Capped from {formatIndianCurrency(liveInput.averageMonthlySalary)}</p> : null}
      </div>
      <div className="rounded-lg border border-line bg-card p-3.5">
        <p className="mb-1 text-xs text-muted-foreground">Pensionable service used</p>
        <p className="font-mono text-lg font-semibold">{formatIndianNumber(result.pensionableServiceUsed)} years</p>
        {result.bonusYearsApplied ? <p className="mt-1 text-xs text-muted-foreground">Includes {EPS_PENSION_BONUS_SERVICE_THRESHOLD_YEARS}-year bonus</p> : null}
      </div>
      <div className="col-span-2 rounded-lg border border-line bg-card p-3.5">
        <p className="mb-1 text-xs text-muted-foreground">Standard-age pension (age {EPS_PENSION_STANDARD_RETIREMENT_AGE})</p>
        <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.standardMonthlyPension)}</p>
      </div>
    </div>

    <div className="mt-5">
      <CalculatorActions resultText={resultText} shareUrl={shareUrl} calculatorType="eps-pension" category="savings" />
    </div>
  </CardContent>
</Card>
```

No `SimpleDonutChart` import, confirmed the same way as CAGR (import list at
`eps-pension-calculator.tsx:1-28` has none). What's already established, per
DECISIONS.md #58 (Sprint 58) and unchanged since:

- **4 subtitle states total**, across two top-level branches:
  `isEligible === true` → (1) `isEarly`, (2) `!isEarly && isFloorBinding`,
  (3) `!isEarly && !isFloorBinding`; plus (4) `isEligible === false`.
- The `border-b border-line pb-5 text-center` label→value→subtitle 3-line
  shape is byte-identical in both `isEligible` branches — it's the SWP/
  Retirement Corpus computed-variable pattern's *shape*, just not its
  *implementation*: SWP/Retirement Corpus compute `primaryLabel`/
  `primaryValue`/`subtitle` once and render one JSX block, but EPS
  Pension's `isEligible` ternary duplicates the whole card-markup `<div>`
  across both branches rather than computing one set of variables. DECISIONS.md
  #58 logged this explicitly as an **open backlog item, not touched here**:
  "A future cleanup could collapse this to the SWP/RC computed-variable
  pattern; not done here since it's a pure refactor with no behavior or
  headline-state change, outside this sprint's scope." This sprint doesn't
  touch it either — it's orthogonal to the no-donut chart question below.
- Page-chrome spacing (`app/finance/eps-pension-calculator/page.tsx`) was
  already fixed to match the other migrated calculators in Sprint 58.

## 3. The existing donut-based template as reference baseline

The shared pieces: `SimpleDonutChart`
(`components/calculators/simple-donut-chart.tsx`) for the ring+legend, and a
per-calculator-duplicated JSX shape for the header chrome and stat panel —
**there is no shared "result card" or "header chrome" React component**.
Confirmed by listing every file under `components/calculators/`: 14 files,
none named anything like `result-card`, `result-panel`, or `header-chrome`.
The "template" DECISIONS.md #38-#41 describe is a hand-copied convention
across calculator files (`emi-calculator.tsx`, `sip-calculator.tsx`, etc.),
not a shared abstraction — each rollout batch was a find-and-replace-by-hand
exercise across files, which is exactly why DECISIONS.md's own entries stress
per-batch structural audits before touching each calculator.

Representative excerpt, SIP (`features/calculators/sip/sip-calculator.tsx:233-267`):

```tsx
<Card className="bg-gradient-to-b from-cat-invest-soft to-card to-55%" data-testid="calculator-result-card" data-print-summary aria-live="polite">
  <CardContent>
    <div className="border-b border-line pb-5 text-center">
      <p className="mb-1.5 text-[13px] text-muted-foreground">Estimated future value over {liveInput.duration} {liveInput.durationUnit} at {liveInput.annualReturnRate.toFixed(2)}% p.a.</p>
      <p className="font-mono text-[42px] leading-none font-bold text-cat-invest">{formatIndianCurrency(result.futureValue)}</p>
    </div>

    <div className="mt-5 border-t border-line pt-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <SimpleDonutChart
          title="Invested vs returns"
          items={[
            { label: "Invested", value: result.totalInvested, formattedValue: formatIndianCurrency(result.totalInvested), colorClass: "bg-cat-invest", ringClass: "stroke-cat-invest" },
            { label: "Returns", value: result.estimatedReturns, formattedValue: formatIndianCurrency(result.estimatedReturns), colorClass: "bg-gold", ringClass: "stroke-gold" },
          ]}
          showInlineLabels
        />
        <dl className="flex shrink-0 flex-row gap-6 sm:flex-col sm:gap-3">
          <div>
            <dt className="text-xs text-muted-foreground">Total invested</dt>
            <dd className="font-mono text-lg font-semibold">{formatIndianCurrency(result.totalInvested)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Estimated returns</dt>
            <dd className="font-mono text-lg font-semibold">{formatIndianCurrency(result.estimatedReturns)}</dd>
          </div>
        </dl>
      </div>
    </div>

    <div className="mt-5">
      <CalculatorActions resultText={resultText} shareUrl={shareUrl} calculatorType="sip" category="investments" />
    </div>
  </CardContent>
</Card>
```

The donut-based template's fixed shape, per DECISIONS.md #38-#41 and
confirmed by re-reading the code directly:

1. Header chrome: single label → `text-[42px]` headline figure, folded
   subtitle into the label line for non-branching calculators (SIP/FD/RD/
   Lumpsum/EMI/PPF/NPS/Step-up SIP/Home Loan Eligibility), or the
   3-line label→value→subtitle block for branching ones (SWP, Retirement
   Corpus, EPS Pension).
2. `SimpleDonutChart` (`showInlineLabels`) beside a small `<dl>` of the same
   two (or three) figures the donut plots — the donut and the `<dl>` show
   the *same* numbers, redundantly, by design (donut for proportion, `<dl>`
   for exact value).
3. `CalculatorActions` (copy/share) below.

`SimpleDonutChart`'s own prop type (`simple-donut-chart.tsx:57-65`) requires
`items` to be exactly a 2-tuple or 3-tuple of `{label, value, formattedValue,
colorClass}` — i.e. it is fundamentally a **part-to-whole** visual: the
items must be parts that sum to a meaningful total (invested+returns=future
value; contributions+growth=corpus). This constraint is the crux of why it
doesn't fit CAGR (section 4).

## 4. Design options for a no-donut above-the-fold template

### 4.0 What CAGR's and the sibling calculators' data actually looks like

CAGR has **no part-to-whole pair**. Its four displayed figures
(`cagrPercentage`, `absoluteGainLoss`, `totalReturnPercentage`,
`growthMultiple`) are all *derived scalars* computed from the same two
inputs (`beginningValue`, `endingValue`) — none of them are two parts that
sum to a third displayed total the way "invested + returns = future value"
does. `beginningValue` and `endingValue` are the one pair with a natural
visual relationship, but it's a **before/after comparison**, not a
part-to-whole split (`endingValue` does not equal `beginningValue` plus
some second labelled quantity that sums cleanly for a donut ring — it's
`beginningValue × (1 + cagr)^years`, and the visual relationship a reader
cares about is "how much bigger did it get," not "what fraction of the
total is this").

A quick spot-check of the other 5 no-donut calculators (grepped their
`text-[42px]` result blocks) shows all of them — Gratuity, HRA, Inflation,
EPF, EPS Pension — already converged on the **same** shape as CAGR: one
`text-[42px]` headline + `grid-cols-2 gap-3` bordered stat cards, no chart.
Gratuity (`gratuity-calculator.tsx:159-169`), HRA
(`hra-calculator.tsx:221-229`), Inflation (`inflation-calculator.tsx:203-211`),
and EPF (`epf-calculator.tsx:199-207`) all use the identical
`border-b border-line pb-5 text-center` → `text-[42px]` → `grid-cols-2 gap-3`
markup shape CAGR and EPS Pension use — this is not a coincidence unique to
CAGR/EPS Pension, it's the shape every donut-less calculator on the site
already independently arrived at. (Income Tax is the one partial exception —
see 4.4.)

### Option A — Formalize the existing bordered-stat-card grid as the no-donut anchor (recommended for CAGR)

Keep exactly the layout CAGR already has: single headline stat + folded/
3-line subtitle, `grid-cols-2` bordered stat cards for the remaining
figures, no chart. The only change this option implies is applying the
established header-chrome spacing values from DECISIONS.md #38-#41
(`mt-6→mt-3`, `mt-4→mt-2`, `mt-3→mt-1.5`/`leading-7→leading-6`, `mt-8→mt-4`
on the *page* file) if CAGR's `page.tsx` hasn't already received it — not
checked in this sprint (out of scope: this sprint is about the result-panel
shape, not page-chrome spacing, which is `page.tsx`-local per #38-#41's own
established pattern).

- **Fits CAGR's data shape**: yes — CAGR has no natural part-to-whole pair,
  so a bordered-stat-card grid (which imposes no part-to-whole constraint,
  unlike `SimpleDonutChart`) is the more honest fit, not a downgrade from
  "should have a chart but doesn't."
- **Fits EPS Pension's shape (label/value/subtitle + 4 subtitle states)**:
  yes, directly — EPS Pension already uses this exact shape today (section
  2). Nothing about Option A asks EPS Pension to change; it's already
  conformant.
- **Risk/lift**: lowest of any option. No new component, no new chart
  math, no new tests beyond what a header-chrome-spacing-only change would
  need (i.e., none, if CAGR's/EPS Pension's `page.tsx` already match — that
  would need to be confirmed, not assumed, before any implementation
  sprint).

### Option B — Single stat only, no grid

Drop the stat-card grid entirely, show only the headline figure above the
fold, push everything else below. Rejected as a recommendation: it discards
`absoluteGainLoss`/`totalReturnPercentage`/`growthMultiple` (CAGR) or
`pensionableSalaryUsed`/`pensionableServiceUsed`/`standardMonthlyPension`
(EPS Pension) from the fold with no compensating benefit — the donut-based
template never went this far either (it always keeps a `<dl>` beside the
donut). Noted for completeness, not recommended.

### Option C — Small "beginning vs ending" two-bar comparison, CAGR-specific

CAGR's one pair with a genuine visual relationship is
`beginningValue`/`endingValue` (already shown as a plain `<dl>` below the
fold today, section 1). A compact two-bar (or two-marker) comparison chart —
proportional bar lengths for beginning vs ending value, replacing or
augmenting today's stat-card grid — would visually anchor the "how much did
it grow" story the way the donut does for SIP's "invested vs returns," but
as a **magnitude comparison**, not a part-to-whole split (the two bars don't
need to sum to 100%, unlike donut segments).

- **Fits CAGR's data shape**: yes, uniquely well — this is the one pair CAGR
  has that a chart makes sense for.
- **Fits EPS Pension's shape**: no direct equivalent — EPS Pension's
  branches don't have a comparable single before/after magnitude pair in
  the always-shown non-early case (`isEarly` does compare standard vs early
  pension, but only in one of the four subtitle states, not a good
  candidate for a chart that must render unconditionally above the fold).
  EPS Pension would need separate design work if a chart were ever wanted
  for it — not this option.
- **Risk/lift**: highest of the three — this is a **new chart primitive**,
  not a reuse of `SimpleDonutChart` (whose part-to-whole prop contract
  doesn't fit a before/after comparison). It would need its own geometry
  function and unit tests (mirroring `computeDonutSegments`'s pattern),
  its own accessibility treatment, and a decision on whether it's a
  CAGR-local one-off or a genuinely shared component for a future
  before/after use case elsewhere on the site. This is real net-new work,
  not a spacing/markup change like Option A.

### Recommendation

**For CAGR: Option A** — formalize the bordered-stat-card grid CAGR already
has as the no-donut template's visual anchor, with header-chrome spacing
brought in line with the donut-based calculators' established values (to be
confirmed against CAGR's current `page.tsx`, not assumed). This is the
lowest-risk option, requires no new chart component, and is consistent with
what 4 of the other 5 no-donut calculators already independently converged
on.

**Option C (the beginning-vs-ending two-bar visual) is worth prototyping as
a separate, later, CAGR-specific enhancement** — it's the one place CAGR's
own data genuinely supports a chart the donut-based calculators don't have
an equivalent for — but it should not be bundled into the same rollout step
as Option A, since it's new-component work with its own testing/a11y
surface, not a markup/spacing change.

**For EPS Pension: Option A also applies, and no further design work is
needed for it in this dimension.** EPS Pension already has the Option A
shape today (section 2); the only outstanding EPS Pension item is the
already-logged `isEligible` ternary duplication (DECISIONS.md #58), which is
a pure refactor unrelated to the no-donut chart question and stays out of
scope here.

### 4.4 What this implies for the other 4 no-donut calculators (flagged, not designed)

- **Gratuity, HRA, Inflation, EPF**: spot-checked (`text-[42px]` grep, see
  4.0) and structurally identical to CAGR's shape today — single headline +
  `grid-cols-2` bordered stat cards, no chart, no comparison-pair chart
  candidate as clean as CAGR's beginning/ending values (Gratuity's wages×
  service-years, HRA's exemption-vs-received, Inflation's
  present-vs-future value, and EPF's contribution breakdown are each either
  already covered by a below-the-fold chart — EPF has a 3-way stacked bar,
  per DECISIONS.md #40 — or don't have as direct a two-value comparison as
  CAGR does). Option A likely generalizes to these four, but each still
  needs its own structural audit before any implementation sprint touches
  it — this sprint did not do that audit, only a shape spot-check, matching
  how DECISIONS.md #40 itself insisted on auditing all 20 calculators
  individually before batch-1 rather than assuming.
- **Income Tax is the one calculator unlikely to generalize cleanly.** Its
  above-the-fold panel (`income-tax-calculator.tsx:154-175`) is a **two-regime
  comparison** (Old Regime total tax vs New Regime total tax, with a "Lower
  tax" badge on whichever wins), not a single-figure-plus-breakdown shape —
  conceptually closer to a head-to-head comparison than to CAGR's "one
  scalar result plus derived stats." It also carries slab-by-slab breakdown
  data that Option A's flat 2-cell stat grid was never designed to
  represent. Income Tax needs its own dedicated design conversation, not an
  assumed fit with whatever CAGR/EPS Pension settle on.

## 5. Data-model changes

**None anticipated for Option A** (the recommended design) — it reuses
`CAGRResult`/`EpsPensionResult` fields already computed and already
displayed today; the only changes would be presentation-layer markup/
spacing, the same category of change as DECISIONS.md #38-#41's header-chrome
tightening.

**Option C would need no `calculate-cagr.ts` changes either** —
`beginningValue`/`endingValue` already exist on `CAGRResult`
(`cagr-types.ts:1-5`) and are already both displayed (subtitle line and the
below-fold `<dl>`, section 1). Only new chart-rendering/presentation code
would be needed, not new calculation logic.

## Files read or referenced during this investigation

- `features/calculators/cagr/cagr-calculator.tsx`
- `features/calculators/cagr/cagr-types.ts`
- `features/calculators/eps-pension/eps-pension-calculator.tsx`
- `features/calculators/sip/sip-calculator.tsx`
- `components/calculators/simple-donut-chart.tsx`
- `features/calculators/gratuity/gratuity-calculator.tsx`
- `features/calculators/hra/hra-calculator.tsx`
- `features/calculators/inflation/inflation-calculator.tsx`
- `features/calculators/epf/epf-calculator.tsx`
- `features/calculators/income-tax/income-tax-calculator.tsx`
- `docs/DECISIONS.md` (entries #38-#41, #56, #58)
- `PROJECT.md` (line 34)
- `components/calculators/` directory listing (to confirm no shared
  result-card/header-chrome component exists)

## Timestamps

All logged via `date` (Git Bash) as they happened, not reconstructed
afterward.

- Investigation start: 2026-08-02 21:38:34 IST (`date` / `git branch
  --show-current` confirmation — branch already checked out:
  `feature/sprint-59-no-donut-template-design`)
- Codebase reading and evidence-gathering phase: 2026-08-02 21:38:34 -
  21:41:26 IST
- Report drafted and written: 2026-08-02 21:41:26 - 21:43:03 IST (this file)
- Investigation end: 2026-08-02 21:43:03 IST

## Confirmation of no source files were modified

Only this investigation report was added; no existing component, page,
calculation file, or shared file was changed.
