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

Server Components are the default. A Client Component is used only when browser state or events are required, such as calculator inputs, query-state synchronisation, clipboard actions, printing, or the mobile sheet. Calculation modules remain framework-independent.

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

- Calculators: `/finance/[calculator-name]-calculator`.
- Blogs: `/blog/[slug]`; guides: `/guides/[slug]`.
- Indexes: `/calculators`, `/finance`, `/blog`, and `/guides`.
- Glossary: `/glossary` and `/glossary/[slug]`.
- Calculator routes remain query-canonical: shareable input state may use a query string, while canonical metadata always identifies the clean path without query parameters.
- Missing, draft, or wrong-type editorial slugs return not found and are omitted from static parameters.

## 8. Calculator framework

The calculator registry supplies identity, route, category, inputs, metadata, formulas, examples, FAQs, status, and relations. Shared shells render common controls and results. Pure calculation functions accept typed input and return typed numeric results without formatting, rendering, network calls, browser state, or mutation. This separation makes financial logic independently testable and prevents UI changes from silently changing formulas.

## 9. Calculator module structure

A typical module contains `*-types.ts`, `*-schema.ts`, `calculate-*.ts`, optional schedule calculation, `*-url-state.ts`, `*-definition.ts`, `*-content.ts`, `*-knowledge-content.ts`, a client calculator component, an index, and focused tests. Presentation formatting occurs after calculation.

## 10. URL-state architecture

Each production calculator parses only recognised query keys, validates and normalises values, and serialises valid state. Invalid or incomplete values fall back safely. Sharing copies a query-bearing URL, but SEO canonical URLs exclude the query because inputs do not define separate indexable documents.

## 11. Schedules and charts

Schedule functions are pure and tested separately from headline calculations. Tables expose detailed rows semantically and contain horizontal overflow. Charts use lightweight CSS/SVG/HTML presentation rather than an external chart library, include textual values, and never rely on colour alone.

## 12. Knowledge-content framework

Calculator pages use typed, version-controlled knowledge content: sections, callouts, comparisons, references, internal navigation, formulas, examples, FAQs, and related learning links. No executable formulas or unrestricted HTML are stored as content.

## 13. Blog and Guide engine

`types/editorial-content.ts` defines immutable structured content. `features/content/content-registry.ts` currently contains four published items and one draft. Reusable Server Components render headers, metadata, table of contents, paragraphs, lists, tables, callouts, FAQs, authors, related calculators, and related editorial content.

## 14. Content registry architecture

Calculators and editorial items are registry-based and version-controlled so a code review can inspect facts, links, metadata, status, and presentation together. A Version 1 database would add migrations, runtime availability, security, backups, and administration without serving a current persistence requirement. Drafts remain in source for review but are excluded from public lists, relations, sitemap input, static parameters, and indexable metadata.

The glossary follows the same pattern through a separate typed registry. Published terms provide a plain definition, substantive structured sections, calculation context, examples, and relations to live calculators and editorial pages. Dynamic glossary segments use static parameters with `dynamicParams = false`; drafts are excluded from routes and sitemap. Visible term pages use factual `DefinedTerm` structured data linked to the public glossary set.

## 15. SEO architecture

`lib/seo.ts` centralises canonical URL, page, calculator, editorial, Open Graph, and Twitter metadata. Root metadata supplies the site defaults. `app/sitemap.ts` combines stable routes, published calculators, and published editorial entries; `app/robots.ts` exposes crawl rules. There is no `SearchAction` because no stable public search route exists.

## 16. Structured data

Only visible, factual data is encoded. The root uses Organization and WebSite data. Editorial pages use BlogPosting or Article and useful FAQ data. Calculator and breadcrumb schema is used where supported by visible content. Ratings, review counts, fake credentials, fake images, and unsupported claims are prohibited.

## 17. Testing strategy

Vitest covers calculations, validation boundaries, URL state, schedules, registries, content integrity, production configuration, and draft/link exclusions. Tests avoid snapshots in favour of explicit behaviour and invariant checks. The current freeze baseline is 153 passing tests across 19 files.

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
