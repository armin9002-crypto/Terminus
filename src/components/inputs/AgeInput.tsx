import { SliderInput } from "./SliderInput";

interface AgeInputProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  error?: string;
}

export function AgeInput({ label, value, min = 18, max = 105, onChange, error }: AgeInputProps) {
  return <SliderInput label={label} value={value} min={min} max={max} step={1} onChange={onChange} suffix="yrs" error={error} />;
}
