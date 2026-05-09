import { SliderInput } from "./SliderInput";

interface CurrencyInputProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}

export function CurrencyInput({
  label,
  value,
  min = 0,
  max = 10_000_000,
  step = 25_000,
  onChange,
}: CurrencyInputProps) {
  return <SliderInput label={label} value={value} min={min} max={max} step={step} onChange={onChange} format="currency" />;
}
