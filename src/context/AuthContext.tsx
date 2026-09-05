import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  sendPasswordReset,
  signOut,
  getAuthErrorMessage,
} from '../lib/services/authService';
import {
  getUserProfile,
  upsertUserProfile,
  bootstrapUserData,
} from '../lib/services/firestoreService';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  authLoading: boolean;
  displayName: string;
  email: string;
  photoURL: string | null;
  initials: string;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Safety fallback: never allow auth loading to hang for more than 4 seconds
    const timeoutId = setTimeout(() => {
      setAuthLoading(false);
    }, 4000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearTimeout(timeoutId);
      setFirebaseUser(user);
      // Immediately mark authentication resolved — independent of Firestore network/rules
      setAuthLoading(false);

      if (user) {
        // Asynchronously initialize Firestore profile without blocking auth state
        try {
          const profile = await getUserProfile(user.uid);
          if (!profile) {
            await upsertUserProfile(user.uid, {
              uid: user.uid,
              displayName: user.displayName || 'RazorGate User',
              email: user.email || '',
              photoURL: user.photoURL || undefined,
              createdAt: null,
              bootstrapped: false,
            });
            await bootstrapUserData(user.uid);
          } else if (!profile.bootstrapped) {
            await bootstrapUserData(user.uid);
          }
        } catch (firestoreErr: any) {
          // Log Firestore profile error without breaking the user session
          console.warn('[Firestore] Profile initialization warning (non-fatal):', firestoreErr?.message || firestoreErr);
        }
      }
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    // 1. Google Authentication
    let user;
    try {
      user = await signInWithGoogle();
    } catch (err: any) {
      const friendlyMessage = getAuthErrorMessage(err?.code, err?.message, 'google');
      throw new Error(friendlyMessage);
    }

    // 2. Separate asynchronous profile initialization — never disguise Firestore failure as auth failure
    if (user) {
      try {
        const profile = await getUserProfile(user.uid);
        if (!profile) {
          await upsertUserProfile(user.uid, {
            uid: user.uid,
            displayName: user.displayName || 'RazorGate User',
            email: user.email || '',
            photoURL: user.photoURL || undefined,
            createdAt: null,
            bootstrapped: false,
          });
          await bootstrapUserData(user.uid);
        }
      } catch (firestoreErr: any) {
        console.warn('[Firestore] Profile creation notice:', firestoreErr?.message || firestoreErr);
        // Non-fatal: the user is authenticated in Firebase Auth and allowed into the app
      }
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmail(email, password);
    } catch (err: any) {
      throw new Error(getAuthErrorMessage(err?.code, err?.message, 'email_signin'));
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    let user;
    try {
      user = await registerWithEmail(email, password, displayName);
    } catch (err: any) {
      throw new Error(getAuthErrorMessage(err?.code, err?.message, 'email_signup'));
    }

    if (user) {
      try {
        await upsertUserProfile(user.uid, {
          uid: user.uid,
          displayName,
          email,
          bootstrapped: false,
          createdAt: null,
        });
        await bootstrapUserData(user.uid);
      } catch (firestoreErr: any) {
        console.warn('[Firestore] Register profile notice:', firestoreErr?.message || firestoreErr);
      }
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await sendPasswordReset(email);
    } catch (err: any) {
      throw new Error(getAuthErrorMessage(err?.code, err?.message, 'password_reset'));
    }
  };

  const logout = async () => {
    await signOut();
  };

  const displayName = firebaseUser?.displayName || 'User';
  const email = firebaseUser?.email || '';
  const photoURL = firebaseUser?.photoURL || null;
  const initials = getInitials(displayName);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        authLoading,
        displayName,
        email,
        photoURL,
        initials,
        loginWithGoogle,
        loginWithEmail,
        register,
        forgotPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
