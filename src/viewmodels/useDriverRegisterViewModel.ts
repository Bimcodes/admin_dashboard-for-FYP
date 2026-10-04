import { useState, useEffect, useCallback } from 'react';
import { fleetRepository } from '../models';
import { DriverDailyRecord } from '../models/types';

/**
 * A single driver's aggregated summary across all working days.
 * Used by DriverRegisterView for the accordion top-level rows.
 */
export interface DriverSummary {
  driverName: string;
  driverId: string | null;
  totalDaysWorked: number;
  totalLifetimeFares: number;
  totalLifetimeTrips: number;
  dailyRecords: DriverDailyRecord[]; // ordered newest first (from DB)
}

/**
 * ViewModel for the Driver Daily Register admin tab.
 * Fetches per-driver, per-day FARE aggregates and groups them by driver name.
 */
export const useDriverRegisterViewModel = () => {
  const [summaries, setSummaries] = useState<DriverSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRegister = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const records = await fleetRepository.getDriverDailyRegister();

      // Group flat rows by driver_name (as requested)
      const grouped = new Map<string, DriverSummary>();

      for (const rec of records) {
        if (!grouped.has(rec.driverName)) {
          grouped.set(rec.driverName, {
            driverName: rec.driverName,
            driverId: rec.driverId,
            totalDaysWorked: 0,
            totalLifetimeFares: 0,
            totalLifetimeTrips: 0,
            dailyRecords: [],
          });
        }
        const summary = grouped.get(rec.driverName)!;
        summary.totalDaysWorked    += 1;
        summary.totalLifetimeFares += rec.totalFares;
        summary.totalLifetimeTrips += rec.tripCount;
        summary.dailyRecords.push(rec);
      }

      // Sort drivers by total lifetime fares descending (highest earner first)
      const sorted = Array.from(grouped.values()).sort(
        (a, b) => b.totalLifetimeFares - a.totalLifetimeFares
      );

      setSummaries(sorted);
    } catch (err: any) {
      console.error('Error loading driver register:', err);
      setError(err?.message || 'Failed to load driver register.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegister();
  }, [fetchRegister]);

  return { summaries, isLoading, error, refresh: fetchRegister };
};
