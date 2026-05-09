import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { formatCompactCurrency } from "@/lib/formatters";

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format?: "currency" | "percent" | "number";
  suffix?: string;
  error?: string;
}

function formatValue(value: number, format: SliderInputProps["format"], suffix?: string) {
  if (format === "currency") return formatCompactCurrency(value);
  if (format === "percent") return `${(value * 100).toFixed(1)}%`;
  return `${value.toLocaleString()}${suffix ? ` ${suffix}` : ""}`;
}

export function SliderInput({ label, value, min, max, step, onChange, format = "number", suffix, error }: SliderInputProps) {
  const sliderValue = Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-mutedText">{label}</span>
        <span className="text-xs font-semibold text-teal-200">{formatValue(value, format, suffix)}</span>
      </div>
      <Slider value={[sliderValue]} min={min} max={max} step={step} onValueChange={([next]) => onChange(next ?? value)} />
      <Input type="number" value={Number.isFinite(value) ? value : 0} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} />
      {error ? <p className="text-xs font-medium text-danger">{error}</p> : null}
    </div>
  );
}
