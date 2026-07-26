# Risks and Issues

[<- Back to Index](00_CODE_REVIEW_CODEX_v1_20260724T0026Z.md) | [Next: Project Review ->](03_PROJECT_REVIEWS/PROJECT_001_mobile-forex-automation.md)

**Reviewer:** AI assistant (Codex GPT-5)

Risks are ranked high to low. No HIGH finding was identified. The current gate and latest remote
workflows are green; the MEDIUM findings describe paths that are not fully protected by that evidence.

## R-1 (MEDIUM) - Pages can deploy without the verification job succeeding

**Risk description.** CI and Pages are independent workflows on the same push. The Pages `deploy`
job depends only on its `build` job, not on the typecheck, lint, audit, unit, or E2E gate.

**Evidence.**

- [.github/workflows/ci.yml](../../.github/workflows/ci.yml) (lines 17-43) defines `verify` and runs
  `npm audit` followed by `npm run verify`.
- [.github/workflows/pages.yml](../../.github/workflows/pages.yml) (lines 57-73) allows `deploy` on
  `main` with `needs: build`; the Pages build performs `npm ci` and `npm run build`, but not the
  canonical verification gate (lines 18-55).
- Both workflows trigger independently on pushes to `main`
  ([ci.yml](../../.github/workflows/ci.yml) (lines 3-7);
  [pages.yml](../../.github/workflows/pages.yml) (lines 3-8)).

**Impact.** A merge that fails a post-merge E2E, lint, audit, or typecheck can still publish a new
production artifact. Branch protection reduces the probability but does not make the deployment job
conditional on the exact deployed commit's successful push gate. This weakens the README's CI-gated
deployment story.

**Refactor recommendation and strategy.** Prefer one of:

1. make Pages a reusable job/workflow invoked only after verification;
2. run the canonical gate in the Pages build before upload; or
3. trigger deployment with `workflow_run` only after the `CI` workflow succeeds for `main`, validating
   the head SHA before deployment.

Keep the existing least-privilege `pages: write` and `id-token: write` permissions scoped only to the
deploy job.

## R-2 (MEDIUM) - Local E2E can silently reuse a stale or unrelated server

**Risk description.** Playwright reuses any existing HTTP responder on port 4173 outside CI. The
local canonical gate therefore does not always prove that it tested the current checkout's freshly
built artifact.

**Evidence.**

- [playwright.config.ts](../../playwright.config.ts) (lines 36-41) configures the intended command as
  `npm run build && npm run preview` but sets `reuseExistingServer: !process.env.CI`.
- [package.json](../../package.json) (lines 9-18) includes `test:e2e` inside `verify`, so the reuse
  behaviour applies to the documented local gate.

**Impact.** If a stale preview, a dev server, or another project already owns port 4173, Playwright
can report a false pass or confusing failure against the wrong artifact. This is especially harmful
in a portfolio project whose core claim is deterministic, reviewable evidence against the built app.

**Refactor recommendation and strategy.** Make the gate own its server unconditionally:
`reuseExistingServer: false` for `npm run verify`. If interactive convenience is needed, create a
separate local-development Playwright config or opt-in environment flag. Add a small preflight or
configuration test proving the gate command does not reuse an arbitrary listener.

## R-3 (MEDIUM) - Reload discards account activity while preserving the session identity

**Risk description.** Login persists a `Profile` containing the initial balance, but open positions,
realised balance changes, and history exist only in a newly constructed in-memory `Portfolio`.
Reload therefore keeps the user signed in while resetting their trading state.

**Evidence.**

- [src/app/session.ts](../../src/app/session.ts) (lines 5-14, 62-84) persists only `userId`, `email`,
  and `balancePence`.
- [src/main.ts](../../src/main.ts) (lines 96-98) saves the profile only at login.
- [src/main.ts](../../src/main.ts) (lines 110-113) creates a new `Portfolio` from the stored profile
  whenever the shell renders.
- [src/main.ts](../../src/main.ts) (lines 208-223) closes a trade and refreshes DOM readouts but does
  not update the stored profile or persist history.
- The one reload E2E verifies session presence only
  ([tests/e2e/login.spec.ts](../../tests/e2e/login.spec.ts) (lines 42-56)).

**Impact.** On the public demo, a user can realise P&L, see history, reload, and return to GBP
10,000.00 with empty positions/history. That may be an acceptable resettable-demo rule, but it is not
stated at the interaction point and conflicts with the intuitive meaning of a persisted account.
It also weakens the design statement that storage is "in-memory + localStorage".

**Refactor recommendation and strategy.** First answer the recorded owner question: is persistence
profile-only, or should account activity survive reload? If profile-only is intentional, state the
reset-on-reload rule in README/design/UI and add an E2E that pins it. If activity should persist,
version and validate a serialised account-state schema, restore it through a Portfolio factory, save
after each state transition, and test reload with an open trade and a closed trade.

## R-4 (MEDIUM) - Lot parsing accepts values outside safe exact-integer arithmetic

**Risk description.** The UI parser accepts arbitrary-length digit strings and checks only
`Number.isInteger`. JavaScript can report integers above `Number.MAX_SAFE_INTEGER` as integers even
though subsequent P&L multiplication is no longer exact.

**Evidence.**

- [src/ui/orderPanel.ts](../../src/ui/orderPanel.ts) (lines 28-34) has no length/domain maximum and
  returns a value when `Number.isInteger(lots2)` is true.
- [src/core/validate.ts](../../src/core/validate.ts) (lines 32-37) checks integer and positive, but
  not safe integer or a maximum lot size.
- [src/core/pnl.ts](../../src/core/pnl.ts) (lines 58-68, 109-112) multiplies the accepted lot value
  into quote P&L and commission.
- The architecture explicitly promises exact integer representation
  ([src/core/types.ts](../../src/core/types.ts) (lines 1-9)) and claims PRS-shaped trade state
  ([docs/design-document.md](../../docs/design-document.md) (lines 188-210)).

**Impact.** An input such as `90071992547410.00` parses to an integer-valued but unsafe `lots2`.
Displayed P&L, commission, balance, and history can then be rounded incorrectly, contradicting the
project's strongest correctness claim. The input is local to a demo user, so this is integrity rather
than remote security exposure.

**Refactor recommendation and strategy.** Define a business maximum matching the chosen data model,
enforce it at the input element, `parseLots2`, and `validateOpen`, and require
`Number.isSafeInteger`. Add boundary tests at maximum accepted, maximum + 0.01, and the
safe-integer edge. Consider a branded integer type if the domain expands.

## R-5 (LOW) - The watchlist replay snapshot is not atomic

**Risk description.** One deterministic replay test reads sequence, price, and direction through
separate browser round trips while the 800 ms ticker remains active. Its comment calls the values a
point-in-time snapshot, but a tick can land between those reads.

**Evidence.**

- [tests/e2e/watchlist.spec.ts](../../tests/e2e/watchlist.spec.ts) (lines 34-38) reads `data-seq`,
  price text, and `data-direction` separately.
- The same file demonstrates the safer atomic pattern with `row.evaluate`
  ([tests/e2e/watchlist.spec.ts](../../tests/e2e/watchlist.spec.ts) (lines 74-82)).
- A focused `--repeat-each=20` probe passed all 20 executions, so the risk was not reproduced during
  this review; it remains a structurally possible timing tear.

**Impact.** A tick between the sequence read and DOM value reads creates a false failure even though
the SUT is correct. This undercuts the suite's otherwise excellent race-free design.

**Refactor recommendation and strategy.** Read sequence, direction, and price in one `row.evaluate`,
then replay to that captured sequence. Remove the misleading point-in-time comment and the related
web-first assertion suppression if the atomic snapshot makes it unnecessary.

## R-6 (LOW) - Trading E2E omits the key JPY and SELL integration partitions

**Risk description.** The UI offers five pairs and BUY/SELL, but all order/P&L/close journeys trade
GBP/USD BUY. Unit tests cover SELL and JPY maths, but the browser integration between pair selection,
three-decimal formatting, price parsing, conversion, and history is not exercised.

**Evidence.**

- [tests/support/prices.ts](../../tests/support/prices.ts) (lines 4-8) explicitly notes that all
  current journeys trade GBP/USD.
- [tests/e2e/order.spec.ts](../../tests/e2e/order.spec.ts) (lines 21-72),
  [tests/e2e/close.spec.ts](../../tests/e2e/close.spec.ts) (lines 18-53), and
  [tests/e2e/mobile/journeys.mobile.spec.ts](../../tests/e2e/mobile/journeys.mobile.spec.ts)
  (lines 37-60) all use GBP/USD BUY.
- JPY and SELL branches are covered only below the UI seam
  ([tests/unit/boundaries.spec.ts](../../tests/unit/boundaries.spec.ts) (lines 25-29, 60-63);
  [tests/unit/pnl.spec.ts](../../tests/unit/pnl.spec.ts) (lines 42-51)).

**Impact.** A production wiring error specific to JPY precision or SELL direction can pass the full
browser gate. This is notable because the previous review found a latent pair-unaware test parser;
the remediation is generic but still unexercised by an actual JPY journey.

**Refactor recommendation and strategy.** Add one focused desktop integration journey for USD/JPY
SELL through open, price move, close, and history. That single case covers both material equivalence
partitions without multiplying the mobile matrix.

## R-7 (LOW) - The declared Node support range is broader than the locked toolchain supports

**Risk description.** The package declares all Node 20 releases as supported, while locked Vite
requires Node 20.19 or newer (or a qualifying later release).

**Evidence.**

- [package.json](../../package.json) (lines 20-22) declares `"node": ">=20"`.
- [package-lock.json](../../package-lock.json) (lines 2547-2566) locks Vite 7.3.6 with engine
  `^20.19.0 || >=22.12.0`.
- [.github/workflows/ci.yml](../../.github/workflows/ci.yml) (lines 18-29) validates only Node 24.

**Impact.** A developer following the declared contract on Node 20.0-20.18 can receive engine
warnings or tool failure even though the project claims support. CI does not detect this lower-bound
drift.

**Refactor recommendation and strategy.** Declare the true minimum (`>=20.19.0`) or pin the portfolio
baseline with `.nvmrc`/`.node-version` and narrow `engines`. If multiple Node lines are intentionally
supported, add a cheap typecheck/unit matrix while keeping browser E2E on Node 24.

## R-8 (LOW) - Current documentation has count and requirement drift

**Risk description.** The README's current gate count is one execution behind, and the design
document's FR-3 acceptance criterion says opening a trade updates balance/available margin while the
implemented and backlog-approved MVP deliberately does neither.

**Evidence.**

- [README.md](../../README.md) (lines 23-30) says the current gate has 28 Playwright executions; the
  observed gate ran 29, matching the latest handover/backlog remediation count.
- [docs/design-document.md](../../docs/design-document.md) (lines 108-113) says a market order updates
  balance/available margin and marks FR-3 complete in the matrix (lines 130-138).
- [src/app/portfolio.ts](../../src/app/portfolio.ts) (lines 6-10) explicitly defines no cash/margin
  change on open, and [tests/unit/portfolio.spec.ts](../../tests/unit/portfolio.spec.ts)
  (lines 16-20) pins that behaviour.
- [docs/backlog.md](../../docs/backlog.md) (lines 51-61) records the accepted paper-trading model and
  29 E2E executions after TRIAGE-01.

**Impact.** Reviewers cannot tell whether FR-3 is implemented as specified or intentionally changed,
and the README understates current evidence. This is credibility drift, not runtime breakage.

**Refactor recommendation and strategy.** Reconcile FR-3 with the accepted MVP money model (or record
the decision in an ADR), update the traceability wording, and change the current README count to 29.
Keep historical counts in dated backlog/changelog entries unchanged.

---

[<- Previous: Executive Summary](01_EXECUTIVE_SUMMARY.md) | [Back to Index](00_CODE_REVIEW_CODEX_v1_20260724T0026Z.md) | [Next: Project Review ->](03_PROJECT_REVIEWS/PROJECT_001_mobile-forex-automation.md)
