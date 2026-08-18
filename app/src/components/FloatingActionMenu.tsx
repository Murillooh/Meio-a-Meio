import { useState, useRef, useEffect } from 'react';

export function FloatingActionMenu({ onAddTx, onScanQR }: { onAddTx: () => void, onScanQR: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="fixed bottom-[calc(env(safe-area-inset-bottom)+88px)] right-4 z-50 md:bottom-8 md:right-8 flex flex-col items-end gap-3">
      {open && (
        <div className="flex flex-col items-end gap-2 mb-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
          <button
            onClick={() => { setOpen(false); onScanQR(); }}
            className="flex items-center gap-3 px-4 py-2.5 bg-base-card border border-base-line rounded-2xl shadow-lg hover:bg-base transition-colors"
          >
            <span className="text-[15px] font-medium text-ink">Ler QR Code (NFC-e)</span>
            <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center">
              📷
            </div>
          </button>
          <button
            onClick={() => { setOpen(false); onAddTx(); }}
            className="flex items-center gap-3 px-4 py-2.5 bg-base-card border border-base-line rounded-2xl shadow-lg hover:bg-base transition-colors"
          >
            <span className="text-[15px] font-medium text-ink">Transação Manual</span>
            <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center">
              ✍️
            </div>
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-ink shadow-[0_4px_24px_rgba(244,180,121,0.4)] transition-transform hover:scale-105 active:scale-95"
        aria-label="Menu de ações"
      >
        <span className={`text-3xl font-light leading-none mb-1 transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
    </div>
  );
}
