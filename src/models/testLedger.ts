import { MockUserRepository, MockWalletRepository, MockTransactionRepository, MockFleetRepository } from './mockRepositories';

async function runTests() {
  console.log("=== RUNNING QR FARE LEDGER MATH TESTS ===");
  const walletRepo = new MockWalletRepository();
  const txRepo = new MockTransactionRepository();

  // Test 1: Initial state
  const treasuryWallet = await walletRepo.getWalletByType('Treasury');
  console.log("Initial Treasury Balance:", treasuryWallet?.balance);
  if (treasuryWallet?.balance !== 1000000) {
    throw new Error("Treasury balance should start at 1,000,000");
  }

  // Test 2: Minting
  console.log("Minting ₦500,000 tokens...");
  const prevBalance = treasuryWallet?.balance || 0;
  const mintAmount = 500000;
  await walletRepo.updateBalance(treasuryWallet!.id, mintAmount);
  await txRepo.createTransaction('MINT', null, treasuryWallet!.id, mintAmount, 'TEST-DEP-001');

  const updatedTreasury = await walletRepo.getWalletById(treasuryWallet!.id);
  console.log("New Treasury Balance:", updatedTreasury?.balance);
  if (updatedTreasury?.balance !== prevBalance + mintAmount) {
    throw new Error("Minting balance update failed");
  }

  // Verify transaction is logged
  const txs = await txRepo.getTransactions();
  const latestTx = txs[0];
  if (latestTx.type !== 'MINT' || latestTx.amount !== mintAmount || latestTx.reference !== 'TEST-DEP-001') {
    throw new Error("Minting transaction logging failed");
  }
  console.log("Minting test PASSED");

  // Test 3: Wholesale transfer
  const agentWallet = await walletRepo.getWalletByType('Agent_Vault');
  console.log("Initial Agent Balance:", agentWallet?.balance);

  const transferAmount = 100000;
  console.log(`Transferring ₦${transferAmount} from Treasury to Agent...`);

  // Double-entry transfer
  await walletRepo.updateBalance(treasuryWallet!.id, -transferAmount);
  await walletRepo.updateBalance(agentWallet!.id, transferAmount);
  await txRepo.createTransaction('WHOLESALE', treasuryWallet!.id, agentWallet!.id, transferAmount);

  const finalTreasury = await walletRepo.getWalletById(treasuryWallet!.id);
  const finalAgent = await walletRepo.getWalletById(agentWallet!.id);

  console.log("Final Treasury Balance:", finalTreasury?.balance);
  console.log("Final Agent Balance:", finalAgent?.balance);

  if (finalTreasury?.balance !== updatedTreasury!.balance - transferAmount) {
    throw new Error("Treasury balance double-entry subtraction failed");
  }
  if (finalAgent?.balance !== agentWallet!.balance + transferAmount) {
    throw new Error("Agent balance double-entry addition failed");
  }
  console.log("Wholesale transfer test PASSED");

  console.log("=== ALL LEDGER TESTS PASSED SUCCESSFULLY ===");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
