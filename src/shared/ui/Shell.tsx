'use client';

import { WalletPill } from './WalletPill';
import { NetworkPill } from './NetworkPill';
import { BeamLogo } from './BeamLogo';

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BeamLogo />
            <div>
              <div className="text-2xl font-extrabold tracking-tight">BEAM Bridge</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <WalletPill />
            <NetworkPill />
          </div>
        </header>

        <main className="mt-8">{children}</main>
      </div>
    </div>
  );
}
