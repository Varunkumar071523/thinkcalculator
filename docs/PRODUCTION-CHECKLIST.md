# ThinkCalculator Production Checklist

Use this checklist before each public deployment. Items remain unchecked until verified in the target environment.

## Build and tests

- [ ] Run the complete Vitest suite.
- [ ] Run ESLint without warnings.
- [ ] Complete a production build with the deployment environment configuration.
- [ ] Confirm all intended routes are statically generated.

## SEO

- [ ] Inspect titles, descriptions, canonicals, Open Graph, and Twitter cards on deployed pages.
- [ ] Validate Organization, WebSite, calculator, breadcrumb, and FAQ structured data.
- [ ] Open the deployed sitemap and robots routes.
- [ ] Submit the production sitemap in Search Console after launch.

## Accessibility

- [ ] Navigate the header, calculator forms, results, schedules, content, and footer using only a keyboard.
- [ ] Test skip navigation, focus visibility, validation messages, and live status announcements.
- [ ] Test with a screen reader on at least one desktop and one mobile platform.
- [ ] Check zoom, reflow, contrast, reduced motion, and table scrolling.

## Security headers

- [ ] Inspect deployed response headers and confirm the configured policies are present.
- [ ] Confirm clipboard, print, generated images, and external links still work.
- [ ] Design and validate a nonce-compatible Content Security Policy before enabling one.

## Browser, mobile, and print testing

- [ ] Test current Chrome, Firefox, Safari, and Edge releases.
- [ ] Test representative small, medium, and large viewports on physical devices where possible.
- [ ] Confirm there is no page-level horizontal scrolling.
- [ ] Print or save each calculator result as PDF and inspect schedules.

## Deployment and operations

- [ ] Verify HTTPS, redirects, DNS, caching, and the production domain.
- [ ] Confirm generated icon, Apple icon, manifest, and social-image routes load.
- [ ] Configure privacy-respecting analytics only after a separate review.
- [ ] Document hosting backups and test the restore process.
- [ ] Record the deployed revision and a rollback procedure.
