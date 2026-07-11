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

### Current Sprint

Sprint 6: Production Fixed Deposit Calculator

- Pure, validated fixed-deposit compound-interest calculation
- Monthly, quarterly, half-yearly, and yearly compounding support
- Interactive FD form with field-level errors and reset support
- FD results, calculated worked example, FAQs, and related tools
- Production metadata, structured data, and internal linking
- Vitest coverage for compounding frequencies, boundaries, fractional duration, zero interest, and invalid inputs

### Next

- RD Calculator as the next planned production calculator
- robots.txt
- sitemap.xml
