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

## 27. Capital Gains keeps STCG/LTCG rates as a single feature-local config, not the FY-versioned tax-rules registry

- Status: Accepted.
- Context: Sprint N added a Capital Gains calculator for STT-paid listed equity shares and equity-oriented mutual funds (sections 111A/112A), needing three current statutory figures — the 20% STCG rate, the 12.5% LTCG rate, and the ₹1,25,000 annual LTCG exemption — plus the separate pre-31-January-2018 grandfathering cost-basis rule. The brief explicitly asked for a deliberate choice between the `lib/tax/rules` FY-versioned `TaxRuleSet` registry (decision 24) and a single-constant feature-local config like `ppf-rate-config.ts`, rather than defaulting to either without checking the shape of the data.
- Decision: Follow the gratuity/leave-encashment single-constant-plus-cited-sources pattern (`capital-gains-regulatory-config.ts`), not the FY-versioned registry, and not EPF/PPF's user-editable illustrative-assumption pattern. The FY registry exists for a computation with several parameters that are genuinely interdependent and vary release-to-release within one financial year's rules (old/new regime slab bands, a rebate threshold, and a tiered surcharge schedule read together); `lib/tax/rules/README.md` already documents the 111A/112/112A special-rate surcharge cap as explicitly out of scope for that engine, i.e. capital gains was always meant to be a separate, smaller regulatory surface rather than an extension of it. All three of this calculator's figures were set together by one enactment (the Finance (No. 2) Act, 2024, effective 23 July 2024) and there is no need to ever look up a *different* financial year's value to perform a computation — structurally identical to gratuity's ₹20 lakh ceiling and leave encashment's ₹25 lakh limit. The independent pre-2018 grandfathering cutoff date is tracked in the same config file rather than a second module, since it is the same "one current, rarely-revisited figure" shape, just affecting cost basis instead of the tax rate.
- Consequences: A future Budget that changes the STCG rate, LTCG rate, or exemption cap only requires editing this one file's constants (with its own revisit-trigger note), with no change to `calculate-capital-gains.ts`, `capital-gains-fifo-matcher.ts`, `capital-gains-grandfathering.ts`, or `capital-gains-tax.ts`, all of which read only from the config. If a future Budget instead makes these figures independently variable by financial year (e.g. a transition-year blended rate), this decision should be revisited in favor of a `lib/capital-gains/rules` FY-versioned registry mirroring `lib/tax/rules`.
- Revisit trigger: A future Budget changes the *shape* of this calculator's rules (independently-varying-by-year rates/exemption) rather than just their numbers, or a second calculator needs to share these same constants across a different FY-dependent computation.

## 28. Capital Gains introduces the site's first repeatable multi-row input and its first date input, both as new local/shared primitives rather than forcing existing patterns

- Status: Accepted.
- Context: Capital Gains needed a user-editable list of purchase lots (add/remove rows, each with a purchase date, units, cost per unit, and a conditionally-required fair-market-value field) and, for the first time on this site, a calendar-date input — every existing calculator's inputs are numbers or fixed-option selects. A codebase-wide search before this sprint confirmed no existing repeatable-row UI pattern (add/remove a structured row) anywhere in the app, and no existing date-type input component.
- Decision: Two separate, deliberately-scoped additions rather than one large generalized system. (1) `components/calculators/calculator-date-input.tsx` is a new small shared primitive mirroring `calculator-number-input.tsx`/`calculator-select-input.tsx` exactly — same `CalculatorField`/`aria-describedby` wiring, same prop shape convention — added as a shared component because it is a generic, calculator-agnostic leaf control any future date-taking calculator can reuse unchanged, not something specific to capital gains. (2) The repeatable lot-row list itself (add/remove chrome, per-row field layout, the conditional FMV field revealed only for pre-cutoff lots) is built directly and only inside `capital-gains-calculator.tsx`, per AGENTS.md's preference for per-calculator bespoke layouts over forced shared abstractions — with no second calculator needing a repeatable row yet, a generic `RepeatableRowList` shell would be speculative generalization from a single caller, which AGENTS.md and this project's non-negotiables both caution against.
- Consequences: No existing shared component (`SimpleDonutChart`, `FAQSection`, `PairedNumberSliderInput`, `CalculatorNumberInput`, `CalculatorSelectInput`, `CollapsibleSection`) was modified — verified by the full pre-existing test suite passing unchanged (1,182 tests, 114 files) and a build that regenerates every other calculator's route unaffected. `SimpleDonutChart` is reused completely unmodified for the LTCG exempt-vs-taxable split (a clean 2-way case, per the brief's instruction to flag rather than force a fit — this one fit directly, no forcing needed). If a second calculator later needs a repeatable-row list (e.g. multiple loans, multiple dependents), extract the list chrome from `capital-gains-calculator.tsx` into a shared primitive at that point, informed by two real call shapes instead of guessing at one.
- Revisit trigger: A second calculator needs an add/remove row list, at which point extract the shared chrome; or a future calculator needs a date-range or datetime input, at which point widen `CalculatorDateInput` or add a sibling component depending on how similar the shape turns out to be.

## 29. Windows `run-e2e.mjs` teardown hang: structural fix (never let Playwright own the server) plus a process-tree regression test

- Status: Accepted.
- Context: `node scripts/run-e2e.mjs` on Windows used to hang after the Playwright test run finished, never returning control to the shell. The structural fix landed in commit `8b65939` (2026-07-18), but went undocumented in this file and in PROJECT.md for six days and four intervening sprints (EPF/NPS, Leave Encashment, EPS Pension, Capital Gains) — this sprint's own investigation found no evidence in any of those sprints' commits, PRs, or `PRODUCTION-CHECKLIST.md` entries that the hang actually recurred against the fixed script, so that claim from this sprint's original brief could not be corroborated and is not repeated here. What is confirmed: `CLAUDE.md`'s incident bullet (added 2026-07-22, four days after `8b65939`) described the already-superseded manual `Stop-Process` workaround as current guidance from the moment it was written, not as something that later went stale — evidence that the fix's existence simply hadn't been checked before that note was authored. The actual root cause: Playwright's own `webServer` plugin spawned `next start` itself (via a shell command string) and, on teardown, signaled that process and waited synchronously for it to exit — but Windows has no real signal delivery, so a process can fail to act on a soft-kill request the way it reliably would on POSIX, and Playwright's wait never resolved. A now-dead prior attempt at a fix tried to detect "the run is done" by parsing `list`-reporter stdout for TAP-style `ok`/`not ok` lines that reporter never emits, so its force-kill safety net could never arm either.
- Decision: Stop letting Playwright spawn or own the server at all, rather than trying to detect-and-kill a hang after the fact. `scripts/run-e2e.mjs` now starts `next start` itself directly with `node` (no `npx`/`.cmd` shell layer in between, so the PID held is the real server process), polls it over real HTTP until it responds, and only then runs `playwright test` with `webServer.reuseExistingServer: true` unconditionally (`playwright.config.ts`). Seeing the URL already answering, Playwright's webServer plugin takes its "already available" fast path and never spawns or owns a process, so its teardown has nothing to wait on and cannot hang — the Windows signal-delivery problem is sidestepped structurally instead of patched around. This script's own teardown, once `playwright test` itself exits, uses `taskkill /PID <pid> /T /F` (`/T` recurses to the full process tree) rather than a bare `process.kill()`, which only signals the one PID it's given. The one exported piece of this, `killProcessTree`, is now covered by `scripts/__tests__/run-e2e-teardown.test.ts`: it spawns a real two-level process tree (a child that spawns a `detached: true` grandchild, deliberately detached so it isn't cleaned up for free by Node's own Windows job-object bookkeeping) and asserts `killProcessTree` reaps both within a bounded time. Reverting `killProcessTree` to a bare `process.kill(pid)` was confirmed to make this test fail (the grandchild survives), so the test actually pins down the fix rather than passing vacuously.
- Consequences: `node scripts/run-e2e.mjs` (and the `npm test` / `npm run test:e2e` scripts that call it) now reliably returns control to the shell on Windows whether the run passes, fails, or is interrupted (`SIGINT`/`SIGTERM` handlers call the same `killProcessTree` + `killPort` cleanup) — verified by running the full suite twice back to back with no manual process intervention between runs. The non-Windows branch of `killProcessTree` still uses a plain `process.kill(pid, "SIGKILL")` rather than a tree-walk; that remains correct there because this script only ever directly spawns one `next start` process on any platform, with no shell layer in between that could itself fork an untracked grandchild.
- Revisit trigger: A future change makes this script spawn `next start` (or anything else it owns) via a shell wrapper again on any platform, at which point the POSIX branch of `killProcessTree` would also need to become tree-aware.
## 30. Site-wide FAQ search widget: build-time-evaluated module (not an emitted JSON file), Fuse.js with a strict-token-AND match, and category-agnostic guide indexing

- Status: Accepted.
- Context: Sprint 41 needed a client-side chat-style search widget covering every calculator's FAQs, every calculator's worked example, and the Sprint 38 Loans guide's sections, with zero backend and zero runtime network calls, wired into the root layout so it renders on every page. The sprint brief allowed either "a build-time script" or "a module evaluated at build time" for the index. This codebase already has a directly comparable precedent: `features/content/editorial-search.ts`'s `createEditorialSearchDocuments()` is a pure function called once at module scope in a Server Component and passed as a prop into a client component (`components/search/resource-search.tsx`) — no file is written to disk, no fetch happens at runtime, and the data still ends up fully static because Next serializes it into each static page's embedded RSC payload at build/export time.
- Decision: (1) Followed the existing precedent exactly rather than introducing a new `scripts/*.mjs`-writes-a-`.json` pattern: `features/faq-search/build-faq-search-index.ts` exports a pure `buildFaqSearchIndex()`, called once in `app/layout.tsx` (a Server Component) and passed as a `documents` prop into the new client `FaqSearchWidget`. Verified in the static export output (`out/finance/emi-calculator/index.html`) that the FAQ question text and widget markup are both embedded directly in the exported HTML — no separate JSON asset, no fetch. (2) Fuse.js is configured with `useTokenSearch: true, tokenMatch: "all"` (every query word must match somewhere) rather than the library's whole-phrase fuzzy default or a looser `tokenMatch: "any"`. A two-tier strict-then-loose fallback was prototyped and rejected: with ~150+ documents across three fields, a loose OR-across-words fallback reliably surfaced irrelevant hits even for deliberately-unrelated gibberish queries in testing, which directly undermines the spec's no-match-fallback requirement ("if nothing scores above a reasonable threshold, show a message pointing to the full calculator list instead of a weak/irrelevant match"). Precision was chosen over recall for that reason. (3) The guide-section indexer filters on `type === "guide"` only (blogs excluded, matching the brief), with no category filter — every published guide today happens to be Loans category (Sprint 38's `understanding-emi-fd-and-rd` and the earlier `how-to-use-emi-calculator`), so this reads as "index the Loans guides" today but requires zero code changes when Investments/Tax guides are published later, directly satisfying the brief's "keep the index generation logic separate... so it's easy to extend" requirement.
- Consequences: No existing shared component (`FAQSection`, `SimpleDonutChart`, `EditorialFAQ`, root layout's header/footer) was modified beyond one three-line addition to `app/layout.tsx` (import + index build + `<FaqSearchWidget />` render) — confirmed by the full pre-existing test suite passing unchanged (1,203 tests including the 20 new ones, 117 files) and a static export whose route list is identical to before this sprint. The widget uses Base UI's `Dialog` primitive (already a project dependency via `components/ui/sheet.tsx`), which gives focus-trap, Escape-to-close, and focus-return-to-trigger for free rather than hand-rolling that logic. A known limitation of strict AND-token matching: a query using vocabulary that literally never appears in the indexed text (e.g. "PPF worked example" when PPF's example is titled "PPF projection example" and its body never uses the word "worked") returns zero results and falls through to the no-match fallback rather than a near-miss. This was accepted as correct behavior per the spec's own preference for "no weak/irrelevant match" over a forced near-match, not a bug.
- Revisit trigger: If real usage data (once available) shows the strict-AND threshold is too unforgiving in practice — e.g. a meaningful share of no-match queries are near-misses a human would consider "found it" — revisit toward a scored fallback tier instead of the two-tier strict/loose approach that was tried and rejected here.
- Adversarial review follow-up: the widget's fixed-position classes (`z-[60]`, `bottom-[calc(1rem+env(safe-area-inset-bottom))]`, `w-[min(24rem,calc(100vw-2rem))]`) use arbitrary Tailwind values rather than design tokens, which AGENTS.md's styling rules generally discourage; this was reviewed and accepted as an intentional exception because no existing token in `app/globals.css` covers iOS safe-area-aware fixed positioning or a z-index above the Sheet component's `z-50`.

## 31. Blog listing pagination deferred; category filter chips built instead (Sprint 42)

- Status: Accepted.
- Context: Sprint 42 audited the blog data model before building listing UX. `features/content/content-registry.ts` holds exactly 2 published blog posts (a 3rd blog entry is an explicit `status: "draft"` fixture used to test draft-exclusion, not a real hidden post). Date, category, tag, linked-calculator, and read-time fields already existed on `EditorialContentItem` and were already populated for both posts — no schema change was needed. The enumeration layer (`getContentByType("blog")`) has no pagination params anywhere today.
- Decision: Do not build working pagination now. At 2 posts, page-1/page-2 controls would be pure ceremony with nothing on page 2. Instead: (1) ship a real (not fake) `components/blog/blog-pagination.tsx` that takes `currentPage`/`totalPages`/`onPageChange` and renders `null` whenever `totalPages <= 1`, wired into `components/blog/blog-listing.tsx` with `POSTS_PER_PAGE = 12` — so it activates automatically once post count crosses that page size, no future rewiring needed; (2) spend the UI budget on a category filter chip row (`components/blog/blog-category-filter.tsx`) instead, since the data already supports it and it's useful even at 2 posts (2 categories today: Loans, Investing). The filter row itself is hidden when fewer than 2 distinct categories exist, so it also degrades cleanly rather than showing a useless single-option filter.
- Consequences: `app/blog/page.tsx` now delegates its listing to a new client component tree under `components/blog/` (`blog-listing.tsx`, `blog-category-filter.tsx`, `blog-featured-post.tsx`, `blog-post-card.tsx`, `blog-pagination.tsx`) plus two new pure/testable helper modules (`features/content/blog-listing.ts` for category-option/filter logic, `features/content/related-posts.ts` for the separate related-posts feature below). No existing shared component (`EditorialCard`, `EditorialListing`, `FAQSection`, `SimpleDonutChart`, `CalculatorGrid`) was modified; the new filter chip visually matches `components/shared/calculator-grid.tsx`'s existing (unexported) `FilterChip` styling (`border-ink bg-ink text-white` active state) for consistency but is a separate, blog-scoped copy rather than a shared extraction, since the two chip sets differ in what they filter by and neither caller needs the other's shape.
- Revisit trigger: Published blog post count approaches `POSTS_PER_PAGE` (12) — at that point `BlogPagination` will already start rendering automatically; if 12 turns out to be the wrong page size, adjust the constant in `components/blog/blog-listing.tsx`, no structural change needed.

## 32. Derived "related blog posts" kept separate from the existing authored `relatedContent`/`ClusterNavigation` system (Sprint 42)

- Status: Accepted.
- Context: Sprint 42 needed a "related posts" block: same-category match primary, shared-linked-calculator match as fallback, degrading gracefully to nothing when 0 or 1 result exists. The codebase already has an authored, manually-curated related-links mechanism (`EditorialContentItem.relatedContent` + `relatedCalculators`, rendered via `ClusterNavigation` inside the shared `EditorialLayout`, used by both blog posts and guides). That existing system is hand-picked per item, not derived from category/calculator overlap, and `EditorialLayout` is shared between the `blog` and `guide` content types.
- Decision: Build the derived matching as a new, separate pure function `getRelatedBlogPosts()` in `features/content/related-posts.ts` (same-category first, shared-calculator-href fallback, `type: "blog"` only, excludes the current item, returns `readonly EditorialContentSummary[]`), and render it via a new isolated component `components/blog/related-blog-posts.tsx`. This component is rendered as a sibling after `<EditorialLayout item={item} />` directly in `app/blog/[slug]/page.tsx` — not inside `EditorialLayout` itself — so the shared layout used by `/guides/*` routes is completely untouched and guides render byte-for-byte as before.
- Consequences: `EditorialLayout`, `ClusterNavigation`, `EditorialRelatedContent`, and `EditorialRelatedCalculators` were not modified. The new component returns `null` when `getRelatedBlogPosts()` returns zero results (true for both live posts today, since Loans/Investing don't share a category and EMI/SIP/Lumpsum don't share a linked calculator), and switches from a 2-column to a 1-column grid when exactly one result exists, so neither empty nor single-result states produce a visibly broken layout. Because only `app/blog/[slug]/page.tsx` renders it, `/guides/*` pages have no related-posts block; this is intentional scope discipline for this sprint, not an oversight.
- Revisit trigger: If guides later want the same derived-related treatment, generalize `getRelatedBlogPosts()` to accept a content type parameter rather than duplicating the logic — do not achieve it by moving the render call into shared `EditorialLayout`, since that would reintroduce the coupling this decision deliberately avoided.
- Known coverage gap (adversarial review, Sprint 42 follow-up): the shared-calculator fallback branch is only exercised in unit tests against synthetic fixtures — with just 2 live posts and no real same-calculator/different-category pair in the actual registry, there isn't enough live data to prove the fallback end-to-end; revisit test coverage once a third published post creates a genuine fallback case.

## 33. Sprint 43: `workers=2` tested and rejected as an e2e contention mitigation

- Status: Rejected (tested with data, not assumed).
- Context: Sprint 43 investigated a full 3-browser (chromium/firefox/webkit) Playwright run producing wildly inconsistent results across identical reruns (26 failed/5 flaky in one prior run, 0-4 hard failures with different flakes in another). Hypothesis: `workers=4` was oversubscribing this machine's CPU/memory across three real browser-automation workers hitting one shared `next start` dev server.
- Decision: Ran 3 full-suite runs (564 tests) at `workers=4` (baseline) and 3 at `workers=2` (after), same machine, same code, same commit. Baseline: 2F/4Flaky/558P (13.3m), 2F/4Flaky/558P (14.6m), 3F/2Flaky/559P (13.9m) — avg 3.3 flaky tests/run, avg 13.9 min. After: 2F/5Flaky/557P (17.2m), 2F/3Flaky/559P (14.1m), 2F/3Flaky/559P (15.0m) — avg 3.7 flaky tests/run, avg 15.4 min. `workers=2` produced same-or-worse flakiness and ~11% longer wall-clock time. Reverted to `workers=4` in `playwright.config.ts`.
- Consequences: Do not re-attempt lowering `workers` as a fix for this flakiness without new evidence — it was tried and measured, not just assumed to help. The flaky set in both configurations was exclusively bare `Test timeout of 30000ms exceeded` on firefox (16 instances across the 6 runs, no assertion-content mismatches, a different specific test each time) plus a timing-sensitive focus-trap check in `faq-search-widget.spec.ts` (webkit, 3 instances) — neither correlates with worker count on this machine. The 2 `print.spec.ts` EMI/Inflation failures were 100% deterministic across all 6 runs regardless of worker count, confirming they are an unrelated real app bug (see the Sprint 43 report), not part of this contention question.
- Revisit trigger: If this flakiness is later root-caused (e.g. profiling shows it's specific to firefox startup time under Playwright, or specific to this dev machine's background load), address the actual cause rather than worker count. See #34 for the interim mitigation in place while this stays open.

## 34. Sprint 43: `retries` bumped from 1 to 2 as a backstop for still-open item-3 flakiness, not a fix for it

- Status: Accepted (mitigation, not resolution).
- Context: Across the 6 full-suite runs measured in #33, one run (`workers=4` baseline run 3) had `faq-search-widget.spec.ts`'s webkit focus-trap check (`focus escaped the panel after 6 Tab press(es)`) fail on both its original attempt and its one retry — a genuine double-failure that `retries: 1` did not catch, even though every other flaky instance across all 6 runs passed within a single retry.
- Decision: Bumped `retries: 1 -> 2` in `playwright.config.ts`.
- Consequences: This is a deliberate backstop against the understood-but-unsolved firefox-timeout/webkit-focus-trap-timing flakiness from #33, not a fix for it. A green CI/verification run is not proof the underlying flakiness is gone — it means the backstop caught it.
- Revisit trigger: If the same test fails on all 3 attempts (original + 2 retries) in a future run, that graduates from "flaky" to "needs its own investigation" — do not just bump retries again; investigate per #33's revisit trigger instead.

## 35. Sprint 44: `CollapsibleSection` print reveal moved from a `matchMedia("print")` JS listener to CSS-only

- Status: **Superseded by #36.** The Sprint 44 initial pass only verified this against Chromium (the sole browser project `print.spec.ts` ran against at the time). A same-sprint cross-browser follow-up found the CSS-only approach does not work on WebKit at all, and reinstated a JS fallback — see #36 for what actually shipped. Left below unedited as the historical record of what was tried and why; do not read the "Decision"/"Consequences" text below as describing the current implementation.
- Context: Sprint 43 root-caused the `print.spec.ts` EMI/Inflation failures (#33/#34 explicitly excluded these as "an unrelated real app bug," not flakiness-from-contention) to a real, user-facing defect: `CollapsibleSection` defaults every instance closed, and revealing its content for print depended on a `useEffect` in `components/calculators/collapsible-section.tsx` that added a `window.matchMedia("print").addEventListener("change", ...)` listener to set `details.open = true`. That listener fires asynchronously and is not guaranteed to run before the browser computes the print layout, so the reveal was a race. `app/globals.css` already carried a `details:not([open])`/`::details-content` CSS override (added in `2fe04fd`, before Sprint 43) as what its comment called a fallback, but the JS was still the primary mechanism and still in the critical path. Sprint 44's audit found the bug's blast radius is not 2 calculators but structural: every one of the 17 calculators using `CollapsibleSection` (`EMI`, `SWP`, `Inflation`, `Step-up SIP`, `Retirement Corpus`, `SIP`, `Lumpsum`, `FD`, `RD`, `PPF`, `NPS`, `EPF`, `Capital Gains`, `Leave Encashment`, `EPS Pension`, `Home Loan Eligibility`, `Income Tax`) defaults its section closed and sits inside `[data-calculation-experience]`, so all 17 depend on this reveal working. `print.spec.ts` only exercised the bug for EMI/Inflation by accident: its `tableCount > 0` guard happened to skip SWP/Step-up SIP/Retirement Corpus, whose schedule section defaults to a chart view (zero `.calculator-table` elements in the DOM until the visitor clicks "View table"), so the identical latent bug in those three was invisible to the suite.
- Decision: Deleted the `useEffect`/`matchMedia` listener from `CollapsibleSection` entirely (and the now-unused `"use client"`, `useRef` that existed only to support it — the component needed no client JS for anything else, since `<details>`/`<summary>` open-close and the chevron rotation are both native/CSS already). Print reveal now relies solely on the pre-existing CSS in `app/globals.css`. This was verified empirically before committing to it, not assumed: with the JS listener temporarily stripped and only the CSS rule active, 3 full-suite `print.spec.ts` runs (retries=0) and 10 further single-test isolated reruns (2× each for all 5 tested calculators) were 100% green; a negative-control run with the CSS rule also temporarily disabled reproduced failures on all 5 calculators including the newly-covered SWP/Step-up SIP/Retirement Corpus, confirming both that the CSS alone is sufficient on this Chromium build and that the new test assertion actually exercises the bug rather than passing vacuously.
- Consequences: `components/calculators/collapsible-section.tsx` is simpler (pure function, no client boundary) and structurally fixes print reveal for all 17 calculators in one place, not per-calculator. `tests/e2e/print.spec.ts`'s `tableCount > 0` guard around the `data-calculation-experience` overlap checks was removed (that block now always runs) and a new unconditional check was added against a new `data-collapsible-content` marker (added to `CollapsibleSection`'s content `<div>`) asserting every collapsed section inside `[data-calculation-experience]` has a non-zero, visible bounding box in print — this is what closes the SWP/Step-up SIP/Retirement Corpus blind spot, since it doesn't care whether the revealed content is a table or a chart. The other 12 calculators sharing the same component are still not individually listed in `print.spec.ts` (unchanged sprint scope), but the fix that protects them is structural, not per-calculator, so they don't need to be.
- Revisit trigger: If a future browser/engine is added to the print test matrix (currently chromium-only for `print.spec.ts`) and doesn't support the `::details-content` pseudo-element, re-verify the plain-child `display: block !important` fallback rule (kept in `app/globals.css` specifically for that case) is still sufficient on that engine — it was not independently proven sufficient on its own in Sprint 44, only in combination with the `::details-content` override.

## 36. Sprint 44 follow-up: `CollapsibleSection` print reveal is CSS-primary with a hydration-safe JS fallback for WebKit

- Status: Accepted. Supersedes #35's "CSS-only" decision.
- Context: #35 was verified against Chromium only, since `print.spec.ts` ran against a single Playwright project during the initial Sprint 44 pass. A same-sprint follow-up explicitly re-ran the full verification (isolated reruns + a negative control) across all 3 configured projects (`playwright.config.ts`: chromium, firefox, webkit). Chromium and Firefox: 100% deterministic pass with CSS-only, matching #35's finding (chromium: 2 full-suite + 15 isolated single-test reruns, all green; firefox: 2 full-suite + 5 isolated reruns, all green). WebKit: 5/5 calculators failed deterministically across 2 isolated full-suite reruns with the JS listener fully removed — not flaky, plainly unsupported; WebKit does not reveal the collapsed content via the `details:not([open])::details-content` / plain-child `display` overrides at all, contradicting #35's assumption that the plain-child fallback might cover non-supporting engines on its own.
- Investigation: Reinstating the original `matchMedia("print")` listener (unchanged from pre-#35) fixed most but not all WebKit runs — 2/5, 3/5, 2/5 failures across 3 full-suite reruns, i.e. flaky, not fixed. A debug probe (temporary spec, deleted after use) that waited 500ms before `emulateMedia` and 1000ms after found every signal correct (`details.open === true`, `matchMedia("print").matches === true`, real non-zero bounding box) — proving the listener mechanism itself works on WebKit and eventually reaches a correct end-state, but something about the timing in the real test (which calls `emulateMedia` immediately after `goto`, no settle delay) was racing it. Root cause: `CollapsibleSection` is a `"use client"` component; a bare `mediaQuery.addEventListener("change", ...)` only reports *future* transitions — if the print media flips (via `emulateMedia` or, for a real user, an actual print action) before this component finishes hydrating and the effect registers the listener, that transition is missed permanently, since a `MediaQueryList` has no way to ask "did I miss a change while no one was listening." This is a hydration-timing race, not fundamentally an "event dispatch is slow" issue — and it plausibly explains the *original* pre-#35 Chromium/EMI/Inflation flakiness too, though CSS made that root cause moot for Chromium/Firefox before it needed to be isolated there.
- Decision: `components/calculators/collapsible-section.tsx`'s effect now does an immediate synchronous `mediaQuery.matches` check on mount (via a shared `applyPrintState` helper), in addition to registering the `change` listener for future transitions — closing the exact gap above regardless of which side of hydration the media flip lands on. CSS (`app/globals.css`, unchanged from #35) remains the primary, deterministic mechanism for Chromium/Firefox; the JS fallback is what makes WebKit work at all, and now also work *reliably*. Verified: 4 full-suite WebKit reruns (retries=0) after the fix — 20/20 green; 5 calculators × 2 isolated single-test reruns each — 10/10 green; Chromium and Firefox re-verified unaffected (full-suite + isolated, all green, matching #35's original numbers).
- Consequences: `collapsible-section.tsx` is `"use client"` again (reverting the #35 simplification) with `useRef`/`useEffect` restored — this is necessary, not incidental complexity, per the WebKit finding above. `tests/e2e/print.spec.ts` gained a second, lightweight `describe` block ("collapsed-section smoke coverage") covering the 12 calculators not in the original 5-calculator list (SIP, Lumpsum, FD, RD, PPF, NPS, EPF, Capital Gains, Leave Encashment, EPS Pension, Home Loan Eligibility, Income Tax): navigate, emulate print, assert `[data-calculation-experience] [data-collapsible-content]` count is nonzero (fails loudly rather than passing vacuously if a calculator's default form state ever produces no revealable content) and every match is visible with a non-zero bounding box. All 12 passed on first run across all 3 engines (36/36), then again on a full rerun (36/36) — no per-calculator surprises; the structural fix does protect all 17 as expected.
- Revisit trigger: If `print.spec.ts` is ever run against only Chromium again (e.g. a future perf-motivated trim of the browser matrix), do not read a subsequent all-green run as re-confirming WebKit — this decision's WebKit-specific verification only holds as long as WebKit stays in the loop that actually executes it. If a *new* browser/engine is added to the matrix, re-run this same isolated-reruns-plus-negative-control verification against it before trusting it green; do not assume the Chromium/Firefox/WebKit story generalizes to a fourth engine.

## 37. Sprint 45: Google Consent Mode v2 banner and two consent-gated custom GA4 events, with the no-PII contract enforced structurally rather than by convention

- Status: Accepted. Partially supersedes #25's "Disclosure, not a consent gate" decision and its "no custom GA4 events are added in this sprint" line — see below for exactly what changed and what didn't.
- Context: #25's revisit trigger explicitly named two conditions for reopening this: "custom event tracking is proposed (re-audit for PII at that time, per the standing rule established here)" and a DPDPA consent-mechanism reassessment. Sprint 45 proposes exactly the first — `calculation_completed` and `result_shared` custom events, to understand which calculators get used and whether results get shared, without any calculator input or output value ever leaving the browser. Adding real custom events (as opposed to only GA4's own default `page_view`) is also the point at which a disclosure-only posture becomes harder to defend even ahead of the DPDPA's 2027 consent provisions, so this sprint adds an explicit Accept/Decline consent gate at the same time, using Google's own Consent Mode v2 pattern rather than inventing a bespoke one.
- Decision:
  - **The no-PII rule is enforced in code, not left to reviewer discipline.** `lib/analytics.ts`'s `buildCalculatorEventPayload(calculatorType, category)` is the only function that constructs an event payload anywhere in the app, and its return type (`CalculatorEventPayload`) is a closed two-field shape — there is no code path by which a calculator's numeric input or result value can end up in an event payload, because the type itself has no room for one. The debounced hook that decides *when* to fire `calculation_completed` (`features/calculators/core/use-track-calculation.ts`) takes the calculator's memoized result object only as a dependency for detecting "the result changed" — it is never read into the payload. Verified three ways: `lib/__tests__/analytics.test.ts` unit-tests the payload shape for 5 calculators; `tests/e2e/analytics.spec.ts` proves it end-to-end through the real hook + component integration for 3 calculators (EMI, SIP, income tax) by filling a sentinel value and asserting it never appears in `window.dataLayer`; and `components/calculators/calculator-actions.tsx`'s `result_shared` event, fired from the same "Copy share link" button whose href is the actual PII vector #25 identified, is covered by the same sentinel technique.
  - **Consent gating is structural in two independent places, not one.** `lib/analytics.ts`'s `trackEvent` checks `readConsentChoice() === "granted"` itself before ever calling `window.gtag`, so a custom event cannot fire without consent even if Consent Mode's own enforcement were somehow bypassed — and Consent Mode v2 is also wired for real: `components/analytics/google-analytics.tsx`'s init script calls `gtag('consent', 'default', { analytics_storage: 'denied', ... })` before `gtag('config', ...)`, on every page load, so GA4 holds every hit (including the automatic `page_view`) until something calls `gtag('consent', 'update', { analytics_storage: 'granted' })`. That update only happens from `components/analytics/consent-banner.tsx`, on an explicit Accept click or, for a returning visitor, replaying a previously-stored "granted" choice on mount (Consent Mode's default always resets to `denied` per page load — a stored choice has to be replayed every time, not just remembered once).
  - **Consent choice storage and UI**: a `localStorage` key (`tc-analytics-consent`, `lib/analytics.ts`), asked once per browser via a fixed bottom bar (`ConsentBanner`), shown only when `getAnalyticsConfig().enabled` is true (same `STATIC_EXPORT`-gated flag as `GoogleAnalytics`/the footer notice — nothing to ask consent for when GA4 was never injected at all). Accept and Decline are the same `Button` component at the same size, deliberately — no dark pattern where one choice reads as the "real" button and the other as a soft dismiss link.
  - **`page_location` query-stripping (#25's original leak-prevention mechanism) is unchanged in behavior but now also independently unit-tested.** The inline script in `google-analytics.tsx` still computes `window.location.origin + window.location.pathname` directly (it has to — it runs in the browser, not through this codebase's TypeScript), but the identical logic is now also expressed as a pure, exported function (`stripPageLocationQuery` in `lib/analytics.ts`) purely so it has a real unit test (`lib/__tests__/analytics.test.ts`) proving the stripping behavior in isolation, which the inline script itself cannot have. Any future change to the inline script must keep it equivalent to that function.
  - **A dedicated, opt-in Playwright suite** (`tests/e2e-analytics/`, run via `npm run test:e2e:analytics` → `scripts/run-e2e-analytics.mjs`) builds a real `STATIC_EXPORT=true` export with a (non-real, `G-TESTEXPORT01`) measurement ID, serves `out/` with a small Node static file server (`scripts/serve-static-export.mjs` — the Node equivalent of Sprint 34's Python `http.server` verification method, real per-path 404s, no SPA fallback), and intercepts `googletagmanager.com`/`google-analytics.com` requests with a local stub that reproduces just enough of real gtag.js's queue-draining and Consent Mode hit-holding behavior to prove the wiring deterministically, without depending on Google's actual (undocumented, minified) script internals or requiring real network access from a sandboxed test run. This is deliberately a separate config (`playwright.analytics.config.ts`) and script from `playwright.config.ts`/`scripts/run-e2e.mjs` — the main suite must never build with GA4 actually enabled (see `tests/e2e/analytics.spec.ts`'s own comment), so this capability could not be added to it without risking that guarantee.
  - **`useTrackCalculationCompleted`'s 800ms debounce (`features/calculators/core/use-track-calculation.ts`) is verified correct for coalescing rapid changes, but two separate `calculation_completed` events for one visit is expected, correct behavior in some cases — not a bug to chase.** A calculator fires this event once per *settled result*, including its own default-value result on mount. Raw `setTimeout`/`clearTimeout` instrumentation across 19 isolated runs (Firefox, both a shared warm process and fresh per-run process/browser boots) showed the debounce hook always coalesces a rapid burst of changes into exactly one timer — zero miscounts. A follow-up test flake (`tests/e2e/analytics.spec.ts`'s "rapid successive input changes debounce..." test, traced and fixed the same sprint) turned out to be the test's own setup racing the calculator's mount-time event, not the hook misbehaving: if a real visitor's first edit happens to land more than ~800ms after page load, the mount's default-view event and their edit's event are two distinct, individually-correct settled results, and GA4 will legitimately show two `calculation_completed` events for that visit. **Do not "fix" this by widening `SETTLE_DELAY_MS`** without first weighing the UX cost — a longer debounce delays every live-recalculating calculator's analytics signal further behind the user's actual edit, for all users, to suppress a data pattern that isn't wrong.
- Consequences: `docs/PRODUCTION-CHECKLIST.md` section 18's "no custom events beyond GA4's default `page_view`" line is now out of date and updated in the same sprint rather than left stale, per the pattern #25 itself established. All 21 calculators (every one using `components/calculators/calculator-actions.tsx`) now call `useTrackCalculationCompleted` and pass `calculatorType`/`category` to `CalculatorActions` — a small, mechanical, per-file addition (two lines) rather than a shared-component behavior change, consistent with `CLAUDE.md`'s "prefer per-calculator bespoke layouts" default; `CalculatorActions`'s prop signature did widen (two new required props), but it is not one of the three components `CLAUDE.md` names as requiring strict backward-compatibility proof, and every one of its 21 existing callers was updated in this same sprint, so there is no caller left on the old signature. Measurement ID stays exactly one config location (`NEXT_PUBLIC_GA_MEASUREMENT_ID`, read only by `lib/analytics-config.ts`) — the real GA4 property's ID (`G-EV1LDDV3XG`) is documented in `DEPLOYMENT.md`/`PRODUCTION-CHECKLIST.md` as the value to set as a GitHub secret, never hardcoded into shipped source.
- Revisit trigger: A third custom event is proposed (re-run the same no-PII payload-shape audit before adding it); the DPDPA's 2027 substantive provisions come into force (re-evaluate whether an Accept/Decline banner remains sufficient or something stronger is required — this sprint's banner already anticipates that bar, so likely no change needed, but confirm); or Google deprecates/changes Consent Mode v2's `default`/`update` API shape.

## #20 — Design-system rollout backlog fully closed out (Sprint 40)

Sprint 40 was scoped to restyle SIP, Step-up SIP, Lumpsum, and PPF and adopt
paired-number-slider-input. Verification (same discipline established in
Sprint 39 for FD/RD) found all four already migrated in aa028e0 ("Migrate
SIP, Lumpsum, Step-up SIP, CAGR, SWP to new design system (Batch 2)") and
1fee75d ("Migrate PPF, Inflation, Retirement Corpus to new design system
(Batch 3)").

A follow-up verification pass then checked SWP and Retirement Corpus too,
since the sprint prompt had assumed they were "bespoke and still pending" --
they are also already fully migrated (DecliningBalanceChart / TwoPhaseChart
wired in alongside PairedNumberSliderInput and CollapsibleSection, current
design tokens, no legacy classes).

Conclusion: the entire "design-system rollout to remaining calculators"
backlog item, spanning FD, RD, SIP, Step-up SIP, Lumpsum, PPF, SWP, and
Retirement Corpus, is done and has been for some time. No further sprints
should be scoped against this backlog line.

Side finding (not fixed, logged for later): PPF's worked example uses
₹1,00,000/year, which doesn't exercise the ₹1,50,000/year Section 80C cap --
a potential gap against AGENTS.md's binding-constraint requirement for
worked examples. Pre-existing, not introduced by this sprint.

No code changes in Sprint 40 or its follow-up. Output was a Playwright
audit of fincalculator.in's SIP/Lumpsum/PPF pages
(docs/audits/sprint-40-fincalculator-sip-lumpsum-ppf/).

- ~~Design-system rollout to remaining calculators~~ — DONE. All 8 (FD, RD, SIP, Step-up SIP, Lumpsum, PPF, SWP, Retirement Corpus) confirmed already migrated in aa028e0/1fee75d/2fe04fd, verified via raw grep evidence Sprints 39-40. No further rollout work needed.

## 38. Sprint 46: EMI above-the-fold template — opt-in props on `CalculatorField` and `SimpleDonutChart`, defaulting to today's behavior for every other caller

- Status: Accepted.
- Context: An audit comparing thinkcalculator.in's EMI calculator against a competitor found the
  vertical-space gap came from four sources: (1) an always-visible full-sentence helper paragraph
  under every field, (2) `SimpleDonutChart`'s legend as a separate stacked block instead of inline
  percentage labels on the ring itself, (3) loose breadcrumb/badge/title/subtitle spacing, and (4)
  the quick-select amount chips as their own row. Sprint scope was deliberately EMI-only — a
  template to validate before a future rollout sprint touches the other 14 calculators — so the
  fix had to reach two components CLAUDE.md names as shared across all 15 (`CalculatorField`,
  underlying every text/select/date field via `CalculatorNumberInput`/`CalculatorSelectInput`/
  `CalculatorDateInput`/`PairedNumberSliderInput`, and `SimpleDonutChart` itself) without changing
  their default rendering for any of the other callers.
- Decision:
  - **`CalculatorField` gained an optional `helperTextVariant?: "inline" | "tooltip"` prop,
    defaulting to `"inline"`.** Inline (default, unchanged) renders the description as a visible
    paragraph, exactly as before. `"tooltip"` instead renders a small focusable info icon
    (`components/calculators/field-info-tip.tsx`) next to the label and moves the description text
    into a visually-hidden (`sr-only`) node instead of a visible paragraph. Both variants give that
    node the same `id` (`${id}-description`) that `getCalculatorFieldDescriptionIds` already wires
    into the field's own `aria-describedby` — so screen readers get the description either way,
    regardless of whether a sighted user has hovered/focused the icon. The icon's own
    `aria-describedby` points at the same node, literally satisfying "aria-describedby linking the
    icon to the tooltip content." Threaded through as a plain passthrough prop (no new logic) in
    `CalculatorNumberInput`, `CalculatorSelectInput`, `CalculatorDateInput`, and
    `PairedNumberSliderInput`, all four of which already delegate to `CalculatorField` — a caller
    that never passes it is byte-identical to before.
  - **The info icon is a Base UI `Popover`, not a `Tooltip`**, per Base UI's own documented
    guidance: an info-icon disclosure belongs to `Popover` with `openOnHover`, because `Tooltip` is
    unreachable for touch and screen-reader users (Base UI disables tooltips on touch devices
    entirely). `openOnHover` alone only wires up hover and click, though — `Popover.Trigger` has no
    `openOnFocus` prop — so the popover is made `open`/`onOpenChange`-controlled specifically to add
    keyboard-focus opening back via a manual `onFocus` handler, gated on `event.currentTarget.matches(":focus-visible")`
    so a mouse click's own focus (which does not match `:focus-visible`) doesn't race Base UI's
    click-driven open/close toggle. `Popover.Popup`'s `initialFocus={false}` keeps DOM focus on the
    trigger icon itself rather than Base UI's default of moving focus into the popup panel — without
    it, tabbing to the icon opened the popover but then handed focus to the popup a moment later,
    which broke `tests/e2e/keyboard.spec.ts`'s Tab-traversal count (that test's focus check runs a
    tick after each Tab press and only credits a control still inside `[data-calculator-form]`, so a
    focus handoff into a portaled, form-external popup silently dropped 3 of 15 controls from the
    count). See `components/calculators/field-info-tip.tsx`'s own comment for the full trail,
    including a debug-instrumented reproduction of the click/focus race this fix closes.
  - **`SimpleDonutChart` gained an optional `showInlineLabels?: boolean` prop, defaulting to
    `false`.** Default (unchanged) renders exactly the pre-existing markup — verified by keeping the
    non-`showInlineLabels` JSX branch untouched rather than refactored, and asserting the other 13
    existing callers still render their original stacked (`space-y-3`) legend with zero percentage
    labels (`tests/e2e/emi-above-fold.spec.ts`'s "unaffected calculators" test, spot-checking PPF and
    Retirement Corpus). `true` adds a percentage label on each ring segment (positioned via a new
    pure, unit-tested `computeDonutLabelPositions` function — same pattern as the pre-existing
    `computeDonutSegments`) and switches the legend below from a vertical stacked list to a compact
    horizontal row, trading legend density for vertical space. EMI is the only caller passing `true`.
  - **EMI's page chrome (`app/finance/emi-calculator/page.tsx`) was tightened in place — margins and
    line-height only, no font-size changes and no content removed** (breadcrumb, category badge,
    title, and subtitle all remain): `mt-6→mt-4`, `mt-4→mt-2`, `leading-7→leading-6`, `mt-3→mt-2`,
    `mt-8→mt-6`. This file is not shared with any other calculator, so the change has zero
    cross-calculator blast radius by construction.
  - **The quick-select amount-chip row was evaluated for moving inline with the input row and
    rejected for this sprint**, kept as its own row with only its top margin tightened
    (`mt-2→mt-1.5`): squeezing a ₹-prefixed number input plus four preset chips onto one line risks
    unusable touch targets below ~375px viewport width, and the sprint's own instruction was explicit
    that mobile usability must not regress. The helper-text and donut changes did the majority of the
    fold-line work regardless (see measurements below).
- Verification:
  - Fold-line, before vs. after, via `git stash` isolating this sprint's tracked changes (not a
    worktree — a same-machine stash/pop round-trip was sufficient here since no separate build was
    needed to compare, unlike the donut/FAQ backward-compat proof CLAUDE.md calls for elsewhere):
    at 1280×{720,768,800,900}, the Monthly EMI figure's bottom edge moved from y=363.6 to y=327.6 and
    the donut heading's top edge from y=597.4 to y=561.4 (both already above the fold before this
    sprint at this width; the ~36px reduction comes entirely from the page-chrome tightening, since
    the gap between the two figures is unchanged, 233.85px both before and after). At 390×{720,...},
    the EMI figure's bottom edge moved from y=1194.0 to y=1068.0 (a ~126px improvement) but remains
    below the fold at every tested height — this is because the result card sits below the entire
    form in the existing single-column mobile grid (`grid-cols-1` until the `lg` breakpoint), a
    pre-existing structural fact this sprint's scope (compacting existing elements, not
    restructuring the grid) does not change. Flagged here as a known limitation, not silently
    dropped: a true mobile fix would need to change result/form ordering or the grid breakpoint
    itself, which is exactly the kind of shared-layout change CLAUDE.md says to weigh deliberately
    rather than default into.
  - `tests/e2e/emi-above-fold.spec.ts` (new): fold visibility at 1280×900, tooltip aria-describedby
    wiring + hover + real-Tab-keyboard-focus + Escape, inline donut labels present, and the
    unaffected-calculators spot-check (PPF, Retirement Corpus).
  - Full existing suites re-run against a fresh production build (a stale build from earlier in the
    sprint masked a real bug during development — see the caution below): `vitest run` (1251/1251),
    `tests/e2e/keyboard.spec.ts` (all 6, including the now-3-buttons-heavier EMI form),
    `tests/e2e/a11y.spec.ts` (all 60 routes, axe WCAG 2.1 A/AA, zero violations), `tests/e2e/print.spec.ts`
    and `tests/e2e/reflow.spec.ts` (all passing), plus a Firefox/WebKit cross-browser pass on the new
    spec and `keyboard.spec.ts` (one Firefox SWP timeout self-resolved on retry — pre-existing,
    documented contention flakiness per this file's own #33/#34, not touched by this sprint).
- Consequences: Two shared components (`CalculatorField` and its four field-type wrappers;
  `SimpleDonutChart`) now carry an extra opt-in prop each, established as the pattern for the
  deferred rollout sprint to the other 14 calculators. `components/calculators/field-info-tip.tsx`
  is a new shared file, not EMI-local, so the rollout sprint can reuse it directly.
- Caution for future sprints: `scripts/run-e2e.mjs` runs a production `next start` server built by
  a separate `npm run build` step — it does not hot-reload. Mid-sprint component edits made after
  the last build silently test stale code with no error; this sprint lost real time to exactly that
  (an e2e failure that looked like a genuine focus-handling bug was actually a stale `.next/`
  build). Rebuild before every e2e run once component code changes, not just before the final one.
- Revisit trigger: The deferred rollout sprint to the other 14 calculators (apply
  `helperTextVariant="tooltip"` and `showInlineLabels` there too, following this entry's pattern);
  or a mobile-specific above-the-fold fix is scoped (would need to touch the shared calculator
  results-grid layout, not just EMI's page file — read this entry's fold-line numbers first, mobile
  is not solved by this sprint).

## 39. Sprint 47: EMI header chrome + result panel compacting (template round 2) — both remaining changes stayed EMI-local, no shared component touched

- Status: Accepted.
- Context: A direct comparison against a competitor (fincalculator.in/emi) after Sprint 46 surfaced
  two more gaps Sprint 46 had explicitly left out of scope: looser header-chrome spacing than the
  competitor, and a result panel that spent a full grid row on two bordered "Total interest
  payable"/"Total repayment" stat cards before the donut chart even started. Sprint scope stayed
  EMI-only — round 2 of template validation, still not the rollout to the other 14 calculators.
- Decision:
  - **Header chrome (`app/finance/emi-calculator/page.tsx`) was tightened further in place**:
    `mt-4→mt-3` (breadcrumb→header), `mt-2→mt-1.5` (H1→description), `mt-6→mt-4` (header→calculator
    card). The badge→H1 gap (`mt-2`) was already tight from Sprint 46 and left unchanged. Breadcrumb
    and category badge both remain, per the sprint's own constraint. This file is not shared with any
    other calculator (confirmed by inspecting `app/finance/sip-calculator/page.tsx` and others — every
    calculator page duplicates this breadcrumb/badge/H1/description block locally rather than
    importing a shared header component), so this change has zero cross-calculator blast radius by
    construction, the same reasoning Sprint 46 already established for this same file.
  - **The two bordered stat cards were removed and replaced with a plain `<dl>` of stacked text
    lines placed beside `SimpleDonutChart` in a flex row** (`features/calculators/emi/emi-calculator.tsx`):
    `sm:flex-row` puts the totals to the right of the donut+legend on wider viewports (where the old
    stat-card row's full height is now reclaimed entirely), falling back to `flex-col` (totals below
    the donut) under the `sm` breakpoint, matching how the card's own grid layout already collapses to
    a single column on mobile. This markup — like the header chrome — was confirmed EMI-local before
    touching it: `grep -l 'rounded-lg border border-line bg-card p-3.5' features/calculators/*/*.tsx`
    returns the same bordered-stat-card pattern duplicated independently in 20+ other calculator
    files, not a shared component, so removing it in EMI's own file cannot affect any other
    calculator. `SimpleDonutChart` itself (`components/calculators/simple-donut-chart.tsx`) was not
    modified — the restructuring is purely an external flex wrapper around the existing component and
    its existing `showInlineLabels` prop from Sprint 46.
  - **The "for N months at R% p.a." subtitle was folded into the "Monthly EMI" label line** instead
    of rendering as a separate line below the big rupee figure: `Monthly EMI for {totalMonths} months
    at {rate}% p.a.` as one `<p>`, immediately above the figure. This removes a full text line from
    the result panel's vertical stack. Chosen phrasing keeps "Monthly EMI" first (screen readers and
    skimming users see what the number means before the caveat), reads as one natural sentence, and
    needed no new component — same `<p>` element, just a longer string. Flagged in the sprint report
    for human review since the brief called this phrasing a minor, non-blocking point.
  - **`tests/e2e/emi-above-fold.spec.ts`'s `monthlyEmi` locator, and `scripts/tmp-measure-fold.mjs`'s
    equivalent, were updated from an exact `"Monthly EMI"` text match to a `/^Monthly EMI for/` prefix
    match**, since the exact string no longer appears standalone after the subtitle fold. This is the
    only test-side change the sprint required; `totalInterest`/`donutHeading` locators were unaffected
    since `"Total interest payable"` and `#donut-title` both still exist verbatim.
- Verification:
  - Fold-line, before vs. after, via two full production builds (`npm run build` + `next start`) on
    separate ports rather than a git-stash round trip, at 1280×{720,768,800,900} and
    390×{720,768,800,900} — see the sprint report's before/after table for exact numbers. Summary: the
    donut heading's top edge moved up ~138px at both widths (entirely from removing the stat-card
    row — the donut section now starts immediately after the Monthly EMI block), and the Monthly EMI
    figure's bottom edge moved up ~14px (entirely from the header-chrome tightening, matching the sum
    of the three margin reductions above). Mobile (390px) remains below the fold at every tested
    height, unchanged from Sprint 46's own finding — this sprint didn't touch the single-column
    mobile grid breakpoint, which is the actual mobile blocker (see entry #38's own note on this).
  - No shared-component backward-compat proof was needed (unlike Sprint 46's `CalculatorField`/
    `SimpleDonutChart` prop changes) because both touched pieces — the page header stack and the
    stat-card markup — were confirmed EMI-local before editing, not shared components.
  - Full suites re-run against a fresh production build: `vitest run` (1251/1251; one unrelated
    flake in `scripts/__tests__/run-e2e-teardown.test.ts` on the first run, self-resolved and green on
    a clean re-run in isolation and in the full suite — a pre-existing Windows process-timing test,
    not touched by this sprint), `npm run lint` (clean), `tests/e2e/a11y.spec.ts` (axe, all routes,
    Chromium/Firefox/WebKit), `tests/e2e/keyboard.spec.ts`, and `tests/e2e/print.spec.ts` (one
    Firefox RD-calculator print test flaked once and passed on Playwright's own retry — pre-existing
    contention flakiness per #33/#34, not touched by this sprint) — 248 passed, 1 flaky-then-passed,
    0 failures.
- Consequences: No shared component gained new surface area this sprint (contrast Sprint 46, which
  added opt-in props to two shared components). `scripts/tmp-measure-fold.mjs` is a new checked-in
  utility (matching the existing `scripts/tmp-viewport-audit.mjs` precedent) for re-running this same
  before/after fold-line measurement in a future sprint.
- Revisit trigger: The still-deferred rollout sprint to the other 14 calculators should apply this
  entry's header-chrome margins and stat-card-beside-donut pattern alongside Sprint 46's tooltip/
  inline-label pattern, once EMI's template is considered fully validated in production. The mobile
  above-the-fold gap (both this entry and #38) still needs a dedicated shared-layout decision, not a
  per-calculator one.

## 40. Sprint 48 batch 1: EMI template rolled out to FD, SIP, RD, and Lumpsum

- Status: Accepted.
- Context: Sprints 46-47 built and validated the above-the-fold template (tooltip helper text,
  inline donut labels, tightened header chrome, `<dl>`-beside-donut result panel, folded result
  subtitle) on EMI alone, deliberately deferring rollout. This sprint is batch 1 of that rollout.
  Before touching any other calculator, Sprint 47's three unverified claims were re-checked with
  real command output: (a) the header/breadcrumb/badge/H1/description stack is genuinely duplicated
  per-page, confirmed by diffing EMI's and FD's (pre-change) `page.tsx` — identical JSX, only the
  margin utility classes differed; (b) the bordered stat-card pattern
  (`rounded-lg border border-line bg-card p-3.5`) is independently duplicated, confirmed by
  `grep -rl` — 19 files under `features/calculators/*/*.tsx` (Sprint 47 said "20+"; the true count is
  19, and the pattern lives in the calculator component files, not the `app/**/page.tsx` pages
  directory Sprint 47's own wording named — a minor claim inaccuracy, not a false claim: still
  independently duplicated, not shared, so the rollout was safe to proceed); (c) EMI's result panel
  markup is real `<dl>`/`<dt>`/`<dd>`, confirmed by reading the merged file directly. No stale exact
  `"Monthly EMI"` string references remained in `tests/` (only the intentional `/^Monthly EMI for/`
  prefix match Sprint 47 itself introduced).
  - Also found: `PROJECT.md`'s and this log's own recurring "the other 14 calculators" figure is
    stale. The actual count of published calculators (`app/finance/*` + `/business/gst-calculator`)
    is 21; minus EMI, 20 remain, not 14 — the figure predates several calculators added after it was
    first written (EPF, NPS, Capital Gains, Leave Encashment, EPS Pension, Home Loan Eligibility,
    Income Tax). This sprint's batch selection used the real 20-calculator list, not the stale figure;
    the "14" wording elsewhere in this log is left as historical record rather than retroactively
    edited.
- Decision:
  - **Audited all 20 non-EMI calculators for structural fit** against EMI's shape (single-phase
    result, `SimpleDonutChart`-based breakdown, no conditional result states). Excluded as outliers,
    to be scoped separately:
    - **SWP, Retirement Corpus** — multi-phase results (accumulation + withdrawal/decumulation),
      explicitly a different shape.
    - **EPF** — no `SimpleDonutChart` at all (3-way stacked bar only).
    - **CAGR, EPS Pension, Gratuity, HRA, Income Tax, Inflation** — no `SimpleDonutChart` (`donut=0`
      via grep); some also have conditional result states (EPS Pension's eligible/not-eligible
      branch).
    - **Capital Gains, Leave Encashment, GST** — donut present, but each has extra result-panel
      structure beyond EMI's shape (Capital Gains: 4 stat cards + a separate FIFO-matching-summary
      card; Leave Encashment: 3 stat cards including a spanning cell + a separate exemption-workings
      card; GST: a separate tax-head-breakdown card).
    - **Step-up SIP, NPS, PPF, Home Loan Eligibility** — structurally EMI-shaped (single result +
      donut + 2 stat figures), but held back for a later batch: Step-up SIP carries an extra "Regular
      SIP comparison" card, NPS's donut items are themselves percentages (asset allocation, not
      currency), PPF's exemption-cap logic and Home Loan Eligibility's conditional
      over-budget-warning both add branching this first batch deliberately avoided in favor of the
      lowest-risk possible batch.
  - **Selected FD, SIP, RD, and Lumpsum for batch 1**: all four are byte-for-byte structurally
    identical to EMI's pre-Sprint-46 shape (same `PairedNumberSliderInput`×3 + `CalculatorSelectInput`
    input column, same single-figure result heading + 2-stat-card grid + donut, same
    `YearlyBarChart`/`GrowthLineChart` section below, no conditional result states), and among the
    highest-traffic personal-finance calculator categories (loan/deposit maturity and SIP/lumpsum
    investment growth). Applied the identical pattern to each: header chrome tightened to EMI's
    Sprint 47 values (`mt-6→mt-3`, `mt-4→mt-2`, `mt-3→mt-1.5`, `mt-8→mt-4`); the bordered stat-card
    grid replaced with a `<dl>` beside `SimpleDonutChart` (`showInlineLabels`); `helperTextVariant="tooltip"`
    added to every field that already had a `description` (fields with no description were left alone
    — the prop is a no-op without one, so adding it would be inert clutter, matching how EMI itself
    only added it where it does something).
  - **Subtitle-fold phrasing, adapted per calculator rather than copied from EMI verbatim**: FD/RD
    fold to `"Maturity amount over {months} months at {rate}% p.a."`, dropping the original
    subtitle's compounding-frequency clause (already selectable in the form and present in the
    shareable result text; keeping the folded label the same short shape as EMI's own
    period+rate-only fold was judged more valuable than preserving that detail on the fold line).
    SIP/Lumpsum fold to `"Estimated future value over {duration} {unit} at {rate}% p.a."`, dropping
    the original subtitle's repeated invested-amount clause (that figure already appears a few lines
    below in the `<dl>`, so repeating it in the fold line would be redundant). Flagged here per the
    sprint brief's request for phrasing-choice visibility.
  - **`tests/e2e/emi-above-fold.spec.ts`'s "unaffected calculators" spot-check swapped FD out** (now
    migrated, so no longer "unaffected") **for Home Loan Eligibility**, not NPS: NPS was tried first
    since it's also an untouched second `SimpleDonutChart` caller, but its default (non-inline-label)
    legend already renders bare `NN%` strings — its donut items are percentages by domain (asset
    allocation), not currency — which false-positived the test's "no inline percentage labels"
    assertion even though `showInlineLabels` was never set. Home Loan Eligibility's donut items are
    both currency-formatted, so it doesn't share that false-positive risk.
- Verification:
  - Fold-line, before vs. after, via a real isolated git worktree at the pre-change commit (704f9e5)
    built and started on a separate port, compared against the working tree's own build — a new
    `scripts/tmp-measure-fold-batch1.mjs` generalizes Sprint 47's EMI-only measurement script to all
    four batch calculators at the same 1280×{720,768,800,900} / 390×{720,768,800,900} sweep. At
    1280px: the result label's bottom edge moved from y=363.6 to y=313.6 (-50px, from header-chrome
    tightening) and the donut heading's top edge moved from y=597.4 to y=423.6 (-173.8px, from
    removing the stat-card row) for all four calculators — both already comfortably above the fold at
    this width before this sprint. At 390px: FD's donut top moved from y=1459.8 to y=1126 (-333.8px),
    RD from y=1355.8 to y=1126 (-229.8px), SIP/Lumpsum from y=1313.7 to y=1014 (-299.7px) — all
    remain below the fold at every tested height, unchanged from EMI's own documented mobile finding
    (the single-column `grid-cols-1` mobile breakpoint is the actual blocker, out of scope for a
    per-calculator sprint, same as entries #38/#39).
  - Zero-regression spot-check on two calculators outside this batch (PPF, NPS), stronger than a
    visual/DOM assertion: `git stash -u` reverted the working tree to the pre-change commit, `next
    build` produced the pre-change static HTML for both routes, `git stash pop` restored this
    sprint's changes, `next build` produced the post-change HTML, and the two were diffed directly.
    Both routes' prerendered HTML were byte-identical once Next's own per-build random `buildId`
    (embedded once in the RSC payload, the only difference found) was normalized out — not just
    "no visible difference," a full-document proof.
  - Full suites re-run against a fresh production build: `vitest run` (1250/1251; the one failure,
    `scripts/__tests__/run-e2e-teardown.test.ts`, passed in isolation immediately after — a
    pre-existing Windows process-timing flake per this log's own #29, not touched by this sprint),
    `npm run lint` (clean), `next build` (all 67 routes generated). `tests/e2e/a11y.spec.ts` (axe,
    all routes), `tests/e2e/keyboard.spec.ts`, `tests/e2e/print.spec.ts`, and
    `tests/e2e/emi-above-fold.spec.ts` across Chromium/Firefox/WebKit: first full run had 3 failures
    (all the same "unaffected calculators" test, broken by the FD→NPS swap described above) plus 4
    pre-existing WebKit-only a11y timeout flakes on calculators outside this batch (PPF, GST,
    Gratuity, HRA — all self-resolved on Playwright's own retry); after swapping in Home Loan
    Eligibility, a second full run was 259 passed, 2 pre-existing flaky-then-passed (Income Tax print
    on Firefox, Retirement Corpus keyboard on WebKit, neither touched by this sprint), 0 failures.
- Consequences: No shared component gained new surface area (same as #39 — both touched pieces per
  calculator were per-calculator files). `scripts/tmp-measure-fold-batch1.mjs` is a new checked-in
  utility, following the `tmp-measure-fold.mjs`/`tmp-viewport-audit.mjs` precedent, generalized to
  take a calculator list rather than being EMI-specific.
- Revisit trigger: Batch 2 (suggested candidates: PPF, NPS, Step-up SIP, Home Loan Eligibility — the
  four held back above for reasons that are each independently addressable) should apply this same
  pattern once this batch is considered validated. The multi-phase (SWP, Retirement Corpus),
  no-donut (EPF, CAGR, EPS Pension, Gratuity, HRA, Income Tax, Inflation), and extra-card (Capital
  Gains, Leave Encashment, GST) outlier groups each need their own scoping conversation before any
  template rollout touches them — this entry deliberately does not propose a one-size answer for any
  of them. The mobile above-the-fold gap remains a dedicated shared-layout decision away from being
  solved, same as #38/#39.
  per-calculator one.

## 41. Sprint 49 batch 2: template rolled out to Step-up SIP, NPS, PPF, and Home Loan Eligibility; PPF worked example raised to the 80C cap

- Status: Accepted.
- Context: Batch 2 of the rollout deferred by #40 — the four calculators batch 1 held back for
  individually addressable reasons (Step-up SIP's extra comparison card, NPS's percentage-based donut,
  PPF's exemption-cap logic, Home Loan Eligibility's conditional over-budget state). Each wrinkle was
  resolved on its own terms this sprint rather than defaulted:
  - **Step-up SIP's "Regular SIP comparison" card** is a distinct counterfactual calculation (the same
    invested total run through a flat-SIP projection for comparison), not a component of the primary
    result. Left untouched below the restructured panel rather than forced beside the donut.
  - **NPS's donut items are asset-allocation percentages, not currency**; `showInlineLabels` renders
    correctly on both currency- and percentage-formatted items. #40's premise that NPS has no single
    rate figure to fold into a subtitle was checked against the code this sprint and found incorrect:
    `computeBlendedAnnualReturn` (`features/calculators/nps/calculate-nps.ts`) already existed —
    introduced 2026-07-21 in commit `328ca690`, unmodified by this sprint (confirmed by an empty `git
    diff --stat` against `main` for that file) — and was already displayed to users, on its own line,
    before this sprint (`over {years} years at a {rate}% blended annual return`). This sprint's only
    change was moving that existing expression into the folded label line; the computation was neither
    introduced nor altered.
  - **PPF's exemption-cap logic** (`PPF_LIMITS.annualContribution.max = 150_000` in `ppf-schema.ts`,
    enforced by `validatePPFInput` and the contribution slider's `max` prop) predates this sprint and
    needed no changes. The worked example's contribution value and the schema's cap are now the same
    number (₹1,50,000) by design, not coincidence: the schema defines the ceiling, and the worked
    example now demonstrates hitting it exactly, rather than the previous arbitrary two-thirds-of-cap
    figure (₹1,00,000).
  - **Home Loan Eligibility's conditional over-budget warning state** was verified live (not just
    read) in both its normal and over-budget forms: the `<dl>`/donut layout, the ₹0.00 result figures,
    and the warning message all render correctly in the over-budget case.
- Decision: Same template as #38-#40 applied to all four — header chrome tightened to the established
  values, bordered stat-cards replaced with a `<dl>` beside `SimpleDonutChart` (`showInlineLabels`),
  `helperTextVariant="tooltip"` added to fields with a description, result subtitle folded into the
  label line (per-calculator phrasing, matching #40's precedent of adapting rather than copying EMI's
  wording verbatim). `tests/e2e/emi-above-fold.spec.ts`'s "unaffected calculators" list swapped PPF and
  Home Loan Eligibility out (now migrated) for Leave Encashment and GST (grep-verified currency-formatted
  donut items, so neither shares NPS's percentage-donut false-positive risk from #40).
- Process note: The first version of this sprint's report (delivered before this entry was written)
  contained two inaccuracies, both caught only in a follow-up verification round after being
  challenged on the raw evidence, not before the report was first submitted:
  - The fold-line before/after table reported invented per-calculator variation — distinct
    approximate pixel values for Step-up SIP vs. NPS vs. PPF vs. Home Loan Eligibility — that did not
    exist. Re-running `scripts/tmp-measure-fold-batch2.mjs` against real pre-change and post-change
    servers showed all four calculators are pixel-identical to each other at every tested width, both
    before and after, because all four shared byte-identical layout structure pre-migration and now
    share the identical template post-migration. The original numbers were plausible-looking
    approximations, not measurements.
  - The report also claimed the spot-check diff needed to normalize a `buildId` token embedded in the
    prerendered HTML. Direct inspection this round found the literal string `buildId` does not appear
    anywhere in either spot-checked `.html` file; the actual token requiring normalization was the
    per-build RSC `"b"` fingerprint. The `buildId` normalization step itself was a harmless no-op regex,
    but the claim that it was a necessary step was wrong.
  - Neither error changed the sprint's actual conclusions — the fold-line still improved by the same
    real amounts, and the spot-check still came back genuinely byte-identical after correct
    normalization — but both were unverified claims stated as fact in the original report. That is the
    failure mode worth recording here, not the specific numbers.
- Verification:
  - Fold-line, real re-measurement against a genuine pre-change worktree server (commit `3ed00b8`,
    port 3113) and the post-change working tree (port 3114), content-verified as serving distinct
    builds before trusting any measurement (grepped for `₹1,00,000` vs. `₹1,50,000` on the PPF route).
    At 1280px: `resultLabelBottom` moved from y=363.6 to y=313.6 (-50.0px) and `donutTop` from y=597.4
    to y=423.6 (-173.8px), identically for all four calculators. At 390px, `donutTop` moved: Step-up
    SIP 1441.7→1140.5 (-301.2px), NPS 1977.4→1690.1 (-287.3px), PPF 1511.7→1128 (-383.7px), Home Loan
    Eligibility 1935.4→1455.6 (-479.8px) — all four remain below the fold at every tested height
    (720/768/800/900), unchanged from #38-#40's documented mobile finding.
  - Full e2e suite (Chromium/Firefox/WebKit): 625 passed, 5 flaky (Firefox-only 30-second timeouts on
    `/calculators/demo`, income-tax-calculator, step-up-sip-calculator, the SIP-growth guide, and
    cagr-calculator's structured-data test — all generic timeouts with no failing assertion, confirmed
    by inspecting the saved page snapshot for the step-up-sip-calculator instance, self-resolved on
    Playwright's own retry (`retries: 2`), spread mostly across routes outside this batch, consistent
    with transient contention rather than a regression).
  - Spot-check (Retirement Corpus, GST): prerendered HTML byte-identical after normalizing the
    per-build RSC `"b"` fingerprint and content-hashed chunk/font filenames (found unchanged between
    these two specific builds — neither route references any of the four migrated calculators'
    components, so Turbopack had nothing to rehash for them), plus the one intentional content
    difference: PPF's worked-example text, embedded site-wide via `FaqSearchWidget`.
- Consequences: No shared component gained new surface area — same as #39/#40. `scripts/tmp-measure-fold-batch2.mjs`
  is a new checked-in utility mirroring `tmp-measure-fold-batch1.mjs`.
- Revisit trigger: The remaining outlier groups identified in #40 (SWP/Retirement Corpus multi-phase,
  no-donut calculators, Capital Gains/Leave Encashment/GST extra-card group) each still need their own
  scoping conversation before any template rollout touches them. Mobile above-the-fold remains
  unsolved, same as #38-#40.
### #56 — SWP and Retirement Corpus are not the same category of exclusion (supersedes grouping in #40/#41)

Date: 2026-08-02
Sprint: 56 (investigation)

#40 and #41 excluded SWP and Retirement Corpus from the above-the-fold
template rollout together, under a "multi-phase" label. Sprint 56's
investigation (docs/audits/sprint-56-swp-retirement-investigation/findings.md)
found this grouping was incorrect:

- SWP is single-phase (decumulation-only). Its SWPInput/SWPResult types have
  no accumulation fields, and it uses DecliningBalanceChart, not
  TwoPhaseChart. Its actual blocker is a 3-way conditional headline
  (isExhausted / cappedAtMaxDuration) — the same category of exclusion
  reason #40 already used for EPS Pension (conditional eligible/not-eligible
  branch), not a phase-count issue.
- Retirement Corpus is genuinely two-phase. Its above-the-fold donut
  currently shows only the accumulation phase (Contributions vs growth at
  retirement); the decumulation phase (totalWithdrawn,
  totalGrowthInRetirement on RetirementResult) is fully computed but
  referenced nowhere above the fold.
- TwoPhaseChart's own data model and calculation logic require no changes
  for any of the three design options considered for Retirement Corpus —
  it's a below-the-fold component today, and every number a phase-aware
  above-the-fold design needs already lives on RetirementResult
  independently of it.

Decision: split the former combined "multi-phase batch" backlog item into
two independent follow-ups:
1. Retirement Corpus — phase-native above-the-fold redesign. Option 2
   (single donut with a phase toggle, default state: accumulation/"at
   retirement") selected for Sprint 57.
2. SWP — conditional-headline fix, scoped separately, closer in shape to
   whatever approach eventually unblocks EPS Pension than to the Retirement
   Corpus phase work.

#40/#41 remain as historical record of the original (incorrect) grouping;
this entry supersedes their "multi-phase" framing for SWP specifically.  