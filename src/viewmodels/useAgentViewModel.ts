import { useState, useEffect, useCallback } from 'react';
import { userRepository, walletRepository, transactionRepository } from '../models';
import { User, Wallet } from '../models/types';

export interface AgentListItem {
  id: string;
  name: string;
  walletId: string;
  balance: number;
}

/**
 * ViewModel for Agent Management & Wholesale Distribution.
 * Exposes the list of agents, treasury balance, and the transfer method.
 */
export const useAgentViewModel = (onTransferSuccess?: () => void) => {
  const [agents, setAgents] = useState<AgentListItem[]>([]);
  const [treasuryBalance, setTreasuryBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Wholesale modal state
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [modalErrorMessage, setModalErrorMessage] = useState<string | null>(null);

  const fetchAgentsAndBalances = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Get Treasury Balance
      const treasuryWallet = await walletRepository.getWalletByType('Treasury');
      setTreasuryBalance(treasuryWallet ? treasuryWallet.balance : 0);

      // 2. Fetch all Users with role "Agent"
      const allUsers = await userRepository.getUsers();
      const agentUsers = allUsers.filter((u) => u.role === 'Agent');

      // 3. Match each agent user with their wallet balance
      const agentList: AgentListItem[] = [];
      for (const agent of agentUsers) {
        const wallet = await walletRepository.getWalletByOwnerId(agent.id);
        agentList.push({
          id: agent.id,
          name: agent.name,
          walletId: wallet ? wallet.id : '',
          balance: wallet ? wallet.balance : 0,
        });
      }
      setAgents(agentList);
    } catch (err: any) {
      console.error('Error fetching agents:', err);
      setError(err?.message || 'Failed to load agents.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const wholesaleTransfer = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setModalErrorMessage(null);
      setSuccessMessage(null);

      const parsedAmount = parseFloat(transferAmount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setModalErrorMessage('Please enter a valid amount greater than zero.');
        setIsSubmitting(false);
        return;
      }

      if (!selectedAgentId) {
        setModalErrorMessage('Please select a ticket agent.');
        setIsSubmitting(false);
        return;
      }

      try {
        // 1. Fetch Treasury wallet
        const treasuryWallet = await walletRepository.getWalletByType('Treasury');
        if (!treasuryWallet) {
          throw new Error('Treasury Wallet not found.');
        }

        // Check sufficient funds in Treasury
        if (treasuryWallet.balance < parsedAmount) {
          throw new Error(`Insufficient funds in Treasury. Available: ₦${treasuryWallet.balance.toLocaleString()}`);
        }

        // 2. Fetch Agent wallet
        const agentWallet = await walletRepository.getWalletByOwnerId(selectedAgentId);
        if (!agentWallet) {
          throw new Error('Selected Agent does not have a wallet.');
        }

        // 3. Double-entry Accounting transaction:
        // Subtract from Treasury
        await walletRepository.updateBalance(treasuryWallet.id, -parsedAmount);
        // Add to Agent Vault
        await walletRepository.updateBalance(agentWallet.id, parsedAmount);

        // 4. Record Wholesale Transaction
        await transactionRepository.createTransaction(
          'WHOLESALE',
          treasuryWallet.id,
          agentWallet.id,
          parsedAmount
        );

        setSuccessMessage(`Successfully transferred ₦${parsedAmount.toLocaleString()} tokens to Agent Wallet.`);
        setTransferAmount('');
        await fetchAgentsAndBalances(); // Refresh lists
        if (onTransferSuccess) onTransferSuccess();
      } catch (err: any) {
        console.error('Error in wholesale transfer:', err);
        setModalErrorMessage(err?.message || 'An error occurred during transfer.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [transferAmount, selectedAgentId, fetchAgentsAndBalances, onTransferSuccess]
  );

  const initPaystackPayment = useCallback(async (agentId: string, amountInKobo: number) => {
    try {
      const res = await fetch('/api/admin/init-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, amountInKobo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize payment');
      return data as { authorizationUrl: string };
    } catch (err: any) {
      console.error('Error initializing Paystack payment:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchAgentsAndBalances();
  }, [fetchAgentsAndBalances]);

  return {
    agents,
    treasuryBalance,
    isLoading,
    error,
    transferAmount,
    setTransferAmount,
    selectedAgentId,
    setSelectedAgentId,
    isSubmitting,
    successMessage,
    setSuccessMessage,
    modalErrorMessage,
    setModalErrorMessage,
    wholesaleTransfer,
    refresh: fetchAgentsAndBalances,
    initPaystackPayment,
  };
};
