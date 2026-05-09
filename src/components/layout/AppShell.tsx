import { Activity, Menu } from "lucide-react";
import { MainPanel } from "./MainPanel";
import { Sidebar } from "./Sidebar";
import { useSimStore } from "@/store/useSimStore";
import { cn } from "@/lib/utils";

export function AppShell() {
  const isRunning = useSimStore((state) => state.isRunning);

  return (
    <div className="min-h-screen bg-background text-primaryText">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="flex h-[76px] items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button className="rounded-md border border-border bg-white/[0.04] p-2 text-mutedText lg:hidden" aria-label="Open controls">
              <Menu size={18} />
            </button>
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.26em] text-primaryText">Monte Carlo Wealth Lab</p>
              <p className="mt-1 text-xs text-mutedText">Retirement durability, liquidity, and net-worth analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-200">
            <span className={cn("size-2 rounded-full bg-emerald-400", isRunning && "animate-pulse")} />
            <Activity size={14} />
            Live Model
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <MainPanel />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 max-h-[55vh] overflow-y-auto border-t border-border bg-sidebar p-3 shadow-terminal lg:hidden">
        <Sidebar />
      </div>
    </div>
  );
}
