'use client';

import { useState } from 'react';
import { 
  Settings, 
  DollarSign, 
  Percent, 
  Mail, 
  Bell, 
  ShieldAlert, 
  Loader2, 
  Save, 
  CheckCircle2 
} from 'lucide-react';

export function SettingsPanel() {
  const [platformFee, setPlatformFee] = useState(5.0);
  const [taxRate, setTaxRate] = useState(8.5);
  const [supportEmail, setSupportEmail] = useState('support@foodhub.com');
  const [enableOTP, setEnableOTP] = useState(true);
  const [enableSocial, setEnableSocial] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSuccess(false);

    // Simulate backend settings update
    setTimeout(() => {
      setSaveLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">
          Global <span className="text-orange-500">Settings</span>
        </h1>
        <p className="text-slate-400 mt-1">Regulate system commissions, authentication procedures, and support parameters.</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 shadow-xl space-y-6">
        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-xs text-emerald-300 font-bold animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Platform settings saved and propagated to network nodes successfully!</span>
          </div>
        )}

        {/* Finance settings */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-orange-500" /> Financial Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Platform Commission Fee (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={platformFee}
                  onChange={(e) => setPlatformFee(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 pr-10"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-bold">%</div>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Estimated Tax Surcharge (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 pr-10"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-bold">%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Auth settings */}
        <div className="space-y-4 border-t border-slate-800/80 pt-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-orange-500" /> Authentication Policies
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-slate-950/40 p-4 border border-slate-850 rounded-2xl">
              <div>
                <label className="text-xs font-bold text-slate-200">Phone OTP Authentication</label>
                <p className="text-[10px] text-slate-500 mt-0.5">Require 6-digit text message verify codes during mobile checkout signups.</p>
              </div>
              <input
                type="checkbox"
                checked={enableOTP}
                onChange={(e) => setEnableOTP(e.target.checked)}
                className="w-4.5 h-4.5 text-orange-500 focus:ring-0 rounded border-slate-850 bg-slate-900 focus:ring-offset-0 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between bg-slate-950/40 p-4 border border-slate-850 rounded-2xl">
              <div>
                <label className="text-xs font-bold text-slate-200">Social Sign In (OAuth)</label>
                <p className="text-[10px] text-slate-500 mt-0.5">Permit instant profile registrations via Google or Apple APIs.</p>
              </div>
              <input
                type="checkbox"
                checked={enableSocial}
                onChange={(e) => setEnableSocial(e.target.checked)}
                className="w-4.5 h-4.5 text-orange-500 focus:ring-0 rounded border-slate-850 bg-slate-900 focus:ring-offset-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Support channels */}
        <div className="space-y-4 border-t border-slate-800/80 pt-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Mail className="w-4 h-4 text-orange-500" /> Support Routing
          </h3>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Escalation Support Email
            </label>
            <input
              type="email"
              required
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="border-t border-slate-800/80 pt-6 flex justify-end">
          <button
            type="submit"
            disabled={saveLoading}
            className="bg-orange-500 hover:bg-orange-400 text-white font-black py-3 px-6 rounded-xl text-xs shadow-lg shadow-orange-500/10 hover:shadow-orange-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saveLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Configuration
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
