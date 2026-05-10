import { HelpCircle, Menu, Share2, X } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../../lib/useTheme";
import { Button } from "../../components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/ui/tooltip";
import { formatCompactCurrency } from "../../lib/formatters";
import { cn } from "../../lib/utils";
import { useSimStore } from "../../store/useSimStore";
import { MainPanel } from "./MainPanel";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState(false);
  const { theme, setTheme } = useTheme();
  const isRunning = useSimStore((state) => state.isRunning);
  const numSimulations = useSimStore((state) => state.inputs.numSimulations);
  const resetInputs = useSimStore(state => state.resetInputs);

  return (
    <div className="min-h-screen bg-background text-primaryText">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="flex h-[56px] items-center justify-between px-4 lg:px-6">
          <div>
            <p className="bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-lg font-extrabold uppercase tracking-widest text-transparent">Terminus</p>
          </div>

          <div className="hidden items-center gap-1 md:flex">
            {(['dark', 'light', 'sepia'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  theme === t 
                    ? 'bg-[var(--accent)] text-white' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {t === 'dark' ? '🌙 Dark' : t === 'light' ? '☀️ Light' : '📜 Sepia'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              className="text-xs px-2 h-7"
              onClick={resetInputs}>
              Reset
            </Button>

            <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-200 sm:flex">
              <span className={cn("size-2 rounded-full bg-emerald-400", isRunning && "animate-pulse")} />
              Live Model
            </div>
            <span className="rounded-full border border-border bg-white/[0.04] px-3 py-2 text-xs font-semibold text-mutedText">{formatCompactCurrency(numSimulations).replace("$", "")} runs</span>
            <Button variant="ghost" className="size-9 px-0" aria-label="Share" onClick={() => { setToast(true); window.setTimeout(() => setToast(false), 1800); }}><Share2 size={17} /></Button>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" className="size-9 px-0" aria-label="Help"><HelpCircle size={17} /></Button></TooltipTrigger>
              <TooltipContent className="max-w-xs rounded-md border border-border bg-[#1e293b] p-3 text-sm text-primaryText">Terminus models your complete financial picture using Monte Carlo simulation across thousands of possible futures.</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>
      {toast ? <div className="fixed right-4 top-24 z-50 rounded-lg border border-border bg-[#1e293b] px-4 py-3 text-sm shadow-terminal">Share links coming soon.</div> : null}
      <div className="grid lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="hidden lg:block"><Sidebar /></div>
        <MainPanel />
      </div>
      <Button className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 gap-2 md:hidden" onClick={() => setMobileOpen(true)}><Menu size={16} /> Edit Inputs</Button>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden">
          <div className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-hidden rounded-t-2xl border border-border bg-sidebar">
            <div className="flex items-center justify-between border-b border-border p-4">
              <p className="font-bold text-primaryText">Edit Inputs</p>
              <Button variant="ghost" className="size-9 px-0" onClick={() => setMobileOpen(false)}><X size={18} /></Button>
            </div>
            <Sidebar mobile />
          </div>
        </div>
      ) : null}
    </div>
  );
}
