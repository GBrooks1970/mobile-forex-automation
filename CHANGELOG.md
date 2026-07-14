# Changelog

All notable changes to Mobile Forex Automation are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added a GitHub Pages build/deployment workflow and repository-subpath-safe Vite configuration.
- Added the verified public demo at <https://gbrooks1970.github.io/mobile-forex-automation/>.
- Added the project as the eighth `portfolio-prompts` orchestration target.
- Added the first versioned project handover and the public portfolio landing-page card.

### Changed

- Published the repository for portfolio review.
- Reconciled project status and traceability after completion of MF-12.
- Closed MF-13 after the first `main` deployment and public trading-journey smoke test passed.
- Closed MF-14 after registry onboarding, handover publication, and landing-card deployment were
  independently merged and verified.

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
