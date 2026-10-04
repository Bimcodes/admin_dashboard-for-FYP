import { User, Wallet, Transaction, Bus, WalletType, DriverDailyRecord } from './types';

/**
 * Interface Segregation: Specific repository interfaces for each domain concern.
 * Dependency Inversion: ViewModels will depend on these interfaces, not concrete implementations.
 */

export interface IUserRepository {
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | null>;
  createUser(name: string, role: User['role']): Promise<User>;
}

export interface IWalletRepository {
  getWallets(): Promise<Wallet[]>;
  getWalletById(id: string): Promise<Wallet | null>;
  getWalletByOwnerId(ownerId: string): Promise<Wallet | null>;
  getWalletByType(type: WalletType): Promise<Wallet | null>;
  updateBalance(walletId: string, amount: number): Promise<Wallet>;
  createWallet(ownerId: string, type: WalletType, initialBalance: number): Promise<Wallet>;
}

export interface ITransactionRepository {
  getTransactions(): Promise<Transaction[]>;
  createTransaction(
    type: Transaction['type'],
    senderWalletId: string | null,
    receiverWalletId: string | null,
    amount: number,
    reference?: string,
    status?: Transaction['status']
  ): Promise<Transaction>;
}

export interface IFleetRepository {
  getBuses(): Promise<Bus[]>;
  markBusAsReconciled(busId: string): Promise<Bus>;
  addBus(driverName: string): Promise<Bus>;
  simulatePassengerRides(busId: string, count: number, fareAmount: number): Promise<Bus>;
  getDriverDailyRegister(): Promise<DriverDailyRecord[]>;
}

export interface IPaymentService {
  processPaystackPayment(
    amountInKobo: number,
    reference: string,
    agentId: string
  ): Promise<Transaction>;
}

