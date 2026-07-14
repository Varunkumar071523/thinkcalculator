# ThinkCalculator Project Status

ThinkCalculator is an India-focused calculator and educational-content platform at <https://thinkcalculator.in>. The tagline is “Calculate. Compare. Decide.”

## Current status

- Phase: Phase 3 Calculator Expansion in progress.
- Milestone: Sprint 22 Inflation Calculator complete.
- Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn UI (Base/Nova), and Vitest.
- Architecture: static rendering where practical, Server Components by default, typed version-controlled registries, and no Version 1 database.
- Verification baseline: 564 automated tests pass across 51 test files; lint and the 55-page production build pass.

## Completed capabilities

- Twelve production calculators: eleven Finance tools (EMI, SIP, Step-up SIP, SWP, Inflation, Lumpsum, FD, RD, CAGR, PPF, and Gratuity) plus the Business GST Calculator.
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

## Known limitations and risks

- Production deployment, DNS, HTTPS, analytics, webmaster tools, backups, rollback, and live browser validation remain unverified.
- Editorial search intentionally excludes calculators; homepage search remains calculator-only and `/search` does not provide typo correction, stemming, or fuzzy matching.
- A savings hub is intentionally withheld until published editorial and glossary coverage makes it substantive rather than calculator-only.
- PPF uses a simplified beginning-of-year annual contribution model. Actual monthly balance eligibility, future notified rates, account events, taxes, and account-office processing are outside the projection.
- GST presets are arithmetic shortcuts rather than rate-classification answers. The calculator relies on the user to select rate and supply type and excludes place-of-supply determination, cess, invoice rules, credits, returns, filing, and compliance.
- Gratuity is scoped to the standard monthly rated employee amount under the Code on Social Security, 2020. The user must supply the eligible last-drawn wage basis; coverage, continuous service, fixed-term, death, disablement, working-journalist, piece-rated, seasonal, better-contract, exemption, forfeiture, and dispute questions remain outside the numerical model.
- SWP is a deterministic, product-agnostic balance projection. Its "until balance is exhausted" mode is capped at 100 years rather than iterating indefinitely; taxation of withdrawals, mutual fund exit loads, STT, and other product-specific or statutory rules are outside the model.
- Inflation uses a single constant assumed annual rate supplied by the user. It does not look up real-time or historical Consumer Price Index data, does not implement the Cost Inflation Index or any other statutory tax-indexation rule, and has no tie-in to a Retirement Corpus calculator (not yet built).
- Financial results are estimates; provider rules, taxes, fees, market movement, and rounding may differ.
- Google-hosted Geist fonts require network access during a clean production build.
- Current editorial content is intentionally small and maintained directly in TypeScript.

## Deferred

- Strict CSP pending a nonce-compatible design for Next.js scripts, JSON-LD, images, clipboard, and print.
- Service worker and offline support.
- CMS/MDX, database, accounts, saved calculations, generated PDFs, newsletter backend, comments, and public APIs.

## Next phase

Continue Phase 3 Calculator Expansion by selecting the next calculator against formula stability, source quality, maintenance cost, and user value. CAGR, PPF, GST, Gratuity, Step-up SIP, SWP, and Inflation are complete; retirement, income tax, and HRA remain candidates. See the [roadmap](docs/ROADMAP.md) and [architecture](docs/ARCHITECTURE.md).

## Validation

```bash
npm run test
npm run lint
npm run build
git diff --check
```
