# Risks and Issues

[<- Back to Index](00_CODE_REVIEW_Gemini_v1_20260807T1410Z.md) | [Next: Project Review ->](03_PROJECT_REVIEWS/PROJECT_001_mobile-forex-automation.md)

**Reviewer:** AI assistant (Gemini)

Risks are ranked high to low priority. No HIGH or MEDIUM risks were identified; the repository exhibits high structural reliability and complete review remediation. The five LOW findings represent incremental maintenance and quality enhancements.

## R-1 (LOW) - Static asset hosting base path validation gap in local verification gate

**Risk Description.** `vite.config.ts` reads `process.env['VITE_BASE_PATH']` to set the asset prefix for GitHub Pages deployment. While the CI `pages` job checks that `dist/index.html` includes the base path, local `npm run verify` runs `vite preview` with default root path `/`.

**Evidence.**
- [vite.config.ts](vite.config.ts) (lines 5-7): `base: process.env['VITE_BASE_PATH'] ?? '/'`.
- [.github/workflows/ci.yml](.github/workflows/ci.yml) (lines 80-85): asset path verification runs only within the CI `pages` job.
- [package.json](package.json) (line 18): `npm run verify` does not set or test `VITE_BASE_PATH`.

**Impact Analysis.** An asset import or relative path configuration bug could pass local verification and break when deployed under a sub-path on GitHub Pages if CI checks are bypassed.

**Refactor Recommendation and Strategy.** Include a dry-run build check in `package.json` or a unit test that verifies `vite build` succeeds with `VITE_BASE_PATH=/mobile-forex-automation/` and checks asset path generation.

## R-2 (LOW) - Accessible labeling and assistive technology notifications missing on dynamic UI elements

**Risk Description.** Dynamic table rows for open positions render "Close" action buttons without contextual ARIA labels distinguishing which position is targeted. Additionally, live price updates in the watchlist table do not notify screen readers via ARIA live regions.

**Evidence.**
- [src/ui/positions.ts](src/ui/positions.ts) (line 21): `<button type="button" class="close-btn" ...>Close</button>`.
- [src/ui/watchlist.ts](src/ui/watchlist.ts) (lines 30-42): price updates modify cell text content directly without `aria-live`.

**Impact Analysis.** Assistive technology users listening to table navigation hear repeated uncontextualised "Close" controls and cannot perceive real-time market price updates.

**Refactor Recommendation and Strategy.** Add contextual ARIA labels (e.g. `aria-label="Close position ${trade.tradeId} for ${trade.currencyPair}"`) to close buttons, and add `aria-live="polite"` to watchlist price cells.

## R-3 (LOW) - Uncapped in-memory trade history array growth over extended trading sessions

**Risk Description.** Closed trades are appended to an array in `Portfolio` without a maximum boundary. Every position closure re-renders the complete history array into HTML via string concatenation.

**Evidence.**
- [src/app/portfolio.ts](src/app/portfolio.ts) (lines 33, 149): `this.closed.push(row)` grows unboundedly.
- [src/ui/history.ts](src/ui/history.ts) (lines 21-27): `[...rows].reverse().map(rowHtml).join('')` processes every historical row.

**Impact Analysis.** In prolonged interactive demo sessions with hundreds of trades, DOM creation and string allocation costs grow linearly ($O(N)$), causing minor UI rendering latency.

**Refactor Recommendation and Strategy.** Cap the rendered history view to the most recent N items (e.g. 50 trades) or introduce simple client-side pagination.

## R-4 (LOW) - Un-debounced window resize listener triggers frequent layout computations during window dragging

**Risk Description.** The window `resize` event listener directly executes `applyLayout()` on every event emission without debouncing or throttling.

**Evidence.**
- [src/main.ts](src/main.ts) (lines 142-144): `window.addEventListener('resize', onResize)` calls `applyLayout()` synchronously.

**Impact Analysis.** Dragging a desktop browser window rapidly triggers dozens of layout determinations per second, causing redundant DOM attribute updates.

**Refactor Recommendation and Strategy.** Wrap the resize event handler with `requestAnimationFrame` or a lightweight 100ms debounce function.

## R-5 (LOW) - Lack of explicit touch-action CSS styling for mobile emulation targets

**Risk Description.** Mobile UI CSS styles omit `touch-action` and double-tap zoom prevention rules on interactive trading controls.

**Evidence.**
- [src/style.css](src/style.css) (lines 1-180): missing `touch-action: manipulation` on buttons and select inputs.
- [tests/e2e/mobile/journeys.mobile.spec.ts](tests/e2e/mobile/journeys.mobile.spec.ts) (lines 23-35): mobile touch assertions exercise tap events.

**Impact Analysis.** On real mobile touch screens, rapid double-tapping on "Buy" or "Sell" buttons could trigger default browser viewport zooming rather than fast order placement.

**Refactor Recommendation and Strategy.** Add `touch-action: manipulation` and `-webkit-tap-highlight-color: transparent` to button and input selectors in `src/style.css`.

---

[<- Previous: Executive Summary](01_EXECUTIVE_SUMMARY.md) | [Back to Index](00_CODE_REVIEW_Gemini_v1_20260807T1410Z.md) | [Next: Project Review ->](03_PROJECT_REVIEWS/PROJECT_001_mobile-forex-automation.md)
```

---