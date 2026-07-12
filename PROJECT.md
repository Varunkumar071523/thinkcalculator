# ThinkCalculator

## Product

ThinkCalculator is an India-focused calculator and educational content platform.

Domain: https://thinkcalculator.in

Tagline: Calculate. Compare. Decide.

## Version 1 Goals

- Build a fast, mobile-first calculator platform
- Launch high-quality finance calculators
- Publish educational guides and articles
- Establish a reusable calculator framework
- Optimize all public pages for search engines
- Deploy on the existing Hostinger environment

## Version 1 Architecture

- Next.js App Router
- TypeScript
- Tailwind CSS
- MDX and structured TypeScript data
- No database for calculator or editorial content
- Calculation logic separated from presentation
- Static generation wherever practical

## Initial Modules

- Homepage
- Calculator categories
- Calculator framework
- Finance calculators
- Blog
- Guides
- Glossary
- Search
- SEO infrastructure

## Development Status

### Completed

- Product planning
- Initial architecture
- Next.js project initialization
- TypeScript configuration
- ESLint configuration
- Tailwind CSS configuration
- Git initialization
- Sprint 1: project foundation, global layout, navigation, homepage shell, and route metadata
- Sprint 2: reusable typed calculator framework and static demonstration page
- Sprint 3: production EMI Calculator and executable Vitest unit tests
- Sprint 4: production SIP Calculator with validation, content, SEO, and tests
- Sprint 5: production Lumpsum Calculator with compound-growth tests
- Sprint 6: production Fixed Deposit Calculator with compounding options, validation, content, SEO, and tests
- Sprint 7: production Recurring Deposit Calculator with compounding options, validation, content, SEO, and tests
- Sprint 8: enhanced EMI experience with validated shareable URLs, copy and print actions, accessible visualization, amortization schedule, and automated tests
- Sprint 9: enhanced calculator experience rollout with shareable URL state, reusable result actions, accessible charts, detailed schedules, and expanded tests for SIP, Lumpsum, FD, and RD calculators
- Sprint 10.1: launch-ready homepage redesign with registry-backed calculator discovery, category browsing, learning and glossary previews, FAQs, and newsletter preview UI
- Sprint 10.2: reusable SEO metadata helpers, registry-backed sitemap, robots directives, root Organization and WebSite structured data, and calculator metadata audit
- Sprint 10.3: typed calculator knowledge-content framework with reusable sections, navigation, callouts, comparison tables, learning links, and five enriched finance calculators
- Sprint 10.4: production readiness, performance, accessibility, brand assets, error experiences, response headers, and deployment checklist

### Current Sprint

Sprint 11: Blog & Guide Content Engine

- Typed, version-controlled registry for blog articles, guides, authors, categories, and tags
- Structured editorial sections without Markdown, MDX, a CMS, or a database
- Four published sample resources and one excluded draft
- Static index and detail routes with metadata, Article or BlogPosting schema, FAQs, and internal links
- Editorial search remains future work; homepage search stays calculator-only

### Next

- Glossary Engine
- Production launch-readiness review

### Deferred

- Strict Content Security Policy is deferred until a nonce-compatible policy can be validated with Next.js scripts, inline JSON-LD, metadata images, clipboard, and print behavior.
- Service-worker and offline support are outside Version 1 scope.
- Route-level loading UI is omitted because the current public pages are statically rendered and do not wait on request-time data.
