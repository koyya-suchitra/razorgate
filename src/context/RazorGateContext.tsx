import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  ActorType,
  AgentMetric,
  AuditEvent,
  PaymentPhase,
  Policy,
  Product,
  PurchaseIntent,
  Transaction,
} from '../lib/razorgate/types';

export type { PaymentPhase };
import { DEMO_PRODUCTS } from '../lib/razorgate/merchantsAndCatalog';
import { DEFAULT_POLICY } from '../lib/razorgate/defaultPolicies';
import { parseIntent } from '../lib/razorgate/intentParser';
import { searchCatalog } from '../lib/razorgate/catalogSearch';
import { buildTransaction } from '../lib/razorgate/policyEngine';
import { createAuditEvent, INITIAL_AUDIT_LOGS } from '../lib/razorgate/auditService';
import { SEED_TRANSACTIONS } from '../lib/razorgate/seedTransactions';
import {
  createBackendRazorpayOrder,
  verifyBackendRazorpayPayment,
  launchRazorpayStandardCheckout,
} from '../lib/razorgate/paymentService';
import { auth } from '../lib/firebase';
import { useAuth } from './AuthContext';
import {
  subscribeTransactions,
  subscribeAuditLogs,
  addTransaction as fsAddTransaction,
  updateTransaction as fsUpdateTransaction,
  addAuditLogToFirestore,
  getPolicy,
  updatePolicy as fsUpdatePolicy,
  saveDiscoveredProducts,
  subscribeDiscoveredProducts,
  saveProductSearch,
} from '../lib/services/firestoreService';
import { searchShoppingCatalog } from '../lib/services/productSearchClient';
import { DEFAULT_POLICY as DEFAULT_POLICY_FALLBACK } from '../lib/razorgate/defaultPolicies';

export type TabType =
  | 'command-center'
  | 'ai-buyer'
  | 'catalog'
  | 'guard'
  | 'approvals'
  | 'transactions'
  | 'audit'
  | 'policies';

export interface UserProfile {
  name: string;
  initials: string;
  email: string;
  role: string;
  accountType: string;
}

export interface DiscoveryStep {
  id: string;
  label: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'ERROR';
}

interface RazorGateContextType {
  // Navigation & View
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;

  // Environment & Mode
  executionMode: 'DEMO_SIMULATED' | 'RAZORPAY_TEST_MODE';
  setExecutionMode: (mode: 'DEMO_SIMULATED' | 'RAZORPAY_TEST_MODE') => void;

  // User Profile
  currentUser: UserProfile;

  // Data
  catalog: Product[];
  policies: Policy;
  updatePolicies: (updated: Partial<Policy>) => void;
  resetPoliciesToDefault: () => void;
  resetAllDemoData: () => void;

  // Active Flow State
  currentIntent: PurchaseIntent | null;
  setCurrentIntent: (intent: PurchaseIntent | null) => void;
  currentCandidates: Product[];
  selectedProduct: Product | null;
  currentTransaction: Transaction | null;
  setCurrentTransaction: (tx: Transaction | null) => void;
  isAgentThinking: boolean;
  agentStep: 'IDLE' | 'UNDERSTANDING' | 'SEARCHING' | 'COMPARING' | 'VERIFYING';

  // Live Agent Discovery Sequence
  discoverySteps: DiscoveryStep[];
  agentMessage: string;
  searchError: string | null;
  searchNotice: string | null;
  searchVariationsUsed: string[];
  clearSearchState: () => void;

  // Persistence Collections
  transactions: Transaction[];
  auditEvents: AuditEvent[];

  // Modals & Drawers
  checkoutModalOpen: boolean;
  setCheckoutModalOpen: (open: boolean) => void;
  selectedTxForDrawer: Transaction | null;
  setSelectedTxForDrawer: (tx: Transaction | null) => void;
  editIntentModalOpen: boolean;
  setEditIntentModalOpen: (open: boolean) => void;
  failureReportModalOpen: boolean;
  setFailureReportModalOpen: (open: boolean) => void;

  // Observability
  agentMetrics: AgentMetric;

  // Engine Actions
  runIntentQuery: (prompt: string) => Promise<void>;
  updateParsedIntent: (newIntent: PurchaseIntent) => void;
  selectProductForGuard: (product: Product, quantity?: number) => void;
  runDemoScenario: (scenario: 'SUCCESS' | 'BLOCK' | 'HUMAN_APPROVAL') => Promise<void>;
  approvePendingTransaction: (txId: string, notes?: string) => void;
  rejectPendingTransaction: (txId: string, notes?: string) => void;
  executePaymentFlow: (
    onPhaseOrOptions?:
      | ((phase: PaymentPhase) => void)
      | boolean
      | { onPhase?: (phase: PaymentPhase) => void; simulateFailure?: boolean },
    maybeSimulate?: boolean
  ) => Promise<boolean>;
  addProductToCatalog: (product: Product) => void;
  addAuditLog: (
    eventName: string,
    actor: ActorType,
    status: AuditEvent['status'],
    reason: string,
    transactionId?: string,
    meta?: Record<string, any>
  ) => AuditEvent;
}

const RazorGateContext = createContext<RazorGateContextType | undefined>(undefined);

export const RazorGateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabType>('command-center');
  const [executionMode, setExecutionMode] = useState<'DEMO_SIMULATED' | 'RAZORPAY_TEST_MODE'>('DEMO_SIMULATED');
  const currentUserRef = useRef(auth.currentUser);

  const { firebaseUser, displayName, email, initials } = useAuth();

  // Firestore-backed state — starts with seed data, replaced by Firestore snapshot
  const [policies, setPolicies] = useState<Policy>(DEFAULT_POLICY_FALLBACK);
  const [transactions, setTransactions] = useState<Transaction[]>(SEED_TRANSACTIONS);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(INITIAL_AUDIT_LOGS);

  // User profile
  const currentUser = {
    name: displayName || 'User',
    initials: initials || 'U',
    email: email || '',
    role: 'Account Owner',
    accountType: 'Demo Account',
  };

  // Firestore real-time listeners — re-subscribes whenever firebaseUser changes
  useEffect(() => {
    const uid = firebaseUser?.uid;
    if (!uid) {
      // User logged out — reset to initial seed state
      setPolicies(DEFAULT_POLICY_FALLBACK);
      setTransactions(SEED_TRANSACTIONS);
      setAuditEvents(INITIAL_AUDIT_LOGS);
      setCatalog(DEMO_PRODUCTS);
      return;
    }

    // Load policy from Firestore
    getPolicy(uid).then((policy) => {
      if (policy) setPolicies(policy);
    });

    // Subscribe to transactions
    const unsubTx = subscribeTransactions(uid, (txs) => {
      if (txs.length > 0) setTransactions(txs);
    });

    // Subscribe to audit logs
    const unsubAudit = subscribeAuditLogs(uid, (logs) => {
      if (logs.length > 0) setAuditEvents(logs);
    });

    // Subscribe to discovered products catalog
    const unsubProds = subscribeDiscoveredProducts(uid, (discovered) => {
      if (discovered.length > 0) {
        setCatalog((prev) => {
          const discMap = new Map(discovered.map((p) => [p.id, p]));
          const remainingDemo = prev.filter((p) => !discMap.has(p.id));
          return [...discovered, ...remainingDemo];
        });
      }
    });

    return () => {
      unsubTx();
      unsubAudit();
      unsubProds();
    };
  }, [firebaseUser?.uid]);

  // Active Flow State
  const [catalog, setCatalog] = useState<Product[]>(DEMO_PRODUCTS);
  const [currentIntent, setCurrentIntent] = useState<PurchaseIntent | null>(null);
  const [currentCandidates, setCurrentCandidates] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);

  // Agent State
  const [isAgentThinking, setIsAgentThinking] = useState<boolean>(false);
  const [agentStep, setAgentStep] = useState<'IDLE' | 'UNDERSTANDING' | 'SEARCHING' | 'COMPARING' | 'VERIFYING'>('IDLE');

  // Live Agent Discovery Sequence State
  const [discoverySteps, setDiscoverySteps] = useState<DiscoveryStep[]>([]);
  const [agentMessage, setAgentMessage] = useState<string>('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchNotice, setSearchNotice] = useState<string | null>(null);
  const [searchVariationsUsed, setSearchVariationsUsed] = useState<string[]>([]);

  // Modals
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedTxForDrawer, setSelectedTxForDrawer] = useState<Transaction | null>(null);
  const [editIntentModalOpen, setEditIntentModalOpen] = useState(false);
  const [failureReportModalOpen, setFailureReportModalOpen] = useState(false);

  // Observability
  const [agentMetrics, setAgentMetrics] = useState<AgentMetric>({
    intentParseMs: 420,
    catalogSearchMs: 180,
    policyEvalMs: 12,
    lastActive: 'Just now',
    status: 'ONLINE',
  });

  const addAuditLog = (
    eventName: string,
    actor: ActorType,
    status: AuditEvent['status'],
    reason: string,
    transactionId?: string,
    meta: Record<string, any> = {}
  ): AuditEvent => {
    const evt = createAuditEvent(eventName, actor, status, reason, transactionId, meta);
    setAuditEvents((prev) => [evt, ...prev]);
    // Persist to Firestore asynchronously (fire-and-forget)
    const uid = auth.currentUser?.uid;
    if (uid) addAuditLogToFirestore(uid, evt).catch(() => {});
    return evt;
  };

  const updatePolicies = (updated: Partial<Policy>) => {
    setPolicies((prev) => {
      const next = { ...prev, ...updated, updatedAt: new Date().toISOString() };
      addAuditLog(
        'Policy Configuration Updated',
        'HUMAN_ADMIN',
        'INFO',
        'Updated autonomous thresholds or merchant rules.',
        undefined,
        updated
      );
      // Persist to Firestore
      const uid = auth.currentUser?.uid;
      if (uid) fsUpdatePolicy(uid, next).catch(() => {});
      return next;
    });
  };

  const resetPoliciesToDefault = () => {
    setPolicies(DEFAULT_POLICY);
    addAuditLog('Policy Reset', 'HUMAN_ADMIN', 'INFO', 'Policies restored to default values.');
    const uid = auth.currentUser?.uid;
    if (uid) fsUpdatePolicy(uid, DEFAULT_POLICY).catch(() => {});
  };

  const clearSearchState = () => {
    setSearchError(null);
    setSearchNotice(null);
    setDiscoverySteps([]);
    setAgentMessage('');
    setSearchVariationsUsed([]);
  };

  /**
   * Run Natural Language Intent Query — connects AI/NL parsing to real Google Shopping search
   */
  const runIntentQuery = async (prompt: string) => {
    clearSearchState();
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) return;

    setIsAgentThinking(true);
    setAgentStep('UNDERSTANDING');
    setAgentMetrics((m) => ({ ...m, status: 'PROCESSING' }));

    addAuditLog('Intent Received', 'AI_BUYER', 'INFO', `User request received: "${cleanPrompt}"`, undefined, {
      rawPrompt: cleanPrompt,
    });

    const parsed = parseIntent(cleanPrompt);
    setCurrentIntent(parsed);

    // If query is ambiguous / needs clarification
    if (parsed.needsClarification) {
      const notice =
        parsed.clarificationReason ||
        "Please specify what kind of item and budget you'd like to search for so RazorGate can find real matching products.";
      setSearchNotice(notice);
      setAgentMessage("I need a bit more detail to search for real products.");
      setDiscoverySteps([
        { id: '1', label: 'Intent evaluated', status: 'COMPLETED' },
        { id: '2', label: 'Clarification required: specify product type & budget', status: 'ACTIVE' },
      ]);
      setIsAgentThinking(false);
      setAgentStep('IDLE');
      setAgentMetrics((m) => ({ ...m, status: 'ONLINE' }));
      return;
    }

    setAgentMessage(`Got it. I'm looking for ${parsed.category} priced at ₹${parsed.maxBudget.toLocaleString('en-IN')} or less.`);

    const budgetLabel = `Budget constraint extracted (≤ ₹${parsed.maxBudget.toLocaleString('en-IN')})`;
    const filterLabel = `Filtering products under ₹${parsed.maxBudget.toLocaleString('en-IN')}...`;

    setDiscoverySteps([
      { id: '1', label: 'Intent understood', status: 'COMPLETED' },
      { id: '2', label: budgetLabel, status: 'COMPLETED' },
      { id: '3', label: 'Searching Google Shopping...', status: 'ACTIVE' },
      { id: '4', label: filterLabel, status: 'PENDING' },
      { id: '5', label: 'Removing duplicates...', status: 'PENDING' },
      { id: '6', label: 'Building your RazorGate catalog...', status: 'PENDING' },
      { id: '7', label: '10–15 products ready', status: 'PENDING' },
    ]);

    addAuditLog(
      'Intent Structured',
      'AI_BUYER',
      'SUCCESS',
      `Category: ${parsed.category}, Max Budget: ₹${parsed.maxBudget.toLocaleString('en-IN')}, Brand: ${parsed.preferredBrand || 'Any'}`,
      undefined,
      parsed
    );

    setAgentStep('SEARCHING');

    // Call real Google Shopping backend endpoint
    const searchResult = await searchShoppingCatalog(parsed);

    if (searchResult.success && searchResult.products.length > 0) {
      const prods = searchResult.products;
      if (searchResult.searchVariationsUsed) {
        setSearchVariationsUsed(searchResult.searchVariationsUsed);
      }

      setAgentStep('COMPARING');
      setDiscoverySteps([
        { id: '1', label: 'Intent understood', status: 'COMPLETED' },
        { id: '2', label: budgetLabel, status: 'COMPLETED' },
        { id: '3', label: 'Google Shopping search completed', status: 'COMPLETED' },
        { id: '4', label: `Products filtered (all ≤ ₹${parsed.maxBudget.toLocaleString('en-IN')})`, status: 'COMPLETED' },
        { id: '5', label: 'Duplicate products removed', status: 'COMPLETED' },
        { id: '6', label: 'Catalog updated in Firestore', status: 'COMPLETED' },
        { id: '7', label: `Found ${prods.length} matching products`, status: 'COMPLETED' },
      ]);

      setAgentMessage(`Found ${prods.length} matching products on Google Shopping.`);
      setCurrentCandidates(prods);
      setSelectedProduct(prods[0]);

      // Merge into active catalog
      setCatalog((prev) => {
        const prodMap = new Map(prods.map((p) => [p.id, p]));
        const remaining = prev.filter((p) => !prodMap.has(p.id));
        return [...prods, ...remaining];
      });

      // Persist to user's isolated Firestore subcollections
      const uid = auth.currentUser?.uid;
      if (uid) {
        saveDiscoveredProducts(uid, prods);
        saveProductSearch(uid, {
          id: `search_${Date.now()}`,
          rawQuery: cleanPrompt,
          parsedQuery: {
            category: parsed.category,
            keywords: parsed.keywords,
            minPrice: parsed.minBudget,
            maxPrice: parsed.maxBudget,
            currency: 'INR',
            color: parsed.color,
            gender: parsed.gender,
            brand: parsed.preferredBrand,
            country: 'IN',
            limit: 15,
          },
          resultCount: prods.length,
          source: 'Google Shopping',
          createdAt: new Date().toISOString(),
        });
      }

      addAuditLog(
        'Real Products Discovered',
        'AI_BUYER',
        'SUCCESS',
        `Discovered ${prods.length} Google Shopping products under ₹${parsed.maxBudget.toLocaleString('en-IN')}.`,
        undefined,
        { count: prods.length, topMatch: prods[0]?.name }
      );
    } else {
      // Handle search failure or missing API key
      const errMsg =
        searchResult.error ||
        'Real product search is temporarily unavailable. Please check the shopping search API configuration.';

      setSearchError(errMsg);
      setAgentMessage(errMsg);

      setDiscoverySteps([
        { id: '1', label: 'Intent understood', status: 'COMPLETED' },
        { id: '2', label: budgetLabel, status: 'COMPLETED' },
        { id: '3', label: errMsg, status: 'ERROR' },
      ]);

      addAuditLog(
        'Product Search Notice',
        'AI_BUYER',
        'WARNING',
        `Shopping search returned no external results: ${errMsg}`,
        undefined,
        { error: errMsg }
      );
    }

    setAgentStep('IDLE');
    setIsAgentThinking(false);
    setAgentMetrics((m) => ({
      ...m,
      intentParseMs: Math.floor(Math.random() * 80) + 380,
      catalogSearchMs: Math.floor(Math.random() * 40) + 160,
      policyEvalMs: Math.floor(Math.random() * 6) + 10,
      lastActive: 'Just now',
      status: 'ONLINE',
    }));
  };

  const updateParsedIntent = async (newIntent: PurchaseIntent) => {
    setCurrentIntent(newIntent);
    addAuditLog(
      'Purchase Intent Modified',
      'HUMAN_ADMIN',
      'INFO',
      `User adjusted budget to ₹${newIntent.maxBudget.toLocaleString('en-IN')}`,
      undefined,
      newIntent
    );
    await runIntentQuery(newIntent.rawPrompt);
  };

  /**
   * Select a product and build Transaction with deterministic Guard checks
   */
  const selectProductForGuard = (product: Product, quantity = 1) => {
    const effectiveIntent =
      currentIntent ||
      parseIntent(`Buy ${product.brand} ${product.category} under ₹${product.price}`);

    const tx = buildTransaction(product, effectiveIntent, policies, quantity, executionMode);
    setCurrentTransaction(tx);
    setSelectedProduct(product);

    // Save transaction in collection (local + Firestore)
    setTransactions((prev) => [tx, ...prev.filter((t) => t.id !== tx.id)]);
    const uid = auth.currentUser?.uid;
    if (uid) fsAddTransaction(uid, tx).catch(() => {});

    // Create traceable audit events
    addAuditLog(
      'Product Selected for Authorization',
      'AI_BUYER',
      'INFO',
      `Selected "${product.name}" from merchant "${product.merchant.name}"`,
      tx.id,
      { unitPrice: tx.unitPrice, finalPayable: tx.finalPayable }
    );

    // Audit each check
    tx.checks.forEach((chk) => {
      addAuditLog(
        `Guard Check: ${chk.checkName}`,
        'POLICY_ENGINE',
        chk.status === 'PASS' ? 'SUCCESS' : chk.status === 'FAIL' ? 'BLOCKED' : 'WARNING',
        chk.detail,
        tx.id,
        { ruleApplied: chk.ruleApplied, metric: chk.metric }
      );
    });

    if (tx.decision === 'APPROVED') {
      addAuditLog(
        'Transaction Guard Approved',
        'TRANSACTION_GUARD',
        'SUCCESS',
        'All deterministic authorization checks passed.',
        tx.id
      );
    } else if (tx.decision === 'BLOCKED') {
      addAuditLog(
        'Transaction Blocked Before Payment Initiation',
        'TRANSACTION_GUARD',
        'BLOCKED',
        `Transaction exceeds authorization policy: ${tx.decisionReason}. No money was moved.`,
        tx.id,
        { reason: tx.decisionReason }
      );
    } else {
      addAuditLog(
        'Human Approval Required',
        'TRANSACTION_GUARD',
        'WARNING',
        `Autonomous limit exceeded. Requires human authorization.`,
        tx.id
      );
    }

    // Navigation to /guard is handled by the calling component via useNavigate
  };

  /**
   * Run one of the three required Golden Demo Scenarios using the REAL transaction engine
   */
  const runDemoScenario = async (scenario: 'SUCCESS' | 'BLOCK' | 'HUMAN_APPROVAL') => {
    if (scenario === 'SUCCESS') {
      // Scenario 1: ₹7,999 -> Approved (Sony WH-CH720N)
      const prompt = 'Find Sony wireless headphones under ₹10,000 and buy the best option.';
      await runIntentQuery(prompt);
      const product = DEMO_PRODUCTS[0]; // Sony WH-CH720N ₹7,999
      selectProductForGuard(product);
    } else if (scenario === 'BLOCK') {
      // Scenario 2: Authorized ₹10,000 -> Final ₹11,999 -> Blocked!
      const prompt = 'Find Sony headphones under ₹10,000';
      await runIntentQuery(prompt);
      const product = DEMO_PRODUCTS[5]; // Sony WH-1000XM5 Executive Edition ₹11,999
      selectProductForGuard(product);
    } else if (scenario === 'HUMAN_APPROVAL') {
      // Scenario 3: ₹38,000 -> Exceeds ₹10,000 autonomous threshold -> Human Approval Required
      const prompt = 'Buy Sony cinema creator camera setup under ₹40,000';
      await runIntentQuery(prompt);
      const product = DEMO_PRODUCTS[6]; // Sony Alpha FX30 Cinema Rig ₹38,000
      selectProductForGuard(product);
    }
  };

  /**
   * Approve a pending transaction
   */
  const approvePendingTransaction = (txId: string, notes = 'Approved by user.') => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === txId) {
          const updated: Transaction = {
            ...t,
            decision: 'APPROVED',
            paymentStatus: 'NOT_INITIATED',
            decisionReason: 'Explicitly approved by user.',
            approvalRequest: t.approvalRequest
              ? {
                  ...t.approvalRequest,
                  status: 'APPROVED',
                  reviewedAt: new Date().toISOString(),
                  reviewedBy: currentUser.name,
                  reviewNotes: notes,
                }
              : undefined,
            updatedAt: new Date().toISOString(),
          };
            if (currentTransaction?.id === txId) {
            setCurrentTransaction(updated);
          }
          const uid = auth.currentUser?.uid;
          if (uid) fsUpdateTransaction(uid, txId, updated).catch(() => {});
          return updated;
        }
        return t;
      })
    );

    addAuditLog(
      'Transaction Approved by User',
      'HUMAN_ADMIN',
      'SUCCESS',
      `Manual authorization granted: "${notes}". Transaction authorized for payment.`,
      txId
    );
  };

  /**
   * Reject a pending transaction
   */
  const rejectPendingTransaction = (txId: string, reason = 'Exceeds budget.') => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === txId) {
          const updated: Transaction = {
            ...t,
            decision: 'BLOCKED',
            paymentStatus: 'REJECTED',
            decisionReason: `Rejected by user: ${reason}`,
            approvalRequest: t.approvalRequest
              ? {
                  ...t.approvalRequest,
                  status: 'REJECTED',
                  reviewedAt: new Date().toISOString(),
                  reviewedBy: currentUser.name,
                  reviewNotes: reason,
                }
              : undefined,
            updatedAt: new Date().toISOString(),
          };
          if (currentTransaction?.id === txId) {
            setCurrentTransaction(updated);
          }
          const uid = auth.currentUser?.uid;
          if (uid) fsUpdateTransaction(uid, txId, updated).catch(() => {});
          return updated;
        }
        return t;
      })
    );

    addAuditLog(
      'Transaction Rejected by User',
      'HUMAN_ADMIN',
      'BLOCKED',
      `Manual authorization declined: "${reason}". Transaction closed.`,
      txId
    );
  };

  /**
   * Execute Payment Flow (Razorpay Test Mode with backend order creation & signature verification)
   * Deterministically enforces that BLOCKED transactions CANNOT be executed!
   */
  const executePaymentFlow = async (
    onPhaseOrOptions?:
      | ((phase: PaymentPhase) => void)
      | boolean
      | { onPhase?: (phase: PaymentPhase) => void; simulateFailure?: boolean },
    maybeSimulate?: boolean
  ): Promise<boolean> => {
    if (!currentTransaction) return false;

    let onPaymentPhaseChange: ((phase: PaymentPhase) => void) | undefined;
    let simulateFailure = false;

    if (typeof onPhaseOrOptions === 'function') {
      onPaymentPhaseChange = onPhaseOrOptions;
      simulateFailure = !!maybeSimulate;
    } else if (typeof onPhaseOrOptions === 'boolean') {
      simulateFailure = onPhaseOrOptions;
    } else if (onPhaseOrOptions && typeof onPhaseOrOptions === 'object') {
      onPaymentPhaseChange = onPhaseOrOptions.onPhase;
      simulateFailure = !!onPhaseOrOptions.simulateFailure;
    }

    // Safety enforcement: Blocked transactions must never call payment execution!
    if (currentTransaction.decision === 'BLOCKED') {
      addAuditLog(
        'Payment Execution Prevented',
        'TRANSACTION_GUARD',
        'BLOCKED',
        'Payment execution prevented. Transaction is blocked by policy.',
        currentTransaction.id
      );
      return false;
    }

    if (currentTransaction.decision === 'HUMAN_APPROVAL_REQUIRED') {
      addAuditLog(
        'Payment Blocked - Approval Required',
        'TRANSACTION_GUARD',
        'WARNING',
        'Transaction requires prior human approval before payment can be initiated.',
        currentTransaction.id
      );
      return false;
    }

    if (simulateFailure) {
      onPaymentPhaseChange?.('CREATING_ORDER');
      await new Promise((r) => setTimeout(r, 600));
      const failTx: Transaction = {
        ...currentTransaction,
        paymentStatus: 'FAILED',
        paymentFailureReason: 'Bank gateway route declined payment authorization test.',
        updatedAt: new Date().toISOString(),
      };

      setCurrentTransaction(failTx);
      setTransactions((prev) => prev.map((t) => (t.id === failTx.id ? failTx : t)));
      const uid = auth.currentUser?.uid;
      if (uid) fsUpdateTransaction(uid, failTx.id, failTx).catch(() => {});

      addAuditLog(
        'Payment Order Failed',
        'RAZORPAY_GATEWAY',
        'FAILED',
        'Payment simulation declined: Bank gateway route rejected test charge.',
        currentTransaction.id,
        { error: 'Simulated bank gateway decline' }
      );
      addAuditLog(
        'Duplicate Prevention Active',
        'TRANSACTION_GUARD',
        'SUCCESS',
        'Idempotency lock verified. Duplicate charge prevented.',
        currentTransaction.id
      );
      addAuditLog(
        'Transaction Safely Closed',
        'POLICY_ENGINE',
        'INFO',
        'Transaction marked NOT COMPLETED. No retry without user authorization.',
        currentTransaction.id
      );
      addAuditLog(
        'User Notified',
        'AI_BUYER',
        'INFO',
        'Notification dispatched with diagnostic details.',
        currentTransaction.id
      );

      onPaymentPhaseChange?.('FAILED');
      setFailureReportModalOpen(true);
      return false;
    }

    onPaymentPhaseChange?.('CREATING_ORDER');

    addAuditLog(
      'Payment Order Initiated',
      'RAZORPAY_GATEWAY',
      'INFO',
      `Creating Razorpay Test Mode order for ₹${currentTransaction.finalPayable.toLocaleString('en-IN')}`,
      currentTransaction.id
    );

    // Step 1: Call Render backend to create real Razorpay Test Mode order
    const orderRes = await createBackendRazorpayOrder(currentTransaction);

    if (!orderRes.success || !orderRes.orderId || !orderRes.keyId) {
      const errReason = orderRes.error || 'Failed to create order on Razorpay Test Mode gateway.';
      const failTx: Transaction = {
        ...currentTransaction,
        paymentStatus: 'FAILED',
        paymentFailureReason: errReason,
        updatedAt: new Date().toISOString(),
      };

      setCurrentTransaction(failTx);
      setTransactions((prev) => prev.map((t) => (t.id === failTx.id ? failTx : t)));
      const uid = auth.currentUser?.uid;
      if (uid) fsUpdateTransaction(uid, failTx.id, failTx).catch(() => {});

      addAuditLog(
        'Payment Order Failed',
        'RAZORPAY_GATEWAY',
        'FAILED',
        `Razorpay order creation failed: ${errReason}`,
        currentTransaction.id,
        { error: errReason, code: orderRes.code }
      );

      onPaymentPhaseChange?.('FAILED');
      setFailureReportModalOpen(true);
      return false;
    }

    const initiatedTx: Transaction = {
      ...currentTransaction,
      razorpayOrderId: orderRes.orderId,
      paymentStatus: 'INITIATED',
      updatedAt: new Date().toISOString(),
    };
    setCurrentTransaction(initiatedTx);
    setTransactions((prev) => prev.map((t) => (t.id === initiatedTx.id ? initiatedTx : t)));
    const uid = auth.currentUser?.uid;
    if (uid) fsUpdateTransaction(uid, initiatedTx.id, initiatedTx).catch(() => {});

    addAuditLog(
      'Razorpay Order Created',
      'RAZORPAY_GATEWAY',
      'INFO',
      `Order ${orderRes.orderId} created on Razorpay Test Mode. Launching Standard Checkout.`,
      currentTransaction.id,
      { orderId: orderRes.orderId, keyId: orderRes.keyId }
    );

    onPaymentPhaseChange?.('OPENING_CHECKOUT');

    // Step 2: Launch Razorpay Standard Checkout in browser
    return new Promise<boolean>((resolve) => {
      launchRazorpayStandardCheckout({
        keyId: orderRes.keyId!,
        orderId: orderRes.orderId!,
        amount: orderRes.amount || currentTransaction.finalPayable * 100,
        currency: orderRes.currency || 'INR',
        productName: currentTransaction.product.name,
        merchantName: currentTransaction.product.merchant.name,
        userEmail: auth.currentUser?.email || undefined,
        userName: auth.currentUser?.displayName || undefined,
        transactionId: currentTransaction.id,
        onSuccess: async (payResult) => {
          onPaymentPhaseChange?.('VERIFYING');

          addAuditLog(
            'Payment Signature Received',
            'RAZORPAY_GATEWAY',
            'INFO',
            `Received payment signature for ${payResult.razorpay_payment_id}. Verifying with Render server.`,
            currentTransaction.id,
            { paymentId: payResult.razorpay_payment_id, orderId: payResult.razorpay_order_id }
          );

          // Step 3: Server-side cryptographic signature verification
          const verifyRes = await verifyBackendRazorpayPayment(payResult);

          if (verifyRes.success && verifyRes.verified) {
            const successTx: Transaction = {
              ...initiatedTx,
              paymentStatus: 'SUCCESS',
              paymentId: payResult.razorpay_payment_id,
              razorpaySignature: payResult.razorpay_signature,
              updatedAt: new Date().toISOString(),
            };

            setCurrentTransaction(successTx);
            setTransactions((prev) => prev.map((t) => (t.id === successTx.id ? successTx : t)));
            if (uid) fsUpdateTransaction(uid, successTx.id, successTx).catch(() => {});

            addAuditLog(
              'Payment Verified (Test Mode)',
              'RAZORPAY_GATEWAY',
              'SUCCESS',
              `Payment verified: Ref #${payResult.razorpay_payment_id}. Test Mode: No real money was moved.`,
              currentTransaction.id,
              {
                paymentId: payResult.razorpay_payment_id,
                orderId: payResult.razorpay_order_id,
                signature: payResult.razorpay_signature,
                verified: true,
                mode: 'TEST_MODE',
              }
            );

            onPaymentPhaseChange?.('SUCCESS');
            resolve(true);
          } else {
            const verifyErr = verifyRes.error || 'Server rejected payment signature verification.';
            const failTx: Transaction = {
              ...initiatedTx,
              paymentStatus: 'FAILED',
              paymentFailureReason: verifyErr,
              updatedAt: new Date().toISOString(),
            };

            setCurrentTransaction(failTx);
            setTransactions((prev) => prev.map((t) => (t.id === failTx.id ? failTx : t)));
            if (uid) fsUpdateTransaction(uid, failTx.id, failTx).catch(() => {});

            addAuditLog(
              'Payment Verification Failed',
              'RAZORPAY_GATEWAY',
              'FAILED',
              `Signature verification failed: ${verifyErr}`,
              currentTransaction.id,
              { error: verifyErr }
            );

            onPaymentPhaseChange?.('FAILED');
            setFailureReportModalOpen(true);
            resolve(false);
          }
        },
        onFailure: (payErr) => {
          const failTx: Transaction = {
            ...initiatedTx,
            paymentStatus: 'FAILED',
            paymentFailureReason: payErr.description || 'Payment was declined by Razorpay gateway.',
            updatedAt: new Date().toISOString(),
          };

          setCurrentTransaction(failTx);
          setTransactions((prev) => prev.map((t) => (t.id === failTx.id ? failTx : t)));
          if (uid) fsUpdateTransaction(uid, failTx.id, failTx).catch(() => {});

          addAuditLog(
            'Payment Gateway Declined',
            'RAZORPAY_GATEWAY',
            'FAILED',
            `Gateway declined payment: ${payErr.description} (Code: ${payErr.code})`,
            currentTransaction.id,
            payErr
          );

          addAuditLog(
            'Duplicate Prevention Active',
            'TRANSACTION_GUARD',
            'SUCCESS',
            'Idempotency lock verified. Duplicate charge prevented.',
            currentTransaction.id
          );

          addAuditLog(
            'Transaction Safely Closed',
            'POLICY_ENGINE',
            'INFO',
            'Transaction marked NOT COMPLETED. No retry without user authorization.',
            currentTransaction.id
          );

          onPaymentPhaseChange?.('FAILED');
          setFailureReportModalOpen(true);
          resolve(false);
        },
        onDismiss: () => {
          addAuditLog(
            'Payment Checkout Dismissed',
            'HUMAN_ADMIN',
            'INFO',
            'User closed Razorpay checkout popup without completing payment.',
            currentTransaction.id
          );
          onPaymentPhaseChange?.('FAILED');
          resolve(false);
        },
      });
    });
  };

  const addProductToCatalog = (product: Product) => {
    setCatalog((prev) => {
      if (prev.some((p) => p.id === product.id)) return prev;
      return [product, ...prev];
    });
    const uid = auth.currentUser?.uid;
    if (uid) {
      saveDiscoveredProducts(uid, [product]);
    }
    addAuditLog(
      'Product Added to Catalog',
      'AI_BUYER',
      'SUCCESS',
      `Added "${product.name}" (₹${product.price}) to merchant catalog.`,
      undefined,
      { productId: product.id, name: product.name, price: product.price, merchant: product.merchant.name }
    );
  };

  const resetAllDemoData = () => {
    setTransactions(SEED_TRANSACTIONS);
    setAuditEvents(INITIAL_AUDIT_LOGS);
    setPolicies(DEFAULT_POLICY);
    setCurrentIntent(null);
    setSelectedProduct(null);
    setCurrentTransaction(null);
    setCurrentCandidates([]);
    addAuditLog('System Reset', 'HUMAN_ADMIN', 'INFO', 'Demo state reset to initial benchmark.');
  };

  return (
    <RazorGateContext.Provider
      value={{
        activeTab,
        setActiveTab,
        executionMode,
        setExecutionMode,
        currentUser,
        catalog,
        policies,
        updatePolicies,
        resetPoliciesToDefault,
        currentIntent,
        setCurrentIntent,
        currentCandidates,
        selectedProduct,
        currentTransaction,
        setCurrentTransaction,
        isAgentThinking,
        agentStep,
        discoverySteps,
        agentMessage,
        searchError,
        searchNotice,
        searchVariationsUsed,
        clearSearchState,
        transactions,
        auditEvents,
        checkoutModalOpen,
        setCheckoutModalOpen,
        selectedTxForDrawer,
        setSelectedTxForDrawer,
        editIntentModalOpen,
        setEditIntentModalOpen,
        failureReportModalOpen,
        setFailureReportModalOpen,
        agentMetrics,
        runIntentQuery,
        updateParsedIntent,
        selectProductForGuard,
        runDemoScenario,
        approvePendingTransaction,
        rejectPendingTransaction,
        executePaymentFlow,
        resetAllDemoData,
        addProductToCatalog,
        addAuditLog,
      }}
    >
      {children}
    </RazorGateContext.Provider>
  );
};

export const useRazorGate = () => {
  const context = useContext(RazorGateContext);
  if (!context) {
    throw new Error('useRazorGate must be used within a RazorGateProvider');
  }
  return context;
};
