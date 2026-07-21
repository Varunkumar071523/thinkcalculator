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

## 25. GA4 analytics and Search Console verification, gated to production only

- Status: Accepted.
- Context: Sprint 33's audit (decision/checklist section 25) left three open items; this sprint resolves one of them — whether the privacy policy should reference India's Digital Personal Data Protection Act (DPDPA), 2023 — by adding real analytics for the first time and deciding how to disclose it. A privacy-first alternative (e.g. a self-hosted, cookie-less analytics tool) was considered, but GA4 was chosen because it needs no additional infrastructure or ongoing hosting cost consistent with the site's zero-backend, static-export posture (decision 23), and because Search Console's own performance/coverage reporting (also in scope this sprint) is independent of which analytics tool is used, so it doesn't drive the choice either way. The tradeoff is accepted explicitly: GA4 sets its own first-party-context cookies and sends visitor IP/device data to Google, which the privacy policy now discloses.
- Decision:
  - **No PII to analytics, structurally, not just by convention.** No custom GA4 events are added in this sprint — only GA4's own default `page_view` hit. `components/analytics/google-analytics.tsx` never reads calculator state; it only ever receives a static measurement ID string. This means there is no code path anywhere in the app that can pass a calculator input value to `gtag`/`dataLayer`, verified by a Playwright test (`tests/e2e/analytics.spec.ts`) that fills a calculator and inspects `window.dataLayer` for the entered value. The audit also caught a real, non-obvious vector: every calculator's "Copy share link" action encodes entered values into a URL query string (decision 11), and GA4's default `page_view` sends the full `location.href` — so a recipient opening someone else's shared link would otherwise leak that person's calculator values to Google as part of the automatic hit, with zero custom tracking code involved. Fixed by explicitly overriding `page_location` to `origin + pathname` in the `gtag('config', ...)` call, dropping the query string unconditionally.
  - **Gating reuses the existing `STATIC_EXPORT` build-time flag** (decision 23) rather than `NODE_ENV`, via `lib/analytics-config.ts`. `next build` for local dev and for the Playwright e2e suite (`package.json`'s `test` script) also runs with `NODE_ENV=production`, so `NODE_ENV` alone cannot distinguish a real Hostinger production build from a test build — but `STATIC_EXPORT=true` is only ever set by `scripts/build-export.mjs`, exclusively the production deploy path. GA4 only loads when `STATIC_EXPORT=true` **and** `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set, so an accidental flag without an ID still injects nothing. The script itself loads via `next/script` with `strategy="afterInteractive"` (not `beforeInteractive`), so it cannot block first paint/interactivity, consistent with the Sprint 32 performance work.
  - **Search Console uses the meta-tag verification method**, not the HTML-file method, via Next's built-in `metadata.verification.google` field (`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` env var). The HTML-file method would require a dynamically-named file inside `public/` per verification token, which static export's build-time-only file copying makes clumsy; the meta tag is baked into every page's `<head>` at build time with zero extra routes or files, and Next's metadata API already supports it directly (consistent with the AGENTS.md rule to use Next's metadata APIs). Unlike analytics, this is not gated on `STATIC_EXPORT` — a verification meta tag is inert (it does nothing until Google's own crawler fetches the live domain) and is harmless to include in every build.
  - **Disclosure, not a consent gate.** The DPDPA's substantive consent/notice/security obligations are not yet in force as of this sprint (researched at write time: the Digital Personal Data Protection Rules, 2025 were notified 2025-11-13, but only stood up the Data Protection Board; consent-manager provisions activate 2026-11-13, and the consent/notice/security provisions that would actually govern something like analytics cookies do not take effect until 2027-05-13). Whether IP-only, no-PII analytics like GA4 even constitutes "personal data processing" requiring consent under the Act, once those provisions are live, is a genuinely unsettled question with no settled precedent yet. Given that ambiguity, and consistent with Sprint 33's DPDPA posture, the project errs toward disclosure now rather than waiting for the 2027 deadline or for the question to be settled: the privacy policy (`app/privacy-policy/page.tsx`) now names GA4 explicitly, states what it collects (IP, device/browser info, page views), and states plainly that calculator input values are never sent to it; a short, non-blocking, non-dismissible notice (no cookie banner, no accept/reject buttons, no new cookie/localStorage usage of our own to remember a dismissal) appears in the site footer whenever analytics is actually enabled, linking to the privacy policy — matching the existing DPDPA statement's placement (page content, not a modal) rather than introducing a separate consent UI pattern.
- Consequences: Analytics can be enabled or disabled per-environment purely via environment variables, with no code change and no risk of leaking into non-production data — verified by an automated Playwright assertion, not just a manual check. The existing "zero analytics or tracking scripts anywhere in the codebase" line in `docs/PRODUCTION-CHECKLIST.md` section 25 is now out of date now that this sprint adds one; that checklist is updated in the same sprint rather than left silently stale. Bing Webmaster Tools (checklist section 20) remains explicitly out of scope and unaddressed.
- Revisit trigger: The DPDPA's May 2027 substantive provisions come into force (re-evaluate whether disclosure-only remains sufficient or a consent mechanism becomes required), or custom event tracking is proposed (re-audit for PII at that time, per the standing rule established here), or GA4 is replaced with a different analytics tool.

## 26. EPF and NPS extend existing chart primitives instead of introducing a new bespoke chart component

- Status: Accepted.
- Context: Sprint N added two clean-slate calculators — EPF and NPS — neither of which fit the generic two-series `GrowthLineChart` pattern already used for SIP/PPF-shaped calculators. EPF's yearly breakdown is genuinely 3-way (employee contribution, employer contribution, interest), and NPS needed to show both a static asset-allocation split (equity / corporate debt / govt securities) and a time-series accumulation. The brief asked for a component-architecture checkpoint before finishing: compare the two calculators' actual chart shapes, and either share one new component or build two separate one-off components, per the existing "per-calculator bespoke layouts preferred over forced shared abstractions" principle.
- Decision: Neither outcome was taken literally. `components/calculators/yearly-bar-chart.tsx`'s `series` prop was widened from a fixed 2-tuple to a `2-tuple | 3-tuple` union (Chart.js already stacks an arbitrary number of datasets given `stack: "yearly"`, so no rendering logic changed) — EPF's 3-way stacked bar is this same shared component, not a fork. `components/calculators/simple-donut-chart.tsx`'s `items` prop was similarly widened to `2-tuple | 3-tuple`, and its per-segment SVG arc math was generalized from a special-cased 2-item layout (a full circle underneath, a partial arc on top) to a cumulative-offset technique that produces the identical output for 2 items and extends cleanly to 3 — NPS's allocation donut is this same shared component. NPS's growth line reuses `GrowthLineChart` from `growth-area-chart.tsx` completely unchanged; the only NPS-specific behavior is that the accumulation loop compounds at a *blended* rate derived from the three asset-class returns weighted by their allocation share (`computeBlendedAnnualReturn` in `calculate-nps.ts`), which is what actually ties the donut and the line together rather than placing them side by side decoratively. Both new calculators compose these shared primitives directly inside their own `.tsx` file (`epf-calculator.tsx`, `nps-calculator.tsx`), matching how every existing calculator (EMI, PPF, retirement corpus) already composes `YearlyBarChart` + `SimpleDonutChart` + `GrowthLineChart`-family components without a wrapper component around them.
- Consequences: No new chart component file was created. Every existing 2-series/2-item caller (EMI, PPF, retirement corpus, SIP, lumpsum, FD, RD, GST, home loan eligibility, SWP, step-up SIP) keeps type-checking and rendering unchanged — verified by the full existing test suite passing unmodified plus new unit tests for the widened pure logic (`buildStackedDatasets`, `computeDonutSegments` in `components/calculators/__tests__/`) covering the 2-way, 3-way, zero-total, and 100%-to-one-segment cases. The practical effect is a smaller diff and less code than either checkpoint outcome the brief posed as the choice: EPF and NPS did not need a bespoke chart component of their own, only a bespoke *composition* of chart primitives already proven general enough to extend.
- Revisit trigger: A future calculator needs a 4+-way stacked bar or donut, a non-percentage-based donut denominator, or a growth line that itself needs a 3-way split (not just a blended input rate) — at that point, re-evaluate whether the tuple-union widening approach still holds or a more general `readonly Series[]` array type (with a runtime length assertion) is warranted instead.
