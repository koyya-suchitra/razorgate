export type ActorType =
  | 'AI_BUYER'
  | 'POLICY_ENGINE'
  | 'TRANSACTION_GUARD'
  | 'HUMAN_ADMIN'
  | 'RAZORPAY_GATEWAY'
  | 'MERCHANT_API';

export type CheckStatus = 'PASS' | 'FAIL' | 'REVIEW';

export type TransactionDecision = 'APPROVED' | 'BLOCKED' | 'HUMAN_APPROVAL_REQUIRED';

export type PaymentStatus =
  | 'NOT_INITIATED'
  | 'PENDING_APPROVAL'
  | 'INITIATED'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'BLOCKED_PRE_PAYMENT'
  | 'REJECTED';

export type PaymentPhase =
  | 'IDLE'
  | 'CREATING_ORDER'
  | 'OPENING_CHECKOUT'
  | 'VERIFYING'
  | 'SUCCESS'
  | 'FAILED';

export interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar: string;
}

export interface Merchant {
  id: string;
  name: string;
  domain: string;
  verified: boolean;
  trustScore: number;
  rating: number;
  activeSince: string;
  catalogCount: number;
  razorpayMerchantId: string;
  returnPolicyDays: number;
  location: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  shippingCost: number;
  taxRate: number; // 0.18 for 18% GST or 0 if included
  taxAmount: number;
  stockQuantity: number;
  merchantId: string;
  merchant: Merchant;
  rating: number;
  reviewsCount: number;
  specs: Record<string, string>;
  description: string;
  aiReady: boolean;
  purchaseEnabled: boolean;
  imageUrl?: string;
  thumbnailUrl?: string;
  aiMatchScore?: number;
  recommendationReason?: string;
  decisionFactors?: string[];
  externalProductId?: string;
  currency?: string;
  merchantUrl?: string;
  productUrl?: string;
  sourceDomain?: string;
  delivery?: string;
  availability?: string;
  source?: string;
  searchQuery?: string;
  isLiveSearchResult?: boolean;
  isDiscovered?: boolean;
  discoveredBy?: string;
  discoveredAt?: string;
  matchReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductSearchRecord {
  id: string;
  rawQuery: string;
  parsedQuery: {
    category?: string;
    keywords?: string[];
    minPrice?: number;
    maxPrice?: number;
    currency?: string;
    color?: string;
    gender?: string;
    brand?: string;
    country?: string;
    limit?: number;
  };
  resultCount: number;
  source: string;
  createdAt: string;
}

export interface ParsedShoppingIntent {
  category: string;
  keywords: string[];
  minPrice?: number;
  maxPrice: number;
  currency: string;
  country: string;
  limit: number;
  color?: string;
  gender?: string;
  brand?: string;
  quantity: number;
  rawPrompt: string;
  needsClarification?: boolean;
  clarificationReason?: string;
}

export interface PurchaseIntent {
  rawPrompt: string;
  category: string;
  maxBudget: number;
  minBudget?: number;
  preferredBrand?: string;
  quantity: number;
  merchantRequirement: 'verified_only' | 'any';
  paymentAuthorization: 'autonomous_below_budget' | 'always_require_approval' | 'strict_budget';
  confidenceScore: number;
  parsedTimestamp: string;
  targetSpecs?: string[];
  color?: string;
  gender?: string;
  keywords?: string[];
  needsClarification?: boolean;
  clarificationReason?: string;
}

export interface Policy {
  id: string;
  name: string;
  autonomousLimit: number; // Default: ₹10,000
  dailySpendingLimit: number; // Default: ₹25,000
  humanApprovalThreshold: number; // Default: ₹10,000
  requireVerifiedMerchant: boolean; // Default: true
  allowedCategories: string[];
  blockedCategories?: string[];
  maxIntentDriftPercentage: number; // Default: 0% (strict budget)
  updatedAt: string;
}

export interface TransactionCheck {
  id: string;
  checkName:
    | 'Intent Match'
    | 'Merchant Verification'
    | 'Product Availability'
    | 'Budget Boundary'
    | 'Policy'
    | 'Payment Authorization';
  status: CheckStatus;
  detail: string;
  ruleApplied: string;
  metric?: {
    expected: string | number;
    actual: string | number;
  };
}

export interface IntentDrift {
  detected: boolean;
  originalBudget: number;
  finalPayable: number;
  difference: number;
  percentageDrift: number;
  driftType: 'BUDGET_OVERRUN' | 'SPEC_DEVIATION' | 'NONE';
  explanation: string;
}

export interface ApprovalRequest {
  id: string;
  transactionId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  reason: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface Transaction {
  id: string;
  intent: PurchaseIntent;
  product: Product;
  unitPrice: number;
  quantity: number;
  shippingAmount: number;
  taxAmount: number;
  finalPayable: number;
  authorizedMaximum: number;
  autonomousLimit: number;
  checks: TransactionCheck[];
  decision: TransactionDecision;
  decisionReason: string;
  decisionFactors: string[];
  intentDrift?: IntentDrift;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  createdAt: string;
  updatedAt: string;
  approvalRequest?: ApprovalRequest;
  paymentFailureReason?: string;
  executionMode: 'DEMO_SIMULATED' | 'RAZORPAY_TEST_MODE';
}

export interface AuditEvent {
  id: string;
  transactionId?: string;
  timestamp: string;
  timeLabel: string; // e.g. "10:42:04.120"
  eventName: string;
  actor: ActorType;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED' | 'WARNING' | 'INFO';
  reason: string;
  metadata: Record<string, any>;
}

export interface AgentMetric {
  intentParseMs: number;
  catalogSearchMs: number;
  policyEvalMs: number;
  lastActive: string;
  status: 'ONLINE' | 'PROCESSING' | 'STANDBY';
}
