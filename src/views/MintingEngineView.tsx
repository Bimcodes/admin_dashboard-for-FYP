'use client';

import { ShieldCheck, Landmark, PlusCircle, AlertTriangle } from 'lucide-react';

interface MintingEngineProps {
  amount: string;
  setAmount: (amount: string) => void;
  reference: string;
  setReference: (ref: string) => void;
  isSubmitting: boolean;
  successMessage: string | null;
  errorMessage: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

/**
 * MintingEngineView - Presentation layer for Treasury Minting.
 * Form to input fiat bank references and mint digital tokens.
 */
export default function MintingEngineView({
  amount,
  setAmount,
  reference,
  setReference,
  isSubmitting,
  successMessage,
  errorMessage,
  onSubmit,
}: MintingEngineProps) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Minting Engine (Treasury Management)</h1>
        <p className="text-slate-400 text-sm mt-0.5">Convert fiat currency deposits into digital transit tokens</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Minting Form */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-indigo-400" />
            Mint New Digital Tokens
          </h2>

          <form onSubmit={onSubmit} className="space-y-5">
            {successMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-400 text-sm">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400 text-sm">
                {errorMessage}
              </div>
            )}

            <div>
              <label htmlFor="ref" className="block text-sm font-medium text-slate-350">
                Fiat Deposit Reference
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Landmark className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="text"
                  id="ref"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g. UBA-DEP-2026-90412"
                  disabled={isSubmitting}
                />
              </div>
              <p className="mt-1 text-slate-500 text-[11px]">
                Must match the transaction reference from the university bank account statement.
              </p>
            </div>

            <div>
              <label htmlFor="mint-amount" className="block text-sm font-medium text-slate-350">
                Amount (₦)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-500 sm:text-sm font-medium">₦</span>
                </div>
                <input
                  type="number"
                  id="mint-amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="block w-full pl-8 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="500,000"
                  disabled={isSubmitting}
                  min="1"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99] transition-all"
              >
                {isSubmitting ? 'Minting in progress...' : 'Mint Tokens'}
              </button>
            </div>
          </form>
        </div>

        {/* Security / Info Side Panel */}
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
            <h3 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-400" />
              Security Protocol
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Minting digital tokens is equivalent to printing legal currency within the campus transit network.
            </p>
            <ul className="text-slate-500 text-[11px] list-disc pl-4 mt-3 space-y-2">
              <li>Every minting operation creates a hard audit trail in the ledger.</li>
              <li>Always verify physical bank deposit clearance before performing a minting action.</li>
              <li>Minted tokens are directly deposited into the Central Treasury Wallet.</li>
            </ul>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 shadow-xl">
            <h3 className="text-md font-semibold text-amber-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Double-Entry Rule
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              The system automatically inserts a transaction record with `sender_wallet_id = null` and `type = MINT`. The ledger balance of the Central Treasury Wallet is atomically increased.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
