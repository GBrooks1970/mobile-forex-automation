# Risks and Issues

[<- Back to Index](00_CODE_REVIEW_FABLE_v1_20260718T0608Z.md) | [Next: Project Reviews ->](03_PROJECT_REVIEWS/PROJECT_001_mobile-forex-automation.md)

**Reviewer:** AI assistant (Claude Fable 5)

Ranked high to low. No HIGH findings: the gate is green, the suite is deterministic, the
audit is clean, and the documentation matches the code. The items below are MEDIUM
hardening/hygiene findings and LOW polish.

---

## R-1 (MEDIUM) - User-controlled email is interpolated into `innerHTML` unescaped

**Risk description.** The trading shell renders the signed-in email by string
interpolation into `innerHTML`, and the login error list is rendered the same way.

**Evidence.**
- [src/main.ts](../../src/main.ts) (line 104):

```typescript
// src/main.ts (line 104)
<span data-testid="account-email">${profile.email}</span>
```

- The email shape check is permissive - [src/app/session.ts](../../src/app/session.ts)
  (line 26): `/^\S+@\S+\.\S+$/` admits any non-whitespace characters, including `<`, `>`,
  `/` and `=`. A payload such as `<img/src=x/onerror=alert(1)>@x.co` passes validation and
  is injected raw. The stored profile is re-injected on every reload via `loadProfile`
  ([src/main.ts](../../src/main.ts) lines 210-215), which validates field *types* but not
  content ([src/app/session.ts](../../src/app/session.ts) lines 66-84).

**Impact.** In this client-only demo SUT there is no server and no other user, so the
practical blast radius is **self-XSS** (plus stored self-XSS via `localStorage`). It is
not remotely exploitable as shipped. It is still a genuine unsafe-input surface on a
**public** Pages deployment, and a portfolio repo is exactly the place where a reviewer
will notice an `innerHTML` injection habit. `renderLogin`'s error interpolation
([src/main.ts](../../src/main.ts) line 63) is currently safe only because all messages are
static strings from `validateCredentials` - a fragile invariant.

**Remediation.** Set the email via `textContent` after rendering (one line), or add a
small `escapeHtml` helper used by every `${...}` that can carry non-literal data
(`profile.email`, error messages). A cheap regression test: log in with an email
containing `<b>x</b>@x.co` and assert the DOM contains the literal text, not markup. No
behaviour change for the existing suite.

---

## R-2 (MEDIUM) - Pair-unaware `toPts` price parser, duplicated in three test files

**Risk description.** Tests parse on-screen price strings back to integer points with a
hard-coded 5-decimal scale factor. JPY-quoted pairs use a 3-decimal point
([src/core/types.ts](../../src/core/types.ts) lines 31-33), so the helper is wrong for
`USD/JPY` - one of the five pairs the app trades.

**Evidence.**

```typescript
// tests/screenplay/questions.ts (line 7)
const toPts = (s: string): number => Math.round(parseFloat(s) * 100_000);
```

The same line is duplicated in [tests/e2e/close.spec.ts](../../tests/e2e/close.spec.ts)
(line 17) and [tests/e2e/order.spec.ts](../../tests/e2e/order.spec.ts) (line 61). The
production inverse, `formatPricePts` ([src/core/format.ts](../../src/core/format.ts)
lines 7-15), is pair-aware via `pointDecimals`.

**Impact.** Latent only: every current journey trades GBP/USD, so nothing fails today.
But the Screenplay Question `TheRecordedPrices` presents itself as generic; the first
engineer who writes a USD/JPY journey gets prices silently off by x100, and the
replay-predicted assertions would fail (or worse, a compensating error could pass). Also a
DRY violation across three files, plus a duplicated `gbp()` formatter in two specs
([tests/e2e/close.spec.ts](../../tests/e2e/close.spec.ts) lines 18-22,
[tests/e2e/mobile/journeys.mobile.spec.ts](../../tests/e2e/mobile/journeys.mobile.spec.ts)
lines 22-26).

**Remediation.** Add a shared test-support helper, e.g. `tests/support/prices.ts`,
exporting `parsePricePts(pair, text)` implemented as the inverse of `formatPricePts`
(using `pointDecimals(pair)` and integer string arithmetic rather than `parseFloat`, which
also removes the float round-trip), and a shared `gbp(pence)` (or re-export
`formatGbpPence`). Thread the `pair` through `TheRecordedPrices.ofClosedTrade(...)`.

---

## R-3 (MEDIUM) - No lint/format gate; `verify` is typecheck + tests only

**Risk description.** The repo ships no ESLint/Prettier (or equivalent) configuration and
no lint script; the registry gate `npm run verify`
([package.json](../../package.json) line 16) is `typecheck && test && test:e2e`.

**Evidence.** [package.json](../../package.json) lines 8-17 (scripts; no `lint`);
`rg --files` shows no `.eslintrc*`/`eslint.config.*`/`.prettierrc*` in the tree.

**Impact.** Strict `tsc` catches type errors but not the classes of issue a linter would:
unused symbols, unawaited promises in test code (`@typescript-eslint/no-floating-promises`
is the classic Playwright-suite failure mode), accidental `only`/`skip` (partially
mitigated by `forbidOnly` in [playwright.config.ts](../../playwright.config.ts) line 10).
Style consistency currently rests on author discipline. Sibling portfolio repos (e.g.
`bfx-ws-screenplay` with `npm run lint` in its gates) set a stronger house standard, so
the gap is also a consistency finding.

**Remediation.** Add flat-config ESLint with `typescript-eslint` (type-checked rules) +
`eslint-plugin-playwright` for `tests/e2e/**`, a `lint` script, and fold it into `verify`
and CI. Effort is small (the codebase is ~2.3k lines of TS and already clean).

---

## R-4 (LOW) - CI action-version drift between the two workflows; no audit step in CI

**Risk description.** The two workflows pin different major versions of the same actions,
and dependency health is checked only ad hoc.

**Evidence.**
- [.github/workflows/ci.yml](../../.github/workflows/ci.yml) (lines 23, 26):
  `actions/checkout@v5`, `actions/setup-node@v5`.
- [.github/workflows/pages.yml](../../.github/workflows/pages.yml) (lines 24, 28):
  `actions/checkout@v7`, `actions/setup-node@v6`.
- Neither workflow runs `npm audit` (the portfolio has prior form here: a stale
  Dependabot HIGH lingered on a sibling repo).

**Impact.** Purely operational: the pin drift means the workflows age at different rates
and a future runner deprecation will hit one file but not the other; the missing audit
step means a dependency CVE would be noticed only by Dependabot lag or a human. No
correctness impact today (local `npm audit` = 0 vulnerabilities).

**Remediation.** Align both workflows on the same (newer) action majors, and add a cheap
`npm audit --audit-level=high` step (or a scheduled workflow) so the gate notices new
advisories. Optionally add Dependabot config for grouped monthly bumps.

---

## R-5 (LOW) - E2E oracle reuses the production core (documented, accepted trade-off)

**Risk description.** E2E predictions import `grossPnlGbpPence`, `commissionPence`, and
`createFeed` from `src/core/` - the same code the app runs - so the E2E lane proves
*internal consistency* (UI shows what the core computes; balance moves by exactly the
recorded net), not arithmetic correctness.

**Evidence.** [tests/e2e/close.spec.ts](../../tests/e2e/close.spec.ts) (lines 2, 55-56);
[tests/e2e/mobile/journeys.mobile.spec.ts](../../tests/e2e/mobile/journeys.mobile.spec.ts)
(lines 2, 62); comment acknowledging the choice at
[tests/e2e/close.spec.ts](../../tests/e2e/close.spec.ts) lines 49-52.

**Impact.** Correctness rests on the unit suite alone - which is where it belongs: the
PRS worked example is pinned independently in
[tests/unit/pnl.spec.ts](../../tests/unit/pnl.spec.ts) (62.0 pips / +246.78 GBP gross /
net 244.28 GBP). A shared-bug-cancels-out risk exists only for code paths the unit oracle
does not pin. This is a reasonable engineering trade-off, already half-documented in spec
comments; it should also be stated in the README/design doc so a reviewer does not
mistake the E2E maths for an independent oracle.

**Remediation.** One sentence in the README test-evidence section ("the E2E lane verifies
app-vs-core consistency; correctness is pinned by the PRS oracle in the unit lane"), plus
optionally one literal-value E2E assertion derived offline for a fixed seed.

---

## R-6 (LOW) - Minor drift and polish items

- **Duplicated app version:** `appVersion = '0.1.0'` in [src/meta.ts](../../src/meta.ts)
  (line 4) duplicates `"version": "0.1.0"` in [package.json](../../package.json)
  (line 3) - will drift on the first release bump. Import from `package.json` or drop it
  (only [tests/unit/meta.spec.ts](../../tests/unit/meta.spec.ts) reads it).
- **Login form loses input on validation error:** `renderLogin` re-renders the whole form
  with empty fields ([src/main.ts](../../src/main.ts) lines 76-80), discarding the typed
  email. UX-only in a demo SUT; tests re-fill, so no suite impact.
- **Newer tool majors available:** TypeScript 7.0 and Vite 8.1 exist upstream
  (`npm outdated`); currently on 5.9.3 / 7.3.6 with 0 vulnerabilities, so upgrade at
  leisure, not urgency.
- **Stale remote branches:** `origin` still carries four merged `worklist/*` /
  `codex/mf-14-closeout` branches (`git branch -a`); the portfolio's TIDY convention
  (cf. magento TIDY-01) would prune them.
- **`fullyParallel: false` is undocumented** ([playwright.config.ts](../../playwright.config.ts)
  line 9): files still run in parallel across 4 workers (observed locally); the flag only
  serialises tests *within* a file. A one-line comment (isolation rationale, cf. the
  calculator repo's CAL-01) would prevent cargo-cult copying.

Each item above is cosmetic or preventative; none blocks anything today.

---

[<- Previous: Executive Summary](01_EXECUTIVE_SUMMARY.md) | [Back to Index](00_CODE_REVIEW_FABLE_v1_20260718T0608Z.md) | [Next: Project Reviews ->](03_PROJECT_REVIEWS/PROJECT_001_mobile-forex-automation.md)
