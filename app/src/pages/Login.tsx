import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Screen } from '@/components/Screen';

export default function Login() {
  const { user, signInWithPassword, signUpWithPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'in') await signInWithPassword(email, password);
      else await signUpWithPassword(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen center>
      <div className="mb-9 flex flex-col items-center gap-2.5">
        <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-gold to-[#8c6a0c] text-2xl font-bold text-base">C</div>
        <h1 className="text-[26px] font-semibold tracking-tight">Casa</h1>
        <p className="text-center text-sm text-ink-muted">A rotina da família em um só lugar</p>
      </div>



      <form onSubmit={submit} className="flex flex-col gap-3">
        <input className="field" type="email" placeholder="e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="field" type="password" placeholder="senha" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        {error && <p className="alert">{error}</p>}
        <button className="btn-gold mt-1" disabled={busy}>{mode === 'in' ? 'Entrar' : 'Criar conta'}</button>
      </form>

      <p className="mt-5 text-center text-[13px] text-ink-muted">
        {mode === 'in' ? 'Não tem conta? ' : 'Já tem conta? '}
        <button type="button" className="text-gold hover:text-gold-bright" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
          {mode === 'in' ? 'Criar agora' : 'Entrar'}
        </button>
      </p>
    </Screen>
  );
}
