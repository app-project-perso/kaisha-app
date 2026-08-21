import { Delete } from 'lucide-react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
}

/**
 * Pavé numérique tactile optimisé pour saisie rapide et répétée.
 * `value` est une chaîne de chiffres (sans séparateurs).
 */
export function NumericKeypad({ value, onChange, maxLength = 9 }: Props) {
  const press = (d: string) => {
    if (value.length >= maxLength && d !== '') return;
    onChange(value + d);
  };
  const del = () => onChange(value.slice(0, -1));
  const clear = () => onChange('');

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="select-none">
      <div className="grid grid-cols-3 gap-2">
        {keys.map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            className="flex h-16 items-center justify-center rounded-2xl bg-white text-2xl font-semibold text-slate-800 shadow-card active:scale-95 active:bg-slate-100 no-tap transition"
          >
            {k}
          </button>
        ))}
        <button
          onClick={clear}
          className="flex h-16 items-center justify-center rounded-2xl bg-slate-200 text-sm font-semibold text-slate-500 active:scale-95 no-tap transition"
        >
          Effacer
        </button>
        <button
          onClick={() => press('0')}
          className="flex h-16 items-center justify-center rounded-2xl bg-white text-2xl font-semibold text-slate-800 shadow-card active:scale-95 active:bg-slate-100 no-tap transition"
        >
          0
        </button>
        <button
          onClick={del}
          aria-label="Supprimer"
          className="flex h-16 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-card active:scale-95 active:bg-slate-100 no-tap transition"
        >
          <Delete size={26} />
        </button>
      </div>
    </div>
  );
}

/** Formate la chaîne de chiffres en groupes de 3 pour l'affichage. */
export function formatKeypadValue(v: string): string {
  if (!v) return '0';
  return v.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
