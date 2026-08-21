import { supabase } from '@/lib/supabase';
import { db, ensureConfig } from '@/db/db';
import type { Cloture, Config, Transaction } from '@/db/types';

type CloudConfig = {
  cash_solde_initial: number;
  orange_solde_initial: number;
  mvola_solde_initial: number;
  airtel_solde_initial: number;
  seuils: { cash: number; orange: number; mvola: number; airtel: number };
  onboarding_termine: boolean;
};

/**
 * Restaure les données depuis Supabase vers IndexedDB.
 * Utilisé quand un agent se connecte sur un nouveau device (IndexedDB vide).
 */
export async function restoreFromCloud(): Promise<boolean> {
  // Vérifie qu'il y a des données dans le cloud
  const { data: cloudConfig, error: configError } = await supabase
    .from('config')
    .select('*')
    .maybeSingle();

  if (configError) throw configError;
  if (!cloudConfig) return false; // Pas de données dans le cloud → nouveau compte

  // 1. Restaure la config locale
  const cc = cloudConfig as CloudConfig;
  const localConfig: Partial<Config> = {
    id: 1,
    cash_solde_initial: Number(cc.cash_solde_initial),
    orange_solde_initial: Number(cc.orange_solde_initial),
    mvola_solde_initial: Number(cc.mvola_solde_initial),
    airtel_solde_initial: Number(cc.airtel_solde_initial),
    cash_seuil_alerte: cc.seuils?.cash ?? 20000,
    orange_seuil_alerte: cc.seuils?.orange ?? 20000,
    mvola_seuil_alerte: cc.seuils?.mvola ?? 20000,
    airtel_seuil_alerte: cc.seuils?.airtel ?? 20000,
    onboarding_termine: cc.onboarding_termine,
  };

  // S'assure que la config locale existe avant de la mettre à jour
  await ensureConfig();
  await db.config.put({ ...(await db.config.get(1))!, ...localConfig } as Config);

  // 2. Restaure les clôtures
  const { data: cloudClotures, error: clError } = await supabase
    .from('clotures')
    .select('*')
    .order('date', { ascending: true });

  if (clError) throw clError;

  if (cloudClotures && cloudClotures.length > 0) {
    const clotures: Cloture[] = cloudClotures.map((c: Record<string, unknown>) => ({
      id: c.id as string,
      date: c.date as string,
      cash_calcule: Number(c.cash_calcule),
      orange_calcule: Number(c.orange_calcule),
      mvola_calcule: Number(c.mvola_calcule),
      airtel_calcule: Number(c.airtel_calcule),
      cash_reel: Number(c.cash_reel),
      orange_reel: Number(c.orange_reel),
      mvola_reel: Number(c.mvola_reel),
      airtel_reel: Number(c.airtel_reel),
      ecarts: c.ecarts as Cloture['ecarts'],
      nb_transactions: c.nb_transactions as number,
      volume_total: Number(c.volume_total),
      sync_status: 'synced',
    }));
    await db.clotures.bulkPut(clotures);
  }

  // 3. Restaure les transactions
  const { data: cloudTxs, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .order('date_heure', { ascending: true });

  if (txError) throw txError;

  if (cloudTxs && cloudTxs.length > 0) {
    const txs: Transaction[] = cloudTxs.map((t: Record<string, unknown>) => ({
      id: t.id as string,
      operateur: t.operateur as Transaction['operateur'],
      type: t.type as Transaction['type'],
      montant: Number(t.montant),
      date_heure: t.date_heure as string,
      numero_telephone: (t.numero_telephone as string) || undefined,
      cloture_id: (t.cloture_id as string) || null,
      sync_status: 'synced',
    }));
    await db.transactions.bulkPut(txs);
  }

  return true;
}
