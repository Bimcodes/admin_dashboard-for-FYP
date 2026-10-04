'use client';

import { useState, useRef } from 'react';
import QRCode from 'react-qr-code';
import {
  UserCog, UserPlus, Users, QrCode, Download,
  CheckCircle2, AlertCircle, X, ShieldCheck, Bus,
} from 'lucide-react';
import { useStaffViewModel } from '../viewmodels/useStaffViewModel';
import { User } from '../models/types';

/**
 * StaffRegistrationView — Admin registers Agents and Drivers.
 * On success, shows a QR code the staff member scans in the Flutter app
 * to auto-create their account.
 */
export default function StaffRegistrationView() {
  const vm = useStaffViewModel();
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownloadQr = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${vm.createdStaff?.staffCode ?? 'staff'}-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // QR code payload — scanned by the Flutter app
  const qrPayload = vm.createdStaff
    ? JSON.stringify({
        e: vm.createdStaff.email,
        p: vm.createdStaff.tempPassword,
        r: vm.createdStaff.role,
        c: vm.createdStaff.staffCode,
      })
    : '';

  const agents = vm.staffList.filter((s) => s.role === 'Agent');
  const drivers = vm.staffList.filter((s) => s.role === 'Driver');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Staff Registry</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Register new Agents and Drivers — generate a QR code for mobile app sign-in
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Registration Form (left) ── */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
            <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-5">
              <UserPlus className="h-4.5 w-4.5 text-indigo-400" />
              Register New Staff Member
            </h2>

            <form onSubmit={vm.registerStaff} className="space-y-4">
              {vm.error && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-rose-400 text-sm flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  {vm.error}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label htmlFor="staff-name" className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Full Name
                </label>
                <input
                  id="staff-name"
                  type="text"
                  value={vm.name}
                  onChange={(e) => vm.setName(e.target.value)}
                  placeholder="e.g. John Babatunde"
                  required
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* Email Address */}
              <div>
                <label htmlFor="staff-email" className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Email Address
                </label>
                <input
                  id="staff-email"
                  type="email"
                  value={vm.email}
                  onChange={(e) => vm.setEmail(e.target.value)}
                  placeholder="e.g. john@example.com"
                  required
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* Role Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Agent', 'Driver'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => vm.setRole(r)}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                        vm.role === r
                          ? r === 'Agent'
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                            : 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {r === 'Agent' ? <ShieldCheck className="h-4 w-4" /> : <Bus className="h-4 w-4" />}
                      {r}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  {vm.role === 'Agent'
                    ? 'Code will be: AGT-001, AGT-002, …'
                    : 'Code will be: DRV-001, DRV-002, …'}
                </p>
              </div>

              <button
                type="submit"
                disabled={vm.isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-sm font-bold transition-all hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {vm.isSubmitting ? 'Creating account…' : 'Register & Generate QR'}
              </button>
            </form>
          </div>
        </div>

        {/* ── QR Code Panel (right) ── */}
        <div className="lg:col-span-3">
          {vm.createdStaff ? (
            <div className="bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-6 shadow-xl backdrop-blur-xl relative">
              <button
                onClick={vm.dismissQr}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 mb-5">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <h2 className="text-base font-semibold text-white">
                  {vm.createdStaff.name} registered successfully
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 items-center">
                {/* QR Code */}
                <div ref={qrRef} className="bg-white p-4 rounded-2xl shadow-2xl shrink-0">
                  <QRCode
                    value={qrPayload}
                    size={180}
                    level="M"
                    style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                  />
                </div>

                {/* Details */}
                <div className="space-y-3 flex-1">
                  <div className="space-y-2">
                    <DetailRow label="Staff Code" value={vm.createdStaff.staffCode} mono highlight />
                    <DetailRow label="Role" value={vm.createdStaff.role} />
                    <DetailRow label="Internal Email" value={vm.createdStaff.email} mono />
                    <DetailRow label="Temp Password" value={vm.createdStaff.tempPassword} mono />
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[11px] text-amber-400">
                    <strong>Instructions:</strong> Show this QR code to {vm.createdStaff.name}.
                    They scan it in the Flutter app → automatic sign-in → they set their own password.
                    The QR disappears when you close this panel.
                  </div>

                  <button
                    onClick={handleDownloadQr}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download QR as SVG
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[280px]">
              <QrCode className="h-12 w-12 text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm font-medium">QR code appears here</p>
              <p className="text-slate-600 text-xs mt-1">
                Register a staff member on the left to generate their onboarding QR code
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Staff Table ── */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-xl">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-indigo-400" />
            Registered Staff
          </h2>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-semibold">
              {agents.length} Agent{agents.length !== 1 ? 's' : ''}
            </span>
            <span className="px-2.5 py-1 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full text-xs font-semibold">
              {drivers.length} Driver{drivers.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {vm.isLoading ? (
          <div className="py-12 flex justify-center">
            <svg className="animate-spin h-7 w-7 text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : vm.staffList.length === 0 ? (
          <div className="py-12 text-center">
            <UserCog className="h-10 w-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No staff registered yet</p>
            <p className="text-slate-600 text-xs mt-1">Register your first Agent or Driver above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/45 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/50">
                  <th className="py-3.5 px-5">Name</th>
                  <th className="py-3.5 px-5">Role</th>
                  <th className="py-3.5 px-5">User ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {vm.staffList.map((s) => (
                  <StaffRow key={s.id} staff={s} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  label, value, mono = false, highlight = false,
}: {
  label: string; value: string; mono?: boolean; highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span className={`text-xs text-right break-all ${mono ? 'font-mono' : ''} ${highlight ? 'text-emerald-400 font-bold text-sm' : 'text-slate-300'}`}>
        {value}
      </span>
    </div>
  );
}

function StaffRow({ staff }: { staff: User }) {
  const isAgent = staff.role === 'Agent';
  return (
    <tr className="hover:bg-slate-800/20 transition-colors">
      <td className="py-3.5 px-5 font-medium text-white flex items-center gap-3">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs border ${
          isAgent
            ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
            : 'bg-violet-500/10 border-violet-500/20 text-violet-400'
        }`}>
          {staff.name.substring(0, 2).toUpperCase()}
        </div>
        {staff.name}
      </td>
      <td className="py-3.5 px-5">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
          isAgent
            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
            : 'bg-violet-500/10 text-violet-400 border-violet-500/20'
        }`}>
          {isAgent ? <ShieldCheck className="h-3 w-3" /> : <Bus className="h-3 w-3" />}
          {staff.role}
        </span>
      </td>
      <td className="py-3.5 px-5 font-mono text-xs text-slate-500">
        …{staff.id.slice(-12)}
      </td>
    </tr>
  );
}
