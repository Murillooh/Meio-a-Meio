import { useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TabBar } from './TabBar';
import { FloatingActionMenu } from './FloatingActionMenu';
import { TransactionModal } from './TransactionModal';
import { InstallPWA } from './InstallPWA';
import { ScannerModal } from './ScannerModal';
import { ReceiptItemsModal, type ReceiptItem } from './ReceiptItemsModal';
import { supabase } from '@/lib/supabase';
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

  const [scannerOpen, setScannerOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const openTxModal = (tx?: TransactionRow | null) => {
    setRuleFor(tx || null);
    setTxModalOpen(true);
  };

  const handleScan = async (url: string) => {
    setScannerOpen(false);
    setIsParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-receipt', {
        body: { url }
      });
      
      if (error) throw error;
      
      if (data?.success && data?.items?.length > 0) {
        setReceiptItems(data.items);
        setReceiptOpen(true);
      } else {
        alert('Não foi possível ler os itens dessa nota (formato desconhecido ou sem itens).');
      }
    } catch (err: any) {
      console.error('Erro ao ler nota:', err);
      alert('Erro ao tentar ler a nota fiscal: ' + err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite escolher o mesmo arquivo de novo depois
    if (!file) return;

    setIsParsing(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const base64 = dataUrl.split(',')[1] ?? '';

      const { data, error } = await supabase.functions.invoke('parse-receipt-photo', {
        body: { image: base64, mediaType: file.type || 'image/jpeg' },
      });

      if (error) throw error;

      if (data?.success && data?.items?.length > 0) {
        setReceiptItems(data.items);
        setReceiptOpen(true);
      } else {
        alert('Não consegui identificar itens nessa foto. Tenta tirar de novo com mais luz e foco na nota.');
      }
    } catch (err: any) {
      console.error('Erro ao ler foto da nota:', err);
      alert('Erro ao tentar ler a foto da nota: ' + err.message);
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="min-h-full bg-base md:flex relative">
      <TabBar />
      <main className="mx-auto w-full max-w-[420px] px-5 pb-[calc(88px+env(safe-area-inset-bottom))] pt-12 md:max-w-[1080px] md:px-10 md:pb-16 md:pt-14">
        <Outlet context={{ openTxModal } satisfies AppLayoutContextType} />
      </main>

      {/* Loading overlay for parsing */}
      {isParsing && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-base-card p-6 rounded-2xl flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="font-medium text-ink">Lendo nota fiscal...</p>
          </div>
        </div>
      )}

      {/* Botão Flutuante (FAB) */}
      <FloatingActionMenu
        onAddTx={() => openTxModal()}
        onScanQR={() => setScannerOpen(true)}
        onPhotoReceipt={() => photoInputRef.current?.click()}
      />

      {/* Input de foto escondido — sem 'capture' o celular mostra a escolha entre câmera e galeria */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoSelected}
      />

      {/* Sugestão de Instalação (PWA) */}
      <InstallPWA />

      {/* Modais de Leitura de Nota */}
      <ScannerModal 
        open={scannerOpen} 
        onClose={() => setScannerOpen(false)} 
        onScan={handleScan}
      />
      
      <ReceiptItemsModal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        items={receiptItems}
        totalItems={receiptItems.length}
      />

      {/* Modal Global de Transação */}
      <TransactionModal 
        open={txModalOpen} 
        onClose={() => setTxModalOpen(false)}
      />
    </div>
  );
}
