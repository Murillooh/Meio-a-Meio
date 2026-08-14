import { useState, useRef, useEffect } from 'react';

export function FloatingActionMenu({ onAddTx }: { onAddTx: () => void }) {
  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+96px)] right-4 z-50 md:bottom-8 md:right-8">
      <button
        onClick={onAddTx}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gold text-ink-inverse shadow-[0_4px_24px_rgba(244,180,121,0.4)] transition-transform hover:scale-105 active:scale-95"
        aria-label="Adicionar transação"
      >
        <span className="text-3xl font-light leading-none mb-1">+</span>
      </button>
    </div>
  );
}
