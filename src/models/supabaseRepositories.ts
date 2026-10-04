// =============================================================================
// FILE: src/models/supabaseRepositories.ts
// LAYER: Model / Data Layer
//
// PURPOSE:
//   Concrete implementations of the IRepository interfaces backed by Supabase.
//   These replace the MockRepository classes. The ViewModels and PaymentService
//   never change — only src/models/index.ts swaps which implementation is used.
//
// DATABASE TABLES (from the shared Supabase project):
//   users        — id UUID, role TEXT, name TEXT
//   wallets      — id UUID, owner_id UUID, wallet_type TEXT, balance NUMERIC
//   transactions — id UUID, type TEXT, sender_wallet_id UUID?,
//                  receiver_wallet_id UUID?, amount NUMERIC,
//                  reference TEXT?, status TEXT, timestamp TIMESTAMPTZ
//   vehicles     — id TEXT, driver_name TEXT, driver_id UUID?,
//                  passenger_count INT, tokens_collected NUMERIC,
//                  is_reconciled BOOLEAN, created_at TIMESTAMPTZ
//
// COLUMN MAPPING (DB snake_case → TS camelCase):
//   owner_id            → ownerId
//   wallet_type         → walletType
//   sender_wallet_id    → senderWalletId
//   receiver_wallet_id  → receiverWalletId
//   driver_name         → driverName
//   driver_id           → driverId
//   passenger_count     → passengerCount
//   tokens_collected    → tokensCollected
//   is_reconciled       → isReconciled
// =============================================================================

import { createSupabaseBrowserClient } from '../lib/supabaseClient';
import { User, Wallet, Transaction, Bus, WalletType, DriverDailyRecord } from './types';
import {
  IUserRepository,
  IWalletRepository,
  ITransactionRepository,
  IFleetRepository,
} from './repositories.interface';

// Helper: get a fresh Supabase client for each call
const getClient = () => createSupabaseBrowserClient();

// ─────────────────────────────────────────────────────────────────────────────
// User Repository
// ─────────────────────────────────────────────────────────────────────────────

export class SupabaseUserRepository implements IUserRepository {
  async getUsers(): Promise<User[]> {
    const { data, error } = await getClient()
      .from('users')
      .select('id, role, name');

    if (error) throw new Error(`[UserRepo] getUsers failed: ${error.message}`);

    return (data ?? []).map((row) => ({
      id: row.id,
      role: row.role as User['role'],
      name: row.name,
    }));
  }

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await getClient()
      .from('users')
      .select('id, role, name')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`[UserRepo] getUserById failed: ${error.message}`);
    if (!data) return null;

    return { id: data.id, role: data.role as User['role'], name: data.name };
  }

  async createUser(name: string, role: User['role']): Promise<User> {
    const { data, error } = await getClient()
      .from('users')
      .insert({ name, role })
      .select('id, role, name')
      .single();

    if (error) throw new Error(`[UserRepo] createUser failed: ${error.message}`);

    return { id: data.id, role: data.role as User['role'], name: data.name };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Wallet Repository
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps a raw DB row (snake_case) to the Wallet domain type (camelCase).
 */
function toWallet(row: Record<string, unknown>): Wallet {
  return {
    id: row.id as string,
    ownerId: row.owner_id as string,
    walletType: row.wallet_type as WalletType,
    balance: Number(row.balance),
  };
}

export class SupabaseWalletRepository implements IWalletRepository {
  async getWallets(): Promise<Wallet[]> {
    const { data, error } = await getClient()
      .from('wallets')
      .select('id, owner_id, wallet_type, balance');

    if (error) throw new Error(`[WalletRepo] getWallets failed: ${error.message}`);
    return (data ?? []).map(toWallet);
  }

  async getWalletById(id: string): Promise<Wallet | null> {
    const { data, error } = await getClient()
      .from('wallets')
      .select('id, owner_id, wallet_type, balance')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`[WalletRepo] getWalletById failed: ${error.message}`);
    return data ? toWallet(data) : null;
  }

  async getWalletByOwnerId(ownerId: string): Promise<Wallet | null> {
    const { data, error } = await getClient()
      .from('wallets')
      .select('id, owner_id, wallet_type, balance')
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (error) throw new Error(`[WalletRepo] getWalletByOwnerId failed: ${error.message}`);
    return data ? toWallet(data) : null;
  }

  async getWalletByType(type: WalletType): Promise<Wallet | null> {
    const { data, error } = await getClient()
      .from('wallets')
      .select('id, owner_id, wallet_type, balance')
      .eq('wallet_type', type)
      .maybeSingle();

    if (error) throw new Error(`[WalletRepo] getWalletByType failed: ${error.message}`);
    return data ? toWallet(data) : null;
  }

  async updateBalance(walletId: string, amount: number): Promise<Wallet> {
    // First fetch current balance, then add the delta
    const current = await this.getWalletById(walletId);
    if (!current) throw new Error(`[WalletRepo] Wallet ${walletId} not found`);

    const newBalance = current.balance + amount;

    const { data, error } = await getClient()
      .from('wallets')
      .update({ balance: newBalance })
      .eq('id', walletId)
      .select('id, owner_id, wallet_type, balance')
      .single();

    if (error) throw new Error(`[WalletRepo] updateBalance failed: ${error.message}`);
    return toWallet(data);
  }

  async createWallet(ownerId: string, type: WalletType, initialBalance: number = 0): Promise<Wallet> {
    const { data, error } = await getClient()
      .from('wallets')
      .insert({ owner_id: ownerId, wallet_type: type, balance: initialBalance })
      .select('id, owner_id, wallet_type, balance')
      .single();

    if (error) throw new Error(`[WalletRepo] createWallet failed: ${error.message}`);
    return toWallet(data);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Transaction Repository
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps a raw DB row (snake_case) to the Transaction domain type (camelCase).
 */
function toTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    type: row.type as Transaction['type'],
    senderWalletId: (row.sender_wallet_id as string) ?? null,
    receiverWalletId: (row.receiver_wallet_id as string) ?? null,
    amount: Number(row.amount),
    timestamp: row.timestamp as string,
    reference: (row.reference as string) ?? undefined,
    status: (row.status as Transaction['status']) ?? 'SUCCESS',
  };
}

export class SupabaseTransactionRepository implements ITransactionRepository {
  async getTransactions(): Promise<Transaction[]> {
    const { data, error } = await getClient()
      .from('transactions')
      .select('id, type, sender_wallet_id, receiver_wallet_id, amount, timestamp, reference, status')
      .order('timestamp', { ascending: false });

    if (error) throw new Error(`[TransactionRepo] getTransactions failed: ${error.message}`);
    return (data ?? []).map(toTransaction);
  }

  async createTransaction(
    type: Transaction['type'],
    senderWalletId: string | null,
    receiverWalletId: string | null,
    amount: number,
    reference?: string,
    status: Transaction['status'] = 'SUCCESS'
  ): Promise<Transaction> {
    const payload: Record<string, unknown> = {
      type,
      sender_wallet_id: senderWalletId,
      receiver_wallet_id: receiverWalletId,
      amount,
      status,
      timestamp: new Date().toISOString(),
    };
    if (reference) payload.reference = reference;

    const { data, error } = await getClient()
      .from('transactions')
      .insert(payload)
      .select('id, type, sender_wallet_id, receiver_wallet_id, amount, timestamp, reference, status')
      .single();

    if (error) throw new Error(`[TransactionRepo] createTransaction failed: ${error.message}`);
    return toTransaction(data);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fleet Repository (vehicles table)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps a raw DB vehicles row (snake_case) to the Bus domain type (camelCase).
 */
function toBus(row: Record<string, unknown>): Bus {
  return {
    id: row.id as string,
    driverName: row.driver_name as string,
    driverId: (row.driver_id as string) ?? null,
    passengerCount: Number(row.passenger_count),
    tokensCollected: Number(row.tokens_collected),
    isReconciled: row.is_reconciled as boolean,
    vaultWalletId: (row.vault_wallet_id as string) ?? null,
  };
}

export class SupabaseFleetRepository implements IFleetRepository {
  async getBuses(): Promise<Bus[]> {
    const { data, error } = await getClient()
      .from('vehicles')
      .select('id, driver_name, driver_id, vault_wallet_id, passenger_count, tokens_collected, is_reconciled')
      .order('created_at', { ascending: true });

    if (error) throw new Error(`[FleetRepo] getBuses failed: ${error.message}`);
    return (data ?? []).map(toBus);
  }

  async markBusAsReconciled(busId: string): Promise<Bus> {
    const { data, error } = await getClient()
      .from('vehicles')
      .update({ is_reconciled: true })
      .eq('id', busId)
      .select('id, driver_name, driver_id, vault_wallet_id, passenger_count, tokens_collected, is_reconciled')
      .single();

    if (error) throw new Error(`[FleetRepo] markBusAsReconciled failed: ${error.message}`);
    return toBus(data);
  }

  async addBus(driverName: string): Promise<Bus> {
    // Generate a unique BUS-### id
    const busId = `BUS-${Math.floor(100 + Math.random() * 900)}`;

    // 1. Create a new Bus_Vault wallet.
    //    We use crypto.randomUUID() as owner_id because vehicles.id is TEXT
    //    and cannot be stored in a UUID column. The vehicle links back to the
    //    wallet via vault_wallet_id instead.
    const { data: wallet, error: walletError } = await getClient()
      .from('wallets')
      .insert({
        owner_id: crypto.randomUUID(),
        wallet_type: 'Bus_Vault',
        balance: 0,
      })
      .select('id')
      .single();

    if (walletError) throw new Error(`[FleetRepo] createVault failed: ${walletError.message}`);

    // 2. Create the vehicle row, storing the vault wallet's UUID
    const { data, error } = await getClient()
      .from('vehicles')
      .insert({
        id: busId,
        driver_name: driverName,
        passenger_count: 0,
        tokens_collected: 0,
        is_reconciled: false,
        vault_wallet_id: wallet.id,
      })
      .select('id, driver_name, driver_id, vault_wallet_id, passenger_count, tokens_collected, is_reconciled')
      .single();

    if (error) throw new Error(`[FleetRepo] addBus failed: ${error.message}`);
    return toBus(data);
  }

  async simulatePassengerRides(busId: string, count: number, fareAmount: number): Promise<Bus> {
    // Fetch current values, then increment
    const { data: current, error: fetchError } = await getClient()
      .from('vehicles')
      .select('passenger_count, tokens_collected')
      .eq('id', busId)
      .single();

    if (fetchError) throw new Error(`[FleetRepo] simulateRides fetch failed: ${fetchError.message}`);

    const newPassengers = Number(current.passenger_count) + count;
    const newTokens = Number(current.tokens_collected) + count * fareAmount;

    const { data, error } = await getClient()
      .from('vehicles')
      .update({ passenger_count: newPassengers, tokens_collected: newTokens })
      .eq('id', busId)
      .select('id, driver_name, driver_id, vault_wallet_id, passenger_count, tokens_collected, is_reconciled')
      .single();

    if (error) throw new Error(`[FleetRepo] simulateRides update failed: ${error.message}`);
    return toBus(data);
  }

  async getDriverDailyRegister(): Promise<DriverDailyRecord[]> {
    // Calls the Postgres function get_driver_daily_register() defined in Supabase.
    // Returns one row per driver per working day, ordered by date desc.
    const { data, error } = await getClient().rpc('get_driver_daily_register');

    if (error) throw new Error(`[FleetRepo] getDriverDailyRegister failed: ${error.message}`);

    return (data ?? []).map((row: Record<string, unknown>) => ({
      driverName: row.driver_name as string,
      driverId:   (row.driver_id as string) ?? null,
      workDate:   row.work_date as string,   // Postgres DATE returned as "YYYY-MM-DD"
      tripCount:  Number(row.trip_count),
      totalFares: Number(row.total_fares),
    }));
  }
}
