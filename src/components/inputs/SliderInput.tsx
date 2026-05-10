import React, { useState, useRef, useEffect } from "react";
import { Slider } from "@/components/ui/slider"; 
import { formatCompactCurrency, formatPercentage } from "@/lib/formatters";
import { useSimStore } from "@/store/useSimStore";
import { cn } from "@/lib/utils";

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
    <div className="grid gap-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">{label}</span>
          {impact.visible && (
            <span className={cn(
              "text-[10px] font-bold transition-opacity duration-500",
              impact.delta > 0 ? "text-[var(--success)]" : "text-[var(--danger)]"
            )}>
              {impact.delta > 0 ? "↑" : "↓"} {Math.abs(impact.delta * 100).toFixed(1)}%
            </span>
          )}
        </div>
        <input 
          type="text"
          value={format === "currency" ? `$${value.toLocaleString()}` : value}
          onChange={(e) => onChange(Number(e.target.value.replace(/[^0-9.-]+/g, "")))}
          onFocus={(e) => e.target.select()}
          className="w-24 bg-transparent text-right font-mono text-[15px] font-medium text-[var(--accent)] outline-none focus:shadow-[0_0_0_2px_var(--accent-glow)] rounded px-1"
        />
      </div>

      <div 
        className="relative pt-6 pb-2"
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onTouchStart={() => setIsDragging(true)}
        onTouchEnd={() => setIsDragging(false)}
      >
        {isDragging && (
          <div 
            className="absolute -top-2 z-20 -translate-x-1/2 rounded bg-[var(--accent)] px-2 py-1 text-[11px] font-bold text-white shadow-lg transition-opacity duration-150"
            style={{ left: `${percentage}%` }}
          >
            {formattedValue(value)}
            <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-[var(--accent)]" />
          </div>
        )}
        
        <Slider 
          value={[value]} 
          min={min} 
          max={max} 
          step={step} 
          onValueChange={([next]) => onChange(next ?? value)}
          className="relative flex items-center select-none touch-none w-full h-5"
          style={{
            background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${percentage}%, var(--border) ${percentage}%, var(--border) 100%)`,
            borderRadius: '999px',
            height: '4px'
          }}
        />

        <div className="mt-4 flex justify-between px-1 text-[10px] font-medium text-[var(--text-muted)]">
          <span>{formattedValue(min)}</span>
          <span>{formattedValue((min + max) / 2)}</span>
          <span>{formattedValue(max)}</span>
        </div>
      </div>

      {error && <p className="text-xs font-medium text-[var(--danger)]">{error}</p>}
      <style jsx global>{`
        .SliderThumb {
          width: 18px; height: 18px;
          background: var(--accent);
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}
