import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';

const field = 'h-[52px] w-full rounded-xl border border-base-line bg-base-card px-4 text-[15px] text-ink outline-none transition-colors focus:border-gold';

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[11px] uppercase tracking-[0.1em] text-ink-faint">{label}</span>
      {children}
      {hint && <span className="text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}

export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={[field, className].join(' ')} />;
}

export function Select({ className = '', children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={[field, 'appearance-none pr-10', className].join(' ')}>
      {children}
    </select>
  );
}

export function MoneyInput({ value, onValueChange }: { value: string; onValueChange: (v: string) => void }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-ink-faint">R$</span>
      <Input
        inputMode="decimal"
        placeholder="0,00"
        className="pl-11 font-mono text-[17px]"
        value={value}
        onChange={(e) => onValueChange(e.target.value.replace(/[^\d,.-]/g, ''))}
      />
    </div>
  );
}
