import { useEffect, useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useCreateTransaction } from '@/hooks/useHouseholdData';

export interface ReceiptItem {
  name: string;
  price: number;
  quantity: number;
}

interface ReceiptItemsModalProps {
  open: boolean;
  onClose: () => void;
  items: ReceiptItem[];
  totalItems: number;
}

/** Itens lidos (QR da NFC-e ou foto da nota) — confere e edita antes de virar transação. */
export function ReceiptItemsModal({ open, onClose, items }: ReceiptItemsModalProps) {
  const { member } = useAuth();
  const create = useCreateTransaction();
  const [draft, setDraft] = useState<ReceiptItem[]>(items);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // reabre com os itens novos toda vez que uma leitura diferente chega
  useEffect(() => {
    if (open) setDraft(items);
  }, [open, items]);

  const total = draft.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const data = new Date().toISOString().slice(0, 10);

  const updateItem = (i: number, patch: Partial<ReceiptItem>) => {
    setDraft((prev) => prev.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  };

  const removeItem = (i: number) => {
    setDraft((prev) => prev.filter((_, idx) => idx !== i));
  };

  const addItem = () => {
    setDraft((prev) => [...prev, { name: '', price: 0, quantity: 1 }]);
  };

  const validItems = draft.filter((i) => i.name.trim() && i.price > 0);

  const handleSaveAsSingle = async () => {
    if (validItems.length === 0) return setError('Confere se os itens têm nome e preço.');
    setLoading(true);
    setError('');
    try {
      const descricao = `Supermercado (${validItems.length} itens)`;
      await create.mutateAsync({
        descricao,
        valor: -Math.abs(validItems.reduce((s, i) => s + i.price * i.quantity, 0)),
        data,
        categoria_id: null,
        member_id: member?.id || null,
        account_id: null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar transação');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMultiple = async () => {
    if (validItems.length === 0) return setError('Confere se os itens têm nome e preço.');
    setLoading(true);
    setError('');
    try {
      const promises = validItems.map((item) =>
        create.mutateAsync({
          descricao: item.name.trim(),
          valor: -Math.abs(item.price * item.quantity),
          data,
          categoria_id: null,
          member_id: member?.id || null,
          account_id: null,
        })
      );
      await Promise.all(promises);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar transações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Confere os itens da nota">
      <div className="flex flex-col gap-4 max-h-[80vh]">
        <p className="text-[12.5px] text-ink-muted">Ajusta nome, preço e quantidade antes de salvar.</p>

        {error && <div className="text-alert text-sm">{error}</div>}

        <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-0.5">
          {draft.map((item, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl border border-base-line bg-base p-2">
              <input
                value={item.name}
                onChange={(e) => updateItem(i, { name: e.target.value })}
                placeholder="Nome do item"
                className="min-w-0 flex-1 rounded-lg border border-base-line bg-base-card px-2 py-1.5 text-[13px] text-ink outline-none focus:border-accent"
              />
              <input
                type="number"
                min={1}
                step={1}
                value={item.quantity}
                onChange={(e) => updateItem(i, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                className="w-12 shrink-0 rounded-lg border border-base-line bg-base-card px-1.5 py-1.5 text-center text-[13px] text-ink outline-none focus:border-accent"
                aria-label="Quantidade"
              />
              <span className="shrink-0 text-[12px] text-ink-faint">×</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={item.price}
                onChange={(e) => updateItem(i, { price: Math.max(0, Number(e.target.value) || 0) })}
                className="w-20 shrink-0 rounded-lg border border-base-line bg-base-card px-1.5 py-1.5 text-right text-[13px] font-mono text-ink outline-none focus:border-accent"
                aria-label="Preço unitário"
              />
              <button
                onClick={() => removeItem(i)}
                className="shrink-0 text-[12px] text-ink-faint hover:text-alert"
                aria-label="Remover item"
              >
                ✕
              </button>
            </div>
          ))}
          {draft.length === 0 && <p className="py-4 text-center text-[13px] text-ink-faint">Nenhum item — adiciona manualmente ou fecha e tenta de novo.</p>}
        </div>

        <button onClick={addItem} className="self-start text-[12.5px] text-accent hover:underline">
          + Adicionar item
        </button>

        <div className="flex justify-between items-center py-2 px-1 border-t border-base-line">
          <span className="text-ink-muted font-medium">Total:</span>
          <span className="text-xl font-semibold text-alert">
            {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <Button disabled={loading} onClick={handleSaveAsSingle}>
            Salvar como Única Transação
          </Button>
          <Button variant="ghost" disabled={loading} onClick={handleSaveMultiple}>
            Salvar {validItems.length} {validItems.length === 1 ? 'Item' : 'Itens'} Separados
          </Button>
        </div>
      </div>
    </Modal>
  );
}
