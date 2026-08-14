import { useEffect, useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Field, Input, MoneyInput, Select } from './ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { useAccounts, useCategories, useCreateTransaction, useMembers } from '@/hooks/useHouseholdData';
import { papelLabel } from '@/lib/format';

const today = () => new Date().toISOString().slice(0, 10);
const parseValor = (s: string) => Number(s.replace(/\./g, '').replace(',', '.'));

export function TransactionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { member } = useAuth();
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const { data: members = [] } = useMembers();
  const create = useCreateTransaction();

  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(today());
  const [categoriaId, setCategoriaId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [saida, setSaida] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setDescricao(''); setValor(''); setData(today()); setError('');
    setCategoriaId(''); setAccountId(''); setSaida(true);
    setMemberId(member?.id ?? '');
  }, [open, member?.id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseValor(valor);
    if (!descricao.trim()) return setError('Descreva o lançamento.');
    if (!Number.isFinite(n) || n <= 0) return setError('Informe um valor maior que zero.');
    try {
      await create.mutateAsync({
        descricao: descricao.trim(),
        valor: saida ? -Math.abs(n) : Math.abs(n),
        data,
        categoria_id: categoriaId || null,
        member_id: memberId || null,
        account_id: accountId || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar');
    }
  }

  return (
    <Modal open={open} title="Nova transação" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex gap-1.5 rounded-xl bg-base p-1">
          <button type="button" onClick={() => setSaida(true)}
            className={'flex-1 h-9 rounded-[10px] text-[13px] font-semibold transition-all ' + (saida ? 'bg-base-card text-alert shadow' : 'text-ink-faint hover:text-ink')}>
            Saída
          </button>
          <button type="button" onClick={() => setSaida(false)}
            className={'flex-1 h-9 rounded-[10px] text-[13px] font-semibold transition-all ' + (!saida ? 'bg-base-card text-calm shadow' : 'text-ink-faint hover:text-ink')}>
            Entrada
          </button>
        </div>

        <Field label="Descrição">
          <Input placeholder="Material escolar" value={descricao} onChange={(e) => setDescricao(e.target.value)} autoFocus />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor"><MoneyInput value={valor} onValueChange={setValor} /></Field>
          <Field label="Data"><Input type="date" value={data} onChange={(e) => setData(e.target.value)} /></Field>
        </div>

        <Field label="Categoria">
          <Select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
            <option value="">Sem categoria</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Autor">
            <Select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
              {members.map((m) => <option key={m.id} value={m.id}>{m.nome ?? papelLabel(m.papel)}</option>)}
            </Select>
          </Field>
          <Field label="Conta">
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="">Nenhuma</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.banco ?? 'Conta'}</option>)}
            </Select>
          </Field>
        </div>

        {error && <p className="alert">{error}</p>}

        <Button full disabled={create.isPending}>{create.isPending ? 'Salvando…' : 'Salvar transação'}</Button>
      </form>
    </Modal>
  );
}
