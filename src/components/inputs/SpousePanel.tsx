import { AgeInput } from "./AgeInput";
import { CurrencyInput } from "./CurrencyInput";

interface SpousePanelProps {
  hasSpouse: boolean;
  spouseCurrentAge: number;
  spouseRetirementAge: number;
  spousePlanningAge: number;
  spouseAnnualSalary: number;
  onChange: (key: "spouseCurrentAge" | "spouseRetirementAge" | "spousePlanningAge" | "spouseAnnualSalary", value: number) => void;
}

export function SpousePanel({
  hasSpouse,
  spouseCurrentAge,
  spouseRetirementAge,
  spousePlanningAge,
  spouseAnnualSalary,
  onChange,
}: SpousePanelProps) {
  if (!hasSpouse) {
    return <p className="rounded-md border border-border bg-white/[0.03] p-3 text-sm text-mutedText">Spouse modeling is disabled.</p>;
  }

  return (
    <div className="grid gap-4">
      <AgeInput label="Spouse current age" value={spouseCurrentAge} onChange={(value) => onChange("spouseCurrentAge", value)} />
      <AgeInput
        label="Spouse retirement age"
        value={spouseRetirementAge}
        onChange={(value) => onChange("spouseRetirementAge", value)}
      />
      <AgeInput label="Spouse planning age" value={spousePlanningAge} onChange={(value) => onChange("spousePlanningAge", value)} />
      <CurrencyInput
        label="Spouse salary"
        value={spouseAnnualSalary}
        max={1_500_000}
        step={10_000}
        onChange={(value) => onChange("spouseAnnualSalary", value)}
      />
    </div>
  );
}
