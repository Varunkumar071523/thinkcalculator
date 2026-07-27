# Deployment (Hostinger static hosting)

Sprint 34 scope was build and hosting engineering. Sprint 35 added the canonical-domain configuration, the HTTPS/canonical-host redirect chain in `public/.htaccess`, the smoke-test script, and GitHub Actions auto-deploy — all code/config/tooling. Neither sprint covers the manual hPanel steps themselves (connecting the domain, activating SSL, the first upload if not using GitHub Actions) — those remain for the project owner to perform; see [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md) for the full ordered list and [PRODUCTION-CHECKLIST.md](PRODUCTION-CHECKLIST.md) sections 15–16.

## Why static export

Hostinger's shared hosting plans serve files over Apache/LiteSpeed only — they do not run a Node.js process, so `next start` cannot be hosted there. ThinkCalculator has zero `app/api` routes and no middleware, ISR/`revalidate`, or Server Actions (confirmed by grep as part of the Sprint 34 audit), so the whole site already builds as static/SSG output. Next.js's [static export](https://nextjs.org/docs/app/guides/static-exports) (`output: 'export'`) turns that into a plain `out/` directory of HTML/CSS/JS that can be uploaded to `public_html` directly. See [decision 23](DECISIONS.md) for the full record.

## Building the static export

Static export is **opt-in**, not the default build mode — see the `next.config.ts` comment and decision 23 for why. Normal `next dev`, `next build`, and `next start` are unaffected.

```bash
npm run build:export
```

This runs `next build` with `STATIC_EXPORT=true` (via `scripts/build-export.mjs`, which sets the env var in a way that works identically on Windows and POSIX shells — see the script comment). Output lands in `out/`.

Expected build warnings (informational, not errors — see the static-export compatibility audit below):

```
⚠ Specified "headers" will not automatically work with "output: export".
⚠ rewrites, redirects, and headers are not applied when exporting your application, detected (headers).
```

## Static-export compatibility audit (Sprint 34)

What was checked and the result:

| Feature | Result |
| --- | --- |
| `headers()` in `next.config.ts` | Confirmed inert under export, by Next.js design — not a bug. `public/.htaccess` (below) is the real enforcement mechanism for static hosting. |
| `redirects()` / `rewrites()` | Not used anywhere in this codebase (grepped `next.config.ts`); nothing to lose. |
| Middleware | None exists in the repo (`middleware.ts` absent). |
| ISR / `revalidate` | Not used anywhere (grepped `app/`, `features/`, `lib/`, `content/`). |
| Server Actions (`"use server"`) | Not used anywhere (grepped the same paths). |
| `app/icon.tsx`, `app/apple-icon.tsx`, `app/opengraph-image.tsx` (`next/og` `ImageResponse`) | Build initially **failed** under export: `Error: export const dynamic = "force-static" ... not configured on route "/apple-icon"`. Fixed by adding `export const dynamic = "force-static"` to all three files. This is a real, permanent, mode-independent fix (harmless under normal server builds too, since these routes were already effectively static) — it now lives outside the `STATIC_EXPORT` conditional in `next.config.ts`. Verified the actual output files in `out/`: real PNGs (`file` reports `180×180`, `512×512`, and `1200×630` PNG image data respectively), not placeholders. |
| `app/manifest.ts`, `app/robots.ts`, `app/sitemap.ts` (Metadata API routes) | Same failure, same fix (`dynamic = "force-static"`). Verified `out/manifest.webmanifest`, `out/robots.txt`, and `out/sitemap.xml` contain the correct, complete generated content (all static routes, published calculators, editorial items, glossary terms, and topic hubs — same content as the non-export build). |
| `blog/[slug]`, `glossary/[slug]`, `guides/[slug]`, `topics/[slug]` (`generateStaticParams`) | All paths pre-render as real HTML files with real content, not a client-only shell — verified directly: `out/glossary/` contains all 14 published terms, `out/blog/` both posts, `out/guides/` both guides, `out/topics/` both hubs, each `index.html` inspected and confirmed to contain the actual page's `<h1>` and body content server-rendered into the file. |
| Extensionless icon output files (`out/icon`, `out/apple-icon`, `out/opengraph-image`) | Next names these after the route with no file extension. Verified with a plain static server that Apache's default MIME handling would serve them as `application/octet-stream` without help — fixed via `ForceType image/png` in `.htaccess` (see below). |
| Link-hover/viewport prefetch of RSC "segment" payloads | **Known, non-blocking limitation** — see the "Segment-prefetch 404s" note below. Does not affect page loads or click-navigation. |

Full production build (`npm run build`, non-export) still passes at 57/57 routes with no warnings, confirming the `STATIC_EXPORT` toggle doesn't regress the normal build.

### Segment-prefetch 404s (known limitation, non-blocking)

Next.js's client router prefetches "segment" RSC payloads for links as they enter the viewport, requesting e.g. `/finance/__next.finance.__PAGE__.txt`. Under static export, Next actually writes that payload to a *nested* path, `out/finance/__next.finance/__PAGE__.txt` — the two paths don't match under plain file serving, so a static host (Apache included) will 404 that specific background request. This is a real mismatch, verified directly against the built `out/` tree and reproduced with a local static server plus a headless browser.

This does **not** break the site: it's a background prefetch optimization, not the navigation itself. Verified with Playwright: clicking an actual link (not just prefetching it) navigates correctly and renders the destination page's real title and content every time. The only symptom is benign `404` lines in the browser console for prefetched-but-unclicked links. Fixing it would require either an Apache rewrite rule mapping the dotted request path to the nested file path (fragile — Next's internal naming convention isn't a stable public contract and could change on any future Next.js upgrade) or disabling per-link prefetch in code (a product/code change out of this sprint's configuration-only scope). Recorded here as a decision needed by the project owner, not fixed in this sprint.

## Security headers under static hosting: `public/.htaccess`

`next.config.ts`'s `headers()` function only runs inside a live Next.js server process. Hostinger never runs one, so it's a no-op there. `public/.htaccess` (passed through into `out/.htaccess` by Next's normal `public/` copy step, verified in the built output) is the real enforcement mechanism in production, replicating every header from `lib/production-config.ts`'s `securityHeaders` (the Sprint 33 security/privacy audit baseline) line for line:

```apache
<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Cross-Origin-Opener-Policy "same-origin"
  Header always set Strict-Transport-Security "max-age=31536000"
</IfModule>

<IfModule mod_mime.c>
  <FilesMatch "^(icon|apple-icon|opengraph-image)$">
    ForceType image/png
  </FilesMatch>
</IfModule>

ErrorDocument 404 /404.html
```

Notes:

- `Header always set` (not plain `Header set`) is the standard `mod_headers` form that applies the header on error responses too, not only `2xx`. `mod_headers` is enabled by default on Apache/LiteSpeed shared-hosting stacks, including Hostinger's.
- `Strict-Transport-Security` is included here per the Sprint 33 baseline. It only takes effect once the site is actually served over HTTPS (Sprint 35); serving it over plain HTTP is harmless (browsers ignore `Strict-Transport-Security` on non-HTTPS responses).
- The `mod_mime`/`ForceType` block exists because `app/icon.tsx`, `app/apple-icon.tsx`, and `app/opengraph-image.tsx` export as extensionless files (`out/icon`, `out/apple-icon`, `out/opengraph-image` — confirmed with `file(1)` to be real PNG data). Without it, Apache's default extension-based MIME handling would serve them as `application/octet-stream`.
- `next.config.ts`'s `headers()` is deliberately left in place (see its comment) so the same configuration still applies automatically if the app is ever hosted on a Node runtime again — it is unused, not removed.

## Trailing slash / clean URLs

`trailingSlash: true` is set (only under `STATIC_EXPORT`, in `next.config.ts`). This makes Next emit `/finance/emi-calculator/index.html` instead of `/finance/emi-calculator.html`. Reasoning:

- Apache's default directory handling (`mod_dir`) serves `index.html` for a directory request and auto-redirects a directory path missing its trailing slash (`DirectorySlash`, on by default) — so folder+`index.html` output works with Hostinger's default Apache configuration out of the box, no `.htaccess` rewrite rules required.
- The alternative (`trailingSlash: false`, the default) emits flat `.html` files and requires `mod_rewrite` rules to strip the `.html` extension for clean URLs — Next's own static-export documentation shows this exact Nginx/Apache rewrite requirement. That's an extra dependency on `mod_rewrite` being enabled and correctly configured, which is not something to assume sight-unseen on shared hosting.
- Verified directly: the built `out/` tree has `finance/emi-calculator/index.html` (and the same shape for every route), and a local static-file-server smoke test confirmed `/finance/emi-calculator/` resolves correctly.

The custom 404 page (`app/not-found.tsx`) exports as `out/404.html` (verified: 60,662 bytes of real page content, distinct from `out/index.html`). The `.htaccess` `ErrorDocument 404 /404.html` directive tells Apache to serve it for unmatched routes instead of a generic Apache error page.

## Local verification performed this sprint

Static file servers used: a plain Python `http.server` (true static behavior — real per-file 404s, no fallback) was used for the routing/interactivity checks; the `serve` npm package was tried first but discarded after it turned out to silently serve `index.html` content for *other* real files under some conditions (a `serve`-specific quirk, not a defect in the export — caught by comparing byte-for-byte against the on-disk file and its `<title>`).

Checked, via `curl` and a headless-Playwright script driving a real browser against the served `out/`:

- Homepage loads (200, correct title, correct `<h1>`).
- `/finance/emi-calculator/` loads, and is interactive: filling the principal input and confirming the page updates with an EMI/monthly result (client-component hydration confirmed working).
- One page from each dynamic-slug type loads with real pre-rendered content and the correct per-page `<title>` (not the homepage's): `/glossary/emi/`, `/blog/understanding-loan-emi/`, `/guides/how-to-use-emi-calculator/`, `/topics/loans/`.
- An unmatched route returns a true `404` status from a real static server (confirming there's no accidental catch-all route swallowing bad URLs in the export itself); Apache's custom `404.html` behavior specifically requires Apache and could not be verified without one available in this environment (see limitation below).
- Real click-driven navigation (not just direct URL loads) between pages works correctly, confirmed with Playwright clicking an actual homepage nav link and asserting the resulting URL and title.
- No console errors on any checked page except the expected, non-blocking segment-prefetch 404s described above.

**Limitation**: no Apache or LiteSpeed instance was available in this sandboxed environment (no `httpd`/`apache2`/Docker on `PATH`), so the `.htaccess` directives themselves — the header replication, the `ForceType` MIME fix, and `ErrorDocument 404` — could not be exercised against a real Apache process. The syntax was verified against documented `mod_headers`/`mod_mime`/core Apache directive patterns, not against a live server. **Recommended follow-up**: immediately after the first Hostinger upload (Sprint 35), run `curl -I` against a few representative URLs and confirm all six headers are present, the extensionless icon files return `image/png`, and a deliberately-wrong URL returns the custom 404 page.

## Running the existing Playwright suite against the static export

**Still not run for the main suite (`tests/e2e/a11y.spec.ts`/`keyboard.spec.ts`/`reflow.spec.ts`/`print.spec.ts`).** Sprint 45 built the Node static-file-server piece this section called for (`scripts/serve-static-export.mjs`) and a dedicated Playwright config/orchestration script (`playwright.analytics.config.ts` / `scripts/run-e2e-analytics.mjs`) — but scoped narrowly to the new `tests/e2e-analytics/` GA4-consent suite (see the "Consent Mode v2 and custom events" section above), per that sprint's explicit "don't touch `playwright.config.ts`/`scripts/run-e2e.mjs`" scope boundary. The static-server infrastructure below is now proven to work (steps 1-2 are done); re-pointing the *main* suite at it (steps 3-4) remains open. The existing `playwright.config.ts` still starts `next start -p 3104` as its `webServer`, which requires a normal (non-export) `.next` server build — fundamentally incompatible with `output: 'export'`, which produces no server build to start. To finish this in a future sprint:

1. ~~Add a second Playwright project/config~~ **Done (Sprint 45), for the analytics suite:** `scripts/serve-static-export.mjs` is a Node static file server with faithful directory-index and real per-path 404 behavior (the `serve` package's fallback behavior was disqualified in Sprint 34; this replicates the Python `http.server` semantics that worked, in portable Node). Reuse it directly for the main suite rather than building a second server.
2. That static server would need to replicate Apache's automatic trailing-slash redirect for the suite's existing route strings (many of which are written without a trailing slash), or the test suite's URLs would need updating.
3. Re-run `tests/e2e/a11y.spec.ts`, `keyboard.spec.ts`, `reflow.spec.ts`, and `print.spec.ts` against that server and confirm every assertion still holds — expected to hold, since the rendered HTML/CSS should be equivalent to the non-export build, but not yet verified.
4. Decide whether this becomes a permanent second CI target (export-mode regression coverage) or a one-off pre-deployment check.

## Uploading to Hostinger

Two supported paths — pick whichever you're comfortable with; both upload the same `out/` contents to `public_html`.

### Option A: hPanel File Manager

1. Run `npm run build:export` locally.
2. Compress the **contents** of `out/` (not the `out` folder itself) into a `.zip`.
3. In hPanel, go to **Files → File Manager**, open `public_html`, and upload the `.zip`.
4. Use File Manager's "Extract" action on the uploaded `.zip` inside `public_html`, then delete the `.zip`.
5. Confirm `public_html/index.html`, `public_html/.htaccess`, and `public_html/_next/` all exist at the top level of `public_html` (not nested inside an extra `out/` subfolder).

### Option B: FTP/SFTP

1. Run `npm run build:export` locally.
2. In hPanel, go to **Files → FTP Accounts** to find (or create) FTP/SFTP credentials — host, username, password, and port. This is a manual hPanel step only you can perform; nothing in this repository has or needs those credentials.
3. Connect with an FTP/SFTP client (FileZilla, WinSCP, Cyberduck, etc.) using those credentials.
4. Upload the entire contents of `out/` into `public_html` (again, contents — not the folder itself), overwriting existing files.
5. Confirm `.htaccess` uploaded correctly — some FTP clients hide dotfiles by default; enable "show hidden files" in the client if `.htaccess` doesn't appear in the local file listing.

### What remains manual after Sprint 35

Sprint 35 added the code/config side of launch: the canonical domain is configured throughout (see `lib/site-config.ts`), the HTTP→HTTPS and www→non-www redirect rules are written into `public/.htaccess`, and `scripts/smoke-test.mjs` is ready to verify a live deployment end-to-end. None of the following can be done from this repository or environment, and still require the project owner acting directly in hPanel: pointing `thinkcalculator.in`'s DNS at Hostinger, issuing/activating an SSL certificate, and confirming the redirect/header rules actually take effect once Apache is serving over HTTPS. See [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md) for the exact ordered steps and [PRODUCTION-CHECKLIST.md](PRODUCTION-CHECKLIST.md) sections 15–16.

## Automated deployment via GitHub Actions

`.github/workflows/deploy-hostinger.yml` builds the static export and deploys it to Hostinger over FTPS. As of Sprint 35 it runs automatically on every push to `main`, and can also be triggered manually from the Actions tab (`workflow_dispatch`). A guard job still fails the run closed with an explanatory message if the three FTP secrets below aren't configured yet — it does not silently attempt (and fail) an FTP connection, and it passes through harmlessly on every run once the secrets exist.

### Adding the three required repository secrets

The workflow needs `FTP_HOST`, `FTP_USERNAME`, and `FTP_PASSWORD` as GitHub **repository secrets** (never committed to the repo itself). To add them:

1. In hPanel, go to **Files → FTP Accounts** to find the values:
   - **Host** — the FTP server address shown there (often the domain itself or an `ftp.` subdomain).
   - **Username** — the FTP account username shown there.
   - **Password** — either the existing password (if you still have it) or use hPanel's "Change password" action on that FTP account to set a new one.
2. On GitHub, open this repository in the browser and go to **Settings → Secrets and variables → Actions**.
3. Click **New repository secret**, enter the name `FTP_HOST`, paste the hPanel host value, and save.
4. Repeat step 3 for `FTP_USERNAME` and `FTP_PASSWORD`, using the matching hPanel values.
5. Once all three exist, the next push to `main` (or a manual `workflow_dispatch` run from the Actions tab) will build and deploy automatically. Before that, every run still fails closed at the guard job with a clear `::error::` message naming the missing secrets — nothing is deployed and no FTP connection is attempted.

This is one of the manual steps only the project owner can perform — see [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md) for where it fits among the other launch steps.

## Analytics and Search Console (Sprint 36)

Both GA4 and Search Console verification are environment-variable-driven and optional at build time — omitting either simply ships that feature inert, same as any other build. See [DECISIONS.md](DECISIONS.md) #25 for the full reasoning (why GA4, why the meta-tag verification method, why gated on `STATIC_EXPORT` rather than `NODE_ENV`, and the DPDPA disclosure approach).

### GA4

1. The GA4 property for `thinkcalculator.in` has been created (Sprint 45); its Measurement ID is **`G-EV1LDDV3XG`**. (If it ever needs recreating: Admin → Create Property, then find the Measurement ID under Admin → Data Streams → your web stream — it looks like `G-XXXXXXXXXX`.)
2. Add it as the `NEXT_PUBLIC_GA_MEASUREMENT_ID` GitHub repository secret (Settings → Secrets and variables → Actions → New repository secret), value `G-EV1LDDV3XG`, same location as the three `FTP_*` secrets. The `deploy-hostinger.yml` workflow already passes it through to the build (see its `Build static export` step). This is the one place the real ID is configured — it is never hardcoded into source, matching `lib/analytics-config.ts`'s single-config-location design.
3. The next deploy (push to `main`, or a manual `workflow_dispatch` run) will ship with GA4 active. Locally, `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-EV1LDDV3XG STATIC_EXPORT=true npx next build` reproduces the same production behavior for manual verification before relying on CI.
4. It will **not** load under `next dev`, a plain `next build`/`next start`, or the Playwright e2e suite, regardless of whether the env var is set locally — it additionally requires `STATIC_EXPORT=true`, which only `npm run build:export` (and the CI workflow) ever sets. This is intentional: test runs must never pollute production analytics data.
5. After the first deploy with the ID set, confirm real-time traffic appears in GA4's Admin → Realtime report by visiting the live site.
6. Recommended one-time manual check (can't be verified from this sandboxed environment, same limitation class as the `.htaccess` header checks above): open a calculator, accept the consent banner, click "Copy share link" to get a URL with query-string values in it, open that URL in a fresh tab, accept consent again, and confirm in GA4's Realtime → "Event count by Event name" (or the browser's Network tab, inspecting the `collect`/`g/collect` request's `dl`/`page_location` parameter) that the recorded page location has no query string — confirming the `page_location` override in `components/analytics/google-analytics.tsx` actually works end-to-end against real `gtag.js`, not just by reading the source.

### Consent Mode v2 and custom events (Sprint 45)

GA4 now loads behind Google Consent Mode v2 (`analytics_storage` defaults to `denied`; a visitor must Accept the on-page banner before any hit — including the automatic `page_view` — is actually sent) and fires two custom events, `calculation_completed` and `result_shared`, whose payloads are structurally limited to `calculator_type`/`category` identifiers only. See [DECISIONS.md](DECISIONS.md) #37 for the full design and no-PII verification.

A dedicated Playwright suite proves this against a real static export, since the main `tests/e2e/` suite deliberately never builds with GA4 enabled:

```bash
npm run test:e2e:analytics
```

This builds `out/` with `STATIC_EXPORT=true` and a test-only measurement ID, serves it with a small Node static file server (`scripts/serve-static-export.mjs` — real per-path 404s, the Node-portable equivalent of the Sprint 34 Python `http.server` verification method this section previously flagged as missing), and runs `tests/e2e-analytics/consent.spec.ts` against it with `googletagmanager.com`/`google-analytics.com` requests intercepted by a local stub (so it never depends on real network access or Google's actual script internals). It is intentionally chromium-only and not part of `npm test` — it exists to prove the consent/event wiring once against real static-export output, not to duplicate the main suite's cross-browser coverage.

### Search Console

1. In [Google Search Console](https://search.google.com/search-console), add `thinkcalculator.in` as a property using the **HTML tag** verification method (not the domain-wide DNS method, and not the HTML-file method — a static export can't easily ship a dynamically-named file per verification token, but a meta tag bakes in at build time with zero extra routes; see decision 25).
2. Copy the `content` value Search Console gives you for the `<meta name="google-site-verification" ...>` tag.
3. Add it as the `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` GitHub repository secret, same as above.
4. Deploy, then click "Verify" in Search Console against the live domain.
5. Once verified, submit the sitemap: Search Console → Sitemaps → add `sitemap.xml` (resolves to `https://thinkcalculator.in/sitemap.xml`). `app/sitemap.ts` is already registry-driven and grows automatically as calculators, editorial content, glossary terms, and topic hubs are published — no code change is needed here or for any future content addition.
6. Review the Coverage/Indexing and canonical reports over the following days — these take real crawl time and cannot be verified synchronously from this repository.

### Bing Webmaster Tools

Out of scope for Sprint 36 (see [PRODUCTION-CHECKLIST.md](PRODUCTION-CHECKLIST.md) section 20) — deferred to a future sprint.
