# ThinkCalculator Project Status

ThinkCalculator is an India-focused calculator and educational-content platform at <https://thinkcalculator.in>. The tagline is “Calculate. Compare. Decide.”

## Current status

- Phase: Version 1 platform foundation complete; topic-authority work is next.
- Milestone: documentation freeze after the Blog and Guide engine.
- Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn UI (Base/Nova), and Vitest.
- Architecture: static rendering where practical, Server Components by default, typed version-controlled registries, and no Version 1 database.
- Verification baseline: 153 automated tests passing across 19 test files.

## Completed capabilities

- Five production finance calculators: EMI, SIP, Lumpsum, FD, and RD.
- Typed validation and pure calculation functions separated from UI.
- Calculator discovery and calculator-only homepage search.
- Validated shareable query URLs, copyable results, browser Print / Save as PDF, accessible charts, and schedules.
- Calculator knowledge content with formulas, examples, FAQs, comparison tables, and internal links.
- SEO metadata helpers, canonical URLs, sitemap, robots, factual structured data, manifest, icons, and social-image routes.
- Production headers, custom not-found/error experiences, and accessibility-oriented navigation.
- Typed Blog and Guide engine with four published items and one draft excluded from routes, lists, related content, and sitemap.

## Known limitations and risks

- Production deployment, DNS, HTTPS, analytics, webmaster tools, backups, rollback, and live browser validation remain unverified.
- Editorial search, public glossary, and topic hubs do not yet exist; homepage search remains calculator-only.
- Financial results are estimates; provider rules, taxes, fees, market movement, and rounding may differ.
- Google-hosted Geist fonts require network access during a clean production build.
- Current editorial content is intentionally small and maintained directly in TypeScript.

## Deferred

- Strict CSP pending a nonce-compatible design for Next.js scripts, JSON-LD, images, clipboard, and print.
- Service worker and offline support.
- CMS/MDX, database, accounts, saved calculations, generated PDFs, newsletter backend, comments, and public APIs.

## Next phase

Glossary Engine and Topic Authority: glossary terms, topic/category hubs, editorial discovery, stronger internal linking, and content clusters. See the [roadmap](docs/ROADMAP.md) and [architecture](docs/ARCHITECTURE.md).

## Validation

```bash
npm run test
npm run lint
npm run build
git diff --check
```
