import { useState, useMemo, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import './Login.css';

export default function Login() {
  const { user, signInWithPassword, signUpWithPassword, signInWithApple } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Generate embers for the background animation
  const embers = useMemo(() => {
    return Array.from({ length: 16 }).map((_, i) => {
      const size = 2 + Math.random() * 3;
      const dur = 9 + Math.random() * 8;
      return {
        id: i,
        style: {
          width: `${size}px`,
          height: `${size}px`,
          left: `${4 + Math.random() * 92}%`,
          animationDuration: `${dur}s`,
          animationDelay: `${-Math.random() * dur}s`,
          '--dx': `${Math.random() * 40 - 20}px`,
        } as React.CSSProperties
      };
    });
  }, []);

  // Prevent brown body background from showing during iOS overscroll
  useEffect(() => {
    const originalBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#0b0705';
    return () => {
      document.body.style.backgroundColor = originalBg;
    };
  }, []);

  if (user) return <Navigate to="/" replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'in') {
        await signInWithPassword(email, password);
      } else {
        if (password !== confirmPassword) {
          throw new Error('As senhas não coincidem');
        }
        await signUpWithPassword(email, password, nome, telefone);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível prosseguir');
    } finally {
      setBusy(false);
    }
  }

  const eyeOpen = (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
  const eyeClosed = (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.86 21.86 0 0 1 5.06-6.06M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a21.8 21.8 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

  return (
    <div className="login-container">
      <div className="login-screen">
        <div className="login-aurora">
          <span className="login-blob login-b1"></span>
          <span className="login-blob login-b2"></span>
          <span className="login-blob login-b3"></span>
          <span className="login-blob login-b4"></span>
        </div>
        <div className="login-noise"></div>
        <div className="login-embers">
          {embers.map(e => (
            <span key={e.id} className="login-ember" style={e.style}></span>
          ))}
        </div>
        <div className="login-vignette"></div>

        <div className="login-foreground">
          <div className="login-hero">
            <div className="login-hero-inner">
              <div className="login-badge">
                <span className="login-badge-glow"></span>
                <div className="login-badge-core">
                  <span className="login-badge-shine"></span>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="12" r="7" />
                    <circle cx="15" cy="12" r="7" />
                  </svg>
                </div>
              </div>
              <h1 className="login-wordmark" style={{ fontSize: '36px' }}>Meio a Meio</h1>
              <p className="login-tagline">a rotina da família, em um só lugar</p>
            </div>
          </div>

          <div className="login-card">
            <form onSubmit={submit}>
              {mode === 'up' && (
                <>
                  <div>
                    <p className="login-field-label">Nome Completo</p>
                    <div className="login-field">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      <input 
                        type="text" 
                        placeholder="Seu nome" 
                        autoComplete="name" 
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '14px' }}>
                    <p className="login-field-label">Telefone</p>
                    <div className="login-field">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      <input 
                        type="tel" 
                        placeholder="(11) 90000-0000" 
                        autoComplete="tel" 
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div style={{ marginTop: mode === 'up' ? '14px' : '0' }}>
                <p className="login-field-label">E-mail</p>
                <div className="login-field">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2.5"/>
                    <path d="m3 7 9 6 9-6"/>
                  </svg>
                  <input 
                    type="email" 
                    placeholder="voce@email.com" 
                    autoComplete="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ marginTop: '14px' }}>
                <p className="login-field-label">Senha</p>
                <div className="login-field">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="11" width="14" height="9" rx="2.5"/>
                    <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
                  </svg>
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••" 
                    autoComplete="current-password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button 
                    className="login-eye-toggle" 
                    type="button" 
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? eyeClosed : eyeOpen}
                  </button>
                </div>
              </div>

              {mode === 'up' && (
                <div style={{ marginTop: '14px' }}>
                  <p className="login-field-label">Confirmar Senha</p>
                  <div className="login-field">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="11" width="14" height="9" rx="2.5"/>
                      <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
                    </svg>
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••" 
                      autoComplete="new-password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              )}

              {mode === 'in' && (
                <div className="login-row-end">
                  <span className="login-link-small">Esqueceu sua senha?</span>
                </div>
              )}

              {error && <p className="login-alert">{error}</p>}

              <button type="submit" className="login-btn-primary" disabled={busy}>
                {mode === 'in' ? 'Entrar' : 'Criar conta'}
              </button>
            </form>

            <div className="login-divider"><span className="login-line"></span><span>ou</span><span className="login-line"></span></div>

            <button type="button" onClick={() => signInWithApple?.()} className="login-btn-secondary">
              <svg width="14" height="14" viewBox="0 0 384 512" fill="currentColor">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
              </svg>
              Continuar com a Apple
            </button>

            <p className="login-signup-line">
              {mode === 'in' ? 'Não tem conta? ' : 'Já tem conta? '} 
              <button type="button" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
                {mode === 'in' ? 'Criar agora' : 'Entrar'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
