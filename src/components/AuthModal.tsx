import React, { useState } from 'react';
import {
  X,
  Cloud,
  Mail,
  Lock,
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (message: string) => void;
}

type AuthMode = 'signin' | 'signup' | 'magic';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured || !supabase) {
      setError('Cloud sync is not configured in environment variables.');
      return;
    }

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'magic') {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (otpError) throw otpError;
        setMagicLinkSent(true);
      } else if (mode === 'signup') {
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });
        if (signUpError) throw signUpError;

        if (data.session) {
          onAuthSuccess('Account created! Syncing your studio data to the cloud...');
          onClose();
        } else {
          onAuthSuccess(
            'Account created! Check your email to confirm and sync your studio.'
          );
          onClose();
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (signInError) throw signInError;
        onAuthSuccess('Signed in! Your studio is synced to the cloud.');
        onClose();
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Authentication failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-[0_14px_40px_rgb(0,0,0,0.06)] w-full max-w-md overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-7 pt-7 pb-5 flex items-start justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-coral-50 border border-coral-100/80 text-[#E07A5F] flex items-center justify-center shrink-0">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                Save to Cloud
              </h2>
              <p className="text-xs font-normal text-slate-400 mt-0.5 leading-relaxed">
                Create a free account to back up your materials, recipes, and rules across your devices.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100/70 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Pills */}
        <div className="px-7 pt-5">
          <div className="grid grid-cols-3 gap-1 bg-slate-100/80 p-1 rounded-full text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setMagicLinkSent(false);
              }}
              className={`py-1.5 rounded-full transition-all ${
                mode === 'signin'
                  ? 'bg-white text-slate-800 font-medium shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 font-normal'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setMagicLinkSent(false);
              }}
              className={`py-1.5 rounded-full transition-all ${
                mode === 'signup'
                  ? 'bg-white text-slate-800 font-medium shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 font-normal'
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('magic');
                setError(null);
                setMagicLinkSent(false);
              }}
              className={`py-1.5 rounded-full transition-all ${
                mode === 'magic'
                  ? 'bg-white text-slate-800 font-medium shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 font-normal'
              }`}
            >
              Magic Link
            </button>
          </div>
        </div>

        {/* Form Body */}
        {magicLinkSent ? (
          <div className="p-7 text-center space-y-4">
            <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto">
              <Check className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-800">
                Check your inbox
              </h3>
              <p className="text-xs font-normal text-slate-500 leading-relaxed">
                We sent a sign-in link to <strong className="font-medium text-slate-700">{email}</strong>. Click the link to sign in and automatically back up your studio data.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-slate-800 text-white text-xs font-medium hover:bg-slate-700 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-7 space-y-4">
            {error && (
              <div className="p-3 rounded-2xl bg-rose-50/80 border border-rose-100 text-rose-700 text-xs font-normal flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-normal text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@studio.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-transparent focus:border-slate-300 focus:bg-white rounded-2xl text-sm font-normal text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
                />
              </div>
            </div>

            {mode !== 'magic' && (
              <div>
                <label className="block text-xs font-normal text-slate-400 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-transparent focus:border-slate-300 focus:bg-white rounded-2xl text-sm font-normal text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-normal text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-[#E07A5F] shrink-0" />
                <span>Local items migrate automatically</span>
              </span>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-medium text-xs sm:text-sm px-5 py-2.5 rounded-full transition-all shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E07A5F]" />
                ) : (
                  <Cloud className="w-3.5 h-3.5 text-[#E07A5F]" />
                )}
                <span>
                  {mode === 'magic'
                    ? 'Send Magic Link'
                    : mode === 'signup'
                    ? 'Create Account'
                    : 'Sign In'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
