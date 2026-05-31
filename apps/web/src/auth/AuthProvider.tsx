import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getToken,
  loginRequest,
  setToken,
  signupRequest,
  type AuthUser,
} from "../api/client.js";

interface AuthValue {
  user: AuthUser | null;
  isAuthed: boolean;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  // A persisted token (from a previous session) still authorizes posts even
  // before we know the user's email.
  const [hasToken, setHasToken] = useState<boolean>(() => getToken() !== null);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      isAuthed: user !== null || hasToken,
      signup: async (email, password) => {
        const r = await signupRequest(email, password);
        setToken(r.token);
        setUser(r.user);
        setHasToken(true);
      },
      login: async (email, password) => {
        const r = await loginRequest(email, password);
        setToken(r.token);
        setUser(r.user);
        setHasToken(true);
      },
      logout: () => {
        setToken(null);
        setUser(null);
        setHasToken(false);
      },
    }),
    [user, hasToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
