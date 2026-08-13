import { useMemo, useState } from 'react';
import { Card, SectionTitle } from '@/components/ui/Card';
import { EmptyState, Loading } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';
import { Field, Input, MoneyInput } from '@/components/ui/Input';
import { EmergencyProgress } from '@/components/EmergencyProgress';
import { DepositModal } from '@/components/DepositModal';
import { saldoFromDeposits, useEmergencyDeposits, useEmergencyFund, useSaveEmergencyFund } from '@/hooks/useEmergency';
import { formatBRL, formatDayMonth, papelLabel } from '@/lib/format';

const parseValor = (s: string) => Number(s.replace(/\./g, '').replace(',', '.'));

export default function Piggy() {
  const { data: fund, isLoading: loadingFund } = useEmergencyFund();
  const { data: deposits = [], isLoading: loadingDeps } = useEmergencyDeposits();
  const [modal, setModal] = useState<null | 'deposito' | 'saque'>(null);
  const [editing, setEditing] = useState(false);

  const saldo = useMemo(() => saldoFromDeposits(deposits), [deposits]);
  const meta = Number(fund?.meta_valor ?? 0);
  const despesa = Number(fund?.despesa_mensal_media ?? 0);
  const meses = despesa > 0 ? saldo / despesa : null;

  if (loadingFund) return <Loading rows={3} label="Carregando reserva" />;
  if (!fund || meta <= 0 || editing) {
    return <FundSetup fund={fund} onDone={() => setEditing(false)} />;
  }

  return (
    <>
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-[26px] font-semibold tracking-tight">Cofrinho</h1>
        <button className="text-[12.5px] text-ink-faint hover:text-gold" onClick={() => setEditing(true)}>ajustar meta</button>
      </header>

      <EmergencyProgress saldo={saldo} meta={meta} meses={meses} />

      <div className="mt-4 grid grid-cols-2 gap-3 md:max-w-[420px]">
        <Button onClick={() => setModal('deposito')}>Depositar</Button>
        <Button variant="ghost" onClick={() => setModal('saque')}>Sacar</Button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Card className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.1em] text-ink-faint">Despesa média/mês</span>
          <span className="font-mono text-[15px]">{formatBRL(despesa)}</span>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.1em] text-ink-faint">Movimentações</span>
          <span className="font-mono text-[15px]">{deposits.length}</span>
        </Card>
      </div>

      <SectionTitle>Histórico</SectionTitle>
      {loadingDeps && <Loading rows={3} />}
      {!loadingDeps && deposits.length === 0 && (
        <EmptyState title="Nenhum aporte ainda." hint="O primeiro depósito começa a contar os meses de reserva." />
      )}

      <div className="flex flex-col gap-2 md:grid md:grid-cols-2">
        {deposits.map((d) => {
          const saque = d.tipo === 'saque';
          return (
            <Card key={d.id} className="flex items-center gap-3">
              <span className={'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px] ' + (saque ? 'bg-alert-bg text-alert' : 'bg-gold-dim text-gold-bright')}>
                {saque ? '↓' : '↑'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px]">{d.nota || (saque ? 'Saque' : 'Depósito')}</p>
                <p className="text-[11.5px] text-ink-faint">
                  {formatDayMonth(d.data)} · {d.member?.nome ?? papelLabel(d.member?.papel)}
                </p>
              </div>
              <span className={'font-mono text-[14.5px] ' + (saque ? 'text-alert' : 'text-gold-bright')}>
                {saque ? '−' : '+'}{formatBRL(Number(d.valor))}
              </span>
            </Card>
          );
        })}
      </div>

      <DepositModal open={modal !== null} tipo={modal ?? 'deposito'} onClose={() => setModal(null)} />
    </>
  );
}

function FundSetup({ fund, onDone }: { fund: { meta_valor: number; despesa_mensal_media: number } | null | undefined; onDone: () => void }) {
  const save = useSaveEmergencyFund();
  const [metaStr, setMetaStr] = useState(fund?.meta_valor ? String(fund.meta_valor).replace('.', ',') : '');
  const [despesaStr, setDespesaStr] = useState(fund?.despesa_mensal_media ? String(fund.despesa_mensal_media).replace('.', ',') : '');
  const [error, setError] = useState('');

  const despesa = parseValor(despesaStr);
  const sugestao = Number.isFinite(despesa) && despesa > 0 ? despesa * 6 : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const meta = parseValor(metaStr);
    if (!Number.isFinite(despesa) || despesa <= 0) return setError('Informe a despesa mensal média.');
    if (!Number.isFinite(meta) || meta <= 0) return setError('Informe a meta da reserva.');
    try {
      await save.mutateAsync({ meta_valor: meta, despesa_mensal_media: despesa });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar');
    }
  }

  return (
    <>
      <h1 className="text-[26px] font-semibold tracking-tight">Cofrinho</h1>
      <p className="mt-2 text-[15px] text-ink-muted">
        Defina quanto a casa gasta por mês e onde a reserva precisa chegar. A recomendação comum é de 6 meses de despesa.
      </p>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        <Field label="Despesa mensal média">
          <MoneyInput value={despesaStr} onValueChange={setDespesaStr} />
        </Field>
        <Field label="Meta da reserva" hint={sugestao > 0 ? `Sugestão (6 meses): ${formatBRL(sugestao)}` : undefined}>
          <MoneyInput value={metaStr} onValueChange={setMetaStr} />
        </Field>
        {sugestao > 0 && (
          <button type="button" className="self-start text-[12.5px] text-gold" onClick={() => setMetaStr(String(sugestao).replace('.', ','))}>
            usar sugestão
          </button>
        )}
        {error && <p className="alert">{error}</p>}
        <Button full disabled={save.isPending}>{save.isPending ? 'Salvando…' : 'Salvar reserva'}</Button>
        {fund && <Button type="button" variant="quiet" full onClick={onDone}>Cancelar</Button>}
      </form>
    </>
  );
}
