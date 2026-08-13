import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/States';
import { useAuth } from '@/hooks/useAuth';
import { useAccounts, useCategories, useMembers } from '@/hooks/useHouseholdData';
import { useCategoryRules } from '@/hooks/useCategoryRules';
import { useEmergencyFund } from '@/hooks/useEmergency';
import { useTheme } from '@/lib/ThemeContext';
import { supabase } from '@/lib/supabase';
import { formatBRL, papelLabel } from '@/lib/format';
import type { Papel } from '@/types';

/** Lista de configurações: grupos de linhas rótulo → valor, no estilo iOS. */
export default function Settings() {
  const { user, member, household, signOut, refreshMembership } = useAuth();
  const { theme, setTheme } = useTheme();
  const { data: members = [], isLoading: loadingMembers } = useMembers();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const { data: rules = [] } = useCategoryRules();
  const { data: fund } = useEmergencyFund();

  const [nome, setNome] = useState(member?.nome ?? '');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const saldo = accounts.reduce((s, a) => s + Number(a.saldo ?? 0), 0);
  const meses = fund?.despesa_mensal_media
    ? (Number(fund.meta_valor) / Number(fund.despesa_mensal_media)).toFixed(1).replace('.', ',')
    : null;

  async function salvar(patch: { nome?: string | null; papel?: Papel }) {
    if (!member) return;
    setError('');
    const { error: e } = await supabase.from('members').update(patch).eq('id', member.id);
    if (e) return setError(e.message);
    await refreshMembership();
  }

  return (
    <>
      <p className="text-[11px] uppercase tracking-[0.11em] text-ink-faint">casa, pessoas e regras</p>
      <h1 className="mt-1 text-[26px] font-semibold tracking-tight">Configurações</h1>

      <header className="mt-5 flex items-center gap-3.5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-[19px] font-bold text-accent-ink">
          {(member?.nome ?? user?.email ?? '?').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[18px] font-semibold">{member?.nome ?? user?.email?.split('@')[0]}</p>
          <p className="mt-0.5 truncate text-[12.5px] text-ink-faint">{user?.email} · {papelLabel(member?.papel)}</p>
        </div>
      </header>

      <Group label="Perfil">
        <Row>
          <span className="shrink-0 text-[14.5px]">Nome</span>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onBlur={() => salvar({ nome: nome.trim() || null })}
            placeholder={user?.email?.split('@')[0]}
            className="min-w-0 flex-1 rounded-xl border border-base-line bg-base px-3 py-2 text-right text-[14.5px] text-ink outline-none focus:border-accent"
          />
        </Row>
        <Row divider>
          <span className="flex-1 text-[14.5px]">Papel na casa</span>
          <div className="flex gap-1.5 rounded-xl bg-base p-1">
            {(['pai', 'mae'] as Papel[]).map((p) => (
              <button
                key={p}
                onClick={() => salvar({ papel: p })}
                aria-pressed={member?.papel === p}
                className={'h-8 min-w-[56px] rounded-[10px] px-3 text-[13px] font-semibold transition-colors ' +
                  (member?.papel === p ? 'bg-base-card text-accent shadow' : 'text-ink-faint')}
              >
                {papelLabel(p)}
              </button>
            ))}
          </div>
        </Row>
      </Group>

      <Group label={household?.nome ?? 'A casa'}>
        <Row>
          <span className="min-w-0 flex-1">
            <span className="block text-[14.5px]">Código de convite</span>
            <span className="mt-0.5 block text-[11.5px] text-ink-faint">para quem mora com você</span>
          </span>
          <span className="text-[16px] font-bold tracking-[0.12em] text-accent">{household?.invite_code}</span>
          <button
            onClick={() => { navigator.clipboard.writeText(household?.invite_code ?? ''); setCopied(true); }}
            className="h-9 rounded-xl border border-accent/30 bg-accent-dim px-3 text-[12.5px] font-semibold text-accent"
          >
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </Row>
        {loadingMembers && <div className="p-4"><Loading rows={1} /></div>}
        {members.map((m) => (
          <Row key={m.id} divider>
            <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-accent-dim text-[12px] font-bold text-accent">
              {(m.nome ?? papelLabel(m.papel)).charAt(0).toUpperCase()}
            </div>
            <span className="flex-1 truncate text-[14.5px]">{m.nome ?? papelLabel(m.papel)}</span>
            <span className="text-[12.5px] text-ink-faint">{papelLabel(m.papel)}</span>
          </Row>
        ))}
      </Group>

      <Group label="Aparência">
        {([
          { id: 'escuro', label: 'Noite acolhedora', swatch: '#1c1512', accent: '#f0a06a' },
          { id: 'claro', label: 'Caderno de cozinha', swatch: '#faf6ef', accent: '#c05f3c' },
        ] as const).map((o, i) => (
          <button
            key={o.id}
            onClick={() => setTheme(o.id)}
            role="radio"
            aria-checked={theme === o.id}
            className={'flex min-h-[56px] w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ' +
              (i ? 'border-t border-base-line ' : '') + (theme === o.id ? 'bg-accent-dim' : '')}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-base-line" style={{ background: o.swatch }}>
              <span className="h-3 w-3 rounded-full" style={{ background: o.accent }} />
            </span>
            <span className="flex-1 text-[14.5px]">{o.label}</span>
            <span aria-hidden className={theme === o.id ? 'text-accent' : 'text-transparent'}>●</span>
          </button>
        ))}
      </Group>

      <Group label="Organização">
        <RowLink to="/categorias" title="Categorias e regras" detail={categories.length + ' categorias · ' + rules.length + ' regras'} />
        <RowLink to="/contas" title="Bancos e contas" detail={accounts.length + ' conectadas · ' + formatBRL(saldo)} divider />
        <RowLink to="/cofrinho" title="Meta da reserva" detail={fund?.meta_valor ? formatBRL(Number(fund.meta_valor)) + (meses ? ' · ' + meses + ' meses' : '') : 'não definida'} divider />
        <RowLink to="/transacoes" title="Todos os lançamentos" detail="ver por mês, conta e autor" divider />
      </Group>

      {error && <p className="alert mt-4">{error}</p>}

      <Button variant="ghost" full className="mt-6" onClick={() => signOut()}>Sair desta conta</Button>
      <p className="mt-4 text-center text-[11.5px] text-ink-faint">Casa · dados de sandbox · v0.1</p>
    </>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mx-1 mb-2 text-[11px] font-semibold uppercase tracking-[0.11em] text-ink-faint">{label}</h2>
      <div className="overflow-hidden rounded-2xl border border-base-line bg-base-card" style={{ boxShadow: 'var(--card-shadow)' }}>
        {children}
      </div>
    </section>
  );
}

function Row({ children, divider }: { children: React.ReactNode; divider?: boolean }) {
  return (
    <div className={'flex min-h-[56px] items-center gap-2.5 px-4 py-2.5 ' + (divider ? 'border-t border-base-line' : '')}>
      {children}
    </div>
  );
}

function RowLink({ to, title, detail, divider }: { to: string; title: string; detail: string; divider?: boolean }) {
  return (
    <Link to={to} className={'flex min-h-[56px] items-center gap-3 px-4 py-2.5 text-ink transition-colors hover:bg-accent-dim ' + (divider ? 'border-t border-base-line' : '')}>
      <span className="flex-1">
        <span className="block text-[14.5px]">{title}</span>
        <span className="mt-0.5 block text-[11.5px] text-ink-faint">{detail}</span>
      </span>
      <span aria-hidden className="text-ink-faint">›</span>
    </Link>
  );
}
