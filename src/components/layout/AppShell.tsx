import { ArrowUpRight, BookOpen, Compass, FileText, LayoutGrid, SlidersHorizontal, Settings2 } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useTheme } from '../../lib/useTheme';
import { parseRoute, routeHash } from '../../lib/navigation';
import type { Theme } from '../../lib/theme';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { useSimStore } from '../../store/useSimStore';
import { MainPanel } from './MainPanel';

const destinations = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'plan', label: 'Plan', icon: SlidersHorizontal },
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'report', label: 'Report', icon: FileText },
] as const;

export function AppShell() {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const main = useRef<HTMLElement>(null);
  const previousRoute = useRef<string | null>(null);
  const appearance = useTheme();
  const isRunning = useSimStore(state => state.isRunning);
  const hasErrors = useSimStore(state => Object.keys(state.errors).length > 0);
  const hasResults = useSimStore(state => state.results !== null);
  const numSimulations = useSimStore(state => state.inputs.numSimulations);
  const status = hasErrors ? 'Review inputs' : isRunning ? 'Updating results' : hasResults ? 'Model current' : 'Awaiting results';

  useEffect(() => {
    const update = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);

  useEffect(() => {
    const hash = routeHash(route);
    if (hash !== previousRoute.current) {
      const section = route.destination === 'guide' && route.section ? document.getElementById(route.section) : null;
      const heading = section?.querySelector<HTMLElement>('h2') ?? main.current?.querySelector<HTMLElement>('[data-page-heading]');
      heading?.focus({ preventScroll: true });
      if (section) section.scrollIntoView({ block: 'start', behavior: 'instant' });
      else window.scrollTo({ top: 0, behavior: 'instant' });
      previousRoute.current = hash;
    }
    document.title = `${route.destination === 'guide' ? 'Model guide' : destinations.find(item => item.id === route.destination)?.label} · the Number`;
  }, [route]);

  const selected = destinations.findIndex(item => item.id === route.destination);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#workspace" onClick={event => { event.preventDefault(); main.current?.focus(); }}>Skip to content</a>
      <header className="app-header glass">
        <a href="#overview" className="wordmark" aria-label="the Number home"><span className="wordmark-the">the</span><span>Number<span className="wordmark-period">.</span></span></a>
        <span className="brand-caption">Private wealth<br />Clear perspective.</span>
        <nav className="primary-nav" aria-label="Primary navigation" style={{ '--selected-index': Math.max(0, selected), '--selection-opacity': selected < 0 ? 0 : 1 } as CSSProperties}>
          {destinations.map(({ id, label, icon: Icon }) => (
            <a key={id} href={id === 'explore' ? '#explore/rich' : `#${id}`} aria-current={route.destination === id ? 'page' : undefined}>
              <Icon size={18} strokeWidth={1.65} aria-hidden="true" /><span>{label}</span>
            </a>
          ))}
        </nav>
        <div className="header-tools">
          <span className="model-state" data-state={hasErrors ? 'invalid' : isRunning ? 'updating' : 'current'}><span className="status-dot" />{status}</span>
          <Button variant="ghost" className="icon-button" aria-label="Appearance and settings" aria-haspopup="dialog" aria-expanded={settingsOpen} onClick={() => setSettingsOpen(true)}><Settings2 size={19} strokeWidth={1.65} /></Button>
        </div>
      </header>
      <main id="workspace" ref={main} tabIndex={-1} className="workspace">
        <MainPanel route={route} />
        <footer className="workspace-footer"><span>the Number <span className="footer-divider">/</span> A clearer view of what comes next.</span><a href="#guide"><BookOpen size={14} />Model guide<ArrowUpRight size={13} /></a></footer>
      </main>
      <div className="sr-only" role="status">{status}{isRunning || hasErrors ? '. Results reflect the last valid plan.' : ''}</div>
      {settingsOpen ? (
        <Dialog title="Appearance & settings" onClose={() => setSettingsOpen(false)}>
          <fieldset className="appearance-fieldset"><legend>Color theme</legend><p className="settings-description">A considered palette, in every light.</p>
            <div className="theme-options">{(['graphite', 'porcelain', 'system'] as const).map(theme => (
              <label className="theme-option" key={theme} data-selected={appearance.theme === theme}>
                <input type="radio" name="theme" value={theme} checked={appearance.theme === theme} onChange={() => appearance.setTheme(theme as Theme)} />
                <span className={`theme-swatch swatch-${theme}`} aria-hidden="true"><span /><span /><span /></span>
                <span>{theme === 'graphite' ? 'Graphite' : theme === 'porcelain' ? 'Porcelain' : 'System'}</span>
              </label>
            ))}</div>
          </fieldset>
          <label className="settings-toggle"><span><strong>Reduce transparency</strong><span>Use solid navigation surfaces.</span></span><input type="checkbox" checked={appearance.reduceTransparency} onChange={event => appearance.setReduceTransparency(event.target.checked)} /></label>
          <label className="settings-toggle"><span><strong>Reduce motion</strong><span>Use immediate transitions.</span></span><input type="checkbox" checked={appearance.reduceMotion} onChange={event => appearance.setReduceMotion(event.target.checked)} /></label>
          <p className="settings-note">System follows your device appearance. Your device's reduced motion and transparency preferences are always respected.</p>
          {appearance.preferenceError ? <p className="form-message" role="status">Appearance works for this visit. Your browser could not save the preference.</p> : null}
          <div className="settings-model"><span className="eyebrow">Current model</span><p>{numSimulations.toLocaleString()} simulated paths · {status.toLowerCase()}</p></div>
          <a className="settings-guide" href="#guide" onClick={() => setSettingsOpen(false)}><BookOpen size={18} /> Read the model guide <ArrowUpRight size={16} /></a>
        </Dialog>
      ) : null}
    </div>
  );
}
