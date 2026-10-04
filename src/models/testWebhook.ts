import { POST } from '../app/api/webhooks/paystack/route';
import { walletRepository, transactionRepository } from './index';
import crypto from 'crypto';

// Use a known secret key for signing
const TEST_SECRET = 'test_secret_key';
process.env.PAYSTACK_SECRET_KEY = TEST_SECRET;

// Helper to compute Paystack signature
function computeSignature(body: string): string {
  return crypto
    .createHmac('sha512', TEST_SECRET)
    .update(body)
    .digest('hex');
}

async function runTests() {
  console.log("=== RUNNING PAYSTACK WEBHOOK INTEGRATION TESTS ===");

  const agentId = 'agent-user-id-54321'; // Seeded agent

  // 1. Get initial wallet balances
  const treasury = await walletRepository.getWalletByType('Treasury');
  const agent = await walletRepository.getWalletByOwnerId(agentId);

  if (!treasury || !agent) {
    throw new Error("Seeded wallets not found");
  }

  const initialTreasuryBalance = treasury.balance;
  const initialAgentBalance = agent.balance;

  console.log(`Initial Treasury Balance: ₦${initialTreasuryBalance.toLocaleString()}`);
  console.log(`Initial Agent Balance:    ₦${initialAgentBalance.toLocaleString()}`);

  // Test 1: Successful Webhook payment processing
  console.log("\n[Test 1] Simulating successful Paystack payment webhook...");
  const reference = `pay_test_ref_${Date.now()}`;
  const amountInKobo = 2000000; // 20,000 NGN
  const tokenAmount = amountInKobo / 100;

  const payload = {
    event: 'charge.success',
    data: {
      reference,
      amount: amountInKobo,
      metadata: {
        agentId
      }
    }
  };

  const bodyString = JSON.stringify(payload);
  const signature = computeSignature(bodyString);

  // Construct standard Request object
  const request = new Request('http://localhost:3000/api/webhooks/paystack', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-paystack-signature': signature
    },
    body: bodyString
  });

  const response = await POST(request);
  console.log(`Response Status: ${response.status}`);
  const responseData = await response.json();
  console.log('Response JSON:', responseData);

  if (response.status !== 200 || responseData.status !== 'success') {
    throw new Error(`Failed Test 1: Expected 200 OK and status 'success'`);
  }

  // Verify wallet updates in the repository
  const updatedTreasury = await walletRepository.getWalletByType('Treasury');
  const updatedAgent = await walletRepository.getWalletByOwnerId(agentId);

  console.log(`Updated Treasury Balance: ₦${updatedTreasury!.balance.toLocaleString()}`);
  console.log(`Updated Agent Balance:    ₦${updatedAgent!.balance.toLocaleString()}`);

  if (updatedTreasury!.balance !== initialTreasuryBalance - tokenAmount) {
    throw new Error("Test 1 Failed: Treasury balance did not decrease by correct amount");
  }
  if (updatedAgent!.balance !== initialAgentBalance + tokenAmount) {
    throw new Error("Test 1 Failed: Agent balance did not increase by correct amount");
  }

  // Verify transaction record
  const txs = await transactionRepository.getTransactions();
  const recordedTx = txs.find(tx => tx.reference === reference);
  if (!recordedTx) {
    throw new Error("Test 1 Failed: Transaction was not logged in the database");
  }
  if (recordedTx.status !== 'SUCCESS' || recordedTx.amount !== tokenAmount) {
    throw new Error(`Test 1 Failed: Transaction logged with incorrect status (${recordedTx.status}) or amount`);
  }
  console.log("Test 1 PASSED!");

  // Test 2: Idempotency (re-sending the same webhook should not double credit)
  console.log("\n[Test 2] Simulating duplicate webhook payload (Idempotency check)...");
  
  const dupRequest = new Request('http://localhost:3000/api/webhooks/paystack', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-paystack-signature': signature
    },
    body: bodyString
  });

  const dupResponse = await POST(dupRequest);
  console.log(`Dup Response Status: ${dupResponse.status}`);
  const dupResponseData = await dupResponse.json();
  console.log('Dup Response JSON:', dupResponseData);

  const finalTreasury1 = await walletRepository.getWalletByType('Treasury');
  const finalAgent1 = await walletRepository.getWalletByOwnerId(agentId);

  if (finalTreasury1!.balance !== updatedTreasury!.balance || finalAgent1!.balance !== updatedAgent!.balance) {
    throw new Error("Test 2 Failed: Balance was updated again for duplicate transaction!");
  }
  console.log("Test 2 PASSED (Idempotency worked)!");

  // Test 3: Invalid signature detection
  console.log("\n[Test 3] Simulating invalid signature...");
  const invalidSigRequest = new Request('http://localhost:3000/api/webhooks/paystack', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-paystack-signature': 'invalid_sig'
    },
    body: bodyString
  });

  const invalidSigResponse = await POST(invalidSigRequest);
  console.log(`Invalid Sig Response Status: ${invalidSigResponse.status}`);
  if (invalidSigResponse.status !== 401) {
    throw new Error("Test 3 Failed: Webhook did not reject invalid signature with 401");
  }
  console.log("Test 3 PASSED!");

  // Test 4: Missing agentId in metadata
  console.log("\n[Test 4] Simulating missing agentId in metadata...");
  const noAgentPayload = {
    event: 'charge.success',
    data: {
      reference: `pay_test_ref_no_agent_${Date.now()}`,
      amount: 100000,
      metadata: {}
    }
  };
  const noAgentBody = JSON.stringify(noAgentPayload);
  const noAgentRequest = new Request('http://localhost:3000/api/webhooks/paystack', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-paystack-signature': computeSignature(noAgentBody)
    },
    body: noAgentBody
  });

  const noAgentResponse = await POST(noAgentRequest);
  console.log(`Missing Agent Response Status: ${noAgentResponse.status}`);
  if (noAgentResponse.status !== 400) {
    throw new Error("Test 4 Failed: Webhook did not reject missing agent metadata with 400");
  }
  console.log("Test 4 PASSED!");

  // Test 5: Insufficient Treasury balance (FAILED Transaction creation)
  console.log("\n[Test 5] Simulating payment processing when Treasury has insufficient balance...");
  // Temporarily set treasury balance to low value
  const prevTreasuryBal = updatedTreasury!.balance;
  await walletRepository.updateBalance(updatedTreasury!.id, -updatedTreasury!.balance + 50); // Set to ₦50

  const highAmountKobo = 1000000; // ₦10,000 (Treasury only has ₦50)
  const highRef = `pay_test_ref_insufficient_${Date.now()}`;
  const highPayload = {
    event: 'charge.success',
    data: {
      reference: highRef,
      amount: highAmountKobo,
      metadata: {
        agentId
      }
    }
  };
  const highBody = JSON.stringify(highPayload);
  const highRequest = new Request('http://localhost:3000/api/webhooks/paystack', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-paystack-signature': computeSignature(highBody)
    },
    body: highBody
  });

  const highResponse = await POST(highRequest);
  console.log(`Insufficient Treasury Response Status: ${highResponse.status}`);
  const highResponseData = await highResponse.json();
  console.log('Insufficient Treasury Response JSON:', highResponseData);

  if (highResponse.status !== 500) {
    throw new Error("Test 5 Failed: Webhook should return 500 when transaction processing errors due to insufficient treasury");
  }

  // Restore treasury balance
  await walletRepository.updateBalance(updatedTreasury!.id, -50 + prevTreasuryBal);

  // Check if FAILED transaction was logged
  const txsAfter = await transactionRepository.getTransactions();
  const failedTx = txsAfter.find(tx => tx.reference === highRef);
  if (!failedTx) {
    throw new Error("Test 5 Failed: Failed transaction was not recorded in the ledger");
  }
  if (failedTx.status !== 'FAILED') {
    throw new Error(`Test 5 Failed: Logged transaction did not have status FAILED. Had status: ${failedTx.status}`);
  }
  console.log("Test 5 PASSED!");

  console.log("\n=== ALL PAYSTACK WEBHOOK TESTS PASSED SUCCESSFULLY ===");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
