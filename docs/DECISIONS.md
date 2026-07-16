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

## 21. GST remains user-selected arithmetic, not classification logic

- Status: Accepted.
- Context: GST rate classification and place-of-supply treatment depend on current law and transaction facts that a generic percentage calculator cannot safely infer.
- Decision: Centralize common arithmetic presets and official source records, allow a custom rate, and require the user to select add/remove mode and intra/inter-State arithmetic. Do not determine a rate, place of supply, invoice compliance, credits, returns, or filing obligations.
- Consequences: The tool can transparently add or remove an entered percentage and display tax heads without presenting legal or tax advice. Users must verify applicability externally.
- Revisit trigger: A separately approved, source-maintained regulatory product with legal review and a defined update owner is proposed.

## 22. Sprint 33 security and privacy audit accepted

- Status: Accepted.
- Context: Before further public-launch work, the codebase needed an independent security and privacy audit covering dependency vulnerabilities, secret exposure, the `/calculators/demo` route's production reachability, HTTP security headers, data-privacy posture, cookie/storage usage, and input-sanitization safety across all calculators — followed by an independent re-verification pass against live system behaviour rather than the audit's own prose.
- Decision: Accept the audit's findings as the current security/privacy baseline. No code changes were required; every substantive claim was independently reproduced against real system behaviour (live HTTP responses, the full built HTML, complete git history, and exhaustive per-file review of every calculator's URL-state parsing and every `dangerouslySetInnerHTML` usage, not a sample). See docs/PRODUCTION-CHECKLIST.md section 25 for the itemized outcome.
- Consequences: `npm audit`'s 19 moderate findings are confirmed non-production, already-latest-version, and non-fixable without a breaking change; documented for re-check on future `lighthouse`/`next` bumps rather than acted on now. Three items remain open for a product/legal decision, not a code fix: whether the privacy policy should reference India's DPDPA, 2023; whether/how to disclose that "Copy share link" (decision 11) encodes entered values in plain text in the URL; and whether to invest in CSP nonce infrastructure (decision 18).
- Revisit trigger: Any of the three open items is resolved, or a future dependency/version bump changes the `npm audit` findings.

## 23. Static export for Hostinger deployment

- Status: Accepted.
- Context: Hostinger's shared hosting plans serve static files only (Apache/LiteSpeed) and do not run a Node.js process, so `next start` cannot be hosted there. The site has zero `app/api` routes, no middleware, no ISR/`revalidate`, and no Server Actions (confirmed by grep as part of the Sprint 34 audit), so it already builds entirely as static/SSG output.
- Decision: Add an opt-in `output: 'export'` build mode, gated behind a `STATIC_EXPORT` environment variable rather than always-on, producing an `out/` directory for direct upload to `public_html`. `trailingSlash: true` is enabled only in that mode, so exported routes emit `folder/index.html` and resolve cleanly under Apache's default directory handling without requiring `mod_rewrite`. `next.config.ts`'s `headers()` remains configured but is inert under export (confirmed by Next.js's own build warning); `public/.htaccess` (passed through into the export) is the actual production enforcement of the Sprint 33 security headers, plus a `ForceType image/png` fix for the three extensionless `next/og` icon routes and an `ErrorDocument 404` directive for the custom not-found page. See docs/DEPLOYMENT.md for the full audit, the `.htaccess` contents, and the upload process.
- Consequences: `next dev`, `next build`, and `next start` are unaffected and keep working for local development, CI, and the existing Playwright suite (which starts a real Next server and cannot run against a static export without a separate static-file-server profile — not built in this sprint). `app/icon.tsx`, `app/apple-icon.tsx`, `app/opengraph-image.tsx`, `app/manifest.ts`, `app/robots.ts`, and `app/sitemap.ts` each needed `export const dynamic = "force-static"` to build under export mode; this is a permanent, mode-independent fix applied outside the `STATIC_EXPORT` conditional. Client-router prefetch of RSC "segment" payloads produces benign, non-blocking 404s in the browser console under static hosting (Next writes the payload to a nested path that doesn't match the flat path the client requests) — verified that actual page loads and click-driven navigation are unaffected; documented as an accepted, unresolved cosmetic limitation rather than fixed with a speculative Apache rewrite.
- Revisit trigger: Hostinger hosting is replaced with a Node-capable runtime (the Node build path already works unchanged), or a future Next.js version changes its segment-prefetch static-export output in a way that closes the path mismatch.

## 24. Versioned-by-financial-year config for the income tax engine

- Status: Accepted.
- Context: Sprint 24 built a standalone Indian personal income tax calculation engine (`lib/tax/`) covering old vs new regime slabs, standard deduction, Section 87A rebate with marginal relief, tiered surcharge with marginal relief, and cess. Every one of these figures changes at the discretion of a Union Budget, typically once a year, and a wrong tax figure is a more consequential bug than a wrong figure from any other calculator on the site — it is realistic for a user to file a return based on it.
- Decision: Store every rate, threshold, and cap in a typed `TaxRuleSet` per financial year (`lib/tax/rules/fy2025-26.ts`), registered by FY string in `lib/tax/rules/index.ts`, rather than as constants inline in the calculation engine. `lib/tax/engine.ts` (`computeSlabTax`, `computeRebate87A`, `computeSurcharge`, `computeCess`, `calculateIncomeTax`, `compareRegimes`) reads only from the resolved `TaxRuleSet` and contains no year-specific numbers itself. Every numeric constant carries an inline comment citing the specific statutory provision it represents, per decision 20.
- Consequences: A future Budget can be supported by adding a new `fyYYYY-YY.ts` file and registering it, without touching or re-testing calculation logic — and a past year's ruleset stays immutable and auditable for anyone re-deriving an old return. This creates a standing maintenance obligation: someone must add and verify a new FY ruleset against the enacted Finance Act text every year, ideally by ~April when the new financial year begins (see `lib/tax/rules/README.md` for the verification checklist and the current ruleset's confidence caveat — it is drafted from public Budget 2025 summaries and still needs bare-Act verification before Sprint 25 exposes it in a calculator UI). No UI, route, or persistence was added in this sprint; this is calculation-and-types only, unit-tested in isolation.
- Revisit trigger: A financial year lapses without its ruleset being verified or added, or a future Budget changes the shape of a rule (not just its numbers) in a way the current `TaxRuleSet` type cannot express.
