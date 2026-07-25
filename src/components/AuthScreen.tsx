import React, { useState } from 'react';
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
        setError(err?.message || 'فشل تسجيل الدخول باستخدام Google.');
        setIslandMessage('GOOGLE AUTH ERROR');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 bg-[#0c0c0e] overflow-y-auto scrollbar-none select-none relative" dir="rtl">
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-950/10 rounded-full blur-2xl pointer-events-none" />
      
      <div className="flex flex-col items-center text-center pt-6 space-y-3 relative z-10">
        <div className="relative">
          <div className="absolute inset-0 bg-red-600/20 rounded-full blur-md animate-pulse" />
          <div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-red-500 shadow-lg relative z-10">
            <Disc className="w-8 h-8 text-red-500 animate-spin-slow" />
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-white font-sans">
            NEKORIN <span className="text-red-500">GARAGE</span>
          </h2>
          <p className="text-white/40 text-[9px] tracking-wider uppercase font-mono">
            Automotive Spec & Log Engine • V1
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="my-auto py-4 space-y-5 relative z-10 text-right"
      >
        <div className="text-center">
          <h3 className="text-lg font-bold text-white/90">تسجيل دخول السائق</h3>
          <p className="text-xs text-white/40 mt-1 font-mono">
            استخدم حساب Google للاتصال بقاعدة بيانات سيارتك
          </p>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white/5 hover:bg-white/10 text-white font-bold text-sm py-3 px-4 rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="w-5 h-5 rounded-full bg-white text-[#4285F4] font-black text-xs flex items-center justify-center">G</span>
          )}
          تسجيل الدخول باستخدام Google
        </button>
      </motion.div>
    </div>
  );
}
