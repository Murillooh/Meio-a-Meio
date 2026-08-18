import { useEffect, useState } from 'react';

// Tipagem para o evento beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Previne que o Chrome mostre o mini-infobar automaticamente
      e.preventDefault();
      // Salva o evento para ser disparado depois
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Mostra o nosso botão customizado
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Dispara o prompt nativo de instalação
    deferredPrompt.prompt();
    
    // Aguarda a resposta do usuário
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstall(false);
    }
    
    // O prompt só pode ser usado uma vez, então descartamos
    setDeferredPrompt(null);
  };

  if (!showInstall) return null;

  return (
    <div className="fixed bottom-[calc(88px+env(safe-area-inset-bottom)+16px)] left-4 right-4 z-[100] md:bottom-6 md:left-auto md:right-6 md:w-80 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-base-card rounded-2xl shadow-lg border border-base-line p-4 flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="font-semibold text-ink text-sm">Instalar App</span>
          <span className="text-ink-muted text-xs leading-tight mt-0.5">
            Adicione à tela inicial para acesso rápido e offline.
          </span>
        </div>
        <button
          onClick={handleInstallClick}
          className="shrink-0 bg-accent text-accent-ink px-4 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
        >
          Instalar
        </button>
      </div>
    </div>
  );
}
