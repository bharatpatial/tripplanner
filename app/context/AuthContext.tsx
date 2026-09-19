"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseAuth, firebaseConfigured, firestore } from "../lib/firebase";

type AuthContextValue = {
  user: User | null;
  authReady: boolean;
  configured: boolean;
  googleSignIn: () => Promise<void>;
  emailSignIn: (email: string, password: string) => Promise<void>;
  emailSignUp: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function saveUser(user: User) {
  await setDoc(
    doc(firestore, "users", user.uid),
    {
      uid: user.uid,
      name: user.displayName || "Explorer",
      email: user.email || "",
      photoURL: user.photoURL || "",
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const signingIn = useRef(false);

  useEffect(() => {
    if (!firebaseConfigured) {
      setAuthReady(true);
      return;
    }

    let active = true;

    void setPersistence(firebaseAuth, browserLocalPersistence).catch(
      (error) => console.error("Firebase persistence failed:", error),
    );

    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      async (nextUser) => {
        if (!active) return;

        setUser(nextUser);
        setAuthReady(true);

        if (nextUser) {
          try {
            await saveUser(nextUser);
          } catch (error) {
            console.error("Could not save the Firebase user profile:", error);
          }
        }
      },
      (error) => {
        console.error("Firebase authentication state failed:", error);
        if (active) setAuthReady(true);
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      authReady,
      configured: firebaseConfigured,
      googleSignIn: async () => {
        if (signingIn.current) return;
        signingIn.current = true;

        try {
          await setPersistence(firebaseAuth, browserLocalPersistence);
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: "select_account" });
          const result = await signInWithPopup(firebaseAuth, provider);
          await saveUser(result.user);
          setUser(result.user);
        } finally {
          signingIn.current = false;
        }
      },
      emailSignIn: async (email, password) => {
        const result = await signInWithEmailAndPassword(
          firebaseAuth,
          email,
          password,
        );
        await saveUser(result.user);
        setUser(result.user);
      },
      emailSignUp: async (name, email, password) => {
        const result = await createUserWithEmailAndPassword(
          firebaseAuth,
          email,
          password,
        );
        if (name.trim()) {
          await updateProfile(result.user, { displayName: name.trim() });
        }
        await saveUser(result.user);
        setUser(result.user);
      },
      logout: () => signOut(firebaseAuth),
    }),
    [authReady, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
