# ThinkCalculator Project Status

ThinkCalculator is an India-focused calculator and educational-content platform at <https://thinkcalculator.in>. The tagline is “Calculate. Compare. Decide.”

## Current status

- Phase: Phase 4 Public Launch — **live in production**. `https://thinkcalculator.in` has served the full static export since Sprint 35's go-live in July 2026, independently verified against the real domain (see "Sprint 35 launch confirmation" below). Phase 3 Calculator Expansion remains available to resume.
- Milestone: Sprint 35 domain/HTTPS launch confirmed live and independently verified in production (July 2026).
- Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn UI (Base/Nova), Vitest, and Playwright + axe-core for browser-level QA.
- Architecture: static rendering where practical, Server Components by default, typed version-controlled registries, and no Version 1 database.
- Verification baseline (as of Sprint 41, the FAQ search widget): 1,203 automated Vitest tests pass across 117 test files; lint and the 67-page production build pass; the Playwright suite (accessibility, keyboard/focus, zoom/reflow, print, reduced motion, card-links regression, FAQ search widget) runs across Chromium, Firefox, and WebKit. `npm run test` runs both suites. The Windows `scripts/run-e2e.mjs` teardown hang (previously worked around manually per-sprint) is fixed at the root and regression-tested — see `docs/DECISIONS.md` #29.

## Completed capabilities

- Thirteen production calculators: twelve Finance tools (EMI, SIP, Step-up SIP, SWP, Inflation, Retirement Corpus, Lumpsum, FD, RD, CAGR, PPF, and Gratuity) plus the Business GST Calculator.
- Typed validation and pure calculation functions separated from UI.
- Calculator discovery and calculator-only homepage search.
- Validated shareable query URLs, copyable results, browser Print / Save as PDF, accessible charts, and schedules.
- Calculator knowledge content with formulas, examples, FAQs, comparison tables, and internal links.
- SEO metadata helpers, canonical URLs, sitemap, robots, factual structured data, manifest, icons, and social-image routes.
- Production headers, custom not-found/error experiences, and accessibility-oriented navigation.
- Typed Blog and Guide engine with five published items (including the Sprint 38 Loans category guide covering EMI, FD, and RD together) and one draft excluded from routes, lists, related content, and sitemap.
- Typed Glossary Engine with ten substantive published terms, one excluded draft, static routes, DefinedTerm schema, internal links, and sitemap coverage.
- Sprint 38 build-time glossary auto-linker: whitelist, word-boundary, first-occurrence-per-page linking from calculator/guide FAQ answer text to glossary terms, with a reverse "used in" lookup on glossary pages derived from the same matching data. Wired site-wide for guide/blog FAQs (shared template) and opt-in per page for calculators, currently enabled on EMI, FD, and RD only.
- Registry-derived `/business` directory, with GST available through calculator-only homepage search and excluded from editorial `/search` while the GST glossary term is included.
- Typed Topic Hub engine with public `/topics/loans` and `/topics/investing` clusters, curated stable-ID relationships, substantive eligibility checks, static routes, breadcrumb schema, and sitemap coverage.
- Registry-derived reciprocal cluster navigation on eligible calculator, editorial, and glossary pages, with authored-link precedence, deterministic type-balanced fallbacks, canonical-path deduplication, and linked ordered hub learning paths.
- Static `/search` shell with a focused Suspense-wrapped Client Component, registry-derived public editorial documents, deterministic literal matching, clean canonical metadata, sitemap coverage, and a factual WebSite SearchAction.
- Permanent automated accessibility, keyboard/focus, zoom/reflow, and print-output coverage (`tests/e2e/`) via Playwright and `@axe-core/playwright`, run across Chromium, Firefox, and WebKit against every published static route (see docs/PRODUCTION-CHECKLIST.md sections 9-11 and 13 for exact scope and what still needs a human).
- Sprint N added the EPF and NPS calculators, both bespoke-chart clean-slate builds: EPF's yearly corpus growth as a 3-way stacked bar (employee contribution / employer contribution / interest), and NPS's asset allocation (equity / corporate debt / govt securities) as a donut alongside a blended-rate growth line. `YearlyBarChart` and `SimpleDonutChart` were widened from a fixed 2-way shape to a 2-or-3-way union to support this, with every existing 2-way caller (EMI, PPF, retirement corpus, and others) unchanged — see docs/DECISIONS.md entry 26 for the full architecture reasoning.
- Sprint N added the Capital Gains calculator for STT-paid listed equity shares and equity-oriented mutual funds (sections 111A/112A): FIFO multi-lot matching, the pre-31-January-2018 grandfathering cost-basis rule, and the pooled ₹1,25,000 LTCG exemption, each as independently-tested pure functions. Introduced the site's first repeatable multi-row input (purchase lots) and first calendar-date input (`CalculatorDateInput`) — see docs/DECISIONS.md entries 27-28 for the regulatory-config and new-input-primitive reasoning. `SimpleDonutChart` reused unmodified for the LTCG exempt-vs-taxable split.
- Sprint 41 added a site-wide FAQ search chat widget: a floating, bottom-right chat-bubble button (root layout, every page) that opens a Fuse.js-powered fuzzy search panel over a build-time-generated index of every published calculator's FAQs and worked example, plus every published guide's sections (currently the two Sprint 38 Loans guides — indexed by content type, not a hardcoded guide list, so Investments/Tax guides join automatically once published). Fully client-side against an embedded static index — no backend, no runtime network calls. Built on the existing Base UI `Dialog` primitive for keyboard accessibility (focus trap, Escape-to-close, focus return) at no extra cost. See docs/DECISIONS.md entry 30 for the index-embedding pattern and the strict-token-match search-relevance tradeoff.
- Sprint 45 extended Sprint 36's GA4 scaffolding with a Google Consent Mode v2 Accept/Decline banner (`components/analytics/consent-banner.tsx`) and two custom events, `calculation_completed` and `result_shared`, wired into all 21 published calculators — both events, and GA4 itself, structurally gated on visitor consent, with payloads limited by type to `calculator_type`/`category` identifiers only (no calculator input or result value is ever sendable). A new opt-in Playwright suite (`npm run test:e2e:analytics`) proves the consent wiring against a real `STATIC_EXPORT=true` build. See docs/DECISIONS.md #37.
- Sprints 46-47 built and validated the EMI above-the-fold template (tooltip helper text, inline donut labels, tightened header chrome, `<dl>`-beside-donut result panel, folded result subtitle) on EMI alone. Sprint 48 batch 1 rolled the validated pattern out to FD, SIP, RD, and Lumpsum — the four calculators structurally identical to EMI's pre-rollout shape. See docs/DECISIONS.md #38, #39, and #40.

## Known limitations and risks

- Search Console and Bing Webmaster Tools verification, backups, rollback rehearsal, monitoring, and real-device/real-browser/screen-reader validation remain unverified (see docs/PRODUCTION-CHECKLIST.md sections 10-11, 19-23). Production deployment, DNS, and HTTPS are no longer on this list — Sprint 35 confirmed all three live and independently verified (see "Sprint 35 launch confirmation" below). Analytics code (GA4 with a Consent Mode v2 banner and no-PII event tracking) shipped in Sprint 45 — see docs/DECISIONS.md #37 — but still needs the `NEXT_PUBLIC_GA_MEASUREMENT_ID` GitHub secret set before it's live in production (docs/PRODUCTION-CHECKLIST.md section 18).
- Editorial search intentionally excludes calculators; homepage search remains calculator-only and `/search` does not provide typo correction, stemming, or fuzzy matching.
- A savings hub is intentionally withheld until published editorial and glossary coverage makes it substantive rather than calculator-only.
- PPF uses a simplified beginning-of-year annual contribution model. Actual monthly balance eligibility, future notified rates, account events, taxes, and account-office processing are outside the projection.
- GST presets are arithmetic shortcuts rather than rate-classification answers. The calculator relies on the user to select rate and supply type and excludes place-of-supply determination, cess, invoice rules, credits, returns, filing, and compliance.
- Gratuity is scoped to the standard monthly rated employee amount under the Code on Social Security, 2020. The user must supply the eligible last-drawn wage basis; coverage, continuous service, fixed-term, death, disablement, working-journalist, piece-rated, seasonal, better-contract, exemption, forfeiture, and dispute questions remain outside the numerical model.
- SWP is a deterministic, product-agnostic balance projection. Its "until balance is exhausted" mode is capped at 100 years rather than iterating indefinitely; taxation of withdrawals, mutual fund exit loads, STT, and other product-specific or statutory rules are outside the model.
- Inflation uses a single constant assumed annual rate supplied by the user. It does not look up real-time or historical Consumer Price Index data and does not implement the Cost Inflation Index or any other statutory tax-indexation rule.
- Retirement Corpus is a deterministic, constant-rate illustrative projection connecting an accumulation phase to an inflation-adjusted-withdrawal retirement phase. It does not model sequence-of-returns risk, healthcare or long-term-care costs, taxation of contributions or withdrawals, or Social-Security-equivalent government pension income, and it is not a retirement plan or financial advice.
- Sprint 31's browser/accessibility/print QA was performed in a sandboxed environment without a real macOS/Safari runtime or physical mobile devices. Playwright's WebKit engine and mobile viewport emulation give cross-engine and reflow signal, not equivalent to real Safari or iOS/Android device testing; a human must still run a real-device pass (see docs/PRODUCTION-CHECKLIST.md sections 10-11) before launch. Automated axe-core checks and manual DOM/ARIA review also cannot substitute for a real screen-reader (VoiceOver/NVDA/JAWS/TalkBack) pass.
- Financial results are estimates; provider rules, taxes, fees, market movement, and rounding may differ.
- Google-hosted Geist fonts require network access during a clean production build.
- Current editorial content is intentionally small and maintained directly in TypeScript.
- Sprint 46's EMI above-the-fold compacting (docs/DECISIONS.md #38) closed most of the fold-line gap at desktop widths but not on mobile (~390px): the result card still renders below the entire input form there, because the calculator layout is a single-column CSS grid (`grid-cols-1`) until the `lg` breakpoint. Sprint 47 (docs/DECISIONS.md #39) closed a further competitor-driven gap in header chrome and result-panel density on desktop but likewise did not touch the mobile grid breakpoint, so mobile remains below the fold at every tested height. Fixing that would mean reordering the grid or changing the breakpoint — a shared-layout change, not a per-calculator one — and remains explicitly out of scope.

## Sprint 35 launch confirmation

Sprint 35's domain, HTTPS, and launch-preparation code (`feature/sprint-35-domain-https-launch`) was merged and deployed; this section records that the result was independently verified against the real production domain, not just merged.

- **Live status**: `https://thinkcalculator.in` is live in production as of July 2026, serving the full static export (13 calculators, 46 sitemap-indexed routes) over HTTPS.
- **Smoke test**: `npm run smoke-test` (`scripts/smoke-test.mjs`) was run against the real production domain — not the local static export — and passed 12/12: HTTPS active, HTTP→HTTPS redirect, `www`→canonical redirect, all six Sprint 33 security headers present, the custom 404 page serving correctly, `sitemap.xml` and `robots.txt` correctly hosted, and a sample route from every content type (calculator, glossary, blog, topic hub) returning its correct title.
- **Deployment issue found and fixed at go-live**: the GitHub Actions FTP deploy step's `server-dir` was initially set to the account-level `public_html/`, but Hostinger routes addon/attached domains under this hosting plan through the per-domain document root, `domains/thinkcalculator.in/public_html/`. The account-level path silently accepts uploads without erroring, so this would not have surfaced as a build or deploy failure — only as the live domain not reflecting the deploy. Fixed directly on `main` in commit `8536c62` ("Update server directory for deployment"). **This is a permanent gotcha for this hosting setup**: any future redeploy, migration, or new FTP-based workflow for this account must target the per-domain path, not the account-level one. See docs/PRODUCTION-CHECKLIST.md section 16.
- **Cleanup**: the stray files uploaded to the incorrect account-level `public_html/` location during the initial deploy were identified and renamed to `public_html_unused/` — a reversible cleanup, not a deletion, in case anything there needs to be checked before the directory is removed for good.

## Deferred

- Strict CSP pending a nonce-compatible design for Next.js scripts, JSON-LD, images, clipboard, and print.
- Service worker and offline support.
- CMS/MDX, database, accounts, saved calculations, generated PDFs, newsletter backend, comments, and public APIs.
- Rollout of the EMI above-the-fold template (Sprint 46: `helperTextVariant="tooltip"` on `CalculatorField`, `showInlineLabels` on `SimpleDonutChart`, compacted page chrome; Sprint 47: further header-chrome tightening and stat-cards-beside-donut result panel) to the remaining calculators. Sprint 48 batch 1 applied it to FD, SIP, RD, and Lumpsum. Still deferred: Step-up SIP, NPS, PPF, and Home Loan Eligibility (structurally fit but held back, see docs/DECISIONS.md #40), plus the multi-phase (SWP, Retirement Corpus), no-donut (EPF, CAGR, EPS Pension, Gratuity, HRA, Income Tax, Inflation), and extra-card (Capital Gains, Leave Encashment, GST) outlier groups, each needing their own scoping. See docs/DECISIONS.md #38, #39, and #40. (The "other 14 calculators" figure quoted in earlier sprints was stale — the real remaining count before this batch was 20, not 14; see #40.)

## Next phase

Sprint 31 closed the automatable half of Phase 4's QA exit criteria (accessibility, keyboard, zoom/reflow, and print, all now permanently regression-tested), and Sprint 35 closed the deployment half: Hostinger hosting, DNS, and HTTPS are live and independently verified in production (see "Sprint 35 launch confirmation" above). What remains before Phase 4 can be considered fully closed is exactly what a sandboxed environment cannot perform — a real-device/real-browser pass (physical iOS/Android, real Safari) and a real screen-reader pass — plus the still-open operational items in docs/PRODUCTION-CHECKLIST.md (Search Console, Bing Webmaster Tools, analytics, backups, rollback, monitoring). Phase 3 Calculator Expansion also remains available to resume in parallel: CAGR, PPF, GST, Gratuity, Step-up SIP, SWP, Inflation, and Retirement Corpus are complete; income tax and HRA remain candidates. See the [roadmap](docs/ROADMAP.md) and [architecture](docs/ARCHITECTURE.md).

## Validation

```bash
npm run test
npm run lint
npm run build
git diff --check
```
