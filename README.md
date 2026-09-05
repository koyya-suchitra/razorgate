# RazorGate — AI Commerce Gateway

> **Where AI intent becomes trusted transactions.**  
> Built for the **Razorpay AI Buildathon — Track 01: AI Growth & Agentic Commerce**

---

## 🎯 The Core Idea

Autonomous AI agents are increasingly tasked with finding and buying products on behalf of consumers and businesses. However, giving AI unrestricted access to credit cards or payment credentials introduces catastrophic failure modes: hallucinated amounts, unauthorized budget overrun, hidden fee escalation, and gray-market merchant risk.

**RazorGate** is the AI-native commerce control layer. It makes merchants transactable by AI buyers while ensuring that AI cannot move money outside the user's authorized intent.

### Core Principle
> **"AI recommends. Policy controls. Humans approve sensitive actions. Razorpay executes. Audit records everything."**

### Pipeline
```text
HUMAN INTENT
    ↓
AI BUYER
    ↓
MERCHANT CATALOG
    ↓
INTENT VERIFICATION
    ↓
TRANSACTION GUARD
    ↓
POLICY GATE
    ↓
HUMAN APPROVAL (when required)
    ↓
RAZORPAY TEST EXECUTION
    ↓
TRACEABLE AUDIT TRAIL
```

---

## ⚡ Key Highlights & Features

1. **AI Buyer (Natural Language Commerce Interface)**
   - Translates free-form intent into structured parameters: `category`, `maxBudget`, `preferredBrand`, `quantity`, `merchantRequirement`, `paymentAuthorization`.
   - Programmatically queries registered merchant catalogs without exposing raw banking credentials.
   - Shows concise **Decision Factors** (never raw model chain-of-thought).

2. **Merchant Catalog (Structured AI-Ready Data)**
   - Standardized programmatic catalog format enabling AI agents to discover, verify, and transact with merchants.
   - Verified merchant trust scores (Croma, Reliance Digital, Vijay Sales, Sony Center Direct).
   - Built-in detection of unverified sellers.

3. **Transaction Guard (Signature Deterministic Engine)**
   - **Six Deterministic Checks**:
     1. `Intent Match` (Category & brand alignment)
     2. `Merchant Verification` (Verified merchant mandate)
     3. `Product Availability` (Stock reservation verification)
     4. `Budget Boundary` (Final payable ≤ Authorized ceiling)
     5. `Policy` (Category whitelist & daily limit compliance)
     6. `Payment Authorization` (Autonomous threshold check)
   - Resolves to:
     - `APPROVED`: Autonomous checkout unlocked.
     - `BLOCKED`: Strict boundary violation. **Payment was NOT initiated.**
     - `HUMAN APPROVAL REQUIRED`: Escalates to Human Gatekeeper.

4. **Intent Drift Detection**
   - Automatically flags when final checkout parameters deviate from original human intent (e.g., requested max ₹8,000, final payable ₹11,999).
   - Deterministically blocks payment before checkout.

5. **Approval Center**
   - Dedicated Human Gatekeeper dashboard for reviewing sensitive, high-value, or policy-escalated transactions.
   - Supervisor can approve with an audit note or reject, immediately updating state and immutable audit logs.

6. **Razorpay Test Checkout & Payment Simulation**
   - High-fidelity Razorpay test modal with UPI, Cards, and Netbanking.
   - Graceful failure recovery demo (Section 18):
     - `Payment initiated ✓`
     - `Payment failed ⚠`
     - `Duplicate prevention active ✓`
     - `Transaction safely closed ✓`
     - `Audit record created ✓`
     - `User notified ✓`
     - Status: `NOT COMPLETED` (Zero auto-retries without authorization).

7. **Traceable Audit Trail**
   - Timestamped provence log with millisecond precision (`10:42:04.120`).
   - Filters by transaction ID, actor (`AI_BUYER`, `POLICY_ENGINE`, `TRANSACTION_GUARD`, `HUMAN_ADMIN`, `RAZORPAY_GATEWAY`), and status.
   - Collapsible structured JSON telemetry payload inspection and one-click JSON export.

8. **Transaction Policies**
   - Interactive policy management: Autonomous Limit, Daily Spending Limit, Human Approval Threshold, Verified Merchant Requirement, and Category Whitelisting.
   - Synchronously enforced in the engine without model re-training.

---

## 🛠️ Architecture & Clean Modular Design

The business logic is strictly decoupled from the UI inside `src/lib/razorgate/`:

* `src/lib/razorgate/types.ts`: Comprehensive domain types (User, Merchant, Product, PurchaseIntent, Policy, Transaction, TransactionCheck, AuditEvent, etc.).
* `src/lib/razorgate/intentParser.ts`: Deterministic client-side NLP intent parser.
* `src/lib/razorgate/catalogSearch.ts`: Semantic scoring and candidate matching algorithm.
* `src/lib/razorgate/policyEngine.ts`: Deterministic policy evaluator, intent drift detector, and transaction factory.
* `src/lib/razorgate/paymentService.ts`: Razorpay order creation and payment simulator.
* `src/lib/razorgate/auditService.ts`: Immutable audit event factory and history store.
* `src/context/RazorGateContext.tsx`: Unified reactive state with automatic `localStorage` persistence.

---

## 🚀 Running Locally

```bash
# 1. Clone or navigate to the directory
cd C:\Users\suchi\.gemini\antigravity\scratch\razorgate

# 2. Install dependencies (if not already installed)
npm install

# 3. Start development server
npm run dev

# 4. Open in browser
http://127.0.0.1:5173/
```

Zero external API keys or credentials required to evaluate the full end-to-end prototype.
