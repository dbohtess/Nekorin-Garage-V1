import { useState, useEffect } from 'react';
import { UserProfile } from './types';
import firebaseService from './lib/firebase';
import PhoneFrame from './components/PhoneFrame';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [islandMessage, setIslandMessage] = useState<string | null>(null);

  // Auto-clear Dynamic Island messages after 4 seconds
  useEffect(() => {
    if (islandMessage) {
      const timer = setTimeout(() => {
        setIslandMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [islandMessage]);

  // Auth Subscription
  useEffect(() => {
    const unsubscribe = firebaseService.onAuthStateChanged((profile) => {
      setUser(profile);
      setLoading(false);
      
      if (profile) {
        setIslandMessage(`DRIVER LINK SYNCED: ${profile.displayName.toUpperCase()}`);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    setIslandMessage('DISCONNECTING PILOT...');
    await firebaseService.signOut();
  };

  const handleResetDemo = () => {
    setIslandMessage('RESETTING PERSISTENCE...');
    localStorage.clear();
    // Refresh to re-initialize mock DB structures
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  return (
    <PhoneFrame
      dynamicIslandMessage={islandMessage}
      onResetDemo={handleResetDemo}
      currentUserEmail={user?.email}
    >
      {loading ? (
        <div className="flex-grow flex flex-col items-center justify-center p-8 bg-[#0a0a0c] text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-md animate-pulse" />
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center relative z-10">
              <span className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-neutral-300 font-sans tracking-tight">SYNCHRONIZING ECU CHANNELS</h4>
            <span className="text-[9px] text-white/40 font-mono tracking-widest block animate-pulse">CONNECTING SECURE PROTOCOL...</span>
          </div>
        </div>
      ) : !user ? (
        <AuthScreen
          onAuthSuccess={(profile) => setUser(profile)}
          signUpFn={firebaseService.signUp.bind(firebaseService)}
          signInFn={firebaseService.signIn.bind(firebaseService)}
          setIslandMessage={setIslandMessage}
        />
      ) : (
        <Dashboard
          user={user}
          onSignOut={handleSignOut}
          setIslandMessage={setIslandMessage}
        />
      )}
    </PhoneFrame>
  );
}
