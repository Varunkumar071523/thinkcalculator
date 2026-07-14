# Changelog

This changelog summarises project milestones. No semantic version or release date is asserted unless verified separately.

## Unreleased

### Added

- Sprint 20 Step-up SIP Calculator at `/finance/step-up-sip-calculator`, with percentage and fixed annual increases, beginning-of-month calculation, yearly schedule, regular SIP comparison, validated URL sharing, copy, reset, and print support.
- Published `/glossary/step-up-sip`, Investing topic integration, discovery, metadata, structured data, and sitemap coverage. Independent review added strict numeric/URL parsing, exact zero-step parity, complete copy/print comparison context, safe mode switching, reciprocal SIP linking, and stronger regression coverage. The verified baseline is 474 tests across 43 files, passing lint, and a 51-page static/SSG production build.

- Sprint 19 Gratuity Calculator at `/finance/gratuity-calculator` with pure standard monthly rated employee logic, strict eligible-wage and whole-service validation, explicit exactly-six-versus-seven-month handling, a centralized ₹20 lakh ceiling, visible pre-ceiling and capped results, qualified ordinary-service warning, complete shareable URL state, copy, and print support.
- Current Code on Social Security, 2020 source records reviewed on 13 July 2026, including the 21 November 2025 commencement position, Social Security (Central) Rules, 2026, section 2(88) wage basis and 50% rule, 15/26 formula, service fraction, transition FAQ, ordinary eligibility and exceptions, the saved 2018 ceiling notification with current Ministry confirmation, and explicit exclusions from the numerical model.
- Published `/glossary/gratuity`, calculator and Finance-directory discovery, homepage calculator search, related calculators, metadata, factual structured data, sitemap coverage, substantive knowledge content, and bidirectional calculator/glossary links.
- Focused calculation, validation, URL-state, registry, knowledge-content, glossary, metadata, source, discovery, and sitemap tests. The verified Sprint 19 baseline is 433 tests across 39 files, passing lint, and a 49-page static/SSG production build.

- Sprint 18 GST Calculator at `/business/gst-calculator` with pure add/remove arithmetic, strict plain-decimal amount and rate validation, 0% to 100% custom rates, centralized 0%, 5%, 12%, 18%, and 28% presets, user-selected intra-State CGST plus SGST/UTGST or inter-State IGST presentation, accessible breakdown, copy/share, and print support.
- Centralized official source records checked on 13 July 2026, visible rate-classification and place-of-supply limitations, substantive knowledge content, worked examples, FAQs, compliance exclusions, and a published `/glossary/gst` DefinedTerm page.
- Registry-derived Business directory and GST discovery across `/calculators`, `/business`, homepage calculator search, and sitemap, while editorial `/search` continues to exclude calculators and includes the GST glossary term. No sparse Business topic hub was published.
- Focused calculation, validation, URL-state, preset/source, registry, glossary, topic, search, SEO, and sitemap tests. The verified Sprint 18 baseline is 395 tests across 35 files, passing lint, and a 47-page static/SSG production build.

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
