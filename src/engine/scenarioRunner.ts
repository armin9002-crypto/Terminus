import type { Scenario, SimInputs } from "@/types";
import { runSimulation } from "./monteCarlo";

export function runScenarios(baseInputs: SimInputs, scenarios: Scenario[]): Scenario[] {
  return scenarios.map((scenario) => {
    const inputs = { ...baseInputs, ...scenario.inputs };
    return {
      ...scenario,
      results: runSimulation(inputs),
    };
  });
}
