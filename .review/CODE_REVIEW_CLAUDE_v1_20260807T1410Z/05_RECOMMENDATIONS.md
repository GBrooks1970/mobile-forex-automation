# Recommendations

[<- Back to Index](00_CODE_REVIEW_CLAUDE_v1_20260807T1410Z.md) | [Next: Architecture Assessment ->](06_ARCHITECTURE_ASSESSMENT.md)

**Reviewer:** AI assistant (Claude)

## Recommended Refactors

- **Add Accessible ARIA Attributes (R-2):** Enhance `src/ui/positions.ts` by adding descriptive `aria-label` attributes to close buttons (e.g. `Close position ${trade.tradeId}`) and `aria-live="polite"` regions for price tick updates in `src/ui/watchlist.ts`.
- **Debounce Resize Listener (R-4):** Wrap the window `resize` event listener in `src/main.ts` with `requestAnimationFrame` or a 100ms debounce helper to eliminate redundant layout recalculations during browser window resizing.
- **Add Mobile Touch CSS Styles (R-5):** Update `src/style.css` to set `touch-action: manipulation` and `-webkit-tap-highlight-color: transparent` across interactive buttons and form inputs.

## Next Steps

- **Cap History Display (R-3):** Implement a maximum rendering limit (e.g. latest 50 closed trades) in `src/ui/history.ts` to prevent DOM growth in long-running test sessions.
- **Base Path Dry-Run Verification (R-1):** Add an npm script or unit check validating that `vite build` with `VITE_BASE_PATH` generates correct asset relative links.

## Future Project Ideas

- **Phase B Native Mobile Test Layer:** Extend the project with an optional Appium or Maestro test lane targeting a mobile native build (Flutter / React Native) as outlined in `ADR-0001`.
- **Visual Regression Testing:** Integrate Playwright screenshot snapshot comparisons for mobile viewports across Dark/Light themes.
- **Automated Accessibility Audit:** Add `axe-core` integration into Playwright mobile E2E journeys to enforce WCAG 2.1 AA compliance automatically.

---

[<- Previous: Cross-Project Analysis](04_CROSS_PROJECT_ANALYSIS.md) | [Back to Index](00_CODE_REVIEW_CLAUDE_v1_20260807T1410Z.md) | [Next: Architecture Assessment ->](06_ARCHITECTURE_ASSESSMENT.md)
```

---