import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, SectionTitle } from '@/components/ui/Card';
import { EmptyState, ErrorState, Loading } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { TransactionModal } from '@/components/TransactionModal';
import { InlineCategory } from '@/components/InlineCategory';
import { useAccounts, useCategories, useDeleteTransaction, useMembers, useTransactions } from '@/hooks/useHouseholdData';
import { useSaveRule } from '@/hooks/useCategoryRules';
import { suggestPattern } from '@/lib/rules';
import { currentMonth, formatBRL, formatDayMonth, formatMonthLabel, papelLabel, shiftMonth } from '@/lib/format';
import type { TransactionRow } from '@/types';

/** Filtros combináveis vivem na URL: ?mes=2026-08&conta=…&categoria=…&autor=… */
export default function Transactions() {
  const [params, setParams] = useSearchParams();
  const month = params.get('mes') ?? currentMonth();
  const accountId = params.get('conta') ?? '';
  const categoryId = params.get('categoria') ?? '';
  const memberId = params.get('autor') ?? '';

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };

  const [open, setOpen] = useState(false);
  const [ruleFor, setRuleFor] = useState<TransactionRow | null>(null);

  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const { data: members = [] } = useMembers();
  const del = useDeleteTransaction();
  const { data: txs = [], isLoading, isError, refetch } = useTransactions({
    month,
    accountId: accountId || null,
    categoryId: categoryId || null,
    memberId: memberId || null,
  });

  const total = useMemo(() => txs.reduce((s, t) => s + Number(t.valor), 0), [txs]);
  const filtrosAtivos = [accountId, categoryId, memberId].filter(Boolean).length;

  return (
    <>
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-[26px] font-semibold tracking-tight">Transações</h1>
        <Button size="sm" onClick={() => setOpen(true)}>+ Nova</Button>
      </header>

      <Card className="flex items-center justify-between p-3">
        <button className="px-2 text-ink-muted hover:text-ink" onClick={() => setParam('mes', shiftMonth(month, -1))} aria-label="Mês anterior">‹</button>
        <span className="text-[14px] font-medium capitalize">{formatMonthLabel(month)}</span>
        <button className="px-2 text-ink-muted hover:text-ink" onClick={() => setParam('mes', shiftMonth(month, 1))} aria-label="Próximo mês">›</button>
      </Card>

      <div className="mt-3 grid grid-cols-3 gap-2 md:max-w-[620px]">
        <Select className="h-11 px-3 text-[13px]" value={accountId} onChange={(e) => setParam('conta', e.target.value)}>
          <option value="">Conta</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.banco ?? 'Conta'}</option>)}
        </Select>
        <Select className="h-11 px-3 text-[13px]" value={categoryId} onChange={(e) => setParam('categoria', e.target.value)}>
          <option value="">Categoria</option>
          <option value="none">Sem categoria</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </Select>
        <Select className="h-11 px-3 text-[13px]" value={memberId} onChange={(e) => setParam('autor', e.target.value)}>
          <option value="">Autor</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.nome ?? papelLabel(m.papel)}</option>)}
        </Select>
      </div>

      {filtrosAtivos > 0 && (
        <button
          className="mt-2 text-[12px] text-ink-faint hover:text-gold"
          onClick={() => setParams(new URLSearchParams({ mes: month }), { replace: true })}
        >
          limpar {filtrosAtivos} filtro(s)
        </button>
      )}

      <SectionTitle action={<span className={'font-mono text-[13px] ' + (total < 0 ? 'text-alert' : 'text-gold-bright')}>{formatBRL(total)}</span>}>
        {txs.length} {txs.length === 1 ? 'lançamento' : 'lançamentos'}
      </SectionTitle>

      {isLoading && <Loading rows={4} />}
      {isError && <ErrorState message="Não foi possível carregar as transações." onRetry={() => refetch()} />}
      {!isLoading && !isError && txs.length === 0 && (
        <EmptyState title="Nada por aqui com esses filtros." hint="Troque o mês ou limpe os filtros." />
      )}

      <div className="flex flex-col gap-2 md:grid md:grid-cols-2 xl:grid-cols-3">
        {txs.map((t) => (
          <Card key={t.id} className="flex flex-col gap-2.5">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px]">{t.descricao}</p>
                <p className="text-[11.5px] text-ink-faint">
                  {formatDayMonth(t.data)} · {papelLabel(t.member?.papel)} · {t.account?.banco ?? 'sem conta'}
                  {t.origem === 'open_finance' && ' · auto'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={'font-mono text-[14.5px] ' + (Number(t.valor) < 0 ? 'text-alert' : 'text-gold-bright')}>{formatBRL(t.valor)}</span>
                {t.origem === 'manual' && (
                  <button className="text-[11px] text-ink-faint hover:text-alert" onClick={() => del.mutate(t.id)}>excluir</button>
                )}
              </div>
            </div>
            <InlineCategory tx={t} onCreateRule={() => setRuleFor(t)} />
          </Card>
        ))}
      </div>

      <TransactionModal open={open} onClose={() => setOpen(false)} />
      <RuleFromTransactionModal tx={ruleFor} onClose={() => setRuleFor(null)} />
    </>
  );
}

function RuleFromTransactionModal({ tx, onClose }: { tx: TransactionRow | null; onClose: () => void }) {
  const { data: categories = [] } = useCategories();
  const save = useSaveRule();
  const [padrao, setPadrao] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [error, setError] = useState('');
  const [seeded, setSeeded] = useState<string | null>(null);

  // semeia o formulário quando abre para uma nova transação
  if (tx && seeded !== tx.id) {
    setSeeded(tx.id);
    setPadrao(suggestPattern(tx.descricao));
    setCategoriaId(tx.categoria_id ?? categories[0]?.id ?? '');
    setError('');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!padrao.trim()) return setError('Informe o texto a procurar.');
    if (!categoriaId) return setError('Escolha a categoria.');
    try {
      await save.mutateAsync({ padrao, categoria_id: categoriaId });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar');
    }
  }

  return (
    <Modal open={tx !== null} title="Criar regra" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <p className="text-[13px] text-ink-muted">
          A partir de <span className="text-ink">{tx?.descricao}</span>
        </p>
        <Field label="Se a descrição contém">
          <Input value={padrao} onChange={(e) => setPadrao(e.target.value)} />
        </Field>
        <Field label="Categoria">
          <Select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </Select>
        </Field>
        {error && <p className="alert">{error}</p>}
        <Button full disabled={save.isPending}>{save.isPending ? 'Salvando…' : 'Criar regra'}</Button>
      </form>
    </Modal>
  );
}
