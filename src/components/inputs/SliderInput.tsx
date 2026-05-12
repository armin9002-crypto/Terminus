import React, { useState, useRef, useEffect } from "react";
import { Slider } from "../../components/ui/slider"; 
import { formatCompactCurrency, formatPercentage } from "../../lib/formatters";
import { useSimStore } from "../../store/useSimStore";
import { cn } from "../../lib/utils";

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

export function SliderInput({ label, value, min, max, step, onChange, format = "number", error }: SliderInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [impact, setImpact] = useState<{ delta: number; visible: boolean }>({ delta: 0, visible: false });
  const results = useSimStore(state => state.results);
  const prevSuccessRef = useRef(results?.successRate ?? 0);
  
  const percentage = ((value - min) / (max - min)) * 100;

  useEffect(() => {
    const currentSuccess = results?.successRate ?? 0;
    if (Math.abs(currentSuccess - prevSuccessRef.current) > 0.001) {
      setImpact({ delta: currentSuccess - prevSuccessRef.current, visible: true });
      prevSuccessRef.current = currentSuccess;
      const timer = setTimeout(() => setImpact(prev => ({ ...prev, visible: false })), 3000);
      return () => clearTimeout(timer);
    }
  }, [results?.successRate]);

  const formattedValue = (val: number) => {
    if (format === "currency") return formatCompactCurrency(val);
    if (format === "percent") return formatPercentage(val, 1);
    return val.toLocaleString();
  };

  return (
    <div className="grid gap-0.5 py-0.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--text-muted)]">
            {label}
          </span>
          {impact.visible && (
            <span className={cn(
              "text-[9px] font-bold",
              impact.delta > 0 
                ? "text-[var(--success)]" 
                : "text-[var(--danger)]"
            )}>
              {impact.delta > 0 ? "(+)" : "(-)"} 
              {Math.abs(impact.delta * 100).toFixed(1)}%
            </span>
          )}
        </div>
        <input 
          type="text"
          value={
            format === "currency" 
              ? `$${value.toLocaleString()}` 
              : format === "percent" 
                ? (value * 100).toFixed(2)
                : String(value)
          }
          onChange={(e) => {
            const raw = Number(
              e.target.value.replace(/[^0-9.-]+/g, "")
            );
            if (format === "percent") onChange(raw / 100);
            else onChange(raw);
          }}
          onFocus={(e) => e.target.select()}
          className="w-20 bg-transparent text-right font-mono text-[13px] font-medium text-[var(--accent)] outline-none rounded px-1"
        />
      </div>

      <div 
        className="relative"
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onTouchStart={() => setIsDragging(true)}
        onTouchEnd={() => setIsDragging(false)}
      >
        {isDragging && (
          <div 
            className="absolute -top-6 z-20 -translate-x-1/2 rounded bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-bold text-white shadow-lg"
            style={{ left: `${percentage}%` }}
          >
            {formattedValue(value)}
            <div className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-[var(--accent)]" />
          </div>
        )}
        
        <Slider 
          value={[value]} 
          min={min} 
          max={max} 
          step={step} 
          onValueChange={([next]) => onChange(next ?? value)}
          className="relative flex items-center select-none touch-none w-full h-4"
        />
      </div>

      {error && (
        <p className="text-[10px] text-[var(--danger)]">{error}</p>
      )}
    </div>
  );
}
