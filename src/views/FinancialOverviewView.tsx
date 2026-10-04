'use client';

import { Landmark, Coins, Activity, RefreshCw } from 'lucide-react';

interface FinancialOverviewProps {
  totalMinted: number;
  totalBurned: number;
  totalCirculation: number;
  treasuryBalance: number;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

/**
 * FinancialOverviewView - Dumb UI component.
 * Displays widgets showing Minted, Circulation, and Treasury balances.
 */
export default function FinancialOverviewView({
  totalMinted,
  totalBurned,
  totalCirculation,
  treasuryBalance,
  isLoading,
  error,
  onRefresh,
}: FinancialOverviewProps) {
  const difference = totalMinted - (treasuryBalance + totalCirculation + totalBurned);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Financial Overview</h1>
          <p className="text-slate-400 text-sm mt-0.5">Real-time snapshot of the transit digital economy</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-sm text-slate-300 font-medium transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Grid of Financial Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Central Treasury Balance */}
        <div className="relative overflow-hidden bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl group hover:border-indigo-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all duration-500"></div>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                Central Treasury
              </span>
              <p className="text-3xl font-bold text-white tracking-tight mt-1">
                ₦{isLoading ? '...' : treasuryBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Available to sell to approved Agents
              </p>
            </div>
            <div className="h-12 w-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform duration-300">
              <Landmark className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Total in Circulation */}
        <div className="relative overflow-hidden bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl group hover:border-violet-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition-all duration-500"></div>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
                Total in Circulation
              </span>
              <p className="text-3xl font-bold text-white tracking-tight mt-1">
                ₦{isLoading ? '...' : totalCirculation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Agent + Student Wallets + Uncleared Bus Fares
              </p>
            </div>
            <div className="h-12 w-12 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform duration-300">
              <Activity className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Total Minted */}
        <div className="relative overflow-hidden bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl group hover:border-emerald-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500"></div>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Total Minted (All-Time)
              </span>
              <p className="text-3xl font-bold text-white tracking-tight mt-1">
                ₦{isLoading ? '...' : totalMinted.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                All-time fiat deposits converted to digital ledger
              </p>
            </div>
            <div className="h-12 w-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform duration-300">
              <Coins className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Overview visual ledger guide for the user */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 mt-6">
        <h3 className="text-sm font-semibold text-white mb-2">Ledger Equation Check</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          The QR Fare System operates a strictly closed-loop ledger. At any point in time:
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-3 bg-slate-950/60 p-4 border border-slate-850 rounded-lg font-mono text-xs">
          <div className="flex-1 text-center py-2 bg-slate-900/50 rounded border border-slate-800">
            <span className="block text-slate-500 text-[10px]">TOTAL MINTED</span>
            <span className="text-emerald-400 font-semibold mt-1 block">₦{totalMinted.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-center text-slate-500 font-bold">=</div>
          <div className="flex-1 text-center py-2 bg-slate-900/50 rounded border border-slate-800">
            <span className="block text-slate-500 text-[10px]">TREASURY BALANCE</span>
            <span className="text-indigo-400 font-semibold mt-1 block">₦{treasuryBalance.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-center text-slate-500 font-bold">+</div>
          <div className="flex-1 text-center py-2 bg-slate-900/50 rounded border border-slate-800">
            <span className="block text-slate-500 text-[10px]">IN CIRCULATION</span>
            <span className="text-violet-400 font-semibold mt-1 block">₦{totalCirculation.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-center text-slate-500 font-bold">+</div>
          <div className="flex-1 text-center py-2 bg-slate-900/50 rounded border border-slate-800">
            <span className="block text-slate-500 text-[10px]">BURNED (RECONCILED)</span>
            <span className="text-slate-400 font-semibold mt-1 block">₦{totalBurned.toLocaleString()}</span>
          </div>
        </div>
        {difference !== 0 && (
          <p className="text-rose-400 text-xs mt-2">
            Ledger mismatch of NGN {difference.toLocaleString()}. Investigate before continuing.
          </p>
        )}
      </div>
    </div>
  );
}
