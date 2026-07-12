# Architecture Decision Log

Statuses reflect the current platform and may be revisited when their triggers occur.

## 1. Next.js App Router

- Status: Accepted.
- Context: Public pages need routing, metadata, static generation, and selective interactivity.
- Decision: Use the Next.js App Router and its current documented conventions.
- Consequences: Layout, metadata, route params, and rendering follow Next.js; upgrades require checking bundled version-specific docs.
- Revisit trigger: A platform limitation blocks a validated product requirement.

## 2. TypeScript throughout

- Status: Accepted.
- Context: Financial inputs, results, registries, and content need explicit contracts.
- Decision: Use strict TypeScript for application code and avoid undocumented `any`.
- Consequences: More deliberate modelling and earlier failures; some added type definitions.
- Revisit trigger: None expected, except isolated third-party interoperability.

## 3. Tailwind CSS v4 and shadcn UI

- Status: Accepted for Version 1.
- Context: The site needs reusable, accessible primitives and responsive styling.
- Decision: Use Tailwind v4 with shadcn Base/Nova conventions.
- Consequences: Consistent tokens and local components; upgrades must be reviewed for breaking changes.
- Revisit trigger: Maintenance, accessibility, or bundle cost becomes unacceptable.

## 4. Static generation for public content

- Status: Accepted.
- Context: Public data is version-controlled and rarely changes at request time.
- Decision: Pre-render public routes where practical and generate editorial slugs from published registry items.
- Consequences: Fast crawlable output and fewer runtime dependencies; publishing requires a build.
- Revisit trigger: Frequently changing or personalised content becomes a core requirement.

## 5. No PostgreSQL in Version 1

- Status: Accepted for Version 1.
- Context: No current feature requires persistent user-generated data.
- Decision: Do not introduce PostgreSQL or another application database.
- Consequences: Lower operational and security overhead; content changes flow through Git.
- Revisit trigger: Accounts, saved calculations, workflows, or high-frequency editorial administration are approved.

## 6. Registry-based calculators and editorial content

- Status: Accepted for Version 1.
- Context: Definitions, taxonomy, metadata, links, and status benefit from typed review.
- Decision: Keep immutable registries in source control.
- Consequences: Strong compile/test checks and atomic reviews; non-developers cannot publish independently.
- Revisit trigger: Editorial volume or permissions justify a CMS migration.

## 7. Pure calculation functions

- Status: Accepted.
- Context: Formula correctness must not depend on UI or browser behaviour.
- Decision: Calculation functions accept typed input and return structured numeric results without formatting, mutation, network, rendering, or browser state.
- Consequences: Straightforward tests and reuse; presentation performs formatting separately.
- Revisit trigger: None expected.

## 8. Validation separate from calculation

- Status: Accepted.
- Context: User input is untrusted while calculation functions should have clear preconditions.
- Decision: Validate and normalise before invoking pure calculations.
- Consequences: Explicit error handling and stable formula code; callers must respect the boundary.
- Revisit trigger: A shared schema approach materially simplifies the boundary without coupling UI and maths.

## 9. Server Components by default

- Status: Accepted.
- Context: Most layouts and content do not require browser state.
- Decision: Render with Server Components unless browser-only behaviour is necessary.
- Consequences: Less client JavaScript; component boundaries must be deliberate.
- Revisit trigger: A user interaction cannot be cleanly isolated.

## 10. Minimal Client Components

- Status: Accepted.
- Context: Calculators, clipboard, print, URL state, and mobile menus require events.
- Decision: Keep client boundaries at the smallest coherent interactive feature.
- Consequences: Better static delivery with some prop/interface discipline.
- Revisit trigger: Excessive boundary complexity outweighs bundle savings.

## 11. Query parameters for shareable calculator state

- Status: Accepted.
- Context: Users need reproducible calculator inputs without accounts.
- Decision: Parse, validate, and serialise recognised inputs in query parameters.
- Consequences: Shareable links and no persistence backend; sensitive inputs must never be introduced casually.
- Revisit trigger: State exceeds safe, understandable URLs or saved accounts are approved.

## 12. Canonical URLs exclude queries

- Status: Accepted.
- Context: Input combinations are not separate editorial pages.
- Decision: Canonical metadata identifies the calculator path without query parameters.
- Consequences: Reduced duplicate indexing while shared URLs still work.
- Revisit trigger: A query-backed route intentionally becomes a stable indexable resource.

## 13. Vitest for unit testing

- Status: Accepted for Version 1.
- Context: Pure TypeScript logic and registry invariants need fast automated checks.
- Decision: Use Vitest for calculation, state, content, and configuration tests.
- Consequences: Fast focused coverage; browser-level behaviour still needs manual or future E2E testing.
- Revisit trigger: Cross-browser regressions justify an E2E framework.

## 14. No external chart library

- Status: Accepted for Version 1.
- Context: Current visualisations are simple and require accessible textual equivalents.
- Decision: Use lightweight local CSS/SVG/HTML charts.
- Consequences: Small dependency footprint; complex charting would require more local work.
- Revisit trigger: Approved visualisations exceed maintainable local primitives.

## 15. Browser Print / Save as PDF

- Status: Accepted for Version 1.
- Context: Users need portable results without server-generated documents.
- Decision: Support browser printing and Save as PDF instead of adding a PDF dependency.
- Consequences: Low complexity; exact output varies by browser and needs print testing.
- Revisit trigger: Branded, deterministic, or legally formatted documents become required.

## 16. No MDX or CMS yet

- Status: Accepted for Version 1.
- Context: The initial editorial set is small and structured.
- Decision: Store typed content directly in TypeScript.
- Consequences: Strong structure and no parsing pipeline; authoring requires code review.
- Revisit trigger: Content volume, author access, or rich formatting needs materially change.

## 17. No service worker or offline support

- Status: Accepted for Version 1.
- Context: Offline caching adds update and debugging complexity without a validated requirement.
- Decision: Do not register a service worker.
- Consequences: Simpler deployments; the application requires normal network access.
- Revisit trigger: Measured user need for reliable offline calculation.

## 18. Strict CSP deferred

- Status: Accepted for Version 1.
- Context: A strict policy must coexist with Next.js scripts, JSON-LD, images, clipboard, and print.
- Decision: Keep other security headers and defer strict CSP until a nonce-compatible policy is tested.
- Consequences: Avoids breaking current behaviour; leaves a defence-in-depth improvement outstanding.
- Revisit trigger: Before security hardening sign-off or when deployment supports a validated nonce strategy.

## 19. Draft content excluded publicly

- Status: Accepted.
- Context: In-progress content must not be discoverable or indexable.
- Decision: Exclude drafts from lists, related results, sitemap, static params, and public routes; noindex metadata is a defence for any non-public use.
- Consequences: Safe staged content with explicit publication status.
- Revisit trigger: A preview system with authentication is approved.

## 20. Official sources for regulatory claims

- Status: Accepted.
- Context: Tax and regulatory facts change and can affect user decisions.
- Decision: Verify time-sensitive claims against primary official sources, record the effective date, and avoid unsupported thresholds or rates.
- Consequences: Slower but more defensible publishing; stale content needs review.
- Revisit trigger: Never remove the requirement; revisit only the review workflow.
