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

  useEffect(() => {
    if (islandMessage) {
      const timer = setTimeout(() => {
        setIslandMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [islandMessage]);

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

  if (loading) {
    return (
      <div className="h-[100svh] min-h-[100svh] overflow-hidden bg-[#0c0c0e] text-white flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        onAuthSuccess={setUser}
        setIslandMessage={setIslandMessage}
      />
    );
  }

  return (
    <PhoneFrame
      dynamicIslandMessage={islandMessage}
      currentUserEmail={user.email}
    >
      <Dashboard
        user={user}
        onSignOut={handleSignOut}
        setIslandMessage={setIslandMessage}
      />
    </PhoneFrame>
  );
}
