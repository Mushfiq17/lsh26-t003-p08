import React from 'react';
import { Search, Bell, Grid3X3, LogOut, Moon, Sun } from 'lucide-react';
import type { User } from '../firebase';
import { useDarkMode } from '../hooks/useDarkMode';

interface TopBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  user?: User | null;
  onLogout?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ searchQuery, setSearchQuery, user, onLogout }) => {
  const displayName = user?.displayName ?? user?.email ?? 'Admin';
  const role = 'Admin Panel';
  const { isDark, toggle } = useDarkMode();

  return (
    <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-10 transition-colors">
      {/* Search Bar */}
      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for students, classes, or grades..."
          className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 ml-6">
        {/* Dark Mode Toggle */}
        <button 
          onClick={toggle}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-slate-500" />}
        </button>

        {/* Bell Icon */}
        <button className="relative p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
          <Bell className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full" />
        </button>
        {/* Grid Icon */}
        <button className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
          <Grid3X3 className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700">
          <div className="text-right hidden sm:block">

            <div className="text-sm font-semibold text-slate-800 max-w-[140px] truncate">{displayName}</div>
            <div className="text-xs text-slate-400">{role}</div>
          </div>
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="User"
              className="w-10 h-10 rounded-full object-cover border-2 border-brand-200 flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-brand-100 border-2 border-brand-200 flex items-center justify-center text-brand-700 font-bold text-sm flex-shrink-0">
              {displayName[0].toUpperCase()}
            </div>
          )}
          {/* Sign-out button in top bar */}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign out"
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 transition"
            >
              <LogOut className="h-4 w-4 text-slate-400 hover:text-rose-500" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
