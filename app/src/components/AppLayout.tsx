import { Outlet } from 'react-router-dom';
import { TabBar } from './TabBar';

/**
 * Mobile-first: coluna única + bottom tab bar.
 * >= md: a tab bar vira sidebar e o conteúdo abre em grid de 2-3 colunas
 * (as páginas usam .app-grid para distribuir os cards).
 */
export function AppLayout() {
  return (
    <div className="min-h-full bg-base md:flex">
      <TabBar />
      <main className="mx-auto w-full max-w-[420px] px-5 pb-[calc(96px+env(safe-area-inset-bottom))] pt-12 md:max-w-[1080px] md:px-10 md:pb-16 md:pt-14">
        <Outlet />
      </main>
    </div>
  );
}
