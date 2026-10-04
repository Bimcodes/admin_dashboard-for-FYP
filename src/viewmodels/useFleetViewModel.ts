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
          // 2. Zero out the Bus_Vault (debit the full balance)
          await walletRepository.updateBalance(bus.vaultWalletId, -burnAmount);

          // 3. Log a BURN transaction with the real vault wallet UUID as sender.
          //    sender = Bus_Vault (tokens leave), receiver = null (tokens destroyed).
          //    reference encodes the reconciliation date for audit trail.
          await transactionRepository.createTransaction(
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

  const simulateRides = useCallback(
    async (busId: string) => {
      try {
        // Simulate 5 random passengers riding the bus (fare: 100 tokens per passenger)
        await fleetRepository.simulatePassengerRides(busId, 5, 100);
        await fetchBuses();
        if (onReconcileSuccess) onReconcileSuccess(); // Refresh dashboard totals too
      } catch (err: any) {
        console.error('Error simulating passenger rides:', err);
      }
    },
    [fetchBuses, onReconcileSuccess]
  );

  const addBus = useCallback(
    async (driverName: string) => {
      if (!driverName.trim()) return;
      try {
        await fleetRepository.addBus(driverName);
        await fetchBuses();
      } catch (err: any) {
        console.error('Error adding bus:', err);
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
    reconcileBus,
    simulateRides,
    addBus,
    refresh: fetchBuses,
  };
};

