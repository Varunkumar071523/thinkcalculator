# ThinkCalculator

ThinkCalculator is an India-focused platform for transparent finance and business calculators with educational content. The current platform includes EMI, SIP, Step-up SIP, Lumpsum, FD, RD, CAGR, PPF, GST, and Gratuity calculators plus statically generated Blog, Guide, Glossary, Topic Hub, and editorial-search experiences.

The Step-up SIP calculator at `/finance/step-up-sip-calculator` increases the monthly contribution after each completed block of 12 contributions using either a percentage or fixed rupee amount. It follows the regular SIP calculator's beginning-of-month timing and monthly return conversion, compares the result with a constant SIP, and treats the return as an educational assumption rather than a forecast.

The PPF calculator at `/finance/ppf-calculator` uses an editable constant-rate annual projection, beginning-of-year contribution timing, official deposit limits, five-year extension options, shareable URL state, and an annual schedule. Its 7.1% reference default is centrally documented against the NSI scheme text for deposits and balances on or after 1 April 2020; it is not presented as a current-rate claim or guaranteed outcome. The official source records were checked on 13 July 2026; the accessible Department of Economic Affairs notification published on 30 March 2026 is recorded without inferring a rate from its non-text-verifiable table.

The GST calculator at `/business/gst-calculator` adds GST to an exclusive amount or removes embedded GST from an inclusive amount. It supports user-selected intra-State CGST plus SGST/UTGST arithmetic or inter-State IGST arithmetic, common presets and custom rates, strict shareable URL state, and a published GST glossary term. Presets are not classification advice, and the calculator does not determine place of supply, cess, input tax credit, filing, or compliance. Its official source records were checked on 13 July 2026.

The Gratuity calculator at `/finance/gratuity-calculator` estimates the standard statutory amount for a regular monthly rated employee from last-drawn eligible wages and completed service. It applies the current 15/26 method, treats only additional service in excess of six months as another counted year, shows the amount before and after the currently confirmed ₹20 lakh ceiling, warns without making a definitive eligibility decision, and links to a substantive `/glossary/gratuity` term. Code on Social Security, 2020 commencement, wage-definition, formula, exception, transition, and ceiling sources were reviewed on 13 July 2026.

Public learning hubs are available at `/topics`, with substantive initial clusters for loans and investing. Topic relationships use stable registry IDs and resolve live titles, descriptions, statuses, and paths from the calculator, editorial, and glossary registries. Those same relationships generate reciprocal, contextual navigation on eligible calculator, article, guide, and glossary pages, while each hub provides a linked learning path.

Published learning resources can be searched at `/search?q=emi`. This static-shell search covers blogs, guides, glossary terms, and eligible public topic hubs; the homepage search remains calculator-only.

The project is in a post-foundation documentation freeze. Public deployment to <https://thinkcalculator.in> is planned but must not be assumed complete.

## Local setup

Requires a current Node.js LTS release and npm.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. A clean build needs network access for the existing Google-hosted Geist font files.

## Commands

```bash
npm run test
npm run lint
npm run build
npm run start
```

## Documentation

- [Current project status](PROJECT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [Contributing](docs/CONTRIBUTING.md)
- [Editorial content guide](docs/CONTENT-GUIDE.md)
- [Production checklist](docs/PRODUCTION-CHECKLIST.md)
- [Architecture decisions](docs/DECISIONS.md)
- [Changelog](docs/CHANGELOG.md)
