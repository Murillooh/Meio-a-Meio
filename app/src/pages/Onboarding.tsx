import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Screen } from '@/components/Screen';
import type { Papel } from '@/types';

type Step = 'choose' | 'create' | 'invite' | 'join';

export default function Onboarding() {
  const { user, household, createHousehold, joinHousehold, signOut } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('choose');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Papel | null>(null);
  const [code, setCode] = useState('');
  const [invite, setInvite] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!user) return <Navigate to="/login" replace />;
  if (household && step !== 'invite') return <Navigate to="/" replace />;

  const roleClass = (active: boolean) =>
    'h-[52px] rounded-xl text-base font-semibold ' +
    (active ? 'border border-gold bg-gold-dim text-gold-bright' : 'border border-base-line bg-base-card text-ink-muted');

  async function onCreate() {
    if (!name.trim()) return setError('Dê um nome para a casa.');
    if (!role) return setError('Escolha se você é pai ou mãe.');
    setBusy(true); setError('');
    try {
      const hh = await createHousehold(name.trim(), role);
      setInvite(hh.invite_code);
      setStep('invite');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar a casa');
    } finally { setBusy(false); }
  }

  async function onJoin() {
    if (code.length !== 6) return setError('O código tem 6 caracteres.');
    setBusy(true); setError('');
    try {
      await joinHousehold(code);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao entrar na casa');
    } finally { setBusy(false); }
  }

  if (step === 'choose') return (
    <Screen>
      <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-gold">Passo 1 de 2</p>
      <h1 className="mt-2.5 text-[27px] font-semibold tracking-tight">Olá, {user.email?.split('@')[0]}</h1>
      <p className="mt-2 text-[15px] text-ink-muted">Você ainda não faz parte de uma casa. Comece uma nova ou entre na casa de quem te convidou.</p>
      <div className="mt-7 flex flex-col gap-3.5">
        <button onClick={() => setStep('create')} className="rounded-2xl border border-gold/35 bg-gradient-to-br from-gold/10 to-transparent p-5 text-left hover:border-gold">
          <span className="block text-[17px] font-semibold">Criar uma nova casa</span>
          <span className="mt-1.5 block text-[13.5px] text-ink-muted">Você define o nome e recebe um código para convidar o resto da família.</span>
        </button>
        <button onClick={() => setStep('join')} className="card text-left hover:border-white/25">
          <span className="block text-[17px] font-semibold">Entrar com código de convite</span>
          <span className="mt-1.5 block text-[13.5px] text-ink-muted">Tenho um código de 6 caracteres.</span>
        </button>
      </div>
      <p className="mt-auto pt-8 text-center text-xs text-ink-faint">
        Entrou como {user.email} · <button onClick={() => signOut()} className="text-gold">sair</button>
      </p>
    </Screen>
  );

  if (step === 'create') return (
    <Screen>
      <button onClick={() => setStep('choose')} className="self-start text-sm text-ink-muted">← Voltar</button>
      <h1 className="mt-5 text-[27px] font-semibold tracking-tight">Nova casa</h1>
      <p className="mt-2 text-[15px] text-ink-muted">Dê um nome e diga qual é o seu papel.</p>
      <label className="mt-7 text-xs uppercase tracking-[0.1em] text-ink-faint">Nome da casa</label>
      <input className="field mt-2.5" placeholder="Casa dos Almeida" value={name} onChange={(e) => setName(e.target.value)} />
      <span className="mt-6 text-xs uppercase tracking-[0.1em] text-ink-faint">Seu papel</span>
      <div className="mt-2.5 grid grid-cols-2 gap-3">
        <button className={roleClass(role === 'pai')} onClick={() => setRole('pai')}>Pai</button>
        <button className={roleClass(role === 'mae')} onClick={() => setRole('mae')}>Mãe</button>
      </div>
      {error && <p className="alert mt-4">{error}</p>}
      <button className="btn-gold mt-auto" onClick={onCreate} disabled={busy}>Criar casa</button>
    </Screen>
  );

  if (step === 'invite') return (
    <Screen center>
      <p className="text-center text-[13px] font-semibold uppercase tracking-[0.08em] text-gold">Casa criada</p>
      <h1 className="mt-2.5 text-center text-[27px] font-semibold tracking-tight">{name || household?.nome}</h1>
      <p className="mt-2 text-center text-[15px] text-ink-muted">Compartilhe este código com quem mora com você.</p>
      <div className="mt-8 flex flex-col items-center gap-3.5 rounded-3xl border border-dashed border-gold/50 bg-gold/10 px-4 py-6">
        <span className="font-mono text-[40px] font-bold tracking-[0.16em] text-gold-bright">{invite || household?.invite_code}</span>
        <button className="rounded-xl border border-gold/40 px-4 py-2 text-[13.5px] font-semibold text-gold-bright" onClick={() => navigator.clipboard.writeText(invite)}>Copiar código</button>
      </div>
      <button className="btn-gold mt-7" onClick={() => navigate('/', { replace: true })}>Ir para a casa</button>
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
      {error && <p className="alert mt-4">{error}</p>}
      <p className="mt-4 text-xs text-ink-faint">Seu papel é definido por quem criou a casa depois que você entrar.</p>
      <button className="btn-gold mt-auto" onClick={onJoin} disabled={busy}>Entrar na casa</button>
    </Screen>
  );
}
