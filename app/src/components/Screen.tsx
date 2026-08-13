import type { ReactNode } from 'react';

export function Screen({ children, center = false }: { children: ReactNode; center?: boolean }) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-[420px] flex-col px-7 pb-[calc(40px+env(safe-area-inset-bottom))] pt-14" data-center={center}>
      <div className={center ? 'flex flex-1 flex-col justify-center' : 'flex flex-1 flex-col'}>{children}</div>
    </div>
  );
}
