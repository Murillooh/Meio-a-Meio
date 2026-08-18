import { formatBRL } from '@/lib/format';

/** Barra horizontal rotulada (usada em Divisão pra comparar aportou × gastou por pessoa). */
export function Bar({ label, value, max, cor }: { label: string; value: number; max: number; cor: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 text-[11.5px] text-ink-faint">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: cor }} />
      </div>
      <span className="w-24 text-right font-mono text-[12.5px]">{formatBRL(value)}</span>
    </div>
  );
}
