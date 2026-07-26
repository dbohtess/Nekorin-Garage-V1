import { useState, type FormEvent } from 'react';
import { Disc, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (user: UserProfile) => void;
  setIslandMessage: (message: string) => void;
}

export default function AuthScreen({ setIslandMessage }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('اكتب البريد الإلكتروني.');
      return;
    }

    if (!password) {
      setError('اكتب كلمة المرور.');
      return;
    }

    setLoading(true);
    setIslandMessage('CHECKING DRIVER ACCOUNT...');

    try {
      setError('بنربط تسجيل الدخول مع Firebase في الخطوة التالية.');
      setIslandMessage('LOGIN CONNECTION PENDING');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="relative flex h-[100svh] min-h-[100svh] w-full items-center justify-center overflow-hidden bg-[#0c0c0e] px-5 py-6 text-white"
      dir="rtl"
    >
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-red-950/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-red-950/10 blur-3xl" />

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex w-full max-w-sm flex-col items-center text-center"
        aria-labelledby="login-title"
      >
        <div className="relative mb-5">
          <div className="absolute inset-0 rounded-3xl bg-red-600/20 blur-xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-black/40 shadow-2xl">
            <Disc className="h-10 w-10 animate-spin text-red-500" aria-hidden="true" />
          </div>
        </div>

        <h1 className="text-[28px] font-black leading-none tracking-tight">
          NEKORIN <span className="text-red-500">GARAGE</span>
        </h1>

        <p className="mt-3 text-xs text-white/45">إدارة سيارتك بسهولة.</p>

        <h2 id="login-title" className="mt-8 text-lg font-bold text-white/90">
          تسجيل الدخول
        </h2>

        <form onSubmit={handleSubmit} className="mt-5 flex w-full flex-col gap-3">
          <label className="relative block">
            <Mail className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="البريد الإلكتروني"
              autoComplete="email"
              disabled={loading}
              className="min-h-12 w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-4 pr-11 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-red-500/50 focus:bg-white/[0.07] disabled:opacity-50"
            />
          </label>

          <label className="relative block">
            <Lock className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="كلمة المرور"
              autoComplete="current-password"
              disabled={loading}
              className="min-h-12 w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-11 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-red-500/50 focus:bg-white/[0.07] disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35 transition hover:text-white"
              aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </label>

          {error && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex min-h-12 w-full cursor-pointer items-center justify-center rounded-xl border border-red-500/30 bg-red-600 px-4 text-sm font-bold text-white transition-all hover:bg-red-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              'تسجيل الدخول'
            )}
          </button>
        </form>
      </motion.section>
    </main>
  );
}
