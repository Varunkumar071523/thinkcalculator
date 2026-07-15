# ThinkCalculator Project Status

ThinkCalculator is an India-focused calculator and educational-content platform at <https://thinkcalculator.in>. The tagline is “Calculate. Compare. Decide.”

## Current status

- Phase: Phase 4 Public Launch in progress (Sprint 31 Browser/Accessibility/Print QA complete); Phase 3 Calculator Expansion remains available to resume.
- Milestone: Sprint 31 Browser, Mobile, Accessibility, and Print QA complete.
- Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn UI (Base/Nova), Vitest, and Playwright + axe-core for browser-level QA.
- Architecture: static rendering where practical, Server Components by default, typed version-controlled registries, and no Version 1 database.
- Verification baseline: 628 automated Vitest tests pass across 55 test files; a permanent 264-test Playwright suite (accessibility, keyboard/focus, zoom/reflow, print, reduced motion) passes across Chromium, Firefox, and WebKit; lint and the 57-page production build pass. `npm run test` runs both suites.

## Completed capabilities

- Thirteen production calculators: twelve Finance tools (EMI, SIP, Step-up SIP, SWP, Inflation, Retirement Corpus, Lumpsum, FD, RD, CAGR, PPF, and Gratuity) plus the Business GST Calculator.
- Typed validation and pure calculation functions separated from UI.
- Calculator discovery and calculator-only homepage search.
- Validated shareable query URLs, copyable results, browser Print / Save as PDF, accessible charts, and schedules.
- Calculator knowledge content with formulas, examples, FAQs, comparison tables, and internal links.
- SEO metadata helpers, canonical URLs, sitemap, robots, factual structured data, manifest, icons, and social-image routes.
- Production headers, custom not-found/error experiences, and accessibility-oriented navigation.
- Typed Blog and Guide engine with four published items and one draft excluded from routes, lists, related content, and sitemap.
- Typed Glossary Engine with ten substantive published terms, one excluded draft, static routes, DefinedTerm schema, internal links, and sitemap coverage.
- Registry-derived `/business` directory, with GST available through calculator-only homepage search and excluded from editorial `/search` while the GST glossary term is included.
- Typed Topic Hub engine with public `/topics/loans` and `/topics/investing` clusters, curated stable-ID relationships, substantive eligibility checks, static routes, breadcrumb schema, and sitemap coverage.
- Registry-derived reciprocal cluster navigation on eligible calculator, editorial, and glossary pages, with authored-link precedence, deterministic type-balanced fallbacks, canonical-path deduplication, and linked ordered hub learning paths.
- Static `/search` shell with a focused Suspense-wrapped Client Component, registry-derived public editorial documents, deterministic literal matching, clean canonical metadata, sitemap coverage, and a factual WebSite SearchAction.
- Permanent automated accessibility, keyboard/focus, zoom/reflow, and print-output coverage (`tests/e2e/`) via Playwright and `@axe-core/playwright`, run across Chromium, Firefox, and WebKit against every published static route (see docs/PRODUCTION-CHECKLIST.md sections 9-11 and 13 for exact scope and what still needs a human).

## Known limitations and risks

- Production deployment, DNS, HTTPS, analytics, webmaster tools, backups, rollback, and live browser validation remain unverified.
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

## Deferred

- Strict CSP pending a nonce-compatible design for Next.js scripts, JSON-LD, images, clipboard, and print.
- Service worker and offline support.
- CMS/MDX, database, accounts, saved calculations, generated PDFs, newsletter backend, comments, and public APIs.

## Next phase

Sprint 31 closed the automatable half of Phase 4's QA exit criteria (accessibility, keyboard, zoom/reflow, and print, all now permanently regression-tested). What remains before Phase 4 can be considered fully closed is exactly what a sandboxed environment cannot perform: a real-device/real-browser pass (physical iOS/Android, real Safari) and a real screen-reader pass, plus the deployment-specific items in docs/PRODUCTION-CHECKLIST.md (Hostinger hosting, DNS/HTTPS, Search Console, analytics, backups, rollback). Phase 3 Calculator Expansion also remains available to resume in parallel: CAGR, PPF, GST, Gratuity, Step-up SIP, SWP, Inflation, and Retirement Corpus are complete; income tax and HRA remain candidates. See the [roadmap](docs/ROADMAP.md) and [architecture](docs/ARCHITECTURE.md).

## Validation

```bash
npm run test
npm run lint
npm run build
git diff --check
```
