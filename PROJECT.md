# ThinkCalculator Project Status

ThinkCalculator is an India-focused calculator and educational-content platform at <https://thinkcalculator.in>. The tagline is “Calculate. Compare. Decide.”

## Current status

- Phase: Phase 2 Topic Authority in progress.
- Milestone: Sprint 14 Editorial Search and Discovery complete.
- Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn UI (Base/Nova), and Vitest.
- Architecture: static rendering where practical, Server Components by default, typed version-controlled registries, and no Version 1 database.
- Verification baseline: 190 automated tests passing across 22 test files.

## Completed capabilities

- Five production finance calculators: EMI, SIP, Lumpsum, FD, and RD.
- Typed validation and pure calculation functions separated from UI.
- Calculator discovery and calculator-only homepage search.
- Validated shareable query URLs, copyable results, browser Print / Save as PDF, accessible charts, and schedules.
- Calculator knowledge content with formulas, examples, FAQs, comparison tables, and internal links.
- SEO metadata helpers, canonical URLs, sitemap, robots, factual structured data, manifest, icons, and social-image routes.
- Production headers, custom not-found/error experiences, and accessibility-oriented navigation.
- Typed Blog and Guide engine with four published items and one draft excluded from routes, lists, related content, and sitemap.
- Typed Glossary Engine with six substantive published terms, one excluded draft, static routes, DefinedTerm schema, internal links, and sitemap coverage.
- Typed Topic Hub engine with public `/topics/loans` and `/topics/investing` clusters, curated stable-ID relationships, substantive eligibility checks, static routes, breadcrumb schema, and sitemap coverage.
- Static `/search` shell with a focused Suspense-wrapped Client Component, registry-derived public editorial documents, deterministic literal matching, clean canonical metadata, sitemap coverage, and a factual WebSite SearchAction.

## Known limitations and risks

- Production deployment, DNS, HTTPS, analytics, webmaster tools, backups, rollback, and live browser validation remain unverified.
- Editorial search intentionally excludes calculators; homepage search remains calculator-only and `/search` does not provide typo correction, stemming, or fuzzy matching.
- A savings hub is intentionally withheld until published editorial and glossary coverage makes it substantive rather than calculator-only.
- Financial results are estimates; provider rules, taxes, fees, market movement, and rounding may differ.
- Google-hosted Geist fonts require network access during a clean production build.
- Current editorial content is intentionally small and maintained directly in TypeScript.

## Deferred

- Strict CSP pending a nonce-compatible design for Next.js scripts, JSON-LD, images, clipboard, and print.
- Service worker and offline support.
- CMS/MDX, database, accounts, saved calculations, generated PDFs, newsletter backend, comments, and public APIs.

## Next phase

Continue Topic Authority with stronger contextual links and focused content clusters. See the [roadmap](docs/ROADMAP.md) and [architecture](docs/ARCHITECTURE.md).

## Validation

```bash
npm run test
npm run lint
npm run build
git diff --check
```
