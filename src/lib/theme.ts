import type { Operateur } from '@/db/types';

type Cfg = {
  bg: string;
  bgSoft: string;
  text: string;
  textDark: string;
  border: string;
  ring: string;
  gradient: string;
  shadow: string;
};

export function operateurTheme(o: Operateur): Cfg {
  switch (o) {
    case 'orange':
      return {
        bg: 'bg-orange-500',
        bgSoft: 'bg-orange-50',
        text: 'text-orange-700',
        textDark: 'text-orange-600',
        border: 'border-orange-200',
        ring: 'ring-orange-500',
        gradient: 'from-orange-500 to-orange-600',
        shadow: 'shadow-orange-500/30',
      };
    case 'mvola':
      return {
        bg: 'bg-mvola-500',
        bgSoft: 'bg-mvola-50',
        text: 'text-mvola-700',
        textDark: 'text-mvola-600',
        border: 'border-mvola-200',
        ring: 'ring-mvola-500',
        gradient: 'from-mvola-400 to-mvola-600',
        shadow: 'shadow-mvola-500/30',
      };
    case 'airtel':
      return {
        bg: 'bg-airtel-600',
        bgSoft: 'bg-airtel-50',
        text: 'text-airtel-700',
        textDark: 'text-airtel-600',
        border: 'border-airtel-200',
        ring: 'ring-airtel-500',
        gradient: 'from-airtel-500 to-airtel-700',
        shadow: 'shadow-airtel-500/30',
      };
  }
}

export const SOLDE_LABELS: Record<string, { label: string; sub?: string }> = {
  cash: { label: 'Cash en caisse', sub: 'Espèces physiques' },
  orange: { label: 'Orange Money' },
  mvola: { label: 'Mvola' },
  airtel: { label: 'Airtel Money' },
};
