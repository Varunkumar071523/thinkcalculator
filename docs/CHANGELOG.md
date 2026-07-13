# Changelog

This changelog summarises project milestones. No semantic version or release date is asserted unless verified separately.

## Unreleased

### Added

- Sprint 17 PPF Calculator at `/finance/ppf-calculator` with pure annual recurrence, beginning-of-year contribution timing, strict ₹500–₹1,50,000 and ₹50-multiple validation, editable assumed rate, 15–40 year five-year durations, annual schedule, accessible composition chart, URL sharing, copy, and print support.
- Centralized PPF reference-rate metadata with official NSI effective basis, checked date, source, verification limitation, and maintenance procedure; substantive official-source knowledge content and qualified tax/account disclaimers.
- Published `/glossary/ppf`, PPF calculator discovery and relations, Savings membership without hub publication, calculator/editorial search separation, sitemap coverage, and focused calculation, validation, URL-state, registry, content, and regression tests.
- Final Sprint 17 review corrected the quarterly-notification provenance, derived calculator directories and homepage counts from the registry, qualified maturity and extension timing, preserved assumptions in copied/printed output, and strengthened boundary, schedule, URL, routing, source, and discovery invariants. The verified baseline is 351 tests across 31 files.

- Sprint 16 CAGR Calculator with typed endpoint inputs/results, fractional-year validation, pure compound annual growth logic, negative and complete-loss handling, shareable URL state, copy/print actions, worked example, FAQs, and accessible endpoint comparison.
- Published CAGR glossary term, Investing topic membership, reciprocal calculator links, registry-driven sitemap/search discovery, and calculator-directory/homepage integration.
- Sprint 16 calculation, validation, URL-state, registry, content, and production checks, including finite-output and strict numeric-text hardening, bringing the verified baseline to 270 tests across 27 files and 43 static/SSG pages.
- Documentation freeze and current operational status.
- Architecture guide and phased roadmap.
- Contribution guide, editorial handbook, production checklist, and architecture decision log.
- Static Topic Hub engine with `/topics`, Loans and Investing hubs, hybrid stable-ID relationships, public eligibility validation, breadcrumb schema, and sitemap coverage.
- Registry-derived editorial search at `/search?q=...` for published blogs, guides, glossary terms, and eligible topic hubs, with deterministic ranking, static-shell rendering, canonical/sitemap coverage, and WebSite SearchAction.
- Sprint 15 reciprocal internal linking derived from eligible Loans and Investing topic memberships across calculators, editorial pages, glossary terms, and topic hubs.
- Linked ordered learning paths, authored-related-link precedence, deterministic type-balanced fallbacks, canonical-path deduplication, and automated draft/sparse/broken-relationship exclusions.
- Phase 2 Topic Authority completion with search scope, sitemap membership, public routes, calculator logic, and the intentionally sparse Savings hub unchanged.

## Milestone: Platform Foundation

- Next.js App Router and TypeScript setup.
- Tailwind CSS v4 and shared shadcn-based design primitives.
- Calculator framework, homepage, responsive navigation, category discovery, and calculator search.

## Milestone: Core Calculators

- Production EMI, SIP, Lumpsum, FD, and RD calculators.
- Typed validation, pure calculation logic, formulas, examples, FAQs, metadata, and unit tests.

## Milestone: Calculator Experience

- Validated shareable query state and canonical clean routes.
- Copy results and browser Print / Save as PDF.
- Accessible lightweight charts, amortisation/growth schedules, and reusable result actions.

## Milestone: SEO and Production Readiness

- Metadata helpers, canonicals, sitemap, robots, and factual structured data.
- Manifest, app icons, social-image route, security headers, and framework-header removal.
- Custom not-found and recoverable error handling.

## Milestone: Content Platform

- Typed calculator knowledge-content framework.
- Typed, registry-based Blog and Guide engine.
- Four published editorial items and one draft excluded from public routes, lists, relations, and sitemap.
