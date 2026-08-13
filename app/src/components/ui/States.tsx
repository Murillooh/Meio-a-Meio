import type { ReactNode } from 'react';
import { Button } from './Button';

/** Estados padrão de loading / erro / vazio, iguais em todas as telas. */
export function Loading({ rows = 3, label = 'Carregando…' }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-2">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-[68px]" />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-alert-line bg-alert-bg p-5 text-center">
      <p className="text-[14px] text-alert">{message}</p>
      {onRetry && (
        <Button variant="ghost" size="sm" className="mt-3 w-auto px-4" onClick={onRetry}>Tentar de novo</Button>
      )}
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-base-line px-5 py-10 text-center">
      <p className="text-[14.5px] text-ink-muted">{title}</p>
      {hint && <p className="mt-1.5 text-[12.5px] text-ink-faint">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
