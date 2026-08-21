import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { Wallet, Mail, Lock, ArrowRight, UserPlus, LogIn, AlertCircle } from 'lucide-react';

export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        if (data.user) {
          // Crée le profil associé
          await supabase.from('profiles').insert({ id: data.user.id });
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue';
      if (msg.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect.');
      } else if (msg.includes('already registered') || msg.includes('already been registered')) {
        setError('Cet email est déjà inscrit. Essayez de vous connecter.');
      } else if (msg.includes('password')) {
        setError('Le mot de passe doit faire au moins 6 caractères.');
      } else if (msg.includes('Failed to fetch') || msg.includes('fetch')) {
        setError('Connexion réseau impossible. Vérifiez votre connexion internet.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-white">
      {/* Hero */}
      <div className="px-6 pt-safe pb-6">
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-white shadow-lg">
              <Wallet size={22} />
            </div>
            <span className="text-lg font-bold tracking-tight">Caisse Agent</span>
          </div>
          <OfflineIndicator />
        </div>

        <div className="mt-8">
          <p className="text-sm font-medium text-sky-400">Mobile Money</p>
          <h1 className="mt-1 text-3xl font-bold leading-tight tracking-tight">
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {mode === 'login'
              ? 'Accédez à votre caisse et synchronisez vos données sur le cloud.'
              : 'Créez votre compte pour sauvegarder votre caisse dans le cloud.'}
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="flex flex-1 flex-col rounded-t-3xl bg-slate-100 px-6 pt-7 text-slate-900">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-600">
              <Mail size={16} /> Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agent@exemple.com"
              autoComplete="email"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-300 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>

          {/* Mot de passe */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-600">
              <Lock size={16} /> Mot de passe
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 caractères"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-300 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>

          {/* Erreur */}
          {error && (
            <div className="animate-pop flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-500" />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          {/* Bouton */}
          <Button
            type="submit"
            size="xl"
            fullWidth
            disabled={loading}
            className="mt-2 bg-sky-500 hover:bg-sky-600 shadow-card-lg shadow-sky-500/30"
          >
            {loading ? (
              'Chargement…'
            ) : (
              <>
                {mode === 'login' ? <LogIn size={20} /> : <UserPlus size={20} />}
                {mode === 'login' ? 'Se connecter' : 'Créer le compte'}
                <ArrowRight size={18} />
              </>
            )}
          </Button>
        </form>

        {/* Toggle login/signup */}
        <div className="mt-5 pb-safe text-center">
          <p className="text-sm text-slate-500">
            {mode === 'login' ? "Pas encore de compte ?" : 'Déjà un compte ?'}{' '}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError(null);
              }}
              className="font-semibold text-sky-600 no-tap"
            >
              {mode === 'login' ? "S'inscrire" : 'Se connecter'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
