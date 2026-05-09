export function formatCurrency(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits,
  }).format(value);
}

export function formatCompactCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatMillions(value: number): string {
  return `$${(value / 1_000_000).toFixed(value >= 10_000_000 ? 1 : 2)}M`;
}

export function formatPercentage(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits,
  }).format(value);
}

export function formatAge(age: number): string {
  return `Age ${Math.round(age)}`;
}
