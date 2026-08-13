import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Início', glyph: '◉' },
  { to: '/transacoes', label: 'Transações', glyph: '≡' },
  { to: '/cofrinho', label: 'Cofrinho', glyph: '◈' },
  { to: '/contas', label: 'Contas', glyph: '▤' },
  { to: '/ajustes', label: 'Ajustes', glyph: '⚙' },
];

/** Bottom tab bar no mobile; sidebar fixa a partir de md. */
export function TabBar() {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-base-line bg-base/95 pb-[env(safe-area-inset-bottom)] backdrop-blur
                 md:sticky md:inset-x-auto md:top-0 md:h-screen md:w-[228px] md:shrink-0 md:border-r md:border-t-0 md:pb-0 md:pt-14"
    >
      <div className="mx-auto grid max-w-[420px] grid-cols-5 md:mx-0 md:max-w-none md:grid-cols-1 md:gap-1 md:px-4">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            className={({ isActive }) =>
              'flex min-h-[56px] flex-col items-center justify-center gap-1 text-[11px] transition-colors ' +
              'md:min-h-[48px] md:flex-row md:justify-start md:gap-3 md:rounded-xl md:px-3 md:text-[14px] ' +
              (isActive
                ? 'text-gold md:bg-gold-dim'
                : 'text-ink-faint hover:text-ink md:hover:bg-white/5')
            }
          >
            <span aria-hidden className="text-[17px] leading-none">{t.glyph}</span>
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
