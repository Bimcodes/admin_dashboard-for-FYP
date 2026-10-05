import { User, Wallet, Transaction, Bus, WalletType, DriverDailyRecord } from './types';

/**
 * Interface Segregation: Specific repository interfaces for each domain concern.
 * Dependency Inversion: ViewModels will depend on these interfaces, not concrete implementations.
 */

export interface IUserRepository {
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | null>;
}

export interface IWalletRepository {
  getWallets(): Promise<Wallet[]>;
  getWalletById(id: string): Promise<Wallet | null>;
  getWalletByOwnerId(ownerId: string): Promise<Wallet | null>;
  getWalletByType(type: WalletType): Promise<Wallet | null>;
}

export interface ITransactionRepository {
  getTransactions(): Promise<Transaction[]>;
  transfer(
    type: Transaction['type'],
    sender: string | null,
    receiver: string | null,
    amount: number,
    reference?: string
  ): Promise<string>;
}

export interface IFleetRepository {
  getBuses(): Promise<Bus[]>;
  reconcileBus(busId: string): Promise<number>;
  addBus(busLabel?: string): Promise<Bus>;
  getDriverDailyRegister(): Promise<DriverDailyRecord[]>;
}

