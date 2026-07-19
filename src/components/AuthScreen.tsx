import React, { useState } from 'react';
import { User, Mail, Lock, ShieldCheck,  Disc } from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (user: UserProfile) => void;
  signUpFn: (email: string, password: string, displayName: string, garageName: string) => Promise<UserProfile>;
  signInFn: (email: string, password: string) => Promise<UserProfile>;
  setIslandMessage: (msg: string) => void;
}

export default function AuthScreen({
  onAuthSuccess,
  signUpFn,
  signInFn,
  setIslandMessage,
}: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [garageName, setGarageName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('يرجى ملء جميع الحقول المطلوبة. (Fill in all fields)');
      return;
    }
    if (isSignUp && !displayName) {
      setError('يرجى إدخال اسم السائق. (Enter driver name)');
      return;
    }

    setLoading(true);
    setError(null);
    setIslandMessage(isSignUp ? 'REGISTERING DRIVER...' : 'AUTHENTICATING...');

    try {
      let profile: UserProfile;
      if (isSignUp) {
        profile = await signUpFn(email, password, displayName, garageName);
        setIslandMessage('DRIVER REGISTERED');
      } else {
        profile = await signInFn(email, password);
        setIslandMessage(`أهلاً بك، ${profile.displayName.toUpperCase()}`);
      }
      onAuthSuccess(profile);
    } catch (err: any) {
      setError(err.message || 'فشل المصادقة. يرجى المحاولة مرة أخرى.');
      setIslandMessage('AUTH ERROR');
    } finally {
      setLoading(false);
    }
  };

 

  return (
    <div className="flex-1 flex flex-col justify-between p-6 bg-[#0c0c0e] overflow-y-auto scrollbar-none select-none relative" dir="rtl">
      {/* Background Subtle Red Accents */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-950/10 rounded-full blur-2xl pointer-events-none" />
      
      {/* Visual Header */}
      <div className="flex flex-col items-center text-center pt-6 space-y-3 relative z-10">
        <div className="relative">
          {/* Glowing red ring */}
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

      {/* Main Authentication Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="my-auto py-4 space-y-5 relative z-10 text-right"
      >
        <div className="text-center">
          <h3 className="text-lg font-bold text-white/90">
            {isSignUp ? 'إنشاء حساب سائق' : 'تسجيل دخول السائق'}
          </h3>
          <p className="text-xs text-white/40 mt-1 font-mono">
            {isSignUp ? 'سجل حسابك لإدارة استهلاك الوقود والصيانة' : 'أدخل بياناتك للاتصال بقاعدة بيانات السيارة'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-center">
              {error}
            </div>
          )}

          {isSignUp && (
            <>
              {/* Display Name Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono block">اسم السائق (Driver Name)</label>
                <div className="relative">
                  <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="مثال: Sultan"
                    className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-red-500/50 rounded-xl py-3 pr-10 pl-4 text-sm text-white placeholder-white/20 outline-none transition-all font-medium text-right"
                  />
                </div>
              </div>

              {/* Garage Name Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono block">اسم المرآب (Garage Name)</label>
                <div className="relative">
                  <ShieldCheck className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    value={garageName}
                    onChange={(e) => setGarageName(e.target.value)}
                    placeholder="مثال: Nekorin Garage"
                    className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-red-500/50 rounded-xl py-3 pr-10 pl-4 text-sm text-white placeholder-white/20 outline-none transition-all font-medium text-right"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono block">البريد الإلكتروني (Email Address)</label>
            <div className="relative">
              <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Sultan.dbohtes@gmail.com"
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-red-500/50 rounded-xl py-3 pr-10 pl-4 text-sm text-white placeholder-white/20 outline-none transition-all font-medium text-left"
                dir="ltr"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono block">كلمة المرور (Secret Passkey)</label>
            <div className="relative">
              <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-red-500/50 rounded-xl py-3 pr-10 pl-4 text-sm text-white placeholder-white/20 outline-none transition-all font-medium text-left"
                dir="ltr"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-black text-sm py-3 px-4 rounded-xl transition-all border border-red-500/30 flex items-center justify-center gap-2 shadow-lg shadow-red-950/20 active:scale-[0.98] disabled:opacity-50 cursor-pointer font-sans"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isSignUp ? (
              'إنشاء حساب جديد'
            ) : (
              'تسجيل دخول آمن'
            )}
          </button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-white/10" />
          <span className="flex-shrink mx-3 text-[9px] text-white/30 font-mono">بوابة الدخول السريع</span>
          <div className="flex-grow border-t border-white/10" />
        </div>

       
      {/* Footer Switcher */}
      <div className="text-center pb-2 text-xs relative z-10">
        <span className="text-white/40">
          {isSignUp ? 'لديك حساب بالفعل؟' : 'سائق جديد في جراج نيكورين؟'}
        </span>{' '}
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-red-400 hover:text-red-300 font-bold underline transition-colors cursor-pointer"
        >
          {isSignUp ? 'تسجيل الدخول' : 'إنشاء حساب'}
        </button>
      </div>
    </motion.div>
    </div>
  );
}
