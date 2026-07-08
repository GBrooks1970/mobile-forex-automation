# Mobile Forex Automation — Design Document

**Version:** v0.1
**Date:** 2026-07-08T00:00:00Z
**Author:** Gary Brooks (with Claude Fable 5)
**Reviewer:** CLAUDE Fable 5 (pending human review)
**Status:** Draft — awaiting review before Phase 1

> Adapted from `templates/design-document.template.md`; sections that do not apply to a greenfield
> test-automation project are marked `N/A — <reason>` per the template's own rule.

---

## 1. Executive Summary

### Purpose
Fill the portfolio's most conspicuous gap — **mobile automation** — using the existing
`project-specs/Product Requirement Specification (PRS)- Mobile Forex Trading Application.md`. Because
that PRS describes an application that does **not exist**, this project delivers **two** things: a
**minimal System Under Test** (a vertical slice of the PRS's MVP as a responsive web app) and the
**mobile test-automation suite** that exercises it. The automation is the portfolio deliverable; the
SUT exists only to be tested.

### Scope
**In Scope (the MVP vertical slice, from PRS §3):**
- Email/password **login** generating a **£10,000 demo profile**.
- **Watchlist** of the 5 MVP pairs (GBP/USD, EUR/USD, USD/JPY, AUD/USD, USD/CAD) with green/red
  tick-direction flashes, fed by a **deterministic, seedable mock price feed**.
- **Market order** placement (Buy/Sell, volume in lots) that opens a position and updates balance.
- **Close position** → compute **P&L** (PRS math) → move to **trade history**.
- **Responsive/adaptive layout** at the PRS breakpoints (mobile portrait < 600, tablet 600–1024,
  desktop split > 1024).
- **P&L + validation engine** as a pure, unit-tested module (the PRS gives worked examples as oracles).

**Out of Scope (explicitly, this phase):**
- Native mobile build (Flutter) and native drivers (Appium/Maestro) — deferred to an optional
  **Phase B** ("A now, native later", per ADR-0001).
- Live market data / real liquidity feed (we use a mock feed — never live).
- Biometric MFA, KYC onboarding, Open-Banking funding, TLS/at-rest encryption (PRS §1.3).
- Real charting engine, drawing tools, indicators beyond a stubbed EMA-50 visual (charts are poor
  automation targets — we test the data layer, not pixels).
- Limit/Stop/Trailing orders, slippage control, economic calendar, push notifications, Windows desktop.

### Key Decisions
1. **Approach A (web + Playwright mobile emulation)** now, native later — ADR-0001.
2. **Deterministic seeded mock feed** — a `?seed=` test mode makes every tick reproducible; no live data.
3. **Money as integer micro-units**, never floats (PRS §"no floating-point for money").
4. **Pure P&L/validation core** decoupled from UI, unit-tested against the PRS's worked examples.
5. **Screenplay layer for the E2E** (consistency with the portfolio's identity) — provisional, see Open Q2.

### Success Criteria
- The MVP slice runs deterministically in a headless browser with a seeded feed.
- The P&L engine reproduces the PRS worked example (GBP/USD, 0.5 lots, 1.25000→1.25620 = **62.0 pips
  / +£246.78 gross**) to the penny, plus commission/swap cases.
- A Playwright mobile-emulation E2E suite (Pixel + iPhone descriptors) covers login → watchlist →
  order → close → history and the responsive breakpoints, green locally and in CI.
- The project is CI-gated, has a live demo, a v1 handover, and a registry row (fan-outs → 8 targets).

---

## 2. Problem Analysis

### Current State
The portfolio covers web UI, API/BDD, multi-stack parity, WebSocket, a Screenplay library, and a
shipped product — but **nothing mobile**. `PORTFOLIO_BACKLOG.md` P-03 identifies this as the top
gap, with the forex PRS as a ready-made scenario source.

**Pain point:** the PRS is a *requirements document*, not runnable software — there is no SUT. A
mobile-automation project therefore cannot start by "writing tests"; it must first stand up a
minimal, deterministic thing to test.

### Constraints and Assumptions
**Technical constraints:**
- CI is **GitHub Actions** — no mobile device farm; the suite must run headless with no external
  services. (This is the decisive reason for Approach A; see §10.)
- Determinism is mandatory — a trading UI driven by a *live* feed would be untestable/flaky.

**Assumptions:**
- A responsive web slice is a legitimate SUT for *mobile-web* automation (device emulation, touch,
  viewport, breakpoints) and is honestly labelled as such (not native-app automation).
- The PRS's MVP scope (§3) and its worked P&L math are a sufficient, self-contained spec.

### Stakeholders
| Stakeholder | Role | Interest | Impact |
|---|---|---|---|
| Gary Brooks | Owner / portfolio author | A credible mobile-automation showcase, CI-clean | High |
| Reviewers / employers | Audience | Evidence of mobile + non-functional test skill | High |

---

## 3. Requirements

Functional requirements are the vertical slice; each maps to worklist items and test cases (§6, §8).

**FR-1 Login → demo profile.** As a trader, I log in with email/password and get a £10,000 demo
balance. *AC:* Given valid credentials, when I log in, then a demo profile with balance £10,000.00
exists and is shown. **Must.**

**FR-2 Watchlist with tick flashes.** *AC:* Given the 5 MVP pairs, when a seeded tick arrives, then
the row shows the new price and flashes green (up) or red (down) deterministically for the seed. **Must.**

**FR-3 Place market order.** *AC:* Given a pair and a valid lot size, when I Buy/Sell, then an open
position is created (schema per PRS `open_trades`) and the balance/available margin updates. **Must.**

**FR-4 Close position → P&L → history.** *AC:* Given an open position and a seeded exit price, when I
close it, then gross/net P&L are computed per the PRS math, the balance updates, and an immutable
`trade_history` row is written. **Must.**

**FR-5 Responsive/adaptive layout.** *AC:* Given viewport < 600 px, then single-pane mobile layout;
given > 1024 px, then the split desktop workspace (watchlist / chart / order panel). **Must.**

**FR-6 P&L + validation engine.** *AC:* pip difference, gross P&L (with GBP conversion), commission,
and swap (incl. triple-Wednesday) match the PRS formulas; validation rules enforced (`volume_lots >
0`; BUY → `TP > entry > SL`, SELL inverse; `closed_at ≥ opened_at`; no float money). **Must.**

### Non-Functional Requirements
- **NFR-1 Determinism.** Identical seed ⇒ identical tick sequence, prices, and P&L. No wall-clock or
  RNG without a seed. (Enables flake-free CI.)
- **NFR-2 CI-clean.** Whole suite runs headless in GitHub Actions, no device farm, no network.
- **NFR-3 No live data.** The mock feed never contacts a real market.
- **NFR-4 Maintainability.** Pure core (P&L/validation) with high unit coverage; UI thin over it.
- **NFR-5 Accessibility-ready.** Semantic markup so an axe pass is a cheap future extension.

### Requirements Traceability Matrix (seed — filled as items land)
| Req | Design component | Test case(s) | Status |
|---|---|---|---|
| FR-1 | Auth module | E2E login; unit profile-gen | Not started |
| FR-6 | P&L/validation core | Unit: PRS oracle + boundaries | Not started |
| FR-5 | Responsive layout | E2E breakpoint (Pixel/iPhone/desktop) | Not started |

---

## 4. Design Overview

### High-Level Architecture
```
        ┌────────────────────────────┐      Test harness
        │   Responsive Web SUT (UI)  │◄───── Playwright (device emulation:
        │   login · watchlist · order│        Pixel / iPhone, touch, viewport)
        │   panel · history · layout │
        └─────────────┬──────────────┘
                      │ reads/writes
        ┌─────────────▼──────────────┐      ┌──────────────────────────┐
        │  Pure core (no UI, no I/O) │      │ Seeded mock price feed    │
        │  · P&L + validation engine │◄─────│ (deterministic tick gen)  │
        │  · trade state (open/hist) │      └──────────────────────────┘
        └────────────────────────────┘
```
The **pure core** (P&L, validation, trade-state transitions) has no DOM and no I/O — unit-tested in
isolation. The **UI** is a thin responsive shell. The **mock feed** is deterministic under a seed.

### Component Overview
| Component | Responsibility | Technology | Deps |
|---|---|---|---|
| SUT UI | Render the MVP slice, responsive | TypeScript + a light web stack (Vite) | pure core, mock feed |
| Pure core | P&L, validation, trade lifecycle | TypeScript (no deps) | — |
| Mock feed | Deterministic seeded ticks | TypeScript | seed param |
| Unit tests | Verify the core against PRS oracles | Vitest | pure core |
| E2E tests | Mobile-emulation user journeys | Playwright (+ optional Screenplay) | SUT |

### Technology Stack (proposed)
| Layer | Technology | Justification |
|---|---|---|
| SUT build | Vite + TypeScript | fast, static-deployable to Pages, matches portfolio TS norm |
| Storage | in-memory + `localStorage` | no backend; deterministic; resettable (PRS demo-reset) |
| Unit | Vitest | portfolio standard (hand-baked, markdown-renderer, calculator) |
| E2E | Playwright device emulation | mobile-web without a device farm; portfolio standard |
| CI | GitHub Actions (Node 24) | portfolio baseline |

### Design Principles
- **Separation of concerns** — pure core vs UI vs feed.
- **KISS/YAGNI** — build only the slice the tests need; charts stubbed.
- **Determinism first** — seed everything.

---

## 5. Detailed Design

### 5.1 Pure core — P&L + validation
The heart of the project's testability. Functions mirror the PRS pseudocode:
- `pipDifference(pair, direction, entry, exit)` — multiplier 100 (JPY) / 10000 (other); directional.
- `grossPnlGbp(...)`, `commission(...)`, `swap(nightsHeld, crossedWednesday, ...)`, `netPnl(...)`.
- `validateOpen(order)` / `validateClose(...)` — the PRS integrity rules.
- Money as **integer micro-units** internally; formatting only at the edge.

### 5.2 Trade state
`open_trades` and `trade_history` shapes exactly per the PRS DDL (constraints become validation).
History rows are immutable once written.

### 5.3 Mock price feed
`createFeed(seed)` yields a reproducible tick stream per pair (seeded PRNG). Test mode: `?seed=<n>`
freezes the sequence so E2E assertions on prices/flashes/P&L are exact.

### 5.4 Data model
Per PRS §"open_trades" / "trade_history" — `trade_id`, `currency_pair`, `trade_direction`,
`volume_lots`, `entry_price`, `exit_price`, `close_reason`, `gross_pnl`, `net_pnl`, timestamps.

### 5.5 API / algorithm
N/A — no server API (local slice). The only non-trivial algorithm is the P&L math (§5.1), specified
with worked examples in the PRS.

---

## 6. Implementation Plan (phases → worklist items)
Phase 1 builds the SUT; Phases 2–3 are the automation (the deliverable); Phase 4 ships it. Each item
is one branch + PR, `/loop`-driven like the hand-baked cycle. Seeded as `docs/backlog.md` MF-01…:

- **MF-01** Project scaffold + Vite/TS + CI skeleton *(Phase 1)*
- **MF-02** Pure P&L/validation core *(Phase 1/2 — buildable before UI)*
- **MF-03** Mock seeded feed *(Phase 1)*
- **MF-04** Login + demo profile UI *(Phase 1)*
- **MF-05** Watchlist + tick flashes *(Phase 1)*
- **MF-06** Order panel + open position + balance *(Phase 1)*
- **MF-07** Close + P&L + history *(Phase 1)*
- **MF-08** Responsive/adaptive layout *(Phase 1)*
- **MF-09** Unit suite vs PRS oracle + boundaries *(Phase 2)*
- **MF-10** E2E: login/watchlist/order/close journeys (mobile emulation) *(Phase 3)*
- **MF-11** E2E: responsive breakpoints (Pixel/iPhone/desktop) *(Phase 3)*
- **MF-12** Optional Screenplay layer for the E2E *(Phase 3, see Open Q2)*
- **MF-13** CI gate + Pages demo *(Phase 4)*
- **MF-14** Handover v1 + registry row + landing-page card *(Phase 4)*

### Risk Mitigation
| Risk | Prob | Impact | Mitigation |
|---|---|---|---|
| Charts hard to assert | High | Low | Stub charts; test the data layer, not pixels |
| E2E flakiness | Med | Med | Seeded deterministic feed (NFR-1); no live data |
| Scope creep (full app) | Med | High | Vertical slice only; out-of-scope list enforced |
| Native credential expected | Low | Med | ADR-0001 records "A now, native later" — Phase B optional |

---

## 7. Refactoring Strategy
N/A — greenfield project, nothing to refactor.

## 8. Testing Strategy
- **Unit (Vitest):** the P&L/validation core. Oracle = the PRS worked example (62.0 pips / +£246.78),
  the commission example (£2.50 total on 0.5 lots @ £2.50/side), triple-Wednesday swap weighting, and
  ISTQB-style boundaries (volume 0/negative; SL/TP ordering; `closed_at` == `opened_at`).
- **E2E (Playwright device emulation):** Pixel 7 + iPhone descriptors, `hasTouch`, seeded SUT. Journeys
  FR-1→FR-4; responsive assertions FR-5. Optional Screenplay layer (MF-12).
- **CI:** GitHub Actions, Node 24, Playwright browsers; unit + E2E gate on PR and push to main.
- **Non-functional (future-cheap):** semantic markup leaves an axe-core accessibility pass and
  Playwright visual baselines as low-effort follow-ons (portfolio gaps B-4/B-5).

## 9. Migration Path
N/A — new project.

## 10. Alternatives Considered
- **A — Web + Playwright mobile emulation (CHOSEN, "now").** Proportionate, CI-clean, deterministic;
  honestly mobile-web not native.
- **C — Flutter + Appium.** Industry-standard native credential; rejected *for now* — large app build
  + painful CI (Android emulator flaky in Actions, iOS needs macOS runners). Kept as optional Phase B.
- **B — Flutter + Maestro.** Lighter native than Appium; rejected for now for the same CI/app-build
  cost. Also a Phase B candidate.

Decision recorded in **ADR-0001**; "A now, native later" per the user (2026-07-08).

## 11. Open Questions
- **Q1 (design):** SUT web stack — Vite + vanilla TS (lightest) vs a small framework? *Proposed:*
  Vite + vanilla TS, to keep the core framework-free and the focus on testing. **Blocking Phase 1? No** —
  default stands unless overridden.
- **Q2 (test design):** Screenplay layer for the E2E (portfolio-consistent) vs plain Playwright POM?
  *Proposed:* Screenplay, for identity; costs a little more. **Non-blocking** — decide at MF-10.
- **Q3 (naming):** repo/registry name `mobile-forex-automation`. *Proposed:* yes. **Non-blocking.**

## 12. Appendices
**Glossary:** *pip* — 4th decimal (2nd for JPY); *lot* — 100,000 base units; *swap* — overnight
financing; *SUT* — system under test. **References:** the forex PRS
(`project-specs/…Mobile Forex Trading Application.md`); `PORTFOLIO_BACKLOG.md` P-03;
`PORTFOLIO_STRUCTURAL_REVIEW_2026-07-07.md` Part B gap 1.

---

## Document History
| Version | Date | Author | Changes |
|---|---|---|---|
| v0.1 | 2026-07-08 | Gary Brooks + Claude Fable 5 | Initial draft for review (Phase 0) |
