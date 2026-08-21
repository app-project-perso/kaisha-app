import type { Cloture, Config, Operateur, Transaction, TypeTransaction } from '@/db/types';
import { db } from '@/db/db';

export type Soldes = {
  cash: number;
  orange: number;
  mvola: number;
  airtel: number;
};

export type Seuils = {
  cash: number;
  orange: number;
  mvola: number;
  airtel: number;
};

export type SoldeKey = keyof Soldes;

/**
 * Calcule les soldes courants à partir du solde initial (config)
 * + somme des transactions NON clôturées (cloture_id === null).
 *
 * Dépôt  : client donne cash → reçoit e-money   => cash + montant, opérateur - montant
 * Retrait: client donne e-money → reçoit cash   => cash - montant, opérateur + montant
 */
export async function computeSoldes(config: Config): Promise<Soldes> {
  const all = await db.transactions.toArray();
  const txs = all.filter((t) => t.cloture_id === null);

  const soldes: Soldes = {
    cash: config.cash_solde_initial,
    orange: config.orange_solde_initial,
    mvola: config.mvola_solde_initial,
    airtel: config.airtel_solde_initial,
  };

  for (const t of txs) {
    if (t.type === 'depot') {
      soldes.cash += t.montant;
      soldes[t.operateur] -= t.montant;
    } else {
      soldes.cash -= t.montant;
      soldes[t.operateur] += t.montant;
    }
  }
  return soldes;
}

export function getSeuils(config: Config): Seuils {
  return {
    cash: config.cash_seuil_alerte,
    orange: config.orange_seuil_alerte,
    mvola: config.mvola_seuil_alerte,
    airtel: config.airtel_seuil_alerte,
  };
}

export type JourneeStats = {
  nb: number;
  volume: number;
  nbDepots: number;
  nbRetraits: number;
  volumeDepots: number;
  volumeRetraits: number;
  parOperateur: Record<Operateur, { nb: number; volume: number }>;
};

export async function getJourneeCourante(): Promise<JourneeStats> {
  const txs = (await db.transactions.toArray()).filter((t) => t.cloture_id === null);
  const stats: JourneeStats = {
    nb: txs.length,
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
  for (const t of txs) {
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
}

/**
 * Applique une transaction hypothétique et renvoie les soldes résultants.
 */
export function simulateTransaction(
  soldes: Soldes,
  operateur: Operateur,
  type: TypeTransaction,
  montant: number,
): Soldes {
  const next = { ...soldes };
  if (type === 'depot') {
    next.cash += montant;
    next[operateur] -= montant;
  } else {
    next.cash -= montant;
    next[operateur] += montant;
  }
  return next;
}

export function seuilStatut(solde: number, seuil: number): 'ok' | 'bas' {
  return solde < seuil ? 'bas' : 'ok';
}

export type AlerteInfo = {
  soldeKey: SoldeKey;
  nouveauSolde: number;
  raison: 'seuil' | 'negatif' | 'seuil+negatif';
} | null;

/**
 * Détermine si une alerte doit être affichée pour une transaction donnée.
 * Alerte si : nouveau solde < 0 OU nouveau solde < seuil d'alerte.
 */
export function calculerAlerte(
  soldes: Soldes,
  seuils: Seuils,
  operateur: Operateur,
  type: TypeTransaction,
  montant: number,
): AlerteInfo {
  const next = simulateTransaction(soldes, operateur, type, montant);
  const alertes: AlerteInfo[] = [];

  // Solde cash impacté dans les deux cas
  const cashBas = next.cash < seuils.cash;
  const cashNeg = next.cash < 0;
  if (cashNeg || cashBas) {
    alertes.push({
      soldeKey: 'cash',
      nouveauSolde: next.cash,
      raison: cashNeg ? (cashBas ? 'seuil+negatif' : 'negatif') : 'seuil',
    });
  }

  // Solde opérateur impacté
  const opBas = next[operateur] < seuils[operateur];
  const opNeg = next[operateur] < 0;
  if (opNeg || opBas) {
    alertes.push({
      soldeKey: operateur,
      nouveauSolde: next[operateur],
      raison: opNeg ? (opBas ? 'seuil+negatif' : 'negatif') : 'seuil',
    });
  }

  // Priorité : négatif d'abord, puis seuil. On renvoie la première alerte (cash prioritaire).
  return alertes[0] ?? null;
}

export function genereUuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function enregistrerTransaction(
  operateur: Operateur,
  type: TypeTransaction,
  montant: number,
  numero_telephone?: string,
): Promise<Transaction> {
  const tx: Transaction = {
    id: genereUuid(),
    operateur,
    type,
    montant,
    date_heure: new Date().toISOString(),
    cloture_id: null,
    sync_status: 'local_only',
    ...(numero_telephone ? { numero_telephone } : {}),
  };
  await db.transactions.add(tx);
  return tx;
}

/**
 * Valide une clôture :
 * 1. Calcule les soldes théoriques (config initiale + txs ouvertes).
 * 2. Enregistre la clôture avec les valeurs réelles saisies + écarts.
 * 3. Marque toutes les transactions ouvertes comme clôturées (cloture_id = id clôture).
 * 4. Ajuste la config : les soldes réels saisis deviennent les nouveaux soldes initiaux,
 *    de sorte que la prochaine journée reparte des valeurs réelles comptées.
 *    (Approche "ajuster config" — recommandée pour V1.)
 */
export async function validerCloture(reel: Soldes): Promise<Cloture> {
  const config = (await db.config.get(1))!;
  const calcule = await computeSoldes(config);
  const txs = (await db.transactions.toArray()).filter((t) => t.cloture_id === null);

  const clotureId = genereUuid();
  const cloture: Cloture = {
    id: clotureId,
    date: new Date().toISOString().slice(0, 10),
    cash_calcule: calcule.cash,
    orange_calcule: calcule.orange,
    mvola_calcule: calcule.mvola,
    airtel_calcule: calcule.airtel,
    cash_reel: reel.cash,
    orange_reel: reel.orange,
    mvola_reel: reel.mvola,
    airtel_reel: reel.airtel,
    ecarts: {
      cash: reel.cash - calcule.cash,
      orange: reel.orange - calcule.orange,
      mvola: reel.mvola - calcule.mvola,
      airtel: reel.airtel - calcule.airtel,
    },
    nb_transactions: txs.length,
    volume_total: txs.reduce((s, t) => s + t.montant, 0),
    sync_status: 'local_only',
  };

  await db.transaction('rw', db.clotures, db.transactions, db.config, async () => {
    await db.clotures.add(cloture);
    for (const t of txs) {
      await db.transactions.update(t.id, { cloture_id: clotureId, sync_status: 'local_only' });
    }
    await db.config.update(1, {
      cash_solde_initial: reel.cash,
      orange_solde_initial: reel.orange,
      mvola_solde_initial: reel.mvola,
      airtel_solde_initial: reel.airtel,
    });
  });

  return cloture;
}
