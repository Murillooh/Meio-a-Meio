export function Splash() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#000000] z-[9999] overflow-hidden">
      {/* Aurora / Glows */}
      <div className="absolute w-[95vw] h-[95vw] top-[-28vw] left-[-32vw] rounded-full blur-[60px] bg-[#8b5cf6]/15 animate-[boot-pulse_8s_ease-in-out_infinite_alternate]" />
      <div className="absolute w-[105vw] h-[105vw] bottom-[-38vw] right-[-36vw] rounded-full blur-[60px] bg-[#3b82f6]/12 animate-[boot-pulse_12s_ease-in-out_infinite_alternate-reverse]" />
      
      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center animate-[boot-fade-in_1.2s_cubic-bezier(0.2,0.8,0.2,1)_both]">
        {/* Badge */}
        <div className="relative w-[130px] h-[130px] mb-8">
          <div className="absolute -inset-3 bg-[#8b5cf6]/25 rounded-full blur-[24px]"></div>
          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-white/5 border border-white/10 backdrop-blur-[8px] overflow-hidden">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 via-transparent to-transparent"></div>
            <div className="relative z-10 font-['Bricolage_Grotesque'] font-bold text-[54px] tracking-[-2px] bg-gradient-to-br from-[#a78bfa] to-[#3b82f6] bg-clip-text text-transparent">MM</div>
          </div>
        </div>

        <h1 className="font-['Fraunces'] font-semibold text-[36px] tracking-[-0.5px] m-0 bg-gradient-to-b from-[#ffffff] to-[#a78bfa] bg-clip-text text-transparent">
          Meio a Meio
        </h1>
        
        {/* Loading bar */}
        <div className="mt-10 w-[120px] h-[2px] bg-white/10 rounded overflow-hidden relative">
          <div className="absolute top-0 left-0 h-full w-[40%] rounded animate-[boot-shimmer_2s_infinite_ease-in-out]" style={{ background: 'linear-gradient(90deg, transparent, #8b5cf6, transparent)' }} />
        </div>
      </div>
    </div>
  );
}
