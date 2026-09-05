import React from 'react';
import { User } from 'firebase/auth';
import { Sparkles, LogOut, PlusCircle, ShieldCheck, Database, BookOpen } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onNewEntry: () => void;
  onLogout: () => void;
  entryCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onNewEntry, onLogout, entryCount }) => {
  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-base sm:text-lg text-stone-100">
                Gemini Reflection Journal
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" />
                Isolated User Scope
              </span>
            </div>
            <p className="text-xs text-stone-400 hidden sm:block">
              Private journal conversations backed by Firestore & Gemini 3.6 Flash
            </p>
          </div>
        </div>

        {/* User Context & Actions */}
        {user ? (
          <div className="flex items-center gap-3">
            <button
              id="navbar-new-entry-button"
              type="button"
              onClick={onNewEntry}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-medium text-xs sm:text-sm rounded-lg transition shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Entry</span>
            </button>

            <div className="h-6 w-px bg-stone-800 hidden sm:block" />

            <div className="flex items-center gap-2 pl-1">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 rounded-full border border-stone-700 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-stone-800 border border-stone-700 text-stone-300 flex items-center justify-center font-medium text-xs">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="hidden md:block text-left text-xs">
                <p className="font-medium text-stone-200 truncate max-w-[140px]">
                  {user.displayName || 'Journal Author'}
                </p>
                <p className="text-stone-400 truncate max-w-[140px] text-[11px]">
                  {user.email || 'Authenticated'}
                </p>
              </div>

              <button
                id="navbar-logout-button"
                type="button"
                onClick={onLogout}
                title="Sign out securely"
                className="p-2 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition cursor-pointer"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <Database className="w-4 h-4 text-amber-500" />
            <span>Firestore Protected</span>
          </div>
        )}
      </div>
    </header>
  );
};
