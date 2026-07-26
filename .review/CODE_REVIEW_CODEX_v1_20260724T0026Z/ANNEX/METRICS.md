# Annex - Metrics and Validation Evidence

[<- Back to Index](../00_CODE_REVIEW_CODEX_v1_20260724T0026Z.md)

**Reviewer:** AI assistant (Codex GPT-5)

This annex records commands actually run during this review. The local environment was Windows,
Node v20.19.5, and npm 10.8.2. The reviewed head was `d5fb448` on a branch created from freshly
fetched and fast-forwarded `main`.

## Repository Fact Gathering

- `git status --short --branch`: clean `main...origin/main` before branch creation; clean review
  branch before artifacts.
- `git log --oneline -10`: inspected; head was the backlog/changelog reconciliation merge `d5fb448`.
- `rg --files` plus a hidden-file pass: mapped source, tests, workflows, docs, configuration, and the
  previous review while excluding dependency/generated directories.
- Existing review location: `.review/`; only `CODE_REVIEW_FABLE_v1_20260718T0608Z` existed, so the
  current-agent version is `CODEX_v1`.

## Canonical Validation Gate

Command:

```text
npm run verify
```

**Result: PASS** in 98.5 seconds.

- `npm run typecheck`: PASS (`tsc --noEmit`).
- `npm run lint`: PASS (`eslint . --max-warnings 0`).
- `npm run test`: PASS - 11 files, 90/90 Vitest tests, 3.04 seconds reported.
- `npm run test:e2e`: PASS - 29/29 Playwright executions using four workers, 1.1 minutes reported.
- E2E breakdown: 17 desktop Chromium executions; six mobile source tests executed on Pixel 7 and
  iPhone 14 projects, producing 12 mobile executions.

This validates the backlog's latest 90/29 claims and shows that the README's current 90/28 statement
is stale (R-8).

## Focused Stability Probe

Command:

```text
npx playwright test tests/e2e/watchlist.spec.ts --project=chromium-desktop --grep="prices tick deterministically" --repeat-each=20
```

**Result: PASS - 20/20** in 1.6 minutes. The command did not reproduce R-5, but code inspection still
shows three separate browser reads of sequence, price, and direction. The result bounds observed
flake frequency; it does not make those reads atomic.

## Dependency and Audit Evidence

- `npm audit --audit-level=high`: PASS, `found 0 vulnerabilities`.
- `npm outdated`: exited 1 because updates are available:
  - `@types/node` 24.13.3 installed/wanted, 26.1.1 latest;
  - `typescript` 5.9.3 installed/wanted, 7.0.2 latest;
  - `typescript-eslint` 8.64.0 installed, 8.65.0 wanted/latest;
  - `vite` 7.3.6 installed/wanted, 8.1.5 latest.
- `npm ls --depth=0`: dependency tree valid. Direct installed versions were `@eslint/js` 10.0.1,
  `@playwright/test` 1.61.1, `@types/node` 24.13.3, `eslint-plugin-playwright` 2.10.5,
  `eslint` 10.7.0, `typescript-eslint` 8.64.0, `typescript` 5.9.3, `vite` 7.3.6, and
  `vitest` 4.1.10.
- The app has no runtime `dependencies`; all packages are development toolchain dependencies.
- Lockfile v3 is present and `npm ci` is used by both workflows.
- Outdated majors are maintenance opportunities, not reported vulnerabilities. No CVE is asserted.

## Security and Licence Pass

- A tracked-source scan for common private-key/token patterns found no committed secret.
- No real credential, API token, remote market endpoint, dynamic command, `eval`, or `new Function`
  surface exists.
- Non-literal login values are escaped before HTML interpolation, and the crafted-email E2E regression
  passed.
- User-controlled lot input can exceed safe exact-integer arithmetic; this is reported as integrity
  finding R-4, not remote code execution.
- GitHub workflow expressions use trusted GitHub/step metadata; no pull-request title/body or other
  untrusted expression is interpolated into a shell command.
- [LICENSE](../../../LICENSE) is MIT and [package.json](../../../package.json) (line 7) declares MIT.
- Lockfile package licence fields contained: MIT 150, Apache-2.0 17, ISC 7, BSD-2-Clause 6,
  BSD-3-Clause 2, and BlueOak-1.0.0 1; none were missing. This is an inventory pass, not legal advice.

## Live CI Evidence

Read-only `gh run list --branch main --limit 10` inspection showed both current-head runs completed
successfully for `d5fb448`:

- CI run `29704669665`: success.
- Pages run `29704669673`: success.

The successful state does not remove R-1: workflow structure permits Pages to succeed/deploy without
depending on CI success.

## Coverage and Deferred Work

- No `test.skip`, `test.fixme`, `test.only`, quarantine tag, or required open backlog scenario was
  found.
- No Vitest line/branch/function/statement coverage provider or threshold is configured. `90` is a
  test-execution count, not source coverage.
- Optional native Phase B, axe accessibility, and visual baselines are documented but not current
  coverage.
- No API/OpenAPI audit was run because the project has no API.
- No Docker or heavyweight infrastructure was started; none is required by the project gate.

## Numeric Input Probe

A read-only Node expression applied the production parser's arithmetic to representative strings:

```text
90071992547410.00 -> lots2 9007199254741000; Number.isInteger=true; Number.isSafeInteger=false
99999999999999.99 -> lots2 10000000000000000; Number.isInteger=true; Number.isSafeInteger=false
```

This substantiates R-4 without changing repository code.

## Recorded Unattended Questions

1. Is reload intended to preserve only identity/profile, or also cash balance, open positions, and
   trade history?
2. Must Pages deployment depend on the exact pushed SHA's successful verification, or is pre-merge
   branch protection intentionally considered sufficient?

The review proceeded without waiting, made no implementation choice, and records both questions in
[Recommendations](../05_RECOMMENDATIONS.md).

---

[<- Previous: Migration Plans](../07_MIGRATION_PLANS.md) | [Back to Index](../00_CODE_REVIEW_CODEX_v1_20260724T0026Z.md)
