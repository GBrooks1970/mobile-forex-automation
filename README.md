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

## Status

**Phase 0 — design.** Scaffold + design document only; nothing implemented yet. See
[`docs/design-document.md`](docs/design-document.md) (v0.1, in review),
[`docs/adr/ADR-0001-approach.md`](docs/adr/ADR-0001-approach.md) (approach: web + Playwright
emulation, "A now, native later"), and [`docs/backlog.md`](docs/backlog.md) (roadmap MF-01…MF-14).

## Approach

Approach **A** (web + Playwright mobile emulation) — proportionate and CI-clean (headless in GitHub
Actions, no device farm), deterministic via the seeded feed. A native layer (Appium/Maestro) is an
optional later **Phase B** (ADR-0001).

## Planned commands

```bash
npm install
npm run verify   # typecheck + unit (Vitest) + e2e (Playwright)  — wired in MF-01
```

## Licence

MIT (portfolio-wide).
