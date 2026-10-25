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
          onAuthSuccess('Account created! Syncing your Formulo studio data to the cloud...');
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
        onAuthSuccess('Signed in! Your Formulo studio is synced to the cloud.');
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3134]/25 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-sm w-full max-w-md overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-7 pt-7 pb-5 flex items-start justify-between border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#2A8C82]/10 border border-[#2A8C82]/25 text-[#2A8C82] flex items-center justify-center shrink-0">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-[#2D3134]">
                Upgrade to Studio Cloud
              </h2>
              <p className="text-xs font-normal text-[#64748B] mt-0.5 leading-relaxed">
                Sync your Formulo materials, recipes, and pricing rules across all your devices.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[#64748B] hover:text-[#2D3134] hover:bg-[#F8F9FA] transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cloud Plan Pricing Summary Banner */}
        <div className="px-7 pt-5">
          <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span className="font-semibold text-[#2D3134]">
                $1.99 / month
              </span>{' '}
              <span className="text-[#64748B]">or</span>{' '}
              <span className="font-semibold text-[#2A8C82]">$18 / year</span>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#E78358]/10 text-[#E78358] border border-[#E78358]/30 text-[11px] font-medium">
              Save 25% vs. monthly
            </span>
          </div>
        </div>

        {/* Mode Switcher Pills */}
        <div className="px-7 pt-4">
          <div className="grid grid-cols-3 gap-1 bg-[#F8F9FA] border border-slate-200 p-1 rounded-2xl text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setMagicLinkSent(false);
              }}
              className={`py-1.5 rounded-xl transition-all ${
                mode === 'signin'
                  ? 'bg-white text-[#2A8C82] font-semibold shadow-sm'
                  : 'text-[#64748B] hover:text-[#2D3134] font-normal'
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
              className={`py-1.5 rounded-xl transition-all ${
                mode === 'signup'
                  ? 'bg-white text-[#2A8C82] font-semibold shadow-sm'
                  : 'text-[#64748B] hover:text-[#2D3134] font-normal'
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
              className={`py-1.5 rounded-xl transition-all ${
                mode === 'magic'
                  ? 'bg-white text-[#2A8C82] font-semibold shadow-sm'
                  : 'text-[#64748B] hover:text-[#2D3134] font-normal'
              }`}
            >
              Magic Link
            </button>
          </div>
        </div>

        {/* Form Body */}
        {magicLinkSent ? (
          <div className="p-7 text-center space-y-4">
            <div className="w-11 h-11 rounded-full bg-[#2A8C82]/10 text-[#2A8C82] border border-[#2A8C82]/25 flex items-center justify-center mx-auto">
              <Check className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[#2D3134]">
                Check your inbox
              </h3>
              <p className="text-xs font-normal text-[#64748B] leading-relaxed">
                We sent a sign-in link to <strong className="font-medium text-[#2D3134]">{email}</strong>. Click the link to sign in and automatically back up your studio data.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#2A8C82] text-white text-xs font-medium hover:bg-[#23736B] transition-colors"
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
              <label className="block text-xs font-normal text-[#64748B] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@studio.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-2xl text-sm font-normal text-[#2D3134] placeholder:text-[#64748B] transition-all"
                />
              </div>
            </div>

            {mode !== 'magic' && (
              <div>
                <label className="block text-xs font-normal text-[#64748B] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-[#2A8C82] focus:ring-1 focus:ring-[#2A8C82] outline-none rounded-2xl text-sm font-normal text-[#2D3134] placeholder:text-[#64748B] transition-all"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-normal text-[#64748B]">
                <Sparkles className="w-3.5 h-3.5 text-[#F4B266] shrink-0" />
                <span>Local items migrate automatically</span>
              </span>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 bg-[#2A8C82] hover:bg-[#23736B] disabled:opacity-50 text-white font-medium text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F4B266]" />
                ) : (
                  <Cloud className="w-3.5 h-3.5 text-[#F4B266]" />
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

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-[#64748B]">
              <span>formulo.cc</span>
              <a
                href="mailto:support@formulo.cc"
                className="hover:text-[#2A8C82] underline underline-offset-2 transition-colors"
              >
                Questions? support@formulo.cc
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
