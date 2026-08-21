import type { Config } from '@/db/types';
import { useJourneeCourante, useSeuils, useSoldes } from '@/hooks/useCaisse';
import { SoldeCard } from '@/components/ui/SoldeCard';
import { Button } from '@/components/ui/Button';
import { SyncIndicator } from '@/components/ui/SyncIndicator';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { formatAr } from '@/lib/format';
import { Plus, History, Lock, Wallet, Smartphone, TrendingUp, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { Operateur } from '@/db/types';

interface Props {
  config: Config;
  onNewTransaction: () => void;
  onClosure: () => void;
  onHistory: () => void;
}

const OP_ICONS: Record<Operateur, React.ReactNode> = {
  orange: <Smartphone size={18} />,
  mvola: <Smartphone size={18} />,
  airtel: <Smartphone size={18} />,
};

export function Home({ config, onNewTransaction, onClosure, onHistory }: Props) {
  const soldes = useSoldes(config);
  const seuils = useSeuils(config);
  const journee = useJourneeCourante();

  if (!soldes || !seuils) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-slate-400">Chargement…</p>
      </div>
    );
  }

  const hasActivity = journee && journee.nb > 0;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-900 text-white pt-safe">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">Caisse Agent</p>
              <p className="text-[11px] text-slate-400">Mobile Money</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SyncIndicator />
            <OfflineIndicator />
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 py-4">
        {/* Section soldes */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Soldes actuels</h2>
          </div>
          <div className="space-y-2.5">
            <SoldeCard
              soldeKey="cash"
              label="Cash en caisse"
              sub="Espèces physiques"
              solde={soldes.cash}
              seuil={seuils.cash}
              icon={<Wallet size={18} />}
            />
            <SoldeCard
              soldeKey="orange"
              label="Orange Money"
              solde={soldes.orange}
              seuil={seuils.orange}
              operateur="orange"
              icon={OP_ICONS.orange}
            />
            <SoldeCard
              soldeKey="mvola"
              label="Mvola"
              solde={soldes.mvola}
              seuil={seuils.mvola}
              operateur="mvola"
              icon={OP_ICONS.mvola}
            />
            <SoldeCard
              soldeKey="airtel"
              label="Airtel Money"
              solde={soldes.airtel}
              seuil={seuils.airtel}
              operateur="airtel"
              icon={OP_ICONS.airtel}
            />
          </div>
        </div>

        {/* Bouton principal */}
        <div className="pt-1">
          <Button
            size="xl"
            fullWidth
            onClick={onNewTransaction}
            className="bg-sky-500 hover:bg-sky-600 shadow-card-lg shadow-sky-500/30"
          >
            <Plus size={24} /> Nouvelle transaction
          </Button>
        </div>

        {/* Résumé journée */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Journée en cours
            </h3>
            {hasActivity && (
              <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-600">
                {journee.nb} {journee.nb === 1 ? 'transaction' : 'transactions'}
              </span>
            )}
          </div>

          {hasActivity ? (
            <>
              <div className="mt-3 flex items-end gap-2">
                <TrendingUp size={18} className="text-slate-400" />
                <span className="text-2xl font-bold tabular-nums text-slate-900">
                  {formatAr(journee.volume)}
                </span>
                <span className="mb-1 text-xs text-slate-400">volume total</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-emerald-50 p-2.5">
                  <div className="flex items-center gap-1.5 text-emerald-700">
                    <ArrowDownLeft size={14} />
                    <span className="text-xs font-semibold">Dépôts</span>
                  </div>
                  <p className="mt-0.5 text-sm font-bold tabular-nums text-emerald-700">
                    {journee.nbDepots} • {formatAr(journee.volumeDepots)}
                  </p>
                </div>
                <div className="rounded-xl bg-rose-50 p-2.5">
                  <div className="flex items-center gap-1.5 text-rose-700">
                    <ArrowUpRight size={14} />
                    <span className="text-xs font-semibold">Retraits</span>
                  </div>
                  <p className="mt-0.5 text-sm font-bold tabular-nums text-rose-700">
                    {journee.nbRetraits} • {formatAr(journee.volumeRetraits)}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-3 rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-sm text-slate-400">
                Aucune transaction depuis la dernière clôture.
              </p>
            </div>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="secondary" size="md" onClick={onHistory}>
              <History size={18} /> Historique
            </Button>
            <Button variant="secondary" size="md" onClick={onClosure}>
              <Lock size={18} /> Clôture
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
