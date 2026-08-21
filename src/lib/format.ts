const GROUPING = [3];
const SEP = ' ';

/** Formate un montant en Ariary avec séparateurs de milliers (espaces). */
export function formatAr(n: number): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(Math.round(n));
  const digits = abs.toString();
  let out = '';
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % GROUPING[0] === 0) out += SEP;
    out += digits[i];
  }
  return `${sign}${out} Ar`;
}

export function formatArCourt(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}${(n / 1_000_000).toFixed(1).replace('.0', '')}M Ar`;
  if (abs >= 1_000) return `${sign}${Math.round(n / 1000)}k Ar`;
  return formatAr(n);
}

export function formatDateCourte(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export function formatHeure(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function formatJourLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}
