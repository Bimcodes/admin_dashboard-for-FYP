import { IPaymentService, IWalletRepository, ITransactionRepository } from './repositories.interface';
import { Transaction } from './types';

/**
 * Service to handle Paystack payment processing.
 * Single Responsibility: Automates double-entry token transfer (Treasury -> Agent Vault) upon payment verification.
 * Dependency Inversion: Depends on repository abstractions (IWalletRepository, ITransactionRepository).
 */
export class PaystackPaymentService implements IPaymentService {
  constructor(
    private walletRepo: IWalletRepository,
    private transactionRepo: ITransactionRepository
  ) {}

  async processPaystackPayment(
    amountInKobo: number,
    reference: string,
    agentId: string
  ): Promise<Transaction> {
    // 1. Idempotency Check: check if reference already exists to prevent double-crediting
    const transactions = await this.transactionRepo.getTransactions();
    const existingTx = transactions.find((t) => t.reference === reference);
    if (existingTx) {
      console.log(`[PaymentService] Transaction with reference ${reference} already processed.`);
      return existingTx;
    }

    const tokenAmount = amountInKobo / 100;

    // 2. Fetch Agent's wallet
    const agentWallet = await this.walletRepo.getWalletByOwnerId(agentId);
    if (!agentWallet) {
      throw new Error(`Agent with ID ${agentId} does not have a wallet.`);
    }

    // 3. Fetch Treasury's wallet
    const treasuryWallet = await this.walletRepo.getWalletByType('Treasury');
    if (!treasuryWallet) {
      throw new Error('Treasury Wallet not found.');
    }

    // 4. Check balance
    if (treasuryWallet.balance < tokenAmount) {
      console.error(`[PaymentService] Treasury has insufficient balance (${treasuryWallet.balance}) for wholesale amount ${tokenAmount}. Recording failure.`);
      
      // Record failed transaction for auditing
      await this.transactionRepo.createTransaction(
        'WHOLESALE',
        treasuryWallet.id,
        agentWallet.id,
        tokenAmount,
        reference,
        'FAILED'
      );
      
      throw new Error(`Insufficient funds in Treasury to complete wholesale transfer of ${tokenAmount} tokens.`);
    }

    // 5. Deduct from Treasury and Add to Agent
    await this.walletRepo.updateBalance(treasuryWallet.id, -tokenAmount);
    await this.walletRepo.updateBalance(agentWallet.id, tokenAmount);

    // 6. Record successful wholesale transaction
    const successTx = await this.transactionRepo.createTransaction(
      'WHOLESALE',
      treasuryWallet.id,
      agentWallet.id,
      tokenAmount,
      reference,
      'SUCCESS'
    );

    console.log(`[PaymentService] Successfully processed Paystack payment. Credited Agent ${agentId} with ${tokenAmount} tokens. Reference: ${reference}`);
    return successTx;
  }
}
