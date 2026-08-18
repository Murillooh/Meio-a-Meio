import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Screen } from '@/components/Screen';

type Step = 'choose' | 'create' | 'invite' | 'join';

const SUGESTOES = ['Pai', 'Mãe', 'Namorado(a)', 'Amigo(a)'];

export default function Onboarding() {
  const { user, household, createHousehold, joinHousehold, signOut } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // ?add=1: usuário já tem grupo e veio de Configurações pra criar/entrar em outro
  const adding = params.get('add') === '1';
  const [step, setStep] = useState<Step>('choose');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [code, setCode] = useState('');
  const [joinRole, setJoinRole] = useState('');
  const [invite, setInvite] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!user) return <Navigate to="/login" replace />;
  if (household && !adding && step !== 'invite') return <Navigate to="/" replace />;

  const done = () => navigate(adding ? '/ajustes' : '/', { replace: true });

  async function onCreate() {
    if (!name.trim()) return setError('Dê um nome para o grupo.');
    if (!role.trim()) return setError('Diz como te chamam nesse grupo.');
    setBusy(true); setError('');
    try {
      const hh = await createHousehold(name.trim(), role.trim());
      setInvite(hh.invite_code);
      setStep('invite');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Falha ao criar o grupo');
    } finally { setBusy(false); }
  }

  async function onJoin() {
    if (code.length !== 6) return setError('O código tem 6 caracteres.');
    if (!joinRole.trim()) return setError('Diz como te chamam nesse grupo.');
    setBusy(true); setError('');
    try {
      await joinHousehold(code, joinRole.trim());
      done();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Falha ao entrar no grupo');
    } finally { setBusy(false); }
  }

  const roleChips = (value: string, onChange: (v: string) => void) => (
    <div className="mt-2.5 flex flex-wrap gap-2">
      {SUGESTOES.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={'h-8 rounded-full border px-3.5 text-[13px] font-medium transition-colors ' +
            (value === s ? 'border-accent bg-accent-dim text-accent-bright' : 'border-base-line text-ink-faint hover:text-ink')}
        >
          {s}
        </button>
      ))}
    </div>
  );

  if (step === 'choose') return (
    <Screen>
      <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-gold">{adding ? 'Novo grupo' : 'Passo 1 de 2'}</p>
      <h1 className="mt-2.5 text-[27px] font-semibold tracking-tight">Olá, {user.email?.split('@')[0]}</h1>
      <p className="mt-2 text-[15px] text-ink-muted">
        {adding
          ? 'Crie um novo grupo ou entre em um com um código de convite.'
          : 'Você ainda não faz parte de um grupo. Comece um novo ou entre no grupo de quem te convidou.'}
      </p>
      <div className="mt-7 flex flex-col gap-3.5">
        <button onClick={() => setStep('create')} className="rounded-2xl border border-gold/35 bg-gradient-to-br from-gold/10 to-transparent p-5 text-left hover:border-gold">
          <span className="block text-[17px] font-semibold">Criar um novo grupo</span>
          <span className="mt-1.5 block text-[13.5px] text-ink-muted">Você define o nome e recebe um código pra convidar quem quiser.</span>
        </button>
        <button onClick={() => setStep('join')} className="card text-left hover:border-white/25">
          <span className="block text-[17px] font-semibold">Entrar com código de convite</span>
          <span className="mt-1.5 block text-[13.5px] text-ink-muted">Tenho um código de 6 caracteres.</span>
        </button>
      </div>
      {adding ? (
        <button onClick={() => navigate('/ajustes')} className="mt-auto pt-8 text-center text-[13.5px] text-ink-faint">← Voltar pra Configurações</button>
      ) : (
        <p className="mt-auto pt-8 text-center text-xs text-ink-faint">
          Entrou como {user.email} · <button onClick={() => signOut()} className="text-gold">sair</button>
        </p>
      )}
    </Screen>
  );

  if (step === 'create') return (
    <Screen>
      <div className="flex animate-[slideIn_0.5s_ease-out] flex-col h-full w-full">
        <style>{`
          @keyframes slideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes popIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        `}</style>

        <button onClick={() => setStep('choose')} className="-ml-3 mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-transparent text-ink-muted transition-colors hover:bg-base-line/30 active:scale-95" aria-label="Voltar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>

        <h1 className="text-[32px] font-bold tracking-tight text-ink">Novo grupo</h1>
        <p className="mt-2.5 text-[15.5px] leading-relaxed text-ink-muted">Dê um nome pro grupo e diz como te chamam nele.</p>

        <div className="mt-8 flex flex-col gap-7">
          <div>
            <label className="mb-2.5 ml-1 block text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">Nome do grupo</label>
            <div className="relative flex items-center">
              <svg className="absolute left-4 text-ink-faint" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <input
                className="field pl-11 bg-base-card/40 shadow-sm transition-all focus:bg-base-card focus:shadow-md"
                placeholder="Ex: Família Silva, Eu e a Bia, República 402"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          <div>
            <label className="mb-2.5 ml-1 block text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">Como te chamam nesse grupo?</label>
            <input
              className="field bg-base-card/40 shadow-sm transition-all focus:bg-base-card focus:shadow-md"
              placeholder="Ex: Mãe, Pai, Namorado(a), Você"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              autoComplete="off"
            />
            {roleChips(role, setRole)}
          </div>
        </div>

        {error && (
          <div className="mt-6 flex animate-[popIn_0.3s_ease-out] items-center gap-2.5 rounded-2xl border border-alert-line bg-alert-bg px-4 py-3 text-[13.5px] font-medium text-alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        <div className="mt-auto pt-8">
          <button className="btn-gold w-full text-[16px] shadow-[0_8px_20px_-6px_rgba(240,160,106,0.4)]" onClick={onCreate} disabled={busy}>
            {busy ? 'Criando...' : 'Criar grupo'}
          </button>
        </div>
      </div>
    </Screen>
  );

  if (step === 'invite') return (
    <Screen center>
      <p className="text-center text-[13px] font-semibold uppercase tracking-[0.08em] text-gold">Grupo criado</p>
      <h1 className="mt-2.5 text-center text-[27px] font-semibold tracking-tight">{name || household?.nome}</h1>
      <p className="mt-2 text-center text-[15px] text-ink-muted">Compartilhe este código com quem você quiser no grupo.</p>
      <div className="mt-8 flex flex-col items-center gap-3.5 rounded-3xl border border-dashed border-gold/50 bg-gold/10 px-4 py-6">
        <span className="font-mono text-[40px] font-bold tracking-[0.16em] text-gold-bright">{invite || household?.invite_code}</span>
        <button className="rounded-xl border border-gold/40 px-4 py-2 text-[13.5px] font-semibold text-gold-bright" onClick={() => navigator.clipboard.writeText(invite)}>Copiar código</button>
      </div>
      <button className="btn-gold mt-7" onClick={done}>Ir pro grupo</button>
    </Screen>
  );

  return (
    <Screen>
      <button onClick={() => setStep('choose')} className="self-start text-sm text-ink-muted">← Voltar</button>
      <h1 className="mt-5 text-[27px] font-semibold tracking-tight">Código de convite</h1>
      <p className="mt-2 text-[15px] text-ink-muted">Digite os 6 caracteres que você recebeu.</p>
      <input
        className="mt-7 h-[70px] rounded-2xl border border-base-line bg-base-card text-center font-mono text-[32px] font-bold tracking-[0.18em] text-gold-bright outline-none focus:border-gold"
        placeholder="A1B2C3" maxLength={6} value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
      />
      <label className="mt-6 mb-2.5 ml-1 block text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">Como te chamam nesse grupo?</label>
      <input
        className="field"
        placeholder="Ex: Mãe, Pai, Namorado(a), Você"
        value={joinRole}
        onChange={(e) => setJoinRole(e.target.value)}
        autoComplete="off"
      />
      {roleChips(joinRole, setJoinRole)}
      {error && <p className="alert mt-4">{error}</p>}
      <button className="btn-gold mt-auto" onClick={onJoin} disabled={busy}>Entrar no grupo</button>
    </Screen>
  );
}
