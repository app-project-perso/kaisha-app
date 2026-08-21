import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Lock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface ResetPasswordProps {
  onDone: () => void;
}

export function ResetPassword({ onDone }: ResetPasswordProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
    }
  };

  const handleContinue = async () => {
    await supabase.auth.signOut();
    onDone();
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-white">
      <div className="px-6 pt-safe pb-6">
        <div className="mt-8">
          <p className="text-sm font-medium text-sky-400">Mobile Money</p>
          <h1 className="mt-1 text-3xl font-bold leading-tight tracking-tight">
            Nouveau mot de passe
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Choisissez un nouveau mot de passe pour votre compte.
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col rounded-t-3xl bg-slate-100 px-6 pt-7 text-slate-900">
        {success ? (
          <div className="flex flex-col items-center gap-4 pt-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={28} />
            </div>
            <p className="text-base font-semibold">Mot de passe mis à jour</p>
            <p className="text-sm text-slate-500">
              Vous pouvez maintenant vous reconnecter avec votre nouveau mot de passe.
            </p>
            <Button size="xl" fullWidth onClick={handleContinue} className="mt-4 bg-sky-500 hover:bg-sky-600">
              Se reconnecter <ArrowRight size={18} />
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-600">
                <Lock size={16} /> Nouveau mot de passe
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-300 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-600">
                <Lock size={16} /> Confirmer le mot de passe
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Ressaisissez le mot de passe"
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-300 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>

            {error && (
              <div className="animate-pop flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-500" />
                <p className="text-sm text-rose-700">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              size="xl"
              fullWidth
              disabled={loading}
              className="mt-2 bg-sky-500 hover:bg-sky-600 shadow-card-lg shadow-sky-500/30"
            >
              {loading ? 'Mise à jour…' : 'Valider le nouveau mot de passe'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}