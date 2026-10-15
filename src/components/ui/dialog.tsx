import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';

export function Dialog({ title, eyebrow = 'Preferences', onClose, children }: { title: string; eyebrow?: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const opener = document.activeElement as HTMLElement | null;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      opener?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog ref={ref} className="app-dialog" aria-labelledby="dialog-title" onCancel={event => { event.preventDefault(); onClose(); }} onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const controls = [...ref.current!.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex="0"]')].filter(element => !element.hasAttribute('disabled') && element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }} onClick={event => {
      if (event.target !== ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
    }}>
      <div className="dialog-heading">
        <div><p className="eyebrow">{eyebrow}</p><h2 id="dialog-title">{title}</h2></div>
        <Button autoFocus variant="ghost" className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={20} /></Button>
      </div>
      {children}
    </dialog>
  );
}
