# RazorGate — AI Commerce Gateway

> **Where AI intent becomes trusted transactions.**

Built for the **Razorpay AI Buildathon — Track 01: AI Growth & Agentic Commerce**

RazorGate is an AI-native commerce control layer that allows AI agents to discover products and prepare purchases while ensuring that **AI cannot execute a transaction outside the user's authorized intent and policies**.

### Core Principle

> **AI recommends. Policy controls. Humans approve sensitive actions. Razorpay executes. Audit records everything.**

---

## 🎯 The Problem

AI agents are increasingly capable of searching for products, comparing offers, and initiating purchases on behalf of users.

But autonomous commerce introduces critical risks:

* AI selecting the wrong product
* Budget overruns
* Intent drift between the original request and checkout
* Unverified or risky merchants
* Unauthorized categories
* Excessive daily spending
* Payments being attempted without sufficient authorization
* Duplicate or repeated payment attempts
* Lack of traceability after a transaction

Traditional payment flows generally begin **after** a purchase decision has already been made.

RazorGate introduces a **policy and transaction-control layer before payment execution**.

---

# 💡 The Solution

RazorGate sits between **AI purchasing intent and payment execution**.

Instead of allowing an AI agent to directly initiate payment:

```text
Human Intent
     ↓
AI Buyer
     ↓
Live Product Discovery
     ↓
Intent Verification
     ↓
Transaction Guard
     ↓
Policy Gate
     ↓
Human Approval
     ↓
Razorpay Test Mode
     ↓
Cryptographic Verification
     ↓
Audit Trail
```

Every transaction must pass through deterministic controls before Razorpay checkout can be initiated.

---

# Key Features

## 1. 🤖 AI Buyer — Natural Language Commerce

Users describe what they want naturally:

> **"I want wireless headphones under ₹2,000 from a verified merchant."**

RazorGate converts the request into structured purchase intent:

```text
Category: headphones
Maximum Budget: ₹2,000
Currency: INR
Merchant Requirement: Verified
Quantity: 1
```

The AI Buyer then searches the live commerce catalog and presents relevant products.

### Important design principle

The system exposes **Decision Factors**, not private model chain-of-thought.

For example:

```text
✓ Within authorized budget
✓ Category matches intent
✓ Verified merchant
✓ Product available
✓ Payment authorization sufficient
```

---

# 2. 🛍️ Live Product Discovery

RazorGate supports real product discovery through a server-side shopping search service.

### Flow

```text
User Query
   ↓
Intent Parser
   ↓
Render Backend
   ↓
Google Shopping / SerpApi
   ↓
Filtering
   ↓
Deduplication
   ↓
Relevance Ranking
   ↓
Product Cards
```

The backend:

* searches Google Shopping
* applies numeric price constraints
* filters products against the requested budget
* deduplicates results
* ranks candidates by relevance
* returns normalized product data

The SerpApi credential remains **server-side** and is never bundled into the browser.

---

# 3. 🏪 Merchant Catalog

RazorGate maintains structured AI-ready merchant and product information.

The catalog supports:

* merchant verification
* product availability
* category information
* pricing
* ratings
* product metadata
* AI-readiness
* purchase eligibility

The system distinguishes between **verified merchants** and unverified sellers.

Example verified merchants include:

* Croma
* Reliance Digital
* Vijay Sales
* Sony Center Direct

This allows the policy engine to enforce:

> **Verified merchants only**

when the user's policy requires it.

---

# 4. 🛡️ Transaction Guard

The Transaction Guard is the central safety layer.

**Razorpay checkout cannot be initiated until the transaction has passed the required controls.**

RazorGate evaluates six deterministic checks:

### ① Intent Match

Does the selected product match the user's requested category and brand constraints?

### ② Merchant Verification

Does the merchant satisfy the user's merchant requirements?

### ③ Product Availability

Is the selected product available for purchase?

### ④ Budget Boundary

Is the **final payable amount** within the user's authorized budget?

```text
Final Payable ≤ Authorized Maximum
```

### ⑤ Policy Compliance

Does the transaction comply with:

* category whitelist
* daily spending limit
* merchant requirements
* other configured policies

### ⑥ Payment Authorization

Is autonomous payment permitted for this transaction?

---

## Transaction Decisions

The Guard produces one of three deterministic outcomes:

### 🟢 APPROVED

All required controls pass.

```text
Transaction Guard
        ↓
     APPROVED
        ↓
Razorpay Checkout
```

### 🔴 BLOCKED

A strict boundary has been violated.

```text
Transaction Guard
        ↓
      BLOCKED
        ↓
Payment NOT initiated
```

### 🟡 HUMAN APPROVAL REQUIRED

The transaction requires human authorization.

```text
Transaction Guard
        ↓
HUMAN APPROVAL REQUIRED
        ↓
Approval Center
        ↓
Approve / Reject
```

---

# 5. 📉 Intent Drift Detection

RazorGate compares the **original human intent** against the final transaction.

Example:

```text
Original intent:
"Buy headphones under ₹8,000"

Final transaction:
₹11,999
```

Result:

```text
❌ INTENT DRIFT DETECTED
❌ TRANSACTION BLOCKED
❌ RAZORPAY CHECKOUT NOT OPENED
```

This prevents an AI agent from silently changing the user's purchase parameters during execution.

---

# 6. 👤 Human Approval Center

Sensitive transactions are routed to a dedicated Human Gatekeeper workflow.

The supervisor can review:

* user intent
* selected product
* merchant
* price
* policy results
* transaction checks
* decision factors
* risk indicators

The supervisor can then:

```text
APPROVE
   or
REJECT
```

Every decision becomes part of the audit trail.

---

# 7. 💳 Razorpay Test Mode Execution

**Razorpay is the payment execution layer of RazorGate.**

The important architectural distinction is:

> **RazorGate decides whether a payment is allowed. Razorpay executes the authorized payment.**

Once Transaction Guard and required human approval succeed:

```text
APPROVED
   ↓
Create Razorpay Order
   ↓
Razorpay Test Checkout
   ↓
Test Payment
   ↓
Server Verification
   ↓
Transaction SUCCESS
```

RazorGate integrates with the **Razorpay Test Mode API**.

---

## 🔐 Server-Side Razorpay Order Creation

The frontend never receives the Razorpay secret.

The flow is:

```text
Frontend
   ↓
POST /api/payments/create-order
   ↓
Render Backend
   ↓
Razorpay Orders API
   ↓
Order ID
   ↓
Frontend Checkout
```

The Render backend securely reads:

```text
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
```

from environment variables.

The secret is never bundled into the frontend.

---

# 8. 🔏 Cryptographic Payment Verification

After checkout, Razorpay returns:

```text
razorpay_payment_id
razorpay_order_id
razorpay_signature
```

RazorGate sends these values to the backend.

The backend verifies the Razorpay signature using:

```text
HMAC-SHA256(
    keySecret,
    orderId + "|" + paymentId
)
```

The comparison uses a timing-safe verification mechanism.

Only after successful verification is the transaction marked:

```text
SUCCESS
```

---

# 9. 🧾 Traceable Audit Trail

Every important transaction event is recorded.

Example:

```text
10:42:04.120
AI_BUYER
Intent Created

10:42:04.185
TRANSACTION_GUARD
Budget Check PASSED

10:42:04.210
POLICY_ENGINE
Merchant Verification PASSED

10:42:04.350
RAZORPAY_GATEWAY
Order Created

10:42:16.910
RAZORPAY_GATEWAY
Payment Verified

10:42:16.930
AUDIT
Transaction SUCCESS
```

The Audit Trail supports:

* transaction ID filtering
* actor filtering
* status filtering
* timestamped events
* structured telemetry
* JSON inspection
* JSON export

---

# 10. ⚠️ Payment Failure & Recovery

RazorGate explicitly demonstrates safe failure handling.

If payment fails or the user dismisses checkout:

```text
Payment initiated ✓
        ↓
Payment failed ⚠
        ↓
Duplicate prevention active ✓
        ↓
Transaction safely closed ✓
        ↓
Audit record created ✓
        ↓
User notified ✓
        ↓
NOT COMPLETED
```

RazorGate does **not automatically retry a failed payment without authorization**.

---

# 11. ⚙️ Transaction Policies

Policies are configurable through the Policy Center.

Supported controls include:

* Autonomous Spending Limit
* Daily Spending Limit
* Human Approval Threshold
* Verified Merchant Requirement
* Category Whitelisting

Example:

```text
Autonomous Limit: ₹5,000
Daily Limit: ₹15,000
Human Approval Threshold: ₹5,000
Verified Merchant: Required
Allowed Categories:
  ✓ Electronics
  ✓ Books
  ✓ Clothing
```

Policies are evaluated synchronously by the transaction engine.

No model retraining is required when policies change.

---

# 🏗️ Architecture

```text
                    ┌─────────────────────┐
                    │      HUMAN USER     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      AI BUYER       │
                    │ Natural Language     │
                    │ Commerce Interface   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   INTENT PARSER     │
                    └──────────┬──────────┘
                               │
                               ▼
              ┌─────────────────────────────────┐
              │      PRODUCT DISCOVERY         │
              │                                 │
              │  Render → SerpApi → Shopping   │
              └────────────────┬────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  TRANSACTION GUARD  │
                    │                     │
                    │ Intent              │
                    │ Merchant            │
                    │ Availability        │
                    │ Budget              │
                    │ Policy              │
                    │ Payment Auth        │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                 BLOCKED              APPROVED
                    │                     │
                    ▼                     ▼
                  STOP             HUMAN APPROVAL
                                          │
                                   ┌──────┴──────┐
                                   │             │
                                REJECT        APPROVE
                                                  │
                                                  ▼
                                     ┌─────────────────────┐
                                     │ RAZORPAY TEST MODE  │
                                     │                     │
                                     │ Order Creation      │
                                     │ Checkout            │
                                     │ Payment             │
                                     └──────────┬──────────┘
                                                │
                                                ▼
                                     ┌─────────────────────┐
                                     │ SERVER VERIFICATION  │
                                     │ HMAC-SHA256          │
                                     └──────────┬──────────┘
                                                │
                                                ▼
                                     ┌─────────────────────┐
                                     │    AUDIT TRAIL      │
                                     └─────────────────────┘
```

---

# 🔐 Security Architecture

RazorGate follows a server-authoritative payment architecture.

### Secrets

The following credentials remain server-side:

```text
SERPAPI_API_KEY
RAZORPAY_KEY_SECRET
```

They are stored as Render environment variables.

They are **not exposed in the production JavaScript bundle**.

### Client receives only what it needs

For payment creation, the backend returns limited information such as:

```text
orderId
amount
currency
keyId
receipt
```

The Razorpay secret is never sent to the browser.

---

# 🧩 Project Structure

```text
src/
├── components/
│   ├── auth/
│   ├── common/
│   ├── layout/
│   ├── modals/
│   └── screens/
│
├── context/
│   ├── AuthContext.tsx
│   └── RazorGateContext.tsx
│
├── lib/
│   ├── razorgate/
│   │   ├── types.ts
│   │   ├── intentParser.ts
│   │   ├── catalogSearch.ts
│   │   ├── policyEngine.ts
│   │   ├── paymentService.ts
│   │   ├── auditService.ts
│   │   ├── defaultPolicies.ts
│   │   └── seedTransactions.ts
│   │
│   └── services/
│       └── productSearchClient.ts
│
└── server/
    ├── server.ts
    ├── productSearchService.ts
    └── paymentApiMiddleware.ts
```

---

# 🔌 API Architecture

## Product Search

```text
POST /api/products/search
```

The Render backend performs live product discovery.

## Payment Order Creation

```text
POST /api/payments/create-order
```

Creates a Razorpay order after authorization.

## Payment Verification

```text
POST /api/payments/verify
```

Performs server-side Razorpay signature verification.

## Health Check

```text
GET /healthz
```

Used to verify that the Render backend is operational.

---

# 🚀 Deployment Architecture

```text
                 USER
                   │
                   ▼
        Firebase Hosting
          RazorGate Frontend
                   │
                   │ HTTPS
                   ▼
        Render Node.js Backend
                   │
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
       SerpApi          Razorpay API
   Google Shopping       Test Mode
          │                 │
          └────────┬────────┘
                   ▼
                Firestore
             Audit / State
```

### Frontend

Firebase Hosting

### Backend

Render Node.js Web Service

### Product Discovery

SerpApi / Google Shopping

### Payment Execution

Razorpay Test Mode

### Persistence

Firebase Firestore

---

# 🧪 Test Mode

RazorGate currently uses **Razorpay Test Mode** for the payment demonstration.

Therefore:

> **No real money is moved.**

Successful payments are explicitly labelled:

```text
Razorpay Test Mode
No real money was moved
```

The demo is designed to demonstrate the complete authorization → execution → verification → audit lifecycle without processing real funds.

---

# 🔑 Environment Variables

For the Render backend:

```text
SERPAPI_API_KEY=...

RAZORPAY_KEY_ID=rzp_test_...

RAZORPAY_KEY_SECRET=...

PRODUCT_SEARCH_MODE=real
```

For the frontend, the Render API endpoint can be configured through:

```text
VITE_RENDER_API_URL=https://razorgate-product-search.onrender.com
```

**Never place `RAZORPAY_KEY_SECRET` or `SERPAPI_API_KEY` in frontend environment variables that are exposed to the browser.**

---

# 🚀 Running Locally

## 1. Clone the repository

```bash
git clone https://github.com/koyya-suchitra/razorgate.git
cd razorgate
```

## 2. Install dependencies

```bash
npm install
```

## 3. Start development

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:5173/
```

## 4. Build production bundle

```bash
npm run build
```

---

# ✅ Verification

The project has been verified across the major layers:

### Frontend

```text
✓ TypeScript compilation
✓ Vite production build
✓ Product discovery integration
✓ Transaction Guard
✓ Policy engine
✓ Approval workflow
✓ Payment UI
```

### Backend

```text
✓ Render deployment
✓ /healthz
✓ Product search API
✓ Razorpay order creation
✓ Razorpay payment verification
✓ Server-side secrets
```

### Security

```text
✓ Razorpay secret not exposed to client
✓ SerpApi key not bundled into frontend
✓ Payment signature verified server-side
✓ Payment blocked before checkout when authorization fails
```

---

# 🏆 Why RazorGate?

Most AI commerce systems focus on:

> **"Can an AI agent buy something?"**

RazorGate focuses on:

> **"Can an AI agent buy something safely, within exactly what the user authorized?"**

The system separates three responsibilities:

### AI

**Discovers and recommends.**

### RazorGate

**Verifies intent, enforces policy, controls authorization, and records decisions.**

### Razorpay

**Executes the authorized payment.**

This creates a clear trust boundary:

```text
AI ≠ Payment Authority
```

Instead:

```text
AI
 ↓
RazorGate
 ↓
Authorization
 ↓
Razorpay
```

---

# 🎬 Recommended Demo Flow

For the strongest buildathon demonstration:

### 1. Start with natural language

> "I want wireless headphones under ₹2,000."

### 2. Show live product discovery

Demonstrate that products come from the live shopping search.

### 3. Select a product

Show:

* price
* merchant
* rating
* availability

### 4. Open Transaction Guard

Show all six checks.

### 5. Demonstrate policy enforcement

Use a transaction that triggers:

```text
HUMAN APPROVAL REQUIRED
```

### 6. Approve through Approval Center

Show the human authorization event.

### 7. Launch Razorpay Test Mode

Complete the test payment.

### 8. Show verification

Demonstrate:

```text
Payment ID
Order ID
Signature verification
```

### 9. Finish in Audit Trail

Show the complete transaction timeline.

This demonstrates the **entire trust pipeline**, rather than merely showing a payment popup.

---

# 🧠 Core Architecture Principle

RazorGate is built around one fundamental separation:

```text
RECOMMENDATION
      ≠
AUTHORIZATION
      ≠
PAYMENT EXECUTION
```

The AI can recommend.

The policy engine decides whether the action is permitted.

Humans can authorize sensitive transactions.

Razorpay executes the authorized transaction.

The audit layer records what happened.

---

# 📌 Status

**RazorGate is a working AI commerce prototype with:**

* Natural-language purchasing
* Live product discovery
* Deterministic transaction controls
* Policy enforcement
* Intent drift detection
* Human approval workflows
* Razorpay Test Mode integration
* Server-side payment order creation
* Cryptographic payment verification
* Failure-safe payment handling
* Firestore-backed state and audit records
* Production frontend deployment
* Render backend deployment

---

## Built for

**Razorpay AI Buildathon 2026**

### Track 01 — AI Growth & Agentic Commerce

> **RazorGate — Where AI intent becomes trusted transactions.**
