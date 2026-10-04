'use client';

// =============================================================================
// FILE: src/views/BusQrCodesView.tsx
// LAYER: View
//
// PURPOSE:
//   Dedicated admin page that generates and displays a QR code for every
//   registered bus. Each QR encodes the minimal BUS_BOARDING payload that the
//   Flutter passenger app parses via BusQrPayload.tryParse().
//
// QR PAYLOAD FORMAT (matches Flutter BusQrPayload model):
//   {
//     "type":         "BUS_BOARDING",
//     "vehicle_id":   "BUS-001",
//     "bus_vault_id": "<uuid>",
//     "route_name":   "Campus Transit",
//     "base_fare":    100
//   }
//
// DEPENDENCIES:
//   - qrcode            — generates QR data URLs client-side
//   - useFleetViewModel — reuses existing bus data fetching
// =============================================================================

import { useEffect, useState, useCallback } from 'react';
import QRCode from 'qrcode';
import { QrCode, RefreshCw, Download, Bus, AlertCircle, Loader2 } from 'lucide-react';
import { Bus as BusType } from '../models/types';
import { fleetRepository } from '../models';

// ── Types ────────────────────────────────────────────────────────────────────

/** The payload encoded inside each bus QR code. */
interface BusQrPayload {
  type: 'BUS_BOARDING';
  vehicle_id: string;
  bus_vault_id: string;
  route_name: string;
  base_fare: number;
}

/** Per-bus state: the generated QR data URL (or an error). */
interface BusQrEntry {
  bus: BusType;
  dataUrl: string | null;
  qrError: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Builds the JSON payload to be encoded in the QR code for a given bus.
 * Uses minimal fields: vehicle_id + bus_vault_id, with safe defaults for the
 * Flutter model's optional fields (route_name, base_fare).
 */
function buildPayload(bus: BusType): BusQrPayload {
  return {
    type: 'BUS_BOARDING',
    vehicle_id: bus.id,
    bus_vault_id: bus.vaultWalletId ?? '',
    route_name: 'Campus Transit',
    base_fare: 100,
  };
}

/**
 * Generates a QR code data URL for the given bus.
 * Returns null and logs an error if the vault wallet ID is missing.
 */
async function generateQrDataUrl(bus: BusType): Promise<{ dataUrl: string | null; qrError: string | null }> {
  if (!bus.vaultWalletId) {
    return { dataUrl: null, qrError: 'No vault wallet linked — re-register this bus.' };
  }

  try {
    const payload = buildPayload(bus);
    const dataUrl = await QRCode.toDataURL(JSON.stringify(payload), {
      width: 280,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    });
    return { dataUrl, qrError: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'QR generation failed';
    return { dataUrl: null, qrError: msg };
  }
}

/**
 * Triggers a PNG download of the QR code image for the given bus.
 */
function downloadQr(dataUrl: string, busId: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `qr-${busId}.png`;
  link.click();
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BusQrCodesView() {
  const [entries, setEntries] = useState<BusQrEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  /**
   * Fetches all buses from Supabase, then generates a QR code for each one.
   * Runs in parallel (Promise.all) for performance.
   */
  const loadQrCodes = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    setEntries([]);

    try {
      const buses = await fleetRepository.getBuses();

      const results = await Promise.all(
        buses.map(async (bus) => {
          const { dataUrl, qrError } = await generateQrDataUrl(bus);
          return { bus, dataUrl, qrError } satisfies BusQrEntry;
        })
      );

      setEntries(results);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load buses.';
      setFetchError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQrCodes();
  }, [loadQrCodes]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <QrCode className="h-6 w-6 text-indigo-400" />
            Bus QR Codes
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Print or display these QR codes inside each bus. Passengers scan them to pay their fare.
          </p>
        </div>

        <button
          onClick={loadQrCodes}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Fetch Error ──────────────────────────────────────────────────────── */}
      {fetchError && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center gap-3 text-rose-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {fetchError}
        </div>
      )}

      {/* ── Loading State ────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
          <p className="text-slate-400 text-sm">Generating QR codes…</p>
        </div>
      )}

      {/* ── Empty State ──────────────────────────────────────────────────────── */}
      {!isLoading && !fetchError && entries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 bg-slate-900/40 border border-slate-800 rounded-2xl">
          <Bus className="h-10 w-10 text-slate-600" />
          <p className="text-slate-400 text-sm">No buses registered yet.</p>
          <p className="text-slate-500 text-xs">Add a bus in Fleet Monitoring to generate its QR code.</p>
        </div>
      )}

      {/* ── QR Card Grid ─────────────────────────────────────────────────────── */}
      {!isLoading && entries.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {entries.map(({ bus, dataUrl, qrError }) => (
            <div
              key={bus.id}
              className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col items-center gap-4 shadow-xl backdrop-blur-xl"
            >
              {/* Bus ID badge */}
              <div className="w-full flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-indigo-400">{bus.id}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    bus.isReconciled
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  {bus.isReconciled ? 'Reconciled' : 'Active'}
                </span>
              </div>

              {/* QR Code image or error */}
              {qrError ? (
                <div className="w-[140px] h-[140px] flex flex-col items-center justify-center gap-2 bg-slate-800/60 rounded-xl border border-rose-500/20">
                  <AlertCircle className="h-6 w-6 text-rose-400" />
                  <p className="text-rose-400 text-[10px] text-center px-2">{qrError}</p>
                </div>
              ) : dataUrl ? (
                <div className="bg-white rounded-xl p-2 shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dataUrl}
                    alt={`QR code for ${bus.id}`}
                    width={140}
                    height={140}
                    className="block"
                  />
                </div>
              ) : null}

              {/* Vault wallet ID (truncated) */}
              <div className="w-full bg-slate-800/50 rounded-lg px-3 py-2 text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Vault Wallet</p>
                <p className="font-mono text-[10px] text-slate-400 truncate">
                  {bus.vaultWalletId ?? 'Not linked'}
                </p>
              </div>

              {/* Download button */}
              {dataUrl && (
                <button
                  onClick={() => downloadQr(dataUrl, bus.id)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download PNG
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Info Footer ──────────────────────────────────────────────────────── */}
      {!isLoading && entries.length > 0 && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex gap-4">
          <QrCode className="h-6 w-6 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-white">How to use these QR codes</h3>
            <p className="text-xs text-slate-400 leading-relaxed mt-1">
              Print one QR code and mount it visibly inside the corresponding bus.
              When a passenger opens the Metro Pass app and scans it, tokens are
              automatically transferred from their wallet to the bus vault in real time.
              The driver sees each boarding event instantly on their device.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
