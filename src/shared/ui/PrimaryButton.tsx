import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function PrimaryButton({
  children,
  tone,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone: 'pink' | 'blue' | 'mint';
}) {
  const toneClass =
    tone === 'pink'
      ? 'from-beam-pink to-beam-pink/60 shadow-glowPink hover:shadow-glowPink'
      : tone === 'blue'
      ? 'from-beam-blue to-beam-blue/60 shadow-glowBlue hover:shadow-glowBlue'
      : 'from-beam-mint/70 to-beam-mint/30';

  return (
    <button
      {...props}
      className={
        'rounded-pill bg-gradient-to-r px-5 py-3 text-sm font-extrabold tracking-wide text-white transition hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 ' +
        toneClass +
        ' ' +
        (className ?? '')
      }
    >
      {children}
    </button>
  );
}

