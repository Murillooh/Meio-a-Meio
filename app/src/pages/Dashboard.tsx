import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, SectionTitle, StatCard } from '@/components/ui/Card';
import { EmptyState, Loading } from '@/components/ui/States';
import { Bar } from '@/components/Bar';
import { useAuth } from '@/hooks/useAuth';
import { useAccounts, useMembers, useTransactions } from '@/hooks/useHouseholdData';
import { currentMonth, formatBRL, formatDayMonth, formatMonthLabel, papelLabel } from '@/lib/format';

export default function Dashboard() {
  const { household, member } = useAuth();
  const month = currentMonth();
  const { data: accounts = [] } = useAccounts();
  const { data: members = [] } = useMembers();
  const { data: txs = [], isLoading, isError, refetch } = useTransactions({ month });

  const saldoTotal = useMemo(() => accounts.reduce((s, a) => s + Number(a.saldo ?? 0), 0), [accounts]);

  // top categorias do mês por gasto — reflete o que o grupo realmente cadastrou, não um molde fixo
  const porCategoria = useMemo(() => {
    const acc = new Map<string, { nome: string; cor: string; total: number }>();
    for (const t of txs) {
      if (Number(t.valor) >= 0) continue;
      const key = t.categoria?.id ?? 'sem-categoria';
      const nome = t.categoria?.nome ?? 'Sem categoria';
      const cor = t.categoria?.cor ?? '#9aa7d4';
      const prev = acc.get(key);
      acc.set(key, { nome, cor, total: (prev?.total ?? 0) + Math.abs(Number(t.valor)) });
    }
    return [...acc.values()].sort((a, b) => b.total - a.total).slice(0, 3);
  }, [txs]);

  const divisao = useMemo(() => {
    const rows = members.map((m) => {
      const mine = txs.filter((t) => t.member_id === m.id);
      return {
        id: m.id,
        nome: m.nome ?? papelLabel(m.papel),
        papel: papelLabel(m.papel),
        aportou: mine.filter((t) => Number(t.valor) > 0).reduce((s, t) => s + Number(t.valor), 0),
        gastou: mine.filter((t) => Number(t.valor) < 0).reduce((s, t) => s + Math.abs(Number(t.valor)), 0),
      };
    });
    const maxAporte = Math.max(1, ...rows.map((r) => r.aportou));
    const maxGasto = Math.max(1, ...rows.map((r) => r.gastou));
    return { rows: rows.slice(0, 3), maxAporte, maxGasto };
  }, [members, txs]);

  return (
    <>
      <header className="mb-5">
        <p className="text-[11px] uppercase tracking-[0.1em] text-ink-faint">{formatMonthLabel(month)}</p>
        <h1 className="mt-1 text-[26px] font-semibold tracking-tight">{member?.nome ?? household?.nome}</h1>
      </header>

      <Card accent className="glow-gold p-5 md:p-7">
        <p className="text-[11px] uppercase tracking-[0.1em] text-ink-faint">Saldo consolidado</p>
        <p className="mt-2 font-mono text-[34px] font-bold leading-none tracking-tight text-gold-bright">{formatBRL(saldoTotal)}</p>
        <p className="mt-2.5 text-[12.5px] text-ink-muted">
          {accounts.length} {accounts.length === 1 ? 'conta conectada' : 'contas conectadas'} · <Link to="/contas">gerenciar</Link>
        </p>
      </Card>

      <SectionTitle action={<Link to="/categorias" className="text-[12.5px]">ver categorias</Link>}>Por finalidade</SectionTitle>
      {porCategoria.length === 0 ? (
        <Card><p className="text-[13.5px] text-ink-faint">Nenhum gasto categorizado neste mês ainda.</p></Card>
      ) : (
        <div className="grid grid-cols-3 gap-2.5 md:gap-4">
          {porCategoria.map((c) => (
            <StatCard key={c.nome} dot={c.cor} label={c.nome} value={formatBRL(c.total)} sub="no mês" />
          ))}
        </div>
      )}

      <SectionTitle action={<Link to="/divisao" className="text-[12.5px]">ver tudo</Link>}>Divisão do grupo</SectionTitle>
      <Card className="flex flex-col gap-4">
        {divisao.rows.length === 0 && <p className="text-[13.5px] text-ink-faint">Sem membros para comparar.</p>}
        {divisao.rows.map((r) => (
          <div key={r.id} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="text-[14.5px] font-medium">{r.nome}</span>
              <span className="text-[11px] uppercase tracking-[0.1em] text-ink-faint">{r.papel}</span>
            </div>
            <Bar label="Aportou" value={r.aportou} max={divisao.maxAporte} cor="#d4a017" />
            <Bar label="Gastou" value={r.gastou} max={divisao.maxGasto} cor="#f0a3b1" />
          </div>
        ))}
      </Card>

      <SectionTitle action={<Link to="/transacoes" className="text-[12.5px]">ver tudo</Link>}>Últimos lançamentos</SectionTitle>
      <Card className="flex flex-col divide-y divide-white/5 p-0">
        {isLoading && <div className="p-4"><Loading rows={3} /></div>}
        {isError && <p role="alert" className="p-4 text-[13.5px] text-alert">Não foi possível carregar os lançamentos. <button className="underline" onClick={() => refetch()}>tentar de novo</button></p>}
        {!isLoading && !isError && txs.length === 0 && (
          <div className="p-4"><EmptyState title="Nenhum lançamento neste mês." hint="Importe do banco em Contas ou adicione manualmente." /></div>
        )}
        {txs.slice(0, 5).map((t) => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-3">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.categoria?.cor ?? 'rgba(244,242,236,.25)' }} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14.5px]">{t.descricao}</p>
              <p className="text-[11.5px] text-ink-faint">{formatDayMonth(t.data)} · {t.categoria?.nome ?? 'Sem categoria'}</p>
            </div>
            <span className={'font-mono text-[14px] ' + (Number(t.valor) < 0 ? 'text-alert' : 'text-gold-bright')}>
              {formatBRL(t.valor)}
            </span>
          </div>
        ))}
      </Card>
    </>
  );
}
