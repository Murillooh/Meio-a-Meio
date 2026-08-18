import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/States';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useAccounts, useCategories, useMembers, useRemoveMember } from '@/hooks/useHouseholdData';
import { useCategoryRules } from '@/hooks/useCategoryRules';
import { useEmergencyFund } from '@/hooks/useEmergency';
import { useTheme } from '@/lib/ThemeContext';
import { supabase } from '@/lib/supabase';
import { subscribeToPush, unsubscribeFromPush, getPushSubscriptionStatus } from '@/lib/push';
import { formatBRL, papelLabel } from '@/lib/format';
import type { Member, Papel } from '@/types';

/** Lista de configurações: grupos de linhas rótulo → valor, no estilo iOS. */
export default function Settings() {
  const { user, member, household, households, switchHousehold, deleteHousehold, signOut, refreshMembership } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { data: members = [], isLoading: loadingMembers } = useMembers();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const { data: rules = [] } = useCategoryRules();
  const { data: fund } = useEmergencyFund();
  const removeMember = useRemoveMember();

  const isCreator = !!household && household.created_by === user?.id;

  const [nome, setNome] = useState(member?.nome ?? '');
  const [papel, setPapel] = useState(member?.papel ?? '');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);

  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    getPushSubscriptionStatus().then(setPushEnabled);
  }, []);

  // ao trocar de grupo ativo, os campos de perfil precisam refletir o membro do novo grupo
  useEffect(() => {
    setNome(member?.nome ?? '');
    setPapel(member?.papel ?? '');
  }, [member?.id]);

  const saldo = accounts.reduce((s, a) => s + Number(a.saldo ?? 0), 0);
  const meses = fund?.despesa_mensal_media
    ? (Number(fund.meta_valor) / Number(fund.despesa_mensal_media)).toFixed(1).replace('.', ',')
    : null;

  async function salvar(patch: { nome?: string | null; papel?: Papel | null }) {
    if (!member) return;
    setError('');
    const { error: e } = await supabase.from('members').update(patch).eq('id', member.id);
    if (e) return setError(e.message);
    await refreshMembership();
  }

  async function togglePush() {
    if (!user || !household) return;
    setPushLoading(true);
    setError('');
    try {
      if (pushEnabled) {
        await unsubscribeFromPush(user.id);
        setPushEnabled(false);
      } else {
        if (!('Notification' in window)) {
          throw new Error('Este navegador não suporta notificações. No iPhone, adicione o app à Tela de Início (Compartilhar > Adicionar à Tela de Início).');
        }
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          await subscribeToPush(user.id, household.id);
          setPushEnabled(true);
        } else {
          setError('Permissão para notificações foi negada.');
        }
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPushLoading(false);
    }
  }

  return (
    <>
      <p className="text-[11px] uppercase tracking-[0.11em] text-ink-faint">grupo, pessoas e regras</p>
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
            className="min-w-0 flex-1 rounded-xl border border-base-line bg-base px-3 py-2 text-left text-[14.5px] text-ink outline-none focus:border-accent"
          />
        </Row>
        <Row divider>
          <span className="shrink-0 text-[14.5px]">Como te chamam</span>
          <input
            value={papel}
            onChange={(e) => setPapel(e.target.value)}
            onBlur={() => salvar({ papel: papel.trim() || null })}
            placeholder="Ex: Mãe, Pai, Namorado(a)"
            className="min-w-0 flex-1 rounded-xl border border-base-line bg-base px-3 py-2 text-left text-[14.5px] text-ink outline-none focus:border-accent"
          />
        </Row>
      </Group>

      <Group label="Meus grupos">
        {households.map(({ household: hh, member: m }) => (
          <button
            key={hh.id}
            onClick={() => switchHousehold(hh.id)}
            className={'flex min-h-[56px] w-full items-center gap-3 border-t border-base-line px-4 py-2.5 text-left first:border-t-0 transition-colors ' +
              (hh.id === household?.id ? 'bg-accent-dim' : 'hover:bg-white/5')}
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14.5px]">{hh.nome}</span>
              <span className="mt-0.5 block text-[11.5px] text-ink-faint">{papelLabel(m.papel)}</span>
            </span>
            {hh.id === household?.id && <span aria-hidden className="text-accent">●</span>}
          </button>
        ))}
        <button
          onClick={() => navigate('/onboarding?add=1')}
          className="flex min-h-[56px] w-full items-center gap-3 border-t border-base-line px-4 py-2.5 text-left text-[14.5px] text-accent transition-colors hover:bg-white/5"
        >
          + Criar ou entrar em outro grupo
        </button>
      </Group>

      <Group label={household?.nome ?? 'Meu grupo'}>
        <Row>
          <span className="min-w-0 flex-1">
            <span className="block text-[14.5px]">Código de convite</span>
            <span className="mt-0.5 block text-[11.5px] text-ink-faint">pra quem você quiser convidar</span>
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
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14.5px]">{m.nome ?? papelLabel(m.papel)}</span>
              <span className="mt-0.5 block truncate text-[11.5px] text-ink-faint">{papelLabel(m.papel)}</span>
            </span>
            {isCreator && m.id !== member?.id && (
              <button
                onClick={() => setRemoveTarget(m)}
                className="shrink-0 rounded-lg border border-alert-line px-2.5 py-1.5 text-[12px] font-medium text-alert transition-colors hover:bg-alert-bg"
              >
                Remover
              </button>
            )}
          </Row>
        ))}
        {isCreator && (
          <button
            onClick={() => setConfirmDeleteGroup(true)}
            className="flex min-h-[48px] w-full items-center border-t border-base-line px-4 py-2.5 text-left text-[13.5px] text-alert transition-colors hover:bg-alert-bg/40"
          >
            Excluir este grupo
          </button>
        )}
      </Group>

      <Modal open={!!removeTarget} title="Remover pessoa" onClose={() => setRemoveTarget(null)}>
        <p className="text-[14.5px] text-ink-muted">
          Remover <strong className="text-ink">{removeTarget?.nome ?? papelLabel(removeTarget?.papel)}</strong> do grupo? Os lançamentos dela continuam no histórico, só deixam de ter uma pessoa vinculada.
        </p>
        {error && <p className="alert mt-4">{error}</p>}
        <div className="mt-5 flex gap-3">
          <Button variant="ghost" full onClick={() => setRemoveTarget(null)}>Cancelar</Button>
          <Button
            variant="danger"
            full
            disabled={removeMember.isPending}
            onClick={async () => {
              if (!removeTarget) return;
              setError('');
              try {
                await removeMember.mutateAsync(removeTarget.id);
                setRemoveTarget(null);
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Não foi possível remover');
              }
            }}
          >
            {removeMember.isPending ? 'Removendo…' : 'Remover'}
          </Button>
        </div>
      </Modal>

      <Modal open={confirmDeleteGroup} title="Excluir grupo" onClose={() => setConfirmDeleteGroup(false)}>
        <p className="text-[14.5px] text-ink-muted">
          Isso apaga <strong className="text-ink">{household?.nome}</strong> pra sempre: transações, categorias, contas e reserva de todo mundo. Não dá pra desfazer.
        </p>
        {error && <p className="alert mt-4">{error}</p>}
        <div className="mt-5 flex gap-3">
          <Button variant="ghost" full onClick={() => setConfirmDeleteGroup(false)}>Cancelar</Button>
          <Button
            variant="danger"
            full
            disabled={deletingGroup}
            onClick={async () => {
              setError('');
              setDeletingGroup(true);
              try {
                await deleteHousehold();
                setConfirmDeleteGroup(false);
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Não foi possível excluir o grupo');
              } finally {
                setDeletingGroup(false);
              }
            }}
          >
            {deletingGroup ? 'Excluindo…' : 'Excluir pra sempre'}
          </Button>
        </div>
      </Modal>

      <Group label="Notificações">
        <Row>
          <span className="flex-1">
            <span className="block text-[14.5px]">Avisos e Lembretes</span>
            <span className="mt-0.5 block text-[11.5px] text-ink-faint">Seja avisado quando algo for adicionado</span>
          </span>
          <button 
            onClick={togglePush} 
            disabled={pushLoading}
            className={'relative inline-flex h-[31px] w-[51px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ' + (pushEnabled ? 'bg-accent' : 'bg-base-line')}
          >
            <span className={'pointer-events-none inline-block h-[27px] w-[27px] transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ' + (pushEnabled ? 'translate-x-[20px]' : 'translate-x-0')} />
          </button>
        </Row>
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
      <p className="mt-4 text-center text-[11.5px] text-ink-faint">Grupo · dados de sandbox · v0.1</p>
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
