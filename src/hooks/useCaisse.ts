import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import type { Config } from '@/db/types';
import { computeSoldes, getJourneeCourante, getSeuils, type JourneeStats, type Seuils, type Soldes } from '@/lib/caisse';

/**
 * Lecture seule des transactions via liveQuery.
 * On utilise db.transactions.toArray() (et non .where('cloture_id').equals('null'))
 * car IndexedDB n'indexe PAS les valeurs null — un .where() sur cloture_id
 * ne détecterait jamais l'ajout d'une transaction avec cloture_id: null,
 * et le liveQuery ne se déclencherait pas.
 * toArray() observe toute la table : toute écriture déclenche un rafraîchissement.
 */
export function useSoldes(config?: Config) {
  const txs = useLiveQuery(() => db.transactions.toArray(), [], []);
  return useMemo<Soldes | null>(() => {
    if (!config || !txs) return null;
    const soldes: Soldes = {
      cash: config.cash_solde_initial,
      orange: config.orange_solde_initial,
      mvola: config.mvola_solde_initial,
      airtel: config.airtel_solde_initial,
    };
    const open = txs.filter((t) => t.cloture_id === null);
    for (const t of open) {
      if (t.type === 'depot') {
        soldes.cash += t.montant;
        soldes[t.operateur] -= t.montant;
      } else {
        soldes.cash -= t.montant;
        soldes[t.operateur] += t.montant;
      }
    }
    return soldes;
  }, [config, txs]);
}

export function useSeuils(config?: Config): Seuils | null {
  return useMemo(() => (config ? getSeuils(config) : null), [config]);
}

export function useJourneeCourante(): JourneeStats | null {
  const txs = useLiveQuery(() => db.transactions.toArray(), [], []);
  return useMemo<JourneeStats | null>(() => {
    if (!txs) return null;
    const open = txs.filter((t) => t.cloture_id === null);
    const stats: JourneeStats = {
      nb: open.length,
      volume: 0,
      nbDepots: 0,
      nbRetraits: 0,
      volumeDepots: 0,
      volumeRetraits: 0,
      parOperateur: {
        orange: { nb: 0, volume: 0 },
        mvola: { nb: 0, volume: 0 },
        airtel: { nb: 0, volume: 0 },
      },
    };
    for (const t of open) {
      stats.volume += t.montant;
      stats.parOperateur[t.operateur].nb += 1;
      stats.parOperateur[t.operateur].volume += t.montant;
      if (t.type === 'depot') {
        stats.nbDepots += 1;
        stats.volumeDepots += t.montant;
      } else {
        stats.nbRetraits += 1;
        stats.volumeRetraits += t.montant;
      }
    }
    return stats;
  }, [txs]);
}

// Keep computeSoldes import used (for non-hook contexts)
export { computeSoldes };
