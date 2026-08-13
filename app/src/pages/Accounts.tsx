import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, SectionTitle } from '@/components/ui/Card';
import { EmptyState, ErrorState, Loading } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useAccounts } from '@/hooks/useHouseholdData';
import { useConnectBank, useSyncAccount } from '@/hooks/useBankSync';
import { formatBRL } from '@/lib/format';
import type { Account } from '@/types';

export default function Accounts() {
  const { household, signOut } = useAuth();
  const { data: accounts = [], isLoading, isError, refetch } = useAccounts();
  const connect = useConnectBank();
  const sync = useSyncAccount();
  const [syncing, setSyncing] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const total = accounts.reduce((s, a) => s + Number(a.saldo ?? 0), 0);

  async function onConnect() {
    setError(''); setMsg('');
    try {
      const r = await connect.mutateAsync();
      if (!r.cancelled) setMsg(`${r.imported} conta(s) importada(s) do sandbox.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao conectar');
    }
  }

  async function onSync(a: Account) {
    setError(''); setMsg(''); setSyncing(a.id);
    try {
      const r = await sync.mutateAsync(a);
      setMsg(r.inserted === 0 ? 'Nada novo por aqui.' : `${r.inserted} lançamento(s) importado(s).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao sincronizar');
    } finally {
      setSyncing(null);
    }
  }

  return (
    <>
      <h1 className="mb-4 text-[26px] font-semibold tracking-tight">Contas</h1>

      <Card accent>
        <p className="text-[11px] uppercase tracking-[0.1em] text-ink-faint">Total</p>
        <p className="mt-1.5 font-mono text-[26px] font-bold text-gold-bright">{formatBRL(total)}</p>
      </Card>

      <Button full className="mt-3 md:max-w-[420px]" onClick={onConnect} disabled={connect.isPending}>
        {connect.isPending ? 'Abrindo Pluggy…' : '+ Conectar banco'}
      </Button>
      <p className="mt-2 text-center text-[11.5px] text-ink-faint">Ambiente sandbox — use os conectores de teste do Pluggy.</p>

      {msg && <p className="mt-3 rounded-xl border border-gold/30 bg-gold/10 px-3 py-2.5 text-[13px] text-gold-bright">{msg}</p>}
      {error && <p className="alert mt-3">{error}</p>}

      <SectionTitle>Conectadas</SectionTitle>
      {isLoading && <Loading rows={2} />}
      {isError && <ErrorState message="Não foi possível carregar as contas." onRetry={() => refetch()} />}
      {!isLoading && !isError && accounts.length === 0 && (
        <EmptyState title="Nenhuma conta conectada ainda." hint="Conecte um banco do sandbox para importar saldos e lançamentos." />
      )}

      <div className="flex flex-col gap-2 md:grid md:grid-cols-2">
        {accounts.map((a) => (
          <Card key={a.id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[15px]">{a.banco ?? 'Conta'}</p>
                <p className="text-[11.5px] text-ink-faint">{a.tipo ?? '—'} · {a.moeda}</p>
              </div>
              <span className="font-mono text-[15px]">{formatBRL(a.saldo)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">
                {a.external_id ? 'open finance' : 'manual'}
              </span>
              {a.external_id && (
                <Button size="sm" variant="ghost" onClick={() => onSync(a)} disabled={syncing === a.id}>
                  {syncing === a.id ? 'Sincronizando…' : 'Sincronizar'}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <SectionTitle>Casa</SectionTitle>
      <Card className="flex flex-col gap-3">
        <p className="text-[14.5px]">{household?.nome}</p>
        <p className="text-[13px] text-ink-muted">Código de convite <span className="font-mono text-gold">{household?.invite_code}</span></p>
        <Link to="/categorias" className="text-[13.5px]">Gerenciar categorias →</Link>
        <Link to="/regras" className="text-[13.5px]">Regras de categorização →</Link>
      </Card>

      <Button variant="ghost" full className="mt-4" onClick={() => signOut()}>Sair</Button>
    </>
  );
}
