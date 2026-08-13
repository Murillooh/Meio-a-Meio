import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'gold' | 'ghost' | 'quiet' | 'danger';

const base = 'inline-flex items-center justify-center gap-2 rounded-xl text-[15px] font-semibold transition-colors disabled:opacity-45 disabled:pointer-events-none';
const sizes = { md: 'h-[52px] px-5', sm: 'h-9 px-3 text-[13px] font-medium' } as const;
const variants: Record<Variant, string> = {
  gold: 'bg-gold text-base hover:bg-gold-bright',
  ghost: 'border border-base-line bg-white/5 text-ink hover:bg-white/10',
  quiet: 'text-ink-muted hover:text-ink',
  danger: 'border border-alert-line bg-alert-bg text-alert hover:bg-alert-bg/70',
};

export function Button({
  variant = 'gold', size = 'md', full, children, className = '', ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'md' | 'sm'; full?: boolean; children: ReactNode }) {
  return (
    <button {...rest} className={[base, sizes[size], variants[variant], full ? 'w-full' : '', className].join(' ')}>
      {children}
    </button>
  );
}
