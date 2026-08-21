import { useState } from 'react';
import type { Config } from '@/db/types';
import { useJourneeCourante, useSoldes } from '@/hooks/useCaisse';
import { ScreenHeader } from '@/components/ui/AppShell';
import { Button } from '@/components/ui/Button';
import { NumericKeypad, formatKeypadValue } from '@/components/ui/NumericKeypad';
import { formatAr } from '@/lib/format';
import { operateurTheme } from '@/lib/theme';
import { OPERATEURS } from '@/lib/operateurs';
import type { SoldeKey } from '@/lib/caisse';
import { validerCloture } from '@/lib/caisse';
import {
  Wallet,
  Smartphone,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Lock,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

interface Props {
  config: Config;
  onDone: () => void;
  onBack: () => void;
}

type Field = SoldeKey;

const FIELDS: { key: Field; label: string; icon: React.ReactNode; operateur?: 'orange' | 'mvola' | 'airtel' }[] = [
  { key: 'cash', label: 'Cash compté', icon: <Wallet size={18} /> },
  { key: 'orange', label: 'Orange Money', icon: <Smartphone size={18} />, operateur: 'orange' },
  { key: 'mvola', label: 'Mvola', icon: <Smartphone size={18} />, operateur: 'mvola' },
  { key: 'airtel', label: 'Airtel Money', icon: <Smartphone size={18} />, operateur: 'airtel' },
];

export function Closure({ config, onDone, onBack }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const soldes = useSoldes(config);
  const journee = useJourneeCourante();
  const [reel, setReel] = useState<Record<Field, string>>({ cash: '', orange: '', mvola: '', airtel: '' });
  const [activeField, setActiveField] = useState<Field>('cash');
  const [validating, setValidating] = useState(false);

  if (!soldes || !journee) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-slate-400">Chargement…</p>
      </div>
    );
  }

  const currentVal = reel[activeField];
  const setVal = (v: string) => setReel((r) => ({ ...r, [activeField]: v }));

  const reelNum: Record<Field, number> = {
    cash: Number(reel.cash),
    orange: Number(reel.orange),
    mvola: Number(reel.mvola),
    airtel: Number(reel.airtel),
  };

  const ecarts: Record<Field, number> = {
    cash: reelNum.cash - soldes.cash,
    orange: reelNum.orange - soldes.orange,
    mvola: reelNum.mvola - soldes.mvola,
    airtel: reelNum.airtel - soldes.airtel,
  };

  const hasEcarts = Object.values(ecarts).some((e) => Math.abs(e) > 0);
  const allReelFilled = FIELDS.every((f) => reel[f.key].length > 0);

  const handleValider = async () => {
    setValidating(true);
    await validerCloture({
      cash: reelNum.cash,
      orange: reelNum.orange,
      mvola: reelNum.mvola,
      airtel: reelNum.airtel,
    });
    setValidating(false);
    onDone();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <ScreenHeader
        title="Clôture de journée"
        subtitle={step === 1 ? 'Résumé automatique' : 'Rapprochement'}
        onBack={step === 1 ? onBack : () => setStep(1)}
      />

      <div className="flex flex-1 flex-col px-4 py-3">
        {/* ÉTAPE 1 : Résumé */}
        {step === 1 && (
          <div className="flex flex-1 flex-col animate-slide-up">
            {/* Soldes calculés */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Soldes calculés
              </h3>
              <div className="mt-3 space-y-2">
                {FIELDS.map((f) => {
                  const th = f.operateur ? operateurTheme(f.operateur) : null;
                  return (
                    <div key={f.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            th ? th.bg : 'bg-slate-800'
                          } text-white`}
                        >
                          {f.icon}
                        </span>
                        <span className="text-sm font-medium text-slate-700">{f.label}</span>
                      </div>
                      <span className="text-base font-bold tabular-nums text-slate-900">
                        {formatAr(soldes[f.key])}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stats journée */}
            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Activité de la journée
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <StatBox label="Transactions" value={String(journee.nb)} />
                <StatBox label="Volume total" value={formatAr(journee.volume)} />
                <StatBox
                  label="Dépôts"
                  value={`${journee.nbDepots}`}
                  icon={<ArrowDownLeft size={14} className="text-emerald-600" />}
                  tone="emerald"
                />
                <StatBox
                  label="Retraits"
                  value={`${journee.nbRetraits}`}
                  icon={<ArrowUpRight size={14} className="text-rose-600" />}
                  tone="rose"
                />
              </div>

              {journee.nb > 0 && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-xs font-medium text-slate-400">Répartition par opérateur</p>
                  {OPERATEURS.map((op) => {
                    const s = journee.parOperateur[op.key];
                    if (s.nb === 0) return null;
                    const th = operateurTheme(op.key);
                    return (
                      <div key={op.key} className="flex items-center justify-between text-sm">
                        <span className={`font-medium ${th.text}`}>{op.nom}</span>
                        <span className="tabular-nums text-slate-600">
                          {s.nb} • {formatAr(s.volume)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {journee.nb === 0 && (
              <div className="mt-3 rounded-xl bg-slate-50 p-4 text-center">
                <p className="text-sm text-slate-400">
                  Aucune transaction à clôturer. Vous pouvez tout de même valider la clôture.
                </p>
              </div>
            )}

            <div className="flex-1" />

            <div className="pb-safe pt-3">
              <Button size="xl" fullWidth onClick={() => setStep(2)}>
                Passer au rapprochement <ArrowRight size={20} />
              </Button>
            </div>
          </div>
        )}

        {/* ÉTAPE 2 : Rapprochement */}
        {step === 2 && (
          <div className="flex flex-1 flex-col animate-slide-up">
            <p className="mb-3 text-sm text-slate-500">
              Saisissez les valeurs réellement comptées (cash physique + soldes vérifiés sur les apps).
            </p>

            {/* Grille des champs */}
            <div className="grid grid-cols-2 gap-2.5">
              {FIELDS.map((f) => {
                const val = reel[f.key];
                const active = activeField === f.key;
                const ecart = ecarts[f.key];
                const th = f.operateur ? operateurTheme(f.operateur) : null;
                return (
                  <button
                    key={f.key}
                    onClick={() => setActiveField(f.key)}
                    className={`flex flex-col items-start rounded-2xl border-2 p-3 text-left transition active:scale-[0.98] no-tap ${
                      active
                        ? 'border-sky-500 bg-white shadow-card-lg'
                        : 'border-transparent bg-white shadow-card'
                    }`}
                  >
                    <span
                      className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${
                        th ? th.bg : 'bg-slate-800'
                      } text-white`}
                    >
                      {f.icon}
                    </span>
                    <span className="text-xs font-medium text-slate-500">{f.label}</span>
                    <span className="mt-0.5 text-lg font-bold tabular-nums text-slate-900">
                      {val ? formatAr(Number(val)) : '— Ar'}
                    </span>
                    {val && (
                      <span
                        className={`mt-1 text-xs font-semibold tabular-nums ${
                          ecart === 0
                            ? 'text-emerald-600'
                            : ecart > 0
                              ? 'text-amber-600'
                              : 'text-rose-600'
                        }`}
                      >
                        {ecart === 0 ? 'Conforme' : `Écart ${ecart > 0 ? '+' : ''}${formatAr(ecart)}`}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Affichage valeur en cours */}
            <div className="mt-4 rounded-2xl bg-slate-900 px-4 py-3 text-center">
              <p className="text-xs font-medium text-slate-400">
                {FIELDS.find((f) => f.key === activeField)?.label}
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-white">
                {formatKeypadValue(currentVal)} <span className="text-lg text-slate-400">Ar</span>
              </p>
            </div>

            {/* Tableau écarts si tout rempli */}
            {allReelFilled && (
              <div className="mt-3 animate-fade-in rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
                <h3 className="mb-2 text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  Écarts (réel − calculé)
                </h3>
                <div className="space-y-1.5">
                  {FIELDS.map((f) => {
                    const e = ecarts[f.key];
                    return (
                      <div
                        key={f.key}
                        className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 ${
                          e === 0 ? 'bg-emerald-50' : 'bg-amber-50'
                        }`}
                      >
                        <span className="text-sm font-medium text-slate-700">{f.label}</span>
                        <span
                          className={`text-sm font-bold tabular-nums ${
                            e === 0 ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {e === 0 ? '0 Ar' : `${e > 0 ? '+' : ''}${formatAr(e)}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Alerte si écarts */}
            {allReelFilled && hasEcarts && (
              <div className="mt-3 animate-pop rounded-2xl border-2 border-amber-300 bg-amber-50 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                  <p className="text-sm text-amber-700">
                    Des écarts ont été détectés. Vérifiez les valeurs avant de valider. Les soldes réels
                    deviendront le point de départ de la prochaine journée.
                  </p>
                </div>
              </div>
            )}

            {/* Keypad */}
            <div className="mt-3">
              <NumericKeypad value={currentVal} onChange={setVal} />
            </div>

            {/* Validation */}
            <div className="pb-safe pt-4">
              <Button
                size="xl"
                fullWidth
                variant="success"
                disabled={validating || !allReelFilled}
                onClick={handleValider}
              >
                <Lock size={20} /> {validating ? 'Validation…' : 'Valider la clôture'}
              </Button>
              {!allReelFilled && (
                <p className="mt-1.5 text-center text-xs text-slate-400">
                  Saisissez les 4 valeurs réelles pour valider
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  tone?: 'emerald' | 'rose';
}) {
  const toneCls =
    tone === 'emerald'
      ? 'bg-emerald-50'
      : tone === 'rose'
        ? 'bg-rose-50'
        : 'bg-slate-50';
  return (
    <div className={`rounded-xl ${toneCls} p-2.5`}>
      <div className="flex items-center gap-1 text-xs text-slate-500">
        {icon}
        {label}
      </div>
      <p className="mt-0.5 text-base font-bold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}
