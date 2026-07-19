<!--
  AUDIENCE: Engineers and AI agents maintaining this project.
  PURPOSE:  Single source of truth for outstanding work, risks, and planning.
  LOCATION: docs/backlog.md
-->

# Mobile Forex Automation — Backlog

**Version:** 6 — MF-01…MF-14 and TRIAGE-01…06 complete; roadmap closed
**Last Updated:** 2026-07-19
**Based on:** `docs/design-document.md` v0.4 and the Mobile Forex Trading App PRS in
`project-specs/`. Approach fixed by `docs/adr/ADR-0001-approach.md` (web + Playwright emulation).

This backlog is the project's **source of truth** for item status. The vertical slice + automation
are broken into MF-01…MF-14, ordered by phase (build the SUT → automate → ship); TRIAGE-01…06 are
the follow-on code-review remediation cycle. All items are complete; registry onboarding, the first
handover, and the public landing card are all merged and verified.

**Priority Scoring System:**
- **Score = Value (0–10) + Breakage/Blocking (0–10) + Effort-inverse/Enablement (0–10)**
- **HIGH (20–30) / MEDIUM (10–19) / LOW (0–9)** — here used mainly for *ordering within the phases*.

---

## Delivery History (completed roadmap)

The build, automation, CI, public-demo, and portfolio-onboarding outcomes are complete. The items
below retain the delivery history; there is no outstanding roadmap work.

### Phase 1 — Build the SUT (minimal vertical slice)
- **MF-01 — Scaffold: Vite + TypeScript + CI skeleton.** ✅ **DONE 2026-07-08** (PR #1): app shell
  with stable testids; `npm run verify` = tsc strict + Vitest unit lane + Playwright e2e against the
  **built** app (`vite preview`); CI Node 24 (checkout/setup-node@v5, timeout, concurrency,
  least-privilege token, failure-only report upload). Local + CI verify green; audit 0.
- **MF-02 — Pure P&L + validation core.** ✅ **DONE 2026-07-08** (PR #1): integer money scheme
  (points / lots2 / pence); PRS oracle pinned (62.0 pips / +£246.78 / £2.50 commission); swap incl.
  triple-Wednesday + same-day zero; strict SL/TP validation; edge-only formatting. 28 unit tests.
- **MF-03 — Deterministic seeded mock feed.** ✅ **DONE 2026-07-08** (PR #2): `createFeed(seed)`,
  per-pair PRNG streams (polling-order independent), positive-integer prices over long walks,
  `parseSeed` for the `?seed=` test mode, GBP/USD-based conversion rate (MVP simplification noted
  in design §5.3). 12 further unit tests → 40 total.
- **MF-04 — Login + demo profile.** ✅ **DONE 2026-07-08** (PR #3): email/password login (light
  demo validation) → deterministic userId + £10,000 demo profile (integer pence), injected-storage
  persistence surviving reload, sign-out; FR-1 e2e journeys + session unit tests.
- **MF-05 — Watchlist + tick flashes.** ✅ **DONE 2026-07-09** (PR #4): 5 MVP pairs, green/red
  flash on tick direction; a single ticker owns tick timing (one tick per pair per interval, so
  per-pair seq == intervals elapsed); rows carry `data-seq`/`data-direction` so the E2E **replays
  the seeded feed and predicts the exact on-screen price** at any observed seq. 3 ticker unit tests
  + 4 e2e (5 pairs shown, deterministic-replay price match, flash colour==direction, sign-out stops).
- **MF-06 — Order panel + open position + live floating P&L.** ✅ **DONE 2026-07-09** (PR #5):
  `Portfolio` app-state (deterministic trade ids, no RNG); market Buy/Sell at the live feed price
  creates an `open_trades` position validated per PRS rules; open positions panel shows entry, live
  price, and floating (unrealised gross) P&L; equity readout = balance + total floating P&L.
  **MVP money model** (design doc): open doesn't touch cash (paper trading, no margin), realised net
  P&L applies on close (MF-07); MVP closes same-day so swap=0 in the UI. e2e replays the seed to
  predict the exact floating P&L shown. 58 unit + 11 e2e.
- **MF-07 — Close position → P&L → history.** ✅ **DONE 2026-07-09** (PR #6): `Portfolio.close`
  computes realised **net** P&L (gross − commission, swap 0 same-day), writes a **frozen** immutable
  `trade_history` row (deterministic `-hNNNN` id, `MANUAL` reason), applies net to the **cash
  balance** (the PRS "balance updates on closure"). Close button per position; trade-history panel.
  e2e predicts net + new balance from the **app-recorded** entry/exit (race-free). PRS oracle close:
  gross +£246.78 − £2.50 = **net £244.28**. 64 unit + 13 e2e.
- **MF-08 — Responsive/adaptive layout.** ✅ **DONE 2026-07-10** (PR #7): pure `layoutFor(width)`
  (mobile <600 / tablet 600–1024 / desktop >1024, PRS §2.2); CSS grid workspace — single column on
  mobile, watchlist-sidebar + main-dock split on desktop; `data-layout` reflects the breakpoint;
  resize listener with cleanup. e2e asserts **actual geometry** (bounding boxes: mobile stacks,
  desktop side-by-side) + live reflow across breakpoints. **Phase 1 COMPLETE.** 66 unit + 16 e2e.

### Phase 2 — Unit / logic tests (the cheap oracle)
- **MF-09 — Unit boundary sweep.** ✅ **DONE 2026-07-10** (PR #8): ISTQB boundary-value +
  equivalence-partition sweep over the pure core (quote-cents identity, JPY conventions, half-away
  rounding both signs, commission scaling, swap accumulation/triple-Wednesday/JPY branch, and
  parametrised validation tables for volume / SL-TP-on-entry / timestamp / exit-price). **Caught a
  real bug:** `grossPnlQuoteCents` used a ×10 JPY factor instead of ×100 (inconsistent with the swap
  branch) — off by 10× for USD/JPY P&L, a pair the app trades; fixed in `src/core/pnl.ts`. 90 unit
  + 16 e2e. **Phase 2 complete.**

### Phase 3 — Mobile E2E suite (the deliverable)
- **MF-10 — E2E journeys (mobile emulation).** ✅ **DONE 2026-07-10** (PR #9): Playwright device
  projects — **Pixel 7 (Chromium/Android)** + **iPhone 14 (WebKit/iOS)**, real mobile viewports with
  `hasTouch`; `tests/e2e/mobile/**` routed to them (desktop specs `testIgnore` the dir). Full
  lifecycle by **`tap()`** (touch): login → watchlist → buy → close → history → balance, race-free
  deterministic; asserts the touch/mobile-viewport context. CI installs chromium+webkit. **Caught +
  fixed a real mobile flakiness bug:** the Close button jittered each tick (row reflow as P&L text
  width changed) → `table-layout: fixed`. 90 unit + 22 e2e (14 desktop + 4×2 mobile), flake-free ×4.
- **MF-11 — E2E responsive breakpoints (on device).** ✅ **DONE 2026-07-10** (PR #10): responsive
  layout verified on the **real** Pixel/iPhone device viewports (not a resized desktop) — portrait
  sub-600 viewport selects the mobile layout; panes stack single-pane (geometry); **no horizontal
  overflow** with a position on screen (mobile hygiene). Desktop-split half stays in
  `responsive.spec.ts`. 90 unit + 28 e2e. **Phase 3 core E2E complete**; MF-12 subsequently added
  the Screenplay layer.
- **MF-12 — Screenplay layer for the mobile E2E.** ✅ **DONE 2026-07-13** (PR #11; design Q2
  resolved = yes, user-confirmed): hand-rolled, framework-free layer in the portfolio's house style
  under `tests/screenplay/` — `Actor.named('Ada').whoCan(BrowseTheWeb.using(page))` attempts
  touch-first Tasks (`Login`, `PlaceMarketOrder`, `WaitUntilPriceMoves`, `ClosePosition`) and asks
  Questions (`TheAccountBalance`, `TheOpenPositionId`, `TheRecordedPrices/NetPnl`,
  `TheWorkspaceLayout`). Mobile journeys spec rewritten in Screenplay form with **identical
  deterministic assertions**; breakpoints spec stays plain (geometry-heavy, no business language).
  Lesson: ability lookup typed structurally (`prototype`+`name`) so private-constructor classes
  work. 90 unit + 28 e2e. **Phase 3 complete.**

### Phase 4 — Ship
- **MF-13 — CI gate + Pages demo.** ✅ **DONE 2026-07-14** (PR #13): Node 24 CI remains green
  (strict typecheck + 90 unit + 28 E2E executions); Vite derives the project Pages base path; a
  least-privilege workflow validates artifacts on PRs and deploys only from `main`. The first Pages
  deployment succeeded and the public [live demo](https://gbrooks1970.github.io/mobile-forex-automation/)
  passed an HTTP 200 + login → order → price move → close → history → balance smoke journey with
  zero console/page errors.
- **MF-14 — Handover v1 + registry row + landing-page card.** ✅ **DONE 2026-07-14:** registered by
  [`portfolio-prompts` PR #32](https://github.com/NeoCognitus70/portfolio-prompts/pull/32) as an
  `orchestration_target: true` project, making eight fan-out targets; published the first
  [versioned handover](https://github.com/GBrooks1970/test-automation-portfolio/blob/main/session-notes/mobile-forex-automation_session-notes_v1_20260714T0629Z.md)
  through parent-repository PR #5; and added the repository, live-demo, and CI links to the public
  [portfolio landing page](https://gbrooks1970.github.io/portfolio/) through portfolio PR #1. The
  deployed page was verified against merge `1fb2ddf`.

### Phase 5 — Code review remediation (`.review/CODE_REVIEW_FABLE_v1_20260718T0608Z/`)
- **TRIAGE-01 — Escape non-literal `innerHTML` interpolations.** ✅ **DONE 2026-07-19** (PR #18):
  `escapeHtml()` helper added, used at both non-literal interpolation sites (signed-in email, login
  error messages); e2e regression proves a crafted `<b>x</b>@x.co` email renders as literal text.
  Review R-1 (MEDIUM). 90 unit + 29 e2e.
- **TRIAGE-02 — Pair-aware price parser; dedupe `toPts`/`gbp` test helpers.** ✅ **DONE 2026-07-19**
  (PR #19): `tests/support/prices.ts` added (`parsePricePts` — exact integer inverse of
  `formatPricePts`, pair-aware via `pointDecimals`; `gbp`); replaces three duplicated hard-coded
  5-decimal `toPts` definitions (latent JPY-pair bug) and two duplicated `gbp()` formatters;
  `TheRecordedPrices` now takes a `pair` param. Review R-2 (MEDIUM). 90 unit + 29 e2e.
- **TRIAGE-03 — Flat-config ESLint (type-checked) + `eslint-plugin-playwright`.** ✅ **DONE
  2026-07-19** (PR #20): `eslint.config.mjs` (type-checked rules for `src/**`+`tests/**`, plain
  recommended for root `*.config.ts` files, Playwright plugin for `tests/e2e/**`); `lint` script
  (`--max-warnings 0`) folded into `verify` and CI. Fixed 3 real findings the new gate surfaced;
  added 2 scoped, justified suppressions rather than blanket rule-offs. Review R-3 (MEDIUM).
- **TRIAGE-04 — Align CI/Pages action majors; add `npm audit` to CI.** ✅ **DONE 2026-07-19**
  (PR #21): `ci.yml` bumped `actions/checkout`/`actions/setup-node` to match `pages.yml`'s
  already-proven `@v7`/`@v6`; new "Audit dependencies" step (`npm audit --audit-level=high`, 0
  vulnerabilities). Review R-4 (LOW).
- **TRIAGE-05 — State the E2E-vs-unit oracle distinction.** ✅ **DONE 2026-07-19** (PR #22):
  docs-only; one sentence added to README.md's Test evidence section and design-document.md §8.
  Review R-5 (LOW).
- **TRIAGE-06 — Dedupe `appVersion`; preserve typed email; `fullyParallel` comment; prune stale
  branches.** ✅ **DONE 2026-07-19** (PR #23): `appVersion` now imported from `package.json`
  (single source of truth); `renderLogin` preserves the typed email on a validation error (new e2e
  regression); `fullyParallel: false` documented; 5 stale merged remote branches pruned. Review R-6
  (LOW, 4 of 5 sub-items — the "newer tool majors available" sub-item was dropped as non-actionable
  at triage time). **Phase 5 complete — review worklist 6/6.**

---

## Risk Summary
| Priority | Count | Status |
|---|---|---|
| **Total Outstanding** | 0 | Roadmap complete |
| Resolved | 14 (MF-01…MF-14) + 6 (TRIAGE-01…06) | Build + automation + public demo + portfolio onboarding + review remediation complete |

---

## Potential Next Steps (beyond the MVP slice)
- **Phase B (native):** add an Appium or Maestro layer against a Flutter build (ADR-0001) if a
  native-app credential is wanted.
- **Accessibility (axe-core)** and **visual-regression (Playwright baselines)** — cheap follow-ons the
  semantic markup leaves open (portfolio gaps B-4/B-5).

## Maintenance Notes
- Update the version at the top when items change status; mark completion dates on ✅ items.
- Gate is `npm run verify`; keep it green before any merge. All changes to `main` via branch + PR.
- Determinism is non-negotiable: no wall-clock/RNG without a seed (design doc NFR-1).
