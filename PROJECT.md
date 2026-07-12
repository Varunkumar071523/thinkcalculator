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

### Current Sprint

Sprint 10.1: Homepage Redesign and Calculator Discovery

- Redesign the homepage as a launch-ready, India-focused financial-calculator landing page
- Add registry-backed calculator search and discovery without an API or database
- Showcase production calculators, categories, learning previews, glossary terms, FAQs, and a clearly disabled newsletter preview
- Keep the homepage statically rendered with a small, isolated client search component

### Next

- Platform SEO infrastructure, including robots.txt, sitemap.xml, and launch metadata review
- Production launch-readiness review
