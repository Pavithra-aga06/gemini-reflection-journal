import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle, logoutUser } from './lib/firebase';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setSigningIn(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setAuthError(err?.message || 'Failed to complete sign-in. Please try again.');
      throw err;
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (err: any) {
      console.error('Sign-out error:', err);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-stone-300 border-t-amber-600 rounded-full animate-spin" />
          <p className="text-xs text-stone-500 font-medium">Verifying authentication status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans text-stone-900 antialiased selection:bg-amber-100">
      <Navbar
        user={user}
        onNewEntry={() => {
          // Trigger new entry by resetting or dispatching custom event if needed
          window.dispatchEvent(new CustomEvent('app:new-entry'));
        }}
        onLogout={handleSignOut}
        entryCount={0}
      />

      {user ? (
        <Dashboard user={user} />
      ) : (
        <LandingPage
          onSignIn={handleSignIn}
          loading={signingIn}
          errorMessage={authError}
        />
      )}
    </div>
  );
}
