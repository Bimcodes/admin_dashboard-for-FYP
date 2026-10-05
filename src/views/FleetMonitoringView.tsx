'use client';

import { useState } from 'react';
import { Bus, Play, CheckCircle2, UserPlus, Flame, AlertCircle } from 'lucide-react';
import { Bus as BusType } from '../models/types';

interface FleetMonitoringProps {
  buses: BusType[];
  isLoading: boolean;
  error: string | null;
  isReconcilingId: string | null;
  isAddingBus: boolean;
  onReconcile: (id: string) => void;
  onAddBus: (busLabel?: string) => void;
}

/**
 * FleetMonitoringView - View layer for Fleet Monitoring & end-of-shift reconciliation.
 * Allows driver payouts and token burning.
 */
export default function FleetMonitoringView({
  buses,
  isLoading,
  error,
  isReconcilingId,
  isAddingBus,
  onReconcile,
  onAddBus,
}: FleetMonitoringProps) {
  const [newBusLabel, setNewBusLabel] = useState('');
  const [plateError, setPlateError] = useState('');

  const PLATE_REGEX = /^OAU-\d{3}$/;

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setNewBusLabel(val);
    if (val && !PLATE_REGEX.test(val)) {
      setPlateError('Format: OAU-001');
    } else {
      setPlateError('');
    }
  };

  const handleAddBusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBusLabel && !PLATE_REGEX.test(newBusLabel)) {
      setPlateError('Plate must follow format: OAU-001');
      return;
    }
    onAddBus(newBusLabel);
    setNewBusLabel('');
    setPlateError('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Fleet Monitoring &amp; Nightly Reconciliation</h1>
          <p className="text-slate-400 text-sm mt-0.5">Track live bus earnings and settle driver payouts by burning tokens</p>
        </div>

        {/* Add Bus Mini Form */}
        <div className="flex flex-col items-end gap-1">
          <form onSubmit={handleAddBusSubmit} className="flex gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1.5 max-w-sm w-full sm:w-auto">
            <input
              type="text"
              value={newBusLabel}
              onChange={handlePlateChange}
              placeholder="e.g. OAU-001"
              disabled={isAddingBus}
              className="bg-transparent border-none text-xs text-white placeholder-slate-500 pl-3 focus:outline-none focus:ring-0 w-full sm:w-44 disabled:opacity-50 uppercase"
            />
            <button
              type="submit"
              disabled={isAddingBus || !!plateError}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white rounded-md text-xs font-semibold px-3 py-1.5 transition-colors cursor-pointer shrink-0"
            >
              {isAddingBus ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Adding...
                </>
              ) : (
                <>
                  <Bus className="h-3.5 w-3.5" />
                  Add Bus
                </>
              )}
            </button>
          </form>
          {plateError && (
            <p className="text-rose-400 text-xs pr-1">{plateError}</p>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Fleet Overview Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-xl">
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Bus className="h-5 w-5 text-indigo-400" />
            Active Fleet Status & Ledger Settle
          </h2>
          <span className="px-2.5 py-1 bg-slate-850 rounded-full text-xs font-semibold text-slate-400 border border-slate-800">
            {buses.length} Active Routes
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <svg className="animate-spin h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/45 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/50">
                  <th className="py-4 px-6">Bus ID</th>
                  <th className="py-4 px-6">Label / Plate</th>
                  <th className="py-4 px-6">Riders (Today)</th>
                  <th className="py-4 px-6">Fares Collected</th>
                  <th className="py-4 px-6">Ledger Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300">
                {buses.map((bus) => (
                  <tr key={bus.id} className="hover:bg-slate-850/30 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs font-bold text-indigo-400">{bus.id}</td>
                    <td className="py-4 px-6 font-medium text-white">{bus.plateNumber || '—'}</td>
                    <td className="py-4 px-6">{bus.passengerCount} passengers</td>
                    <td className="py-4 px-6 font-semibold text-white">₦{bus.tokensCollected.toLocaleString()}</td>
                    <td className="py-4 px-6">
                      {bus.isReconciled ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Reconciled & Burned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Uncleared Fare
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      {!bus.isReconciled && (
                        <>
                          <button
                            onClick={() => onReconcile(bus.id)}
                            disabled={isReconcilingId === bus.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-md hover:shadow-rose-500/15 disabled:opacity-50"
                          >
                            {isReconcilingId === bus.id ? (
                              'Processing...'
                            ) : (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Mark as Paid
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Burn Explanation Box */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex gap-4">
        <Flame className="h-7 w-7 text-rose-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-white">How does Token Burning work?</h3>
          <p className="text-xs text-slate-400 leading-relaxed mt-1">
            When a driver completes their shift, they submit their QR tickets representing the <strong>Uncleared Bus Fares</strong>.
            Clicking <strong>Mark as Paid</strong> signifies that the Transport Commission has paid the driver in real physical cash (fiat).
            As double-entry, those digital tokens are permanently <strong>burned (deleted)</strong> from the digital circulation supply, keeping the ledger balanced with real cash reserves.
          </p>
        </div>
      </div>
    </div>
  );
}
