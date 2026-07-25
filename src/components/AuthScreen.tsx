import { useState } from 'react';
import { Disc } from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (user: UserProfile) => void;
  signInWithGoogleFn: () => Promise<UserProfile | null>;
  setIslandMessage: (msg: string) => void;
}

export default function AuthScreen({
  onAuthSuccess,
  signInWithGoogleFn,
  setIslandMessage,
}: AuthScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setIslandMessage('GOOGLE AUTHENTICATION...');

    try {
      const profile = await signInWithGoogleFn();
      if (!profile) return;
      setIslandMessage(`أهلاً بك، ${profile.displayName.toUpperCase()}`);
      onAuthSuccess(profile);
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError('تعذر تسجيل الدخول باستخدام Google. حاول مرة أخرى.');
        setIslandMessage('GOOGLE AUTH ERROR');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="relative h-[100svh] min-h-[100svh] w-full overflow-hidden bg-[#0c0c0e] text-white flex items-center justify-center px-5 py-6"
      dir="rtl"
    >
      <div className="absolute -top-24 -right-20 w-64 h-64 rounded-full bg-red-950/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-28 -left-24 w-72 h-72 rounded-full bg-red-950/10 blur-3xl pointer-events-none" />

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm flex flex-col items-center text-center"
        aria-labelledby="login-title"
      >
        <div className="relative mb-5">
          <div className="absolute inset-0 bg-red-600/20 rounded-3xl blur-xl" />
          <div className="relative w-20 h-20 rounded-3xl bg-black/40 border border-white/10 flex items-center justify-center shadow-2xl">
            <Disc className="w-10 h-10 text-red-500 animate-spin-slow" aria-hidden="true" />
          </div>
        </div>

        <h1 className="text-[28px] leading-none font-black tracking-tight">
          NEKORIN <span className="text-red-500">GARAGE</span>
        </h1>
        <p className="mt-3 text-xs text-white/45">إدارة سيارتك بسهولة.</p>

        <h2 id="login-title" className="mt-8 text-lg font-bold text-white/90">
          تسجيل الدخول
        </h2>

        {error && (
          <p className="mt-4 w-full rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="mt-5 w-full min-h-12 bg-white/5 hover:bg-white/10 text-white font-bold text-sm px-4 rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="w-5 h-5 rounded-full bg-white text-[#4285F4] font-black text-xs flex items-center justify-center">G</span>
          )}
          تسجيل الدخول باستخدام Google
        </button>
      </motion.section>
    </main>
  );
}
