import type { LucideIcon } from "lucide-react";
import { Line, LineChart, ReferenceLine, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "../../components/ui/card";
import { cn } from "../../lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  description: string;
  tone?: "success" | "warning" | "danger" | "neutral";
  sparklineData?: number[];
  sparklineColor?: string;
}

const toneClass = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  neutral: "text-primaryText",
};

export function StatCard({ icon: Icon, label, value, description, tone = "neutral", sparklineData, sparklineColor }: StatCardProps) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mutedText">{label}</p>
            <p className={cn("mt-2 text-2xl font-bold transition-colors duration-300", toneClass[tone])}>{value}</p>
          </div>
          <div className="rounded-md border border-border bg-white/[0.04] p-1.5 text-teal-200">
            <Icon size={16} />
          </div>
        </div>
        <p className="mt-2 text-xs leading-4 text-mutedText">{description}</p>
        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-2 h-8 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData.map((v, i) => ({ i, v }))}>
                <Line 
                  type="monotone" 
                  dataKey="v" 
                  stroke={sparklineColor ?? 'var(--accent)'} 
                  strokeWidth={1.5} 
                  dot={false} 
                  isAnimationActive={false}
                />
                <ReferenceLine y={0} stroke="#ef4444" strokeOpacity={0.4} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
