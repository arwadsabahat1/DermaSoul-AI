import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, AUTH_REQUEST_TIMEOUT_MS, setStoredToken } from "../api/client";
import type { User } from "../types/models";
import { getApiErrorMessage } from "../lib/errors";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get<User>("/auth/me", { timeout: AUTH_REQUEST_TIMEOUT_MS });
      setUser(data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refreshUser();
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const { data } = await api.post<{ access_token: string }>(
          "/auth/login",
          {
            email,
            password,
          },
          { timeout: AUTH_REQUEST_TIMEOUT_MS },
        );
        setStoredToken(data.access_token);
        await refreshUser();
      } catch (e) {
        throw new Error(getApiErrorMessage(e, "Login failed."));
      }
    },
    [refreshUser],
  );

  const register = useCallback(
    async (email: string, password: string) => {
      try {
        await api.post<User>(
          "/auth/register",
          { email, password },
          { timeout: AUTH_REQUEST_TIMEOUT_MS },
        );
        await login(email, password);
      } catch (e) {
        throw new Error(getApiErrorMessage(e, "Registration failed."));
      }
    },
    [login],
  );

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      refreshUser,
      login,
      register,
      logout,
    }),
    [user, loading, refreshUser, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
