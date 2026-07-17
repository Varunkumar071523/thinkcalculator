# ThinkCalculator Production Checklist

Checked items are verified in the current source/build baseline. Deployment-specific and live-domain checks remain open until performed in the target environment.

## 1. Source control

- [x] Git repository and reviewed feature-branch history exist.
- [x] Application and content configuration are version-controlled.
- [ ] Confirm the release branch is current and the deployment diff is clean.
- [ ] Record the exact deployed commit.

## 2. Tests

- [x] `npm run test` passes: 628 Vitest tests across 55 files, plus a 264-test Playwright suite (accessibility, keyboard/focus, zoom/reflow, print, reduced motion) across Chromium, Firefox, and WebKit, after Sprint 31 Browser/Accessibility/Print QA and its follow-up independent review.
- [x] Core calculations, URL state, schedules, registries, content exclusions, cluster reciprocity, learning-path integrity, search/sitemap boundaries, and production configuration have automated coverage.
- [x] Every published static route has automated axe-core WCAG 2.1 A/AA coverage (`tests/e2e/a11y.spec.ts`, run via `npm run test` or `npm run test:e2e`).
- [ ] Re-run the full suite on the release commit in CI or the deployment environment.

## 3. Lint and build

- [x] `npm run lint` passes for the current Sprint 31 source baseline.
- [x] `npm run build` passes for the current Sprint 31 source baseline.
- [x] `git diff --check` passes for the current Sprint 31 source baseline.
- [ ] Repeat all checks for the release commit with production configuration.

## 4. Static-route verification

- [x] Current public routes build as static or SSG output.
- [x] Four editorial routes are generated from published registry items.
- [x] Thirteen glossary term routes are generated from published registry items.
- [x] Two substantive topic routes are generated from eligible published definitions; draft and sparse topics are excluded.
- [x] `/search` keeps a static page shell and derives results client-side from a small public registry projection behind Suspense.
- [x] The Sprint 22 production build generates 55 static/SSG pages, including `/finance/inflation-calculator` and `/glossary/inflation` exactly once.
- [x] Invalid and draft editorial slugs return not found.
- [x] Eligible calculator, editorial, and glossary cluster members expose reciprocal hub navigation; sparse, unresolved, draft, and non-member resources do not render a false cluster section.
- [x] Public topic learning paths are ordered, linked to live unique destinations, keyboard reachable, and free of nested interactive controls.
- [ ] Inspect the final hosting route table and representative responses.

## 5. SEO

- [x] Reusable metadata helpers, unique canonicals, Open Graph, and Twitter metadata exist.
- [x] Calculator query state is excluded from canonical URLs.
- [x] Editorial search query URLs canonicalise to clean `/search`; the queryless discovery page is intentionally indexable.
- [ ] Crawl the live site for duplicate/missing titles, descriptions, canonicals, and broken links.

## 6. Sitemap and robots

- [x] Sitemap includes static routes, published calculators, Blog/Guide/Glossary/Topic indexes, published editorial content, published glossary terms, and substantive public topic hubs.
- [x] Sitemap includes clean `/search` once and excludes every search query URL.
- [x] Draft editorial content is excluded.
- [x] Robots metadata route exists.
- [ ] Open and validate live `/sitemap.xml` and `/robots.txt`.

## 7. Metadata and social previews

- [x] Default social image route and metadata wiring exist.
- [x] Manifest, icon, and Apple icon routes exist.
- [ ] Inspect live previews in major social/debugging tools.
- [ ] Verify absolute production URLs and image responses on the public domain.

## 8. Structured data

- [x] Root Organization and WebSite schema exist.
- [x] Editorial Article/BlogPosting and visible FAQ schema exist.
- [x] Glossary pages use visible factual DefinedTerm schema.
- [x] Topic pages use breadcrumb schema matching visible navigation.
- [x] The existing WebSite object has one factual SearchAction matching `/search?q={search_term_string}`; no SearchResultsPage schema is emitted.
- [x] Unsupported ratings, reviews, and credentials are omitted.
- [ ] Validate representative live pages with schema testing tools.

## 9. Accessibility

- [x] Semantic landmarks, skip link, visible focus styles, labels, and accessible tables are implemented.
- [x] Charts have textual values (`aria-label` + adjacent legend text) and do not depend on colour alone; `SimpleDonutChart`'s two segment colours were also verified against WCAG 1.4.11 non-text-contrast (both ≥3:1 against the card background and against each other) as part of Sprint 31, since axe-core cannot judge graphical-object contrast automatically.
- [x] Automated keyboard-reachability and visible-focus-indicator coverage exists for 5 representative calculators (EMI, SWP, Inflation, Step-up SIP, Retirement Corpus) plus the mobile navigation Sheet's focus trap/return (`tests/e2e/keyboard.spec.ts`), across Chromium, Firefox, and WebKit.
- [x] Automated WCAG 2.1 A/AA axe-core coverage exists for every published static route (`tests/e2e/a11y.spec.ts`); Sprint 31 found and fixed one `aria-allowed-attr` violation (invalid `aria-expanded`/`aria-controls` on the homepage search `input[type=search]`), one `definition-list` structure violation (`/glossary`), and one systemic `color-contrast` violation (`--muted-foreground` token, 23 occurrences across nearly every page).
- [x] Automated zoom/reflow coverage exists at a 320px viewport (WCAG 1.4.10) and a 640×800 (200%-zoom-equivalent) viewport for 12 representative pages (`tests/e2e/reflow.spec.ts`); no page-level horizontal scroll found.
- [x] Automated `prefers-reduced-motion: reduce` coverage exists (`tests/e2e/reduced-motion.spec.ts`), verifying the global CSS override actually collapses transition/animation duration on real rendered elements (the mobile navigation Sheet and a homepage interactive link) across Chromium, Firefox, and WebKit. The codebase has no JS-driven animation library, so this CSS-level check covers every animation in the app.
- [ ] A real screen-reader pass (VoiceOver, NVDA, or JAWS) on representative live pages — axe-core and manual DOM/ARIA review (result `aria-live` regions, `aria-describedby` error association, `aria-hidden` decorative icons) give strong signal but are not a substitute for a human with a real screen reader.

## 10. Browser testing

- [x] Automated coverage across Chromium, Firefox, and Playwright's WebKit engine exists for accessibility, keyboard/focus, zoom/reflow, and print output (`tests/e2e/`, run via `npm run test`).
- [x] Codebase audited for known cross-browser risk patterns (Sprint 31): `backdrop-filter` is correctly `-webkit-`-prefixed and `@supports`-gated by the Tailwind v4/Lightning CSS build; `oklch()`/`oklab()` theme colours are automatically downleveled with `lab()`/hex fallbacks by the same build (both verified in the actual built CSS, not assumed); no `100vh`/viewport-unit iOS-Safari risk found (unused in this codebase); `Array.prototype.findLast` (used in two client-side calculation modules, SWP and Retirement Corpus) requires Safari 15.4+/Chrome 97+/Firefox 104+, all released 2022 — low risk but flagged since an unsupported browser would hard-crash rather than degrade; `navigator.clipboard.writeText` already has a try/catch fallback message.
- [ ] Test current Chrome, Firefox, Safari (real, on macOS), and Edge, including search submission, refresh, and back/forward navigation. Playwright's WebKit engine is not Safari and does not substitute for this.
- [ ] Verify navigation, forms, sharing, clipboard, schedules, errors, and editorial anchors on real Safari specifically (clipboard-write and native `type="number"`/`type="search"` rendering are the most likely points of divergence).

## 11. Mobile testing

- [x] Layouts are implemented mobile-first with contained table overflow.
- [x] Automated mobile-viewport coverage exists (375px for the mobile navigation Sheet, 320px for WCAG reflow across 12 representative pages) — see `tests/e2e/keyboard.spec.ts` and `tests/e2e/reflow.spec.ts`.
- [x] Confirmed via automated testing: no page-level horizontal scrolling at 320px or at a 200%-zoom-equivalent viewport on any of the 12 representative pages checked.
- [ ] Test representative physical iOS and Android devices. Viewport emulation confirms layout/reflow logic but cannot verify real touch-target sizing, on-device font rendering, native control chrome (date/number inputs, select dropdowns), or OS-level accessibility settings interaction.

## 12. Calculator validation

- [x] Twelve production calculators have unit tests and worked examples.
- [x] Validation is separate from pure calculation logic.
- [ ] Cross-check representative scenarios against independent trusted calculations.
- [ ] Verify rounding, extremes, invalid input, and provider-specific caveats manually.

## 13. Print testing

- [x] Browser Print / Save as PDF actions are implemented; no PDF generator is required.
- [x] Automated print-media-emulation coverage exists for 5 representative calculators (EMI, SWP, Inflation, Step-up SIP, Retirement Corpus) across Chromium, Firefox, and WebKit (`tests/e2e/print.spec.ts`): navigation/footer/the input form are confirmed hidden, the print summary is confirmed visible with a non-dark background, and every schedule table is confirmed visible and non-overlapping.
- [x] Sprint 31 found and fixed a real print regression: SWP, Inflation, Step-up SIP, and Retirement Corpus's schedule tables were completely missing from print output (silently `visibility: hidden`, not just unstyled) because they lacked the `data-calculation-experience` marker the print stylesheet requires — only EMI/SIP/FD/RD/Lumpsum/PPF had it. Retirement Corpus's two schedules (accumulation and retirement) are wrapped in a single `data-calculation-experience` container rather than two, since the print stylesheet absolutely-positions every such element at the same fixed offset and two independent instances would have overlapped.
- [x] A follow-up independent review confirmed the fix at the source level across all 13 calculators, not sampled: every calculator using the shared `DataTable` schedule component (EMI, SIP, Lumpsum, FD, RD, PPF, SWP, Inflation, Step-up SIP, Retirement Corpus — 10 total) carries exactly the `data-calculation-experience` marker it needs, and the 3 calculators with no schedule (CAGR, GST, Gratuity) correctly carry none.
- [ ] Print each calculator in a real browser (not emulated) and inspect actual paper/PDF pagination, page breaks across multiple pages for long schedules, and printer-specific rendering.

## 14. Security headers

- [x] Production header configuration exists and framework disclosure is disabled.
- [x] Strict CSP is explicitly deferred pending nonce-compatible validation.
- [x] Sprint 33 security/privacy audit inspected live response headers on a served production build via direct HTTP requests, not just configuration reading: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`, `Cross-Origin-Opener-Policy`, and `Strict-Transport-Security` are all present exactly as configured. No external scripts, fonts, or embeds are loaded at runtime (fonts are self-hosted via `next/font`), so clipboard, print, JSON-LD, and image sourcing have nothing external to restrict today.

## 15. HTTPS and domain

- [x] Sprint 35 confirmed `https://thinkcalculator.in` live in production: DNS resolves to Hostinger, an active certificate serves the domain, and the non-`www` host is the one serving as canonical. See section 27.
- [x] Sprint 35 confirmed via `npm run smoke-test` against the real domain: HTTP redirects to HTTPS, and `www` redirects to the canonical non-`www` host, with no redirect loops. See section 27.
- [ ] Certificate renewal has not yet been exercised (Hostinger's auto-issued certificates typically auto-renew, but a full renewal cycle has not occurred and been confirmed since go-live).

## 16. Hosting

- [x] Sprint 34 confirmed Hostinger shared hosting runs no Node.js process (Apache/LiteSpeed static-file serving only) and engineered a static-export (`output: 'export'`) build path instead of assuming a Node runtime. See decision 23 and [DEPLOYMENT.md](DEPLOYMENT.md) for the full compatibility audit, `.htaccess` header replication, and upload process.
- [x] Sprint 35 performed the actual Hostinger upload (via the GitHub Actions FTP workflow) and verified the live route table and representative responses against the real domain. See section 27.
- [x] Sprint 35 confirmed live response headers, extensionless-icon MIME types, and the custom 404 page against the real Apache/LiteSpeed instance via `npm run smoke-test` run against `https://thinkcalculator.in` — the `.htaccess` directives verified in Sprint 34 against documented syntax only are now confirmed working on the real server.
- [x] **Permanent hosting gotcha, found and fixed at go-live**: the FTP deploy workflow's `server-dir` must target the per-domain document root, `/domains/thinkcalculator.in/public_html/` — not the account-level `public_html/`. This Hostinger plan serves `thinkcalculator.in` as an addon/attached domain, and the account-level path accepts uploads without error while never actually serving them on the live domain, so the failure mode looks like a silent no-op rather than a build/deploy error. Initially misconfigured as `./public_html/`; fixed directly on `main` in commit `8536c62` ("Update server directory for deployment"). Any future redeploy, credential rotation, or migration to a different FTP workflow for this account must preserve the per-domain path. Stray files uploaded to the incorrect account-level location during the initial deploy were renamed to `public_html_unused/` (not deleted) as a reversible cleanup step.

## 17. Environment variables

- [x] Current Version 1 application does not document required secrets.
- [ ] Audit the release for environment variables and configure them securely if introduced.
- [x] Sprint 33 security/privacy audit confirmed no secrets, API keys, tokens, or credentials exist anywhere in the codebase or the full git history (all 63 commits checked); `.env*` is gitignored and no `.env` file has ever been committed.

## 18. Analytics

- [x] Sprint 36 selected GA4, loaded via `next/script` (`strategy="afterInteractive"`) only on a `STATIC_EXPORT=true` build with `NEXT_PUBLIC_GA_MEASUREMENT_ID` set — inert in `next dev` and the Playwright e2e suite. See [DECISIONS.md](DECISIONS.md) #25.
- [x] Reviewed: no custom events beyond GA4's default `page_view`; no calculator input value is ever sent to `gtag`/`dataLayer` (verified by `tests/e2e/analytics.spec.ts`); the privacy policy now names GA4 and what it collects; a non-blocking footer notice links to it; no perf regression since the script is `afterInteractive` only.
- [ ] Open item: set the real `NEXT_PUBLIC_GA_MEASUREMENT_ID` value in the production deploy environment (GitHub Actions secret or Hostinger env) — not committed to the repo. Not done as part of this sprint's code change.

## 19. Search Console

- [x] Sprint 36 added meta-tag verification (`metadata.verification.google`, from `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`) — see [DECISIONS.md](DECISIONS.md) #25.
- [x] Confirmed the existing registry-driven `app/sitemap.ts` is Search-Console-submittable as-is: it already emits absolute canonical URLs via `createCanonicalUrl`, uses `export const dynamic = "force-static"` (works under `STATIC_EXPORT`), and grows automatically as calculators/editorial/glossary/topics are published — no rebuild needed.
- [ ] Open item (manual, post-deploy, in the Search Console UI itself — see [DEPLOYMENT.md](DEPLOYMENT.md)'s new "Search Console" section): set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, redeploy, verify domain ownership, then submit `https://thinkcalculator.in/sitemap.xml` and review coverage/canonical reports.

## 20. Bing Webmaster Tools

- [ ] Verify the site, submit the sitemap, and review crawl reports.

## 21. Backup

- [ ] Document source, configuration, deployment, and hosting backup responsibilities.
- [ ] Test restoration rather than relying only on backup existence.

## 22. Rollback

- [ ] Document the last-known-good revision and rollback commands/process.
- [ ] Perform a rollback rehearsal and record expected recovery time.

## 23. Monitoring

- [ ] Configure uptime/error monitoring and ownership.
- [ ] Define alert thresholds, notification paths, log retention, and incident notes.

## 24. Post-launch smoke tests

- [x] Sprint 35 ran `npm run smoke-test` against `https://thinkcalculator.in` and confirmed 12/12 automated checks pass: homepage 200, HTTPS active, HTTP→HTTPS redirect, `www`→canonical redirect, all six security headers present, custom 404 served, `sitemap.xml` and `robots.txt` correctly hosted, and one representative route per content type (calculator, glossary, blog, topic hub) returning its correct title. See section 27.
- [ ] Manually check remaining homepage/navigation surfaces not covered by the automated smoke test: calculator indexes, all thirteen calculators, Blog, Guides, editorial search states, additional representative articles, manifest, icons, and social image.
- [ ] Run a representative calculation, share/reopen its URL, copy, print, and inspect schedules/charts on the live domain.
- [ ] Check mobile/desktop accessibility, metadata, schema, analytics, logs, and monitoring on the live domain (headers are already confirmed — see section 14 and above).

## 25. Sprint 33 — Security and privacy audit

- [x] `npm audit`: 19 moderate findings across two dependency chains (`@opentelemetry/core`, pulled in via `lighthouse`'s `@sentry/node` dependency; and `postcss`, bundled inside Next's own internal `node_modules`). Both confirmed non-production/dev-tooling-only by tracing the import graph, and already at the latest available upstream version (`lighthouse@13.4.0`, `next@16.2.10`); no safe fix exists. Re-check on future `lighthouse`/`next` version bumps.
- [x] Confirmed no secrets, API keys, tokens, or credentials exist in the codebase or the full git history. (See section 17.)
- [x] Confirmed `/calculators/demo` is inert — no network calls, no real calculation logic, and cannot be manipulated via URL parameters — and is correctly excluded from indexing, the sitemap, and site navigation, protected by four redundant regression-test tripwires (`production-readiness.test.ts`, `gst-integration.test.ts`, `gratuity-integration.test.ts`, `retirement-integration.test.ts`).
- [x] Confirmed security headers present via a real HTTP response from a served production build. (See section 14.)
- [x] Confirmed zero server-side data collection or storage and zero localStorage/sessionStorage anywhere in the codebase. Calculator inputs never leave the browser except when reflected into the page's own URL. **Superseded in part by Sprint 36** (see [DECISIONS.md](DECISIONS.md) #25 and section 18 above): GA4 is now added (production-only) and sets its own cookies; calculator inputs are still never sent to it — that guarantee is now a tested invariant (`tests/e2e/analytics.spec.ts`), not just an absence of any analytics code.
- [x] Confirmed XSS-safe handling: all 13 published calculators' URL-state parsing follows a strict parse-then-validate pattern with no raw reflection path, and all 18 `dangerouslySetInnerHTML` usages build JSON-LD from static/typed data only, with `</script>` escaping applied.
- [x] Confirmed disclaimer coverage is complete across all 13 published calculators (tailored disclaimer text) plus a sitewide footer disclaimer.
- [ ] Noted and accepted as a disclosed design tradeoff of query-parameter shareable state (decision 11): "Copy share link" encodes entered calculator values in the URL in plain text, so anyone who opens a shared link can see those values. Not currently disclosed to users. Open item: decide whether/how to disclose this in-product or in the privacy policy.
- [ ] Open item: decide whether the privacy policy should reference India's Digital Personal Data Protection Act (DPDPA), 2023.
- [ ] Open item: decide whether to invest in CSP nonce infrastructure (currently deferred — see decision 18).

## 26. Sprint 34 — Hostinger static-export deployment engineering

- [x] Confirmed by grep: no middleware, no ISR/`revalidate`, no Server Actions, and no `redirects()`/`rewrites()` anywhere in the codebase. `headers()` in `next.config.ts` is the only static-export-incompatible feature in use, and going inert under export is confirmed as Next.js's documented by-design behaviour, not a bug.
- [x] `output: 'export'` build (`npm run build:export`) produces all 57 routes, matching the non-export build's route count; the normal `next build` (non-export) was re-verified to still pass unaffected.
- [x] `app/icon.tsx`, `app/apple-icon.tsx`, `app/opengraph-image.tsx`, `app/manifest.ts`, `app/robots.ts`, and `app/sitemap.ts` needed `export const dynamic = "force-static"` to build under export; verified the actual generated `out/` files (real PNGs via `file(1)`, complete manifest/robots/sitemap content) rather than assuming compatibility.
- [x] Verified every `generateStaticParams` route (`blog/[slug]`, `glossary/[slug]`, `guides/[slug]`, `topics/[slug]`) pre-renders real server-rendered HTML with actual page content for every published path, not a client-only shell.
- [x] `public/.htaccess` added, replicating all six Sprint 33 security headers via `mod_headers`, a `ForceType image/png` fix for the three extensionless `next/og` icon routes, and `ErrorDocument 404` for the custom not-found page; confirmed it passes through into `out/.htaccess` via Next's normal `public/` copy step. Apache/LiteSpeed syntax could not be tested against a live instance in this sprint's environment (none available) — flagged above in section 16 for verification after the first live upload.
- [x] `trailingSlash: true` (export-mode only) chosen so clean folder+`index.html` URLs work with Apache's default directory handling without requiring `mod_rewrite`; reasoning recorded in decision 23 and DEPLOYMENT.md.
- [x] Local smoke test of the served `out/` directory (plain static server, not `next start`): homepage, calculator interactivity/hydration, all four dynamic-slug types, and true click-driven navigation all verified working via a headless-browser script; a true (non-fallback) static server confirmed a real 404 for unmatched routes.
- [x] Found and documented a non-blocking limitation: Next's client-router segment-prefetch requests a payload path that doesn't match the static-export output path, producing benign console 404s on hover/viewport-prefetched links; verified actual navigation is unaffected. Not fixed in this sprint (see decision 23).
- [ ] The permanent Playwright suite was not run against the static export — `playwright.config.ts` depends on `next start`, incompatible with export's `out/` output. See DEPLOYMENT.md for what a future sprint needs to add (a static-file-server webServer profile with faithful directory-index/404 behaviour) to make this possible.
- [x] `docs/DEPLOYMENT.md` added: build instructions, the full compatibility audit, `.htaccess` contents and reasoning, trailing-slash reasoning, smoke-test results, and both hPanel File Manager and FTP/SFTP upload steps.
- [x] An inert, opt-in GitHub Actions workflow (`.github/workflows/deploy-hostinger.yml`) was drafted for FTP deployment to Hostinger; its only active trigger today is manual (`workflow_dispatch`), with a guard job that fails closed until the repository owner adds FTP secrets, and a `push: branches: [main]` trigger left commented out for the owner to enable later if automatic on-push deploys are wanted — not wired to run automatically.

## 27. Sprint 35 — Domain, HTTPS, launch, and independent production verification

- [x] Canonical domain configuration, the HTTP→HTTPS and `www`→non-`www` redirect rules in `public/.htaccess`, `scripts/smoke-test.mjs`, and the GitHub Actions FTP deploy workflow's automatic `push: branches: [main]` trigger were all added and merged (`feature/sprint-35-domain-https-launch`).
- [x] The project owner completed the manual hPanel steps this repository cannot perform: connecting `thinkcalculator.in`'s DNS to the Hostinger account, issuing and activating its SSL certificate, and adding the three FTP repository secrets. See [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md).
- [x] The first live deploy ran via the GitHub Actions workflow. It initially uploaded to the wrong location — the account-level `public_html/` rather than the per-domain `domains/thinkcalculator.in/public_html/` this Hostinger plan requires for addon/attached domains — which did not fail the build or the FTP transfer, so it was only caught by checking the live domain directly rather than by CI going red. Fixed on `main` in commit `8536c62`. See section 16 for the permanent gotcha this leaves for future redeploys, and the resulting stray `public_html_unused/` cleanup.
- [x] After the fix, `npm run smoke-test` was run against `https://thinkcalculator.in` itself — not the local static export and not `localhost` — and passed all 12 checks: homepage 200, HTTPS active, HTTP→HTTPS redirect, `www`→canonical redirect, all six Sprint 33 security headers present and matching, the custom 404 page served for an unmatched route, `sitemap.xml` and `robots.txt` reachable and correctly hosted on the canonical domain, and one representative route per content type (calculator, glossary, blog, topic hub) returning 200 with its correct page-specific `<title>`.
- [x] `thinkcalculator.in` is confirmed **live in production** as of July 2026, serving the full static export — 13 published calculators across 46 sitemap-indexed routes — over HTTPS on the canonical host. This closes the deployment/DNS/HTTPS portion of Phase 4 Public Launch; see [PROJECT.md](../PROJECT.md)'s "Sprint 35 launch confirmation" for the project-level summary and remaining open items (analytics, Search Console, Bing Webmaster Tools, backups, rollback, monitoring, and real-device/real-browser/screen-reader testing).

## 28. Sprint 36 — GA4 analytics and Search Console verification

- [x] GA4 wired via `components/analytics/google-analytics.tsx` (`next/script`, `strategy="afterInteractive"`), gated by `lib/analytics-config.ts` on `STATIC_EXPORT=true` **and** `NEXT_PUBLIC_GA_MEASUREMENT_ID` being set — verified directly against real build output, not just source review: a plain `next build` and a `STATIC_EXPORT=true` build with no measurement ID both produced zero occurrences of `googletagmanager` in `out/index.html`/the server build; rebuilding with `NEXT_PUBLIC_GA_MEASUREMENT_ID` and `STATIC_EXPORT=true` both set produced the expected `<script src="https://www.googletagmanager.com/gtag/js?id=G-TESTID123">` and matching inline `gtag('config', ...)` call.
- [x] Search Console meta-tag verification wired via `metadata.verification.google` (`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`) — verified the same way: absent without the env var, renders `<meta name="google-site-verification" content="...">` with the exact configured value when set. Not gated on `STATIC_EXPORT` (harmless to include in every build).
- [x] Confirmed `app/sitemap.ts` needs no changes for Search Console submission — already registry-driven, already emits absolute canonical URLs, already `dynamic = "force-static"`-compatible with `STATIC_EXPORT`. See [DEPLOYMENT.md](DEPLOYMENT.md)'s new "Analytics and Search Console" section for the exact post-deploy submission steps (both remain manual, Search-Console-UI-side steps outside this repository).
- [x] Audited for PII leakage into analytics, per the sprint's explicit no-PII constraint: no custom GA4 events exist anywhere in the app (only the default `page_view`); `GoogleAnalytics` never reads calculator state. Also caught and fixed a real, non-obvious vector unrelated to any code added this sprint: every calculator's existing "Copy share link" feature encodes entered values into a URL query string, and GA4's default `page_location` is `location.href` — so opening someone else's shared link would otherwise send their calculator values to Google as part of the automatic page-view hit, with zero custom tracking code involved. Fixed by overriding `page_location` to `origin + pathname` in the `gtag('config', ...)` call. See [DECISIONS.md](DECISIONS.md) #25.
- [x] `tests/e2e/analytics.spec.ts` (3 tests × 3 browsers = 9 assertions, all passing): confirms no `googletagmanager.com` script tag and no `window.dataLayer` exist when the suite runs (proving the production-only gate actually holds under the real e2e build); confirms, via a stubbed `gtag`/`dataLayer`, that filling and submitting a calculator never pushes the entered value to either; confirms the same holds when the page itself is loaded directly from a share-style URL with calculator values already in the query string (the vector above).
- [x] Full verification run this sprint: `npm run lint` clean, `tsc --noEmit` clean, `vitest run` 804/804 passing (74 files), a plain `next build` 59/59 routes, a `STATIC_EXPORT=true` build 59/59 routes (both clean beyond the pre-existing documented `headers()` export warning), and the full Playwright e2e suite 351/351 passing across chromium/firefox/webkit (342 pre-existing + 9 new).
- [ ] Open item (manual, cannot be done from this repository): set the real `NEXT_PUBLIC_GA_MEASUREMENT_ID` and `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` values as GitHub repository secrets, then complete Search Console verification and sitemap submission in the Search Console UI itself. See [DEPLOYMENT.md](DEPLOYMENT.md).
- [ ] Bing Webmaster Tools remains explicitly out of scope (deferred), per section 20.
