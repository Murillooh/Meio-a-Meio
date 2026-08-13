import { useEffect, useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Field, Input, MoneyInput, Select } from './ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { useMembers } from '@/hooks/useHouseholdData';
import { useCreateDeposit } from '@/hooks/useEmergency';
import { papelLabel } from '@/lib/format';

const today = () => new Date().toISOString().slice(0, 10);
const parseValor = (s: string) => Number(s.replace(/\./g, '').replace(',', '.'));

export function DepositModal({
  open, tipo, onClose,
}: { open: boolean; tipo: 'deposito' | 'saque'; onClose: () => void }) {
  const { member } = useAuth();
  const { data: members = [] } = useMembers();
  const create = useCreateDeposit();

  const [valor, setValor] = useState('');
  const [data, setData] = useState(today());
  const [nota, setNota] = useState('');
  const [memberId, setMemberId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setValor(''); setData(today()); setNota(''); setError('');
    setMemberId(member?.id ?? '');
  }, [open, member?.id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseValor(valor);
    if (!Number.isFinite(n) || n <= 0) return setError('Informe um valor maior que zero.');
    try {
      await create.mutateAsync({
        valor: Math.abs(n), tipo, data,
        nota: nota.trim() || null,
        member_id: memberId || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar');
    }
  }

  return (
    <Modal open={open} title={tipo === 'deposito' ? 'Depositar na reserva' : 'Sacar da reserva'} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Valor"><MoneyInput value={valor} onValueChange={setValor} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data"><Input type="date" value={data} onChange={(e) => setData(e.target.value)} /></Field>
          <Field label="Autor">
            <Select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
              {members.map((m) => <option key={m.id} value={m.id}>{m.nome ?? papelLabel(m.papel)}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Nota" hint="opcional">
          <Input placeholder={tipo === 'deposito' ? '13º salário' : 'Consulta odontológica'} value={nota} onChange={(e) => setNota(e.target.value)} />
        </Field>
        {error && <p className="alert">{error}</p>}
        <Button full variant={tipo === 'saque' ? 'danger' : 'gold'} disabled={create.isPending}>
          {create.isPending ? 'Salvando…' : tipo === 'deposito' ? 'Confirmar depósito' : 'Confirmar saque'}
        </Button>
      </form>
    </Modal>
  );
}
