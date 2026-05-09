# Monte Carlo Wealth Lab

Premium retirement and net-worth simulation platform built with Next.js, React, TypeScript, TailwindCSS, Zustand, and Recharts.

## Architecture

- `src/domain` contains framework-independent financial models and result contracts.
- `src/engine` contains the pure TypeScript Monte Carlo engine and utilities. It does not import React, Next.js, or Zustand.
- `src/store` manages editable scenario state with Zustand.
- `src/hooks` bridges UI state to derived simulation results.
- `src/components` contains layout, dashboard, chart, and shadcn-style UI primitives.
- `src/config` contains default assumptions and starter scenarios.
- `src/scenarios` is reserved for scenario comparison, persistence, and templates.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validate

```bash
npm run typecheck
npm run build
```

## Extending the simulation engine

Keep financial logic inside `src/engine` and contracts inside `src/domain`. React components should receive results and render them. Future modules can add tax buckets, dual-spouse cash flows, private equity carry, lumpy events, real estate, stress testing, glide paths, and estate planning without coupling those calculations to the dashboard.

## Adding scenarios

Create or load a `Scenario` object that conforms to `src/domain/models.ts`, then pass its config into `runMonteCarloSimulation`. The current Zustand store starts with one active scenario and can be expanded into saved scenarios or side-by-side comparisons.
