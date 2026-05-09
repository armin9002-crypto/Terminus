import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  description: string;
  tone?: "success" | "warning" | "danger" | "neutral";
}

const toneClass = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  neutral: "text-primaryText",
};

export function StatCard({ icon: Icon, label, value, description, tone = "neutral" }: StatCardProps) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mutedText">{label}</p>
            <p className={cn("mt-3 text-3xl font-bold transition-colors duration-300", toneClass[tone])}>{value}</p>
          </div>
          <div className="rounded-md border border-border bg-white/[0.04] p-2 text-teal-200">
            <Icon size={18} />
          </div>
        </div>
        <p className="mt-3 text-sm leading-5 text-mutedText">{description}</p>
      </CardContent>
    </Card>
  );
}
