import type { ReactNode } from 'react';

export function Card({ children, className = '', accent = false }: { children: ReactNode; className?: string; accent?: boolean }) {
  return (
    <div className={[
      'rounded-2xl border p-4',
      accent ? 'border-gold/35 bg-gradient-to-br from-gold/10 to-transparent' : 'border-base-line bg-base-card',
      className,
    ].join(' ')}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub, dot }: { label: string; value: string; sub?: string; dot?: string }) {
  return (
    <Card className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />}
        <span className="text-[11px] uppercase tracking-[0.1em] text-ink-faint">{label}</span>
      </div>
      <span className="font-mono text-[17px] font-semibold">{value}</span>
      {sub && <span className="text-xs text-ink-faint">{sub}</span>}
    </Card>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 mt-6 flex items-baseline justify-between">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-ink-faint">{children}</h2>
      {action}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-base-line px-4 py-8 text-center text-[13.5px] text-ink-faint">{children}</p>;
}
