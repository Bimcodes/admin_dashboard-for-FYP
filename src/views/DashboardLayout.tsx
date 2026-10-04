'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  LayoutDashboard,
  Coins,
  Users,
  Bus,
  LogOut,
  User,
  ScrollText,
  UserCog,
  ClipboardList,
  QrCode,
} from 'lucide-react';
import { createSupabaseBrowserClient } from '../lib/supabaseClient';

import FinancialOverviewView from './FinancialOverviewView';
import MintingEngineView from './MintingEngineView';
import AgentManagementView from './AgentManagementView';
import FleetMonitoringView from './FleetMonitoringView';
import TransactionHistoryView from './TransactionHistoryView';
import StaffRegistrationView from './StaffRegistrationView';
import DriverRegisterView from './DriverRegisterView';
import BusQrCodesView from './BusQrCodesView';

import { useFinancialOverviewViewModel } from '../viewmodels/useFinancialOverviewViewModel';
import { useMintingViewModel } from '../viewmodels/useMintingViewModel';
import { useAgentViewModel } from '../viewmodels/useAgentViewModel';
import { useFleetViewModel } from '../viewmodels/useFleetViewModel';
import { useTransactionHistoryViewModel } from '../viewmodels/useTransactionHistoryViewModel';
import { useDriverRegisterViewModel } from '../viewmodels/useDriverRegisterViewModel';

type Tab = 'overview' | 'mint' | 'agents' | 'fleet' | 'history' | 'staff' | 'register' | 'qrcodes';

/**
 * DashboardLayout - The main protected dashboard container.
 * Renders the Sidebar and header, and manages the active tab.
 * Hooks up the sub-views with their respective ViewModels (MVVM boundary).
 */
export default function DashboardLayout() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [adminName, setAdminName] = useState<string>('Transport Commission Admin');

  // Authentication check — verify real Supabase session on mount
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      // Fetch the admin's real name from the users table
      const { data: userRow } = await supabase
        .from('users')
        .select('name')
        .eq('id', session.user.id)
        .maybeSingle();
      if (userRow?.name) setAdminName(userRow.name);
    };

    checkSession();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Instantiating the ViewModels
  const overviewVM = useFinancialOverviewViewModel();
  const mintVM = useMintingViewModel(overviewVM.refresh);
  const agentVM = useAgentViewModel(overviewVM.refresh);
  const fleetVM = useFleetViewModel(overviewVM.refresh);
  const historyVM = useTransactionHistoryViewModel();
  const registerVM = useDriverRegisterViewModel();

  // Helper to render the view matching the active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <FinancialOverviewView
            totalMinted={overviewVM.totalMinted}
            totalCirculation={overviewVM.totalCirculation}
            totalBurned={overviewVM.totalBurned}
            treasuryBalance={overviewVM.treasuryBalance}
            isLoading={overviewVM.isLoading}
            error={overviewVM.error}
            onRefresh={overviewVM.refresh}
          />
        );
      case 'mint':
        return (
          <MintingEngineView
            amount={mintVM.amount}
            setAmount={mintVM.setAmount}
            reference={mintVM.reference}
            setReference={mintVM.setReference}
            isSubmitting={mintVM.isSubmitting}
            successMessage={mintVM.successMessage}
            errorMessage={mintVM.errorMessage}
            onSubmit={mintVM.mintTokens}
          />
        );
      case 'agents':
        return (
          <AgentManagementView
            agents={agentVM.agents}
            treasuryBalance={agentVM.treasuryBalance}
            isLoading={agentVM.isLoading}
            error={agentVM.error}
            transferAmount={agentVM.transferAmount}
            setTransferAmount={agentVM.setTransferAmount}
            selectedAgentId={agentVM.selectedAgentId}
            setSelectedAgentId={agentVM.setSelectedAgentId}
            isSubmitting={agentVM.isSubmitting}
            successMessage={agentVM.successMessage}
            setSuccessMessage={agentVM.setSuccessMessage}
            modalErrorMessage={agentVM.modalErrorMessage}
            setModalErrorMessage={agentVM.setModalErrorMessage}
            onTransferSubmit={agentVM.wholesaleTransfer}
            onRefresh={agentVM.refresh}
          />
        );
      case 'fleet':
        return (
          <FleetMonitoringView
            buses={fleetVM.buses}
            isLoading={fleetVM.isLoading}
            error={fleetVM.error}
            isReconcilingId={fleetVM.isReconcilingId}
            onReconcile={fleetVM.reconcileBus}
            onAddBus={fleetVM.addBus}
          />
        );
      case 'history':
        return (
          <TransactionHistoryView
            transactions={historyVM.transactions}
            totalCount={historyVM.totalCount}
            filter={historyVM.filter}
            setFilter={historyVM.setFilter}
            isLoading={historyVM.isLoading}
            error={historyVM.error}
            onRefresh={historyVM.refresh}
          />
        );
      case 'staff':
        return <StaffRegistrationView />;
      case 'register':
        return (
          <DriverRegisterView
            summaries={registerVM.summaries}
            isLoading={registerVM.isLoading}
            error={registerVM.error}
            onRefresh={registerVM.refresh}
          />
        );
      case 'qrcodes':
        return <BusQrCodesView />;
      default:
        return null;
    }
  };

  const navItems = [
    { id: 'overview'  as Tab, label: 'Financial Overview',  icon: LayoutDashboard },
    { id: 'mint'      as Tab, label: 'Minting Engine',      icon: Coins },
    { id: 'agents'    as Tab, label: 'Agent Management',    icon: Users },
    { id: 'fleet'     as Tab, label: 'Fleet Monitoring',    icon: Bus },
    { id: 'qrcodes'   as Tab, label: 'Bus QR Codes',        icon: QrCode },
    { id: 'history'   as Tab, label: 'Transaction History', icon: ScrollText },
    { id: 'staff'     as Tab, label: 'Staff Registry',      icon: UserCog },
    { id: 'register'  as Tab, label: 'Driver Register',     icon: ClipboardList },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col z-20 shrink-0">
        {/* Logo and Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3 bg-slate-950/30">
          <div className="h-9 w-9 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/10">
            <ShieldCheck className="h-5.5 w-5.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">Transit Comm.</h1>
            <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest block mt-0.5">Admin Ledger</span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  // Refresh ViewModel states when changing tabs
                  if (item.id === 'overview')  overviewVM.refresh();
                  if (item.id === 'agents')    agentVM.refresh();
                  if (item.id === 'fleet')     fleetVM.refresh();
                  if (item.id === 'history')   historyVM.refresh();
                  if (item.id === 'register')  registerVM.refresh();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                    : 'text-slate-400 hover:text-white hover:bg-slate-850/50'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-slate-800/85 bg-slate-950/20 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-350 font-semibold text-sm">
              <User className="h-4.5 w-4.5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{adminName}</p>
              <span className="text-[10px] text-slate-500">System Admin</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 border border-slate-800 hover:border-rose-500/20 hover:bg-rose-500/5 text-slate-400 hover:text-rose-400 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background blobs for aesthetics */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl -z-10"></div>

        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-slate-400 font-medium">Transit Network online</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400 font-semibold bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1.5">
            <span>Admin Active</span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-8 py-8">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}
