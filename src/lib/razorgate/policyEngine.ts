import {
  IntentDrift,
  Policy,
  Product,
  PurchaseIntent,
  Transaction,
  TransactionCheck,
  TransactionDecision,
} from './types';

export function calculateFinalAmount(product: Product, quantity = 1): {
  unitPrice: number;
  quantity: number;
  shippingAmount: number;
  taxAmount: number;
  finalPayable: number;
} {
  const unitPrice = product.price;
  const shippingAmount = product.shippingCost;
  const taxAmount = product.taxAmount;
  const finalPayable = unitPrice * quantity + shippingAmount + taxAmount;

  return {
    unitPrice,
    quantity,
    shippingAmount,
    taxAmount,
    finalPayable,
  };
}

export function detectIntentDrift(intent: PurchaseIntent, finalPayable: number): IntentDrift {
  const diff = finalPayable - intent.maxBudget;
  const detected = diff > 0;
  const percentageDrift = detected ? Math.round((diff / intent.maxBudget) * 100) : 0;

  let explanation = 'Transaction is within the user-authorized intent parameters.';
  if (detected) {
    explanation = `The final transaction amount (₹${finalPayable.toLocaleString('en-IN')}) exceeds original user-authorized intent (₹${intent.maxBudget.toLocaleString('en-IN')}) by +₹${diff.toLocaleString('en-IN')} (+${percentageDrift}% drift).`;
  }

  return {
    detected,
    originalBudget: intent.maxBudget,
    finalPayable,
    difference: diff,
    percentageDrift,
    driftType: detected ? 'BUDGET_OVERRUN' : 'NONE',
    explanation,
  };
}

export function evaluateTransactionChecks(
  product: Product,
  intent: PurchaseIntent,
  policy: Policy,
  quantity = 1
): {
  checks: TransactionCheck[];
  decision: TransactionDecision;
  decisionReason: string;
  intentDrift: IntentDrift;
  amounts: ReturnType<typeof calculateFinalAmount>;
} {
  const amounts = calculateFinalAmount(product, quantity);
  const intentDrift = detectIntentDrift(intent, amounts.finalPayable);
  const checks: TransactionCheck[] = [];

  // Check 1: Intent Match
  const categoryMatches =
    product.category.toLowerCase().includes(intent.category.toLowerCase()) ||
    intent.category.toLowerCase().includes(product.category.toLowerCase());
  const brandMatches =
    !intent.preferredBrand ||
    product.brand.toLowerCase() === intent.preferredBrand.toLowerCase();

  if (categoryMatches && brandMatches) {
    checks.push({
      id: 'chk_intent_match',
      checkName: 'Intent Match',
      status: 'PASS',
      detail: `Matches category "${product.category}" and brand "${product.brand}"`,
      ruleApplied: 'INTENT_CATEGORY_BRAND_ALIGNMENT',
      metric: { expected: intent.category, actual: product.category },
    });
  } else if (categoryMatches && !brandMatches) {
    checks.push({
      id: 'chk_intent_match',
      checkName: 'Intent Match',
      status: 'PASS',
      detail: `Brand "${product.brand}" matches alternative tier for "${intent.category}"`,
      ruleApplied: 'INTENT_CATEGORY_RELAXED_BRAND',
      metric: { expected: intent.preferredBrand || 'Any', actual: product.brand },
    });
  } else {
    checks.push({
      id: 'chk_intent_match',
      checkName: 'Intent Match',
      status: 'FAIL',
      detail: `Product category "${product.category}" diverges from user intent "${intent.category}"`,
      ruleApplied: 'INTENT_SEMANTIC_DIVERGENCE',
      metric: { expected: intent.category, actual: product.category },
    });
  }

  // Check 2: Merchant Verification
  if (product.merchant.verified) {
    checks.push({
      id: 'chk_merchant_verif',
      checkName: 'Merchant Verification',
      status: 'PASS',
      detail: `Merchant "${product.merchant.name}" is verified (Trust Score: ${product.merchant.trustScore}/100)`,
      ruleApplied: 'POLICY_VERIFIED_MERCHANT_MANDATE',
      metric: { expected: 'Verified', actual: 'Verified' },
    });
  } else if (!policy.requireVerifiedMerchant) {
    checks.push({
      id: 'chk_merchant_verif',
      checkName: 'Merchant Verification',
      status: 'REVIEW',
      detail: `Merchant "${product.merchant.name}" is unverified, but policy allows bypass with manual review`,
      ruleApplied: 'POLICY_UNVERIFIED_MERCHANT_ALLOWANCE',
      metric: { expected: 'Optional', actual: 'Unverified' },
    });
  } else {
    checks.push({
      id: 'chk_merchant_verif',
      checkName: 'Merchant Verification',
      status: 'FAIL',
      detail: `Merchant "${product.merchant.name}" is unverified. Policy strictly prohibits unverified merchant settlement.`,
      ruleApplied: 'POLICY_VERIFIED_MERCHANT_MANDATE',
      metric: { expected: 'Verified', actual: 'Unverified' },
    });
  }

  // Check 3: Product Availability
  if (product.stockQuantity >= quantity) {
    checks.push({
      id: 'chk_stock_avail',
      checkName: 'Product Availability',
      status: 'PASS',
      detail: `In-stock verified (${product.stockQuantity} units available, requested: ${quantity})`,
      ruleApplied: 'INVENTORY_RESERVATION_VALID',
      metric: { expected: `${quantity} unit(s)`, actual: `${product.stockQuantity} available` },
    });
  } else {
    checks.push({
      id: 'chk_stock_avail',
      checkName: 'Product Availability',
      status: 'FAIL',
      detail: `Insufficient inventory: requested ${quantity}, available ${product.stockQuantity}`,
      ruleApplied: 'INVENTORY_STOCKOUT_PREVENTION',
      metric: { expected: `${quantity} unit(s)`, actual: `${product.stockQuantity} available` },
    });
  }

  // Check 4: Budget Boundary
  if (amounts.finalPayable <= intent.maxBudget) {
    checks.push({
      id: 'chk_budget_boundary',
      checkName: 'Budget Boundary',
      status: 'PASS',
      detail: `Final payable ₹${amounts.finalPayable.toLocaleString('en-IN')} is within authorized limit ₹${intent.maxBudget.toLocaleString('en-IN')}`,
      ruleApplied: 'USER_BUDGET_CEILING_ENFORCEMENT',
      metric: {
        expected: `≤ ₹${intent.maxBudget.toLocaleString('en-IN')}`,
        actual: `₹${amounts.finalPayable.toLocaleString('en-IN')}`,
      },
    });
  } else {
    const diff = amounts.finalPayable - intent.maxBudget;
    checks.push({
      id: 'chk_budget_boundary',
      checkName: 'Budget Boundary',
      status: 'FAIL',
      detail: `The final payable amount exceeds the user's authorized spending boundary by ₹${diff.toLocaleString('en-IN')}.`,
      ruleApplied: 'USER_BUDGET_CEILING_ENFORCEMENT',
      metric: {
        expected: `≤ ₹${intent.maxBudget.toLocaleString('en-IN')}`,
        actual: `₹${amounts.finalPayable.toLocaleString('en-IN')}`,
      },
    });
  }

  // Check 5: Policy
  const categoryAllowed =
    policy.allowedCategories.length === 0 ||
    policy.allowedCategories.includes(product.category);
  const withinDailyBudget = amounts.finalPayable <= policy.dailySpendingLimit;

  if (categoryAllowed && withinDailyBudget) {
    checks.push({
      id: 'chk_policy_rules',
      checkName: 'Policy',
      status: 'PASS',
      detail: `Category "${product.category}" authorized and within daily spending limit (₹${policy.dailySpendingLimit.toLocaleString('en-IN')})`,
      ruleApplied: 'ENTERPRISE_COMMERCE_POLICY_RULES',
      metric: {
        expected: `Limit ₹${policy.dailySpendingLimit.toLocaleString('en-IN')}`,
        actual: `₹${amounts.finalPayable.toLocaleString('en-IN')}`,
      },
    });
  } else {
    checks.push({
      id: 'chk_policy_rules',
      checkName: 'Policy',
      status: 'FAIL',
      detail: !categoryAllowed
        ? `Category "${product.category}" is not in whitelist (${policy.allowedCategories.join(', ')})`
        : `Transaction exceeds daily policy limit of ₹${policy.dailySpendingLimit.toLocaleString('en-IN')}`,
      ruleApplied: 'ENTERPRISE_COMMERCE_POLICY_RULES',
      metric: {
        expected: categoryAllowed ? `≤ ₹${policy.dailySpendingLimit}` : 'Whitelisted Category',
        actual: `₹${amounts.finalPayable.toLocaleString('en-IN')}`,
      },
    });
  }

  // Check 6: Payment Authorization
  if (amounts.finalPayable <= policy.autonomousLimit) {
    checks.push({
      id: 'chk_payment_auth',
      checkName: 'Payment Authorization',
      status: 'PASS',
      detail: `Autonomous settlement allowed below ₹${policy.autonomousLimit.toLocaleString('en-IN')}`,
      ruleApplied: 'AUTONOMOUS_LIMIT_GOVERNANCE',
      metric: {
        expected: `Autonomous ≤ ₹${policy.autonomousLimit.toLocaleString('en-IN')}`,
        actual: `₹${amounts.finalPayable.toLocaleString('en-IN')}`,
      },
    });
  } else {
    checks.push({
      id: 'chk_payment_auth',
      checkName: 'Payment Authorization',
      status: 'REVIEW',
      detail: `Transaction ₹${amounts.finalPayable.toLocaleString('en-IN')} exceeds autonomous authorization threshold of ₹${policy.autonomousLimit.toLocaleString('en-IN')}.`,
      ruleApplied: 'AUTONOMOUS_LIMIT_GOVERNANCE',
      metric: {
        expected: `Autonomous ≤ ₹${policy.autonomousLimit.toLocaleString('en-IN')}`,
        actual: `₹${amounts.finalPayable.toLocaleString('en-IN')}`,
      },
    });
  }

  // Determine final Decision
  const hasFail = checks.some((c) => c.status === 'FAIL');
  const hasReview = checks.some((c) => c.status === 'REVIEW');

  let decision: TransactionDecision = 'APPROVED';
  let decisionReason = 'All deterministic policy and boundary checks passed.';

  if (hasFail) {
    decision = 'BLOCKED';
    const failChecks = checks.filter((c) => c.status === 'FAIL');
    decisionReason = failChecks.map((c) => c.detail).join(' ');
  } else if (hasReview) {
    decision = 'HUMAN_APPROVAL_REQUIRED';
    decisionReason = 'The transaction exceeds the autonomous authorization threshold.';
  }

  return {
    checks,
    decision,
    decisionReason,
    intentDrift,
    amounts,
  };
}

export function buildTransaction(
  product: Product,
  intent: PurchaseIntent,
  policy: Policy,
  quantity = 1,
  executionMode: 'DEMO_SIMULATED' | 'RAZORPAY_TEST_MODE' = 'DEMO_SIMULATED'
): Transaction {
  const result = evaluateTransactionChecks(product, intent, policy, quantity);
  const now = new Date().toISOString();
  const txId = `tx_rzg_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString().slice(-4)}`;

  let paymentStatus: Transaction['paymentStatus'] = 'NOT_INITIATED';
  if (result.decision === 'BLOCKED') {
    paymentStatus = 'BLOCKED_PRE_PAYMENT';
  } else if (result.decision === 'HUMAN_APPROVAL_REQUIRED') {
    paymentStatus = 'PENDING_APPROVAL';
  }

  const approvalRequest =
    result.decision === 'HUMAN_APPROVAL_REQUIRED'
      ? {
          id: `appr_${Math.random().toString(36).substring(2, 8)}`,
          transactionId: txId,
          status: 'PENDING' as const,
          requestedAt: now,
          reason: result.decisionReason,
          riskLevel: result.amounts.finalPayable > 50000 ? ('HIGH' as const) : ('MEDIUM' as const),
        }
      : undefined;

  return {
    id: txId,
    intent,
    product,
    unitPrice: result.amounts.unitPrice,
    quantity: result.amounts.quantity,
    shippingAmount: result.amounts.shippingAmount,
    taxAmount: result.amounts.taxAmount,
    finalPayable: result.amounts.finalPayable,
    authorizedMaximum: intent.maxBudget,
    autonomousLimit: policy.autonomousLimit,
    checks: result.checks,
    decision: result.decision,
    decisionReason: result.decisionReason,
    decisionFactors: product.decisionFactors || [],
    intentDrift: result.intentDrift,
    paymentStatus,
    createdAt: now,
    updatedAt: now,
    approvalRequest,
    executionMode,
  };
}
