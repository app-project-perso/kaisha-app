import type { ReactNode } from 'react';

type Tone = 'ok' | 'bas' | 'neutre';

const tones: Record<Tone, string> = {
  ok: 'bg-emerald-100 text-emerald-700',
  bas: 'bg-orange-100 text-orange-700',
  neutre: 'bg-slate-100 text-slate-600',
};

export function Badge({
  tone = 'neutre',
  children,
  className = '',
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
