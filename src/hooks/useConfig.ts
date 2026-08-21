import { db } from '@/db/db';
import type { Config } from '@/db/types';
import { useLiveQuery } from 'dexie-react-hooks';

/** Lecture seule de la config via liveQuery — aucune écriture. */
export function useConfig(): Config | undefined {
  return useLiveQuery(() => db.config.get(1), [], undefined);
}
