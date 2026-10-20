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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#303C36]/20 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-[0_14px_40px_rgb(0,0,0,0.06)] w-full max-w-md overflow-hidden border border-[#E8ECE9]">
        {/* Header */}
        <div className="px-7 pt-7 pb-5 flex items-start justify-between border-b border-[#E8ECE9]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#42685B]/10 border border-[#B8C9BD]/60 text-[#42685B] flex items-center justify-center shrink-0">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-[#303C36]">
                Save to Cloud
              </h2>
              <p className="text-xs font-normal text-[#63726A] mt-0.5 leading-relaxed">
                Create a free account to back up your materials, recipes, and rules across your devices.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[#63726A] hover:text-[#303C36] hover:bg-[#FAFBFA] transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Pills */}
        <div className="px-7 pt-5">
          <div className="grid grid-cols-3 gap-1 bg-[#FAFBFA] border border-[#E8ECE9] p-1 rounded-full text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setMagicLinkSent(false);
              }}
              className={`py-1.5 rounded-full transition-all ${
                mode === 'signin'
                  ? 'bg-white text-[#42685B] font-semibold shadow-2xs'
                  : 'text-[#63726A] hover:text-[#303C36] font-normal'
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
                  ? 'bg-white text-[#42685B] font-semibold shadow-2xs'
                  : 'text-[#63726A] hover:text-[#303C36] font-normal'
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
                  ? 'bg-white text-[#42685B] font-semibold shadow-2xs'
                  : 'text-[#63726A] hover:text-[#303C36] font-normal'
              }`}
            >
              Magic Link
            </button>
          </div>
        </div>

        {/* Form Body */}
        {magicLinkSent ? (
          <div className="p-7 text-center space-y-4">
            <div className="w-11 h-11 rounded-full bg-[#42685B]/10 text-[#42685B] border border-[#B8C9BD]/60 flex items-center justify-center mx-auto">
              <Check className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[#303C36]">
                Check your inbox
              </h3>
              <p className="text-xs font-normal text-[#63726A] leading-relaxed">
                We sent a sign-in link to <strong className="font-medium text-[#303C36]">{email}</strong>. Click the link to sign in and automatically back up your studio data.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-[#42685B] text-white text-xs font-medium hover:bg-[#36544a] transition-colors"
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
              <label className="block text-xs font-normal text-[#63726A] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#63726A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@studio.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAFBFA] border border-[#E8ECE9] focus:border-[#42685B] focus:bg-white rounded-2xl text-sm font-normal text-[#303C36] placeholder:text-[#63726A]/70 focus:outline-none transition-all"
                />
              </div>
            </div>

            {mode !== 'magic' && (
              <div>
                <label className="block text-xs font-normal text-[#63726A] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#63726A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAFBFA] border border-[#E8ECE9] focus:border-[#42685B] focus:bg-white rounded-2xl text-sm font-normal text-[#303C36] placeholder:text-[#63726A]/70 focus:outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-normal text-[#63726A]">
                <Sparkles className="w-3.5 h-3.5 text-[#E8A184] shrink-0" />
                <span>Local items migrate automatically</span>
              </span>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 bg-[#42685B] hover:bg-[#36544a] disabled:opacity-50 text-white font-medium text-xs sm:text-sm px-5 py-2.5 rounded-full transition-all shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E8A184]" />
                ) : (
                  <Cloud className="w-3.5 h-3.5 text-[#E8A184]" />
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
