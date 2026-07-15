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
- [ ] Inspect live response headers and verify clipboard, print, JSON-LD, images, and external links.

## 15. HTTPS and domain

- [ ] Verify `https://thinkcalculator.in`, certificate chain, renewal, DNS, redirects, and preferred host.
- [ ] Verify HTTP-to-HTTPS and alternate-host behaviour without loops.

## 16. Hosting

- [ ] Confirm the Hostinger environment supports the built Next.js application and headers.
- [ ] Verify Node/runtime version, build/start commands, caching, logs, resource limits, and restart behaviour.

## 17. Environment variables

- [x] Current Version 1 application does not document required secrets.
- [ ] Audit the release for environment variables and configure them securely if introduced.
- [ ] Confirm no secret is committed or exposed to client bundles.

## 18. Analytics

- [ ] Select a privacy-appropriate analytics approach.
- [ ] Review consent, retention, privacy policy, performance, and event naming before enabling it.

## 19. Search Console

- [ ] Verify domain ownership.
- [ ] Submit the production sitemap and review coverage/canonical reports.

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

- [ ] Check homepage, navigation, calculator indexes, all nine calculators, Blog, Guides, editorial search states, representative articles, 404, robots, sitemap, manifest, icons, and social image.
- [ ] Run a representative calculation, share/reopen its URL, copy, print, and inspect schedules/charts.
- [ ] Check mobile/desktop accessibility, metadata, schema, headers, analytics, logs, and monitoring.
