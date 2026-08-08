# Project Review: mobile-forex-automation

[<- Back to Index](../00_CODE_REVIEW_Gemini_v1_20260807T1410Z.md) | [Next: Cross-Project Analysis ->](../04_CROSS_PROJECT_ANALYSIS.md)

**Reviewer:** AI assistant (Gemini)

## Overview & Key Evaluation Points

- **Architecture and Design Patterns:** The codebase strictly adheres to clean layered architecture. Pure domain logic (`src/core/`) operates on immutable integer representations (points, pence, lots2), while stateful lifecycle (`src/app/`) manages profiles and portfolios. The test suite implements a zero-dependency Screenplay pattern under `tests/screenplay/` with clear separation between Actors, Tasks, Questions, and Abilities.
- **Code Quality and Maintainability:** Written in modern idiomatic TypeScript with strict compiler options (`strict: true`, `noUncheckedIndexedAccess: true`). Flat-config ESLint with type-checked rules and `eslint-plugin-playwright` enforces code quality across source and test files with zero warnings allowed.
- **Test Coverage and Approach:** Excellent multi-tiered test pyramid comprising 97 Vitest unit tests for domain logic and 31 Playwright E2E executions across desktop Chromium, mobile Pixel 7 (Android), and mobile iPhone 14 (iOS). All E2E journeys rely on a deterministic PRNG price feed (`createFeed(seed)`), eliminating test non-determinism and timing flakes.
- **Documentation Quality:** Exceptional documentation standards across `README.md`, `docs/design-document.md`, `docs/backlog.md` (v16), `docs/adr/ADR-0001-approach.md` (web + Playwright mobile emulation), and `docs/adr/ADR-0002-profile-only-persistence.md` (profile-only persistence contract).
- **Strengths:** 
  - Exact integer arithmetic for monetary/pricing calculations.
  - Server-ownership preflight probe (`scripts/probe-playwright-server-ownership.mjs`) preventing port collision false passes.
  - Dual mobile device emulation with touch input and explicit viewport geometry validation.
  - Automated CI workflow combining verification, auditing, and Pages deployment in a single dependency graph.
- **Weaknesses:**
  - Minor gaps in accessibility ARIA attributes for dynamic table controls.
  - Un-debounced window resize handler in main application entrypoint.

---

[<- Previous: Risks and Issues](../02_RISKS_AND_ISSUES.md) | [Back to Index](../00_CODE_REVIEW_Gemini_v1_20260807T1410Z.md) | [Next: Cross-Project Analysis ->](../04_CROSS_PROJECT_ANALYSIS.md)
```

---