# ADR-0001 — SUT + mobile-test approach: web + Playwright emulation ("A now, native later")

**Status:** Accepted
**Date:** 2026-07-08
**Deciders:** Gary Brooks (owner), Claude Fable 5

## Context
This is a test-automation portfolio project filling the *mobile automation* gap (PORTFOLIO_BACKLOG
P-03), sourced from the Mobile Forex Trading App PRS. The PRS describes an app that does not exist,
so we must build a minimal System Under Test **and** the automation. Three approaches were weighed:
(A) a responsive **web** SUT tested with **Playwright device emulation**; (B) a **Flutter** app
tested with **Maestro**; (C) a Flutter app tested with **Appium**. CI is GitHub Actions with no
mobile device farm.

## Decision
Take **Approach A now**: build a minimal responsive-web vertical slice of the MVP and drive it with
Playwright mobile emulation (device descriptors, touch, viewport, breakpoints), fully headless in
CI. Keep a **native layer (Appium/Maestro) as an optional Phase B** extension for later, if a
native-app credential is wanted.

## Rationale
- **Proportionate:** the automation is the deliverable, not shipping a Flutter app. A is ~5–8 hrs of
  SUT vs ~15–20 for a Flutter build.
- **CI-clean & deterministic:** headless in Actions, no device farm; a seeded mock feed removes flake.
- **Honest scope:** A is *mobile-web* automation + responsive testing — labelled as such, not
  native-app automation.
- **Extensible:** A does not preclude a native Phase B later.

## Consequences
- **Positive:** fast to green, sustainable CI, reuses the portfolio's Playwright/Vitest/TS norms.
- **Negative / accepted:** not a native-app (Appium) credential in Phase A. Mitigated by the recorded
  option to add Phase B.
- Charts are stubbed (poor automation targets); we test the data layer, not pixels.

## Alternatives
- **C (Appium):** the industry-standard native credential; rejected for now for the large app build
  and painful CI (Android emulator flaky in Actions, iOS needs macOS runners).
- **B (Maestro):** lighter native; rejected for now for the same app-build + emulator cost.
Both remain candidates for Phase B.
