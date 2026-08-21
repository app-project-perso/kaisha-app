import { useEffect, useState } from 'react';
import { AppShell } from '@/components/ui/AppShell';
import { useConfig } from '@/hooks/useConfig';
import { useAuth } from '@/hooks/useAuth';
import { ensureConfig, isLocalDBEmpty } from '@/db/db';
import { restoreFromCloud } from '@/lib/restore';
import { startAutoSync, refreshPendingCount, trySync } from '@/lib/sync';
import { AuthScreen } from '@/screens/AuthScreen';
import { Onboarding } from '@/screens/Onboarding';
import { Home } from '@/screens/Home';
import { NewTransaction } from '@/screens/NewTransaction';
import { Closure } from '@/screens/Closure';
import { History } from '@/screens/History';
import { Wallet } from 'lucide-react';

type Screen = 'home' | 'transaction' | 'closure' | 'history';

export default function App() {
  const { session, loading: authLoading } = useAuth();
  const config = useConfig();
  const [screen, setScreen] = useState<Screen>('home');
  const [initialized, setInitialized] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const goHome = () => setScreen('home');

  // Bloquer le scroll pull-to-refresh sur mobile pendant la saisie
  useEffect(() => {
    document.body.style.overscrollBehaviorY = 'none';
  }, []);

  // Quand l'utilisateur est connecté : initialise IndexedDB, restaure depuis le cloud si nécessaire, démarre la synchro
  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    (async () => {
      setRestoring(true);
      try {
        const empty = await isLocalDBEmpty();
        if (empty) {
          await restoreFromCloud();
        }
      } catch (err) {
        console.warn('[restore] Échec de restauration cloud:', err);
      }
      if (cancelled) return;

      await ensureConfig();
      setInitialized(true);
      setRestoring(false);

      await refreshPendingCount();
      trySync();
    })();

    const stopSync = startAutoSync();
    return () => {
      cancelled = true;
      stopSync();
    };
  }, [session]);

  // Reset l'init quand l'utilisateur se déconnecte
  useEffect(() => {
    if (!session) {
      setInitialized(false);
    }
  }, [session]);

  // 1. Auth loading
  if (authLoading) {
    return (
      <AppShell>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-3 border-slate-300 border-t-sky-500" />
            <p className="text-sm text-slate-400">Chargement…</p>
          </div>
        </div>
      </AppShell>
    );
  }

  // 2. Pas de session → écran de connexion
  if (!session) {
    return <AuthScreen />;
  }

  // 3. Restauration en cours
  if (restoring) {
    return (
      <AppShell>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-white">
              <Wallet size={24} />
            </div>
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-300 border-t-sky-500" />
            <p className="text-sm text-slate-400">Récupération de vos données…</p>
          </div>
        </div>
      </AppShell>
    );
  }

  // 4. Initialisation IndexedDB
  if (!initialized || !config) {
    return (
      <AppShell>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-3 border-slate-300 border-t-sky-500" />
            <p className="text-sm text-slate-400">Chargement de la caisse…</p>
          </div>
        </div>
      </AppShell>
    );
  }

  // 5. Onboarding si pas terminé
  if (!config.onboarding_termine) {
    return <Onboarding />;
  }

  // 6. Application
  return (
    <AppShell>
      {screen === 'home' && (
        <Home
          config={config}
          onNewTransaction={() => setScreen('transaction')}
          onClosure={() => setScreen('closure')}
          onHistory={() => setScreen('history')}
        />
      )}
      {screen === 'transaction' && (
        <NewTransaction config={config} onDone={goHome} onBack={goHome} />
      )}
      {screen === 'closure' && <Closure config={config} onDone={goHome} onBack={goHome} />}
      {screen === 'history' && <History onBack={goHome} />}
    </AppShell>
  );
}
