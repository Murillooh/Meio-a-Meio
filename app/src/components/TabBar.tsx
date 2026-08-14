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
      className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+8px)] z-40 
                 rounded-[28px] border border-base-line bg-base-card/95 backdrop-blur-xl shadow-2xl
                 md:sticky md:inset-x-auto md:top-0 md:h-screen md:w-[228px] md:shrink-0 md:rounded-none md:border-r md:border-t-0 md:bg-base/95 md:pb-0 md:pt-14"
    >
      <div className="mx-auto flex h-[64px] max-w-[420px] items-center justify-around px-2 md:mx-0 md:h-auto md:max-w-none md:flex-col md:items-stretch md:gap-1 md:px-4">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            className={({ isActive }) =>
              'flex flex-1 flex-col items-center justify-center gap-[2px] text-[10px] font-medium transition-all duration-200 ' +
              'md:min-h-[48px] md:flex-none md:flex-row md:justify-start md:gap-3 md:rounded-xl md:px-3 md:text-[14px] ' +
              (isActive
                ? 'text-gold md:bg-gold-dim'
                : 'text-ink-faint hover:text-ink md:hover:bg-white/5')
            }
          >
            <span aria-hidden className="text-[20px] leading-none mb-0.5">{t.glyph}</span>
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
