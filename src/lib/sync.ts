import { supabase } from '@/lib/supabase';
import { db } from '@/db/db';
import type { Cloture, Config, Transaction } from '@/db/types';

/**
 * Vérifie une connexion réseau réelle (pas seulement navigator.onLine).
 * navigator.onLine peut être true même sans connexion réelle (ex: DNS en panne).
 */
export async function checkRealConnectivity(): Promise<boolean> {
  if (!navigator.onLine) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal);
    clearTimeout(timeout);
    return !error;
  } catch {
    return false;
  }
}

export type SyncState = {
  pending: number;
  syncing: boolean;
  lastSyncAt: Date | null;
};

type SyncListener = (state: SyncState) => void;

const listeners = new Set<SyncListener>();
let currentState: SyncState = { pending: 0, syncing: false, lastSyncAt: null };
let syncInterval: ReturnType<typeof setInterval> | null = null;

function setState(next: Partial<SyncState>) {
  currentState = { ...currentState, ...next };
  listeners.forEach((l) => l(currentState));
}

export function subscribeSyncState(listener: SyncListener): () => void {
  listeners.add(listener);
  listener(currentState);
  return () => listeners.delete(listener);
}

export async function refreshPendingCount(): Promise<void> {
  const txPending = await db.transactions.where('sync_status').equals('local_only').count();
  const clPending = await db.clotures.where('sync_status').equals('local_only').count();
  setState({ pending: txPending + clPending });
}

async function syncTransactions(): Promise<number> {
  const localTxs = await db.transactions.where('sync_status').equals('local_only').toArray();
  if (localTxs.length === 0) return 0;

  const rows = localTxs.map((t) => ({
    id: t.id,
    operateur: t.operateur,
    type: t.type,
    montant: t.montant,
    date_heure: t.date_heure,
    numero_telephone: t.numero_telephone ?? null,
    cloture_id: t.cloture_id,
  }));

  const { error } = await supabase.from('transactions').upsert(rows, { onConflict: 'id' });
  if (error) throw error;

  const ids = localTxs.map((t) => t.id);
  await db.transactions.bulkPut(
    localTxs.map((t) => ({ ...t, sync_status: 'synced' as const })),
  );
  return ids.length;
}

async function syncClotures(): Promise<number> {
  const localCl = await db.clotures.where('sync_status').equals('local_only').toArray();
  if (localCl.length === 0) return 0;

  const rows = localCl.map((c) => ({
    id: c.id,
    date: c.date,
    cash_calcule: c.cash_calcule,
    orange_calcule: c.orange_calcule,
    mvola_calcule: c.mvola_calcule,
    airtel_calcule: c.airtel_calcule,
    cash_reel: c.cash_reel,
    orange_reel: c.orange_reel,
    mvola_reel: c.mvola_reel,
    airtel_reel: c.airtel_reel,
    ecarts: c.ecarts,
    nb_transactions: c.nb_transactions,
    volume_total: c.volume_total,
  }));

  const { error } = await supabase.from('clotures').upsert(rows, { onConflict: 'id' });
  if (error) throw error;

  await db.clotures.bulkPut(
    localCl.map((c) => ({ ...c, sync_status: 'synced' as const })),
  );
  return localCl.length;
}

async function syncConfig(): Promise<void> {
  const config = await db.config.get(1);
  if (!config) return;
  const row = {
    cash_solde_initial: config.cash_solde_initial,
    orange_solde_initial: config.orange_solde_initial,
    mvola_solde_initial: config.mvola_solde_initial,
    airtel_solde_initial: config.airtel_solde_initial,
    seuils: {
      cash: config.cash_seuil_alerte,
      orange: config.orange_seuil_alerte,
      mvola: config.mvola_seuil_alerte,
      airtel: config.airtel_seuil_alerte,
    },
    onboarding_termine: config.onboarding_termine,
    updated_at: new Date().toISOString(),
  };
  await supabase.from('config').upsert(row, { onConflict: 'agent_id' });
}

/**
 * Tente une synchronisation complète. Ne lance rien si déjà en cours.
 * Échoue silencieusement (non-bloquant) si le réseau n'est pas disponible.
 */
export async function trySync(): Promise<void> {
  if (currentState.syncing) return;
  const online = await checkRealConnectivity();
  if (!online) return;

  setState({ syncing: true });
  try {
    await syncClotures();
    await syncTransactions();
    await syncConfig();
    setState({ lastSyncAt: new Date() });
  } catch (err) {
    // Échec non-bloquant : on garde les données en local_only pour la prochaine tentative
    console.warn('[sync] Échec de synchro:', err);
  } finally {
    setState({ syncing: false });
    await refreshPendingCount();
  }
}

/** Démarre la synchro automatique en arrière-plan. */
export function startAutoSync(): () => void {
  // Synchro au démarrage (après un court délai pour laisser l'app s'initialiser)
  const initialTimeout = setTimeout(() => trySync(), 2000);

  // Synchro au retour du réseau
  const onOnline = () => trySync();
  window.addEventListener('online', onOnline);

  // Synchro périodique toutes les 5 minutes si en ligne
  syncInterval = setInterval(() => trySync(), 5 * 60 * 1000);

  return () => {
    clearTimeout(initialTimeout);
    window.removeEventListener('online', onOnline);
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = null;
  };
}
