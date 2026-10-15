# Milestone 1A browser evidence

Inspected October 14, 2026 (America/Chicago), using the Codex in-app Chromium browser. Final checks used `npm run build` and `npm run preview -- --host 127.0.0.1` (port 4173). Earlier independent UI review used Vite development on port 5173. Screenshots contain repository-default demonstration inputs, not a personal financial plan. Their unseeded results can differ between page loads; use the financial fixture for exact regression comparisons.

## Saved screenshots

- [Graphite desktop, 1440×1000](desktop-graphite.jpg)
- [Porcelain desktop, 1440×1000](desktop-porcelain.jpg)
- [Porcelain Plan, 820×1180](tablet-plan.jpg): keyboard slider focus, reduced motion/transparency enabled.
- [Graphite phone, 390×844](mobile-graphite.jpg)
- [Porcelain phone, 390×844](mobile-porcelain.jpg)
- [Porcelain Appearance dialog, 390×844](appearance.jpg)

## Responsive measurements

Overview, Plan, Explore/Life outcomes, and Report were checked at every width below. `documentElement.scrollWidth` equaled `clientWidth` in every final measurement; the 15px difference from `innerWidth` is the browser's vertical scrollbar. These checks did not rely on hiding document overflow. All boundary layouts were also visually inspected in browser screenshots.

| Viewport width | Client / document width | Primary navigation | Plan input access |
| --- | --- | --- | --- |
| 320 | 305 / 305 | Fixed bottom | Yes |
| 390 | 375 / 375 | Fixed bottom | Yes |
| 767 | 752 / 752 | Fixed bottom | Yes |
| 768 | 753 / 753 | Compact top | Yes |
| 820 | 805 / 805 | Compact top | Yes |
| 1023 | 1008 / 1008 | Compact top | Yes |
| 1024 | 1009 / 1009 | Top | Yes |
| 1279 | 1264 / 1264 | Top | Yes |
| 1280 | 1265 / 1265 | Top, desktop Plan composition | Yes |
| 1440 | 1425 / 1425 | Top, desktop Plan composition | Yes |

Representative heights: 1440×1000, 820×1180, 390×844. Boundary checks used 1000px height; some narrow exploratory checks used 900px. Browser scaling exposed fractional CSS widths between 767 and 768, motivating continuous media query ranges.

## Interaction and reachability

- Every Explore choice rendered: Life outcomes, Wealth trajectories, Account buckets, Spending plan, Cash flows, Withdrawal rates, Income tax, Tax timeline, Scenario comparison, Stress tests, Sensitivity, and Carry awards (default empty state). Core analyses also passed 320px overflow checks. Stress and sensitivity use labeled, focusable local 640px scrolling regions at 320px; document width remained 305px and ArrowRight moved the region by 40px.
- Plan remained reachable at every viewport. Expanding all existing sections at 320px exposed 31 inputs with zero unnamed inputs and no document overflow. Input and slider accessible names, spouse switch name, and error descriptions were checked.
- Edited current age 47→48; reset restored 47; Undo restored 48. Invalid age 80 showed an associated error and last-valid-result message. Restored 47 afterward. Financial handlers and persistence schema stayed unchanged.
- Destination changes focused the H1. Enter activated Plan; Tab reached the named age slider. Native modal focus wrapping passed in both directions; Escape closed Appearance and restored its opener.
- Guide contents stayed in `#guide/montecarlo`, focused its H2, and scrolled below the header. Back returned to `#guide` at the top; Forward and reload restored the section.
- Graphite, Porcelain and System were selected. System resolved Graphite with the browser's dark device preference. Reduce transparency produced computed `backdrop-filter: none`; Reduce motion produced `0s` navigation transition and `animation-name: none`. Keyboard navigation still worked. Both overrides were turned off after testing.
- No console errors were observed in the inspected browser state.

## Limits and deferred work

This is browser viewport testing, not a physical-phone performance or screen-reader certification. Actual OS preference changes, forced-colors mode, and a browser lacking backdrop-filter were not separately emulated; CSS supplies solid/forced-color/system-preference fallbacks. Named-plan persistence, draft-input behavior, precise error navigation and detailed reset previews belong to 1C. Existing chart series styling, small chart labels and synchronous scenario/report computation remain scheduled for later milestones. The core Overview dashboard intentionally retains its existing information structure until 1B.
