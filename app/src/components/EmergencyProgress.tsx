import { useEffect, useState } from 'react';
import { formatBRL } from '@/lib/format';

/** Barra grande com brilho dourado; anima do valor anterior para o novo. */
export function EmergencyProgress({ saldo, meta, meses }: { saldo: number; meta: number; meses: number | null }) {
  const target = meta > 0 ? Math.min(100, (saldo / meta) * 100) : 0;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(target));
    return () => cancelAnimationFrame(id);
  }, [target]);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-b from-gold/[0.13] to-transparent p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-24 h-56 w-56 rounded-full opacity-60 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(212,160,23,0.35), transparent 70%)' }}
      />
      <p className="relative text-[11px] uppercase tracking-[0.12em] text-ink-faint">Reserva de emergência</p>
      <p className="relative mt-2 font-mono text-[42px] font-bold leading-none tracking-tight text-gold-bright">
        {formatBRL(saldo)}
      </p>
      <p className="relative mt-2 text-[13px] text-ink-muted">
        de {formatBRL(meta)} · <span className="text-gold">{target.toFixed(0)}%</span> da meta
      </p>

      <div className="relative mt-5 h-4 overflow-hidden rounded-full bg-black/50 ring-1 ring-inset ring-white/10">
        <div
          className="h-full rounded-full transition-[width] duration-[900ms] ease-out"
          style={{
            width: `${width}%`,
            background: 'linear-gradient(90deg, #8c6a0c, #d4a017 55%, #f4d47a)',
            boxShadow: '0 0 18px rgba(212,160,23,0.55), 0 0 42px rgba(212,160,23,0.28)',
          }}
        />
      </div>

      <div className="relative mt-4 flex items-end justify-between">
        <div>
          <p className="font-mono text-[26px] font-semibold leading-none text-ink">
            {meses === null ? '—' : meses.toFixed(1).replace('.', ',')}
          </p>
          <p className="mt-1 text-[11.5px] uppercase tracking-[0.1em] text-ink-faint">meses de reserva</p>
        </div>
        <p className="text-right text-[12px] text-ink-faint">
          falta {formatBRL(Math.max(0, meta - saldo))}
        </p>
      </div>
    </section>
  );
}
