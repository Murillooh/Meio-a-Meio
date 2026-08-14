export function Splash() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-[#f9f3ea]">
      <img 
        src="/splash-bg.png" 
        alt="Carregando..." 
        className="w-full h-full object-cover absolute inset-0"
      />
      {/* Barra de progresso animada sobre a imagem (na parte inferior) */}
      <div className="absolute bottom-12 left-1/2 w-48 -translate-x-1/2 overflow-hidden rounded-full bg-black/20 md:bottom-20 md:w-64">
        <div className="h-1.5 w-1/2 rounded-full animate-[indeterminate_1.5s_infinite_ease-in-out] bg-gold" />
      </div>
    </div>
  );
}
