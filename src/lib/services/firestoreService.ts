import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Policy, Transaction, AuditEvent, Product, ProductSearchRecord } from '../razorgate/types';
import { DEFAULT_POLICY } from '../razorgate/defaultPolicies';
import { SEED_TRANSACTIONS } from '../razorgate/seedTransactions';
import { INITIAL_AUDIT_LOGS } from '../razorgate/auditService';

// ─── User Profile ────────────────────────────────────────────────────────────

export interface FirestoreUserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: Timestamp | null;
  bootstrapped: boolean;
}

export async function getUserProfile(uid: string): Promise<FirestoreUserProfile | null> {
  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as FirestoreUserProfile) : null;
  } catch (err: any) {
    console.warn('[Firestore] getUserProfile non-fatal error:', err?.message || err);
    return null;
  }
}

export async function upsertUserProfile(uid: string, data: Partial<FirestoreUserProfile>) {
  try {
    const ref = doc(db, 'users', uid);
    await setDoc(ref, data, { merge: true });
  } catch (err: any) {
    console.warn('[Firestore] upsertUserProfile non-fatal error:', err?.message || err);
  }
}

// ─── Bootstrap (first login) ─────────────────────────────────────────────────

export async function bootstrapUserData(uid: string) {
  try {
    const batch = writeBatch(db);

    // Policy
    const policyRef = doc(db, 'users', uid, 'policies', 'default');
    batch.set(policyRef, { ...DEFAULT_POLICY, updatedAt: new Date().toISOString() });

    // Mark bootstrapped
    const userRef = doc(db, 'users', uid);
    batch.update(userRef, { bootstrapped: true });

    await batch.commit();

    // Seed transactions
    for (const tx of SEED_TRANSACTIONS) {
      await setDoc(doc(db, 'users', uid, 'transactions', tx.id), tx);
    }

    // Seed audit logs
    for (const log of INITIAL_AUDIT_LOGS) {
      await setDoc(doc(db, 'users', uid, 'auditLogs', log.id), log);
    }
  } catch (err: any) {
    console.warn('[Firestore] bootstrapUserData non-fatal notice:', err?.message || err);
  }
}

// ─── Policies ────────────────────────────────────────────────────────────────

export async function getPolicy(uid: string): Promise<Policy | null> {
  try {
    const ref = doc(db, 'users', uid, 'policies', 'default');
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as Policy) : null;
  } catch (err: any) {
    console.warn('[Firestore] getPolicy notice:', err?.message || err);
    return null;
  }
}

export async function updatePolicy(uid: string, policy: Policy) {
  try {
    const ref = doc(db, 'users', uid, 'policies', 'default');
    await setDoc(ref, policy, { merge: true });
  } catch (err: any) {
    console.warn('[Firestore] updatePolicy notice:', err?.message || err);
  }
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export function subscribeTransactions(
  uid: string,
  callback: (txs: Transaction[]) => void
): () => void {
  try {
    const ref = collection(db, 'users', uid, 'transactions');
    const q = query(ref, orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        const txs = snap.docs.map((d) => d.data() as Transaction);
        callback(txs);
      },
      (error) => {
        console.warn('[Firestore] subscribeTransactions listener notice:', error?.message || error);
      }
    );
  } catch (err: any) {
    console.warn('[Firestore] subscribeTransactions query init notice:', err?.message || err);
    return () => {};
  }
}

export async function addTransaction(uid: string, tx: Transaction) {
  try {
    await setDoc(doc(db, 'users', uid, 'transactions', tx.id), tx);
  } catch (err: any) {
    console.warn('[Firestore] addTransaction notice:', err?.message || err);
  }
}

export async function updateTransaction(uid: string, txId: string, patch: Partial<Transaction>) {
  try {
    const ref = doc(db, 'users', uid, 'transactions', txId);
    await updateDoc(ref, { ...patch, updatedAt: new Date().toISOString() });
  } catch (err: any) {
    console.warn('[Firestore] updateTransaction notice:', err?.message || err);
  }
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export function subscribeAuditLogs(
  uid: string,
  callback: (events: AuditEvent[]) => void
): () => void {
  try {
    const ref = collection(db, 'users', uid, 'auditLogs');
    const q = query(ref, orderBy('timestamp', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        const events = snap.docs.map((d) => d.data() as AuditEvent);
        callback(events);
      },
      (error) => {
        console.warn('[Firestore] subscribeAuditLogs listener notice:', error?.message || error);
      }
    );
  } catch (err: any) {
    console.warn('[Firestore] subscribeAuditLogs query init notice:', err?.message || err);
    return () => {};
  }
}

export async function addAuditLogToFirestore(uid: string, event: AuditEvent) {
  try {
    await setDoc(doc(db, 'users', uid, 'auditLogs', event.id), event);
  } catch (err: any) {
    console.warn('[Firestore] addAuditLogToFirestore notice:', err?.message || err);
  }
}

// ─── Discovered Product Catalog (User-Scoped) ──────────────────────────────

export async function saveDiscoveredProducts(uid: string, products: Product[]) {
  if (!uid || products.length === 0) return;
  try {
    const batch = writeBatch(db);
    for (const prod of products) {
      const ref = doc(db, 'users', uid, 'products', prod.id);
      batch.set(
        ref,
        {
          ...prod,
          source: prod.source || 'Google Shopping',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
    await batch.commit();
    console.log(`[Firestore] Saved ${products.length} discovered products to users/${uid}/products`);
  } catch (err: any) {
    console.warn('[Firestore] saveDiscoveredProducts notice:', err?.message || err);
  }
}

export function subscribeDiscoveredProducts(
  uid: string,
  callback: (products: Product[]) => void
): () => void {
  try {
    const ref = collection(db, 'users', uid, 'products');
    const q = query(ref, orderBy('updatedAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        const prods = snap.docs.map((d) => d.data() as Product);
        callback(prods);
      },
      (error) => {
        console.warn('[Firestore] subscribeDiscoveredProducts listener notice:', error?.message || error);
      }
    );
  } catch (err: any) {
    console.warn('[Firestore] subscribeDiscoveredProducts init notice:', err?.message || err);
    return () => {};
  }
}

export async function getDiscoveredProducts(uid: string): Promise<Product[]> {
  try {
    const ref = collection(db, 'users', uid, 'products');
    const q = query(ref, orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Product);
  } catch (err: any) {
    console.warn('[Firestore] getDiscoveredProducts notice:', err?.message || err);
    return [];
  }
}

// ─── Product Search History (User-Scoped) ───────────────────────────────────

export async function saveProductSearch(uid: string, searchRecord: ProductSearchRecord) {
  if (!uid) return;
  try {
    const ref = doc(db, 'users', uid, 'productSearches', searchRecord.id);
    await setDoc(ref, searchRecord);
  } catch (err: any) {
    console.warn('[Firestore] saveProductSearch notice:', err?.message || err);
  }
}
