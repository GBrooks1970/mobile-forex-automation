# Changelog

All notable changes to Mobile Forex Automation are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added the approved profile-only persistence notice to the trading shell and a deterministic E2E
  contract test proving reload keeps identity while resetting balance changes, positions, and
  history (CODEX-05, review R-3).
- Added a GitHub Pages build/deployment workflow and repository-subpath-safe Vite configuration.
- Added the verified public demo at <https://gbrooks1970.github.io/mobile-forex-automation/>.
- Added the project as the eighth `portfolio-prompts` orchestration target.
- Added the first versioned project handover and the public portfolio landing-page card.
- Added flat-config ESLint (type-checked rules + `eslint-plugin-playwright`), folded into `verify`
  and CI, and an `npm audit --audit-level=high` CI step (TRIAGE-03, TRIAGE-04).

### Changed

- Capped demo orders at 100.00 lots through one safe-integer constant shared by the HTML input,
  parser, and domain validation, with explicit boundary feedback and coverage (CODEX-06, review R-4).
- Defined the demo's profile-only persistence contract: reload keeps the signed-in identity but
  resets trading balance changes, open positions, and history; ADR-0002 and the product-copy
  contract make clear that the app does not provide durable account history (CODEX-04, review R-3).
- Made the canonical Playwright gate own a fresh built-app preview server; pre-existing server reuse
  now requires the explicit interactive-only `PLAYWRIGHT_REUSE_SERVER=1` opt-in (CODEX-03,
  review R-2).
- Gated Pages artifact construction and deployment behind the exact commit's successful dependency
  audit, typecheck, lint, unit, and E2E jobs while retaining non-deploying PR build validation
  (CODEX-02, review R-1).
- Published the repository for portfolio review.
- Reconciled project status and traceability after completion of MF-12.
- Closed MF-13 after the first `main` deployment and public trading-journey smoke test passed.
- Closed MF-14 after registry onboarding, handover publication, and landing-card deployment were
  independently merged and verified.
- Consolidated three duplicated `toPts` test helpers into a single pair-aware
  `tests/support/prices.ts`, fixing a latent JPY-pair miscalculation (TRIAGE-02).
- `appVersion` is now imported from `package.json` instead of duplicated as a literal (TRIAGE-06).

### Fixed

- Fixed unescaped, non-literal `innerHTML` interpolations (signed-in email, login errors) that could
  admit markup injection (TRIAGE-01, review R-1).
- Fixed `renderLogin` clearing the typed email on a validation error (TRIAGE-06).

## [0.1.0] — 2026-07-13

### Added

- Added a deterministic responsive-web forex demo SUT covering login, watchlist, market orders,
  position closure, P&L, history, and adaptive layouts.
- Added an integer-money P&L and validation core plus a per-pair seeded price feed.
- Added 90 Vitest unit tests and 28 Playwright executions across desktop Chromium, Pixel 7, and
  iPhone 14 projects.
- Added framework-free Screenplay Tasks, Questions, Actor, and browser Ability for the mobile
  business journey.
- Added a Node 24 CI gate running strict typecheck, unit tests, and E2E tests.

### Fixed

- Fixed the JPY quote-currency factor after the boundary suite exposed a tenfold P&L error.
- Fixed mobile Close-button movement caused by price-tick table reflow.
