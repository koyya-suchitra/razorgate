import { Transaction } from './types';

export interface RazorpayOrderResponse {
  id: string;
  entity?: 'order';
  amount: number; // in paise
  amount_paid?: number;
  amount_due?: number;
  currency: 'INR';
  receipt: string;
  status?: string;
  created_at?: number;
  keyId?: string;
  error?: string;
  code?: string;
}

export interface PaymentExecutionResult {
  success: boolean;
  paymentId?: string;
  orderId: string;
  signature?: string;
  amount: number;
  method?: string;
  mode?: 'RAZORPAY_TEST_MODE' | 'SIMULATED';
  message?: string;
  error?: {
    code: string;
    description: string;
    step: string;
  };
}

const getApiBase = () => {
  return (
    import.meta.env.VITE_RENDER_API_URL ||
    import.meta.env.VITE_API_URL ||
    'https://razorgate-product-search.onrender.com'
  ).replace(/\/$/, '');
};

/**
 * Dynamically loads the official Razorpay Checkout SDK script into DOM.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('[PaymentService] Failed to load Razorpay Checkout script.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Creates a real Razorpay Test Mode Order via the secure Render backend.
 * Never calls Razorpay API directly from client; credentials remain server-side.
 */
export async function createBackendRazorpayOrder(
  transaction: Transaction
): Promise<{
  success: boolean;
  orderId?: string;
  amount?: number;
  currency?: string;
  keyId?: string;
  receipt?: string;
  error?: string;
  code?: string;
}> {
  const endpoint = `${getApiBase()}/api/payments/create-order`;

  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: transaction.finalPayable,
        currency: 'INR',
        receipt: transaction.id,
        notes: {
          transactionId: transaction.id,
          productId: transaction.product.id,
          productName: transaction.product.name.substring(0, 40),
          merchant: transaction.product.merchant.name,
        },
      }),
    });

    const contentType = resp.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        success: false,
        code: 'BACKEND_NOT_REACHABLE',
        error: `Render backend returned HTTP ${resp.status} (${contentType.split(';')[0]}).`,
      };
    }

    const data = await resp.json().catch(() => null);

    if (!resp.ok || !data?.success) {
      return {
        success: false,
        code: data?.code || `HTTP_${resp.status}`,
        error: data?.error || 'Failed to create order on Razorpay Test Mode gateway.',
      };
    }

    return {
      success: true,
      orderId: data.orderId,
      amount: data.amount,
      currency: data.currency || 'INR',
      keyId: data.keyId,
      receipt: data.receipt,
    };
  } catch (err: any) {
    console.error('[PaymentService] Error requesting order creation:', err);
    return {
      success: false,
      code: 'NETWORK_ERROR',
      error: 'Unable to connect to Razorpay payment backend.',
    };
  }
}

/**
 * Submits payment result to the secure Render backend for cryptographic signature verification.
 */
export async function verifyBackendRazorpayPayment(paymentData: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{
  success: boolean;
  verified: boolean;
  paymentId?: string;
  orderId?: string;
  signature?: string;
  message?: string;
  error?: string;
  code?: string;
}> {
  const endpoint = `${getApiBase()}/api/payments/verify`;

  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    const contentType = resp.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        success: false,
        verified: false,
        code: 'BACKEND_NOT_REACHABLE',
        error: `Render backend returned HTTP ${resp.status} during verification.`,
      };
    }

    const data = await resp.json().catch(() => null);

    if (!resp.ok || !data?.success || !data?.verified) {
      return {
        success: false,
        verified: false,
        code: data?.code || 'VERIFICATION_FAILED',
        error: data?.error || 'Payment signature verification failed on the server.',
      };
    }

    return {
      success: true,
      verified: true,
      paymentId: data.paymentId,
      orderId: data.orderId,
      signature: data.signature,
      message: data.message,
    };
  } catch (err: any) {
    console.error('[PaymentService] Network error during payment verification:', err);
    return {
      success: false,
      verified: false,
      code: 'NETWORK_ERROR',
      error: 'Network failure communicating with payment verification server.',
    };
  }
}

/**
 * Opens Razorpay Standard Checkout popup in Test Mode.
 */
export async function launchRazorpayStandardCheckout(options: {
  keyId: string;
  orderId: string;
  amount: number; // in paise
  currency?: string;
  productName: string;
  merchantName: string;
  userEmail?: string;
  userName?: string;
  transactionId: string;
  onSuccess: (result: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onFailure: (error: { code: string; description: string; step: string }) => void;
  onDismiss?: () => void;
}): Promise<void> {
  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded || !(window as any).Razorpay) {
    throw new Error('Razorpay Checkout SDK could not be loaded.');
  }

  const checkoutConfig = {
    key: options.keyId,
    amount: options.amount,
    currency: options.currency || 'INR',
    name: 'RazorGate AI Gateway',
    description: `${options.productName} · Test Mode`,
    image: 'https://razorgate-demo.web.app/favicon.svg',
    order_id: options.orderId,
    prefill: {
      name: options.userName || 'Autonomous Buyer',
      email: options.userEmail || 'buyer@razorgate.test',
      contact: '9999999999',
    },
    notes: {
      transactionId: options.transactionId,
      merchant: options.merchantName,
      mode: 'TEST_MODE',
    },
    theme: {
      color: '#2563eb',
    },
    handler: function (response: any) {
      options.onSuccess({
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
      });
    },
    modal: {
      ondismiss: function () {
        if (options.onDismiss) options.onDismiss();
      },
    },
  };

  const rzp = new (window as any).Razorpay(checkoutConfig);
  rzp.on('payment.failed', function (response: any) {
    options.onFailure({
      code: response?.error?.code || 'PAYMENT_FAILED',
      description: response?.error?.description || 'Payment was declined by the bank or gateway.',
      step: response?.error?.step || 'payment_authorization',
    });
  });

  rzp.open();
}
