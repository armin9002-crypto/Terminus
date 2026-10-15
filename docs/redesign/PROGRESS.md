# Terminus 2.0 — implementation progress

Updated: October 14, 2026 (America/Chicago). Design authority: [VISION.md](VISION.md). This file is durable handoff memory, not an assertion that the redesign is implemented.

## Current baseline

- Audit/source baseline: `f4811b3`, clean `main` at start. Production `thenumber-phi.vercel.app` matched that SHA through Vercel metadata. Existing Git integration builds `main`; do not manually redeploy documentation.
- Runtime: React 18 / Vite 6 / TypeScript / Tailwind 3 / Zustand 5 / Recharts 2 / Radix. `npm run typecheck` and `npm run build` exist; no automated model regression script. README framework/directory claims are stale.
- Completed here: source/history/agent-configuration audit, representative production browser audit, authoritative design specification and staged roadmap. No source, model, dependency or runtime configuration changes.
- Live coverage: dark Overview/Rich-Broke-Dead at desktop 1440×1000, tablet 820×1180, phone 390×844; mobile editor opened; Cash Flows content and light composition inspected. Desktop DOM width 1626 exceeded viewport 1440. Tablet lacked both sidebar and input trigger. Other analyses were source-reviewed. No exhaustive accessibility, device-performance, all-chart interaction or financial correctness certification.
- Repository guidance: root AGENTS.md and `.codex/agents/*`; configured concurrency three. Parent owns integration/financial decisions; bounded independent audits only. Do not consume `code-dump.txt` as runtime truth.

## Locked design decisions

- Customer brand remains **the Number**. Graphite and Porcelain plus System replace five theme variants.
- Primary destinations: Overview, Plan, Explore, Report; contextual Model guide. No permanent sidebar outside Plan; no ten-tab global strip.
- One outcome region and flagship wealth plot replace repeated metric cards. Opaque financial surfaces; selective glass navigation/overlay chrome.
- Preserve model semantics throughout visual milestones. Label existing gross asset totals accurately; reconcile net worth in the dedicated financial milestone.
- Responsive access, keyboard support and reduced motion are built in from milestone 1; milestone 5 is final cross-product verification, not the start of accessibility work.

## Milestones

| ID / status | Scope and dependencies | Completion evidence |
| --- | --- | --- |
| 0 — complete | Audit and blueprint; VISION + this roadmap. | Source and representative live findings separated; all major capabilities mapped; docs reviewed and delivered through Git. Delivery SHA/status belongs in the chat/Git history, avoiding self-referential commit edits. |
| 1 — not started | Foundation, shell, Overview and Plan. First capture stable presentation fixtures; introduce semantic tokens/primitives and theme migration. Then four destinations, compact outcome/asset ledger and decomposed input sections. Preserve existing analysis reachability until moved. | Both themes; no engine/formula changes; all existing fields/presets accessible; old/new committed payloads match; fixture rendering agrees; tablet gap/overflow fixed; validation/reset/empty/loading behavior verified; typecheck/build and keyboard/viewport evidence. |
| 2 — not started | Shared chart frame, legend, tooltip, inspector, table and annotations; WealthFan and Life outcomes first. Depends on milestone 1 tokens/layout. | Percentile/band datasets unchanged; shared currency/percent formatting; mortality versus financial denominators explicit; touch/keyboard inspector; dark/light + narrow/wide screenshots; no floating-point axis labels. |
| 3 — not started | Spending, scenario comparison, stress/sensitivity, taxes, cash flow, withdrawals, buckets, carry; Report and Model guide. Depends on chart primitives. | Every VISION surface mapped; scenario series generated from IDs; empty/one/many cases; units/provenance documented; report readable/printable; unused duplicates audited before removal. |
| 4 — not started | Financial correctness, reproducibility, computation efficiency and reliability. First specify invariants/fixtures, then seeded runs and validated derived data, then worker/cache orchestration. | Reviewed accounting and probability semantics; deterministic regression suite and tolerance policy; repeatable scenarios; result-version/stale-job tests; responsiveness measured; narrative claims reconciled with actual model. No visual-only PR silently fixes finance. |
| 5 — not started | Full responsive, interaction, accessibility and visual QA. Depends on complete surfaces and validated computations. | All viewport/zoom/theme states in VISION; screen-reader/keyboard pass; contrast and reduced-motion checks; overflow checks; representative device performance recorded; production smoke check on shipped SHA. |

Milestones can ship in bounded slices. Do not hold a known input-access fix until milestone 5. Conversely, do not ship new financial assertions from milestone 4 as incidental copy edits in milestone 1.

## Issue register and investigation gates

| ID | Evidence / unresolved issue | Assigned phase and gate |
| --- | --- | --- |
| F1 | `monteCarlo.ts` uses unseeded randomness; repeated comparisons can differ. | 4: inject RNG with versioned seed policy; fixture seed/input/run-count together; investigate shared random streams for fair comparisons. Statistical distribution checks complement fixed-seed regressions. |
| F2 | `NetWorthSnapshot` sums gross assets under net-worth heading; Sidebar subtracts mortgage. Live defaults showed $5.35M versus $4.45M. | 1: label gross total as assets without changing it. 4: define shared balance-sheet selector and liability inclusion; reconcile all surfaces without double-counting obligations. |
| F3 | `HeroVerdict` and `ExecutiveSummary` separately invoke sustainable-spend solving; summary, stress and sensitivity trigger additional synchronous simulations. `applySmartSpendingDefaults` runs the solver on click; ScenarioCompareChart runs it plus a simulation for each fixed case. Store timer scheduling does not move work off-thread. | 1–3: avoid additional mounts/runs and show truthful pending state. 4: profile, centralize, workerize, cancel stale jobs and cache only against complete inputs/seed/model version. Validate results before and after. |
| F4 | ScenarioCompareChart hardcodes retirement ages 52/55/58 and positional series; it does not use the store Scenario array. | 3: data-driven series/legend and comparison table while preserving fixed comparisons and no-carry toggle; test zero/one/three/more series in presentation fixtures. Editable/named scenarios require separate validated behavior. |
| U1 | AppShell `lg` sidebar / `md` trigger mismatch; global tab row and intrinsic sizing overflow. | 1: shared breakpoints, `min-width:0`, local bounded overflow only; verify boundaries and mobile keyboard. |
| U2 | Share displays “coming soon”; reset acts directly. Only inputs persist under `terminus-inputs-v2`; store scenarios are in-memory, separate from the visible fixed comparison. Storage errors are swallowed. | 1: remove placeholder share; truthful local-storage status and reset scope/undo. 3/4: persistence schema/error recovery review and explicit decision on named scenarios. Real share/export is separately scoped, not presumed backend work. |
| Q1 | No financial regression script; some correctness fixes exist in recent history. | Capture fixed rendering fixtures in 1; 4 adds engine invariants for depletion/success, tax boundaries, bucket draw order, spouse/SS timing, inflation/spending, carry/GP timing, debt and college offsets. Define expected outputs with reviewed examples. |
| U3 | Hardcoded chart colors/tooltips, global transitions, duplicate CSS/theme ownership, 10px labels. | 1 tokens/primitives; 2–3 chart migration; 5 measured contrast/motion review. No blanket search-and-replace over financial series. |
| A1 | Oversized Sidebar, mixed computation/rendering; duplicate sensitivity and preset files; README describes absent architecture. | 1 split forms and document real contracts; 3 audit duplicate callers; 4 derived-data ownership; update README only in a scoped follow-up. |
| F5 | Several timeline/bucket/withdrawal views derive projections independently; ExecutiveSummary includes hardcoded financial narrative and approximate comparisons. | 3 expose actual provenance. 4 audit dimensional units, percentile mappings, taxes, mortality, terminal values and narrative claims; do not assume all charts use simulation paths or all copy is valid advice. |

## Next recommended task

**Implement milestone 1A: tokens, primitives, responsive shell and navigation.** Read AppShell/MainPanel, theme files, existing UI primitives and relevant store contracts. Capture current result fixtures for visual use without changing RNG. Add the four destinations and stable theme selection/migration; keep existing analyses reachable inside Explore. Fix container shrink behavior and the tablet input-access gap. Keep the engine untouched. Finish with both-theme screenshots at 390/820/1440 widths, keyboard navigation, typecheck/build and an exact scoped diff.

Then milestone 1B replaces the repeated dashboard with OutcomeSummary/AssetLedger and the wealth preview; 1C decomposes Sidebar into Plan sections with precision entry, error linking and reset/undo. Do not combine the entire chart rewrite or worker migration into 1A.

## Handoff protocol

After each slice, update milestone status, changed paths, evidence, unresolved issues and next task in this file. Record actual commands and browser states, not aspirational passes. Use captured results to validate presentation because unseeded reruns cannot prove numerical equivalence. Commit only owned changes, push through the existing authorized workflow, inspect automatic deployment for that SHA and smoke-check production when shipped. No broad suite is needed for this documentation-only baseline.
