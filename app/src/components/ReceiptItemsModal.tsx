import { useState } from 'react';
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

export function ReceiptItemsModal({ open, onClose, items }: ReceiptItemsModalProps) {
  const { member } = useAuth();
  const create = useCreateTransaction();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const data = new Date().toISOString().slice(0, 10);

  const handleSaveAsSingle = async () => {
    setLoading(true);
    setError('');
    try {
      const descricao = `Supermercado (${items.length} itens)`;
      // Notas/Descrição estendida não existem no schema básico, podemos colocar no nome
      await create.mutateAsync({
        descricao,
        valor: -Math.abs(total),
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
    setLoading(true);
    setError('');
    try {
      // Cria uma transação para cada item
      const promises = items.map(item => 
        create.mutateAsync({
          descricao: item.name,
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
    <Modal open={open} onClose={onClose} title="Itens da Nota">
      <div className="flex flex-col gap-4 max-h-[80vh]">
        {error && <div className="text-alert text-sm">{error}</div>}
        
        <div className="bg-base border border-base-line rounded-xl p-3 max-h-[250px] overflow-y-auto flex flex-col gap-2">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between text-[13px] border-b border-base-line pb-2 last:border-0 last:pb-0">
              <span className="text-ink truncate pr-2 max-w-[70%]">{item.quantity}x {item.name}</span>
              <span className="text-ink-muted font-medium shrink-0">
                {(item.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center py-2 px-1">
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
            Salvar {items.length} Itens Separados
          </Button>
        </div>
      </div>
    </Modal>
  );
}
