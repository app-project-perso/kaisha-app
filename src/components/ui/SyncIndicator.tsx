import { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { subscribeSyncState, refreshPendingCount, trySync, type SyncState } from '@/lib/sync';

export function SyncIndicator() {
  const [state, setState] = useState<SyncState>({ pending: 0, syncing: false, lastSyncAt: null });

  useEffect(() => {
    const unsub = subscribeSyncState(setState);
    refreshPendingCount();
    return unsub;
  }, []);

  const handleSync = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    trySync();
  };

  if (state.syncing) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-600">
        <RefreshCw size={12} className="animate-spin" />
        Synchro…
      </span>
    );
  }

  if (state.pending > 0) {
    return (
      <button
        onClick={handleSync}
        className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-600 no-tap transition active:scale-95"
        title="Touchez pour synchroniser maintenant"
      >
        <CloudOff size={12} />
        {state.pending} en attente
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
      <Cloud size={12} />
      Synchronisé
    </span>
  );
}
