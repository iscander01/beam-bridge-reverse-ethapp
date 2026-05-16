'use client';

import Link from 'next/link';
import { WalletPill } from './WalletPill';
import { NetworkPill } from './NetworkPill';
import { BeamLogo } from './BeamLogo';

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <BeamLogo />
            <div>
              <div className="text-2xl font-extrabold tracking-tight">BEAM Bridge</div>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <WalletPill />
            <NetworkPill />
          </div>
        </header>

        <main className="mt-8">{children}</main>

        <footer className="mt-16 border-t border-white/10 pt-8 text-sm text-white/50">
          <div className="flex items-center justify-between">
            <div>© 2026 BeamX DAO. All Rights Reserved.</div>
            <div className="flex items-center gap-4">
              <a 
                href="https://beam.mw/downloads" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-white/70 transition-colors"
              >
                Download Wallet
              </a>
              <a 
                href="https://beam.mw/privacy-policy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-white/70 transition-colors"
              >
                Privacy Policy
              </a>
              <a 
                href="https://t.me/BeamSupport" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-white/70 transition-colors"
              >
                Support
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
