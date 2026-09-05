import React, { useState } from 'react';
import { Sparkles, Shield, Lock, MessageSquare, BookHeart, ArrowRight, CheckCircle2 } from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => Promise<void>;
  loading: boolean;
  errorMessage?: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSignIn, loading, errorMessage }) => {
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSignInClick = async () => {
    setAuthError(null);
    try {
      await onSignIn();
    } catch (err: any) {
      const msg = err?.message || 'Authentication encountered an issue.';
      if (msg.includes('popup-blocked')) {
        setAuthError('Popup was blocked by your browser. Please allow popups or open this app in a new tab.');
      } else {
        setAuthError(msg);
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-stone-50 text-stone-900 flex flex-col justify-between">
      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex-1 flex flex-col items-center text-center">
        {/* Isolated Security Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100/70 border border-amber-300/60 text-amber-900 text-xs font-medium mb-8">
          <Shield className="w-3.5 h-3.5 text-amber-700" />
          <span>Private Document Isolation with Cloud Firestore</span>
        </div>

        {/* Display Typography Heading */}
        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-stone-900 max-w-2xl leading-tight sm:leading-tight">
          A reflective thinking partner for your mind and thoughts.
        </h1>

        <p className="mt-5 text-base sm:text-lg text-stone-600 max-w-xl leading-relaxed">
          Write multi-turn journal reflections, explore your experiences with Gemini 3.6 Flash,
          and gain structured summaries—all strictly isolated to your private account.
        </p>

        {/* Primary Call to Action */}
        <div className="mt-8 flex flex-col items-center gap-3 w-full max-w-xs">
          <button
            id="google-signin-button"
            type="button"
            onClick={handleSignInClick}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-stone-900 hover:bg-stone-800 active:bg-stone-950 text-white font-medium text-sm sm:text-base rounded-xl transition shadow-sm hover:shadow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
                />
              </svg>
            )}
            <span>{loading ? 'Authenticating...' : 'Sign In with Google'}</span>
          </button>

          {(authError || errorMessage) && (
            <div
              id="auth-error-banner"
              className="mt-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg text-left w-full"
            >
              <p className="font-medium">Authentication Notice</p>
              <p className="mt-0.5">{authError || errorMessage}</p>
            </div>
          )}

          <p className="text-[11px] text-stone-500 flex items-center gap-1.5 mt-1">
            <Lock className="w-3 h-3 text-stone-400" />
            Zero passwords stored. Federated Google Authentication.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full max-w-4xl">
          <div className="p-5 bg-white border border-stone-200 rounded-xl shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-3">
              <BookHeart className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-stone-900 text-sm">Multi-Turn Reflections</h3>
            <p className="mt-1 text-xs text-stone-600 leading-relaxed">
              Express your feelings, day events, or challenges. Converse iteratively with an attentive AI companion.
            </p>
          </div>

          <div className="p-5 bg-white border border-stone-200 rounded-xl shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-3">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-stone-900 text-sm">Gemini 3.6 Flash Engine</h3>
            <p className="mt-1 text-xs text-stone-600 leading-relaxed">
              Provides structured summaries, emotional sentiment insights, brainstorming paths, and actionable takeaways.
            </p>
          </div>

          <div className="p-5 bg-white border border-stone-200 rounded-xl shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 mb-3">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-stone-900 text-sm">User Data Isolation</h3>
            <p className="mt-1 text-xs text-stone-600 leading-relaxed">
              Owner-bound Firestore security rules guarantee your reflections are accessible only by your authenticated identity.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-500">
        <p>Built with Google Gemini 3.6 Flash & Cloud Firestore &bull; Enterprise-grade security standards</p>
      </footer>
    </div>
  );
};
