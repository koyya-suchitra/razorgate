import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';

export function handlePaymentApi(req: IncomingMessage, res: ServerResponse, next?: () => void) {
  const url = req.url?.split('?')[0];
  if (url !== '/api/payments/create-order' && url !== '/api/payments/verify') {
    if (next) return next();
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }

  const origin = req.headers.origin || 'https://razorgate-demo.web.app';

  // Preflight CORS
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.end(JSON.stringify({ success: false, error: 'Method Not Allowed. Use POST.' }));
    return;
  }

  let body = '';
  req.on('data', (chunk: any) => {
    body += chunk;
    if (body.length > 1e6) {
      res.statusCode = 413;
      res.end('Payload Too Large');
      req.destroy();
    }
  });

  req.on('end', async () => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    try {
      const data = JSON.parse(body || '{}');

      if (url === '/api/payments/create-order') {
        await handleCreateOrder(data, res);
      } else if (url === '/api/payments/verify') {
        await handleVerifyPayment(data, res);
      }
    } catch (err: any) {
      console.error('[PaymentApi] Parse error:', err);
      res.statusCode = 400;
      res.end(JSON.stringify({ success: false, error: 'Malformed JSON request body.' }));
    }
  });
}

async function handleCreateOrder(data: any, res: ServerResponse) {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    res.statusCode = 503;
    res.end(
      JSON.stringify({
        success: false,
        code: 'MISSING_RAZORPAY_KEYS',
        error:
          'Razorpay Test Mode credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are not configured on the server environment.',
      })
    );
    return;
  }

  const amount = Number(data.amount);
  if (!amount || isNaN(amount) || amount <= 0) {
    res.statusCode = 400;
    res.end(
      JSON.stringify({
        success: false,
        code: 'INVALID_AMOUNT',
        error: 'Invalid order amount specified. Must be a positive numeric value.',
      })
    );
    return;
  }

  // Razorpay amounts are in the smallest currency unit: paise for INR (1 INR = 100 paise)
  const amountInPaise = Math.round(amount * 100);
  const currency = (data.currency || 'INR').toUpperCase();
  const receipt = String(data.receipt || `rcpt_${Date.now()}`).substring(0, 40);
  const notes = typeof data.notes === 'object' && data.notes ? data.notes : {};

  try {
    const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
    const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency,
        receipt,
        notes: {
          ...notes,
          gateway: 'RazorGate Autonomous Control Plane',
          mode: 'RAZORPAY_TEST_MODE',
        },
      }),
    });

    const rzpData: any = await rzpResponse.json();

    if (!rzpResponse.ok || !rzpData.id) {
      console.error('[PaymentApi] Razorpay create order failed:', rzpResponse.status, rzpData);
      res.statusCode = rzpResponse.status >= 500 ? 502 : 400;
      res.end(
        JSON.stringify({
          success: false,
          code: 'RAZORPAY_ORDER_FAILED',
          error:
            rzpData?.error?.description ||
            'Failed to create order on Razorpay Test Mode Gateway.',
        })
      );
      return;
    }

    console.log(`[PaymentApi] Created Razorpay order ${rzpData.id} for amount ₹${amount}`);
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        success: true,
        orderId: rzpData.id,
        amount: rzpData.amount, // in paise
        currency: rzpData.currency,
        keyId, // Public Key ID only — Secret is NEVER returned
        receipt: rzpData.receipt,
      })
    );
  } catch (fetchErr: any) {
    console.error('[PaymentApi] Network error calling Razorpay API:', fetchErr);
    res.statusCode = 502;
    res.end(
      JSON.stringify({
        success: false,
        code: 'GATEWAY_NETWORK_ERROR',
        error: 'Unable to reach Razorpay API from server.',
      })
    );
  }
}

async function handleVerifyPayment(data: any, res: ServerResponse) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keySecret) {
    res.statusCode = 503;
    res.end(
      JSON.stringify({
        success: false,
        code: 'MISSING_RAZORPAY_SECRET',
        error: 'RAZORPAY_KEY_SECRET is not configured on the server.',
      })
    );
    return;
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.statusCode = 400;
    res.end(
      JSON.stringify({
        success: false,
        code: 'MISSING_VERIFICATION_FIELDS',
        error:
          'Missing required parameters: razorpay_order_id, razorpay_payment_id, and razorpay_signature.',
      })
    );
    return;
  }

  try {
    const textToSign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(textToSign)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const actualBuf = Buffer.from(String(razorpay_signature), 'utf8');

    const isValid =
      expectedBuf.length === actualBuf.length &&
      crypto.timingSafeEqual(expectedBuf, actualBuf);

    if (isValid) {
      console.log(
        `[PaymentApi] Signature VERIFIED for payment ${razorpay_payment_id} (order ${razorpay_order_id})`
      );
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          success: true,
          verified: true,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          signature: razorpay_signature,
          mode: 'RAZORPAY_TEST_MODE',
          message:
            'Payment verified successfully in Razorpay Test Mode. No real money was moved.',
        })
      );
    } else {
      console.warn(
        `[PaymentApi] Signature MISMATCH for order ${razorpay_order_id}, payment ${razorpay_payment_id}`
      );
      res.statusCode = 400;
      res.end(
        JSON.stringify({
          success: false,
          verified: false,
          code: 'SIGNATURE_VERIFICATION_FAILED',
          error: 'Razorpay payment signature verification failed.',
        })
      );
    }
  } catch (verifyErr: any) {
    console.error('[PaymentApi] Verification execution error:', verifyErr);
    res.statusCode = 400;
    res.end(
      JSON.stringify({
        success: false,
        verified: false,
        code: 'VERIFICATION_ERROR',
        error: 'Error evaluating cryptographic payment signature.',
      })
    );
  }
}
