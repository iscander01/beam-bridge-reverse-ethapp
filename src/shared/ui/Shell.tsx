import { Outlet, Link, useLocation } from 'react-router-dom';
import { WalletPill } from './WalletPill';
import { NetworkPill } from './NetworkPill';
import { BeamLogo } from './BeamLogo';

export function Shell() {
  const loc = useLocation();

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
          <NavLink to="/" active={loc.pathname === '/'} label="Overview" />
          <NavLink to="/send" active={loc.pathname.startsWith('/send')} label="Send" />
          <NavLink to="/receive" active={loc.pathname.startsWith('/receive')} label="Receive" />
        </nav>

        <main className="mt-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavLink({ to, active, label }: { to: string; active: boolean; label: string }) {
  return (
    <Link
      to={to}
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
