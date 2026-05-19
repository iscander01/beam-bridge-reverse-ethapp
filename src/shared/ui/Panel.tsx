import type { ReactNode } from 'react';

export function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-bg-800/70 p-4 shadow-panel backdrop-blur sm:p-6">
      {children}
    </div>
  );
}

