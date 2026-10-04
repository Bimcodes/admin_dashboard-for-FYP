'use client';

import { ScrollText, RefreshCw, ArrowUpRight, ArrowDownLeft, Flame, Coins, Filter } from 'lucide-react';
import { Transaction } from '../models/types';
import { TxFilter } from '../viewmodels/useTransactionHistoryViewModel';

interface TransactionHistoryProps {
  transactions: Transaction[];
  totalCount: number;
  filter: TxFilter;
  setFilter: (f: TxFilter) => void;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const TYPE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; Icon: React.ElementType }
> = {
  MINT:      { label: 'MINT',      color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', Icon: Coins },
  WHOLESALE: { label: 'WHOLESALE', color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20',  Icon: ArrowDownLeft },
  FARE:      { label: 'FARE',      color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  Icon: ArrowUpRight },
  BURN:      { label: 'BURN',      color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    Icon: Flame },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  SUCCESS: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  PENDING: { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20'   },
  FAILED:  { color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20'     },
};

const FILTERS: TxFilter[] = ['ALL', 'MINT', 'WHOLESALE', 'FARE', 'BURN'];

function shortId(id: string | null | undefined): string {
  if (!id) return '—';
  // If it looks like a UUID, shorten it; otherwise show as-is truncated
  if (id.includes('-') && id.length > 12) return `…${id.slice(-8)}`;
  return id.length > 14 ? `${id.slice(0, 14)}…` : id;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/**
 * TransactionHistoryView — full ledger of all Supabase transactions.
 * Colour-coded by type with filter tabs and refresh.
 */
export default function TransactionHistoryView({
  transactions,
  totalCount,
  filter,
  setFilter,
  isLoading,
  error,
  onRefresh,
}: TransactionHistoryProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Transaction History</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Complete ledger of all token movements — {totalCount} total records
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-sm text-slate-300 font-medium transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-slate-500 shrink-0" />
        {FILTERS.map((f) => {
          const cfg = f !== 'ALL' ? TYPE_CONFIG[f] : null;
          const isActive = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                isActive
                  ? cfg
                    ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                    : 'bg-slate-700 text-white border-slate-600'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Table Card */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-xl">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <ScrollText className="h-4.5 w-4.5 text-indigo-400" />
            Ledger Entries
          </h2>
          <span className="px-2.5 py-1 bg-slate-850 rounded-full text-xs font-semibold text-slate-400 border border-slate-800">
            {transactions.length} {filter !== 'ALL' ? filter : ''} record{transactions.length !== 1 ? 's' : ''}
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 flex justify-center">
            <svg className="animate-spin h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center">
            <ScrollText className="h-10 w-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-medium">No transactions yet</p>
            <p className="text-slate-600 text-xs mt-1">
              {filter !== 'ALL' ? `No ${filter} transactions found.` : 'Mint tokens to get started.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/45 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/50">
                  <th className="py-3.5 px-5">Type</th>
                  <th className="py-3.5 px-5">Amount</th>
                  <th className="py-3.5 px-5">From Wallet</th>
                  <th className="py-3.5 px-5">To Wallet</th>
                  <th className="py-3.5 px-5">Reference</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Date &amp; Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {transactions.map((tx) => {
                  const typeCfg = TYPE_CONFIG[tx.type] ?? TYPE_CONFIG.MINT;
                  const statusCfg = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.SUCCESS;
                  const TypeIcon = typeCfg.Icon;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/20 transition-colors group">
                      {/* Type */}
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${typeCfg.bg} ${typeCfg.color} ${typeCfg.border}`}>
                          <TypeIcon className="h-3 w-3" />
                          {typeCfg.label}
                        </span>
                      </td>
                      {/* Amount */}
                      <td className="py-3.5 px-5 font-bold text-white text-sm">
                        ₦{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      {/* From */}
                      <td className="py-3.5 px-5 font-mono text-xs text-slate-400 group-hover:text-slate-300 transition-colors" title={tx.senderWalletId ?? 'N/A'}>
                        {tx.senderWalletId ? shortId(tx.senderWalletId) : <span className="text-slate-600 italic">System</span>}
                      </td>
                      {/* To */}
                      <td className="py-3.5 px-5 font-mono text-xs text-slate-400 group-hover:text-slate-300 transition-colors" title={tx.receiverWalletId ?? 'N/A'}>
                        {tx.receiverWalletId ? shortId(tx.receiverWalletId) : <span className="text-slate-600 italic">Burned</span>}
                      </td>
                      {/* Reference */}
                      <td className="py-3.5 px-5 text-xs text-slate-500">
                        {tx.reference ?? <span className="italic">—</span>}
                      </td>
                      {/* Status */}
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
                          {tx.status}
                        </span>
                      </td>
                      {/* Date */}
                      <td className="py-3.5 px-5 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(tx.timestamp)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
