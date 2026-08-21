export type Operateur = 'orange' | 'mvola' | 'airtel';
export type TypeTransaction = 'depot' | 'retrait';
export type SyncStatus = 'local_only' | 'synced';

export interface Config {
  id: number;
  cash_solde_initial: number;
  orange_solde_initial: number;
  mvola_solde_initial: number;
  airtel_solde_initial: number;
  cash_seuil_alerte: number;
  orange_seuil_alerte: number;
  mvola_seuil_alerte: number;
  airtel_seuil_alerte: number;
  onboarding_termine: boolean;
}

export interface Transaction {
  id: string;
  operateur: Operateur;
  type: TypeTransaction;
  montant: number;
  date_heure: string;
  cloture_id: string | null;
  numero_telephone?: string;
  sync_status: SyncStatus;
}

export interface Ecarts {
  cash: number;
  orange: number;
  mvola: number;
  airtel: number;
}

export interface Cloture {
  id: string;
  date: string;
  cash_calcule: number;
  orange_calcule: number;
  mvola_calcule: number;
  airtel_calcule: number;
  cash_reel: number;
  orange_reel: number;
  mvola_reel: number;
  airtel_reel: number;
  ecarts: Ecarts;
  nb_transactions: number;
  volume_total: number;
  sync_status: SyncStatus;
}

export const CONFIG_ID = 1;
export const SEUIL_DEFAUT = 20000;

export const DEFAULT_CONFIG: Config = {
  id: CONFIG_ID,
  cash_solde_initial: 0,
  orange_solde_initial: 0,
  mvola_solde_initial: 0,
  airtel_solde_initial: 0,
  cash_seuil_alerte: SEUIL_DEFAUT,
  orange_seuil_alerte: SEUIL_DEFAUT,
  mvola_seuil_alerte: SEUIL_DEFAUT,
  airtel_seuil_alerte: SEUIL_DEFAUT,
  onboarding_termine: false,
};
