import {
  IntentDrift,
  Policy,
  Product,
  PurchaseIntent,
  Transaction,
  TransactionCheck,
  TransactionDecision,
} from './types';
import { DEFAULT_PROHIBITED_CATEGORIES } from './defaultPolicies';

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

/**
 * Evaluates whether a product's category complies with enterprise risk policies.
 * Normal retail categories (e.g. bangles, clothing, shoes, watches, bags, cosmetics,
 * electronics, laptops, headphones, jewelry, etc.) are authorized by default.
 * Genuinely prohibited and high-risk categories are rejected using an explicit blocklist.
 */
export function evaluateCategoryPolicy(
  category: string,
  productName?: string,
  customBlocklist?: string[]
): { allowed: boolean; reason: string; matchedRule?: string } {
  const effectiveBlocklist =
    customBlocklist && customBlocklist.length > 0
      ? customBlocklist
      : DEFAULT_PROHIBITED_CATEGORIES;

  const catLower = (category || '').toLowerCase();
  const nameLower = (productName || '').toLowerCase();

  // Keyword patterns for high-risk prohibited items
  const prohibitedRules: { pattern: RegExp; label: string }[] = [
    { pattern: /\b(firearms?|weapons?|pistols?|rifles?|guns?|shotguns?)\b/i, label: 'Weapons & Firearms' },
    { pattern: /\b(ammunition|ammo|explosives?|grenades?|bombs?)\b/i, label: 'Ammunition & Explosives' },
    { pattern: /\b(narcotics?|illegal drugs?|cocaine|heroin|methamphetamine)\b/i, label: 'Illegal Drugs & Controlled Substances' },
    { pattern: /\b(pornograph(y|ic)|sexually explicit|adult content)\b/i, label: 'Adult & Explicit Content' },
    { pattern: /\b(cigarettes?|cigars?|e-cigarettes?|vapes?|vaping|nicotine)\b/i, label: 'Tobacco, Vaping & Nicotine' },
    { pattern: /\b(hazardous materials?|toxic chemicals?|biohazard|radioactive)\b/i, label: 'Hazardous & Toxic Chemicals' },
    { pattern: /\b(gambling|lottery tickets?|casino chips?|betting)\b/i, label: 'Gambling & Betting' },
    { pattern: /\b(counterfeit currency|stolen goods)\b/i, label: 'Counterfeit & Stolen Goods' },
  ];

  for (const { pattern, label } of prohibitedRules) {
    if (pattern.test(catLower) || pattern.test(nameLower)) {
      return {
        allowed: false,
        reason: `Category "${category}" contains prohibited items under risk governance (${label})`,
        matchedRule: label,
      };
    }
  }

  for (const blocked of effectiveBlocklist) {
    const bLower = blocked.toLowerCase().trim();
    if (!bLower) continue;
    const bClean = bLower.replace(/[^a-z0-9]/g, '');
    const cClean = catLower.replace(/[^a-z0-9]/g, '');
    if (cClean && bClean && (cClean.includes(bClean) || (bClean.length > 4 && cClean.length > 4 && bClean.includes(cClean)))) {
      return {
        allowed: false,
        reason: `Category "${category}" matches prohibited policy blocklist (${blocked})`,
        matchedRule: blocked,
      };
    }
  }

  return {
    allowed: true,
    reason: `Category "${category}" authorized under standard retail commerce policy`,
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
  const prodCatLower = (product.category || '').toLowerCase();
  const intentCatLower = (intent.category || '').toLowerCase();
  const prodNameLower = (product.name || '').toLowerCase();

  const categoryMatches =
    prodCatLower.includes(intentCatLower) ||
    intentCatLower.includes(prodCatLower) ||
    prodNameLower.includes(intentCatLower) ||
    (intent.keywords && intent.keywords.some((kw) => prodNameLower.includes(kw.toLowerCase())));

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
  // Enterprise Risk Governance: Normal retail categories are allowed by default.
  // Prohibited/high-risk categories are rejected using an explicit blocklist.
  const categoryEval = evaluateCategoryPolicy(
    product.category,
    product.name,
    policy.blockedCategories
  );
  const effectiveDailyLimit = Math.max(policy.dailySpendingLimit || 100000, intent.maxBudget);
  const withinDailyBudget = amounts.finalPayable <= effectiveDailyLimit;

  if (categoryEval.allowed && withinDailyBudget) {
    checks.push({
      id: 'chk_policy_rules',
      checkName: 'Policy',
      status: 'PASS',
      detail: `Category "${product.category}" authorized under retail policy and within daily spending limit (₹${effectiveDailyLimit.toLocaleString('en-IN')})`,
      ruleApplied: 'ENTERPRISE_COMMERCE_POLICY_RULES',
      metric: {
        expected: `≤ ₹${effectiveDailyLimit.toLocaleString('en-IN')}`,
        actual: `₹${amounts.finalPayable.toLocaleString('en-IN')}`,
      },
    });
  } else {
    checks.push({
      id: 'chk_policy_rules',
      checkName: 'Policy',
      status: 'FAIL',
      detail: !categoryEval.allowed
        ? categoryEval.reason
        : `Transaction ₹${amounts.finalPayable.toLocaleString('en-IN')} exceeds daily policy limit of ₹${effectiveDailyLimit.toLocaleString('en-IN')}`,
      ruleApplied: !categoryEval.allowed
        ? 'PROHIBITED_CATEGORY_POLICY_VIOLATION'
        : 'DAILY_SPENDING_CEILING_ENFORCEMENT',
      metric: {
        expected: categoryEval.allowed ? `≤ ₹${effectiveDailyLimit.toLocaleString('en-IN')}` : 'Permitted Retail Category',
        actual: !categoryEval.allowed ? product.category : `₹${amounts.finalPayable.toLocaleString('en-IN')}`,
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
