'use client';

import { useState } from 'react';
import {
  ClipboardList,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  TrendingUp,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { DriverSummary } from '../viewmodels/useDriverRegisterViewModel';

interface DriverRegisterViewProps {
  summaries: DriverSummary[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

/**
 * DriverRegisterView — Admin tab showing a per-driver accordion register.
 *
 * Top level: one row per driver with lifetime totals.
 * Expanded:  daily breakdown (date | trips | fares collected).
 *
 * Matches the existing dark-slate dashboard design language.
 */
export default function DriverRegisterView({
  summaries,
  isLoading,
  error,
  onRefresh,
}: DriverRegisterViewProps) {
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);

  const toggleDriver = (driverName: string) => {
    setExpandedDriver((prev) => (prev === driverName ? null : driverName));
  };

  // Format a "YYYY-MM-DD" date string to a human-readable form, e.g. "02 Oct 2026"
  const formatDate = (isoDate: string): string => {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Driver Register</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Daily fare collection record for every driver — click a row to expand
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center gap-3 text-rose-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 bg-slate-900/60 border border-slate-800/80 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && summaries.length === 0 && (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 text-center">
          <ClipboardList className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No fare records yet</p>
          <p className="text-slate-600 text-sm mt-1">
            Records will appear here once drivers start collecting fares.
          </p>
        </div>
      )}

      {/* Driver accordion list */}
      {!isLoading && summaries.length > 0 && (
        <div className="space-y-3">
          {summaries.map((driver, idx) => {
            const isOpen = expandedDriver === driver.driverName;
            return (
              <div
                key={driver.driverName}
                className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-xl"
              >
                {/* ── Driver summary row (clickable) ── */}
                <button
                  onClick={() => toggleDriver(driver.driverName)}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-850/40 transition-colors text-left cursor-pointer"
                >
                  {/* Rank badge */}
                  <span className="h-8 w-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
                    {idx + 1}
                  </span>

                  {/* Driver avatar */}
                  <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{driver.driverName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Driver</p>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-6 text-right">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Days Worked</p>
                      <p className="text-sm font-semibold text-white mt-0.5 flex items-center gap-1 justify-end">
                        <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                        {driver.totalDaysWorked}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Total Trips</p>
                      <p className="text-sm font-semibold text-white mt-0.5">
                        {driver.totalLifetimeTrips.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Lifetime Fares</p>
                      <p className="text-sm font-bold text-emerald-400 mt-0.5 flex items-center gap-1 justify-end">
                        <TrendingUp className="h-3.5 w-3.5" />
                        ₦{driver.totalLifetimeFares.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Expand chevron */}
                  <div className="ml-2 text-slate-500">
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </button>

                {/* ── Daily breakdown (expanded) ── */}
                {isOpen && (
                  <div className="border-t border-slate-800/80">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-950/45 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/50">
                            <th className="py-3 px-6">Date</th>
                            <th className="py-3 px-6">Trips</th>
                            <th className="py-3 px-6">Fares Collected</th>
                            <th className="py-3 px-6">Avg per Trip</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-slate-300">
                          {driver.dailyRecords.map((rec) => (
                            <tr
                              key={rec.workDate}
                              className="hover:bg-slate-850/30 transition-colors"
                            >
                              <td className="py-3 px-6 text-sm font-medium text-white">
                                {formatDate(rec.workDate)}
                              </td>
                              <td className="py-3 px-6 text-sm">
                                {rec.tripCount.toLocaleString()} passengers
                              </td>
                              <td className="py-3 px-6 text-sm font-semibold text-emerald-400">
                                ₦{rec.totalFares.toLocaleString()}
                              </td>
                              <td className="py-3 px-6 text-sm text-slate-400">
                                ₦
                                {rec.tripCount > 0
                                  ? Math.round(rec.totalFares / rec.tripCount).toLocaleString()
                                  : '0'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        {/* Driver subtotal footer */}
                        <tfoot>
                          <tr className="bg-slate-950/30 border-t border-slate-800/80 text-xs font-bold text-slate-300 uppercase tracking-wider">
                            <td className="py-3 px-6">Total</td>
                            <td className="py-3 px-6">
                              {driver.totalLifetimeTrips.toLocaleString()} passengers
                            </td>
                            <td className="py-3 px-6 text-emerald-400">
                              ₦{driver.totalLifetimeFares.toLocaleString()}
                            </td>
                            <td className="py-3 px-6 text-slate-500">
                              {driver.totalDaysWorked} day{driver.totalDaysWorked !== 1 ? 's' : ''}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
