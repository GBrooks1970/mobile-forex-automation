# Code Review: Mobile Forex Automation

**Reviewer:** AI assistant (Claude)  
**Date:** 2026-08-07T14:10Z  
**Scope:** Full codebase review (`src/`, `tests/`, `.github/workflows/`, configuration, documentation)  

## Table of Contents

1. [Executive Summary](01_EXECUTIVE_SUMMARY.md)
2. [Risks and Issues](02_RISKS_AND_ISSUES.md)
3. [Project Review](03_PROJECT_REVIEWS/PROJECT_001_mobile-forex-automation.md)
4. [Cross-Project Analysis](04_CROSS_PROJECT_ANALYSIS.md)
5. [Recommendations](05_RECOMMENDATIONS.md)
6. [Architecture Assessment](06_ARCHITECTURE_ASSESSMENT.md)
7. [Migration Plans](07_MIGRATION_PLANS.md)
8. [Annex: Metrics & Test Strategy](ANNEX/METRICS.md)

## Structure Summary

This code review provides a formal evaluation of `mobile-forex-automation` following the portfolio's code-review template. The project is a responsive-web mobile test automation showcase featuring a deterministic forex System Under Test (SUT) with integer-money domain logic, Playwright mobile device emulation (Pixel 7 / iPhone 14), a hand-rolled Screenplay pattern layer, Vitest unit testing, and GitHub Actions CI with automated Pages deployment.

## Key Findings

- **Architecture & Domain Integrity:** Excellent separation between pure core P&L logic (`src/core/`) and stateful UI orchestration (`src/app/`, `src/ui/`). All monetary and pricing values use exact integer representations (pence, points, lots2).
- **Mobile Emulation & Determinism:** Device emulation for Android (Pixel 7 / Chromium) and iOS (iPhone 14 / WebKit) is backed by a deterministic PRNG seed feed (`createFeed(seed)`), guaranteeing race-free test execution.
- **CI/CD Quality & Security:** Gated single-workflow CI pipeline (`.github/workflows/ci.yml`) combines typechecking, ESLint, dependency audit, unit testing, server-ownership probing, Playwright E2E execution, and conditional Pages deployment with least-privilege token scoping.
- **Low-Severity Observations:** Minor opportunities remain around asset base-path dry-run validation, accessible ARIA labeling on dynamic tables, DOM history list capping, window resize event debouncing, and mobile touch-action CSS rules.

## Navigation Guide

Use the Table of Contents links above or the breadcrumb header and footer navigation links on each file to navigate sequentially through the review sections.
```

---