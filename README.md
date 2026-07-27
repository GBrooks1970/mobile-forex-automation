# Mobile Forex Automation

Mobile test-automation portfolio project — the mobile discipline for the
[test-automation portfolio](https://gbrooks1970.github.io/portfolio/).

Because the source spec (a Mobile Forex Trading App PRS) describes an application that doesn't exist,
this project delivers **two** things:

1. a **minimal System Under Test** — a responsive-web vertical slice of the PRS's MVP (demo login →
   5-pair watchlist with tick flashes → market order → close → P&L → history → adaptive layout),
   driven by a **deterministic, seeded mock price feed** (never live data); and
2. the **mobile test-automation suite** that exercises it — **Playwright device emulation**
   (Pixel / iPhone, touch, viewport, responsive breakpoints) plus a **Vitest** unit suite for the
   pure P&L / validation core.

The automation is the deliverable; the SUT exists only to be tested.

**[Launch the live demo](https://gbrooks1970.github.io/mobile-forex-automation/)** — any
well-formed email and password opens a £10,000 demo profile. No real money or live market data is
used. The demo intentionally persists only the signed-in profile: **trading balance changes, open
positions, and trade history reset on reload**. The matching in-app cue is: “Demo activity resets on
reload; your profile stays signed in.” See
[`ADR-0002`](docs/adr/ADR-0002-profile-only-persistence.md) for the approved boundary.

## Status

**Delivery and review remediation — complete.** MF-01…MF-14, TRIAGE-01…06, and CODEX-01…10
cover the responsive SUT, deterministic domain core, desktop/mobile E2E, real Pixel/iPhone
breakpoint checks, Screenplay journeys, CI gate, verified Pages deployment, registry onboarding,
[v1 handover](https://github.com/GBrooks1970/test-automation-portfolio/blob/main/session-notes/mobile-forex-automation_session-notes_v1_20260714T0629Z.md),
and [portfolio landing card](https://gbrooks1970.github.io/portfolio/). The current gate is green
with **97 unit tests + 31 Playwright executions**, and the backlog has zero outstanding items. See
[`docs/design-document.md`](docs/design-document.md),
[`docs/adr/ADR-0001-approach.md`](docs/adr/ADR-0001-approach.md) (approach: web + Playwright
emulation, "A now, native later"),
[`docs/adr/ADR-0002-profile-only-persistence.md`](docs/adr/ADR-0002-profile-only-persistence.md)
(profile persistence and trading-state reset), and [`docs/backlog.md`](docs/backlog.md) (roadmap
MF-01…MF-14 plus review remediation).

## Approach

Approach **A** (web + Playwright mobile emulation) — proportionate and CI-clean (headless in GitHub
Actions, no device farm), deterministic via the seeded feed. A native layer (Appium/Maestro) is an
optional later **Phase B** (ADR-0001).

The MVP uses a paper-trading money model: opening an order creates a position without changing cash
or modelling margin. The cash balance changes only when realised net P&L is applied on close.

## Test evidence

- **Unit:** 97 Vitest tests covering seeded feed determinism, integer P&L/commission/swap,
  validation boundaries, session state, portfolio lifecycle, and responsive layout.
- **Desktop E2E:** Chromium journeys for login, watchlist ticks, order/close/P&L, history, and live
  responsive reflow.
- **Mobile E2E:** Pixel 7 (Chromium/Android characteristics) and iPhone 14 (WebKit/iOS
  characteristics), using touch input for the full Screenplay trading journey plus real-viewport
  breakpoint and overflow assertions. The E2E lane verifies app-vs-core consistency; correctness is
  pinned by the PRS oracle in the unit lane.
- **CI:** the dependency audit and `npm run verify` run on every PR and push to `main`, with
  Playwright reports retained on failure. The same exact-SHA job graph then validates the Pages
  artifact; a failed verification skips both artifact construction and deployment.
- **Deployment:** successful `main` verification unlocks the least-privilege Pages upload and deploy
  jobs. PRs validate the production build and asset paths without uploading or deploying. The public
  login → order → price move → close → history → balance journey has been smoke-tested.

## Commands

Use Node.js 20.19 or later within the Node 20 release line for local development. The locked
toolchain also supports Node 22 from 22.13 onwards, and Node 24+; CI uses Node 24 as the portfolio
baseline.

```bash
npm install
npx playwright install chromium   # once, for the e2e lane
npm run dev      # SUT dev server
npm run verify   # typecheck + lint + server-ownership probe + unit + built-app e2e
```

The canonical E2E gate owns port `4173` and refuses to reuse any responder already listening there,
so its evidence always comes from the freshly built current checkout. Interactive reuse is separate
and explicitly opt-in: start the intended preview yourself, then set
`PLAYWRIGHT_REUSE_SERVER=1` only for that `npm run test:e2e` invocation.

## Licence

[MIT](LICENSE).
