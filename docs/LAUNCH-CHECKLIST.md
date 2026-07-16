# Launch checklist (Sprint 35)

Every step below is a **manual action in Hostinger's hPanel or GitHub's UI**, performed by the project owner. Nothing in this repository can perform any of them — Sprint 35 only prepared the code, config, and tooling these steps depend on (see [DEPLOYMENT.md](DEPLOYMENT.md) and [DECISIONS.md](DECISIONS.md) #23). Work through them in order; several later steps assume an earlier one is already done.

## 1. Confirm the domain is connected to the hosting account

- In hPanel, confirm `thinkcalculator.in` is added and pointed at this Hostinger hosting account (nameservers or DNS A/CNAME records, depending on where the domain is registered).
- If the domain was registered elsewhere and hasn't been pointed at Hostinger yet, do that first — every step after this one assumes the domain already resolves to this hosting account.
- DNS changes can take anywhere from a few minutes up to ~48 hours to propagate fully, depending on registrar and record TTLs. Confirm the domain actually resolves to Hostinger (e.g. `nslookup thinkcalculator.in` or `dig thinkcalculator.in`, or hPanel's own DNS status indicator) before moving on to step 2 — attempting SSL activation or smoke-testing against a domain that hasn't finished propagating will fail in ways that look like a code or config problem but aren't.

## 2. Activate SSL/HTTPS for the domain

- In hPanel, issue and activate an SSL certificate for `thinkcalculator.in` (Hostinger typically offers a free auto-issued certificate, e.g. Let's Encrypt, alongside options to install your own).
- Confirm the certificate covers both `thinkcalculator.in` and `www.thinkcalculator.in` (the `public/.htaccess` redirect rule sends `www` traffic to the non-`www` canonical host — see step 5 — but the certificate still needs to cover the `www` hostname so that redirect itself can be served over HTTPS rather than erroring with a certificate mismatch).
- Until this step is done, `public/.htaccess`'s `Strict-Transport-Security` header and HTTP→HTTPS redirect rule are inert (harmless, but not yet enforceable — there is no HTTPS to redirect to).

## 3. First upload (only if not using GitHub Actions)

- If you plan to rely on the GitHub Actions auto-deploy (steps 4–5 below), you can skip straight to step 4 — the workflow performs the first upload for you on its first successful run.
- If you'd rather do a manual first upload (e.g. to get something live before wiring up CI), follow [DEPLOYMENT.md](DEPLOYMENT.md)'s "Uploading to Hostinger" section (hPanel File Manager or FTP/SFTP), after running `npm run build:export` locally.

## 4. Add the three GitHub repository secrets

- `FTP_HOST`, `FTP_USERNAME`, `FTP_PASSWORD` — from hPanel → Files → FTP Accounts, added under this repository's Settings → Secrets and variables → Actions → New repository secret.
- Full step-by-step instructions, including exactly where to find each value in hPanel, are in [DEPLOYMENT.md](DEPLOYMENT.md)'s "Adding the three required repository secrets" section.
- Until all three secrets exist, `.github/workflows/deploy-hostinger.yml`'s guard job fails every run closed with a clear error message — no FTP connection is attempted and nothing is deployed.

## 5. Trigger or wait for the first auto-deploy

- The workflow now runs automatically on every push to `main` (enabled in Sprint 35), so merging this sprint's branch to `main` — once the secrets from step 4 exist — will trigger the first automated deploy on its own.
- To deploy on demand instead of waiting for a push, open this repository's **Actions** tab, select **Deploy to Hostinger**, and run it manually via **Run workflow** (`workflow_dispatch`).
- Watch the run in the Actions tab; confirm the `build-and-deploy` job completes successfully, not just the `guard` job.

## 6. Run the smoke test against the live site

- Once the deploy in step 5 has completed and DNS/SSL from steps 1–2 are active, run:
  ```bash
  npm run smoke-test
  ```
  This checks `https://thinkcalculator.in` by default (override with `npm run smoke-test -- <url>` or `SMOKE_TEST_BASE_URL`). See `scripts/smoke-test.mjs`'s header comment for the full list of checks and their local-testing limitations.
- Confirm every check reports `PASS`, in particular the ones that are only meaningful against the real live domain: HTTPS is active, HTTP→HTTPS redirects, `www` redirects to the canonical non-`www` host, and the security headers are present (this last one requires Apache to actually be interpreting `public/.htaccess`, which only a real Hostinger deploy — not any local static file server — provides).
- If any check fails, cross-reference it against [PRODUCTION-CHECKLIST.md](PRODUCTION-CHECKLIST.md) sections 14–16 before treating the site as launched.

## After this checklist

Once all six steps pass, update [PROJECT.md](../PROJECT.md)'s "Known limitations and risks" section to remove the now-resolved "Production deployment, DNS, HTTPS... remain unverified" line, and update [PRODUCTION-CHECKLIST.md](PRODUCTION-CHECKLIST.md) sections 15–16 to check off the items this checklist covered.
