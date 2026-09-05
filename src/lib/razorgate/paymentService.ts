import { Transaction } from './types';

export interface RazorpayOrderResponse {
  id: string;
  entity: 'order';
  amount: number; // in paise
  amount_paid: number;
  amount_due: number;
  currency: 'INR';
  receipt: string;
  status: 'created';
  created_at: number;
}

export interface PaymentExecutionResult {
  success: boolean;
  paymentId?: string;
  orderId: string;
  signature?: string;
  amount: number;
  method?: string;
  error?: {
    code: string;
    description: string;
    step: string;
  };
}

/**
 * Creates a simulated or real Razorpay Order.
 * In a production backend, this would be an API call to `https://api.razorpay.com/v1/orders`.
 */
export async function createRazorpayOrder(
  transaction: Transaction,
  isLiveTestMode = false
): Promise<RazorpayOrderResponse> {
  // Simulate network latency (250ms)
  await new Promise((resolve) => setTimeout(resolve, 250));

  const orderId = `order_rzp_${Math.random().toString(36).substring(2, 10)}${Date.now().toString().slice(-4)}`;
  return {
    id: orderId,
    entity: 'order',
    amount: transaction.finalPayable * 100, // paise
    amount_paid: 0,
    amount_due: transaction.finalPayable * 100,
    currency: 'INR',
    receipt: transaction.id,
    status: 'created',
    created_at: Math.floor(Date.now() / 1000),
  };
}

/**
 * Simulates high-fidelity payment processing.
 * Returns either SUCCESS or realistic test failure.
 */
export async function executeSimulatedPayment(
  orderId: string,
  amount: number,
  method: 'UPI' | 'CARD' | 'AUTONOMOUS_GATEWAY' = 'AUTONOMOUS_GATEWAY',
  shouldFail = false
): Promise<PaymentExecutionResult> {
  // Simulate banking network roundtrip (600ms)
  await new Promise((resolve) => setTimeout(resolve, 600));

  if (shouldFail) {
    return {
      success: false,
      orderId,
      amount,
      method,
      error: {
        code: 'GATEWAY_CARD_DECLINED_BANK_LIMIT',
        description: 'Bank server reported insufficient authorization on merchant settlement route.',
        step: 'payment_authorization',
      },
    };
  }

  const paymentId = `pay_rzp_${Math.random().toString(36).substring(2, 11)}${Date.now().toString().slice(-4)}`;
  const signature = `sig_rzp_${Math.random().toString(36).substring(2, 16)}`;

  return {
    success: true,
    paymentId,
    orderId,
    signature,
    amount,
    method,
  };
}
