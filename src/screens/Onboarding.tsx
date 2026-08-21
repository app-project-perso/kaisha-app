import { useState } from 'react';
import { saveConfig } from '@/db/db';
import { SEUIL_DEFAUT } from '@/db/types';
import { Button } from '@/components/ui/Button';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { formatAr } from '@/lib/format';
import { NumericKeypad, formatKeypadValue } from '@/components/ui/NumericKeypad';
import { Wallet, Smartphone, ShieldAlert, ArrowRight, Check } from 'lucide-react';

type Field = 'cash' | 'orange' | 'mvola' | 'airtel';
type FieldDef = { key: Field; label: string; sub: string; icon: React.ReactNode; color: string };

const SOLDES: FieldDef[] = [
  { key: 'cash', label: 'Cash en caisse', sub: 'Espèces physiques actuelles', icon: <Wallet size={18} />, color: 'bg-slate-800' },
  { key: 'orange', label: 'Orange Money', sub: 'Solde actuel sur l\'app', icon: <Smartphone size={18} />, color: 'bg-orange-500' },
  { key: 'mvola', label: 'Mvola', sub: 'Solde actuel sur l\'app', icon: <Smartphone size={18} />, color: 'bg-mvola-500' },
  { key: 'airtel', label: 'Airtel Money', sub: 'Solde actuel sur l\'app', icon: <Smartphone size={18} />, color: 'bg-airtel-600' },
];

const SEUILS: FieldDef[] = [
  { key: 'cash', label: 'Seuil cash', sub: 'Alerte si en dessous', icon: <ShieldAlert size={18} />, color: 'bg-slate-700' },
  { key: 'orange', label: 'Seuil Orange', sub: 'Alerte si en dessous', icon: <ShieldAlert size={18} />, color: 'bg-orange-500' },
  { key: 'mvola', label: 'Seuil Mvola', sub: 'Alerte si en dessous', icon: <ShieldAlert size={18} />, color: 'bg-mvola-500' },
  { key: 'airtel', label: 'Seuil Airtel', sub: 'Alerte si en dessous', icon: <ShieldAlert size={18} />, color: 'bg-airtel-600' },
];

export function Onboarding() {
  const [step, setStep] = useState<'soldes' | 'seuils'>('soldes');
  const [soldes, setSoldes] = useState<Record<Field, string>>({ cash: '', orange: '', mvola: '', airtel: '' });
  const [seuils, setSeuils] = useState<Record<Field, string>>({
    cash: String(SEUIL_DEFAUT),
    orange: String(SEUIL_DEFAUT),
    mvola: String(SEUIL_DEFAUT),
    airtel: String(SEUIL_DEFAUT),
  });
  const [activeField, setActiveField] = useState<Field>('cash');
  const [saving, setSaving] = useState(false);

  const currentVal = step === 'soldes' ? soldes[activeField] : seuils[activeField];
  const setVal = (v: string) => {
    if (step === 'soldes') setSoldes((s) => ({ ...s, [activeField]: v }));
    else setSeuils((s) => ({ ...s, [activeField]: v }));
  };

  const fields = step === 'soldes' ? SOLDES : SEUILS;
  const allSoldesFilled = SOLDES.every((f) => soldes[f.key].length > 0);

  const handleDemarrer = async () => {
    setSaving(true);
    await saveConfig({
      cash_solde_initial: Number(soldes.cash),
      orange_solde_initial: Number(soldes.orange),
      mvola_solde_initial: Number(soldes.mvola),
      airtel_solde_initial: Number(soldes.airtel),
      cash_seuil_alerte: Number(seuils.cash),
      orange_seuil_alerte: Number(seuils.orange),
      mvola_seuil_alerte: Number(seuils.mvola),
      airtel_seuil_alerte: Number(seuils.airtel),
      onboarding_termine: true,
    });
    setSaving(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-white">
      {/* Hero */}
      <div className="relative px-6 pt-safe pb-8">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900" />
        <div className="relative flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-white shadow-lg">
              <Wallet size={22} />
            </div>
            <span className="text-lg font-bold tracking-tight">Caisse Agent</span>
          </div>
          <OfflineIndicator />
        </div>

        <div className="relative mt-8">
          <p className="text-sm font-medium text-sky-400">Bienvenue</p>
          <h1 className="mt-1 text-3xl font-bold leading-tight tracking-tight">
            {step === 'soldes' ? 'Configurez votre caisse' : 'Définissez vos seuils d\'alerte'}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {step === 'soldes'
              ? 'Saisissez les soldes actuels pour démarrer. Tout reste sur votre appareil.'
              : 'Recevez une alerte dès qu\'un solde passe sous le seuil choisi.'}
          </p>
        </div>

        {/* Stepper */}
        <div className="relative mt-6 flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step === 'soldes' ? 'bg-sky-500' : 'bg-emerald-500'}`}>
              {step === 'soldes' ? '1' : <Check size={14} />}
            </span>
            <span className="text-xs font-medium text-slate-300">Soldes initiaux</span>
          </div>
          <div className="h-px flex-1 bg-slate-700" />
          <div className="flex items-center gap-2">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step === 'seuils' ? 'bg-sky-500' : 'bg-slate-700 text-slate-400'}`}>2</span>
            <span className="text-xs font-medium text-slate-300">Seuils</span>
          </div>
        </div>
      </div>

      {/* Liste des champs */}
      <div className="flex flex-1 flex-col rounded-t-3xl bg-slate-100 px-5 pt-6 text-slate-900">
        <div className="grid grid-cols-2 gap-2.5">
          {fields.map((f) => {
            const val = step === 'soldes' ? soldes[f.key] : seuils[f.key];
            const active = activeField === f.key;
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
                <span className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${f.color} text-white`}>
                  {f.icon}
                </span>
                <span className="text-xs font-medium text-slate-500">{f.label}</span>
                <span className="mt-0.5 text-lg font-bold tabular-nums text-slate-900">
                  {val ? formatAr(Number(val)) : '— Ar'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Affichage valeur en cours */}
        <div className="mt-5 rounded-2xl bg-slate-900 px-4 py-3 text-center">
          <p className="text-xs font-medium text-slate-400">
            {fields.find((f) => f.key === activeField)?.label}
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-white">
            {formatKeypadValue(currentVal)} <span className="text-lg text-slate-400">Ar</span>
          </p>
        </div>

        {/* Keypad */}
        <div className="mt-4">
          <NumericKeypad value={currentVal} onChange={setVal} />
        </div>

        {/* Actions */}
        <div className="mt-5 pb-safe">
          {step === 'soldes' ? (
            <Button
              size="xl"
              fullWidth
              disabled={!allSoldesFilled}
              onClick={() => setStep('seuils')}
            >
              Continuer <ArrowRight size={20} />
            </Button>
          ) : (
            <Button
              size="xl"
              fullWidth
              variant="success"
              disabled={saving}
              onClick={handleDemarrer}
            >
              {saving ? 'Enregistrement…' : 'Démarrer'} <ArrowRight size={20} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
