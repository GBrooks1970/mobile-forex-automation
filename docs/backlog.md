<!--
  AUDIENCE: Engineers and AI agents maintaining this project.
  PURPOSE:  Single source of truth for outstanding work, risks, and planning.
  LOCATION: docs/backlog.md
-->

# Mobile Forex Automation — Backlog

**Version:** 2 — MF-01…MF-12 complete; Phase 4 shipping remains
**Last Updated:** 2026-07-13
**Based on:** `docs/design-document.md` v0.2 and the Mobile Forex Trading App PRS in
`project-specs/`. Approach fixed by `docs/adr/ADR-0001-approach.md` (web + Playwright emulation).

This backlog is the project's **source of truth** for item status. The vertical slice + automation
are broken into MF-01…MF-14, ordered by phase (build the SUT → automate → ship). MF-01…MF-12 are
complete; MF-13 and MF-14 are the remaining ship/onboarding work.

**Priority Scoring System:**
- **Score = Value (0–10) + Breakage/Blocking (0–10) + Effort-inverse/Enablement (0–10)**
- **HIGH (20–30) / MEDIUM (10–19) / LOW (0–9)** — here used mainly for *ordering within the phases*.

---

## Outstanding Work (roadmap)

The build and automation phases are complete. The items below retain the delivery history and the
two remaining Phase 4 outcomes.

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
- **MF-13 — CI gate + Pages demo.** 🟡 **IN PROGRESS:** CI is implemented and green on `main`
  (Node 24; strict typecheck + 90 unit + 28 E2E executions). Remaining: configure the Vite asset
  base, deploy the built SUT to GitHub Pages, smoke-test the public URL, and record it in the README
  and repository homepage.
- **MF-14 — Handover v1 + registry row + landing-page card.** ⬜ **OPEN:** onboard to the registry
  (`orchestration_target: true`, making eight fan-out targets), write the first handover, and add the
  live-demo card to `portfolio-landing/`.

---

## Risk Summary
| Priority | Count | Status |
|---|---|---|
| **Total Outstanding** | 2 (MF-13, MF-14) | 1 in progress, 1 open |
| Resolved | 12 (MF-01…MF-12) | Build + automation phases complete |

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
