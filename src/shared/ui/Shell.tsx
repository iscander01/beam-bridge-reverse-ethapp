'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletPill } from './WalletPill';
import { NetworkPill } from './NetworkPill';
import { BeamLogo } from './BeamLogo';

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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

        <nav className="mt-8 flex items-center gap-2">
          <NavLink href="/" active={pathname === '/'} label="Overview" />
          <NavLink href="/send" active={pathname.startsWith('/send')} label="Send" />
          <NavLink href="/receive" active={pathname.startsWith('/receive')} label="Receive" />
        </nav>

        <main className="mt-8">{children}</main>
      </div>
    </div>
  );
}

function NavLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={
        'rounded-pill border px-4 py-2 text-sm font-semibold transition ' +
        (active
          ? 'border-white/30 bg-white/10 text-white'
          : 'border-white/15 bg-black/10 text-white/70 hover:bg-white/10 hover:text-white')
      }
    >
      {label}
    </Link>
  );
}
