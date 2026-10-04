/**
 * Service Locator / Exports for Repositories.
 * This is the entry point for accessing the data layer.
 * ViewModels import these instances. To swap back to mocks, re-import
 * Mock*Repository from './mockRepositories' and use those instead.
 */

import {
  SupabaseUserRepository,
  SupabaseWalletRepository,
  SupabaseTransactionRepository,
  SupabaseFleetRepository,
} from './supabaseRepositories';
import {
  IUserRepository,
  IWalletRepository,
  ITransactionRepository,
  IFleetRepository,
  IPaymentService,
} from './repositories.interface';
import { PaystackPaymentService } from './paymentService';

// ── Live Supabase Repositories ────────────────────────────────────────────────
export const userRepository: IUserRepository = new SupabaseUserRepository();
export const walletRepository: IWalletRepository = new SupabaseWalletRepository();
export const transactionRepository: ITransactionRepository = new SupabaseTransactionRepository();
export const fleetRepository: IFleetRepository = new SupabaseFleetRepository();

// ── Payment Service (depends only on interfaces — no change needed) ───────────
export const paymentService: IPaymentService = new PaystackPaymentService(walletRepository, transactionRepository);

