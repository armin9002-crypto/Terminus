import { BookOpen, HelpCircle, Menu, Share2, X } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<string>("rich");
  const { theme, setTheme } = useTheme();
  const isRunning = useSimStore((state) => state.isRunning);
  const numSimulations = useSimStore((state) => state.inputs.numSimulations);
  const resetInputs = useSimStore(state => state.resetInputs);

  const themeOrder = ['dark', 'graphite', 'light', 'sepia', 'midnight'] as const;
  const themeLabels: Record<string, string> = {
    dark: 'Dark',
    graphite: 'Graphite',
    light: 'Light',
    sepia: 'Sepia',
    midnight: 'Midnight'
  };

  const cycleTheme = () => {
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  };

  return (
    <div className="min-h-screen bg-background text-primaryText">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="flex h-[56px] items-center justify-between px-4 lg:px-6">
          <div className="flex items-baseline gap-2">
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] font-black uppercase tracking-[0.34em] text-[var(--text-muted)]">the</span>
              <span className="bg-gradient-to-r from-teal-300 via-sky-300 to-blue-400 bg-clip-text text-xl font-black tracking-[-0.02em] text-transparent">
                Number
              </span>
            </div>
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)] sm:inline">
              Private Wealth Lab
            </span>
          </div>

          <button
            onClick={cycleTheme}
            title={`Current theme: ${theme}. Click to cycle.`}
            className="hidden md:flex items-center gap-1.5 rounded-full 
              border border-[var(--border)] px-3 py-1 text-xs font-semibold 
              text-[var(--text-muted)] hover:border-[var(--accent)] 
              hover:text-[var(--accent)] transition-all"
          >
            <span className="h-2 w-2 rounded-full" style={{
              background: theme === 'dark' ? '#14b8a6'
                : theme === 'graphite' ? '#2dd4bf'
                : theme === 'light' ? '#0f766e'
                : theme === 'sepia' ? '#f0b36d'
                : '#38bdf8'
            }} />
            {themeLabels[theme]}
          </button>

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
            <span className="rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-xs font-semibold text-[var(--text-muted)]">{formatCompactCurrency(numSimulations).replace("$", "")} runs</span>
            <button
              onClick={() => setActiveTab("info")}
              className="hidden sm:flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1 text-xs font-semibold text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
            >
              <BookOpen size={13} />
              How It Works
            </button>
            <Button variant="ghost" className="size-9 px-0" aria-label="Share" onClick={() => { setToast(true); window.setTimeout(() => setToast(false), 1800); }}><Share2 size={17} /></Button>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" className="size-9 px-0" aria-label="Help"><HelpCircle size={17} /></Button></TooltipTrigger>
              <TooltipContent className="max-w-xs rounded-md border border-border bg-[#1e293b] p-3 text-sm text-primaryText">the Number models your complete financial picture using Monte Carlo simulation across thousands of possible futures.</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>
      {toast ? <div className="fixed right-4 top-24 z-50 rounded-lg border border-border bg-[#1e293b] px-4 py-3 text-sm shadow-terminal">Share links coming soon.</div> : null}
      <div className="grid lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="hidden lg:block"><Sidebar /></div>
        <MainPanel activeTab={activeTab} onTabChange={setActiveTab} />
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
