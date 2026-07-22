@AGENTS.md

# thinkcalculator.in — Project Memory

Indian personal-finance calculator suite. Next.js 16 App Router, React 19,
TypeScript, Tailwind v4, shadcn UI, static export deployed to Hostinger
shared hosting via GitHub Actions FTP.

This file is the short, load-bearing layer. For depth, go to:
- `AGENTS.md` — house style and hard requirements (imported above)
- `PROJECT.md` — current state, what's shipped
- `docs/DECISIONS.md` — numbered architecture decisions and why
- `docs/PRODUCTION-CHECKLIST.md` — deploy/QA checklist, numbered items

If you find yourself about to re-explain something in this file that's
already in one of those, fix it there instead of duplicating it here.

## Non-negotiables

- Every calculator page needs a worked example — and it must actually
  exercise a binding constraint, not a trivial case (e.g. for an exemption
  cap, pick numbers where the cap actually binds).
- `SimpleDonutChart`, `FAQSection`, `yearly-bar-chart` (growth-area-chart)
  must stay backward-compatible for every existing caller when extended.
  Prove it: unit tests for the old shape + full existing suite passing +
  an isolated git-worktree diff against the pre-change commit — not just
  "tests pass."
- Regulatory figures (tax slabs, exemption caps, rates) are either wired
  through the FY-versioned rules architecture (multi-parameter statutory
  values, wrong number = wrong filing figure) or through a single-value
  illustrative config like `ppf-rate-config.ts` (one float, user-editable
  assumption). Pick explicitly and write a one-line comment saying which
  and why — don't default to one without checking the shape of the data.
- Live-recalculation clamp logic (`toLiveInput` / `clampFinite` pattern)
  must be extracted into an exported, testable pure function from the
  start, not bolted on after a review catches it missing tests.
- Prefer per-calculator bespoke layouts over modifying shared
  layout/shell/result-card components. But when a shared primitive
  (donut, stacked-bar) can be *widened* via a prop union rather than
  forked, that's usually better than either a new bespoke component or
  forcing two different calculators into one abstraction that doesn't
  fit either. Decide case by case, document the call in `DECISIONS.md`.

## Incidents that must not repeat

- **Sprint 23 committed directly to `main`.** Branch creation is a hard
  gate before any Claude Code prompt is sent. Confirm with
  `git branch --show-current` before starting work.
- **FTP deploy targeted the wrong Hostinger path** (`public_html/` vs.
  `domains/thinkcalculator.in/public_html/`). Fixed in `8536c62`. Check
  the deploy path if a deploy silently doesn't show up.
- **Windows `run-e2e.mjs` teardown hang.** Use `Stop-Process` in
  PowerShell to kill stale Node processes before verification rounds —
  not `taskkill`. Stale dev-server processes also cause false 404s; kill
  before each verification round.
- **Approximate/reconstructed timestamps in sprint reports.** Time-taken
  summaries must use real logged timestamps (`Get-Date` or equivalent) at
  the start and end of each phase as it happens — not "~1m" estimates
  written after the fact, even for very short phases.
- **Structural-completeness tests satisfied with generic filler.** When a
  test requires a "comparison" section or similar, the content still has
  to be genuinely specific to the calculators involved, not boilerplate
  written just to pass the check.

## Sprint workflow

1. Scope is confirmed via Q&A before any prompt is written — don't guess
   at scope from a vague request.
2. Branch first: `git checkout -b feature/sprint-N-name`, confirm with
   `git branch --show-current`.
3. Claude Code implements, and reports back with real per-phase
   timestamps and an explicit list of every shared component touched
   (what was extended vs. left untouched, and why it's non-breaking).
4. Independent adversarial second-pass review before any merge decision.
5. Manual dev testing by the human.
6. Merge via the PowerShell sequence in `AGENTS.md` / prior sprint
   reports — each command in its own block: branch confirm, commit,
   push, `gh pr create`, `gh pr merge --delete-branch`, then
   checkout/pull/delete main locally.

## Known open items

See `PROJECT.md` for the current list (trust-stats strip, CSP nonce
decision, dev-server perf sprint, `public_html_unused/` cleanup, GA4/GSC
integration gated on `STATIC_EXPORT` not `NODE_ENV`, category-guide
rollout to Investments/Tax categories). Don't re-derive these from
scratch — check there first.
