# Terminus 2.0 — design specification

Status: implementation blueprint; no application changes authorized by this document alone. Audit date: October 14, 2026 (America/Chicago). Source baseline: `f4811b3` on `main`. Delivery sequence and open risks live in [PROGRESS.md](PROGRESS.md).

## 1. Product thesis and boundaries

**A quiet, precise instrument for understanding a financial future.** Lead with the plan's outcome, make its uncertainty legible, then let the user inspect the assumptions and test alternatives. Premium means confident hierarchy, excellent typesetting, restrained material depth, and immediate control feedback. It does not mean more decoration or more cards.

Keep **the Number** as the customer-facing wordmark, with “Private wealth planning” as optional supporting text. Terminus remains the repository/project name. Use a single-color wordmark, with the small “the” optically aligned to “Number”; remove the teal-to-blue gradient and widely tracked lab slogan. No new logo asset or framework migration is required.

Retain React 18, TypeScript, Vite 6, Tailwind 3, Zustand 5, Radix primitives, Lucide, and Recharts 2. Preserve all current financial inputs, units, defaults, validation bounds, scenario definitions, result series, and engine semantics during presentation work. Do not quietly change mortality treatment, tax assumptions, success thresholds, spending phases, carry timing, or percentile computation. Mathematical and interpretive corrections require the separate reliability milestone and explicit fixtures.

## 2. Evidence and diagnosis

### Source and history

- `AppShell.tsx` owns a 56px header, five-theme cycling, a permanent 380px sidebar, mobile sheet, reset, placeholder sharing, and active analytical tab. `MainPanel.tsx` repeats verdict metrics as three stat cards and mounts ten analytical tabs beneath the entire dashboard, even for educational content.
- `HeroVerdict.tsx` combines a long sentence, three boxed metrics, accumulation estimates, and a separately computed sustainable-spending estimate. `NetWorthSnapshot.tsx` shows both a stacked allocation bar and a donut of the same assets. The visual weight is disproportionate to the information.
- `index.css`, `useTheme.ts`, and chart components split color ownership between variables, inline styles, hardcoded colors, and repeated theme overrides. Universal color transitions and large shadows apply indiscriminately. Small uppercase labels dominate.
- Recent commits `f6f74ba` and `768db91` improved themes, cash-flow presentation, planning inputs, and tax-bucket simulation. Preserve these capabilities. `b10865e` addressed simulation/input correctness; do not assume those fixes settle the remaining audit questions. `f4811b3` establishes the current working rules.
- `.codex/config.toml` limits configured concurrency to three. The explorer, reviewer, fast-worker, and UI-auditor configurations define bounded ownership and read-only investigation. Future work should follow those roles, with the parent owning design integration and financial decisions.
- README references Next.js and absent `src/domain`, `src/hooks`, and `src/config` structures. Actual contracts are in `src/types/index.ts`; financial functions are in `src/engine`; orchestration is partly in the store and partly in components. Package scripts provide build/typecheck, not a financial regression suite.

### Live observations

Inspected `https://thenumber-phi.vercel.app/` in the in-app browser at requested CSS viewports 1440×1000, 820×1180, and 390×844. Production metadata matched `f4811b3`. Inspected dark overview/Rich-Broke-Dead, mobile input sheet, Cash Flows content, and light-theme composition. Other surfaces were source-audited; this is not exhaustive interaction, screen-reader, contrast, or performance certification.

| Observation | Consequence |
| --- | --- |
| At desktop width 1440, DOM viewport was 1440 but document scroll width was 1626; mobile/tablet screenshots also showed horizontal overflow and clipped content. | Fix sizing contracts throughout grids, chart wrappers, and navigation; hiding page overflow alone is not a fix. |
| At 820px neither the sidebar nor Edit Inputs button was visible. Source uses `lg` to show sidebar and `md` to hide the trigger/sheet. | Use one shared breakpoint policy; inputs must remain reachable at every width. |
| Mobile overview spends most of the first screen on a clipped verdict and tall asset block. | Put one outcome and the plan action first; shorten the asset summary radically. |
| Desktop sidebar reported $4.45M net worth while overview asset total was $5.35M for the same default plan. | Distinguish gross assets, liabilities, and net worth; do not silently modify arithmetic during styling. |
| Rich/Broke/Dead axis exposed `100.00000000000001%`; age labels and legends are dense. | Shared formatters and deliberate tick density are essential, not finishing polish. |
| Light theme retained dark-style heavy shadows and pale status/brand accents. | Light needs its own optical balance and semantic contrast, not a mechanical inversion. |
| Mobile input sheet close button had no accessible name in the tree; focus remained on the opening trigger. | Implement a proper modal lifecycle and verify keyboard/focus behavior. |

## 3. Visual system

### Themes and tokens

Ship two authored themes, **Graphite** (dark default) and **Porcelain** (light), with a System preference. Present a labeled selector in settings, accessible on mobile. Map legacy dark/graphite/midnight/sepia preferences to Graphite and light to Porcelain without touching saved financial inputs. Validate stored preferences. Set `color-scheme` to match the resolved theme; stop writing body styles from a theme hook.

CSS variables are the only source of color truth; Tailwind maps semantic utilities to them. Use RGB channel tokens where alpha utilities are needed, or explicit surface tokens; do not append opacity to arbitrary hex-valued `var()` utilities. Recharts consumes the same CSS variables through a small presentation adapter.

| Semantic token | Graphite | Porcelain | Purpose |
| --- | --- | --- | --- |
| `--canvas` | `#0D1117` | `#F2F4F7` | Flat page foundation |
| `--surface` | `#151B24` | `#FFFFFF` | Financial data and editor planes |
| `--surface-raised` | `#1C2532` | `#E9EEF5` | Menus, hover and selected context |
| `--surface-inset` | `#10161F` | `#F6F8FB` | Input wells and table headings |
| `--text` | `#EDF2F8` | `#172334` | Primary text and numbers |
| `--text-secondary` | `#B6C2D2` | `#46566C` | Supporting explanations |
| `--text-muted` | `#8C9BB0` | `#627187` | Metadata; never essential tiny text |
| `--line` | `#2B3747` | `#D7DEE8` | Sparse separators, not focus outlines |
| `--control-line` | `#66788F` | `#75859B` | Visible control boundaries |
| `--accent` / `--focus` | `#A9C7F6` | `#315E9C` | Selection, links, keyboard focus |
| `--positive` | `#85C7AE` | `#22684F` | Favorable financial outcome |
| `--caution` | `#DFC08A` | `#805A1C` | Caution, never generic decoration |
| `--negative` | `#E7A0A6` | `#A43E4A` | Depletion, invalid input, downside |
| `--neutral-series` | `#8796AC` | `#617189` | Context/reference data |

Primary buttons use accent fill and canvas-colored text. Secondary buttons use an opaque raised surface. A selected navigation item uses an accent tint plus text/shape, never color alone. Status tints use 10–14% semantic color over opaque surfaces. Verify actual composited combinations: normal text ≥4.5:1, large text ≥3:1, essential controls and graphical distinctions ≥3:1. These are starting tokens, not a claim of measured compliance for every composition.

### Type and geometry

Keep Inter with system fallbacks; prefer a locally bundled WOFF2 subset with `font-display: swap` during implementation. Do not add a decorative display family. Use tabular lining numerals for financial values and aligned tables; reserve monospace for formulas and model identifiers.

| Role | Desktop size/line height | Mobile size/line height | Weight |
| --- | --- | --- | --- |
| Main outcome amount | 48/52px | 36/40px | 600 |
| Page title | 28/34px | 24/30px | 600 |
| Section title | 20/28px | 20/28px | 600 |
| Body and inputs | 15/24px; inputs 16/24px | 16/24px | 400–500 |
| Labels/data rows | 14/20px | 14/20px | 500 |
| Axis/metadata | 12/18px minimum | 12/18px minimum | 400–500 |

Sentence case is default. Uppercase is limited to short 12px overlines, tracking ≤0.08em. Currency magnitude may be compact in headlines, but detailed inspection exposes exact values and units. Never communicate a fractional probability with inconsistent rounding across adjacent widgets.

Use spacing steps 4, 8, 12, 16, 24, 32, 48, 64px. Desktop page padding 32px, tablet 24px, phone 16px. Section gap 32px; related rows 12–16px. Input height 44px; interactive hit targets at least 44×44px. Radii: controls 10px, panels 16px, floating navigation/dialogs 20px, pills only for short statuses. Do not round every nested row into a card.

Surface hierarchy: canvas → one opaque work plane → inset controls → floating controls. Regular sections have no drop shadow; use spacing and a single divider. Raised overlays use dark `0 16px 48px rgb(0 0 0 / .28)` or light `0 12px 36px rgb(24 40 64 / .12)`. Avoid nested shadows. Borders define interaction and separation, not every container.

### Glass and motion

Glass belongs on the floating navigation shell, compact sticky plan toolbar, and overlay chrome only. Use an 88–94% opaque themed base, `backdrop-filter: blur(16px) saturate(110%)`, a 1px subtle highlight, and restrained shadow. Financial plots, tables, form fields, and tooltips remain opaque. No animated reflections, cursor-following lights, chromatic edges, teal glow, or full-page gradients.

At most two visible blurred regions; do not nest them. On narrow screens prefer an opaque bottom navigation surface; blur must not cover an entire scrolling editor. Provide solid fallbacks via `@supports`; forced-colors and an explicit reduced-transparency preference remove the effect. Measure scroll and overlay frames on a representative lower-powered phone before shipping; remove blur if it compromises responsiveness.

Motion tokens: press 100ms, hover/focus 140ms, disclosure 180ms, navigation 200ms, sheet 240ms. Standard easing `cubic-bezier(.2,.8,.2,1)`; exits `cubic-bezier(.4,0,1,1)`. Animate opacity and transforms (maximum 8px travel), not page-height max-height tricks or every CSS property. Never count financial values through fabricated intermediate amounts. Preserve previous results while updating, with an explicit stale label. Recharts entrance animation should be disabled on repeated updates and reduced motion; no bounce, autoplay or perpetual pulse. Under `prefers-reduced-motion`, remove travel and chart/number animation; retain immediate state and focus feedback.

## 4. Information architecture and representative layouts

Four primary destinations: **Overview · Plan · Explore · Report**. Education and appearance live in a utility menu; help links from individual concepts open relevant educational sections. Eliminate the ten-tab global strip. No additional router dependency is necessary: typed view keys with hash navigation can support Back/Forward and bookmarks. Hashes contain view/section identifiers only, never financial inputs.

### Desktop ≥1280px

Centered workspace, maximum width 1600px, floating 64px navigation bar with 16px outer margin. Wordmark left; four destinations center; model state and utility menu right. Main work area uses a 12-column grid with `minmax(0,1fr)` and `min-width:0` on all grid children. No permanent assumptions sidebar on Overview, Explore, or Report.

Overview: page title and “Edit plan” action; a single full-width outcome region; below it a wide wealth preview (8 columns) and a compact plan facts/asset ledger (4 columns). At 1440×1000, the primary outcome, edit action, and beginning of the chart must be visible without scrolling. Below: a short “Questions to explore” list linking to existing analysis, not a second bank of KPI cards.

Plan: 220px section navigation, flexible editor (ideal reading width 640px), 300px result summary where space allows. The summary is sticky, compact, and displays the same result version as Overview. Avoid three independent vertical scroll panes: page scroll for content, only overlays scroll independently. At widths below 1280, remove the side result column and show a compact status strip.

Explore: left section navigation on wide screens, one substantial analytical canvas, local controls above the plot and interpretation below. Group sections as Outcomes (wealth, life outcomes, buckets), Spending & income (spending, cash flow, withdrawals), Taxes, Scenarios & risk (comparison, stress, sensitivity), and Carry. Section navigation can show subitems; it is not another horizontal strip of ten tabs.

Report: readable 760–880px document column with plan context and model status; no dashboard preceding it. Education uses the same reading shell with a contents list and contextual back link.

### Tablet 768–1279px and phone <768px

Tablet uses the same four destinations in compact top navigation. Plan editor is full-width with a section selector; summary strip remains reachable. Any contextual assumptions action opens a right-hand sheet up to 480px wide, with one shared dialog implementation. There must be no width where neither Plan nor Edit plan is present.

Phone uses a 56px title bar and four labeled bottom destinations with safe-area padding. Outcome, target spend, planning horizon, and Edit plan precede the chart. Metrics become rows, not narrow card columns. Plan is a dedicated full-height editing view; contextual edit uses a full-height sheet, not the current 82vh panel crammed around a fixed asset footer. Bottom navigation hides behind modal content and cannot overlap controls or charts. Use `100dvh` and keyboard-aware scrolling.

Charts are 280px high on phones and 360–420px on desktop; reduce ticks rather than shrinking text. Tooltip details become a persistent inspector below the selected plot point. Comparison tables may scroll within a labeled region with a sticky scenario-name column; the page itself must never scroll sideways. All page/view changes move focus to the new heading; overlays restore focus to their opener.

## 5. Overview and financial language

The primary question is “Does this plan support my spending?” Present annual target spending as the dominant amount, with the modeled success rate alongside a plainly labeled planning horizon. Supporting sentence: “Simulated success rate for this plan through age {planningAge}.” Provide the current definition of success in accessible help. Do not imply a guarantee or relabel mortality-adjusted life-outcome bands as this probability.

Display the existing 85%-target sustainable-spending estimate as a secondary, explicitly labeled model estimate with annual/monthly units. Preserve its existing conversion from monthly output to annual display. Do not use the word “safe” as an unconditional promise. Its result can be pending independently of the main simulation. Existing 85%/70% verdict status thresholds remain unchanged until reviewed; do not invent a new financial risk scoring system.

Show success once. Make depletion probability available in the same outcome's details, not another equal-weight KPI card. Put median terminal wealth and p10–p90 context next to the wealth chart, with terminal age and dollar basis. Do not add an unrelated sparkline beneath probability values.

Replace the large bar-plus-donut asset display with one compact allocation bar and an aligned ledger. Until the accounting reconciliation milestone, label the existing gross total “Total assets”; show investable and illiquid assets separately and link to liabilities. A verified net-worth number must use an approved shared selector and be named consistently everywhere. Never subtract liabilities a second time from simulated investable assets just to reconcile the display.

State model run count, active plan, and result freshness in one quiet context line. Use idle/queued/running/current/invalid/failed states, with last valid results retained and labeled. During input errors, say “Results reflect the last valid plan”; link the error summary to the exact field. Do not render missing results as 0% or danger. The first-load skeleton reserves layout and announces loading once.

## 6. Plan and assumptions

Replace the monolithic accordion sidebar with these sections, preserving the current field contracts:

| Section | Existing capabilities to retain |
| --- | --- |
| Household & timing | Current/retirement/planning ages, spouse toggle and spouse timing |
| Assets & liabilities | Taxable, deferred, tax-free, cash, illiquid assets; mortgage balance/payment/term and capital calls |
| Income & saving | Both salaries and Social Security age/amount, other retirement income, pre-/after-tax savings |
| Spending & family | Go-go/slow-go/no-go amounts and durations, healthcare surge; college events and 529 savings |
| Taxes | Filing status, dependents, state rate; explanatory computed tax breakdown |
| Carry | Award identity, vintage, pool value, capture, vesting, GP commitment, add/edit/remove |
| Market & model | Return, volatility, inflation, simulation count/start-year behavior; expose only supported controls |

Retain supported presets and smart spending defaults, but preview changed fields before applying. Preserve stored units and integer/percentage bounds; converting visual percent to fractional storage happens in one established adapter. Distinguish annual/monthly amounts, nominal/today-dollar assumptions, and editable inputs from computed values next to the field. Keep the wealth chart's nominal/real display mode and its existing conversion semantics.

Make precise text entry primary; sliders are secondary exploration controls, shown for bounded intuitive values such as age, return, and volatility. Do not make a slider the only way to enter a large asset amount. Field labels remain visible, descriptions and errors use `aria-describedby`, and blur/Enter commits a valid parsed value. Preserve local incomplete typing until commit; do not reformat the caret away on each keystroke. Slider drag updates its visible value immediately and commits simulation input on release. Keyboard increments retain existing step semantics.

Use section summaries and contextual disclosure for advanced assumptions, not all controls expanded at once. Keep draft text in local UI state and valid committed `SimInputs` in Zustand; report pending/invalid state honestly. Do not add a separate financial model inside form components. Changes to update cadence must preserve existing validated payloads.

Move reset into plan actions. Confirm the scope with a changed-field preview and provide Undo using a captured input snapshot. Current persistence stores inputs only (`terminus-inputs-v2`); store scenarios are in memory and the visible comparison does not consume them. Label the active plan “Saved in this browser” only after a successful storage write; surface storage failure. A named saved-scenario manager is a future capability requiring a schema and restore/delete policy. If introduced, saved scenarios must survive plan reset unless explicitly selected for deletion. Hide the placeholder Share action until a complete sharing mechanism, scope preview, and privacy design exist. Export/import is future scoped work, not an invented existing capability.

## 7. Analytical system and screen transformations

Every analysis uses a common frame: question/title → one-line data definition → plot → legend/selected-point inspector → interpretation and method disclosure → accessible table. Headers expose units, time axis (age or calendar year), dollar basis, and provenance (simulation percentile, deterministic projection, or comparative quick run). Do not claim a basis that has not been traced to the source.

Use no vertical grid lines by default, four or five horizontal ticks, 2px primary strokes, 1px reference strokes, a visible zero baseline when relevant, and unclipped margins for negative/long labels. Age ticks target 6–8 on desktop and 4–5 on mobile. Currency formatting uses shared compact formatters; exact currency is available in the inspector. Percent ticks must never expose floating-point artifacts.

Tooltips are opaque, 14px text, bounded inside the viewport, with age/year title, sorted labeled rows, swatches, exact values, and units. Mouse, focusable age selection, keyboard previous/next controls, and touch tap must reach equivalent information; hover alone is insufficient. Provide a labeled data table rather than attempting hundreds of focusable SVG points. Charts with repeated series use stable semantic IDs, never array-position meanings.

Series palette: primary wealth `accent`; uncertainty bands use the same hue at 10%/20% opacity on an opaque plot. Use dash patterns and explicit labels for scenario series. Supporting categorical colors: dark blue `#89AEE3`, lavender `#B4A4D6`, ochre `#CDB481`, slate `#8796AC`; light equivalents `#3D6399`, `#725C97`, `#826527`, `#617189`. Color identity remains stable across views. Negative cash flow uses sign and pattern in addition to color.

| Surface / current source | Decisive transformation | Preservation and acceptance |
| --- | --- | --- |
| `RichBrokeDeadChart` | Rename navigation “Life outcomes”; keep “Rich/Broke/Dead” in method disclosure. Full-width 100% stack; neutral mortality band; selected-age breakdown as labeled rows. | Preserve all six bands, thresholds, mortality adjustment and denominators. Broke uses negative, struggling caution, surviving neutral, thriving muted blue, flourishing muted green, dead gray with pattern. Explain mortality separately from financial depletion. Every age totals as the source defines; formatting does not change values. |
| `WealthFanChart` | Flagship Overview preview and expanded Outcomes view. Bold median; layered p10–p90/p25–p75 bands, retirement/SS annotations, terminal range inspector. | Preserve available percentile curves and any existing display modes. Show that percentiles are distribution summaries, not individual predicted lives. Verify band geometry rather than assuming overlapping area fills are correct. |
| `SpendingSmileChart` | Align phase bands, planned spending and healthcare annotations; link directly to Spending & family. | Preserve phase durations, inflation and healthcare behavior. Explain annual and dollar basis. No decorative smoothing across step changes. |
| `ScenarioCompareChart` | A comparable outcome table above selected series; changed retirement ages and carry inclusion inspectable. Generate rendering from scenario IDs. | Preserve the actual fixed age-52/55/58 comparison and no-carry toggle initially. The store's separate Scenario contract is not a shipped saved-scenario manager. Editable ages/named scenarios are a later scoped extension with validation and persistence decisions. Test fewer/more series at the presentation-contract level; never invent baseline-relative certainty while runs are unseeded. |
| `StressTestChart` and active chart `SensitivityTornadoChart` | One Risk group with local Stress/Sensitivity switch; horizontal ranked comparisons with baseline reference and measured delta. | Keep stress definitions and sensitivity perturbations. Distinguish percentage-point changes from relative percent. Label quick-run path counts and noise limits. Do not silently pick the similarly named legacy layout component. |
| `TaxBreakdownPanel` / `TaxDragTimelineChart` | Tax ledger first (gross, deductions, tax components, effective/marginal context); timeline beneath, method drawer for assumptions. | Retain existing tax outputs and provenance. Explain deterministic illustrative timelines where applicable; do not imply every plotted value comes from Monte Carlo paths. |
| `RetirementIncomeWaterfallChart` | Label “Cash flow sources”; full-width stacked bars with obligations line and selected-year source/outflow ledger. | Preserve pre-retirement salary net of tax/savings, SS, carry, other income, portfolio draw, and total outflows. Despite source filename, do not describe a stacked bar chart as a waterfall. |
| `WithdrawalRateChart` | Coordinated age inspector and restrained reference lines; explicit percentile legend. | Preserve formulas/series pending correctness review. Label 4/6/8% lines as reference thresholds, not guarantees; do not change meaning through reversed percentile labels. |
| `BucketDepletionChart` | Tax-bucket trajectories with inline last-positive/first-zero information when supported, plus balances table. | Preserve bucket order and actual derivation; do not invent cash-flow transactions from percentile estimates. Show unavailable values honestly. |
| `CarryAwardsChart` | Award ledger with aligned vintage/distribution timeline; commitment outflows distinct from distributions. Empty state links to Add award. | Preserve award IDs, capture, vesting, GP commitments, taxation assumptions and curve timing. Do not present uncertain awards as guaranteed wealth. |
| `ExecutiveSummary` | Report with one verdict, compact plan ledger, comparisons, then readable sections. Print styles remove navigation and preserve units/legend. | Preserve existing analytical capabilities; qualify comparative sample counts. Audit hardcoded tax/SS/advice narrative in reliability phase before presenting it as personalized guidance. |
| `InfoPage` | Model guide with contents, 65–75-character reading measure, searchable-by-browser headings and contextual anchors. | Preserve educational topics/formulas/limitations; reconcile claims to implementation separately. Explain uncertainty at the point of use. |

Do not use animations, hiding, or a polished chart to conceal invalid values. Empty, zero, negative, missing, pending, and failed data are distinct states. Plots and tables must reflect the same dataset.

## 8. Component and state architecture

Evolve the existing folders incrementally, keeping imports reversible per milestone:

- `src/lib/theme.ts` + `src/index.css`: semantic tokens, resolved theme, migration, type/spacing/motion contracts. Remove legacy overrides only when the corresponding view has migrated.
- `components/ui`: evolve Button, Input, Slider, Switch, Tabs, Accordion, Tooltip; add Field, Status, Menu, Dialog/Sheet and consistent focus behavior. Reuse Radix patterns; add an accessible dialog primitive if necessary, not an entire new component framework.
- `components/layout`: AppShell, PrimaryNav, PageHeader, PlanSectionNav, ResponsiveEditor, ModelStatus. MainPanel becomes destination composition rather than a giant persistent dashboard wrapper.
- `components/dashboard`: OutcomeSummary, MetricRow, AssetLedger, PlanFacts; pure rendering from typed values. Retire duplicate StatCard sparklines and the redundant allocation donut.
- `components/charts/shared`: ChartFrame, ChartTooltip, ChartLegend, AgeInspector, ChartDataTable, annotation and formatting helpers. Keep domain-specific series adapters next to each chart; avoid one over-configured universal chart component.
- `components/inputs`: field groups reuse existing parsing, presets and validation. Split Sidebar by domain without copying financial formulas.
- Store boundaries: financial inputs/results/scenarios remain separate from transient view, selected age, sheet state and draft input text. Use narrow Zustand selectors. New result metadata should identify the committed input revision and status; no stale result may be presented as computed from a newer draft.

During visual phases, components may wrap existing computations unchanged. Do not centralize or “optimize” financial calls while also changing their mathematical behavior. In the reliability phase, create a shared computation coordinator and typed derived-result service, then move expensive work to a worker with revision-based stale-result rejection. Seed/caching/version policy and deterministic fixtures must precede reuse of computed results. Timers alone do not make synchronous work non-blocking.

Only the active analysis should mount expensive derived analyses. Reuse already available base results for visual previews; do not run a second simulation for an Overview chart. Audit unused duplicate `layout/SensitivityTornadoChart.tsx` and multiple preset files before deleting or merging them.

## 9. Implementation acceptance contract

1. **Visual:** both themes follow the token table; no teal brand gradient, nested generic cards, repeated headline KPIs, global `transition: all`, or hardcoded tooltip theme. One obvious primary action per screen; plots have opaque backgrounds.
2. **Navigation:** all current analysis capabilities map to the destinations above; Overview, Plan, Explore, Report and Model guide work with keyboard and browser history. Education/report no longer require scrolling past the dashboard.
3. **Responsive:** test 390×844, 820×1180, 1024×768, 1440×1000 and 1920×1080, plus a 320px layout and 200% zoom. No page overflow; inputs are accessible across 767/768, 1023/1024 and 1279/1280 boundaries. No obscured controls with safe areas or virtual keyboard.
4. **Accessibility:** visible focus, named icon buttons, logical headings, skip link, modal focus trap/Escape/return, keyboard-operable inputs and chart inspection, polite status announcements, contrast checks, reduced-motion and solid-material fallback. Validate with keyboard and a screen reader, not screenshots alone.
5. **Financial isolation:** compare the same captured result fixtures before/after visual changes, including spouse on/off, zero assets, debt, empty/multiple awards, college events, and extreme valid inputs. Engine outputs and committed input payloads remain unchanged. Fresh stochastic reruns are not proof of equality.
6. **Interaction/performance:** measure on a documented device/browser. Target <100ms visible input feedback, no new main-thread tasks >50ms caused by presentation work, and p75 INP ≤200ms when real field measurements exist. Report baseline versus change; never claim measured smoothness from source inspection. Worker/reproducibility changes require separate correctness validation.
7. **Delivery:** update PROGRESS with evidence, unresolved risks, and the next bounded task. Run build/typecheck for executable changes; use proportionate fixture/interaction tests. Documentation-only changes need diff/link review, not a new test suite or manual production deployment.

## 10. Preserve / replace / eliminate

**Preserve:** complete private-wealth input coverage, spouse/family planning, tax buckets, carry and commitments, Monte Carlo distributions, stress/scenario exploration, educational depth, React/Vite/Zustand/Recharts architecture, established parsing/formatting contracts.

**Replace:** permanent modeling sidebar with a dedicated Plan workspace and contextual editor; ten global tabs with task-oriented destinations; rainbow allocation and chart styling with semantic series; five inconsistent themes with two complete themes; tiny labels with a readable typographic scale; long dashboard preamble with a focused outcome and flagship plot.

**Eliminate:** duplicate success/ruin/terminal cards, redundant asset donut, always-live badge without freshness meaning, placeholder sharing, unconfirmed global reset, page-level horizontal scrolling, universal transitions, repeated CSS patches, and decorative financial sparklines with mismatched meanings.
