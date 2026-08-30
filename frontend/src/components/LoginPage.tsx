import React, { useState } from 'react';
import { GraduationCap, Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, UserCheck, ShieldCheck } from 'lucide-react';
import { loginWithEmail, loginWithGoogle, registerWithEmail } from '../firebase';

interface LoginPageProps {
  onLogin: (role: 'teacher' | 'student') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [role, setRole] = useState<'teacher' | 'student'>('teacher');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  function friendlyError(code: string) {
    const map: Record<string, string> = {
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/invalid-credential': 'Invalid email or password.',
      'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    };
    return map[code] ?? `An unexpected error occurred. Please try again. (Code: ${code})`;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
      onLogin(role);
    } catch (err: any) {
      setError(friendlyError(err.code ?? ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      onLogin(role);
    } catch (err: any) {
      setError(friendlyError(err.code ?? ''));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-brand-50 to-violet-50 dark:from-slate-950 dark:via-brand-950/20 dark:to-slate-900 flex items-center justify-center px-4 transition-colors font-sans">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">

          {/* Header */}
          <div className="bg-gradient-to-br from-brand-600 to-violet-600 px-8 py-8 text-white text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="bg-white/20 backdrop-blur p-2.5 rounded-2xl">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">GradeForge</span>
            </div>
            <p className="text-brand-100 text-xs uppercase tracking-widest font-mono">
              School Result Processing & GPA Engine
            </p>
          </div>

          {/* Role Selector Tabs */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <div className="flex rounded-xl bg-slate-200/70 dark:bg-slate-800 p-1 gap-1">
              <button
                type="button"
                onClick={() => { setRole('teacher'); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 font-mono uppercase ${
                  role === 'teacher'
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="h-4 w-4 text-amber-500" />
                Teacher / Admin
              </button>

              <button
                type="button"
                onClick={() => { setRole('student'); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 font-mono uppercase ${
                  role === 'student'
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <UserCheck className="h-4 w-4 text-amber-500" />
                Student Portal
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="px-8 py-6 flex flex-col gap-5 font-mono">
            
            {/* Mode Switch (Sign In / Register) */}
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1 font-sans">
              {(['login', 'register'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                    mode === m
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {m === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            {/* Google Button */}
            <button
              onClick={handleGoogle}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-60 uppercase font-sans"
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-600 border-t-brand-500 rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google ({role === 'teacher' ? 'Teacher' : 'Student'})
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 font-sans">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800 transition-colors" />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">or with credentials</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800 transition-colors" />
            </div>

            {/* Error Banner */}
            {error && (
              <div className="flex items-start gap-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl px-4 py-3">
                <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700 dark:text-rose-400 font-medium font-sans">{error}</p>
              </div>
            )}

            {/* Email / Password Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Email */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {role === 'teacher' ? 'Teacher Email' : 'Student Email'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={role === 'teacher' ? 'teacher@school.edu' : 'student@school.edu'}
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    className="w-full pl-10 pr-11 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black border border-amber-600 rounded-xl py-2.5 text-xs font-bold transition shadow-sm uppercase font-mono mt-1 disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                {loading
                  ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
                  : (mode === 'login' ? `Sign In as ${role === 'teacher' ? 'Teacher' : 'Student'}` : `Register as ${role === 'teacher' ? 'Teacher' : 'Student'}`)}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-5 uppercase">
          GradeForge · Multi-Role School Engine v1.0
        </p>
      </div>
    </div>
  );
};
