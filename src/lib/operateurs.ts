import type { Operateur } from '@/db/types';

export const OPERATEURS: { key: Operateur; nom: string; couleur: string }[] = [
  { key: 'orange', nom: 'Orange Money', couleur: 'orange' },
  { key: 'mvola', nom: 'Mvola', couleur: 'mvola' },
  { key: 'airtel', nom: 'Airtel Money', couleur: 'airtel' },
];

export function operateurNom(o: Operateur): string {
  return OPERATEURS.find((x) => x.key === o)?.nom ?? o;
}

export function operateurCouleur(o: Operateur): string {
  return OPERATEURS.find((x) => x.key === o)?.couleur ?? 'slate';
}
