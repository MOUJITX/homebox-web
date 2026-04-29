import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router";
import {
  getToken,
  setToken as persistToken,
  clearToken,
  setSessionExpiredHandler,
} from "@/api/axios";
import { decodeToken } from "@/lib/jwt";
import { getProfile } from "@/api/profile";
import { AuthContext } from "./authContextValue";

const extractClaims = (token: string | null) => {
  if (!token) return { username: null, role: null };
  const payload = decodeToken(token);
  return {
    username: payload?.sub ?? null,
    role: payload?.role ?? null,
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(getToken);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const navigate = useNavigate();

  const { username, role } = extractClaims(token);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setToken(null);
      setDisplayName(null);
      setSessionExpired(true);
    });
    return () => {
      setSessionExpiredHandler(null);
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getProfile().then(
      (res) => {
        if (!cancelled) setDisplayName(res.data.displayName);
      },
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = useCallback((newToken: string) => {
    persistToken(newToken);
    setToken(newToken);
  }, []);

  const clearSession = useCallback(() => {
    clearToken();
    setToken(null);
    setDisplayName(null);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    navigate("/login", { replace: true });
  }, [clearSession, navigate]);

  const dismissSessionExpired = useCallback(() => {
    setSessionExpired(false);
    navigate("/login", { replace: true });
  }, [navigate]);

  const value = useMemo(
    () => ({
      token,
      username,
      displayName,
      role,
      sessionExpired,
      login,
      logout,
      clearSession,
      dismissSessionExpired,
    }),
    [
      token,
      username,
      displayName,
      role,
      sessionExpired,
      login,
      logout,
      clearSession,
      dismissSessionExpired,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
