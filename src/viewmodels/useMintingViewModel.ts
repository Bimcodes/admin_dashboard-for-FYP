import { useState, useCallback } from 'react';
import { walletRepository, transactionRepository } from '../models';

/**
 * ViewModel for the Minting Engine (Treasury Management).
 * Exposes form input states and the secure minting action.
 */
export const useMintingViewModel = (onMintSuccess?: () => void) => {
  const [amount, setAmount] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mintTokens = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setErrorMessage('Please enter a valid amount greater than zero.');
        setIsSubmitting(false);
        return;
      }

      if (!reference.trim()) {
        setErrorMessage('Please enter a bank deposit reference.');
        setIsSubmitting(false);
        return;
      }

      try {
        // 1. Fetch Treasury wallet
        const treasuryWallet = await walletRepository.getWalletByType('Treasury');
        if (!treasuryWallet) {
          throw new Error('Treasury Wallet not found. Please initialize the database.');
        }

        // 2. Update Treasury wallet balance (Double-Entry: Add to Treasury)
        await walletRepository.updateBalance(treasuryWallet.id, parsedAmount);

        // 3. Create the Transaction record
        await transactionRepository.createTransaction(
          'MINT',
          null, // Sender is null for minting
          treasuryWallet.id,
          parsedAmount,
          reference
        );

        setSuccessMessage(`Successfully minted ₦${parsedAmount.toLocaleString()} tokens to the Central Treasury Wallet.`);
        setAmount('');
        setReference('');
        if (onMintSuccess) onMintSuccess();
      } catch (err: any) {
        console.error('Error minting tokens:', err);
        setErrorMessage(err?.message || 'An error occurred during token minting.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [amount, reference, onMintSuccess]
  );

  return {
    amount,
    setAmount,
    reference,
    setReference,
    isSubmitting,
    successMessage,
    errorMessage,
    mintTokens,
  };
};
