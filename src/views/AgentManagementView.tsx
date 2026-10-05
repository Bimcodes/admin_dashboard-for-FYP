'use client';

import { useState } from 'react';
import QRCode from 'react-qr-code';
import { Send, UserCheck, ShieldAlert, Landmark, X, CreditCard, AlertCircle } from 'lucide-react';
import { AgentListItem } from '../viewmodels/useAgentViewModel';

interface AgentManagementProps {
  agents: AgentListItem[];
  treasuryBalance: number;
  isLoading: boolean;
  error: string | null;
  transferAmount: string;
  setTransferAmount: (amount: string) => void;
  selectedAgentId: string;
  setSelectedAgentId: (id: string) => void;
  bankReference: string;
  setBankReference: (ref: string) => void;
  isSubmitting: boolean;
  successMessage: string | null;
  setSuccessMessage: (msg: string | null) => void;
  modalErrorMessage: string | null;
  setModalErrorMessage: (msg: string | null) => void;
  onTransferSubmit: (e: React.FormEvent) => void;
  onRefresh: () => void;
}

/**
 * AgentManagementView - UI view for ticket agents and wholesale distribution.
 * Implements a table listing and a modal transfer overlay.
 */
export default function AgentManagementView({
  agents,
  treasuryBalance,
  isLoading,
  error,
  transferAmount,
  setTransferAmount,
  selectedAgentId,
  setSelectedAgentId,
  bankReference,
  setBankReference,
  isSubmitting,
  successMessage,
  setSuccessMessage,
  modalErrorMessage,
  setModalErrorMessage,
  onTransferSubmit,
  onRefresh,
}: AgentManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openTransferModal = (agent: AgentListItem) => {
    setSelectedAgentId(agent.id);
    setSuccessMessage(null);
    setModalErrorMessage(null);
    setTransferAmount('');
    setIsModalOpen(true);
  };

  const closeTransferModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Agent Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage ticket agent accounts and distribute wholesale tokens</p>
        </div>
        <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-slate-300 text-sm font-medium">
          <Landmark className="h-4 w-4 text-indigo-400" />
          <span>Treasury Float: <strong className="text-white">₦{treasuryBalance.toLocaleString()}</strong></span>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Agents Registry Card */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-xl">
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-indigo-400" />
            Approved Ticket Agents Registry
          </h2>
          <span className="px-2.5 py-1 bg-slate-850 rounded-full text-xs font-semibold text-slate-400 border border-slate-800">
            {agents.length} Agents Registered
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center text-slate-500">
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
                  <th className="py-4 px-6">Agent Name</th>
                  <th className="py-4 px-6">Wallet Identifier</th>
                  <th className="py-4 px-6">Digital Vault Balance</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300">
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-850/30 transition-colors">
                    <td className="py-4 px-6 font-medium text-white flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs uppercase">
                        {agent.name.substring(0, 2)}
                      </div>
                      {agent.name}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-500">{agent.walletId}</td>
                    <td className="py-4 px-6 font-semibold text-white">₦{agent.balance.toLocaleString()}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openTransferModal(agent)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-md hover:shadow-indigo-500/15"
                        >
                          <Send className="h-3 w-3" />
                          Wholesale
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Wholesale Transfer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/30">
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <Send className="h-4.5 w-4.5 text-indigo-400" />
                Wholesale Token Transfer
              </h3>
              <button
                onClick={closeTransferModal}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              onTransferSubmit(e);
              // close modal if submit succeeded (successMessage becomes populated in viewmodel, but we want to let form handle it)
            }} className="p-6 space-y-4">
              {successMessage && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-400 text-sm">
                  {successMessage}
                </div>
              )}

              {modalErrorMessage && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400 text-sm">
                  {modalErrorMessage}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Recipient Agent</label>
                <div className="bg-slate-950 border border-slate-850 rounded-lg p-3 text-sm text-slate-200 font-medium flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] flex items-center justify-center font-bold">AG</div>
                  {agents.find((a) => a.id === selectedAgentId)?.name || 'Select Agent'}
                </div>
              </div>

              <div>
                <label htmlFor="amount" className="block text-xs font-semibold text-slate-400 mb-1">
                  Wholesale Amount (₦)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-500 text-sm">₦</span>
                  </div>
                  <input
                    type="number"
                    id="amount"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="block w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                    placeholder="e.g. 50,000"
                    disabled={isSubmitting || !!successMessage}
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bankRef" className="block text-xs font-semibold text-slate-400 mb-1">
                  Bank payment reference
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    id="bankRef"
                    value={bankReference}
                    onChange={(e) => setBankReference(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                    placeholder="e.g. TRF/2026/012"
                    disabled={isSubmitting || !!successMessage}
                    required
                  />
                </div>
              </div>

              {/* Show double entry warning */}
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 text-[11px] text-slate-400 flex gap-2">
                <ShieldAlert className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                <p>
                  <strong>Double-Entry Rule:</strong> ₦{parseFloat(transferAmount) || 0} will be deducted from the Central Treasury Float and added to the Agent's Digital Vault simultaneously.
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={closeTransferModal}
                  className="flex-1 py-2 border border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white rounded-lg text-sm font-semibold transition-all cursor-pointer"
                >
                  Close
                </button>
                {!successMessage && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Transferring...' : 'Confirm Transfer'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
