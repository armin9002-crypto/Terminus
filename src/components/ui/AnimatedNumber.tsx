import React, { useEffect, useRef, useState } from 'react';
import { formatCompactCurrency, formatPercentage, formatMillions } from '../../lib/formatters';

interface AnimatedNumberProps {
  value: number;
  format: 'currency' | 'percent' | 'millions';
  duration?: number;
  className?: string;
}

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

export const AnimatedNumber = React.memo(({ 
  value, 
  format, 
  duration = 600, 
  className 
}: AnimatedNumberProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);
  const startTimeRef = useRef<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (prevValueRef.current === value) return;
    
    const startValue = prevValueRef.current;
    setIsAnimating(true);
    startTimeRef.current = null;

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) startTimeRef.current = currentTime;
      const progress = Math.min((currentTime - startTimeRef.current) / duration, 1);
      const easedProgress = easeOutQuart(progress);
      
      const currentVal = startValue + (value - startValue) * easedProgress;
      setDisplayValue(currentVal);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        prevValueRef.current = value;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  const formatted = () => {
    if (!Number.isFinite(displayValue)) return '—';
    switch (format) {
      case 'currency':
        return formatCompactCurrency(displayValue);
      case 'percent':
        return formatPercentage(displayValue, 1);
      case 'millions':
        return formatMillions(displayValue);
      default:
        return displayValue.toLocaleString();
    }
  };

  return (
    <span 
      className={`${className} tabular-nums transition-colors duration-300 ${
        isAnimating ? 'text-[var(--accent)]' : ''
      }`}
      style={{
        textShadow: isAnimating ? '0 0 8px var(--accent-glow)' : 'none'
      }}
    >
      {formatted()}
    </span>
  );
});

AnimatedNumber.displayName = 'AnimatedNumber';