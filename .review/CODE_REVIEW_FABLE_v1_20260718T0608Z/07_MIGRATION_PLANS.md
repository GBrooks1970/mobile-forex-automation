# Migration Plans

[<- Back to Index](00_CODE_REVIEW_FABLE_v1_20260718T0608Z.md) | [Next: Annex - Metrics ->](ANNEX/METRICS.md)

**Reviewer:** AI assistant (Claude Fable 5)

The template's three canonical plans are scaled to what this single repo actually needs.
Two are largely already satisfied and are assessed as such; the third is the material one.

## Plan A - Single Source of Truth for Features

- **Current state:** already achieved. Business rules live once in `src/core/` and are
  shared by UI and tests; the PRS oracle is pinned once; breakpoints are one pure
  function mirrored by CSS; [docs/backlog.md](../../docs/backlog.md) is the declared,
  respected status SoT.
- **Residual work (small):** extract the duplicated test-support helpers (`toPts`,
  `gbp()`) into `tests/support/` so the *test* layer has one source too (R-2).
- **Steps:** (1) add `tests/support/prices.ts` with pair-aware `parsePricePts` +
  `gbp`; (2) replace the three inline copies; (3) thread `pair` through
  `TheRecordedPrices`; (4) re-run `npm run verify`; (5) delete `appVersion` duplication.
- **Effort:** ~1 hour. **Risk:** negligible (no behaviour change).

## Plan B - Containerisation for Local Development

- **Assessment: N/A (by design, and correctly so).** The SUT is a static Vite app with a
  seeded in-browser feed and no backend, database, or external service - there is nothing
  to containerise, and adding Docker would violate the KISS posture that keeps CI fast.
  Contrast the magento project, where Docker Compose is essential because it drives a real
  application stack.
- **If ever needed:** the only candidate is pinning the Playwright browser image for
  byte-reproducible CI, which the official `mcr.microsoft.com/playwright` image already
  covers without a bespoke compose file. Recommend not adding Docker.

## Plan C - GitHub Actions / Workflow hardening

- **Current state:** two workflows exist and work.
  [ci.yml](../../.github/workflows/ci.yml) runs `npm ci` -> `playwright install --with-deps
  chromium webkit` -> `npm run verify` with npm caching, a 15-min timeout, cancel-in-progress
  concurrency, least-privilege `contents: read`, and failure-only report upload.
  [pages.yml](../../.github/workflows/pages.yml) builds the sub-path-correct artefact,
  asserts asset paths, and deploys only from `main`.
- **Gaps to migrate (all LOW):**
  1. **Align action majors** - `ci.yml` uses checkout@v5/setup-node@v5 while `pages.yml`
     uses checkout@v7/setup-node@v6; converge on one (newer) set (R-4).
  2. **Add a dependency-audit step** (`npm audit --audit-level=high`) to CI or a scheduled
     workflow, given the portfolio's prior Dependabot-lag experience (R-4).
  3. **Add the lint gate** to CI once ESLint lands (R-3), so style/floating-promise
     regressions are caught in PRs.
  4. Optionally add a **Dependabot** config for grouped monthly bumps and a coverage
     artefact (`vitest --coverage`) to substantiate the "core fully covered" claim.
- **Steps:** edit the two workflow files to align actions and add the audit/lint steps;
  add `lint` + `coverage` scripts; verify a PR run stays green. **Effort:** ~1-2 hours.
  **Risk:** low; changes are additive and CI-only.

## Migration priority

R-1 (email escaping) is not a "migration" but should precede all of the above as the one
security-relevant change. Then Plan A (test SoT), then Plan C steps 1-3. Plan B: do not
pursue.

---

[<- Previous: Architecture Assessment](06_ARCHITECTURE_ASSESSMENT.md) | [Back to Index](00_CODE_REVIEW_FABLE_v1_20260718T0608Z.md) | [Next: Annex - Metrics ->](ANNEX/METRICS.md)
