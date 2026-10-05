import { createStore } from 'zustand/vanilla';
import { User, Wallet, Transaction, Bus, WalletType } from './types';
import {
  IUserRepository,
  IWalletRepository,
  ITransactionRepository,
  IFleetRepository,
} from './repositories.interface';

// -------------------------------------------------------------
// Helper to generate UUID-like strings
// -------------------------------------------------------------
const generateUUID = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// -------------------------------------------------------------
// In-Memory Database State Definition
// -------------------------------------------------------------
interface DatabaseState {
  users: User[];
  wallets: Wallet[];
  transactions: Transaction[];
  buses: Bus[];
  addUser: (user: User) => void;
  addWallet: (wallet: Wallet) => void;
  updateWalletBalance: (walletId: string, balance: number) => void;
  addTransaction: (tx: Transaction) => void;
  updateBus: (bus: Bus) => void;
}

// -------------------------------------------------------------
// Seed Data
// -------------------------------------------------------------
const ADMIN_ID = 'admin-user-id-12345';
const TREASURY_WALLET_ID = 'treasury-wallet-id-12345';

const AGENT_ID = 'agent-user-id-54321';
const AGENT_WALLET_ID = 'agent-wallet-id-54321';

const STUDENT_ID = 'student-user-id-99999';
const STUDENT_WALLET_ID = 'student-wallet-id-99999';

const initialUsers: User[] = [
  { id: ADMIN_ID, role: 'Admin', name: 'Transport Commission Admin' },
  { id: AGENT_ID, role: 'Agent', name: 'Campus Gate Agent (John)' },
  { id: STUDENT_ID, role: 'Student', name: 'Alice Smith (Student)' },
];

const initialWallets: Wallet[] = [
  {
    id: TREASURY_WALLET_ID,
    ownerId: ADMIN_ID,
    walletType: 'Treasury',
    balance: 1000000, // Starts with 1,000,000 pre-seeded (or we can start with 0 and mint)
  },
  {
    id: AGENT_WALLET_ID,
    ownerId: AGENT_ID,
    walletType: 'Agent_Vault',
    balance: 50000,
  },
  {
    id: STUDENT_WALLET_ID,
    ownerId: STUDENT_ID,
    walletType: 'Student_Wallet',
    balance: 15000,
  },
];

const initialTransactions: Transaction[] = [
  {
    id: generateUUID(),
    type: 'MINT',
    senderWalletId: null,
    receiverWalletId: TREASURY_WALLET_ID,
    amount: 1000000,
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    reference: 'DEP-INIT-001',
    status: 'SUCCESS',
  },
  {
    id: generateUUID(),
    type: 'WHOLESALE',
    senderWalletId: TREASURY_WALLET_ID,
    receiverWalletId: AGENT_WALLET_ID,
    amount: 50000,
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
    status: 'SUCCESS',
  },
];

const initialBuses: Bus[] = [
  {
    id: 'BUS-001',
    plateNumber: 'Mr. Babajide',
    driverId: null,
    passengerCount: 42,
    tokensCollected: 4200, // e.g. 100 tokens per passenger
    isReconciled: false,
    vaultWalletId: null,
  },
  {
    id: 'BUS-002',
    plateNumber: 'Mr. Okafor',
    driverId: null,
    passengerCount: 28,
    tokensCollected: 2800,
    isReconciled: false,
    vaultWalletId: null,
  },
  {
    id: 'BUS-003',
    plateNumber: 'Mr. Musa',
    driverId: null,
    passengerCount: 50,
    tokensCollected: 5000,
    isReconciled: true, // already reconciled
    vaultWalletId: null,
  },
];

// Create the vanilla Zustand store for our database
export const dbStore = createStore<DatabaseState>((set) => ({
  users: initialUsers,
  wallets: initialWallets,
  transactions: initialTransactions,
  buses: initialBuses,
  addUser: (user) => set((state) => ({ users: [...state.users, user] })),
  addWallet: (wallet) => set((state) => ({ wallets: [...state.wallets, wallet] })),
  updateWalletBalance: (walletId, balance) =>
    set((state) => ({
      wallets: state.wallets.map((w) => (w.id === walletId ? { ...w, balance } : w)),
    })),
  addTransaction: (tx) => set((state) => ({ transactions: [tx, ...state.transactions] })),
  updateBus: (bus) =>
    set((state) => ({
      buses: state.buses.map((b) => (b.id === bus.id ? bus : b)),
    })),
}));

// -------------------------------------------------------------
// Concrete Implementations of Repositories (Mock Database)
// -------------------------------------------------------------

export class MockUserRepository implements IUserRepository {
  async getUsers(): Promise<User[]> {
    return dbStore.getState().users;
  }

  async getUserById(id: string): Promise<User | null> {
    const user = dbStore.getState().users.find((u) => u.id === id);
    return user || null;
  }

  async createUser(name: string, role: User['role']): Promise<User> {
    const newUser: User = {
      id: generateUUID(),
      name,
      role,
    };
    dbStore.getState().addUser(newUser);
    return newUser;
  }
}

export class MockWalletRepository implements IWalletRepository {
  async getWallets(): Promise<Wallet[]> {
    return dbStore.getState().wallets;
  }

  async getWalletById(id: string): Promise<Wallet | null> {
    const wallet = dbStore.getState().wallets.find((w) => w.id === id);
    return wallet || null;
  }

  async getWalletByOwnerId(ownerId: string): Promise<Wallet | null> {
    const wallet = dbStore.getState().wallets.find((w) => w.ownerId === ownerId);
    return wallet || null;
  }

  async getWalletByType(type: WalletType): Promise<Wallet | null> {
    const wallet = dbStore.getState().wallets.find((w) => w.walletType === type);
    return wallet || null;
  }

  async updateBalance(walletId: string, amount: number): Promise<Wallet> {
    const wallet = await this.getWalletById(walletId);
    if (!wallet) throw new Error('Wallet not found');

    const newBalance = wallet.balance + amount;
    dbStore.getState().updateWalletBalance(walletId, newBalance);

    return { ...wallet, balance: newBalance };
  }

  async createWallet(ownerId: string, type: WalletType, initialBalance: number = 0): Promise<Wallet> {
    const newWallet: Wallet = {
      id: generateUUID(),
      ownerId,
      walletType: type,
      balance: initialBalance,
    };
    dbStore.getState().addWallet(newWallet);
    return newWallet;
  }
}

export class MockTransactionRepository implements ITransactionRepository {
  async getTransactions(): Promise<Transaction[]> {
    return dbStore.getState().transactions;
  }

  async createTransaction(
    type: Transaction['type'],
    senderWalletId: string | null,
    receiverWalletId: string | null,
    amount: number,
    reference?: string,
    status: Transaction['status'] = 'SUCCESS'
  ): Promise<Transaction> {
    const newTx: Transaction = {
      id: generateUUID(),
      type,
      senderWalletId,
      receiverWalletId,
      amount,
      timestamp: new Date().toISOString(),
      reference,
      status,
    };

    dbStore.getState().addTransaction(newTx);
    return newTx;
  }

  async transfer(
    type: Transaction['type'],
    sender: string | null,
    receiver: string | null,
    amount: number,
    reference?: string
  ): Promise<string> {
    const tx = await this.createTransaction(type, sender, receiver, amount, reference, 'SUCCESS');
    // In mock, we would manually debit/credit, but let's just do a rough hack or assume tests don't use this heavily for logic since it's just a mock
    if (sender) dbStore.getState().updateWalletBalance(sender, (await dbStore.getState().wallets.find(w => w.id === sender)!.balance) - amount);
    if (receiver) dbStore.getState().updateWalletBalance(receiver, (await dbStore.getState().wallets.find(w => w.id === receiver)!.balance) + amount);
    return tx.id;
  }
}

export class MockFleetRepository implements IFleetRepository {
  async getBuses(): Promise<Bus[]> {
    return dbStore.getState().buses;
  }

  async reconcileBus(busId: string): Promise<number> {
    const bus = dbStore.getState().buses.find((b) => b.id === busId);
    if (!bus) throw new Error('Bus not found');

    const amount = bus.tokensCollected;
    const updatedBus = { ...bus, isReconciled: true, passengerCount: 0, tokensCollected: 0 };
    dbStore.getState().updateBus(updatedBus);
    return amount;
  }

  async addBus(busLabel?: string): Promise<Bus> {
    const newBus: Bus = {
      id: `BUS-${Math.floor(100 + Math.random() * 900)}`,
      plateNumber: busLabel || null,
      driverId: null,
      passengerCount: 0,
      tokensCollected: 0,
      isReconciled: false,
      vaultWalletId: null,
    };
    // Add to list by hacking the database state store
    dbStore.setState((state) => ({
      buses: [...state.buses, newBus],
    }));
    return newBus;
  }

  async getDriverDailyRegister(): Promise<import('./types').DriverDailyRecord[]> {
    // Mock returns empty — no fare data available in the in-memory store
    return [];
  }
}
