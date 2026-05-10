import { formatPercentage } from "../../lib/formatters";
import { cn } from "../../lib/utils";

interface ProbabilityGaugeProps {
  value: number;
}

export function ProbabilityGauge({ value }: ProbabilityGaugeProps) {
  const tone = value > 0.85 ? "text-success" : value >= 0.7 ? "text-warning" : "text-danger";
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value);

  return (
    <div className="grid place-items-center">
      <div className="relative size-36">
        <svg viewBox="0 0 120 120" className="-rotate-90">
          <circle cx="60" cy="60" r={radius} stroke="#2d3748" strokeWidth="10" fill="none" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="currentColor"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn("transition-all duration-500", tone)}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className={cn("text-2xl font-bold", tone)}>{formatPercentage(value, 0)}</p>
            <p className="text-xs text-mutedText">success</p>
          </div>
        </div>
      </div>
    </div>
  );
}
