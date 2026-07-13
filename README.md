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
used.

## Status

**Phase 4 — shipping.** MF-01…MF-13 are merged: the responsive SUT, deterministic domain core,
desktop/mobile E2E, real Pixel/iPhone breakpoint checks, Screenplay journeys, CI gate, and verified
Pages deployment are complete. The current gate is green with **90 unit tests + 28 Playwright
executions**. Remaining work is MF-14 (portfolio onboarding, handover, and landing-page card). See
[`docs/design-document.md`](docs/design-document.md),
[`docs/adr/ADR-0001-approach.md`](docs/adr/ADR-0001-approach.md) (approach: web + Playwright
emulation, "A now, native later"), and [`docs/backlog.md`](docs/backlog.md) (roadmap MF-01…MF-14).

## Approach

Approach **A** (web + Playwright mobile emulation) — proportionate and CI-clean (headless in GitHub
Actions, no device farm), deterministic via the seeded feed. A native layer (Appium/Maestro) is an
optional later **Phase B** (ADR-0001).

## Test evidence

- **Unit:** 90 Vitest tests covering seeded feed determinism, integer P&L/commission/swap,
  validation boundaries, session state, portfolio lifecycle, and responsive layout.
- **Desktop E2E:** Chromium journeys for login, watchlist ticks, order/close/P&L, history, and live
  responsive reflow.
- **Mobile E2E:** Pixel 7 (Chromium/Android characteristics) and iPhone 14 (WebKit/iOS
  characteristics), using touch input for the full Screenplay trading journey plus real-viewport
  breakpoint and overflow assertions.
- **CI:** `npm run verify` on every PR and push to `main`, with Playwright reports retained on
  failure.
- **Deployment:** the Vite production artifact is published from `main` by GitHub Pages and the
  public login → order → price move → close → history → balance journey has been smoke-tested.

## Commands

```bash
npm install
npx playwright install chromium   # once, for the e2e lane
npm run dev      # SUT dev server
npm run verify   # typecheck + unit (Vitest) + e2e (Playwright against the built app)
```

## Licence

[MIT](LICENSE).
