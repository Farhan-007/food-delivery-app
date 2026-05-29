'use client';

import { useState } from 'react';
import { useSession, signIn } from '@repo/auth/client';
import { ShieldCheck, Lock, Mail, KeyRound, Loader2, Sparkles, Pizza } from 'lucide-react';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await signIn.email({
        email,
        password,
      });

      if (response.error) {
        setError(response.error.message || 'Invalid login credentials.');
      } else {
        // Successful login - session will update automatically
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Loading State
  if (isPending) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Glow decorative spots */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative animate-bounce">
            <Pizza className="w-12 h-12 text-orange-500" />
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-orange-500 rounded-full animate-ping" />
          </div>
          <h2 className="text-xl font-bold text-slate-200 mt-2 flex items-center gap-2">
            Verifying Credentials <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
          </h2>
          <p className="text-slate-400 text-sm">Please wait while we secure your session...</p>
        </div>
      </div>
    );
  }

  const user = session?.user;
  const isAdmin = user && ((user as any).role === 'admin' || (user as any).role === 'super_admin');


  // 2. Unauthenticated or Non-Admin state -> Show Login Form
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Modern animated backdrop gradient nodes */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-tr from-orange-600/20 to-amber-500/0 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-bl from-amber-600/20 to-orange-500/0 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          {/* Logo brand */}
          <div className="flex justify-center items-center gap-2.5 mb-8">
            <div className="p-2.5 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-xl shadow-lg shadow-orange-500/20">
              <Pizza className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent tracking-tight">
                FoodHub<span className="text-orange-500">Admin</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium tracking-widest uppercase">Platform Terminal</p>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl shadow-black/50">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Lock className="w-5 h-5 text-orange-500" /> Administrative Login
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Authorized platform operators only. Access is tracked and audited.
              </p>
            </div>

            {user && !isAdmin && (
              <div className="mb-6 p-4.5 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200 text-xs leading-relaxed flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Access Denied:</span> Your account exists but does not have administrative privileges (<span className="font-mono text-amber-400">{(user as any).role}</span>). Please contact your administrator.
                </div>
              </div>

            )}

            {error && (
              <div className="mb-6 p-4 bg-red-950/40 border border-red-900/50 rounded-xl text-red-200 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@foodhub.com"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-orange-500/80 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Security Passkey
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-orange-500/80 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-600/10 hover:shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Authorizing...
                  </>
                ) : (
                  <>
                    Authorize Connection <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="text-center mt-6">
            <p className="text-xs text-slate-600 leading-normal">
              FoodHub Monorepo Node — Bun 1.x &middot; Hono &middot; tRPC v11<br />
              Secure token-based JWT session authentication via Better-Auth.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authorized -> Render the Dashboard
  return <>{children}</>;
}
