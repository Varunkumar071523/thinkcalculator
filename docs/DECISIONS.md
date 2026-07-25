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