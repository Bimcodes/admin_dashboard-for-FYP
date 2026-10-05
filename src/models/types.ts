/**
 * Types representing the domain entities in the QR Fare System.
 * In MVVM, this is the Model's domain entity layer.
 */

export type UserRole = 'Admin' | 'Agent' | 'Student' | 'Driver';

export interface User {
  id: string; // UUID
  role: UserRole;
  name: string;
}

export type WalletType = 'Treasury' | 'Agent_Vault' | 'Student_Wallet' | 'Bus_Vault';

export interface Wallet {
  id: string; // UUID
  ownerId: string; // UUID - Linked to User
  walletType: WalletType;
  balance: number;
}

export type TransactionType = 'MINT' | 'WHOLESALE' | 'RETAIL' | 'FARE' | 'BURN';

export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface Transaction {
  id: string; // UUID
  type: TransactionType;
  senderWalletId: string | null; // Nullable for MINT
  receiverWalletId: string | null; // Nullable for BURN
  amount: number;
  timestamp: string; // ISO string
  reference?: string; // Optional fiat deposit reference for MINT
  status: TransactionStatus;
}

export interface Bus {
  id: string; // e.g. "BUS-001"
  plateNumber: string | null; // The bus plate / label (e.g. OAU-001)
  driverId: string | null;    // UUID FK to users table — the active bus lock (NULL = available)
  passengerCount: number;
  tokensCollected: number;
  isReconciled: boolean;
  vaultWalletId: string | null; // UUID of the linked Bus_Vault wallet
}

/**
 * A single row from the driver daily register aggregate query.
 * Each row represents one driver's earnings on one working day.
 */
export interface DriverDailyRecord {
  driverName: string;
  driverId:   string | null; // UUID, nullable
  workDate:   string;        // "YYYY-MM-DD" string
  tripCount:  number;
  totalFares: number;
}
