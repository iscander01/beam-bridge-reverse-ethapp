import type { ReactNode } from 'react';

export function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-bg-800/70 p-6 shadow-panel backdrop-blur">
      {children}
    </div>
  );
}

