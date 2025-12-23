import type { ReactNode } from 'react';
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

type Role = 'admin' | 'user';

type AppUser = {
  uid: string;
  email: string | null;
  role: Role;
};

type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const adminEmailList = (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Fetch role from Firestore users collection
        const userRef = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(userRef);

        const data = snap.data() as { role?: Role } | undefined;
        // Fallback: if doc missing but email in admin list, treat as admin
        const emailLower = (firebaseUser.email || '').toLowerCase();
        const derivedRole: Role =
          data?.role ?? (adminEmailList.includes(emailLower) ? 'admin' : 'user');

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: derivedRole,
        });
      } catch (err) {
        console.error('AuthProvider role fetch error:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}


