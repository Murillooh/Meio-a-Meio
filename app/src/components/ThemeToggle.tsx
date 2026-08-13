import { useTheme } from '@/lib/ThemeContext';

/** Escolha do tema da casa: noite acolhedora ou caderno de cozinha. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const opts = [
    { id: 'escuro' as const, label: 'Noite acolhedora', swatch: '#1c1512', accent: '#f0a06a' },
    { id: 'claro' as const, label: 'Caderno de cozinha', swatch: '#faf6ef', accent: '#c05f3c' },
  ];

  return (
    <div className="flex flex-col gap-2" role="radiogroup" aria-label="Tema do app">
      {opts.map((o) => {
        const on = theme === o.id;
        return (
          <button
            key={o.id}
            role="radio"
            aria-checked={on}
            onClick={() => setTheme(o.id)}
            className={'flex min-h-[56px] items-center gap-3 rounded-2xl border px-4 text-left transition-colors ' +
              (on ? 'border-accent bg-accent-dim' : 'border-base-line bg-base-card hover:border-accent/40')}
          >
            <span className="h-8 w-8 shrink-0 rounded-full border border-base-line" style={{ background: o.swatch }}>
              <span className="block h-full w-full scale-[0.42] rounded-full" style={{ background: o.accent }} />
            </span>
            <span className="flex-1 text-[14.5px]">{o.label}</span>
            <span aria-hidden className={on ? 'text-accent' : 'text-ink-faint'}>{on ? '●' : '○'}</span>
          </button>
        );
      })}
    </div>
  );
}
