import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { paymentService } from '../../../../models';

// The webhook secret key used for HMAC signature validation.
// In production, this should be defined in your environment variables.
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'test_secret_key';

/**
 * Route Handler to receive Paystack webhook events.
 * Single Responsibility: Authenticate payload via digital signature, dispatch valid events to Model Layer (paymentService).
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
      console.warn('[Paystack Webhook] Missing signature header.');
      return new Response(
        JSON.stringify({ error: 'Missing x-paystack-signature header' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify the authenticity of the webhook request (HMAC-SHA512)
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest('hex');

    if (hash !== signature) {
      console.warn('[Paystack Webhook] Signature verification failed. Request rejected.');
      return new Response(
        JSON.stringify({ error: 'Signature verification failed' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const payload = JSON.parse(rawBody);
    console.log(`[Paystack Webhook] Signature verified. Event received: ${payload.event}`);

    // Standard Paystack successful payment event
    if (payload.event === 'charge.success') {
      const data = payload.data;
      const reference = data.reference;
      const amountInKobo = data.amount;
      
      // Extract agentId from metadata
      const agentId = data.metadata?.agentId || data.metadata?.agent_id;

      if (!agentId) {
        console.warn(`[Paystack Webhook] Missing agentId in transaction metadata for reference ${reference}.`);
        return new Response(
          JSON.stringify({ error: 'Missing agentId in metadata' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Delegate processing to the Model layer (SOLID: Controllers don't write DB logic)
      const transaction = await paymentService.processPaystackPayment(
        amountInKobo,
        reference,
        agentId
      );

      return new Response(
        JSON.stringify({
          status: 'success',
          message: 'Tokens successfully allocated to agent.',
          transactionId: transaction.id,
          ledgerStatus: transaction.status,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Acknowledge other event types (e.g. charge.failed) but take no action.
    return new Response(
      JSON.stringify({
        status: 'ignored',
        message: `Webhook event '${payload.event}' acknowledged but ignored.`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('[Paystack Webhook Error]', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        details: error?.message || String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
