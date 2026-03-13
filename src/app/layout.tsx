import type { Metadata } from 'next';
import './globals.css';
import 'react-toastify/dist/ReactToastify.css';
import { Providers } from './providers';
import { Shell } from '@/shared/ui/Shell';

export const metadata: Metadata = {
  title: 'BEAM Bridge',
  description: 'Bridge assets between Ethereum networks and Beam.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}

