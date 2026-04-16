import { ALLOWED_EMAILS, USERS } from "../constants";
import { auth, db, googleProvider } from "../lib/firebase";
import { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPopup,
} from "firebase/auth";

import type { AppUser } from "../types";
import type { ReactNode } from "react";
import type { User } from "firebase/auth";

const NOT_INVITED_ERROR = "NOT_INVITED";

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function isEmailAllowed(email: string): Promise<boolean> {
  const ref = doc(db, ALLOWED_EMAILS, email);
  const snap = await getDoc(ref);
  return snap.exists();
}

async function getOrCreateUserDoc(firebaseUser: User): Promise<AppUser | null> {
  const allowed = await isEmailAllowed(firebaseUser.email!);
  if (!allowed) {
    await firebaseSignOut(auth);
    throw new Error(NOT_INVITED_ERROR);
  }

  const ref = doc(db, USERS, firebaseUser.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const newUser: Omit<AppUser, "createdAt"> & { createdAt: unknown } = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName: firebaseUser.displayName ?? "Unknown",
      customDisplayName: null,
      isAdmin: false,
      createdAt: serverTimestamp(),
    };
    await setDoc(ref, newUser);
    return { ...newUser, createdAt: new Date() } as AppUser;
  }

  const data = snap.data();
  return {
    uid: data.uid,
    email: data.email,
    displayName: data.displayName,
    customDisplayName: data.customDisplayName ?? null,
    isAdmin: data.isAdmin ?? false,
    createdAt: data.createdAt?.toDate() ?? new Date(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let userDocUnsub: (() => void) | null = null;

    const authUnsub = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clean up any previous user doc listener
      if (userDocUnsub) {
        userDocUnsub();
        userDocUnsub = null;
      }

      if (firebaseUser) {
        try {
          const appUser = await getOrCreateUserDoc(firebaseUser);
          if (!appUser) {
            setCurrentUser(null);
            setLoading(false);
            return;
          }
          setCurrentUser(appUser);
          setAuthError(null);

          // Subscribe to the user doc for real-time updates (e.g. custom name changes)
          const { onSnapshot, doc: fsDoc } = await import("firebase/firestore");
          userDocUnsub = onSnapshot(
            fsDoc(db, USERS, firebaseUser.uid),
            (snap) => {
              if (snap.exists()) {
                const data = snap.data();
                setCurrentUser({
                  uid: data.uid,
                  email: data.email,
                  displayName: data.displayName,
                  customDisplayName: data.customDisplayName ?? null,
                  isAdmin: data.isAdmin ?? false,
                  createdAt: data.createdAt?.toDate() ?? new Date(),
                });
              }
            },
          );
        } catch (err: unknown) {
          if (err instanceof Error && err.message === NOT_INVITED_ERROR) {
            setAuthError(
              "Your account has not been invited to Ivy Books. Please contact the admin.",
            );
          }
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => {
      authUnsub();
      if (userDocUnsub) userDocUnsub();
    };
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      if (err instanceof Error && err.message !== NOT_INVITED_ERROR) {
        setAuthError("Sign in failed. Please try again.");
      }
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ currentUser, loading, signInWithGoogle, signOut }}
    >
      {authError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg">
          {authError}
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
