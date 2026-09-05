import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    // Development-safe logging with non-sensitive debugging metadata
    console.error('[Firebase Auth] Google Sign-In Failed:', {
      code: error?.code,
      message: error?.message,
      name: error?.name,
      customData: error?.customData,
      origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
      authDomain: auth.config?.authDomain,
    });
    throw error;
  }
}

export async function signInWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string
) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  return result.user;
}

export async function sendPasswordReset(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export type AuthActionContext = 'google' | 'email_signup' | 'email_signin' | 'password_reset';

export function getAuthErrorMessage(
  code: string,
  fallbackMessage?: string,
  context: AuthActionContext = 'email_signin'
): string {
  switch (code) {
    case 'auth/operation-not-allowed':
      if (context === 'email_signup' || context === 'email_signin') {
        return 'Email/password sign-up is currently disabled. Enable Email/Password in Firebase Authentication > Sign-in method.';
      }
      return 'Google Sign-In is currently disabled. Enable Google in Firebase Authentication > Sign-in method.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in or use a different email.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters with a combination of letters and numbers.';
    case 'auth/unauthorized-domain':
      return 'Domain Unauthorized: This domain is not in Firebase Authentication Authorized Domains. Please add "razorgate-demo.web.app" in Firebase Console > Authentication > Settings > Authorized Domains.';
    case 'auth/invalid-api-key':
      return 'Invalid API Key: The Firebase API key configured for this app is invalid or restricted.';
    case 'auth/app-not-authorized':
      return 'App Not Authorized: This application is not authorized to use Firebase Authentication with the provided API key.';
    case 'auth/popup-blocked':
      return 'Popup Blocked: Your browser blocked the Google sign-in window. Please allow popups for this site and try again.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in cancelled: The sign-in popup was closed before completing authentication.';
    case 'auth/cancelled-popup-request':
      return 'Only one sign-in window can be open at a time.';
    case 'auth/network-request-failed':
      return 'Network Error: Failed to connect to Firebase servers. Check your internet connection or ad-blocker.';
    case 'auth/invalid-oauth-client-id':
      return 'OAuth Configuration Error: The OAuth Client ID in Google Cloud / Firebase Console is invalid or misconfigured.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email using a different sign-in method.';
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Access temporarily blocked. Try again later.';
    default:
      if (code) {
        return `Authentication failed (${code}): ${fallbackMessage || 'Please verify your credentials.'}`;
      }
      return fallbackMessage || 'An unexpected error occurred. Please try again.';
  }
}
