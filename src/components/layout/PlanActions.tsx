import { useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { DEFAULT_INPUTS } from '../../lib/constants';
import type { SimInputs } from '../../types';
import { useSimStore } from '../../store/useSimStore';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';

export function PlanActions() {
  const [confirming, setConfirming] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const snapshot = useRef<SimInputs | null>(null);
  const inputs = useSimStore(state => state.inputs);
  const setInputs = useSimStore(state => state.setInputs);
  const changedCount = Object.keys(DEFAULT_INPUTS).filter(key => JSON.stringify(inputs[key as keyof SimInputs]) !== JSON.stringify(DEFAULT_INPUTS[key as keyof SimInputs])).length;
  return <div className="plan-actions">
    <p>Inputs save locally when browser storage is available.</p>
    <div>{canUndo ? <Button variant="secondary" onClick={() => { if (snapshot.current) setInputs(snapshot.current); setCanUndo(false); }}>Undo reset</Button> : null}<Button variant="ghost" onClick={() => setConfirming(true)}><RotateCcw size={15} /> Reset plan</Button></div>
    {confirming ? <Dialog title="Reset this plan?" eyebrow="Plan actions" onClose={() => setConfirming(false)}>
      <p className="reset-description">Restore all financial inputs, carry awards, and college entries to the default plan. {changedCount} input {changedCount === 1 ? 'setting differs' : 'settings differ'} from the defaults. Appearance and in-memory scenarios are preserved. You can undo this reset while you remain in Plan.</p>
      <div className="dialog-actions"><Button variant="secondary" onClick={() => setConfirming(false)}>Keep my plan</Button><Button onClick={() => { snapshot.current = structuredClone(inputs); setInputs(structuredClone(DEFAULT_INPUTS)); setCanUndo(true); setConfirming(false); }}>Reset inputs</Button></div>
    </Dialog> : null}
  </div>;
}
