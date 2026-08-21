import { useMemo, useState } from 'react';
import type { Config, Operateur, TypeTransaction } from '@/db/types';
import { useSeuils, useSoldes } from '@/hooks/useCaisse';
import { ScreenHeader } from '@/components/ui/AppShell';
import { Button } from '@/components/ui/Button';
import { NumericKeypad, formatKeypadValue } from '@/components/ui/NumericKeypad';
import { operateurTheme } from '@/lib/theme';
import { calculerAlerte, enregistrerTransaction, simulateTransaction } from '@/lib/caisse';
import { formatAr } from '@/lib/format';
import { OPERATEURS } from '@/lib/operateurs';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Smartphone,
  Check,
  AlertTriangle,
  Wallet,
  ArrowLeft,
} from 'lucide-react';

interface Props {
  config: Config;
  onDone: () => void;
  onBack: () => void;
}

export function NewTransaction({ config, onDone, onBack }: Props) {
  const [step, setStep] = useState(1);
  const [operateur, setOperateur] = useState<Operateur | null>(null);
  const [type, setType] = useState<TypeTransaction | null>(null);
  const [montantStr, setMontantStr] = useState('');
  const [telephone, setTelephone] = useState('');
  const [confirming, setConfirming] = useState(false);

  const soldes = useSoldes(config);
  const seuils = useSeuils(config);

  const montant = montantStr ? Number(montantStr) : 0;
  const alerte = useMemo(() => {
    if (!soldes || !seuils || !operateur || !type || montant <= 0) return null;
    return calculerAlerte(soldes, seuils, operateur, type, montant);
  }, [soldes, seuils, operateur, type, montant]);

  const nouveauSoldes = useMemo(() => {
    if (!soldes || !operateur || !type || montant <= 0) return null;
    return simulateTransaction(soldes, operateur, type, montant);
  }, [soldes, operateur, type, montant]);

  if (!soldes || !seuils) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-slate-400">Chargement…</p>
      </div>
    );
  }

  const goBack = () => {
    if (step === 1) onBack();
    else if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const handleConfirm = async () => {
    if (!operateur || !type || montant <= 0) return;
    setConfirming(true);
    await enregistrerTransaction(operateur, type, montant, telephone.trim() || undefined);
    setConfirming(false);
    onDone();
  };

  const stepLabels = ['Opérateur', 'Type', 'Montant'];

  return (
    <div className="flex min-h-screen flex-col">
      <ScreenHeader
        title="Nouvelle transaction"
        subtitle={`Étape ${step}/3 — ${stepLabels[step - 1]}`}
        onBack={goBack}
      />

      {/* Stepper dots */}
      <div className="flex items-center justify-center gap-1.5 px-4 py-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all ${
              s === step ? 'w-8 bg-sky-500' : s < step ? 'w-4 bg-emerald-400' : 'w-4 bg-slate-300'
            }`}
          />
        ))}
      </div>

      <div className="flex flex-1 flex-col px-4 py-2">
        {/* ÉTAPE 1 : Opérateur */}
        {step === 1 && (
          <div className="flex flex-1 flex-col animate-slide-up">
            <p className="mb-4 text-center text-sm text-slate-500">Choisissez l'opérateur</p>
            <div className="space-y-3">
              {OPERATEURS.map((op) => {
                const th = operateurTheme(op.key);
                return (
                  <button
                    key={op.key}
                    onClick={() => {
                      setOperateur(op.key);
                      setStep(2);
                    }}
                    className={`flex w-full items-center gap-4 rounded-2xl bg-gradient-to-br ${th.gradient} p-5 text-left text-white shadow-card-lg ${th.shadow} transition active:scale-[0.98] no-tap`}
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                      <Smartphone size={28} />
                    </span>
                    <div className="flex-1">
                      <p className="text-lg font-bold">{op.nom}</p>
                      <p className="text-sm text-white/80">
                        Solde : {formatAr(soldes[op.key])}
                      </p>
                    </div>
                    <ArrowLeft size={20} className="rotate-180 opacity-70" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ÉTAPE 2 : Type */}
        {step === 2 && operateur && (
          <div className="flex flex-1 flex-col animate-slide-up">
            <p className="mb-4 text-center text-sm text-slate-500">
              Quel type d'opération sur{' '}
              <span className="font-semibold text-slate-700">
                {OPERATEURS.find((o) => o.key === operateur)?.nom}
              </span>{' '}
              ?
            </p>
            <div className="grid grid-cols-1 gap-3">
              {/* Dépôt */}
              <button
                onClick={() => {
                  setType('depot');
                  setStep(3);
                }}
                className="flex w-full items-center gap-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-left text-white shadow-card-lg shadow-emerald-500/30 transition active:scale-[0.98] no-tap"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                  <ArrowDownLeft size={28} />
                </span>
                <div className="flex-1">
                  <p className="text-lg font-bold">Dépôt</p>
                  <p className="text-sm text-white/80">
                    Client donne du cash, reçoit de l'e-money
                  </p>
                </div>
              </button>

              {/* Retrait */}
              <button
                onClick={() => {
                  setType('retrait');
                  setStep(3);
                }}
                className="flex w-full items-center gap-4 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 p-5 text-left text-white shadow-card-lg shadow-rose-500/30 transition active:scale-[0.98] no-tap"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                  <ArrowUpRight size={28} />
                </span>
                <div className="flex-1">
                  <p className="text-lg font-bold">Retrait</p>
                  <p className="text-sm text-white/80">
                    Client donne de l'e-money, reçoit du cash
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 3 : Montant */}
        {step === 3 && operateur && type && (
          <div className="flex flex-1 flex-col animate-slide-up">
            {/* Résumé contexte */}
            <div className="mb-3 flex items-center justify-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  type === 'depot' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {type === 'depot' ? 'Dépôt' : 'Retrait'}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${operateurTheme(operateur).bgSoft} ${operateurTheme(operateur).text}`}>
                {OPERATEURS.find((o) => o.key === operateur)?.nom}
              </span>
            </div>

            {/* Champ numéro de téléphone (optionnel) */}
            <div className="mb-3">
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Smartphone size={13} /> Numéro de téléphone du client <span className="text-slate-400">(optionnel)</span>
              </label>
              <input
                type="tel"
                inputMode="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="Ex : 034 12 345 67"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-300 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>

            {/* Affichage montant */}
            <div className="rounded-2xl bg-slate-900 px-4 py-4 text-center">
              <p className="text-xs font-medium text-slate-400">Montant</p>
              <p className="mt-1 text-4xl font-bold tabular-nums text-white">
                {formatKeypadValue(montantStr)} <span className="text-xl text-slate-400">Ar</span>
              </p>
            </div>

            {/* Aperçu soldes après */}
            {montant > 0 && nouveauSoldes && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Wallet size={12} /> Cash après
                  </div>
                  <p
                    className={`mt-0.5 text-sm font-bold tabular-nums ${
                      nouveauSoldes.cash < 0 ? 'text-red-600' : 'text-slate-900'
                    }`}
                  >
                    {formatAr(nouveauSoldes.cash)}
                  </p>
                </div>
                <div className={`rounded-xl border p-2.5 ${operateurTheme(operateur).border} ${operateurTheme(operateur).bgSoft}`}>
                  <div className={`flex items-center gap-1 text-xs ${operateurTheme(operateur).text}`}>
                    <Smartphone size={12} /> Opérateur après
                  </div>
                  <p
                    className={`mt-0.5 text-sm font-bold tabular-nums ${
                      nouveauSoldes[operateur] < 0 ? 'text-red-600' : operateurTheme(operateur).textDark
                    }`}
                  >
                    {formatAr(nouveauSoldes[operateur])}
                  </p>
                </div>
              </div>
            )}

            {/* Alerte non-bloquante */}
            {alerte && montant > 0 && (
              <div className="mt-3 animate-pop rounded-2xl border-2 border-amber-300 bg-amber-50 p-3.5">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-800">
                      Attention
                    </p>
                    <p className="mt-0.5 text-sm text-amber-700">
                      Ce {type === 'depot' ? 'dépôt' : 'retrait'} laissera{' '}
                      <span className="font-semibold">
                        {alerte.soldeKey === 'cash'
                          ? 'le cash en caisse'
                          : OPERATEURS.find((o) => o.key === alerte.soldeKey)?.nom}
                      </span>{' '}
                      à <span className="font-bold tabular-nums">{formatAr(alerte.nouveauSolde)}</span> Ar.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Keypad */}
            <div className="mt-3">
              <NumericKeypad value={montantStr} onChange={setMontantStr} />
            </div>

            {/* Boutons action */}
            <div className="mt-4 pb-safe">
              {alerte && montant > 0 ? (
                <div className="space-y-2">
                  <Button
                    size="lg"
                    fullWidth
                    variant="danger"
                    disabled={confirming || montant <= 0}
                    onClick={handleConfirm}
                  >
                    <Check size={20} /> Confirmer quand même
                  </Button>
                  <Button
                    size="md"
                    fullWidth
                    variant="ghost"
                    onClick={() => setMontantStr('')}
                  >
                    Modifier le montant
                  </Button>
                </div>
              ) : (
                <Button
                  size="xl"
                  fullWidth
                  disabled={confirming || montant <= 0}
                  onClick={handleConfirm}
                  className={type === 'depot' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}
                >
                  <Check size={22} /> Confirmer
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
