import type { InputHTMLAttributes } from 'react';

export function Input({ label, error, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <div className="mb-2 text-xs font-extrabold tracking-[0.22em] text-white/70">{label}</div>
      <input
        {...props}
        className={
          'w-full rounded-xl border bg-black/10 px-4 py-3 text-sm text-white outline-none transition ' +
          (error ? 'border-red-400/60 focus:border-red-300' : 'border-white/10 focus:border-white/30')
        }
      />
      {error ? <div className="mt-2 text-xs text-red-300">{error}</div> : null}
    </label>
  );
}

