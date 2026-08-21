import Dexie, { type Table } from 'dexie';
import { CONFIG_ID, DEFAULT_CONFIG, type Cloture, type Config, type Transaction } from './types';

export class CaisseDB extends Dexie {
  config!: Table<Config, number>;
  transactions!: Table<Transaction, string>;
  clotures!: Table<Cloture, string>;

  constructor() {
    super('caisse-agent-db');
    this.version(1).stores({
      config: 'id',
      transactions: 'id, operateur, type, date_heure, cloture_id',
      clotures: 'id, date',
    });
    // v2 : ajout du champ numero_telephone (pas de changement d'index)
    this.version(2).stores({
      config: 'id',
      transactions: 'id, operateur, type, date_heure, cloture_id',
      clotures: 'id, date',
    });
    // v3 : ajout de sync_status sur transactions et clotures (nouvel index pour requêter les local_only)
    this.version(3).stores({
      config: 'id',
      transactions: 'id, operateur, type, date_heure, cloture_id, sync_status',
      clotures: 'id, date, sync_status',
    });
  }
}

export const db = new CaisseDB();

/** Lecture seule — utilisable dans un liveQuery. */
export async function getConfig(): Promise<Config | undefined> {
  return db.config.get(CONFIG_ID);
}

/** Initialise la config par défaut si elle n'existe pas. À appeler en dehors d'un liveQuery. */
export async function ensureConfig(): Promise<void> {
  const existing = await db.config.get(CONFIG_ID);
  if (!existing) {
    await db.config.put({ ...DEFAULT_CONFIG });
  }
}

export async function saveConfig(patch: Partial<Config>): Promise<void> {
  await db.config.update(CONFIG_ID, patch);
}

/** Vérifie si IndexedDB est totalement vide (pas de transactions ni clotures). */
export async function isLocalDBEmpty(): Promise<boolean> {
  const txCount = await db.transactions.count();
  const clCount = await db.clotures.count();
  return txCount === 0 && clCount === 0;
}
