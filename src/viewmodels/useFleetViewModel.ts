import { useState, useEffect, useCallback } from 'react';
import { fleetRepository, transactionRepository, walletRepository } from '../models';
import { Bus } from '../models/types';

/**
 * ViewModel for Fleet Monitoring & Nightly Reconciliation.
 * Exposes active buses and the reconcile (burn tokens) operation.
 */
export const useFleetViewModel = (onReconcileSuccess?: () => void) => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isReconcilingId, setIsReconcilingId] = useState<string | null>(null);
  const [isAddingBus, setIsAddingBus] = useState<boolean>(false);

  const fetchBuses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allBuses = await fleetRepository.getBuses();
      setBuses(allBuses);
    } catch (err: any) {
      console.error('Error fetching buses:', err);
      setError(err?.message || 'Failed to load fleet data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reconcileBus = useCallback(
    async (busId: string) => {
      setIsReconcilingId(busId);
      try {
        const bus = buses.find((b) => b.id === busId);
        if (!bus) throw new Error('Bus not found.');
        if (bus.isReconciled) throw new Error('Bus is already reconciled.');
        if (!bus.vaultWalletId) throw new Error('Bus has no linked vault wallet. Please re-register this bus.');

        // 1. Fetch the real current vault balance
        const vault = await walletRepository.getWalletById(bus.vaultWalletId);
        if (!vault) throw new Error('Bus vault wallet not found in database.');

        const burnAmount = vault.balance;

        if (burnAmount > 0) {
          // 2 & 3. Burn tokens (transfer from Bus_Vault to null)
          //    sender = Bus_Vault (tokens leave), receiver = null (tokens destroyed).
          //    reference encodes the reconciliation date for audit trail.
          await transactionRepository.transfer(
            'BURN',
            bus.vaultWalletId,
            null,
            burnAmount,
            `RECONCILE-${busId}-${new Date().toISOString().split('T')[0]}`
          );
        }

        // 4. Mark vehicle as settled in the vehicles table
        await fleetRepository.markBusAsReconciled(busId);

        await fetchBuses(); // Refresh bus list
        if (onReconcileSuccess) onReconcileSuccess();
      } catch (err: any) {
        console.error('Error reconciling bus:', err);
        alert(err?.message || 'Failed to reconcile bus payout.');
      } finally {
        setIsReconcilingId(null);
      }
    },
    [buses, fetchBuses, onReconcileSuccess]
  );

  const addBus = useCallback(
    async (busLabel?: string) => {
      if (busLabel && !busLabel.trim()) busLabel = undefined;
      setIsAddingBus(true);
      try {
        await fleetRepository.addBus(busLabel);
        await fetchBuses();
      } catch (err: any) {
        console.error('Error adding bus:', err);
        alert(err?.message || 'Failed to add bus.');
      } finally {
        setIsAddingBus(false);
      }
    },
    [fetchBuses]
  );

  useEffect(() => {
    fetchBuses();
  }, [fetchBuses]);

  return {
    buses,
    isLoading,
    error,
    isReconcilingId,
    isAddingBus,
    reconcileBus,
    addBus,
    refresh: fetchBuses,
  };
};

