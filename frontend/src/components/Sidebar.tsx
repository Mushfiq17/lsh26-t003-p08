import React from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  Layers,
  Database,
  Settings,
  FileCheck,
  LogOut,
  UserCheck
} from 'lucide-react';
import type { User } from '../firebase';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user?: User | null;
  onLogout?: () => void;
  onSwitchRole?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, user, onLogout, onSwitchRole }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'main' },
    { id: 'students', label: 'Students', icon: Users, section: 'main' },
    { id: 'classes', label: 'Classes', icon: Layers, section: 'main' },
    
    { id: 'subjects', label: 'Subjects', icon: BookOpen, section: 'admin' },
    { id: 'boundary_tests', label: 'Boundary Tests', icon: FileCheck, section: 'admin' },
    { id: 'audits', label: 'Result Vault', icon: Database, section: 'admin' },
    
    { id: 'configuration', label: 'Configuration', icon: Settings, section: 'settings' }
  ];

  return (
    <div className="w-64 bg-[#faf8f5] dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 h-screen flex flex-col justify-between select-none transition-colors">
      <div>
        {/* Header Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="bg-black dark:bg-white text-white dark:text-black p-2 rounded-xl">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-neutral-800 dark:text-neutral-100 font-mono">GradeForge</span>
        </div>

        {/* Navigation Sections */}
        <div className="px-4 py-6 flex flex-col gap-6">
          {/* Main Menu */}
          <div>
            <span className="px-3 text-[10px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase font-mono">Main Menu</span>
            <ul className="mt-2 space-y-1">
              {menuItems.filter(item => item.section === 'main').map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all font-mono ${
                        isActive 
                          ? 'bg-black text-white dark:bg-white dark:text-black shadow-none border border-black dark:border-white font-bold' 
                          : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Role Switch Shortcut */}
          {onSwitchRole && (
            <div className="px-1">
              <button
                onClick={onSwitchRole}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold font-mono uppercase hover:bg-amber-500/20 transition"
              >
                <UserCheck className="h-4 w-4 flex-shrink-0" />
                <span>Student Portal</span>
              </button>
            </div>
          )}

          {/* Administration */}
          <div>
            <span className="px-3 text-[10px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase font-mono">Administration</span>
            <ul className="mt-2 space-y-1">
              {menuItems.filter(item => item.section === 'admin').map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all font-mono ${
                        isActive 
                          ? 'bg-black text-white dark:bg-white dark:text-black shadow-none border border-black dark:border-white font-bold' 
                          : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Settings */}
          <div>
            <span className="px-3 text-[10px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase font-mono">Settings</span>
            <ul className="mt-2 space-y-1">
              {menuItems.filter(item => item.section === 'settings').map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all font-mono ${
                        isActive 
                          ? 'bg-black text-white dark:bg-white dark:text-black shadow-none border border-black dark:border-white font-bold' 
                          : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* Footer Support Card & User Profile */}
      <div className="px-4 py-4 flex flex-col gap-4 font-mono">
        {/* User Card */}
        <div className="flex items-center gap-3 border-t border-zinc-200 dark:border-zinc-800 pt-4 px-2">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="User"
              className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 font-bold text-sm flex-shrink-0 border border-zinc-300 dark:border-zinc-700">
              {(user?.displayName ?? user?.email ?? 'A')[0].toUpperCase()}
            </div>
          )}
          <div className="flex flex-col flex-1 min-w-0 font-sans">
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
              {user?.displayName ?? user?.email ?? 'Admin'}
            </span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium font-mono uppercase">Teacher / Admin</span>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign out"
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-200 dark:hover:border-rose-900/30 transition text-zinc-400 dark:text-zinc-500 hover:text-rose-500 dark:hover:text-rose-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
