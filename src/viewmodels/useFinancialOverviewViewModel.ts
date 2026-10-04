import { useState, useEffect, useCallback } from 'react';
import { walletRepository, transactionRepository, fleetRepository } from '../models';

/**
 * ViewModel for the Financial Overview widget / dashboard home.
 * In MVVM, this is the ViewModel that exposes states and actions to the Financial Overview View.
 * It strictly separates the React rendering from the Repository data fetches.
 */
export const useFinancialOverviewViewModel = () => {
  const [totalMinted, setTotalMinted] = useState<number>(0);
  const [totalBurned, setTotalBurned] = useState<number>(0);
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

      const allTx = await transactionRepository.getTransactions();
      const ok = allTx.filter((tx) => tx.status === 'SUCCESS');
      const sumTx = (type: string) =>
        ok.filter((tx) => tx.type === type).reduce((s, tx) => s + tx.amount, 0);
        
      setTotalMinted(sumTx('MINT'));
      setTotalBurned(sumTx('BURN'));
      
      const allWallets = await walletRepository.getWallets();
      const sumWallets = (type: string) =>
        allWallets.filter((w) => w.walletType === type).reduce((s, w) => s + w.balance, 0);
        
      setTotalCirculation(
        sumWallets('Agent_Vault') + sumWallets('Student_Wallet') + sumWallets('Bus_Vault')
      );
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
    totalBurned,
    totalCirculation,
    treasuryBalance,
    isLoading,
    error,
    refresh: fetchBalances,
  };
};
