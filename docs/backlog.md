<!--
  AUDIENCE: Engineers and AI agents maintaining this project.
  PURPOSE:  Single source of truth for outstanding work, risks, and planning.
  LOCATION: docs/backlog.md
-->

# Mobile Forex Automation — Backlog

**Version:** 1 — initial roadmap (Phase 0 scaffold; project not yet implemented)
**Last Updated:** 2026-07-08
**Based on:** `docs/design-document.md` v0.1 and the Mobile Forex Trading App PRS in
`project-specs/`. Approach fixed by `docs/adr/ADR-0001-approach.md` (web + Playwright emulation).

This backlog is the project's **source of truth** for item status. The vertical slice + automation
are broken into MF-01…MF-14, ordered by phase (build the SUT → automate → ship). A `/loop` will
consume a `WORKLIST_mobile-forex-automation.md` derived from these.

**Priority Scoring System:**
- **Score = Value (0–10) + Breakage/Blocking (0–10) + Effort-inverse/Enablement (0–10)**
- **HIGH (20–30) / MEDIUM (10–19) / LOW (0–9)** — here used mainly for *ordering within the phases*.

---

## Outstanding Work (roadmap)

Nothing is implemented yet — this is Phase 0 (docs + scaffold). The items below are the planned
build order; each becomes one branch + PR when actioned.

### Phase 1 — Build the SUT (minimal vertical slice)
- **MF-01 — Scaffold: Vite + TypeScript + CI skeleton.** ✅ **DONE 2026-07-08** (PR #1): app shell
  with stable testids; `npm run verify` = tsc strict + Vitest unit lane + Playwright e2e against the
  **built** app (`vite preview`); CI Node 24 (checkout/setup-node@v5, timeout, concurrency,
  least-privilege token, failure-only report upload). Local + CI verify green; audit 0.
- **MF-02 — Pure P&L + validation core.** `pipDifference`, `grossPnlGbp`, `commission`, `swap`,
  `netPnl`, `validateOpen/Close`; money as integer micro-units. (Buildable before the UI.)
- **MF-03 — Deterministic seeded mock feed.** `createFeed(seed)` reproducible tick stream; `?seed=`
  test mode.
- **MF-04 — Login + demo profile.** ✅ **DONE 2026-07-08** (PR #3): email/password login (light
  demo validation) → deterministic userId + £10,000 demo profile (integer pence), injected-storage
  persistence surviving reload, sign-out; FR-1 e2e journeys + session unit tests.
- **MF-05 — Watchlist + tick flashes.** 5 MVP pairs, green/red on tick direction.
- **MF-06 — Order panel + open position + balance update.** Market Buy/Sell, lots, `open_trades` row.
- **MF-07 — Close position → P&L → history.** Immutable `trade_history` row; balance update.
- **MF-08 — Responsive/adaptive layout.** Breakpoints < 600 (mobile), > 1024 (desktop split).

### Phase 2 — Unit / logic tests (the cheap oracle)
- **MF-09 — Unit suite vs the PRS.** Worked example (62.0 pips / +£246.78), commission, triple-Wednesday
  swap, and ISTQB boundary cases for the validation rules.

### Phase 3 — Mobile E2E suite (the deliverable)
- **MF-10 — E2E journeys (mobile emulation).** Pixel + iPhone descriptors, touch, seeded feed:
  login → watchlist → order → close → history.
- **MF-11 — E2E responsive breakpoints.** Mobile single-pane vs desktop split assertions.
- **MF-12 — Optional Screenplay layer for the E2E.** Portfolio-consistent; decide at MF-10 (Open Q2).

### Phase 4 — Ship
- **MF-13 — CI gate + Pages demo.** Unit + E2E green in CI; deploy the SUT to Pages as a live demo.
- **MF-14 — Handover v1 + registry row + landing-page card.** Onboard to the registry (fan-outs → 8);
  add the card to `portfolio-landing/`.

---

## Risk Summary
| Priority | Count | Status |
|---|---|---|
| **Total Outstanding** | 14 (MF-01…MF-14) | Roadmap — none started (Phase 0) |
| Resolved | 0 | — |

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
