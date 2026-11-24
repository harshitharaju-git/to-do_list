import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Calendar,
  Check,
  CheckSquare,
  Eye,
  EyeOff,
  Flag,
  GraduationCap,
  Lock,
  Mail,
  User,
} from 'lucide-react';
import { loginApi, registerApi } from '../api/tasks';
import type { AuthResponse } from '../types/task';

interface AuthScreenProps {
  onAuthenticated: (auth: AuthResponse, isNewAccount: boolean) => void;
}

type AuthMode = 'login' | 'register';

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [useLocalMode, setUseLocalMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrorMsg(null);
    setInfoMsg(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (mode === 'register' && trimmedName.length < 2) {
      setErrorMsg('Please enter your full name (at least 2 characters).');
      return;
    }

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (mode === 'register' && password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (mode === 'login' && !password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'register') {
        const result = await registerApi({
          name: trimmedName,
          email: trimmedEmail,
          password,
          mode: useLocalMode ? 'local' : undefined,
        });
        if (result.requiresEmailConfirmation || !result.token) {
          setMode('login');
          setPassword('');
          setInfoMsg(
            result.message ||
              'Account created! Please check your email inbox to confirm your address before signing in.'
          );
          return;
        }
        onAuthenticated(result, true);
      } else {
        const result = await loginApi({
          email: trimmedEmail,
          password,
          mode: useLocalMode ? 'local' : undefined,
        });
        onAuthenticated(result, false);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Authentication failed. Please try again.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-gradient-to-br from-indigo-50/70 via-white to-sky-50/70">
      {/* Left Aesthetic Editorial Showcase Panel */}
      <section className="lg:col-span-6 relative overflow-hidden bg-gradient-to-br from-indigo-950 via-violet-900 to-indigo-900 text-white p-8 sm:p-12 lg:p-14 flex flex-col justify-between">
        {/* Soft geometric light accents */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-violet-500/20 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-10 -right-20 w-96 h-96 rounded-full bg-sky-400/20 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-teal-400/10 blur-2xl"
        />

        {/* Brand Mark */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md">
            <CheckSquare className="w-5 h-5" aria-hidden="true" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-white">
            TaskFlow
          </span>
        </div>

        {/* Hero Copy + Realistic Preview Stack */}
        <div className="relative my-10 lg:my-0 space-y-8 max-w-lg">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-white text-balance">
              Plan clearly, focus deeply, and finish what matters.
            </h1>
            <p className="mt-3 text-base text-indigo-100/90 leading-relaxed">
              Your personal workspace for organizing daily priorities, tracking deadlines across categories, and watching real progress build.
            </p>
          </div>

          {/* Curated Preview Task Stack */}
          <div className="space-y-3" aria-hidden="true">
            <div className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 p-4 flex items-center gap-3.5">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white/75 line-through truncate">
                  Finalize Q4 product roadmap slides
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-indigo-200/80">
                  <span className="inline-flex items-center gap-1 text-sky-300">
                    <Briefcase className="w-3 h-3" />
                    Work
                  </span>
                  <span>·</span>
                  <span className="text-emerald-300 font-medium">Completed</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 p-4 flex items-center gap-3.5 shadow-sm">
              <div className="w-6 h-6 rounded-lg border border-sky-300/70 bg-white/10 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  Submit database architecture lab report
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-indigo-100/90">
                  <span className="inline-flex items-center gap-1 text-fuchsia-300">
                    <GraduationCap className="w-3 h-3" />
                    Academic
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 text-rose-300 font-medium">
                    <Flag className="w-3 h-3" />
                    High Priority
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 font-mono text-sky-200">
                    <Calendar className="w-3 h-3" />
                    Today
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 p-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-medium text-indigo-100">Weekly Completion</span>
                <span className="font-mono font-semibold text-emerald-300 tabular-nums">75%</span>
              </div>
              <div className="h-2 rounded-full bg-white/15 overflow-hidden">
                <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-sky-400 via-violet-400 to-emerald-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Quiet Footer Note */}
        <p className="relative text-xs text-indigo-200/80">
          Persistent SQLite storage · Organized by Work, Academic, Personal &amp; More
        </p>
      </section>

      {/* Right Auth Form Panel */}
      <section className="lg:col-span-6 flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-md bg-white border border-indigo-100 rounded-2xl shadow-lg overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-teal-400" aria-hidden="true" />

          <div className="p-7 sm:p-9">
            {/* Mode Switcher Tabs */}
            <div
              role="tablist"
              aria-label="Authentication mode"
              className="grid grid-cols-2 gap-1 p-1 bg-indigo-50/80 border border-indigo-100 rounded-xl mb-6"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                onClick={() => switchMode('login')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                    : 'text-indigo-900/70 hover:text-indigo-950'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'register'}
                onClick={() => switchMode('register')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 ${
                  mode === 'register'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                    : 'text-indigo-900/70 hover:text-indigo-950'
                }`}
              >
                Create Account
              </button>
            </div>

            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
                {mode === 'login' ? 'Welcome back' : 'Create your workspace'}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {mode === 'login'
                  ? 'Sign in with your email and password to access your tasks.'
                  : 'Set up your TaskFlow account in seconds to save your tasks.'}
              </p>
            </div>

            {infoMsg && (
              <div
                role="status"
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
              >
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{infoMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label htmlFor="auth-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User
                      className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="auth-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Rivera"
                      autoComplete="name"
                      required
                      maxLength={120}
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    maxLength={255}
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="auth-password" className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  {mode === 'register' && (
                    <span className="text-xs text-slate-500">Minimum 6 characters</span>
                  )}
                </div>
                <div className="relative">
                  <Lock
                    className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'login' ? 'Enter your password' : 'Create a password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                    maxLength={128}
                    className="w-full h-11 pl-10 pr-11 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-700 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-semibold text-white hover:from-indigo-700 hover:to-violet-700 shadow-sm transition-all disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
              >
                <span>
                  {isSubmitting
                    ? mode === 'login'
                      ? 'Signing in...'
                      : 'Creating account...'
                    : mode === 'login'
                      ? 'Sign In'
                      : 'Create Account'}
                </span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-indigo-100 space-y-2.5 text-center text-sm text-slate-600">
              <div>
                {mode === 'login' ? (
                  <>
                    New to TaskFlow?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="font-semibold text-indigo-700 hover:text-violet-700 focus-visible:outline-none focus-visible:underline"
                    >
                      Create an account
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="font-semibold text-indigo-700 hover:text-violet-700 focus-visible:outline-none focus-visible:underline"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => {
                    setUseLocalMode((prev) => !prev);
                    setErrorMsg(null);
                    setInfoMsg(
                      !useLocalMode
                        ? 'Switched to Local Workspace mode. Create an account or sign in immediately without email confirmation.'
                        : 'Switched back to Cloud (Supabase) account mode.'
                    );
                  }}
                  className="text-xs font-medium text-slate-500 hover:text-indigo-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:underline"
                >
                  {useLocalMode
                    ? 'Switch back to Cloud (Supabase) Sign In'
                    : 'Having trouble with email confirmation? Use Local Workspace'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
