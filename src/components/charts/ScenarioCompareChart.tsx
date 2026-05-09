import { GitCompare } from "lucide-react";

export function ScenarioCompareChart() {
  return (
    <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-dashed border-border bg-[#111827] p-8 text-center">
      <div>
        <GitCompare className="mx-auto text-teal-200" size={34} />
        <h3 className="mt-4 text-lg font-semibold text-primaryText">Scenario comparison arrives in Phase 2</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-mutedText">
          The scenario runner is already isolated in the engine layer so named cases can be layered onto this view cleanly.
        </p>
      </div>
    </div>
  );
}
