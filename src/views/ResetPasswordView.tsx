'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '../lib/supabaseClient';
import { Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordView() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    // When this page loads via the email link, Supabase automatically parses the
    // #access_token or ?code from the URL and establishes a session.
    // We just need to wait a brief moment to confirm the session exists.
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setHasValidSession(true);
        } else {
          // Sometimes it takes a split second for the auth listener to pick it up from the URL
          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
            if (newSession) {
              setHasValidSession(true);
            }
          });
          
          // If after 2 seconds we still have no session, the link is likely invalid or expired.
          setTimeout(() => {
            if (!hasValidSession) setIsCheckingSession(false);
          }, 2000);
          
          return () => subscription.unsubscribe();
        }
      } catch (err) {
        console.error('Session check failed', err);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [supabase.auth, hasValidSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred updating your password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-400 text-sm font-medium animate-pulse">Verifying secure link...</p>
        </div>
      </div>
    );
  }

  if (!hasValidSession && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="w-full max-w-md bg-slate-900/60 border border-rose-500/30 rounded-2xl p-8 shadow-xl backdrop-blur-xl text-center">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Invalid or Expired Link</h2>
          <p className="text-slate-400 text-sm mb-6">
            This password reset link is no longer valid. Please return to the QR Fare mobile app and request a new one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans relative overflow-hidden">
      {/* Background glowing orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          
          <div className="mb-8 text-center">
            <div className="mx-auto w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Set New Password</h1>
            <p className="text-slate-400 text-sm mt-2">
              Create a strong new password for your QR Fare account.
            </p>
          </div>

          {success ? (
            <div className="text-center py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Password Updated!</h2>
              <p className="text-slate-400 text-sm mb-8">
                Your password has been changed successfully. You can now close this window and return to the QR Fare app to log in.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-rose-400 text-sm flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-4 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Confirm Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-sm font-bold transition-all hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center h-[52px]"
              >
                {isSubmitting ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  'Save New Password'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
