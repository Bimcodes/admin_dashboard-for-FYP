import { useState, useEffect, useCallback } from 'react';
import { walletRepository, transactionRepository, fleetRepository } from '../models';

/**
 * ViewModel for the Financial Overview widget / dashboard home.
 * In MVVM, this is the ViewModel that exposes states and actions to the Financial Overview View.
 * It strictly separates the React rendering from the Repository data fetches.
 */
export const useFinancialOverviewViewModel = () => {
  const [totalMinted, setTotalMinted] = useState<number>(0);
  const [totalCirculation, setTotalCirculation] = useState<number>(0);
  const [treasuryBalance, setTreasuryBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Get Central Treasury Balance
      const treasuryWallet = await walletRepository.getWalletByType('Treasury');
      const treasuryBal = treasuryWallet ? treasuryWallet.balance : 0;
      setTreasuryBalance(treasuryBal);

      // 2. Calculate Total Minted (Sum of all MINT transactions)
      const allTx = await transactionRepository.getTransactions();
      const mintedSum = allTx
        .filter((tx) => tx.type === 'MINT')
        .reduce((sum, tx) => sum + tx.amount, 0);
      setTotalMinted(mintedSum);

      // 3. Calculate Total in Circulation = Agent Wallets + Student Wallets + Uncleared Bus Fares
      const allWallets = await walletRepository.getWallets();
      
      const agentSum = allWallets
        .filter((w) => w.walletType === 'Agent_Vault')
        .reduce((sum, w) => sum + w.balance, 0);

      const studentSum = allWallets
        .filter((w) => w.walletType === 'Student_Wallet')
        .reduce((sum, w) => sum + w.balance, 0);

      const allBuses = await fleetRepository.getBuses();
      const unclearedFaresSum = allBuses
        .filter((b) => !b.isReconciled)
        .reduce((sum, b) => sum + b.tokensCollected, 0);

      const circulationSum = agentSum + studentSum + unclearedFaresSum;
      setTotalCirculation(circulationSum);
    } catch (err: any) {
      console.error('Error fetching financial overview balances:', err);
      setError(err?.message || 'Failed to load financial data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return {
    totalMinted,
    totalCirculation,
    treasuryBalance,
    isLoading,
    error,
    refresh: fetchBalances,
  };
};
