import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { ScreenHeader } from '@/components/ui/AppShell';
import { formatAr, formatHeure, formatJourLabel } from '@/lib/format';
import { operateurTheme } from '@/lib/theme';
import { OPERATEURS } from '@/lib/operateurs';
import type { Operateur, Transaction, TypeTransaction } from '@/db/types';
import { ArrowDownLeft, ArrowUpRight, Filter, Smartphone, Wallet, Inbox } from 'lucide-react';

interface Props {
  onBack: () => void;
}

type FiltreOperateur = 'all' | Operateur;
type FiltreType = 'all' | TypeTransaction;

export function History({ onBack }: Props) {
  const [fOp, setFOp] = useState<FiltreOperateur>('all');
  const [fType, setFType] = useState<FiltreType>('all');
  const [showFilters, setShowFilters] = useState(false);

  const allTxs = useLiveQuery(() => db.transactions.orderBy('date_heure').reverse().toArray(), [], []);

  const filtered = useMemo(() => {
    if (!allTxs) return [];
    return allTxs.filter(
      (t) => (fOp === 'all' || t.operateur === fOp) && (fType === 'all' || t.type === fType),
    );
  }, [allTxs, fOp, fType]);

  // Grouper par jour
  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const day = t.date_heure.slice(0, 10);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(t);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const activeFilters = fOp !== 'all' || fType !== 'all';

  return (
    <div className="flex min-h-screen flex-col">
      <ScreenHeader
        title="Historique"
        subtitle={`${filtered.length} ${filtered.length === 1 ? 'transaction' : 'transactions'}`}
        onBack={onBack}
        right={
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`flex h-9 w-9 items-center justify-center rounded-full no-tap transition ${
              activeFilters ? 'bg-sky-100 text-sky-600' : 'text-slate-500 hover:bg-slate-200'
            }`}
            aria-label="Filtres"
          >
            <Filter size={18} />
          </button>
        }
      />

      {/* Panneau filtres */}
      {showFilters && (
        <div className="animate-slide-up border-b border-slate-200 bg-white px-4 py-3">
          <div className="mb-2">
            <p className="mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Opérateur</p>
            <div className="flex flex-wrap gap-1.5">
              <FilterChip active={fOp === 'all'} onClick={() => setFOp('all')}>
                Tous
              </FilterChip>
              {OPERATEURS.map((op) => (
                <FilterChip
                  key={op.key}
                  active={fOp === op.key}
                  onClick={() => setFOp(op.key)}
                  color={op.couleur}
                >
                  {op.nom}
                </FilterChip>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</p>
            <div className="flex flex-wrap gap-1.5">
              <FilterChip active={fType === 'all'} onClick={() => setFType('all')}>
                Tous
              </FilterChip>
              <FilterChip active={fType === 'depot'} onClick={() => setFType('depot')}>
                Dépôts
              </FilterChip>
              <FilterChip active={fType === 'retrait'} onClick={() => setFType('retrait')}>
                Retraits
              </FilterChip>
            </div>
          </div>
          {activeFilters && (
            <button
              onClick={() => {
                setFOp('all');
                setFType('all');
              }}
              className="mt-3 text-sm font-medium text-sky-600 no-tap"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}

      <div className="flex-1 px-4 py-3">
        {filtered.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200">
              <Inbox size={28} className="text-slate-400" />
            </div>
            <p className="mt-4 text-sm font-medium text-slate-500">Aucune transaction</p>
            <p className="mt-1 text-xs text-slate-400">
              {activeFilters ? 'Essayez de modifier les filtres' : 'L\'historique apparaîtra ici'}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map(([day, txs]) => (
              <div key={day}>
                <div className="sticky top-[64px] z-10 -mx-1 mb-2 bg-slate-100/90 px-1 py-1 backdrop-blur">
                  <p className="text-xs font-semibold capitalize text-slate-500">
                    {formatJourLabel(day)}
                  </p>
                </div>
                <div className="space-y-2">
                  {txs.map((t) => (
                    <TransactionRow key={t.id} tx={t} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const th = operateurTheme(tx.operateur);
  const isDepot = tx.type === 'depot';
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${th.bg} text-white`}
      >
        {isDepot ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-semibold ${th.textDark}`}>
            {OPERATEURS.find((o) => o.key === tx.operateur)?.nom}
          </span>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              isDepot ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}
          >
            {isDepot ? 'Dépôt' : 'Retrait'}
          </span>
        </div>
        {tx.numero_telephone ? (
          <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
            {tx.numero_telephone}
          </p>
        ) : null}
        <p className="mt-0.5 text-xs text-slate-400">{formatHeure(tx.date_heure)}</p>
      </div>
      <div className="text-right">
        <p
          className={`text-base font-bold tabular-nums ${
            isDepot ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {isDepot ? '+' : '−'}
          {formatAr(tx.montant).replace('-', '')}
        </p>
        {tx.cloture_id && (
          <p className="text-[10px] font-medium text-slate-400">Clôturée</p>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold no-tap transition ${
        active
          ? color === 'orange'
            ? 'bg-orange-500 text-white'
            : color === 'mvola'
              ? 'bg-mvola-500 text-white'
              : color === 'airtel'
                ? 'bg-airtel-600 text-white'
                : 'bg-slate-900 text-white'
          : 'bg-slate-100 text-slate-600'
      }`}
    >
      {children}
    </button>
  );
}
