import { create } from "zustand";
import { DEFAULT_INPUTS } from "@/lib/constants";
import { runSimulation } from "@/engine/monteCarlo";
import type { LumpyEvent, Scenario, SimInputs, SimResults } from "@/types";

interface SimStore {
  inputs: SimInputs;
  results: SimResults | null;
  scenarios: Scenario[];
  isRunning: boolean;
  setInput: <K extends keyof SimInputs>(key: K, value: SimInputs[K]) => void;
  setInputs: (inputs: Partial<SimInputs>) => void;
  runSimulation: () => void;
  addScenario: (scenario: Scenario) => void;
  addLumpyEvent: (event: LumpyEvent) => void;
  removeLumpyEvent: (id: string) => void;
}

let debounceTimer: number | null = null;

function scheduleRun(get: () => SimStore, set: (partial: Partial<SimStore>) => void) {
  set({ isRunning: true });

  if (debounceTimer) {
    window.clearTimeout(debounceTimer);
  }

  debounceTimer = window.setTimeout(() => {
    const results = runSimulation(get().inputs);
    set({ results, isRunning: false });
  }, 400);
}

export const useSimStore = create<SimStore>((set, get) => ({
  inputs: DEFAULT_INPUTS,
  results: runSimulation(DEFAULT_INPUTS),
  scenarios: [],
  isRunning: false,
  setInput: (key, value) => {
    set((state) => ({
      inputs: {
        ...state.inputs,
        [key]: value,
      },
    }));
    scheduleRun(get, set);
  },
  setInputs: (nextInputs) => {
    set((state) => ({
      inputs: {
        ...state.inputs,
        ...nextInputs,
      },
    }));
    scheduleRun(get, set);
  },
  runSimulation: () => {
    set({ isRunning: true });
    const results = runSimulation(get().inputs);
    set({ results, isRunning: false });
  },
  addScenario: (scenario) => {
    set((state) => ({
      scenarios: [...state.scenarios, scenario],
    }));
  },
  addLumpyEvent: (event) => {
    set((state) => ({
      inputs: {
        ...state.inputs,
        lumpyEvents: [...state.inputs.lumpyEvents, event],
      },
    }));
    scheduleRun(get, set);
  },
  removeLumpyEvent: (id) => {
    set((state) => ({
      inputs: {
        ...state.inputs,
        lumpyEvents: state.inputs.lumpyEvents.filter((event) => event.id !== id),
      },
    }));
    scheduleRun(get, set);
  },
}));
