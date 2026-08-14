import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TabBar } from './TabBar';
import { FloatingActionMenu } from './FloatingActionMenu';
import { TransactionModal } from './TransactionModal';
import type { TransactionRow } from '@/types';

export type AppLayoutContextType = {
  openTxModal: (tx?: TransactionRow | null) => void;
};

/**
 * Mobile-first: coluna única + bottom tab bar.
 * >= md: a tab bar vira sidebar e o conteúdo abre em grid de 2-3 colunas
 * (as páginas usam .app-grid para distribuir os cards).
 */
export function AppLayout() {
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [ruleFor, setRuleFor] = useState<TransactionRow | null>(null);

  const openTxModal = (tx?: TransactionRow | null) => {
    setRuleFor(tx || null);
    setTxModalOpen(true);
  };

  return (
    <div className="min-h-full bg-base md:flex relative">
      <TabBar />
      <main className="mx-auto w-full max-w-[420px] px-5 pb-[calc(96px+env(safe-area-inset-bottom))] pt-12 md:max-w-[1080px] md:px-10 md:pb-16 md:pt-14">
        <Outlet context={{ openTxModal } satisfies AppLayoutContextType} />
      </main>

      {/* Botão Flutuante (FAB) */}
      <FloatingActionMenu onAddTx={() => openTxModal()} />

      {/* Modal Global de Transação */}
      <TransactionModal 
        open={txModalOpen} 
        onClose={() => setTxModalOpen(false)}
      />
    </div>
  );
}
