import { useMemo } from 'react';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Bar } from '@/components/Bar';
import { useMembers, useTransactions } from '@/hooks/useHouseholdData';
import { currentMonth, formatMonthLabel, papelLabel } from '@/lib/format';

/** Quanto cada pessoa do grupo aportou × gastou no mês. */
export default function Divisao() {
  const month = currentMonth();
  const { data: members = [] } = useMembers();
  const { data: txs = [] } = useTransactions({ month });

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
    return { rows, maxAporte, maxGasto };
  }, [members, txs]);

  return (
    <>
      <header className="mb-5">
        <p className="text-[11px] uppercase tracking-[0.1em] text-ink-faint">{formatMonthLabel(month)}</p>
        <h1 className="mt-1 text-[26px] font-semibold tracking-tight">Divisão do grupo</h1>
      </header>

      <SectionTitle>Quem aportou e quem gastou</SectionTitle>
      <Card className="flex flex-col gap-4">
        {divisao.rows.length === 0 && <p className="text-[13.5px] text-ink-faint">Sem membros para comparar.</p>}
        {divisao.rows.map((r) => (
          <div key={r.id} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="text-[14.5px] font-medium">{r.nome}</span>
              {r.papel.trim().toLowerCase() !== r.nome.trim().toLowerCase() && (
                <span className="text-[11px] uppercase tracking-[0.1em] text-ink-faint">{r.papel}</span>
              )}
            </div>
            <Bar label="Aportou" value={r.aportou} max={divisao.maxAporte} cor="#d4a017" />
            <Bar label="Gastou" value={r.gastou} max={divisao.maxGasto} cor="#f0a3b1" />
          </div>
        ))}
      </Card>
    </>
  );
}
