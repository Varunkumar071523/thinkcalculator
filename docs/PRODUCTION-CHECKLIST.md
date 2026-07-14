# ThinkCalculator Production Checklist

Checked items are verified in the current source/build baseline. Deployment-specific and live-domain checks remain open until performed in the target environment.

## 1. Source control

- [x] Git repository and reviewed feature-branch history exist.
- [x] Application and content configuration are version-controlled.
- [ ] Confirm the release branch is current and the deployment diff is clean.
- [ ] Record the exact deployed commit.

## 2. Tests

- [x] `npm run test` passes: 515 tests across 47 files after Sprint 21 SWP integration and independent review.
- [x] Core calculations, URL state, schedules, registries, content exclusions, cluster reciprocity, learning-path integrity, search/sitemap boundaries, and production configuration have automated coverage.
- [ ] Re-run the full suite on the release commit in CI or the deployment environment.

## 3. Lint and build

- [x] `npm run lint` passes for the current Sprint 21 source baseline.
- [x] `npm run build` passes for the current Sprint 21 source baseline.
- [x] `git diff --check` passes for the current Sprint 21 source baseline.
- [ ] Repeat all checks for the release commit with production configuration.

## 4. Static-route verification

- [x] Current public routes build as static or SSG output.
- [x] Four editorial routes are generated from published registry items.
- [x] Twelve glossary term routes are generated from published registry items.
- [x] Two substantive topic routes are generated from eligible published definitions; draft and sparse topics are excluded.
- [x] `/search` keeps a static page shell and derives results client-side from a small public registry projection behind Suspense.
- [x] The Sprint 21 production build generates 53 static/SSG pages, including `/finance/swp-calculator` and `/glossary/swp` exactly once.
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
- [x] Charts have textual values and do not depend on colour alone.
- [ ] Complete keyboard-only and screen-reader testing on representative live pages.
- [ ] Verify zoom, reflow, contrast, status announcements, and reduced motion.

## 10. Browser testing

- [ ] Test current Chrome, Firefox, Safari, and Edge, including search submission, refresh, and back/forward navigation.
- [ ] Verify navigation, forms, sharing, clipboard, schedules, errors, and editorial anchors.

## 11. Mobile testing

- [x] Layouts are implemented mobile-first with contained table overflow.
- [ ] Test representative physical iOS and Android devices.
- [ ] Confirm no page-level horizontal scrolling or obscured controls.

## 12. Calculator validation

- [x] Eleven production calculators have unit tests and worked examples.
- [x] Validation is separate from pure calculation logic.
- [ ] Cross-check representative scenarios against independent trusted calculations.
- [ ] Verify rounding, extremes, invalid input, and provider-specific caveats manually.

## 13. Print testing

- [x] Browser Print / Save as PDF actions are implemented; no PDF generator is required.
- [ ] Print each calculator in supported browsers and inspect clipping, page breaks, charts, and schedules.

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
