'use client';

import { useState, useEffect, useCallback } from 'react';
import { transactionRepository } from '../models';
import { Transaction } from '../models/types';

export type TxFilter = 'ALL' | 'MINT' | 'WHOLESALE' | 'FARE' | 'BURN';

/**
 * ViewModel for the Transaction History tab.
 * Fetches all transactions from Supabase and exposes filter state.
 */
export const useTransactionHistoryViewModel = () => {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<TxFilter>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const txs = await transactionRepository.getTransactions();
      setAllTransactions(txs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load transactions.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filtered = filter === 'ALL'
    ? allTransactions
    : allTransactions.filter((tx) => tx.type === filter);

  return {
    transactions: filtered,
    totalCount: allTransactions.length,
    filter,
    setFilter,
    isLoading,
    error,
    refresh: fetchTransactions,
  };
};
