// =============================================================================
// FILE: src/app/api/admin/init-payment/route.ts
// LAYER: API Route (Server-Side Only)
//
// PURPOSE:
//   Initialises a Paystack payment transaction for an agent top-up.
//   Returns a Paystack checkout URL that the admin opens (or shares).
//   On successful payment, Paystack sends a webhook to /api/webhooks/paystack
//   which mints tokens and credits the agent's wallet automatically.
//
// PAYSTACK FLOW:
//   1. Admin clicks "Top Up via Paystack" for an agent
//   2. Frontend calls POST /api/admin/init-payment { agentId, amountInKobo }
//   3. This route calls Paystack API → gets authorization_url
//   4. Admin is redirected to Paystack checkout
//   5. After payment, Paystack sends webhook → /api/webhooks/paystack
//   6. Webhook mints tokens + credits agent wallet
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../../lib/supabaseAdmin';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_INIT_URL = 'https://api.paystack.co/transaction/initialize';

export async function POST(request: NextRequest) {
  try {
    if (!PAYSTACK_SECRET || PAYSTACK_SECRET.startsWith('sk_test_REPLACE')) {
      return NextResponse.json(
        { error: 'Paystack secret key is not configured. Add PAYSTACK_SECRET_KEY to .env.local.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { agentId, amountInKobo } = body as { agentId: string; amountInKobo: number };

    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required.' }, { status: 400 });
    }
    if (!amountInKobo || amountInKobo < 10000) {
      // Paystack minimum is ₦100 (10,000 kobo)
      return NextResponse.json(
        { error: 'Amount must be at least ₦100 (10,000 kobo).' },
        { status: 400 }
      );
    }

    // Fetch agent details from Supabase to get email for Paystack
    const adminClient = createSupabaseAdminClient();
    const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(agentId);
    
    // For testing, always use the user-provided email address, or fallback to it
    const safeAgentId = agentId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
    let agentEmail = 'akinuliolaolami@gmail.com';
    
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!authError && authUser?.user?.email) {
      const trimmedEmail = authUser.user.email.trim();
      if (emailRegex.test(trimmedEmail)) {
        // agentEmail = trimmedEmail; // Uncomment this to use actual agent emails in production
      }
    }
    
    console.log(`[init-payment] Using email: "${agentEmail}" for agent: ${agentId}`);

    // Generate a unique reference for idempotency
    const reference = `TOPUP-${safeAgentId.toUpperCase()}-${Date.now()}`;

    // Call Paystack to initialise the transaction
    const paystackResponse = await fetch(PAYSTACK_INIT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: agentEmail,
        amount: amountInKobo,
        reference,
        metadata: {
          agentId,
          custom_fields: [
            {
              display_name: 'Agent ID',
              variable_name: 'agent_id',
              value: agentId,
            },
          ],
        },
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      throw new Error(`Paystack error: ${paystackData.message}`);
    }

    console.log(`[init-payment] ✅ Paystack transaction initialised. Reference: ${reference}`);

    return NextResponse.json({
      authorizationUrl: paystackData.data.authorization_url,
      reference,
      accessCode: paystackData.data.access_code,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[init-payment] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
