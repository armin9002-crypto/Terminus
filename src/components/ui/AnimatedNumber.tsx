import React from 'react';
import { formatCompactCurrency, formatPercentage, formatMillions } from '../../lib/formatters';

interface AnimatedNumberProps {
  value: number;
  format: 'currency' | 'percent' | 'millions';
  duration?: number;
  className?: string;
}

// Keep the existing public component contract. Financial values update exactly,
// without fabricated intermediate amounts or a requestAnimationFrame loop.
export const AnimatedNumber = React.memo(({ value, format, className }: AnimatedNumberProps) => {
  const formatted = !Number.isFinite(value) ? '--'
    : format === 'currency' ? formatCompactCurrency(value)
    : format === 'percent' ? formatPercentage(value, 1)
    : formatMillions(value);
  return <span className={`${className ?? ''} tabular-nums`}>{formatted}</span>;
});
AnimatedNumber.displayName = 'AnimatedNumber';
