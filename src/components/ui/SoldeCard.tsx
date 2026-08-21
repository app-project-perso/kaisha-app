import type { SoldeKey } from '@/lib/caisse';
import { operateurTheme } from '@/lib/theme';
import type { Operateur } from '@/db/types';
import { Badge } from './Badge';
import { formatAr } from '@/lib/format';
import { Check, AlertTriangle } from 'lucide-react';

interface Props {
  soldeKey: SoldeKey;
  label: string;
  sub?: string;
  solde: number;
  seuil: number;
  operateur?: Operateur;
  icon?: React.ReactNode;
}

export function SoldeCard({ soldeKey, label, sub, solde, seuil, operateur, icon }: Props) {
  const theme = operateur ? operateurTheme(operateur) : null;
  const bas = solde < seuil;
  const negatif = solde < 0;

  const accentBg = theme ? `${theme.bgSoft}` : 'bg-white';
  const accentText = theme ? theme.text : 'text-slate-900';
  const accentBorder = theme ? theme.border : 'border-slate-200';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${accentBorder} ${accentBg} p-4 shadow-card transition`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && (
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${theme ? `${theme.bg} text-white` : 'bg-slate-800 text-white'}`}>
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-700">{label}</p>
            {sub && <p className="truncate text-xs text-slate-400">{sub}</p>}
          </div>
        </div>
        <Badge tone={bas ? 'bas' : 'ok'}>
          {bas ? (
            <>
              <AlertTriangle size={12} /> Bas
            </>
          ) : (
            <>
              <Check size={12} /> OK
            </>
          )}
        </Badge>
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span
          className={`text-2xl font-bold tabular-nums tracking-tight ${
            negatif ? 'text-red-600' : accentText
          }`}
        >
          {formatAr(solde)}
        </span>
      </div>
    </div>
  );
}
