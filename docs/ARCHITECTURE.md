# ThinkCalculator Architecture

This document is the technical source of truth for ThinkCalculator. For operational status see [PROJECT.md](../PROJECT.md); for rationale see the [decision log](DECISIONS.md).

## 1. Product overview

ThinkCalculator is a mobile-first, SEO-oriented calculator and educational-content platform for India. Version 1 prioritises understandable calculations, visible assumptions, static public content, accessibility, and a small operational footprint.

## 2. Architectural goals

- Keep calculation logic deterministic, typed, testable, and independent of React.
- Prefer static output and Server Components for speed, crawlability, and minimal browser JavaScript.
- Keep calculators and content reviewable in Git.
- Avoid infrastructure that current requirements do not need.
- Share presentation primitives without putting domain logic in generic components.

## 3. High-level architecture

```text
Version-controlled definitions and content
        |                     |                    |
calculator registry     editorial registry    glossary registry
        |                     |                    |
pure calculations       structured sections   defined terms
validation + URL state  taxonomy + relations  examples + relations
        \                     |                    /
       topic registry resolves stable IDs
             /                    \
 public cluster relation      derived public
       resolver            editorial search index
          |                         |
 reciprocal links + linked hub learning paths
             \                    /
         Next.js App Router pages
           |              |
     Server Components  small Client Components
           \              /
        static HTML + required client JS
                    |
     metadata, JSON-LD, sitemap, robots
```

## 4. Tech stack

Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn UI using Base/Nova primitives, Lucide icons, ESLint, and Vitest. There is no application database, CMS, MDX pipeline, API route, authentication system, external chart package, or PDF generator.

## 5. Rendering strategy

Public shells, directories, calculator knowledge content, blog indexes, and guide indexes are statically rendered. Dynamic editorial segments use `generateStaticParams`; `dynamicParams = false` prevents unregistered slugs from becoming public pages. Static generation is preferred because the data is version-controlled and does not require request-time personalisation.

Server Components are the default. A Client Component is used only when browser state or events are required, such as calculator inputs, query-state synchronisation, clipboard actions, printing, or the mobile sheet. `/search` keeps its page shell static and places `useSearchParams` inside a focused Client Component and Suspense boundary, so query URLs work with refresh and browser history without forcing request-time rendering. Calculation and search-ranking modules remain framework-independent.

## 6. Folder structure

- `app/`: routes, layouts, metadata routes, errors, sitemap, and robots.
- `components/ui/`: generic shadcn primitives.
- `components/layout/` and `components/shared/`: navigation and reusable site presentation.
- `components/calculators/`, `components/content/`, `components/editorial/`: domain presentation primitives.
- `features/calculators/`: calculator logic, schema, state, content, components, and tests.
- `features/content/`: taxonomy, editorial and glossary registries, reading time, lookup utilities, and tests.
- `lib/`: SEO, URL, formatting, site configuration, and production configuration.
- `types/`: shared calculator, site, knowledge-content, and editorial models.
- `docs/`: operational and engineering documentation.

## 7. Routing conventions

- Calculators: category-owned static routes such as `/finance/[calculator-name]-calculator` and `/business/[calculator-name]-calculator`.
- Blogs: `/blog/[slug]`; guides: `/guides/[slug]`.
- Indexes: `/calculators`, `/finance`, `/blog`, and `/guides`.
- Glossary: `/glossary` and `/glossary/[slug]`.
- Topics: `/topics` and `/topics/[slug]`.
- Editorial resource search: `/search?q={query}`; the canonical document is always clean `/search`.
- Calculator routes remain query-canonical: shareable input state may use a query string, while canonical metadata always identifies the clean path without query parameters.
- Missing, draft, or wrong-type editorial slugs return not found and are omitted from static parameters.

## 8. Calculator framework

The calculator registry supplies identity, route, category, inputs, metadata, formulas, examples, FAQs, status, and relations. Shared shells render common controls and results. Pure calculation functions accept typed input and return typed numeric results without formatting, rendering, network calls, browser state, or mutation. This separation makes financial logic independently testable and prevents UI changes from silently changing formulas.

## 9. Calculator module structure

A typical module contains `*-types.ts`, `*-schema.ts`, `calculate-*.ts`, optional schedule calculation, `*-url-state.ts`, `*-definition.ts`, `*-content.ts`, `*-knowledge-content.ts`, a client calculator component, an index, and focused tests. Presentation formatting occurs after calculation.

## 10. URL-state architecture

Each production calculator parses only recognised query keys, validates and normalises values, and serialises valid state. Invalid or incomplete values fall back safely. Sharing copies a query-bearing URL, but SEO canonical URLs exclude the query because inputs do not define separate indexable documents.

The CAGR module applies `((ending / beginning)^(1 / years) - 1) × 100` to two endpoints. Beginning value must be positive, ending value may be zero for a complete loss, and the period accepts 0.01 to 100 years with at most two decimal places. Form and URL text accept plain decimal notation without whitespace, currency symbols, group separators, or exponent notation. Combination validation includes the percentage conversion so every accepted calculation has finite structured output; mathematically overflowing combinations are rejected rather than clamped. Its result keeps CAGR, absolute gain/loss, total return, growth multiple, and the validated inputs as unformatted numbers. Complete loss is exactly -100%; invalid or incomplete URL state falls back as a whole, while complete valid shared state restores the calculation. The UI deliberately compares the two known endpoints instead of inventing a historical projection and uses compact scientific percentage formatting only when a finite result would otherwise be too wide.

The PPF module applies an annual recurrence: add the validated annual contribution to the opening balance, apply the editable assumed annual rate without intermediate rounding, and carry the closing balance forward. Contributions are modeled at the beginning of each projection year and assumed eligible for a full year's interest. The official rule instead uses the lowest balance between the close of the fifth day and month-end; it is disclosed but not simulated. Contributions are whole rupees from ₹500 to ₹1,50,000 in multiples of ₹50; rates are plain decimals from 0.1% to 15% with at most two decimal places; durations are restricted to 15 years and five-year steps through 40. These are projection durations: official closure is after fifteen years from the end of the financial year in which the account was opened, and extensions are subject to the scheme's application procedure. `ppf-rate-config.ts` is the single source for the 7.1% reference default, effective basis, checked date, source, verification limitation, and maintenance procedure. Source records were checked on 13 July 2026. The accessible Department of Economic Affairs notification published on 30 March 2026 is recorded without inferring a rate from its non-text-verifiable table. URL state requires one complete valid `contribution`, `rate`, and `years` set and keeps canonical metadata query-free.

The GST module supports `add` and `remove` modes. Add mode treats the amount as the exclusive taxable value and applies `GST = E × r / 100`; remove mode treats it as inclusive and derives `E = I / (1 + r / 100)`. The user selects either intra-State arithmetic, which divides total GST equally into CGST and SGST/UTGST, or inter-State arithmetic, which assigns it to IGST. The module does not infer place of supply. Amount and rate text use strict plain-decimal parsing with two-decimal limits; URL state requires one complete valid `amount`, `rate`, `mode`, and `supply` set. `gst-rate-config.ts` centralizes the 0%, 5%, 12%, 18%, and 28% arithmetic presets, custom-rate limits, source records, checked date, and applicability warning. Pure calculations retain full precision and presentation alone formats currency.

The Gratuity module applies the standard monthly rated employee method under the current Code on Social Security, 2020 framework: `eligible monthly wages × 15 / 26 × counted service years`, followed by the centralized statutory ceiling. Counted service adds one year only when additional completed months are greater than six; exactly six does not increment the year. Validation accepts positive finite eligible wages, 0–60 whole completed years, and 0–11 whole additional months. Complete URL state uses `wages`, `years`, and `months`; incomplete or invalid state falls back as a whole. `gratuity-regulatory-config.ts` centralizes the current ₹20 lakh ceiling, ordinary five-year reference threshold, review date, and primary official sources. The UI provides an informational ordinary-service warning but deliberately does not decide legal eligibility, coverage, continuous service, special categories, exceptional events, better terms, exemptions, or forfeiture.

## 11. Schedules and charts

Schedule functions are pure and tested separately from headline calculations. Tables expose detailed rows semantically and contain horizontal overflow. Charts use lightweight CSS/SVG/HTML presentation rather than an external chart library, include textual values, and never rely on colour alone.

## 12. Knowledge-content framework

Calculator pages use typed, version-controlled knowledge content: sections, callouts, comparisons, references, internal navigation, formulas, examples, FAQs, and related learning links. No executable formulas or unrestricted HTML are stored as content.

## 13. Blog and Guide engine

`types/editorial-content.ts` defines immutable structured content. `features/content/content-registry.ts` currently contains four published items and one draft. Reusable Server Components render headers, metadata, table of contents, paragraphs, lists, tables, callouts, FAQs, authors, related calculators, and related editorial content.

## 14. Content registry architecture

Calculators and editorial items are registry-based and version-controlled so a code review can inspect facts, links, metadata, status, and presentation together. A Version 1 database would add migrations, runtime availability, security, backups, and administration without serving a current persistence requirement. Drafts remain in source for review but are excluded from public lists, relations, sitemap input, static parameters, and indexable metadata.

The glossary follows the same pattern through a separate typed registry. Published terms provide a plain definition, substantive structured sections, calculation context, examples, and relations to live calculators and editorial pages. Dynamic glossary segments use static parameters with `dynamicParams = false`; drafts are excluded from routes and sitemap. Visible term pages use factual `DefinedTerm` structured data linked to the public glossary set.

Topic definitions curate relationships with stable calculator, editorial, and glossary IDs while resolving display data and canonical paths from the owning registries. A topic is public only when it is published, has a meaningful overview and at least three unique linked learning-path destinations, resolves every reference to published content, and contains at least one calculator, blog, guide, and glossary term. This keeps draft, unresolved, and sparse topics out of lookup, static parameters, navigation, and sitemap. The initial public hubs are Loans and Investing; Savings remains registered only as a non-public eligibility case because its current public mix is calculator-only.

`features/content/cluster-relations.ts` is the canonical public relationship projection for reciprocal navigation. It derives memberships only from eligible topic definitions, resolves every label and path through the owning public registry, removes the current page and duplicate canonical paths, preserves valid authored relations first, then fills missing resource types in curated topic-member order under a small deterministic cap. Calculator, editorial, and glossary pages consume the same Server Component presentation; topic hubs render their curated destinations as semantic linked ordered lists. This adds no route, client state, sitemap entry, or second content registry.

Editorial search derives a small typed document projection from published editorial entries, published glossary terms, and eligible public topics. It does not own or duplicate canonical content and intentionally excludes calculators, drafts, sparse topics, unresolved topics, and unavailable routes. Client query utilities are isolated from registry-backed index construction so only derived public documents cross the Client Component boundary. Query processing trims and collapses whitespace, compares case-insensitively, caps effective input at 120 characters, and uses literal substring checks. Submissions and incoming query URLs are normalised to a single encoded `q` value; blank queries return to clean `/search`. Ranking is exact title, title prefix, title substring, keyword/category/tag/alias, then description, with title and path tie-breakers.

## 15. SEO architecture

`lib/seo.ts` centralises canonical URL, page, calculator, editorial, Open Graph, Twitter metadata, and root structured data. Root metadata supplies the site defaults. `app/sitemap.ts` combines stable routes, published calculators, published editorial and glossary entries, and public substantive topics; `app/robots.ts` exposes crawl rules. The useful queryless `/search` page is indexable and appears once in the sitemap, while query URLs remain canonical to `/search` and never appear in the sitemap. The existing WebSite graph includes a factual SearchAction for `/search?q={search_term_string}`.

## 16. Structured data

Only visible, factual data is encoded. The root uses Organization and WebSite data, with the implemented editorial search represented by one SearchAction on the existing WebSite object. Editorial pages use BlogPosting or Article and useful FAQ data. Calculator and breadcrumb schema is used where supported by visible content; topic pages use BreadcrumbList matching their visible breadcrumbs. Ratings, review counts, fake credentials, fake images, SearchResultsPage schema, and unsupported claims are prohibited.

## 17. Testing strategy

Vitest covers calculations, validation boundaries, URL state, schedules, registries, content integrity, search derivation/ranking, production configuration, and draft/link exclusions. Tests avoid snapshots in favour of explicit behaviour and invariant checks. Sprint 20 adds Step-up SIP annual-boundary, percentage/fixed mode, regular-SIP parity, strict numeric parsing, schedule, URL-state, worked-example, discovery, glossary, metadata, and sitemap invariants. The calculator follows the SIP beginning-of-month convention: each contribution is added before monthly growth, using annual return divided by 12 and 100.

## 18. Accessibility principles

Use semantic landmarks, one visible H1, logical headings, labelled inputs, keyboard access, visible focus, skip navigation, status announcements, meaningful time elements, captioned tables, text alternatives, adequate contrast, mobile reflow, and reduced-motion-safe presentation.

## 19. Security headers

`lib/production-config.ts` defines conservative headers applied in `next.config.ts`, including removal of framework disclosure. Strict CSP is deferred until nonce-compatible handling is validated with Next.js scripts, inline JSON-LD, generated images, clipboard, and print behaviour.

## 20. Performance principles

Prefer static pages, Server Components, small client boundaries, no runtime editorial fetch, no large chart dependency, responsive layouts, and limited animation. Avoid adding caching or background systems before measurements justify them.

## 21. Git and branch workflow

Use short-lived feature, fix, or documentation branches, focused conventional commits, reviewed pull requests, and a clean validated diff. See [CONTRIBUTING.md](CONTRIBUTING.md).

## 22. Deployment assumptions

The intended production domain is `https://thinkcalculator.in` on the existing Hostinger environment. The runtime must support the built Next.js application and configured headers. Clean builds require access to fetch Geist fonts. HTTPS, DNS, caching, analytics, backups, rollback, and monitoring must be verified in the target environment using the [production checklist](PRODUCTION-CHECKLIST.md).

## 23. Deferred architecture decisions

CMS/MDX, database, accounts, saved calculations, APIs, comments, newsletter backend, generated PDFs, strict CSP, service worker, and offline support are deferred. Browser Print / Save as PDF is the supported export path.

## 24. Add a calculator

1. Mirror an established calculator module and define explicit input/result types.
2. Add validation independently from the pure calculation and schedule functions.
3. Add URL-state parsing/serialisation only for recognised validated inputs.
4. Add definition, knowledge content, client UI, route, registry entry, and related links.
5. Add formula, example, FAQs, metadata, canonical, and focused tests.
6. Run all validation commands and manually inspect calculation, sharing, chart, schedule, print, mobile, and keyboard behaviour.

## 25. Add a blog or guide

Follow [CONTENT-GUIDE.md](CONTENT-GUIDE.md): reuse central taxonomy/author objects, create structured sections, use a real version-controlled publication date, link only to live routes, keep new work draft until reviewed, and validate public exclusions before publishing.
